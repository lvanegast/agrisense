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

  // ESP32-CAM and High-Precision Clock
  const [selectedCamZone, setSelectedCamZone] = useState(0);
  const [liveTime, setLiveTime] = useState('');

  // Sandbox simulation states
  const [sandboxWater, setSandboxWater] = useState(0);
  const [sandboxTemp, setSandboxTemp] = useState(0);

  // Dynamic success notice when executing Co-Pilot commands
  const [successMessage, setSuccessMessage] = useState(null);

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
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-4">
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

          {/* Section 2: AgriAgent Co-Pilot (Agentic UI) */}
          <div className="glass-card p-6 space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[#76B900] animate-pulse" />
                <span className="font-mono font-bold text-xs uppercase text-white">AgriAgent Co-Pilot</span>
              </div>
              <span className="text-[9px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded uppercase font-bold">
                Asistente Activo
              </span>
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

            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {coPilotRecommendations.length === 0 ? (
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
              )}
            </div>
          </div>

          {/* Section 2.5: ESP32-CAM CCTV Live Stream */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-mono font-bold text-xs uppercase text-white">Canal de Cámara IoT (ESP32-CAM)</span>
              </div>
              <select
                value={selectedCamZone}
                onChange={(e) => setSelectedCamZone(Number(e.target.value))}
                className="bg-zinc-950 border border-zinc-900 rounded px-2 py-0.5 text-zinc-400 font-mono text-[9px] focus:outline-none focus:border-[#76B900] cursor-pointer"
              >
                <option value={0}>Sector Norte (Tomates)</option>
                <option value={1}>Sector Central (Lechugas)</option>
                <option value={2}>Sector Sur (Maíz)</option>
                <option value={3}>Eco-Sector (Bio-Insumos)</option>
              </select>
            </div>

            <div className="relative border border-zinc-900 bg-black rounded-lg overflow-hidden h-44 shadow-2xl scanlines">
              {/* CCTV Feed Image */}
              <img
                src={selectedCamZone === 0 ? "/tomato_cam.png" : selectedCamZone === 1 ? "/lettuce_cam.png" : selectedCamZone === 2 ? "/corn_cam.png" : "/lettuce_cam.png"}
                alt="ESP32-CAM Live Feed"
                className="w-full h-full object-cover opacity-85"
              />

              {/* Red REC overlay */}
              <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded border border-red-500/30 text-red-500 font-mono text-[8px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span>● LIVE REC</span>
              </div>

              {/* Signal and status overlay */}
              <div className="absolute top-2 right-2 z-10 bg-black/60 px-2 py-0.5 rounded border border-zinc-800 text-[#76B900] font-mono text-[8px] font-bold">
                WIFI: 94% (RSSI -52dBm)
              </div>

              {/* Running timestamp and resolution bottom left */}
              <div className="absolute bottom-2 left-2 z-10 bg-black/75 p-2.5 rounded border border-zinc-900/60 font-mono text-[8px] text-zinc-400 text-left space-y-0.5 leading-none">
                <div className="text-white font-bold">
                  {selectedCamZone === 0 ? "CAM_01_NORTE_TOMATE" : selectedCamZone === 1 ? "CAM_02_CENTRAL_LECHUGA" : selectedCamZone === 2 ? "CAM_03_SUR_MAIZ" : "CAM_04_ECO_BIOINSUMOS"}
                </div>
                <div>RES: 1280x720 HD @ 24fps</div>
                <div>EXPOSURE: AUT +0.3EV</div>
              </div>

              {/* Chip Temperature and Exposure bottom right */}
              <div className="absolute bottom-2 right-2 z-10 bg-black/75 p-2.5 rounded border border-zinc-900/60 font-mono text-[8px] text-[#76B900] text-right space-y-0.5 leading-none">
                <div className="font-bold text-white">{liveTime}</div>
                <div>CHIP TEMP: 41.6°C</div>
                <div className="text-cyan-400">STATUS: NOMINAL</div>
              </div>
            </div>
          </div>

          {/* Section 2.7: Fusión de Clima Local y Datos Atmosféricos */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <div className="flex items-center gap-2">
                <CloudRain size={16} className="text-cyan-400" />
                <span className="font-mono font-bold text-xs uppercase text-white">Clima Local & Fusión de Datos</span>
              </div>
              <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/20 px-2 py-0.5 rounded uppercase font-bold border border-cyan-950">
                Atmósfera Exterior
              </span>
            </div>

            {/* Weather Metrics */}
            <div className="grid grid-cols-3 gap-2 font-mono text-[9px]">
              <div className="bg-zinc-950/50 border border-zinc-900/60 rounded p-2 text-center">
                <span className="text-zinc-500 block text-[7px] uppercase font-bold">Temp. Aire</span>
                <span className="text-white font-bold block mt-1 flex items-center justify-center gap-1">
                  <Sun size={10} className="text-amber-500" />
                  29.4°C
                </span>
              </div>
              <div className="bg-zinc-950/50 border border-zinc-900/60 rounded p-2 text-center">
                <span className="text-zinc-500 block text-[7px] uppercase font-bold">Prob. Lluvia</span>
                <span className="text-cyan-400 font-bold block mt-1 flex items-center justify-center gap-1">
                  <CloudRain size={10} className="text-cyan-400" />
                  80%
                </span>
              </div>
              <div className="bg-zinc-950/50 border border-zinc-900/60 rounded p-2 text-center">
                <span className="text-zinc-500 block text-[7px] uppercase font-bold">Viento</span>
                <span className="text-white font-bold block mt-1 flex items-center justify-center gap-1">
                  <Wind size={10} className="text-zinc-400" />
                  12.5 km/h
                </span>
              </div>
            </div>

            {/* Weather optimization recommendations based on soil readings */}
            <div className="p-2.5 bg-cyan-950/10 border border-cyan-900/20 rounded font-mono text-[9px] leading-relaxed text-left text-cyan-400 flex gap-2">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block uppercase text-[8px] mb-0.5">ALERTA DE FUSIÓN OPTIMIZADA</span>
                Probabilidad de lluvia del 80% mañana. Se sugiere aplazar riego programado en Sector Sur (Campo Maíz) para prevenir sobre-saturación y optimizar consumo hídrico.
              </div>
            </div>
          </div>

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
