
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../utils/api';
import { useWebSocket } from '../hooks/useWebSocket';
import {
  Brain, HardDrive, Package, Download, TrendingUp, AlertCircle,
  CheckCircle, Clock, HardDrive as Hd, Cpu, Activity
} from 'lucide-react';

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function DiskBar({ label, percent, free }) {
  const color = percent > 90 ? 'bg-red-500' : percent > 75 ? 'bg-amber-500' : 'bg-vault-500';
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-dark-muted">{label}</span>
        <span className="font-mono">{percent}% — {free} free</span>
      </div>
      <div className="h-3 bg-dark-card rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percent, 100)}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full rounded-full ${color} transition-colors`}
        />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color = 'vault' }) {
  const colors = {
    vault: 'from-vault-600/20 to-vault-800/10 border-vault-500/20',
    green: 'from-green-600/20 to-green-800/10 border-green-500/20',
    purple: 'from-purple-600/20 to-purple-800/10 border-purple-500/20',
    amber: 'from-amber-600/20 to-amber-800/10 border-amber-500/20',
    cyan: 'from-cyan-600/20 to-cyan-800/10 border-cyan-500/20',
  };
  const iconColors = {
    vault: 'text-vault-500', green: 'text-green-500', purple: 'text-purple-500',
    amber: 'text-amber-500', cyan: 'text-cyan-500',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-5 rounded-2xl bg-gradient-to-br ${colors[color]} border backdrop-blur`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-dark-muted">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {sub && <p className="text-xs text-dark-muted mt-1">{sub}</p>}
        </div>
        <Icon className={`w-8 h-8 ${iconColors[color]} opacity-60`} />
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [s, m] = await Promise.all([api('/api/system/stats'), api('/api/models')]);
      setStats(s);
      setModels(m);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // WebSocket for real-time updates
  useWebSocket((msg) => {
    if (msg.type === 'download_complete' || msg.type === 'download_error') {
      fetchData();
    }
  });

  if (loading) return <div className="flex items-center justify-center h-64"><Loader /></div>;

  const disk = stats?.disk || {};
  const modelDisk = disk[Object.keys(disk)[0]] || {};

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gradient">Dashboard</h1>
        <p className="text-dark-muted mt-1">Overview of your AI model vault</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Total Models" value={stats?.models_count || 0} color="vault" />
        <StatCard icon={HardDrive} label="Models Size" value={formatBytes(stats?.models_total_size)} sub="On disk" color="purple" />
        <StatCard icon={Hd} label="Disk Free" value={formatBytes(modelDisk?.free)} sub={`${modelDisk?.percent || 0}% used`} color={modelDisk?.percent > 80 ? 'amber' : 'green'} />
        <StatCard icon={Activity} label="Status" value="Online" sub="System operational" color="cyan" />
      </div>

      {/* Disk Usage */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-vault-500" /> Storage
        </h2>
        {Object.entries(disk).map(([mount, info]) => (
          <DiskBar
            key={mount}
            label={mount}
            percent={info.percent}
            free={formatBytes(info.free)}
          />
        ))}
      </div>

      {/* Recent Models */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-vault-500" /> Recent Models
        </h2>
        {models.length === 0 ? (
          <div className="text-center py-12 text-dark-muted">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No models yet. Search and download from HuggingFace!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {models.slice(0, 5).map((m, i) => (
              <motion.div
                key={m.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-4 rounded-xl bg-dark-card border border-dark-border hover:border-vault-500/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-vault-600/20 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5 text-vault-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{m.name}</p>
                    <p className="text-xs text-dark-muted">{formatBytes(m.size_bytes)} · {m.files_count} files</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                    m.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {m.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Loader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-vault-800 rounded-full animate-spin border-t-vault-500" />
    </div>
  );
}
