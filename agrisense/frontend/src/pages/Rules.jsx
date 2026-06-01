import { useEffect, useState } from 'react';
import { Plus, ToggleLeft, ToggleRight, SlidersHorizontal, X } from 'lucide-react';
import { api } from '../services/api';

const sensorTypeLabels = {
  temperature: 'Temperatura',
  humidity: 'Humedad',
  soil_moisture: 'Hum. Suelo',
  ph: 'pH',
  light: 'Luz',
};

const operatorLabels = { gt: '>', lt: '<', eq: '=', gte: '≥', lte: '≤' };
const operatorOptions = ['gt', 'lt', 'eq', 'gte', 'lte'];

export default function Rules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', sensor_type: 'temperature', operator: 'gt', threshold: 0,
  });

  const loadRules = async () => {
    try {
      setRules(await api.listRules());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRules(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.createRule(form);
    setShowForm(false);
    setForm({ name: '', description: '', sensor_type: 'temperature', operator: 'gt', threshold: 0 });
    loadRules();
  };

  const handleToggle = async (rule) => {
    await api.updateRule(rule.id, { is_active: !rule.is_active });
    loadRules();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="text-forest-300 font-syne text-lg">Cargando reglas...</span>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-syne font-bold text-3xl text-white">Reglas</h2>
          <p className="text-forest-300 text-sm mt-1 font-dm">
            Motor de automatización — condiciones y umbrales
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all font-syne ${
            showForm
              ? 'bg-forest-700 text-white'
              : 'bg-sprout-400 text-forest-950 hover:bg-sprout-300'
          }`}
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? 'Cancelar' : 'Nueva Regla'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-forest-900 border border-forest-600 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <input
              type="text" placeholder="Nombre de la regla" required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 bg-forest-800 border border-forest-600 rounded-lg text-white placeholder-forest-400 text-sm focus:outline-none focus:border-sprout-400 font-dm"
            />
            <select
              value={form.sensor_type}
              onChange={(e) => setForm({ ...form, sensor_type: e.target.value })}
              className="w-full px-3 py-2 bg-forest-800 border border-forest-600 rounded-lg text-white text-sm focus:outline-none focus:border-sprout-400 font-dm"
            >
              {Object.entries(sensorTypeLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              value={form.operator}
              onChange={(e) => setForm({ ...form, operator: e.target.value })}
              className="w-full px-3 py-2 bg-forest-800 border border-forest-600 rounded-lg text-white text-sm focus:outline-none focus:border-sprout-400 font-mono"
            >
              {operatorOptions.map((op) => (
                <option key={op} value={op}>{operatorLabels[op]} ({op})</option>
              ))}
            </select>
            <input
              type="number" step="0.1" placeholder="Umbral" required
              value={form.threshold}
              onChange={(e) => setForm({ ...form, threshold: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-forest-800 border border-forest-600 rounded-lg text-white placeholder-forest-400 text-sm focus:outline-none focus:border-sprout-400 font-mono"
            />
            <button
              type="submit"
              className="w-full py-2 bg-sprout-400 text-forest-950 rounded-lg font-bold text-sm hover:bg-sprout-300 transition-all font-syne"
            >
              Crear Regla
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`flex items-center justify-between p-5 rounded-xl border transition-all ${
              rule.is_active
                ? 'bg-forest-900 border-forest-600'
                : 'bg-forest-900/50 border-forest-800 opacity-50'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`mt-1 ${rule.is_active ? 'text-sprout-400' : 'text-forest-500'}`}>
                <SlidersHorizontal size={20} />
              </div>
              <div>
                <h4 className={`font-syne font-semibold ${rule.is_active ? 'text-white' : 'text-forest-300'}`}>
                  {rule.name}
                </h4>
                <p className="text-forest-400 text-xs mt-0.5 font-dm">{rule.description}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs font-mono text-forest-300 bg-forest-800 px-2 py-0.5 rounded">
                    {sensorTypeLabels[rule.sensor_type] || rule.sensor_type}
                  </span>
                  <span className="text-xs font-mono text-sprout-400 bg-forest-800 px-2 py-0.5 rounded">
                    {operatorLabels[rule.operator]} {rule.threshold}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleToggle(rule)}
              className={`transition-all ${rule.is_active ? 'text-sprout-400' : 'text-forest-500'}`}
            >
              {rule.is_active ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
