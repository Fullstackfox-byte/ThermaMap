const API_BASE = '/api';

const TOKEN_KEY = 'auraUhiToken';
const USER_KEY = 'auraUhiUser';

export const auth = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (t) => localStorage.setItem(TOKEN_KEY, t),
  getUser: () => {
    try {
      const u = localStorage.getItem(USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },
  setUser: (u) => localStorage.setItem(USER_KEY, JSON.stringify(u)),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

function authHeaders(extra = {}) {
  const token = auth.getToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

async function handleResponse(res) {
  const contentType = res.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    const text = await res.text();
    data = { success: res.ok, error: text || `HTTP ${res.status}` };
  }
  if (!res.ok) {
    const errMsg = data?.error || data?.message || `Request failed (${res.status})`;
    const err = new Error(errMsg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  // Zones
  getZones: async () => {
    const res = await fetch(`${API_BASE}/zones`);
    return handleResponse(res);
  },
  getZone: async (code) => {
    const res = await fetch(`${API_BASE}/zones/${code}`);
    return handleResponse(res);
  },

  // Sensors
  getSensors: async () => {
    const res = await fetch(`${API_BASE}/sensors`);
    return handleResponse(res);
  },

  // Simulation
  evaluateMitigation: async (payload) => {
    const res = await fetch(`${API_BASE}/simulation/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },
  saveSimulation: async (payload) => {
    const res = await fetch(`${API_BASE}/simulation/save`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },
  getSimulationHistory: async () => {
    const res = await fetch(`${API_BASE}/simulation/history`);
    return handleResponse(res);
  },

  // Mitigation Projects
  getProjects: async () => {
    const res = await fetch(`${API_BASE}/mitigation/projects`);
    return handleResponse(res);
  },
  createProject: async (project) => {
    const res = await fetch(`${API_BASE}/mitigation/projects`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(project)
    });
    return handleResponse(res);
  },
  voteProject: async (id) => {
    const res = await fetch(`${API_BASE}/mitigation/projects/${id}/vote`, {
      method: 'POST'
    });
    return handleResponse(res);
  },
  updateProjectStatus: async (id, status) => {
    const res = await fetch(`${API_BASE}/mitigation/projects/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ status })
    });
    return handleResponse(res);
  },

  // Alerts
  getAlerts: async (activeOnly = false) => {
    const res = await fetch(`${API_BASE}/alerts${activeOnly ? '?active=true' : ''}`);
    return handleResponse(res);
  },
  resolveAlert: async (id) => {
    const res = await fetch(`${API_BASE}/alerts/${id}/resolve`, {
      method: 'PATCH',
      headers: authHeaders({ 'Content-Type': 'application/json' })
    });
    return handleResponse(res);
  },

  // Analytics
  getDiurnalData: async () => {
    const res = await fetch(`${API_BASE}/analytics/diurnal`);
    return handleResponse(res);
  },
  getCorrelations: async () => {
    const res = await fetch(`${API_BASE}/analytics/correlations`);
    return handleResponse(res);
  },
  getRankings: async () => {
    const res = await fetch(`${API_BASE}/analytics/rankings`);
    return handleResponse(res);
  },
  getSummary: async () => {
    const res = await fetch(`${API_BASE}/analytics/summary`);
    return handleResponse(res);
  },

  // AI / ML
  getAiModel: async () => {
    const res = await fetch(`${API_BASE}/ai/model`);
    return handleResponse(res);
  },
  getHotspots: async () => {
    const res = await fetch(`${API_BASE}/ai/hotspots`);
    return handleResponse(res);
  },
  getRecommendations: async (zoneCode) => {
    const q = zoneCode ? `?zone=${encodeURIComponent(zoneCode)}` : '';
    const res = await fetch(`${API_BASE}/ai/recommendations${q}`);
    return handleResponse(res);
  },
  predictLst: async (payload) => {
    const res = await fetch(`${API_BASE}/ai/predict-lst`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  // AI Chat Assistant
  sendChatMessage: async ({ message, focusZone }) => {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, focusZone })
    });
    return handleResponse(res);
  },

  // Auth
  register: async (payload) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await handleResponse(res);
    if (data.token) {
      auth.setToken(data.token);
      if (data.user) auth.setUser(data.user);
    }
    return data;
  },
  login: async (payload) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await handleResponse(res);
    if (data.token) {
      auth.setToken(data.token);
      if (data.user) auth.setUser(data.user);
    }
    return data;
  },
  me: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders() });
    return handleResponse(res);
  }
};
