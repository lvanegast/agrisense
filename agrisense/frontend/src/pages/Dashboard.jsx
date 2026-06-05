import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import FarmMap from '../components/FarmMap';
import HealthScoreBadge from '../components/HealthScoreBadge';
import { 
  Sprout, 
  AlertTriangle, 
  Terminal, 
  TrendingUp, 
  Activity, 
  ShieldCheck,
  Cpu,
  Sliders,
  CloudRain,
  Sun,
  Wind,
  Sparkles,
  Check,
  ClipboardList,
  Flame,
  Droplet
} from 'lucide-react';

export default function Dashboard() {
  const [zones, setZones] = useState([]);
  const [roverTelemetry, setRoverTelemetry] = useState(null);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [systemHealth, setSystemHealth] = useState(100);

  // Weather (New Feature 1)
  const [weather, setWeather] = useState(null);

  // ESP32-CAM and High-Precision Clock
  const [selectedCamZone, setSelectedCamZone] = useState(0);
  const [liveTime, setLiveTime] = useState('');

  // Sandbox simulation states
  const [sandboxWater, setSandboxWater] = useState(0);
  const [sandboxTemp, setSandboxTemp] = useState(0);

  // Dynamic success notice when executing Co-Pilot commands
  const [successMessage, setSuccessMessage] = useState(null);

  // Copilot Chat (New Feature 4)
  const [copilotTab, setCopilotTab] = useState('recommendations'); // recommendations | chat
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      role: 'assistant',
      content: '👋 ¡Hola! Soy tu **Copiloto Agrónomo AI**. Analizo la telemetría de tus sensores en tiempo real para darte recomendaciones agrícolas personalizadas. Pregúntame sobre el estado de alguna zona, recomendaciones de cultivo o el clima.'
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Phenology Edit (New Feature 2)
  const [updatingPhenology, setUpdatingPhenology] = useState(false);

  const loadData = async (isFirst = false) => {
    try {
      if (isFirst) setLoading(true);
      
      const zonesData = await api.listZones();
      const stats = await Promise.all(
        zonesData.map(async (z) => {
          try {
            return await api.getZoneStats(z.id);
          } catch {
            return null;
          }
        })
      );
      const filteredZones = stats.filter(Boolean);
      setZones(filteredZones);

      if (filteredZones.length > 0) {
        const avg = filteredZones.reduce((acc, zone) => acc + (zone.health_score || 0), 0) / filteredZones.length;
        setSystemHealth(avg);
      }

      const rover = await api.getRoverTelemetry();
      setRoverTelemetry(rover);

      const alerts = await api.listAlerts(true);
      setActiveAlerts(alerts);

      // Fetch Weather (New Feature 1)
      try {
        const weatherData = await api.getWeather();
        setWeather(weatherData);
      } catch (wErr) {
        console.error("Error loading weather data:", wErr);
      }

    } catch (err) {
      console.error("Dashboard poll error:", err);
    } finally {
      if (isFirst) setLoading(false);
    }
  };


  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => loadData(false), 3000);
    return () => clearInterval(interval);
  }, []);

  // Precision milli-clock loop
  useEffect(() => {
    const timeInterval = setInterval(() => {
      const now = new Date();
      setLiveTime(now.toISOString().replace('T', ' ').slice(0, 23));
    }, 100);
    return () => clearInterval(timeInterval);
  }, []);

  // AgriAgent Co-Pilot Recommendation Generator
  const generateRecommendations = () => {
    const recs = [];
    zones.forEach((zone, zIdx) => {
      zone.sensors?.forEach((sensor) => {
        if (sensor.latest_value === null) return;
        
        // 1. Special Vermiculture / Lombrices moisture check (ideal: 70-80%)
        if (sensor.name.includes('Lombrices') && sensor.type === 'soil_moisture' && sensor.latest_value < 70) {
          const pump = zone.actuators?.find(a => a.type === 'irrigation_pump');
          if (pump && !pump.is_on) {
            recs.push({
              id: `rec-lomb-moist-${sensor.id}`,
              severity: 'warning',
              zoneName: zone.name,
              message: `Humedad deficiente en Lombricultivo (${sensor.latest_value.toFixed(1)}%).`,
              suggestion: 'Activar aspersor para mantener piel húmeda (ideal 70-80%).',
              buttonLabel: 'Activar Aspersor Lombrices',
              actionType: 'actuator',
              targetId: pump.id
            });
          }
        }
        
        // 2. Special Compost Oxygen / Aeración check (ideal: > 45%)
        if (sensor.name.includes('Oxígeno') && sensor.type === 'humidity' && sensor.latest_value < 45) {
          const fan = zone.actuators?.find(a => a.type === 'ventilation_fan');
          if (fan && !fan.is_on) {
            recs.push({
              id: `rec-comp-ox-${sensor.id}`,
              severity: 'warning',
              zoneName: zone.name,
              message: `Baja oxigenación en Compostera (${sensor.latest_value.toFixed(1)}%).`,
              suggestion: 'Encender aireador mecánico para descomposición aeróbica.',
              buttonLabel: 'Activar Aireador Compost',
              actionType: 'actuator',
              targetId: fan.id
            });
          }
        }

        // 3. Dry soil moisture recommendation (Crops only)
        if (!sensor.name.includes('Lombrices') && sensor.type === 'soil_moisture' && sensor.latest_value < 35) {
          const pump = zone.actuators?.find(a => a.type === 'irrigation_pump');
          if (pump && !pump.is_on) {
            recs.push({
              id: `rec-moisture-${sensor.id}`,
              severity: 'warning',
              zoneName: zone.name,
              message: `Baja humedad detectada en ${zone.name} (${sensor.latest_value.toFixed(1)}%).`,
              suggestion: 'Iniciar bomba de riego para prevenir estrés hídrico.',
              buttonLabel: 'Activar Riego',
              actionType: 'actuator',
              targetId: pump.id
            });
          }
        }
        
        // 4. High temperature recommendation
        if (sensor.type === 'temperature' && sensor.latest_value > 28) {
          const fan = zone.actuators?.find(a => a.type === 'ventilation_fan');
          if (fan && !fan.is_on) {
            recs.push({
              id: `rec-temp-${sensor.id}`,
              severity: 'warning',
              zoneName: zone.name,
              message: `Temperatura elevada en ${zone.name} (${sensor.latest_value.toFixed(1)}°C).`,
              suggestion: 'Activar extractor/ventilador para mitigar calor.',
              buttonLabel: 'Encender Extractor',
              actionType: 'actuator',
              targetId: fan.id
            });
          }
        }

        // 5. Acidic pH recommendation
        if (sensor.type === 'ph' && sensor.latest_value < 5.8) {
          const valve = zone.actuators?.find(a => a.type === 'nutrient_valve');
          if (valve && !valve.is_on) {
            recs.push({
              id: `rec-ph-${sensor.id}`,
              severity: 'critical',
              zoneName: zone.name,
              message: `pH ácido crítico en ${zone.name} (${sensor.latest_value.toFixed(2)}).`,
              suggestion: 'Iniciar válvula de nutrientes para regular alcalinidad.',
              buttonLabel: 'Dosificar Nutrientes',
              actionType: 'actuator',
              targetId: valve.id
            });
          } else {
            // Suggest manual task creation
            recs.push({
              id: `rec-ph-task-${sensor.id}`,
              severity: 'warning',
              zoneName: zone.name,
              message: `Lectura de pH de ${zone.name} fuera de rango (${sensor.latest_value.toFixed(2)}).`,
              suggestion: 'Se sugiere crear orden de calibración de electrodos.',
              buttonLabel: 'Crear Tarea pH',
              actionType: 'work_order',
              zoneId: zone.id,
              sensorId: sensor.id,
              title: 'Calibración electrodos pH',
              description: `Mantenimiento preventivo por pH anómalo (${sensor.latest_value.toFixed(2)}) en ${zone.name}.`
            });
          }
        }
      });
    });
    return recs;
  };

  const handleExecuteRecommendation = async (rec) => {
    try {
      if (rec.actionType === 'actuator') {
        await api.toggleActuator(rec.targetId);
        showFeedback("Comando ejecutado: Dispositivo conmutado con éxito.");
      } else if (rec.actionType === 'work_order') {
        await api.createWorkOrder({
          title: rec.title,
          description: rec.description,
          zone_id: rec.zoneId,
          sensor_id: rec.sensorId
        });
        showFeedback("Mantenimiento programado: Orden registrada en Kanban.");
      }
      loadData(false);
    } catch (err) {
      console.error("Error executing recommendation:", err);
    }
  };

  const showFeedback = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleActuatorChange = () => {
    loadData(false);
  };

  const handleSendChatMessage = async (msgText) => {
    const textToSend = msgText || chatInput;
    if (!textToSend.trim()) return;

    // Append user message
    const newUserMsg = { role: 'user', content: textToSend };
    setChatHistory(prev => [...prev, newUserMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await api.copilotChat(textToSend);
      setChatHistory(prev => [...prev, { role: 'assistant', content: response.reply }]);
    } catch (err) {
      console.error("Copilot chat error:", err);
      setChatHistory(prev => [...prev, { role: 'assistant', content: '❌ Error: No se pudo conectar con el servidor de IA.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleUpdatePhenology = async (zoneId, plantingDate, currentStage) => {
    setUpdatingPhenology(true);
    try {
      await api.updateZonePhenology(zoneId, {
        planting_date: plantingDate,
        current_stage: currentStage
      });
      showFeedback("Ciclo fenológico actualizado correctamente.");
      await loadData(false);
    } catch (err) {
      console.error("Error updating phenology:", err);
    } finally {
      setUpdatingPhenology(false);
    }
  };


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-zinc-400 font-mono bg-[#09090b]">
        <div className="flex items-center gap-3">
          <Sprout className="animate-spin text-[#76B900]" size={28} />
          <span className="font-syne text-lg uppercase tracking-widest text-white glow-text-green">SISTEMA DIGITAL TWIN INICIALIZANDO...</span>
        </div>
        <span className="text-[10px] text-zinc-600 mt-2">CONECTANDO CON LA BASE DE DATOS Y REDES DE TELEMETRÍA</span>
      </div>
    );
  }

  // Count active actuators
  const allActuators = zones.flatMap(z => z.actuators || []);
  const activeActuatorsCount = allActuators.filter(a => a.is_on).length;

  const coPilotRecommendations = generateRecommendations();

  // Sandbox simulation mathematical calculations
  const projectedHealth = Math.round(
    Math.min(100, Math.max(0, systemHealth + (sandboxWater * 0.28) - (Math.abs(sandboxTemp) * 1.5)))
  );
  
  const projectedYield = Math.round(
    Math.min(100, Math.max(0, 88 + (sandboxWater * 0.22) - (Math.abs(sandboxTemp) * 1.7)))
  );

  return (
    <div className="space-y-6 text-left bg-[#09090b] min-h-screen">
      {/* Top Header Dashboard HUD */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-2">
        <div>
          <h2 className="font-syne font-bold text-3xl text-white tracking-tight glow-text-green">
            Control de Mando & Digital Twin
          </h2>
          <p className="text-zinc-500 text-xs font-mono mt-1">
            ESTACIÓN DE TRABAJO AGRO-ROBÓTICA // CANAL DE TELEMETRÍA ACTIVO
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-[#76B900]/10 border border-[#76B900]/20 rounded-full">
            <div className="w-2 h-2 rounded-full bg-[#76B900] animate-pulse" />
            <span className="text-[10px] text-white font-mono uppercase tracking-wider font-semibold">Simulador Activo</span>
          </div>
        </div>
      </div>

      {/* Dynamic Weather Integration (Feature 1) */}
      {weather && (
        <div className="glass-card p-4 border border-zinc-900 bg-[#09090b]/80 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-1 text-[8px] font-mono text-zinc-700 select-none">WEATHER CORE INTEGRATION</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            
            {/* Condition Icon and name */}
            <div className="flex items-center gap-3 border-r border-zinc-900/60 pr-4">
              <div className="p-2 bg-[#76B900]/10 border border-[#76B900]/20 rounded-lg text-[#76B900]">
                {weather.current.condition.includes("Lluvia") ? (
                  <CloudRain size={24} className="animate-bounce" />
                ) : (
                  <Sun size={24} className="text-yellow-500 animate-pulse" />
                )}
              </div>
              <div className="text-left font-mono">
                <span className="text-zinc-500 block uppercase text-[8px] font-bold">Clima Exterior</span>
                <span className="text-white font-bold text-sm block mt-0.5">{weather.current.condition}</span>
                <span className="text-[9px] text-zinc-400">Hora Sim: {weather.current.sim_hour}:00</span>
              </div>
            </div>

            {/* Weather values */}
            <div className="flex justify-around md:col-span-2 border-r border-zinc-900/60 pr-4">
              <div className="text-center font-mono">
                <span className="text-zinc-500 block uppercase text-[8px] font-bold">Temperatura</span>
                <span className="text-white font-bold text-sm block mt-0.5">{weather.current.temperature}°C</span>
              </div>
              <div className="text-center font-mono">
                <span className="text-zinc-500 block uppercase text-[8px] font-bold">Humedad Aire</span>
                <span className="text-white font-bold text-sm block mt-0.5">{weather.current.humidity}%</span>
              </div>
              <div className="text-center font-mono">
                <span className="text-zinc-500 block uppercase text-[8px] font-bold">Vel. Viento</span>
                <span className="text-white font-bold text-sm block mt-0.5">{weather.current.wind_speed} km/h</span>
              </div>
              <div className="text-center font-mono">
                <span className="text-zinc-500 block uppercase text-[8px] font-bold">Prob. Lluvia</span>
                <span className={`font-bold text-sm block mt-0.5 ${weather.current.rain_probability > 50 ? 'text-cyan-400 glow-text-cyan' : 'text-white'}`}>
                  {weather.current.rain_probability}%
                </span>
              </div>
            </div>

            {/* Forecats */}
            <div className="flex justify-between items-center gap-2 pr-2">
              {weather.forecast.map((f, i) => (
                <div key={i} className="text-center font-mono text-[9px] flex-1">
                  <span className="text-zinc-500 block font-bold">{f.time}</span>
                  <span className="text-white block font-semibold mt-0.5">{f.temperature}°C</span>
                  <span className="text-zinc-400 block truncate text-[8px] mt-0.5" title={f.condition}>{f.condition}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}


      {/* Main 65% / 35% Split Screen Workstation */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Side (65%): Vector Digital Twin interactive Farm Map */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-cyan-400" />
              <h3 className="font-syne font-bold text-lg text-white">Visualización de Campo (Digital Twin)</h3>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">Doble Clic para restablecer vista</span>
          </div>
          
          <FarmMap 
            zones={zones} 
            roverTelemetry={roverTelemetry} 
            onActuatorToggled={handleActuatorChange} 
          />
        </div>

        {/* Right Side (35%): TAC-HUD Dashboard Info Panels */}
        <div className="space-y-6">
          
          {/* Section 1: Aggregate Farm Health Badge & Brief Status */}
          <div className="glass-card p-6 flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-[9px] uppercase tracking-wider font-bold">
                <ShieldCheck size={12} className="text-[#76B900]" />
                <span>Salud Global</span>
              </div>
              <h3 className="font-syne font-bold text-lg text-white">Estado de Cultivos</h3>
              <p className="text-zinc-400 text-xs font-dm leading-relaxed">
                {systemHealth >= 80 
                  ? "Sectores estables. Parámetros biológicos óptimos verificados." 
                  : systemHealth >= 60 
                  ? "Atención requerida. Desviaciones leves detectadas en humedad o pH." 
                  : "ESTADO DE EMERGENCIA. Revise anomalías y conmute actuadores."}
              </p>
            </div>
            
            <div className="pl-4">
              <HealthScoreBadge value={systemHealth} size={90} />
            </div>
          </div>

          {/* Section 2: AgriAgent Co-Pilot Chat/Recommendation Panel (Feature 4) */}
          <div className="glass-card p-6 flex flex-col h-[320px] relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[#76B900] animate-pulse" />
                <span className="font-mono font-bold text-xs uppercase text-white">AgriAgent Co-Pilot</span>
              </div>
              <div className="flex gap-1 bg-zinc-950 p-0.5 rounded border border-zinc-900 text-[8px] font-mono select-none">
                <button 
                  onClick={() => setCopilotTab('recommendations')}
                  className={`px-2 py-0.5 rounded uppercase font-bold transition-all cursor-pointer ${copilotTab === 'recommendations' ? 'bg-[#76B900] text-black font-extrabold' : 'text-zinc-500 hover:text-white'}`}
                >
                  Alertas
                </button>
                <button 
                  onClick={() => setCopilotTab('chat')}
                  className={`px-2 py-0.5 rounded uppercase font-bold transition-all cursor-pointer ${copilotTab === 'chat' ? 'bg-[#76B900] text-black font-extrabold' : 'text-zinc-500 hover:text-white'}`}
                >
                  Chat
                </button>
              </div>
            </div>

            {/* Glowing command success banner */}
            {successMessage && (
              <div className="absolute inset-0 bg-[#09090b]/95 z-30 flex items-center justify-center p-4 transition-all duration-300">
                <div className="flex items-center gap-2 text-[#76B900] font-mono text-xs font-bold animate-bounce">
                  <Check size={18} />
                  <span>{successMessage}</span>
                </div>
              </div>
            )}

            {/* Scrollable container for tab contents */}
            <div className="flex-1 overflow-y-auto pr-1 mt-3 space-y-3 scrollbar-thin text-left">
              {copilotTab === 'recommendations' ? (
                // Recommendations view
                coPilotRecommendations.length === 0 ? (
                  <div className="p-4 bg-zinc-950/60 border border-zinc-900 rounded-lg flex items-start gap-3">
                    <ShieldCheck size={18} className="text-[#76B900] mt-0.5" />
                    <div className="text-left font-mono text-[10px]">
                      <div className="text-white font-bold uppercase">SISTEMA NOMINAL</div>
                      <div className="text-zinc-500 mt-1 leading-relaxed">
                        Todos los parámetros biológicos operando en rango óptimo. AgriRover patrullando sin anomalías.
                      </div>
                    </div>
                  </div>
                ) : (
                  coPilotRecommendations.map((rec) => (
                    <div 
                      key={rec.id} 
                      className={`p-3 bg-zinc-950/50 border rounded-lg space-y-2.5 text-left font-mono text-[10px] ${
                        rec.severity === 'critical' ? 'border-red-950/40 hover:border-red-500/20' : 'border-amber-950/40 hover:border-amber-500/20'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5 font-bold uppercase">
                          <span className={`w-1.5 h-1.5 rounded-full ${rec.severity === 'critical' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`} />
                          <span className={rec.severity === 'critical' ? 'text-red-400' : 'text-amber-400'}>
                            Recomendación en {rec.zoneName}
                          </span>
                        </div>
                        <div className="text-white mt-1 font-bold leading-normal">{rec.message}</div>
                        <div className="text-zinc-500 mt-0.5 leading-relaxed">{rec.suggestion}</div>
                      </div>
                      <button
                        onClick={() => handleExecuteRecommendation(rec)}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-[#76B900]/10 border border-[#76B900]/25 hover:bg-[#76B900] hover:text-black hover:border-[#76B900] text-[#76B900] font-bold uppercase text-[9px] rounded transition-all cursor-pointer"
                      >
                        {rec.actionType === 'actuator' ? <Activity size={10} /> : <ClipboardList size={10} />}
                        {rec.buttonLabel}
                      </button>
                    </div>
                  ))
                )
              ) : (
                // Live Chat view
                <div className="flex flex-col h-full space-y-2">
                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[160px] pr-1 font-mono text-[10px] leading-relaxed">
                    {chatHistory.map((chat, idx) => (
                      <div key={idx} className={`p-2.5 rounded-lg border ${
                        chat.role === 'user' 
                          ? 'bg-zinc-900/60 border-zinc-800 text-zinc-200 ml-6' 
                          : 'bg-[#162705]/20 border-[#76B900]/10 text-zinc-300 mr-6'
                      }`}>
                        <div className="font-bold text-[8px] uppercase tracking-wider mb-1 text-zinc-500">
                          {chat.role === 'user' ? '🧑 Agricultor' : '🤖 Copiloto AI'}
                        </div>
                        <div className="whitespace-pre-line leading-relaxed">{chat.content}</div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="p-2.5 bg-[#162705]/10 border border-[#76B900]/10 rounded-lg mr-6 flex items-center gap-2 text-zinc-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#76B900] animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#76B900] animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#76B900] animate-bounce" style={{ animationDelay: '300ms' }} />
                        <span className="text-[8px] uppercase tracking-wider">Pensando...</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Suggestion Chips */}
                  <div className="flex gap-1 overflow-x-auto py-1 scrollbar-none select-none">
                    {[
                      { label: "📋 Resumen", msg: "Resumen general de la finca" },
                      { label: "🌤️ Clima", msg: "clima" },
                      { label: "🚨 Alertas", msg: "alertas" },
                      { label: "🍅 Tomates", msg: "Estado del Sector Norte" }
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        disabled={chatLoading}
                        onClick={() => handleSendChatMessage(chip.msg)}
                        className="px-2 py-0.5 bg-zinc-950 border border-zinc-900 text-zinc-400 hover:text-[#76B900] hover:border-[#76B900]/30 rounded-full transition-all text-[8px] cursor-pointer whitespace-nowrap"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>

                  {/* Input form */}
                  <div className="flex items-center gap-1.5 mt-auto">
                    <input
                      type="text"
                      value={chatInput}
                      disabled={chatLoading}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSendChatMessage(); }}
                      placeholder="Preguntar al copiloto..."
                      className="flex-1 bg-zinc-950 border border-zinc-900 focus:border-[#76B900] focus:outline-none rounded px-2.5 py-1.5 text-[9px] font-mono text-zinc-300 placeholder-zinc-700"
                    />
                    <button
                      onClick={() => handleSendChatMessage()}
                      disabled={chatLoading}
                      className="px-3 py-1.5 bg-[#76B900] text-black hover:bg-[#8cd407] rounded text-[9px] font-mono font-bold uppercase transition-all cursor-pointer"
                    >
                      Enviar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>


          {/* Section 2.5: Live Crop Simulation Monitor */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#76B900] animate-pulse" />
                <span className="font-mono font-bold text-xs uppercase text-white">Emulación de Cultivo en Vivo</span>
              </div>
              <select
                value={selectedCamZone}
                onChange={(e) => setSelectedCamZone(Number(e.target.value))}
                className="bg-zinc-950 border border-zinc-900 rounded px-2 py-0.5 text-zinc-400 font-mono text-[9px] focus:outline-none focus:border-[#76B900] cursor-pointer"
              >
                <option value={0}>🍅 Sector Norte (Tomates)</option>
                <option value={1}>🥬 Sector Central (Lechugas)</option>
                <option value={2}>🌽 Sector Sur (Maíz)</option>
                <option value={3}>🌱 Eco-Sector (Bio-Insumos)</option>
              </select>
            </div>

            {/* Animated SVG Crop Emulation */}
            <div className="relative border border-zinc-800/60 bg-black rounded-lg overflow-hidden h-44 shadow-2xl"
              style={{ background: 'linear-gradient(to bottom, #050a02, #0a0a0a)' }}>
              <style>{`
                @keyframes camPlantSway { 0%,100%{transform:rotate(-3deg)} 50%{transform:rotate(3deg)} }
                @keyframes camWaterDrop { 0%{transform:translateY(0);opacity:.8} 100%{transform:translateY(10px);opacity:0} }
                @keyframes camPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
              `}</style>

              <svg width="100%" height="100%" viewBox="0 0 320 176" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="cam-soil-g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2e1907" />
                    <stop offset="100%" stopColor="#0c0702" />
                  </linearGradient>
                  <linearGradient id="cam-leaf-g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1c4a1c" />
                    <stop offset="100%" stopColor="#0a1c0a" />
                  </linearGradient>
                  <radialGradient id="cam-amb-0" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#dc2626" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="cam-amb-1" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="cam-amb-2" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="cam-amb-3" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Ambient zone tint */}
                <rect width="320" height="176" fill={`url(#cam-amb-${selectedCamZone})`} />

                {/* Subtle grid */}
                <g stroke="rgba(255,255,255,0.03)" strokeWidth="1">
                  {[40,80,120,160,200,240,280].map(x => <line key={x} x1={x} y1="0" x2={x} y2="176"/>)}
                  {[44,88,132].map(y => <line key={y} x1="0" y1={y} x2="320" y2={y}/>)}
                </g>

                {/* Soil bed */}
                <rect x="0" y="120" width="320" height="56" fill="url(#cam-soil-g)" opacity="0.7" />

                {/* TOMATOES */}
                {selectedCamZone === 0 && [30,65,100,135,170,205,240,275,290].map((px,i) => {
                  const isWatered = zones[0]?.actuators?.some(a => a.is_on);
                  const h = 65 + (i%3)*10;
                  return (
                    <g key={i} style={{transformOrigin:`${px}px 120px`, animation:`camPlantSway ${3.5+i*0.3}s infinite ease-in-out`, animationDelay:`${i*0.2}s`}}>
                      <line x1={px} y1="120" x2={px} y2={120-h} stroke="#15803d" strokeWidth="2" strokeLinecap="round"/>
                      <ellipse cx={px-7} cy={120-h*0.5} rx="8" ry="3.5" fill="#16a34a" opacity="0.9" transform={`rotate(-25,${px-7},${120-h*0.5})`}/>
                      <ellipse cx={px+7} cy={120-h*0.55} rx="8" ry="3.5" fill="#16a34a" opacity="0.9" transform={`rotate(25,${px+7},${120-h*0.55})`}/>
                      <ellipse cx={px-5} cy={120-h*0.78} rx="6" ry="3" fill="#22c55e" opacity="0.85" transform={`rotate(-20,${px-5},${120-h*0.78})`}/>
                      <circle cx={px} cy={120-h+4} r="5" fill="#dc2626" style={{filter:'drop-shadow(0 0 4px #dc262680)'}}/>
                      <circle cx={px-9} cy={120-h*0.78} r="3.5" fill="#ef4444" opacity="0.8"/>
                      <circle cx={px+8} cy={120-h*0.68} r="3" fill="#f97316" opacity="0.7"/>
                      {isWatered && <circle cx={px} cy={120-h*0.3} r="1.2" fill="#38bdf8" opacity="0.7" style={{animation:`camWaterDrop 1.5s infinite`,animationDelay:`${i*0.2}s`}}/>}
                    </g>
                  );
                })}

                {/* LETTUCES */}
                {selectedCamZone === 1 && [
                  {px:30,py:100},{px:72,py:95},{px:114,py:102},{px:156,py:93},{px:198,py:100},
                  {px:240,py:95},{px:282,py:102},{px:51,py:118},{px:93,py:115},{px:135,py:120},
                  {px:177,py:113},{px:219,py:118},{px:261,py:115},{px:300,py:120}
                ].map((h,i) => {
                  const isWatered = zones[1]?.actuators?.some(a => a.is_on);
                  const r = 12 + (i%3)*2;
                  const g = ['#4ade80','#22c55e','#86efac'][i%3];
                  return (
                    <g key={i} style={{transformOrigin:`${h.px}px ${h.py}px`, animation:`camPulse ${4+i*0.3}s infinite ease-in-out`, animationDelay:`${i*0.25}s`}}>
                      <ellipse cx={h.px} cy={h.py} rx={r*1.5} ry={r} fill={g} opacity="0.8"/>
                      <ellipse cx={h.px} cy={h.py} rx={r*1.1} ry={r*0.75} fill="#86efac" opacity="0.85"/>
                      <ellipse cx={h.px} cy={h.py} rx={r*0.45} ry={r*0.35} fill="#ecfdf5" opacity="0.65"/>
                      {isWatered && i%4===0 && <circle cx={h.px+r*0.4} cy={h.py-r*0.9} r="1" fill="#38bdf8" opacity="0.7" style={{animation:`camWaterDrop 2s infinite`,animationDelay:`${i*0.2}s`}}/>}
                    </g>
                  );
                })}

                {/* CORN */}
                {selectedCamZone === 2 && Array.from({length:13},(_,i)=>({px:14+i*23, h:70+(i%4)*12, delay:i*0.15})).map((s,i) => {
                  const isVentilated = zones[2]?.actuators?.some(a => a.is_on);
                  const base = 120, top = base - s.h;
                  return (
                    <g key={i} style={{transformOrigin:`${s.px}px ${base}px`, animation:`camPlantSway ${4+i*0.15}s infinite ease-in-out`, animationDelay:`${s.delay}s`}}>
                      <line x1={s.px} y1={base} x2={s.px} y2={top} stroke="#15803d" strokeWidth="2" strokeLinecap="round"/>
                      <rect x={s.px-3} y={top+s.h*0.25} width="6" height="14" rx="3" fill="#f59e0b" opacity="0.9" style={{filter:'drop-shadow(0 0 3px #f59e0b60)'}}/>
                      <path d={`M ${s.px} ${top+s.h*0.45} Q ${s.px-14} ${top+s.h*0.35} ${s.px-16} ${top+s.h*0.55}`} stroke="#22c55e" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.85"/>
                      <path d={`M ${s.px} ${top+s.h*0.65} Q ${s.px+14} ${top+s.h*0.55} ${s.px+15} ${top+s.h*0.75}`} stroke="#22c55e" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.85"/>
                      <path d={`M ${s.px} ${top} Q ${s.px+3} ${top-6} ${s.px+5} ${top-12}`} stroke="#fde68a" strokeWidth="1.2" fill="none" opacity="0.8"/>
                      {isVentilated && i%3===0 && <path d={`M ${s.px-18} ${top+s.h*0.3} Q ${s.px-6} ${top+s.h*0.25} ${s.px+4} ${top+s.h*0.35}`} stroke="rgba(147,197,253,0.4)" strokeWidth="1" strokeDasharray="3 2" fill="none" style={{animation:'camWaterDrop 1.2s infinite',animationDelay:`${i*0.1}s`}}/>}
                    </g>
                  );
                })}

                {/* ECO-SECTOR */}
                {selectedCamZone === 3 && (
                  <g>
                    {/* Worm oscilloscope */}
                    <rect x="60" y="50" width="90" height="55" fill="rgba(12,12,16,0.9)" stroke="#22d3ee" strokeWidth="1.5" rx="5" style={{filter:'drop-shadow(0 0 6px rgba(34,211,238,0.3))'}}/>
                    <text x="105" y="68" fill="#22d3ee" fontSize="7" fontFamily="JetBrains Mono" textAnchor="middle" fontWeight="bold">VERMI BIOREACTOR</text>
                    <path d="M 70,88 Q 80,72 90,88 T 110,88 T 130,88 T 145,88" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" style={{animation:'camPlantSway 2s infinite ease-in-out',transformOrigin:'107px 88px',filter:'drop-shadow(0 0 4px rgba(34,211,238,0.8))'}}/>
                    <text x="105" y="99" fill="rgba(34,211,238,0.4)" fontSize="5.5" fontFamily="JetBrains Mono" textAnchor="middle">ACTIVIDAD: ÓPTIMA</text>
                    {/* Compost dome */}
                    <ellipse cx="220" cy="140" rx="55" ry="14" fill="rgba(249,115,22,0.25)" style={{filter:'blur(4px)'}}/>
                    <path d="M 165,140 Q 220,85 275,140 Z" fill="#ca8a04" stroke="rgba(249,115,22,0.4)" strokeWidth="1" opacity="0.85"/>
                    <path d="M 175,140 Q 220,95 265,140 Z" fill="#facc15" opacity="0.4"/>
                    <path d="M 205,112 Q 202,96 205,80" stroke="rgba(34,211,238,0.5)" strokeWidth="1.8" fill="none" strokeLinecap="round" style={{animation:'camWaterDrop 2s infinite reverse',animationDelay:'0s'}}/>
                    <path d="M 220,105 Q 224,88 220,70" stroke="rgba(34,211,238,0.5)" strokeWidth="1.8" fill="none" strokeLinecap="round" style={{animation:'camWaterDrop 2.4s infinite reverse',animationDelay:'0.4s'}}/>
                    <path d="M 235,112 Q 238,96 235,80" stroke="rgba(34,211,238,0.4)" strokeWidth="1.5" fill="none" strokeLinecap="round" style={{animation:'camWaterDrop 2s infinite reverse',animationDelay:'0.8s'}}/>
                    <text x="220" y="137" fill="rgba(249,115,22,0.5)" fontSize="6" fontFamily="JetBrains Mono" textAnchor="middle" fontWeight="bold">THERMO COMPOST</text>
                  </g>
                )}
              </svg>

              {/* Emulation HUD overlays */}
              <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-black/70 px-2 py-0.5 rounded border border-[#76B900]/30 font-mono text-[8px] font-bold text-[#76B900]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#76B900] animate-pulse" />
                <span>SVG SIM LIVE</span>
              </div>
              <div className="absolute top-2 right-2 z-10 bg-black/70 px-2 py-0.5 rounded border border-zinc-800 text-cyan-400 font-mono text-[8px] font-bold">
                TWIN ENGINE v2.0
              </div>
              <div className="absolute bottom-2 left-2 z-10 bg-black/75 p-1.5 rounded border border-zinc-900/60 font-mono text-[8px] text-zinc-400 text-left space-y-0.5 leading-none">
                <div className="text-white font-bold">
                  {['ZONA_NORTE_TOMATES', 'ZONA_CENTRAL_LECHUGAS', 'ZONA_SUR_MAIZ', 'ECO_BIOINSUMOS'][selectedCamZone]}
                </div>
                <div>MOTOR: SVG ANIMADO</div>
              </div>
              <div className="absolute bottom-2 right-2 z-10 bg-black/75 p-1.5 rounded border border-zinc-900/60 font-mono text-[8px] text-[#76B900] text-right space-y-0.5 leading-none">
                <div className="font-bold text-white">{liveTime}</div>
                <div className="text-cyan-400">STATUS: EMULANDO</div>
              </div>
            </div>
          </div>

          {/* Section 2.7: Módulo de Calendario Fenológico (Feature 2) */}
          {zones[selectedCamZone] && (() => {
            const selectedZone = zones[selectedCamZone];
            return (
              <div className="glass-card p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                  <div className="flex items-center gap-2">
                    <Sprout size={16} className="text-[#76B900]" />
                    <span className="font-mono font-bold text-xs uppercase text-white">Calendario Fenológico</span>
                  </div>
                  <span className="text-[9px] font-mono text-[#76B900] bg-[#76B900]/10 px-2 py-0.5 rounded uppercase font-bold border border-[#76B900]/25">
                    Ciclo de Cultivo
                  </span>
                </div>

                {/* Zone / Crop details */}
                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400">
                  <div>
                    <span className="text-zinc-500 uppercase text-[8px] font-bold block">Zona</span>
                    <span className="text-white font-bold">{selectedZone.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-zinc-500 uppercase text-[8px] font-bold block">Variedad</span>
                    <span className="text-white font-bold">{selectedZone.crop_type}</span>
                  </div>
                </div>

                {/* Stepper Steps */}
                <div className="flex justify-between items-center relative py-4 px-1">
                  <div className="absolute left-1 right-1 h-[2px] bg-zinc-900 top-1/2 -translate-y-1/2 z-0" />
                  {["Germinación", "Crecimiento Vegetativo", "Floración", "Fructificación", "Madurez"].map((stage, idx) => {
                    const stages = ["Germinación", "Crecimiento Vegetativo", "Floración", "Fructificación", "Madurez"];
                    const currentIdx = stages.indexOf(selectedZone.current_stage || "Germinación");
                    const isCompleted = idx < currentIdx;
                    const isActive = idx === currentIdx;
                    
                    return (
                      <button
                        key={stage}
                        disabled={updatingPhenology}
                        onClick={() => handleUpdatePhenology(selectedZone.id, selectedZone.planting_date, stage)}
                        title={`Cambiar a etapa: ${stage}`}
                        className="relative z-10 flex flex-col items-center group cursor-pointer focus:outline-none"
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border font-mono text-[9px] font-bold transition-all duration-300 ${
                          isCompleted 
                            ? 'bg-[#76B900] border-[#76B900] text-black shadow-[0_0_8px_rgba(118,185,0,0.3)]' 
                            : isActive 
                            ? 'bg-black border-[#76B900] text-[#76B900] shadow-[0_0_12px_rgba(118,185,0,0.6)] animate-pulse' 
                            : 'bg-zinc-950 border-zinc-800 text-zinc-600'
                        }`}>
                          {idx + 1}
                        </div>
                        <span className={`absolute top-6 text-[7px] font-mono tracking-tighter whitespace-nowrap text-center transition-all ${isActive ? 'text-[#76B900] font-bold scale-105' : 'text-zinc-500 opacity-60 group-hover:opacity-100'}`}>
                          {stage.split(" ")[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Chronology info and trigger */}
                <div className="flex justify-between items-center text-[10px] font-mono border-t border-zinc-900/60 pt-3 text-zinc-400">
                  <div>
                    <span className="text-zinc-500 uppercase text-[8px] font-bold block">Siembra</span>
                    <span className="text-white font-bold">
                      {selectedZone.planting_date ? new Date(selectedZone.planting_date).toLocaleDateString() : 'Sin registrar'}
                    </span>
                  </div>
                  <button
                    disabled={updatingPhenology}
                    onClick={() => {
                      const daysAgo = prompt("¿Cuántos días hace que se sembró el cultivo? (Ej: 0 para hoy, 15 para hace 15 días)", "0");
                      if (daysAgo !== null) {
                        const days = parseInt(daysAgo);
                        if (!isNaN(days)) {
                          const date = new Date();
                          date.setDate(date.getDate() - days);
                          handleUpdatePhenology(selectedZone.id, date.toISOString(), selectedZone.current_stage || "Germinación");
                        }
                      }
                    }}
                    className="px-2 py-1 bg-zinc-950 border border-zinc-900 rounded text-zinc-400 hover:text-white hover:border-[#76B900]/40 transition-all cursor-pointer text-[8px] uppercase tracking-wider font-semibold font-mono"
                  >
                    Cambiar Fecha
                  </button>
                </div>

                {/* Agronomic tips based on stage */}
                <div className="p-2.5 bg-[#76B900]/5 border border-[#76B900]/10 rounded font-mono text-[9px] leading-relaxed text-left text-zinc-400">
                  <span className="font-bold text-[#76B900] uppercase block text-[8px] mb-0.5">Asistencia de Ciclo</span>
                  {selectedZone.current_stage === "Germinación" && "Fase inicial. Requiere humedad constante y controlada (60-70%). Evitar encharcamientos."}
                  {selectedZone.current_stage === "Crecimiento Vegetativo" && "Crecimiento de brotes. Mantener buena iluminación y nutrición regular para el desarrollo foliar."}
                  {selectedZone.current_stage === "Floración" && "Fase reproductiva. Reducir ligeramente el riego para evitar hongos y favorecer la polinización."}
                  {selectedZone.current_stage === "Fructificación" && "Fase crítica de llenado. Demanda hídrica alta. Evitar cambios drásticos en humedad de suelo."}
                  {selectedZone.current_stage === "Madurez" && "Cosecha próxima. Reducir paulatinamente el riego para concentrar azúcares y facilitar recolección."}
                </div>
              </div>
            );
          })()}


          {/* Section 2.8: Sandbox Simulation Mode ("What-If" Analysis) */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <div className="flex items-center gap-2">
                <Sliders size={16} className="text-purple-400" />
                <span className="font-mono font-bold text-xs uppercase text-white">Simulador Predictivo Sandbox</span>
              </div>
              <span className="text-[9px] font-mono text-purple-400 bg-purple-950/20 px-2 py-0.5 rounded uppercase font-bold border border-purple-950">
                WHAT-IF MODE
              </span>
            </div>

            {/* Sliders */}
            <div className="space-y-3 font-mono text-[9px] text-left">
              <div className="space-y-1">
                <div className="flex justify-between font-bold text-zinc-400">
                  <span>AJUSTE RIEGO GOTEO</span>
                  <span className={`font-mono ${sandboxWater >= 0 ? 'text-cyan-400 font-bold' : 'text-red-400 font-bold'}`}>
                    {sandboxWater >= 0 ? `+${sandboxWater}%` : `${sandboxWater}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={sandboxWater}
                  onChange={(e) => setSandboxWater(Number(e.target.value))}
                  className="tech-slider cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-bold text-zinc-400">
                  <span>AJUSTE TEMPERATURA SECTOR</span>
                  <span className={`font-mono ${sandboxTemp >= 0 ? 'text-[#76B900] font-bold' : 'text-cyan-400 font-bold'}`}>
                    {sandboxTemp >= 0 ? `+${sandboxTemp}°C` : `${sandboxTemp}°C`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  value={sandboxTemp}
                  onChange={(e) => setSandboxTemp(Number(e.target.value))}
                  className="tech-slider cursor-pointer"
                />
              </div>
            </div>

            {/* Simulated Dynamic outputs */}
            <div className="grid grid-cols-2 gap-3 text-left font-mono text-[10px] pt-1">
              <div className="bg-zinc-950/50 border border-zinc-900/60 rounded p-2.5 space-y-1">
                <span className="text-zinc-500 block text-[8px] uppercase font-bold">Salud Proyectada</span>
                <div className="flex items-center justify-between">
                  <span className={`font-bold text-base ${projectedHealth >= 80 ? 'text-[#76B900]' : projectedHealth >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                    {projectedHealth}%
                  </span>
                  <span className="text-[7px] text-zinc-600">FUTURA</span>
                </div>
                <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-[#76B900]" style={{ width: `${projectedHealth}%`, transition: 'width 0.3s ease' }} />
                </div>
              </div>

              <div className="bg-zinc-950/50 border border-zinc-900/60 rounded p-2.5 space-y-1">
                <span className="text-zinc-500 block text-[8px] uppercase font-bold">Rendimiento Cosecha</span>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#00ffcc] text-base">{projectedYield}%</span>
                  <span className="text-[7px] text-zinc-600">ESTIMADO</span>
                </div>
                <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400" style={{ width: `${projectedYield}%`, transition: 'width 0.3s ease' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2.9: AgriRover Autonomous Navigation Console LOGS */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <div className="flex items-center gap-2">
                <Terminal size={16} className="text-cyan-400" />
                <span className="font-mono font-bold text-xs uppercase text-white">Terminal AgriRover-1</span>
              </div>
              <div className="flex items-center gap-1 text-[9px] font-mono text-zinc-500">
                <Activity size={10} className="animate-pulse text-cyan-400" />
                <span>NAV SYSTEM ONLINE</span>
              </div>
            </div>

            {/* Simulated Live Console logs */}
            <div className="bg-[#030303]/60 border border-zinc-900 rounded p-3 font-mono text-[10px] text-cyan-400 h-40 overflow-y-auto space-y-1.5 scrollbar-thin">
              {roverTelemetry?.logs?.map((log, i) => (
                <div key={i} className="leading-relaxed border-l-2 border-cyan-500/25 pl-1.5 py-0.5 text-left">
                  {log}
                </div>
              ))}
              {(!roverTelemetry || !roverTelemetry.logs?.length) && (
                <div className="text-zinc-600 text-center py-10">ESPERANDO TELEMETRÍA DEL VEHÍCULO...</div>
              )}
            </div>
            
            {/* Rover Quick Summary */}
            <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
              <div className="bg-zinc-950/50 border border-zinc-900/60 rounded p-2.5">
                <span className="text-zinc-500 block uppercase text-[8px] font-bold">Régimen Motor</span>
                <span className="text-white font-bold block mt-0.5">
                  {roverTelemetry?.speed > 0 ? `AVANCE (${roverTelemetry.speed} m/s)` : 'DETENIDO'}
                </span>
              </div>
              <div className="bg-zinc-950/50 border border-zinc-900/60 rounded p-2.5">
                <span className="text-zinc-500 block uppercase text-[8px] font-bold">Orientación</span>
                <span className="text-white font-bold block mt-0.5">{roverTelemetry?.heading}° (Heading)</span>
              </div>
            </div>
          </div>

          {/* Section 3: Physical Actuators Live States Summary */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <div className="flex items-center gap-2">
                <Sliders size={16} className="text-[#76B900]" />
                <span className="font-mono font-bold text-xs uppercase text-white">Actuadores Físicos</span>
              </div>
              <span className="font-mono text-[10px] text-[#76B900] bg-[#76B900]/10 px-2 py-0.5 rounded border border-[#76B900]/20 font-bold">
                {activeActuatorsCount} ACTIVOS
              </span>
            </div>

            <div className="space-y-2.5 max-h-36 overflow-y-auto pr-1">
              {allActuators.map(actuator => (
                <div 
                  key={`actuator-hud-${actuator.id}`}
                  className="flex items-center justify-between bg-zinc-950/50 border border-zinc-900/60 hover:border-zinc-800 rounded px-3 py-2 transition-all"
                >
                  <div className="text-left font-mono">
                    <div className="text-xs text-white font-bold">{actuator.name}</div>
                    <div className="text-[8px] text-zinc-500 uppercase tracking-widest mt-0.5">
                      {actuator.type.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${actuator.is_on ? 'bg-[#76B900] animate-pulse' : 'bg-zinc-800'}`} />
                    <span className={`text-[10px] font-mono font-bold ${actuator.is_on ? 'text-[#76B900]' : 'text-zinc-500'}`}>
                      {actuator.is_on ? 'ON' : 'OFF'}
                    </span>
                  </div>
                </div>
              ))}
              {allActuators.length === 0 && (
                <div className="text-center py-6 text-zinc-600 font-mono text-[10px]">SIN DISPOSITIVOS CONECTADOS</div>
              )}
            </div>
          </div>

          {/* Section 4: Live Core Standard ALERTS */}
          {activeAlerts.length > 0 && (
            <div className="glass-card border-red-500/15 bg-red-950/5 hover:border-red-500/30 p-6 space-y-3">
              <div className="flex items-center gap-2 border-b border-red-950 pb-2 text-red-400 text-left">
                <AlertTriangle size={16} />
                <span className="font-mono font-bold text-xs uppercase">Alertas Activas ({activeAlerts.length})</span>
              </div>
              <div className="space-y-2 text-[10px] font-mono text-left max-h-36 overflow-y-auto">
                {activeAlerts.map(alert => (
                  <div key={alert.id} className="p-2 bg-red-950/20 border border-red-500/10 rounded flex justify-between items-start gap-2">
                    <div>
                      <span className="text-red-400 font-bold uppercase text-[9px] block">CRÍTICO: {alert.rule_name}</span>
                      <span className="text-zinc-300 text-xs mt-0.5 block">{alert.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
