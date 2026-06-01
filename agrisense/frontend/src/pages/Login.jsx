import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sprout } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e, mode) => {
    e.preventDefault();
    if (!username || !password) return;
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') await login(username, password);
      else await register(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-forest-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sprout-400 to-green-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-green-900/30">
            <Sprout size={34} className="text-forest-950" />
          </div>
          <h1 className="font-syne font-bold text-3xl text-white mb-2">AgriSense</h1>
          <p className="text-forest-300 text-sm font-dm">Monitor de Agricultura de Precisión</p>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-xs font-medium text-forest-200 mb-1.5 uppercase tracking-wider">
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 bg-forest-900 border border-forest-600 rounded-lg text-white placeholder-forest-400 focus:outline-none focus:border-sprout-400 focus:ring-1 focus:ring-sprout-400 transition-all font-dm text-sm"
              placeholder="demo"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-forest-200 mb-1.5 uppercase tracking-wider">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-forest-900 border border-forest-600 rounded-lg text-white placeholder-forest-400 focus:outline-none focus:border-sprout-400 focus:ring-1 focus:ring-sprout-400 transition-all font-dm text-sm"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="px-4 py-2.5 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              onClick={(e) => handleSubmit(e, 'login')}
              className="flex-1 py-2.5 bg-sprout-400 text-forest-950 rounded-lg font-bold text-sm hover:bg-sprout-300 transition-all disabled:opacity-50 font-syne"
            >
              Entrar
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={(e) => handleSubmit(e, 'register')}
              className="flex-1 py-2.5 bg-forest-700 text-forest-100 rounded-lg font-medium text-sm hover:bg-forest-600 transition-all disabled:opacity-50 font-syne"
            >
              Registro
            </button>
          </div>
        </form>

        <p className="text-center text-xs text-forest-400 mt-8 font-mono">
          Datos simulados · Demo v0.1.0
        </p>
      </div>
    </div>
  );
}
