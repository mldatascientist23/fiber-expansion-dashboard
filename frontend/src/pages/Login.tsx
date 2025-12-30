import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import type { User } from '../api/types';

interface LoginProps {
  onLogin: (user: User, token: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const tokenData = await authApi.login({ email, password });
      localStorage.setItem('token', tokenData.access_token);
      
      const user = await authApi.me();
      onLogin(user, tokenData.access_token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInitAdmin = async () => {
    setInitLoading(true);
    try {
      await authApi.initAdmin();
      setEmail('admin@gvtc.com');
      setPassword('admin123');
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to initialize admin user.');
    } finally {
      setInitLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gvtc-primary to-gvtc-dark py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gvtc-primary">GVTC FEIP</h1>
            <p className="mt-2 text-gray-600">Fiber Expansion Intelligence Platform</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gvtc-primary focus:border-gvtc-primary"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gvtc-primary focus:border-gvtc-primary"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gvtc-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gvtc-primary disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center mb-3">
              First time? Initialize the default admin user:
            </p>
            <button
              onClick={handleInitAdmin}
              disabled={initLoading}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gvtc-primary disabled:opacity-50"
            >
              {initLoading ? 'Initializing...' : 'Create Admin User'}
            </button>
          </div>

          <div className="mt-6 text-center text-xs text-gray-400">
            <p>Default credentials after init:</p>
            <p className="font-mono">admin@gvtc.com / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
