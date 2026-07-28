
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import { Brain, Trash2, Shield, Download, Clock, AlertTriangle, CheckCircle, XCircle, Loader2, Search } from 'lucide-react';

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export default function Models() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [verifying, setVerifying] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [search, setSearch] = useState('');

  const fetchModels = async () => {
    try {
      const data = await api('/api/models');
      setModels(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchModels(); }, []);

  const handleDelete = async (name) => {
    if (!confirm(`Delete model "${name}"? This will remove all files from disk.`)) return;
    setDeleting(name);
    try {
      await api(`/api/models/${encodeURIComponent(name)}`, { method: 'DELETE' });
      setModels(m => m.filter(x => x.name !== name));
    } catch (e) { alert(e.message); }
    setDeleting(null);
  };

  const handleVerify = async (name) => {
    setVerifying(name);
    setVerifyResult(null);
    try {
      const data = await api('/api/models/verify', {
        method: 'POST',
        body: JSON.stringify({ model_name: name }),
      });
      setVerifyResult({ name, ...data });
    } catch (e) { alert(e.message); }
    setVerifying(null);
  };

  const filtered = models.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Models</h1>
          <p className="text-dark-muted mt-1">{models.length} models stored locally</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter models..."
            className="pl-10 pr-4 py-2 bg-dark-card border border-dark-border rounded-xl text-sm focus:outline-none focus:border-vault-500 input-glow w-64"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-vault-800 rounded-full animate-spin border-t-vault-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Brain className="w-16 h-16 mx-auto text-dark-muted opacity-30 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No models found</h3>
          <p className="text-dark-muted">Search and download models from HuggingFace to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence>
            {filtered.map((m, i) => (
              <motion.div
                key={m.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.03 }}
                className="glass rounded-2xl p-5 hover:border-vault-500/30 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-vault-600/30 to-vault-800/20 flex items-center justify-center flex-shrink-0">
                      <Brain className="w-6 h-6 text-vault-500" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-lg truncate">{m.name}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-dark-muted mt-1">
                        <span className="flex items-center gap-1">
                          <HardDriveIcon className="w-3 h-3" />
                          {formatBytes(m.size_bytes)}
                        </span>
                        <span>{m.files_count} files</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {m.downloaded_at ? new Date(m.downloaded_at).toLocaleDateString() : 'Unknown'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                          m.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {m.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleVerify(m.name)}
                      disabled={verifying === m.name}
                      className="p-2.5 rounded-xl bg-dark-card border border-dark-border hover:border-green-500/30 text-dark-muted hover:text-green-400 transition-colors disabled:opacity-50"
                      title="Verify integrity"
                    >
                      {verifying === m.name ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDelete(m.name)}
                      disabled={deleting === m.name}
                      className="p-2.5 rounded-xl bg-dark-card border border-dark-border hover:border-red-500/30 text-dark-muted hover:text-red-400 transition-colors disabled:opacity-50"
                      title="Delete model"
                    >
                      {deleting === m.name ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </motion.button>
                  </div>
                </div>

                {/* Verification result */}
                {verifyResult?.name === m.name && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className={`mt-4 p-4 rounded-xl border ${
                      verifyResult.valid
                        ? 'bg-green-500/5 border-green-500/20'
                        : 'bg-red-500/5 border-red-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {verifyResult.valid ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className={`font-semibold ${verifyResult.valid ? 'text-green-400' : 'text-red-400'}`}>
                        {verifyResult.valid ? 'Verification Passed' : 'Issues Found'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div><span className="text-dark-muted">Hash match:</span> {verifyResult.hash_match ? '✓' : '✗'}</div>
                      <div><span className="text-dark-muted">Local files:</span> {verifyResult.local_files_count}</div>
                      <div><span className="text-dark-muted">HF files:</span> {verifyResult.hf_files_count}</div>
                      <div><span className="text-dark-muted">Size:</span> {formatBytes(verifyResult.size_bytes)}</div>
                    </div>
                    {verifyResult.missing_from_disk?.length > 0 && (
                      <div className="mt-2 text-sm text-red-400">
                        Missing from disk: {verifyResult.missing_from_disk.length} files
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

function HardDriveIcon({ className }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12H2"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16"/><line x1="10" y1="16" x2="10.01" y2="16"/></svg>;
}
