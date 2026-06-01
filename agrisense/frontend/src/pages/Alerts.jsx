import { useEffect, useState } from 'react';
import { Bell, BellOff, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { api } from '../services/api';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const loadAlerts = async () => {
    try {
      const data = await api.listAlerts(filter === 'unacknowledged');
      setAlerts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 5000);
    return () => clearInterval(interval);
  }, [filter]);

  const handleAcknowledge = async (id) => {
    await api.acknowledgeAlert(id);
    loadAlerts();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-syne font-bold text-3xl text-white">Alertas</h2>
          <p className="text-forest-300 text-sm mt-1 font-dm">
            Historial de alertas generadas por el motor de reglas
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all font-syne ${
              filter === 'all'
                ? 'bg-forest-700 text-white'
                : 'text-forest-300 hover:text-white hover:bg-forest-800'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('unacknowledged')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all font-syne ${
              filter === 'unacknowledged'
                ? 'bg-alert-red/20 text-alert-red border border-alert-red/30'
                : 'text-forest-300 hover:text-white hover:bg-forest-800'
            }`}
          >
            No reconocidas
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <span className="text-forest-300 font-syne text-lg">Cargando alertas...</span>
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-forest-400">
          <BellOff size={48} className="mb-4 opacity-50" />
          <p className="font-syne text-lg">No hay alertas</p>
          <p className="text-sm font-dm mt-1">El sistema está operando normalmente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-start justify-between p-5 rounded-xl border transition-all ${
                alert.acknowledged
                  ? 'bg-forest-900 border-forest-700 opacity-60'
                  : 'bg-forest-900 border-alert-red/30 shadow-lg shadow-red-900/5'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`mt-0.5 ${alert.acknowledged ? 'text-forest-400' : 'text-alert-red'}`}>
                  {alert.acknowledged ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                </div>
                <div>
                  <p className={`font-syne font-semibold ${alert.acknowledged ? 'text-forest-200' : 'text-white'}`}>
                    {alert.message}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-xs text-forest-400 font-mono">
                      <Clock size={12} />
                      {new Date(alert.created_at).toLocaleTimeString()}
                    </span>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                      alert.acknowledged
                        ? 'bg-forest-800 text-forest-300'
                        : 'bg-red-900/30 text-red-400'
                    }`}>
                      {alert.acknowledged ? 'Reconocida' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              </div>
              {!alert.acknowledged && (
                <button
                  onClick={() => handleAcknowledge(alert.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-forest-800 hover:bg-forest-700 rounded-lg text-sm font-medium text-sprout-400 transition-all font-syne whitespace-nowrap"
                >
                  <CheckCircle2 size={16} />
                  Reconocer
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
