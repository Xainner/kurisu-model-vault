
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export default function ChangePassword() {
  const { changePassword } = useAuth();
  const navigate = useNavigate();
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState({});

  const toggleShow = (field) => setShowPass(p => ({ ...p, [field]: !p[field] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPass !== confirmPass) {
      setError('Passwords do not match');
      return;
    }
    if (newPass.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }
    setLoading(true);
    try {
      await changePassword(oldPass, newPass);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const Input = ({ label, value, onChange, field }) => (
    <div>
      <label className="block text-sm font-medium text-dark-muted mb-2">{label}</label>
      <div className="relative">
        <input
          type={showPass[field] ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-4 pr-12 py-3 bg-dark-card border border-dark-border rounded-xl text-dark-text placeholder-dark-muted focus:outline-none focus:border-vault-500 input-glow transition-all"
        />
        <button
          type="button"
          onClick={() => toggleShow(field)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-muted hover:text-dark-text"
        >
          {showPass[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-vault-950/30 via-dark-bg to-amber-950/20" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                  className="flex justify-center mb-8"
                >
                  <img
                    src="/logo.png"
                    alt="Kurisu Model Vault"
                    className="h-20 object-contain drop-shadow-2xl"
                  />
                </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-center mb-2 text-gradient">Security Required</h1>
          <p className="text-dark-muted text-center mb-8">Please change your default password before continuing</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input label="Current Password" value={oldPass} onChange={setOldPass} field="old" />
            <Input label="New Password" value={newPass} onChange={setNewPass} field="new" />
            <Input label="Confirm New Password" value={confirmPass} onChange={setConfirmPass} field="confirm" />

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                {error}
              </motion.div>
            )}

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-vault-600 to-vault-500 text-white font-semibold rounded-xl shadow-lg shadow-vault-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Updating...</> : 'Change Password'}
            </motion.button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
}
