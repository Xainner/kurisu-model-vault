
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import { Search, Loader2, Download, Heart, Download as DownloadIcon, Calendar, Tag, AlertCircle, CheckCircle } from 'lucide-react';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setSuccess(null);
    try {
      const data = await api('/api/search', {
        method: 'POST',
        body: JSON.stringify({ query: query.trim() }),
      });
      setResults(data.results || []);
    } catch (e) {
      setError(e.message || 'Search failed');
    }
    setLoading(false);
  };

  const handleDownload = async (modelId) => {
    setDownloading(modelId);
    setError('');
    setSuccess(null);
    try {
      await api('/api/download', {
        method: 'POST',
        body: JSON.stringify({ model_id: modelId }),
      });
      setSuccess(modelId);
    } catch (e) {
      setError(e.message || 'Download failed');
    }
    setDownloading(null);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient">Search HuggingFace</h1>
        <p className="text-dark-muted mt-1">Find and download models from the HuggingFace Hub</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="glass rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search models... (e.g. llama, mistral, qwen)"
              className="w-full pl-12 pr-4 py-4 bg-dark-card border border-dark-border rounded-xl text-dark-text placeholder-dark-muted focus:outline-none focus:border-vault-500 input-glow text-lg"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || !query.trim()}
            className="px-8 py-4 bg-gradient-to-r from-vault-600 to-vault-500 text-white font-semibold rounded-xl shadow-lg shadow-vault-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            Search
          </motion.button>
        </div>
      </form>

      {/* Messages */}
      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </motion.div>
      )}
      {success && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          Started downloading: <code className="font-mono">{success}</code>
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence mode="wait">
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <p className="text-sm text-dark-muted">{results.length} results</p>
            {results.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="glass rounded-2xl p-5 hover:border-vault-500/30 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-lg font-mono text-vault-400 truncate">{r.id}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-dark-muted">
                      {r.author && <span>by {r.author}</span>}
                      {r.downloads && (
                        <span className="flex items-center gap-1">
                          <DownloadIcon className="w-3 h-3" />
                          {r.downloads.toLocaleString()}
                        </span>
                      )}
                      {r.likes && (
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {r.likes.toLocaleString()}
                        </span>
                      )}
                      {r.pipeline_tag && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-vault-500/10 text-vault-400 text-xs">
                          <Tag className="w-3 h-3" />
                          {r.pipeline_tag}
                        </span>
                      )}
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDownload(r.id)}
                    disabled={downloading === r.id}
                    className="px-4 py-2.5 bg-vault-600/20 border border-vault-500/30 text-vault-400 rounded-xl hover:bg-vault-600/30 transition-colors disabled:opacity-50 flex items-center gap-2 flex-shrink-0"
                  >
                    {downloading === r.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    {downloading === r.id ? 'Starting...' : 'Download'}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
