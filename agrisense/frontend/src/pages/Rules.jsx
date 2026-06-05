import { useEffect, useState, useRef } from 'react';
import { Plus, ToggleLeft, ToggleRight, SlidersHorizontal, X, PlusCircle, Trash2, Radio } from 'lucide-react';
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

  const [lines, setLines] = useState([]);
  const containerRef = useRef(null);

  const loadRules = async () => {
    try {
      setRules(await api.listRules());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const updateLines = () => {
    if (!containerRef.current || !showForm) return;
    
    // Request animation frame to ensure DOM is fully rendered and styled
    requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();

      const triggerPort = document.getElementById('port-trigger-out');
      const actionPort = document.getElementById('port-action-in');
      
      if (!triggerPort || !actionPort) return;

      const triggerRect = triggerPort.getBoundingClientRect();
      const actionRect = actionPort.getBoundingClientRect();

      const tX = triggerRect.left + triggerRect.width / 2 - containerRect.left;
      const tY = triggerRect.top + triggerRect.height / 2 - containerRect.top;

      const aX = actionRect.left + actionRect.width / 2 - containerRect.left;
      const aY = actionRect.top + actionRect.height / 2 - containerRect.top;

      const newLines = [];
      const condsCount = isComplex ? form.conditions.length : 1;

      for (let idx = 0; idx < condsCount; idx++) {
        const inputPort = document.getElementById(`port-cond-in-${idx}`);
        const outputPort = document.getElementById(`port-cond-out-${idx}`);
        
        if (inputPort && outputPort) {
          const inputRect = inputPort.getBoundingClientRect();
          const outputRect = outputPort.getBoundingClientRect();

          const inX = inputRect.left + inputRect.width / 2 - containerRect.left;
          const inY = inputRect.top + inputRect.height / 2 - containerRect.top;

          const outX = outputRect.left + outputRect.width / 2 - containerRect.left;
          const outY = outputRect.top + outputRect.height / 2 - containerRect.top;

          // Path from Trigger to Condition Input (horizontal S-curve)
          const cp1X = tX + (inX - tX) * 0.5;
          const path1 = `M ${tX} ${tY} C ${cp1X} ${tY}, ${cp1X} ${inY}, ${inX} ${inY}`;

          // Path from Condition Output to Action Input (horizontal S-curve)
          const cp2X = outX + (aX - outX) * 0.5;
          const path2 = `M ${outX} ${outY} C ${cp2X} ${outY}, ${cp2X} ${aY}, ${aX} ${aY}`;

          newLines.push({ path1, path2 });
        }
      }

      setLines(newLines);
    });
  };

  useEffect(() => {
    updateLines();
    window.addEventListener('resize', updateLines);
    return () => window.removeEventListener('resize', updateLines);
  }, [form.conditions, showForm, isComplex, form.sensor_type, form.operator, form.threshold, form.action_type]);

  const handleCreate = async (e) => {
    e.preventDefault();
    
    let payload = {
      name: form.name,
      description: form.description,
      action_type: form.action_type,
    };

    if (isComplex && form.conditions.length > 0) {
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

  const activeConditions = isComplex 
    ? form.conditions 
    : [{ sensor_type: form.sensor_type, operator: form.operator, threshold: form.threshold }];

  const handleConditionChange = (idx, field, value) => {
    if (isComplex) {
      updateConditionField(idx, field, value);
    } else {
      setForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleDeleteCondition = (idx) => {
    if (isComplex) {
      removeConditionField(idx);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="text-[#76B900] font-syne text-lg animate-pulse">Cargando reglas...</span>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="font-syne font-bold text-3xl text-white">Reglas de Automatización</h2>
          <p className="text-zinc-500 text-xs font-mono mt-1">
            DISEÑADOR VISUAL DE FLUJO (TRIGGER → CONDICIONES → ACCIÓN)
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all font-mono uppercase tracking-wider cursor-pointer ${
            showForm
              ? 'bg-zinc-900 border border-zinc-700 text-white'
              : 'bg-[#76B900] hover:bg-[#8cd407] text-black shadow-[0_0_15px_rgba(118,185,0,0.3)]'
          }`}
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? 'Cancelar' : 'Nueva Regla'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="glass-card p-6 space-y-6 border border-zinc-800">
          {/* Top Form Section: Meta data */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4 space-y-1">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block font-bold">Nombre de la Regla</label>
              <input
                type="text" placeholder="Ej: Riego Automático por Sequía" required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-900 rounded-lg text-white placeholder-zinc-700 text-xs focus:outline-none focus:border-[#76B900] font-mono"
              />
            </div>
            <div className="md:col-span-5 space-y-1">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block font-bold">Descripción de la Regla</label>
              <input
                type="text" placeholder="Ej: Disparar riego si la humedad baja del 40%"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-900 rounded-lg text-white placeholder-zinc-700 text-xs focus:outline-none focus:border-[#76B900] font-mono"
              />
            </div>
            <div className="md:col-span-3 flex items-center justify-end pt-5 select-none">
              <label className="relative flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isComplex}
                  onChange={(e) => setIsComplex(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#76B900]/20 peer-checked:after:bg-[#76B900]"></div>
                <span className="text-[10px] font-mono text-zinc-400 peer-checked:text-white uppercase font-bold tracking-wider">
                  Multi-Condición
                </span>
              </label>
            </div>
          </div>

          {/* Flowchart Section */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold">Lienzo del Diagrama de Flujo</span>
            
            <div 
              ref={containerRef}
              className="relative flex flex-col md:flex-row justify-between items-stretch gap-6 md:gap-4 p-6 bg-zinc-950/80 rounded-2xl border border-zinc-900/60 min-h-[300px] overflow-hidden"
              style={{
                backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
                backgroundSize: '16px 16px'
              }}
            >
              {/* Dynamic SVG Connections Overlay */}
              <svg className="absolute inset-0 pointer-events-none w-full h-full z-0 hidden md:block">
                {lines.map((line, idx) => (
                  <g key={idx}>
                    {/* Shadow underlying paths for glow effect */}
                    <path d={line.path1} stroke="#76B900" strokeWidth="3" fill="none" opacity="0.1" />
                    <path d={line.path2} stroke="#00ffcc" strokeWidth="3" fill="none" opacity="0.1" />
                    
                    {/* Sharp connections */}
                    <path d={line.path1} stroke="#76B900" strokeWidth="1.5" fill="none" opacity="0.4" />
                    <path d={line.path2} stroke="#00ffcc" strokeWidth="1.5" fill="none" opacity="0.4" />

                    {/* Laser flows (moving dashed line) */}
                    <path d={line.path1} stroke="#76B900" strokeWidth="1.5" fill="none" className="animate-laser" />
                    <path d={line.path2} stroke="#00ffcc" strokeWidth="1.5" fill="none" className="animate-laser" />
                  </g>
                ))}
              </svg>

              {/* Column 1: Trigger Node */}
              <div className="w-full md:w-1/4 flex flex-col justify-center items-center z-10 relative">
                <div className="w-full glass-card border border-emerald-500/20 bg-zinc-950/90 p-4 rounded-xl text-center space-y-3 flex flex-col justify-center relative min-h-[140px] shadow-[0_0_15px_rgba(16,185,129,0.02)]">
                  <div className="mx-auto w-9 h-9 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                    <Radio size={18} className="animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">Telemetría IoT</span>
                    <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block mt-1">Evento de Entrada</span>
                  </div>
                  
                  {/* Output Port */}
                  <div 
                    id="port-trigger-out" 
                    className="hidden md:block w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-zinc-950 absolute -right-1.5 top-1/2 -translate-y-1/2 shadow-[0_0_6px_#10b981]" 
                  />
                </div>
              </div>

              {/* Column 2: Conditions Nodes */}
              <div className="w-full md:w-5/12 flex flex-col justify-center gap-4 z-10 relative py-2">
                {activeConditions.map((cond, idx) => (
                  <div 
                    key={idx}
                    className="w-full glass-card border border-cyan-500/20 bg-zinc-950/90 p-4 rounded-xl relative space-y-3 shadow-[0_0_15px_rgba(6,182,212,0.02)]"
                  >
                    {/* Ports */}
                    <div 
                      id={`port-cond-in-${idx}`} 
                      className="hidden md:block w-2.5 h-2.5 rounded-full bg-cyan-400 border-2 border-zinc-950 absolute -left-1.5 top-1/2 -translate-y-1/2 shadow-[0_0_6px_#22d3ee]" 
                    />
                    <div 
                      id={`port-cond-out-${idx}`} 
                      className="hidden md:block w-2.5 h-2.5 rounded-full bg-cyan-400 border-2 border-zinc-950 absolute -right-1.5 top-1/2 -translate-y-1/2 shadow-[0_0_6px_#22d3ee]" 
                    />

                    {/* Header */}
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
                        CONDICIÓN {isComplex ? `#${idx + 1}` : ''}
                      </span>
                      {isComplex && activeConditions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCondition(idx)}
                          className="text-zinc-600 hover:text-red-400 transition-colors p-0.5 cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>

                    {/* Fields grid */}
                    <div className="grid grid-cols-1 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block font-bold">Métrica / Sensor</label>
                        <select
                          value={cond.sensor_type}
                          onChange={(e) => handleConditionChange(idx, 'sensor_type', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-900 rounded-lg text-white text-[11px] focus:outline-none focus:border-cyan-500 font-mono cursor-pointer"
                        >
                          {Object.entries(sensorTypeLabels).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block font-bold">Operador</label>
                          <select
                            value={cond.operator}
                            onChange={(e) => handleConditionChange(idx, 'operator', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-900 rounded-lg text-white text-[11px] focus:outline-none focus:border-cyan-500 font-mono font-bold cursor-pointer"
                          >
                            {operatorOptions.map((op) => (
                              <option key={op} value={op}>{operatorLabels[op]}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block font-bold">Umbral</label>
                          <input
                            type="number" step="0.1" required
                            value={cond.threshold}
                            onChange={(e) => handleConditionChange(idx, 'threshold', parseFloat(e.target.value) || 0.0)}
                            className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-900 rounded-lg text-white text-[11px] focus:outline-none focus:border-cyan-500 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {isComplex && (
                  <button
                    type="button"
                    onClick={addConditionField}
                    className="w-full py-2 border border-dashed border-zinc-800 hover:border-cyan-500/50 hover:bg-cyan-500/5 text-zinc-500 hover:text-cyan-400 text-[9px] font-mono uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer font-bold mt-1"
                  >
                    <PlusCircle size={11} />
                    Añadir Condición Y (AND)
                  </button>
                )}
              </div>

              {/* Column 3: Action Node */}
              <div className="w-full md:w-1/4 flex flex-col justify-center items-center z-10 relative">
                <div className="w-full glass-card border border-purple-500/20 bg-zinc-950/90 p-4 rounded-xl text-center space-y-3 flex flex-col justify-center relative min-h-[140px] shadow-[0_0_15px_rgba(168,85,247,0.02)]">
                  {/* Input Port */}
                  <div 
                    id="port-action-in" 
                    className="hidden md:block w-2.5 h-2.5 rounded-full bg-purple-500 border-2 border-zinc-950 absolute -left-1.5 top-1/2 -translate-y-1/2 shadow-[0_0_6px_#a855f7]" 
                  />

                  <div className="mx-auto w-9 h-9 rounded-lg bg-purple-950/40 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.1)]">
                    <SlidersHorizontal size={18} className="animate-pulse" />
                  </div>
                  
                  <div className="space-y-1.5 text-left">
                    <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-widest block text-center">Acción Ejecutada</span>
                    <select
                      value={form.action_type}
                      onChange={(e) => setForm({ ...form, action_type: e.target.value })}
                      className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-900 rounded-lg text-white text-[11px] focus:outline-none focus:border-purple-500 font-mono cursor-pointer"
                    >
                      <option value="alert">Crear Alerta</option>
                      <option value="work_order">Orden de Trabajo</option>
                      <option value="both">Alerta + Orden</option>
                    </select>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2 bg-[#76B900] hover:bg-[#8cd407] text-black font-bold text-xs uppercase tracking-wider rounded-lg transition-all font-mono cursor-pointer shadow-[0_0_15px_rgba(118,185,0,0.3)] hover:shadow-[0_0_20px_rgba(118,185,0,0.5)]"
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
                ? 'bg-zinc-950/60 border-zinc-900 hover:border-zinc-800'
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
                
                {/* Visual mini node pipeline */}
                <div className="flex items-center gap-1.5 flex-wrap mt-3 text-[10px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 font-bold uppercase tracking-wider text-[8px]">
                    Telemetría
                  </span>
                  <span className="text-zinc-700">→</span>
                  
                  {rule.conditions && rule.conditions.length > 0 ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {rule.conditions.map((cond, cIdx) => (
                        <span key={cIdx} className="flex items-center gap-1.5">
                          {cIdx > 0 && <span className="text-[#76B900] font-bold text-[8px]">&</span>}
                          <span className="px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-400 border border-cyan-900/40 font-semibold">
                            {sensorTypeLabels[cond.sensor_type] || cond.sensor_type} {operatorLabels[cond.operator] || cond.operator} {cond.threshold}
                          </span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-400 border border-cyan-900/40 font-semibold">
                      {sensorTypeLabels[rule.sensor_type] || rule.sensor_type} {operatorLabels[rule.operator] || rule.operator} {rule.threshold}
                    </span>
                  )}

                  <span className="text-zinc-700">→</span>
                  <span className="px-2 py-0.5 rounded bg-purple-950/40 text-purple-400 border border-purple-900/40 font-bold uppercase tracking-wider text-[8px]">
                    {rule.action_type === 'both' ? 'Alerta & Orden' : rule.action_type === 'work_order' ? 'Orden Trabajo' : 'Alerta'}
                  </span>
                </div>
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
