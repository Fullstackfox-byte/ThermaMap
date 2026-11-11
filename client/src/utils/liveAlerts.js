// Live alert engine: Open-Meteo weather + air quality theke real threshold-based alert toiri kore.
const SEVERITY_ORDER = { Emergency: 0, Warning: 1, Advisory: 2 };
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const n1 = (v) => Number(v).toFixed(1);

export function buildLiveAlerts({ weather, aqi, location }) {
  const cur = weather?.current;
  if (!cur) return [];

  const place = location?.name || 'Current Location';
  const zoneCode = place.toUpperCase();
  const parsed = cur.time ? new Date(cur.time) : new Date();
  const triggeredAt = (Number.isNaN(parsed.getTime()) ? new Date() : parsed).toISOString();

  const out = [];
  const push = (rule, severity, title, description, advisories) => {
    out.push({
      id: `${rule}-${severity}-${zoneCode}`,
      severity,
      zoneCode,
      title,
      description,
      advisories,
      triggeredAt,
      active: true,
      source: 'Open-Meteo live'
    });
  };

  /* ---------- 1. Heat stress (feels-like temperature) ---------- */
  const air = cur.temperature_2m;
  const feels = isNum(cur.apparent_temperature) ? cur.apparent_temperature : air;
  const rh = cur.relative_humidity_2m;

  if (isNum(feels)) {
    const detail = `Feels-like temperature is ${n1(feels)}°C (air ${n1(air)}°C, humidity ${rh ?? '--'}%) in ${place}.`;

    if (feels >= 54) {
      push('heat', 'Emergency', 'Extreme Heat Danger Alert',
        `${detail} Heat stroke is highly likely with any outdoor exposure.`,
        [
          'Avoid all outdoor activity; stay in air-conditioned spaces',
          'Open public cooling centres and deploy mobile hydration units',
          'Check on elderly, children and outdoor workers immediately'
        ]);
    } else if (feels >= 41) {
      push('heat', 'Emergency', 'Dangerous Heat Stress Alert',
        `${detail} High risk of heat cramps, exhaustion and heat stroke.`,
        [
          'Suspend outdoor heavy labor during peak afternoon hours',
          'Drink water regularly and avoid direct sun',
          'Activate cooling centres and shaded public rest areas'
        ]);
    } else if (feels >= 32) {
      push('heat', 'Warning', 'Extreme Caution Heat Watch',
        `${detail} Prolonged exposure or activity may cause heat exhaustion.`,
        [
          'Limit strenuous outdoor activity between noon and 4 PM',
          'Keep hydrated and wear light, breathable clothing',
          'Public buildings advised to precool before peak hours'
        ]);
    } else if (feels >= 30) {
      push('heat', 'Advisory', 'Heat Caution Advisory',
        `${detail} Fatigue is possible with prolonged exposure.`,
        [
          'Take regular shade breaks during outdoor work',
          'Keep drinking water available'
        ]);
    }
  }

  /* ---------- 2. Heatwave forecast (next 3 days) ---------- */
  const maxes = (weather.daily?.temperature_2m_max || []).slice(0, 3).filter(isNum);
  if (maxes.length > 0) {
    const peak = Math.max(...maxes);
    if (peak >= 45) {
      push('heatwave', 'Emergency', 'Severe Heatwave Forecast',
        `Forecast daytime maximum reaches ${n1(peak)}°C within the next 3 days in ${place}.`,
        [
          'Prepare cooling centres and emergency water supply',
          'Reschedule outdoor events and construction shifts',
          'Issue public heatwave warnings in advance'
        ]);
    } else if (peak >= 40) {
      push('heatwave', 'Warning', 'Heatwave Forecast',
        `Forecast daytime maximum reaches ${n1(peak)}°C within the next 3 days in ${place}.`,
        [
          'Plan outdoor work for early morning or evening',
          'Stock hydration points at public places'
        ]);
    }
  }

  /* ---------- 3. Tropical night / night-time heat retention ---------- */
  const nightMin = weather.daily?.temperature_2m_min?.[0];
  if (isNum(nightMin) && nightMin >= 25) {
    push('night', 'Warning', 'Tropical Night Heat Retention Watch',
      `Tonight's minimum temperature is forecast at ${n1(nightMin)}°C in ${place}. Concrete and asphalt will release stored heat, limiting overnight recovery.`,
      [
        'Ventilate or cool bedrooms; check on vulnerable residents',
        'Keep night-time cooling centres open if available'
      ]);
  }

  /* ---------- 4. UV radiation ---------- */
  const uv = cur.uv_index;
  if (isNum(uv)) {
    if (uv >= 11) {
      push('uv', 'Emergency', 'Extreme UV Radiation Alert',
        `Current UV index is ${n1(uv)} (extreme) in ${place}. Unprotected skin can burn in minutes.`,
        ['Avoid direct sun; seek shade', 'Use SPF 50+, hat and sunglasses']);
    } else if (uv >= 8) {
      push('uv', 'Warning', 'Very High UV Warning',
        `Current UV index is ${n1(uv)} (very high) in ${place}.`,
        ['Minimize midday sun exposure', 'Use sunscreen, hat and sunglasses']);
    } else if (uv >= 6) {
      push('uv', 'Advisory', 'High UV Advisory',
        `Current UV index is ${n1(uv)} (high) in ${place}.`,
        ['Use sunscreen and seek shade around midday']);
    }
  }

  /* ---------- 5. Air quality (US AQI) ---------- */
  if (aqi?.live && isNum(aqi.aqi)) {
    const pm = isNum(aqi.pm25) ? ` PM2.5 is ${n1(aqi.pm25)} µg/m³.` : '';
    if (aqi.aqi >= 201) {
      push('aqi', 'Emergency', 'Very Unhealthy Air Quality Alert',
        `US AQI is ${Math.round(aqi.aqi)} in ${place}.${pm} Everyone may experience serious health effects.`,
        ['Stay indoors with windows closed', 'Wear N95 masks if going outside', 'Suspend outdoor sports and school activities']);
    } else if (aqi.aqi >= 151) {
      push('aqi', 'Warning', 'Unhealthy Air Quality Warning',
        `US AQI is ${Math.round(aqi.aqi)} in ${place}.${pm} Everyone may begin to experience health effects.`,
        ['Reduce prolonged outdoor exertion', 'Sensitive groups should stay indoors', 'Use air purifiers where available']);
    } else if (aqi.aqi >= 101) {
      push('aqi', 'Advisory', 'Air Quality Advisory (Sensitive Groups)',
        `US AQI is ${Math.round(aqi.aqi)} in ${place}.${pm}`,
        ['Children, elderly and people with asthma should limit outdoor activity']);
    }
  }

  return out.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}