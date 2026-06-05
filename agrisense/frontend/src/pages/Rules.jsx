import { useEffect, useState } from 'react';
import { Plus, ToggleLeft, ToggleRight, SlidersHorizontal, X, PlusCircle, Trash2 } from 'lucide-react';
import { api } from '../services/api';

const sensorTypeLabels = {
  temperature: 'Temperatura',
  humidity: 'Humedad',
  soil_moisture: 'Hum. Suelo',
  ph: 'pH',
  light: 'Luz',
  weather_temperature: 'Clima: Temperatura',
  weather_humidity: 'Clima: Humedad',
  weather_wind_speed: 'Clima: Viento',
  weather_rain_probability: 'Clima: Prob. Lluvia',
};

const operatorLabels = { gt: '>', lt: '<', eq: '=', gte: '≥', lte: '≤' };
const operatorOptions = ['gt', 'lt', 'eq', 'gte', 'lte'];

export default function Rules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isComplex, setIsComplex] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    description: '',
    sensor_type: 'temperature',
    operator: 'gt',
    threshold: 0.0,
    action_type: 'alert',
    conditions: [
      { sensor_type: 'soil_moisture', operator: 'lt', threshold: 45.0 },
      { sensor_type: 'temperature', operator: 'gt', threshold: 28.0 }
    ]
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
    
    let payload = {
      name: form.name,
      description: form.description,
      action_type: form.action_type,
    };

    if (isComplex && form.conditions.length > 0) {
      // For multi-condition rules, use the first condition as fallback for main columns
      payload.sensor_type = form.conditions[0].sensor_type;
      payload.operator = form.conditions[0].operator;
      payload.threshold = form.conditions[0].threshold;
      payload.conditions = form.conditions;
    } else {
      payload.sensor_type = form.sensor_type;
      payload.operator = form.operator;
      payload.threshold = form.threshold;
      payload.conditions = [];
    }

    try {
      await api.createRule(payload);
      setShowForm(false);
      // Reset form
      setForm({
        name: '',
        description: '',
        sensor_type: 'temperature',
        operator: 'gt',
        threshold: 0.0,
        action_type: 'alert',
        conditions: [
          { sensor_type: 'soil_moisture', operator: 'lt', threshold: 45.0 },
          { sensor_type: 'temperature', operator: 'gt', threshold: 28.0 }
        ]
      });
      setIsComplex(false);
      loadRules();
    } catch (err) {
      alert("Error al crear la regla: " + err.message);
    }
  };

  const handleToggle = async (rule) => {
    await api.updateRule(rule.id, { is_active: !rule.is_active });
    loadRules();
  };

  const addConditionField = () => {
    setForm(prev => ({
      ...prev,
      conditions: [...prev.conditions, { sensor_type: 'soil_moisture', operator: 'lt', threshold: 40.0 }]
    }));
  };

  const removeConditionField = (index) => {
    setForm(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, idx) => idx !== index)
    }));
  };

  const updateConditionField = (index, field, value) => {
    setForm(prev => {
      const updated = [...prev.conditions];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, conditions: updated };
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="text-[#76B900] font-syne text-lg">Cargando reglas...</span>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="font-syne font-bold text-3xl text-white">Reglas de Automatización</h2>
          <p className="text-zinc-500 text-xs font-mono mt-1">
            MOTOR PREDICTIVO & REGLAS DE CONTROL (ALERTAS Y ORDENES DE TRABAJO)
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all font-mono uppercase tracking-wider cursor-pointer ${
            showForm
              ? 'bg-zinc-900 border border-zinc-700 text-white'
              : 'bg-[#76B900] hover:bg-[#8cd407] text-black'
          }`}
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? 'Cancelar' : 'Nueva Regla'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="glass-card p-6 space-y-5 border border-zinc-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block font-bold">Nombre</label>
              <input
                type="text" placeholder="Ej: Riego Emergencia Tomates" required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-900 rounded-lg text-white placeholder-zinc-700 text-xs focus:outline-none focus:border-[#76B900] font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block font-bold">Descripción</label>
              <input
                type="text" placeholder="Ej: Activar riego si suelo seco y temperatura alta"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-900 rounded-lg text-white placeholder-zinc-700 text-xs focus:outline-none focus:border-[#76B900] font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block font-bold">Acción de Regla</label>
              <select
                value={form.action_type}
                onChange={(e) => setForm({ ...form, action_type: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-900 rounded-lg text-white text-xs focus:outline-none focus:border-[#76B900] font-mono"
              >
                <option value="alert">Crear Alerta en Dashboard</option>
                <option value="work_order">Crear Orden de Trabajo (Kanban)</option>
                <option value="both">Ambas Acciones (Alerta + Orden de Trabajo)</option>
              </select>
            </div>
            <div className="flex items-center gap-3 pt-5 pl-1 select-none">
              <input
                type="checkbox"
                id="isComplexCheckbox"
                checked={isComplex}
                onChange={(e) => setIsComplex(e.target.checked)}
                className="w-4 h-4 accent-[#76B900] cursor-pointer"
              />
              <label htmlFor="isComplexCheckbox" className="text-xs font-mono text-zinc-300 cursor-pointer font-semibold uppercase">
                Habilitar Regla Compleja (Multi-Condición)
              </label>
            </div>
          </div>

          {/* Simple Rule Fields */}
          {!isComplex && (
            <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-mono text-zinc-500 uppercase block font-bold">Sensor / Métrica</label>
                <select
                  value={form.sensor_type}
                  onChange={(e) => setForm({ ...form, sensor_type: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-900 rounded-lg text-white text-xs focus:outline-none focus:border-[#76B900] font-mono"
                >
                  {Object.entries(sensorTypeLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-mono text-zinc-500 uppercase block font-bold">Operador</label>
                <select
                  value={form.operator}
                  onChange={(e) => setForm({ ...form, operator: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-900 rounded-lg text-white text-xs focus:outline-none focus:border-[#76B900] font-mono font-bold"
                >
                  {operatorOptions.map((op) => (
                    <option key={op} value={op}>{operatorLabels[op]} ({op.toUpperCase()})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-mono text-zinc-500 uppercase block font-bold">Valor Umbral</label>
                <input
                  type="number" step="0.1" placeholder="0" required
                  value={form.threshold}
                  onChange={(e) => setForm({ ...form, threshold: parseFloat(e.target.value) || 0.0 })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-900 rounded-lg text-white placeholder-zinc-700 text-xs focus:outline-none focus:border-[#76B900] font-mono"
                />
              </div>
            </div>
          )}

          {/* Complex Rule Fields */}
          {isComplex && (
            <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-xl space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                <span className="text-[10px] font-mono text-[#76B900] font-bold uppercase tracking-wider">Condiciones Evaluadas (Y / AND)</span>
                <button
                  type="button"
                  onClick={addConditionField}
                  className="flex items-center gap-1 text-[9px] font-mono uppercase text-[#76B900] hover:text-[#8cd407] transition-all cursor-pointer font-bold"
                >
                  <PlusCircle size={12} />
                  Añadir Condición
                </button>
              </div>

              {form.conditions.map((cond, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-10 gap-3 items-center">
                  <div className="md:col-span-4 space-y-1">
                    <select
                      value={cond.sensor_type}
                      onChange={(e) => updateConditionField(idx, 'sensor_type', e.target.value)}
                      className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-900 rounded-lg text-white text-xs focus:outline-none focus:border-[#76B900] font-mono"
                    >
                      {Object.entries(sensorTypeLabels).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <select
                      value={cond.operator}
                      onChange={(e) => updateConditionField(idx, 'operator', e.target.value)}
                      className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-900 rounded-lg text-white text-xs focus:outline-none focus:border-[#76B900] font-mono font-bold"
                    >
                      {operatorOptions.map((op) => (
                        <option key={op} value={op}>{operatorLabels[op]} ({op})</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-3 space-y-1">
                    <input
                      type="number" step="0.1" required
                      value={cond.threshold}
                      onChange={(e) => updateConditionField(idx, 'threshold', parseFloat(e.target.value) || 0.0)}
                      className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-900 rounded-lg text-white text-xs focus:outline-none focus:border-[#76B900] font-mono"
                    />
                  </div>
                  <div className="md:col-span-1 text-center">
                    <button
                      type="button"
                      disabled={form.conditions.length <= 1}
                      onClick={() => removeConditionField(idx)}
                      className="p-1.5 text-zinc-600 hover:text-red-400 disabled:opacity-30 transition-all cursor-pointer"
                      title="Eliminar Condición"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2 bg-[#76B900] hover:bg-[#8cd407] text-black font-bold text-xs uppercase tracking-wider rounded-lg transition-all font-mono cursor-pointer"
            >
              Guardar Regla
            </button>
          </div>
        </form>
      )}

      {/* Rules list */}
      <div className="space-y-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`flex items-center justify-between p-5 rounded-xl border transition-all ${
              rule.is_active
                ? 'bg-zinc-950/60 border-zinc-900'
                : 'bg-zinc-950/20 border-zinc-900/30 opacity-40'
            }`}
          >
            <div className="flex items-start gap-4 text-left">
              <div className={`mt-1.5 ${rule.is_active ? 'text-[#76B900]' : 'text-zinc-600'}`}>
                <SlidersHorizontal size={18} />
              </div>
              <div>
                <h4 className={`font-syne font-bold text-sm ${rule.is_active ? 'text-white' : 'text-zinc-500'}`}>
                  {rule.name}
                </h4>
                <p className="text-zinc-500 text-xs font-mono mt-0.5">{rule.description}</p>
                
                {/* Conditions list display (Feature 3) */}
                {rule.conditions && rule.conditions.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {rule.conditions.map((cond, cIdx) => (
                      <span key={cIdx} className="text-[9px] font-mono text-cyan-400 bg-cyan-950/20 px-2 py-0.5 rounded border border-cyan-950">
                        {sensorTypeLabels[cond.sensor_type] || cond.sensor_type} {operatorLabels[cond.operator]} {cond.threshold}
                      </span>
                    ))}
                    <span className="text-[9px] font-mono text-purple-400 bg-purple-950/20 px-2 py-0.5 rounded border border-purple-950/40 uppercase font-bold">
                      Acción: {rule.action_type === 'both' ? 'Alerta & Orden' : rule.action_type === 'work_order' ? 'Orden de Trabajo' : 'Alerta'}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    <span className="text-[9px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded">
                      {sensorTypeLabels[rule.sensor_type] || rule.sensor_type}
                    </span>
                    <span className="text-[9px] font-mono text-[#76B900] bg-[#76B900]/10 px-2 py-0.5 rounded">
                      {operatorLabels[rule.operator]} {rule.threshold}
                    </span>
                    <span className="text-[9px] font-mono text-purple-400 bg-purple-950/20 px-2 py-0.5 rounded border border-purple-950/40 uppercase font-bold">
                      Acción: {rule.action_type === 'both' ? 'Alerta & Orden' : rule.action_type === 'work_order' ? 'Orden de Trabajo' : 'Alerta'}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => handleToggle(rule)}
              className={`transition-all cursor-pointer ${rule.is_active ? 'text-[#76B900]' : 'text-zinc-700'}`}
            >
              {rule.is_active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
            </button>
          </div>
        ))}
        {rules.length === 0 && (
          <div className="text-center py-12 text-zinc-600 font-mono text-xs">NO HAY REGLAS CONFIGURADAS</div>
        )}
      </div>
    </div>
  );
}
