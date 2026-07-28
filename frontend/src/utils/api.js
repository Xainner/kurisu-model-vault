
const API_BASE = import.meta.env.VITE_API_URL || '';
let token = localStorage.getItem('kurisu_token');

export function getToken() {
  return token;
}

export function setToken(t) {
  token = t;
  localStorage.setItem('kurisu_token', t);
}

export function clearToken() {
  token = null;
  localStorage.removeItem('kurisu_token');
}

export async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new CustomEvent('auth:expired'));
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.detail || data?.error || res.statusText);
  return data;
}

// WebSocket
let ws = null;
let wsReconnectTimer = null;

export function connectWS(onMessage) {
  if (ws) ws.close();
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = import.meta.env.VITE_WS_URL || window.location.host;
  ws = new WebSocket(`${proto}//${host}/ws`);
  ws.onmessage = (e) => {
    try { onMessage(JSON.parse(e.data)); } catch {}
  };
  ws.onclose = () => {
    wsReconnectTimer = setTimeout(() => {
      if (token) connectWS(onMessage);
    }, 3000);
  };
  return ws;
}

export function disconnectWS() {
  if (ws) ws.close();
  if (wsReconnectTimer) clearTimeout(wsReconnectTimer);
  ws = null;
}
