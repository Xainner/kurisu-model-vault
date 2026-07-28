
import { useState, useEffect, useCallback } from 'react';
import { api, getToken, setToken, clearToken } from '../utils/api';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mustChange, setMustChange] = useState(false);

  const checkAuth = useCallback(async () => {
    const t = getToken();
    if (!t) { setLoading(false); return; }
    try {
      const data = await api('/api/me');
      setUser({ username: data.username });
      setMustChange(data.must_change_password);
    } catch {
      clearToken();
    }
    setLoading(false);
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);
  useEffect(() => {
    const handler = () => { clearToken(); setUser(null); setLoading(false); };
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, []);

  const login = async (username, password) => {
    const data = await api('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setToken(data.access_token);
    setUser({ username: data.username });
    setMustChange(data.must_change_password);
    return data;
  };

  const logout = () => {
    clearToken();
    setUser(null);
    setMustChange(false);
  };

  const changePassword = async (oldP, newP) => {
    await api('/api/change-password', {
      method: 'POST',
      body: JSON.stringify({ old_password: oldP, new_password: newP }),
    });
    setMustChange(false);
  };

  return { user, loading, mustChange, login, logout, changePassword };
}
