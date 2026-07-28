
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../utils/api';
import { Settings as SettingsIcon, Key, Save, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function Settings() {
  const [hfToken, setHfToken] = useState('');
  const [hasToken, setHasToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    try {
      const data = await api('/api/hf-token/check');
      setHasToken(data.has_token);
    } catch (e) { console.error(e); }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await api('/api/hf-token', {
        method: 'POST',
        body: JSON.stringify({ token: hfToken }),
      });
      setHasToken(true);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e.message || 'Failed to save');
    }
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-gradient">Settings</h1>
        <p className="text-dark-muted mt-1">Configure your Kurisu Model Vault</p>
      </div>

      {/* HF Token */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Key className="w-5 h-5 text-vault-500" />
          HuggingFace Token
        </h2>
        <p className="text-sm text-dark-muted">
          Your HuggingFace token is required to download gated models. Get one from{' '}
          <a href="https://huggingface.co/settings/tokens" target="_blank" className="text-vault-400 hover:underline">
            huggingface.co/settings/tokens
          </a>
        </p>

        <div className="flex items-center gap-2 text-sm">
          {hasToken ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-green-400">Token configured</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span className="text-amber-400">No token configured</span>
            </>
          )}
        </div>

        <div className="relative">
          <input
            type={showToken ? 'text' : 'password'}
            value={hfToken}
            onChange={(e) => setHfToken(e.target.value)}
            placeholder="hf_..."
            className="w-full px-4 pr-12 py-3 bg-dark-card border border-dark-border rounded-xl font-mono text-sm focus:outline-none focus:border-vault-500 input-glow"
          />
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-muted hover:text-dark-text"
          >
            {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving || !hfToken.trim()}
            className="px-6 py-2.5 bg-gradient-to-r from-vault-600 to-vault-500 text-white font-semibold rounded-xl shadow-lg shadow-vault-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 rounded-full animate-spin border-t-white" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : 'Save Token'}
          </motion.button>

          {saved && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-400 text-sm flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> Saved!
            </motion.span>
          )}
          {error && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm">
              {error}
            </motion.span>
          )}
        </div>
      </div>

      {/* About */}
      <div className="glass rounded-2xl p-6 space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-vault-500" />
          About
        </h2>
        <div className="space-y-2 text-sm text-dark-muted">
          <div className="flex justify-between">
            <span>Version</span>
            <span className="text-dark-text font-mono">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>Backend</span>
            <span className="text-dark-text">FastAPI + Python 3.10</span>
          </div>
          <div className="flex justify-between">
            <span>Frontend</span>
            <span className="text-dark-text">React + Tailwind + Framer Motion</span>
          </div>
          <div className="flex justify-between">
            <span>Database</span>
            <span className="text-dark-text">SQLite</span>
          </div>
          <div className="flex justify-between">
            <span>Repository</span>
            <a href="https://github.com/Xainner/kurisu-model-vault" target="_blank" className="text-vault-400 hover:underline">
              github.com/Xainner/kurisu-model-vault
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
