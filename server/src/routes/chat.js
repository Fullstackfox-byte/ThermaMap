const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const dataStore = require('../db/dataStore');
const zoneMetrics = require('../services/zoneMetrics');

const MODEL = 'gemini-3.5-flash-lite';

const SYSTEM =
  'You are an authoritative urban heat island analyst and municipal climate resilience assistant for the AuraUHI platform. ' +
  'Answer concisely (under 150 words) using the live urban microclimate data provided. ' +
  'Use professional, direct language, explain thermal physics clearly when asked, and recommend evidence-based cooling interventions ' +
  '(such as high-albedo cool roofs, Miyawaki urban tree canopies, permeable pavements, and blue infrastructure).';

// Rate limiter for chat endpoint
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please wait a moment before asking again.' }
});

function maskKey(text, key) {
  if (!text || !key) return text;
  return text.replaceAll(key, '<API_KEY>');
}

router.post('/', chatLimiter, async (req, res) => {
  const key = (process.env.GEMINI_API_KEY || '').trim();
  if (!key) {
    return res.status(503).json({ success: false, error: 'GEMINI_API_KEY is not configured on the server.' });
  }

  const rawMessage = String(req.body?.message || '').trim();
  if (!rawMessage) {
    return res.status(400).json({ success: false, error: 'Message cannot be empty.' });
  }
  const message = rawMessage.slice(0, 500);

  // Authoritative server-side context generation (resilient to client prompt injection)
  const { cityMean, zones } = zoneMetrics.getEnrichedZones();
  const alerts = dataStore.getAlerts().filter(a => a.active);
  const projects = dataStore.getMitigationProjects();

  const authoritativeContext = {
    cityMeanSurfaceTemp: `${cityMean.toFixed(1)}°C`,
    activeAlertsCount: alerts.length,
    activeAlerts: alerts.map(a => `[${a.severity}] ${a.title} (${a.zoneCode})`),
    activeMitigationProjectsCount: projects.length,
    zones: zones.map(z => ({
      code: z.code,
      name: z.name,
      airTemp: `${z.currentTemp}°C`,
      surfaceTempLST: `${z.surfaceTemp}°C`,
      uhiDelta: `+${z.uhiIntensity}°C`,
      hviScore: z.hviScore,
      risk: z.riskCategory,
      canopy: `${z.treeCanopyCoverage}%`,
      albedo: z.albedo
    }))
  };

  // Optional client focus safely restricted
  let clientFocus = '';
  if (req.body?.focusZone && typeof req.body.focusZone === 'string') {
    const matched = zones.find(z => z.code === req.body.focusZone || z.name === req.body.focusZone);
    if (matched) {
      clientFocus = `\nUser is currently inspecting zone: ${matched.name} (${matched.code}), Surface Temp: ${matched.surfaceTemp}°C, UHI ΔT: +${matched.uhiIntensity}°C.`;
    }
  }

  const promptText = `Live Microclimate System Context:\n${JSON.stringify(authoritativeContext, null, 2)}${clientFocus}\n\nUser Question:\n${message}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`;

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: 'user', parts: [{ text: promptText }] }],
        generationConfig: {
          maxOutputTokens: 600,
          temperature: 0.4
        }
      })
    });

    if (!r.ok) {
      const rawBody = await r.text();
      const body = maskKey(rawBody, key).slice(0, 400);
      console.error(`[Chat] Gemini API error ${r.status}: ${body}`);
      if (r.status === 429) {
        return res.status(429).json({ success: false, error: 'AI quota exceeded. Please try again in a few moments.' });
      }
      if (r.status === 400 || r.status === 401 || r.status === 403) {
        return res.status(502).json({ success: false, error: 'Gemini API authentication failed. Verify server GEMINI_API_KEY.' });
      }
      return res.status(502).json({ success: false, error: 'AI service encountered an upstream issue.' });
    }

    const data = await r.json();
    const cand = data?.candidates?.[0];
    const reply = cand?.content?.parts?.map((p) => p.text || '').join('') || '';

    if (!reply) {
      return res.json({ success: true, reply: 'I reviewed the current microclimate data, but was unable to produce a specific advisory. Please try rephrasing.' });
    }

    res.json({ success: true, reply });
  } catch (err) {
    console.error('[Chat] Request error:', err.name, maskKey(err.message, key));
    res.status(502).json({ success: false, error: 'Unable to connect to AI microclimate service.' });
  }
});

module.exports = router;