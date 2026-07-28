
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard';
import Models from './pages/Models';
import Downloads from './pages/Downloads';
import Search from './pages/Search';
import Settings from './pages/Settings';
import Layout from './components/Layout';

function ProtectedRoute({ children, requirePasswordChange }) {
  const { user, loading, mustChange } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (requirePasswordChange && mustChange) return <Navigate to="/change-password" replace />;
  return children;
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-vault-800 rounded-full animate-spin border-t-vault-500"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-vault-500 font-bold text-lg">K</span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="models" element={<Models />} />
          <Route path="downloads" element={<Downloads />} />
          <Route path="search" element={<Search />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
