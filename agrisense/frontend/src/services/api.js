const BASE = '/api/v1';

let token = localStorage.getItem('token');

export function setToken(t) {
  token = t;
  if (t) localStorage.setItem('token', t);
  else localStorage.removeItem('token');
}

export function getToken() {
  return token;
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Auth
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  register: (username, password) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }),

  // Zones
  listZones: () => request('/zones'),
  getZone: (id) => request(`/zones/${id}`),
  createZone: (data) => request('/zones', { method: 'POST', body: JSON.stringify(data) }),
  getZoneStats: (id) => request(`/zones/${id}/stats`),

  // Sensors
  getSensor: (id) => request(`/sensors/${id}`),

  // Readings
  getReadings: (sensorId, since) =>
    request(`/readings/sensor/${sensorId}${since ? `?since=${since}` : ''}`),
  createReading: (sensorId, value) =>
    request(`/readings/sensor/${sensorId}`, {
      method: 'POST',
      body: JSON.stringify({ value }),
    }),

  // Rules
  listRules: () => request('/rules'),
  createRule: (data) => request('/rules', { method: 'POST', body: JSON.stringify(data) }),
  updateRule: (id, data) =>
    request(`/rules/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Alerts
  listAlerts: (unacknowledgedOnly = false) =>
    request(`/alerts${unacknowledgedOnly ? '?unacknowledged_only=true' : ''}`),
  acknowledgeAlert: (id) =>
    request(`/alerts/${id}`, { method: 'PATCH' }),
};
