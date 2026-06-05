import { useEffect, useState } from 'react';
import { ClipboardList, PlusCircle, Play, CheckCircle, Clock, X } from 'lucide-react';
import { api } from '../services/api';

export default function WorkOrders() {
  const [orders, setOrders] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    zone_id: ''
  });

  const loadData = async () => {
    try {
      const [ordersList, zonesList] = await Promise.all([
        api.listWorkOrders(),
        api.listZones()
      ]);
      setOrders(ordersList);
      setZones(zonesList);
      
      // Auto-select first zone if available
      if (zonesList.length > 0) {
        setForm(prev => ({ ...prev, zone_id: zonesList[0].id }));
      }
    } catch (err) {
      console.error("Error loading work orders data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.zone_id) return;

    try {
      await api.createWorkOrder(form);
      setShowForm(false);
      setForm({
        title: '',
        description: '',
        zone_id: zones[0]?.id || ''
      });
      loadData();
    } catch (err) {
      alert("Error al crear la orden de trabajo: " + err.message);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.updateWorkOrderStatus(orderId, newStatus);
      loadData();
    } catch (err) {
      alert("Error al actualizar estado: " + err.message);
    }
  };

  const getZoneName = (zoneId) => {
    const zone = zones.find(z => z.id === zoneId);
    return zone ? zone.name : 'Zona Desconocida';
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-[#76B900] font-mono">
      <span className="animate-pulse text-lg">CARGANDO ÓRDENES DE TRABAJO...</span>
    </div>
  );

  // Group orders by status
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const inProgressOrders = orders.filter(o => o.status === 'in_progress');
  const completedOrders = orders.filter(o => o.status === 'completed');

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-left">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="font-syne font-bold text-3xl text-white">Órdenes de Trabajo</h2>
          <p className="text-zinc-500 text-xs font-mono mt-1">
            GESTIÓN DE TAREAS Y MANTENIMIENTO OPERACIONAL
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
          {showForm ? <X size={14} /> : <PlusCircle size={14} />}
          {showForm ? 'Cancelar' : 'Nueva Orden'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="glass-card p-6 space-y-5 border border-zinc-800 max-w-xl mx-auto">
          <h3 className="font-syne font-bold text-lg text-white">Crear Tarea Agrícola</h3>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block font-bold">Título de la Tarea</label>
              <input
                type="text" placeholder="Ej: Limpieza de Filtros de Riego" required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-900 rounded-lg text-white placeholder-zinc-700 text-xs focus:outline-none focus:border-[#76B900] font-mono"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block font-bold">Descripción de la Actividad</label>
              <textarea
                rows="3" placeholder="Detalla los pasos o insumos necesarios para esta actividad..." required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-900 rounded-lg text-white placeholder-zinc-700 text-xs focus:outline-none focus:border-[#76B900] font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block font-bold">Asignar a Zona</label>
              <select
                value={form.zone_id}
                onChange={(e) => setForm({ ...form, zone_id: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-900 rounded-lg text-white text-xs focus:outline-none focus:border-[#76B900] font-mono cursor-pointer"
              >
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>{zone.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2 bg-[#76B900] hover:bg-[#8cd407] text-black font-bold text-xs uppercase tracking-wider rounded-lg transition-all font-mono cursor-pointer"
            >
              Asignar Orden
            </button>
          </div>
        </form>
      )}

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Column 1: Pending */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-amber-500" />
              <span className="font-syne font-bold text-sm text-zinc-200">PENDIENTE</span>
            </div>
            <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded font-mono text-[10px] font-bold">
              {pendingOrders.length}
            </span>
          </div>

          <div className="space-y-3 min-h-[300px]">
            {pendingOrders.map((order) => (
              <div key={order.id} className="glass-card p-4 border border-amber-500/10 hover:border-amber-500/30 bg-zinc-950/40 space-y-3">
                <div>
                  <h4 className="font-syne font-bold text-sm text-white">{order.title}</h4>
                  <p className="text-zinc-400 text-xs font-mono mt-1 leading-normal">{order.description}</p>
                </div>
                
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-900/50">
                  <span className="text-[8px] font-mono text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-900 uppercase font-bold">
                    {getZoneName(order.zone_id)}
                  </span>
                  
                  <button
                    onClick={() => handleStatusChange(order.id, 'in_progress')}
                    className="flex items-center gap-1 text-[9px] font-mono uppercase bg-amber-500 hover:bg-amber-600 text-black px-2.5 py-1 rounded font-bold transition-all cursor-pointer"
                  >
                    <Play size={10} fill="currentColor" />
                    Iniciar
                  </button>
                </div>
              </div>
            ))}
            {pendingOrders.length === 0 && (
              <div className="text-center py-12 text-zinc-700 font-mono text-[10px] border border-dashed border-zinc-900 rounded-xl">
                SIN TAREAS PENDIENTES
              </div>
            )}
          </div>
        </div>

        {/* Column 2: In Progress */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
            <div className="flex items-center gap-2">
              <ClipboardList size={16} className="text-cyan-400" />
              <span className="font-syne font-bold text-sm text-zinc-200">EN PROCESO</span>
            </div>
            <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded font-mono text-[10px] font-bold">
              {inProgressOrders.length}
            </span>
          </div>

          <div className="space-y-3 min-h-[300px]">
            {inProgressOrders.map((order) => (
              <div key={order.id} className="glass-card p-4 border border-cyan-500/10 hover:border-cyan-500/30 bg-zinc-950/40 space-y-3">
                <div>
                  <h4 className="font-syne font-bold text-sm text-white">{order.title}</h4>
                  <p className="text-zinc-400 text-xs font-mono mt-1 leading-normal">{order.description}</p>
                </div>
                
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-900/50">
                  <span className="text-[8px] font-mono text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-900 uppercase font-bold">
                    {getZoneName(order.zone_id)}
                  </span>
                  
                  <button
                    onClick={() => handleStatusChange(order.id, 'completed')}
                    className="flex items-center gap-1 text-[9px] font-mono uppercase bg-cyan-400 hover:bg-cyan-500 text-black px-2.5 py-1 rounded font-bold transition-all cursor-pointer"
                  >
                    <CheckCircle size={10} />
                    Completar
                  </button>
                </div>
              </div>
            ))}
            {inProgressOrders.length === 0 && (
              <div className="text-center py-12 text-zinc-700 font-mono text-[10px] border border-dashed border-zinc-900 rounded-xl">
                SIN TAREAS EN PROCESO
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Completed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#76B900]/20 pb-2">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-[#76B900]" />
              <span className="font-syne font-bold text-sm text-zinc-200">COMPLETADA</span>
            </div>
            <span className="bg-[#76B900]/10 text-[#76B900] border border-[#76B900]/20 px-2 py-0.5 rounded font-mono text-[10px] font-bold">
              {completedOrders.length}
            </span>
          </div>

          <div className="space-y-3 min-h-[300px]">
            {completedOrders.map((order) => (
              <div key={order.id} className="glass-card p-4 border border-[#76B900]/10 hover:border-[#76B900]/30 bg-zinc-950/20 opacity-70 space-y-3">
                <div>
                  <h4 className="font-syne font-bold text-sm text-zinc-400 line-through">{order.title}</h4>
                  <p className="text-zinc-500 text-xs font-mono mt-1 leading-normal line-through">{order.description}</p>
                </div>
                
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-900/10">
                  <span className="text-[8px] font-mono text-zinc-600 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-900 uppercase font-bold">
                    {getZoneName(order.zone_id)}
                  </span>
                  
                  <span className="flex items-center gap-1 text-[9px] font-mono uppercase text-[#76B900] font-bold">
                    <CheckCircle size={10} />
                    Finalizada
                  </span>
                </div>
              </div>
            ))}
            {completedOrders.length === 0 && (
              <div className="text-center py-12 text-zinc-700 font-mono text-[10px] border border-dashed border-zinc-900 rounded-xl">
                SIN TAREAS FINALIZADAS
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
