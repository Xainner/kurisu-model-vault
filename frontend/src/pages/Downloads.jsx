
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { Download, Loader2, CheckCircle, XCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export default function Downloads() {
  const [modelId, setModelId] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [active, setActive] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  const fetchDownloads = async () => {
    try {
      const [a, h] = await Promise.all([
        api('/api/downloads/active'),
        api('/api/downloads/history'),
      ]);
      setActive(a);
      setHistory(h);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchDownloads(); }, []);

  // WebSocket for real-time download events
  useWebSocket((msg) => {
    if (msg.type === 'download_complete' || msg.type === 'download_error') {
      fetchDownloads();
      if (msg.type === 'download_complete') {
        setDownloading(false);
      }
    }
  });

  const handleDownload = async () => {
    if (!modelId.trim()) return;
    setError('');
    setDownloading(true);
    try {
      await api('/api/download', {
        method: 'POST',
        body: JSON.stringify({ model_id: modelId.trim() }),
      });
      fetchDownloads();
      setModelId('');
    } catch (e) {
      setError(e.message || 'Download failed');
      setDownloading(false);
    }
  };

  const statusIcon = (status) => {
    switch (status) {
      case 'downloading': return <Loader2 className="w-5 h-5 animate-spin text-vault-500" />;
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-dark-muted" />;
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case 'downloading': return 'bg-vault-500/10 text-vault-400';
      case 'completed': return 'bg-green-500/10 text-green-400';
      case 'failed': return 'bg-red-500/10 text-red-400';
      default: return 'bg-dark-muted/10 text-dark-muted';
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gradient">Downloads</h1>
        <p className="text-dark-muted mt-1">Download and manage AI models from HuggingFace</p>
      </div>

      {/* Download Input */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Download className="w-5 h-5 text-vault-500" /> New Download
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
            placeholder="e.g. meta-llama/Llama-3.1-8B"
            className="flex-1 px-4 py-3 bg-dark-card border border-dark-border rounded-xl focus:outline-none focus:border-vault-500 input-glow font-mono text-sm"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownload}
            disabled={downloading || !modelId.trim()}
            className="px-6 py-3 bg-gradient-to-r from-vault-600 to-vault-500 text-white font-semibold rounded-xl shadow-lg shadow-vault-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {downloading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Download
              </>
            )}
          </motion.button>
        </div>
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}
        <p className="text-xs text-dark-muted mt-3">
          Enter a HuggingFace model ID (e.g., <code className="text-vault-400">meta-llama/Llama-3.1-8B</code>, <code className="text-vault-400">mistralai/Mistral-7B-v0.1</code>)
        </p>
      </div>

      {/* Active Downloads */}
      {active.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Loader2 className="w-5 h-5 text-vault-500 animate-spin" /> Active Downloads
          </h2>
          <div className="space-y-3">
            {active.map((d) => (
              <div key={d.id} className="p-4 rounded-xl bg-dark-card border border-vault-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium font-mono text-sm">{d.model_name}</span>
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${statusColor(d.status)}`}>
                    {d.status}
                  </span>
                </div>
                {d.current_file && (
                  <p className="text-xs text-dark-muted font-mono truncate">{d.current_file}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-vault-500" /> History
          </h2>
          <button onClick={fetchDownloads} className="p-2 rounded-lg hover:bg-dark-hover text-dark-muted hover:text-dark-text transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        {history.length === 0 ? (
          <div className="text-center py-8 text-dark-muted">
            <Download className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No downloads yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {history.map((d, i) => (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-dark-card border border-dark-border hover:border-dark-hover transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {statusIcon(d.status)}
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{d.model_name}</p>
                      <p className="text-xs text-dark-muted">
                        {d.started_at ? new Date(d.started_at).toLocaleString() : '—'}
                        {d.error && <span className="text-red-400 ml-2">— {d.error}</span>}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium flex-shrink-0 ml-4 ${statusColor(d.status)}`}>
                    {d.status}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
