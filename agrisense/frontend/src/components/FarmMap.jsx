import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Cpu, 
  Zap, 
  Navigation,
  Loader2,
  Settings,
  Activity
} from 'lucide-react';

export default function FarmMap({ zones, roverTelemetry, onActuatorToggled }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredSensor, setHoveredSensor] = useState(null);
  const [hoveredActuator, setHoveredActuator] = useState(null);
  const [hoveredZone, setHoveredZone] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [fps, setFps] = useState(60);

  const mapRef = useRef(null);

  // Fluctuating FPS to simulate live telemetry rendering
  useEffect(() => {
    const interval = setInterval(() => {
      setFps((prev) => +(60 + (Math.random() * 1 - 0.5)).toFixed(1));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // SVG dimensions
  const mapWidth = 800;
  const mapHeight = 600;

  // Zoom/Pan controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.75));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Map zone locations to SVG polygons
  // North Zone (Index 0), Central Zone (Index 1), South Zone (Index 2), Eco-Sector (Index 3)
  const zonePolygons = [
    {
      id: 0,
      label: "Sector Norte (Tomates)",
      center: { x: 400, y: 135 },
      // Isometric slab faces points
      faces: {
        top: "80,60 720,60 670,210 130,210",
        front: "130,210 670,210 670,222 130,222",
        left: "80,60 130,210 130,222 80,72",
        right: "720,60 670,210 670,222 720,72",
        shadow: "70,72 730,72 680,222 120,222"
      }
    },
    {
      id: 1,
      label: "Sector Central (Lechugas)",
      center: { x: 400, y: 305 },
      faces: {
        top: "130,230 670,230 620,380 180,380",
        front: "180,380 620,380 620,392 180,392",
        left: "130,230 180,380 180,392 130,242",
        right: "670,230 620,380 620,392 670,242",
        shadow: "120,242 680,242 630,392 170,392"
      }
    },
    {
      id: 2,
      label: "Sector Sur (Maíz)",
      center: { x: 400, y: 475 },
      faces: {
        top: "180,400 620,400 570,550 230,550",
        front: "230,550 570,550 570,562 230,562",
        left: "180,400 230,550 230,562 180,412",
        right: "620,400 570,550 570,562 620,412",
        shadow: "170,412 630,412 580,562 220,562"
      }
    },
    {
      id: 3,
      label: "Eco-Sector (Bio-Insumos)",
      center: { x: 105, y: 485 },
      faces: {
        top: "45,410 165,410 165,560 45,560",
        front: "45,560 165,560 165,572 45,572",
        left: "45,410 45,560 45,572 45,422",
        right: "165,410 165,560 165,572 165,422",
        shadow: "35,422 175,422 175,572 35,572"
      }
    }
  ];

  // Specific sensor coordinates mapping inside the 800x600 grid
  const getSensorCoords = (type, zoneIndex, idx) => {
    if (zoneIndex === 0) { // Sector Norte
      if (idx === 0) return { x: 220, y: 120 }; // Temp
      if (idx === 1) return { x: 400, y: 100 }; // Hum. Suelo
      return { x: 580, y: 120 }; // pH
    } else if (zoneIndex === 1) { // Sector Central
      if (idx === 0) return { x: 280, y: 290 }; // Temp
      if (idx === 1) return { x: 400, y: 270 }; // Hum. Ambiente
      return { x: 520, y: 290 }; // Luz
    } else if (zoneIndex === 2) { // Sector Sur
      if (idx === 0) return { x: 310, y: 460 }; // Temp
      if (idx === 1) return { x: 400, y: 490 }; // Hum. Suelo
      return { x: 490, y: 460 }; // pH
    } else { // Eco-Sector
      if (idx === 0) return { x: 75, y: 435 }; // Temp Lombrices
      if (idx === 1) return { x: 105, y: 435 }; // Hum Lombrices
      if (idx === 2) return { x: 135, y: 435 }; // pH Lombrices
      if (idx === 3) return { x: 75, y: 535 }; // Temp Compost
      return { x: 135, y: 535 }; // Oxígeno Compost
    }
  };

  // Specific actuator coordinates mapping
  const getActuatorCoords = (type, zoneIndex, idx) => {
    if (zoneIndex === 0) { // Sector Norte
      return idx === 0 ? { x: 150, y: 150 } : { x: 650, y: 150 };
    } else if (zoneIndex === 1) { // Sector Central
      return { x: 600, y: 310 };
    } else if (zoneIndex === 2) { // Sector Sur
      return { x: 250, y: 480 };
    } else { // Eco-Sector
      return idx === 0 ? { x: 60, y: 485 } : { x: 150, y: 485 };
    }
  };

  const getLedColor = (score, isEco = false) => {
    if (isEco) return "#22d3ee"; // Cyan default for high-tech eco sector
    if (score >= 70) return "#76B900"; // Sprout green
    if (score >= 40) return "#f59e0b"; // Alert Amber
    return "#ef4444"; // Alert Red
  };

  // Convert Rover percentage coordinates (0-100) to SVG coordinates (800x600)
  const roverX = roverTelemetry ? (roverTelemetry.x / 100) * mapWidth : 0;
  const roverY = roverTelemetry ? (roverTelemetry.y / 100) * mapHeight : 0;
  
  // Rover Waypoints coordinates in SVG space
  const roverPathPoints = [
    { x: 0.25 * mapWidth, y: 0.25 * mapHeight },
    { x: 0.50 * mapWidth, y: 0.25 * mapHeight },
    { x: 0.50 * mapWidth, y: 0.50 * mapHeight },
    { x: 0.75 * mapWidth, y: 0.50 * mapHeight },
    { x: 0.75 * mapWidth, y: 0.75 * mapHeight },
    { x: 0.25 * mapWidth, y: 0.75 * mapHeight },
  ];

  // Render high-fidelity realistic overlay elements (mist, steam, oscilloscope)
  const renderWeatherOverlay = (zoneId, isActuatorActive) => {
    if (zoneId === 0) { // Norte: Mist / Neblina de riego
      return (
        <g style={{ pointerEvents: 'none' }}>
          {isActuatorActive && (
            <>
              {/* Volumetric mist layout */}
              <ellipse cx="400" cy="135" rx="220" ry="45" fill="url(#mist-grad)" opacity="0.45" className="animate-pulse" />
              {/* Falling fine rain droplets over the real tomato render */}
              <g opacity="0.7" stroke="#22d3ee" strokeWidth="1" strokeLinecap="round" className="animate-pulse">
                <line x1="240" y1="90" x2="236" y2="105" />
                <line x1="380" y1="80" x2="376" y2="95" />
                <line x1="520" y1="90" x2="516" y2="105" />
                <line x1="300" y1="120" x2="296" y2="135" />
                <line x1="480" y1="110" x2="476" y2="125" />
                <line x1="600" y1="95" x2="596" y2="110" />
              </g>
            </>
          )}
        </g>
      );
    } else if (zoneId === 1) { // Central: Goteo / Riego
      return (
        <g style={{ pointerEvents: 'none' }}>
          {isActuatorActive && (
            <>
              <ellipse cx="400" cy="305" rx="190" ry="40" fill="url(#mist-grad)" opacity="0.38" className="animate-pulse" />
              <g opacity="0.7" stroke="#22d3ee" strokeWidth="1.2" strokeLinecap="round" className="animate-pulse">
                <line x1="280" y1="260" x2="276" y2="275" />
                <line x1="400" y1="250" x2="396" y2="265" />
                <line x1="500" y1="260" x2="496" y2="275" />
                <line x1="330" y1="310" x2="326" y2="325" />
                <line x1="450" y1="310" x2="446" y2="325" />
              </g>
            </>
          )}
        </g>
      );
    } else if (zoneId === 2) { // Sur: Viento / Aire extractor
      return (
        <g style={{ pointerEvents: 'none' }}>
          {isActuatorActive && (
            <g stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" strokeDasharray="10 15" fill="none" className="animate-laser" style={{ animationDuration: '0.8s' }}>
              <path d="M 200,450 Q 300,430 400,460 T 600,440" />
              <path d="M 220,490 Q 320,470 420,500 T 580,480" />
            </g>
          )}
        </g>
      );
    } else { // Eco-Sector: Lombrices & Compost
      const activeWormsClass = isActuatorActive ? "animate-worm-fast" : "animate-worm-slow";
      const activeSteamClass = isActuatorActive ? "animate-steam-fast" : "animate-steam-slow";

      return (
        <g>
          {/* A. Lombricultivo Bioreactor Panel */}
          <g transform="translate(50, 422)">
            <rect x="0" y="0" width="56" height="34" fill="rgba(12, 12, 16, 0.9)" stroke="#22d3ee" strokeWidth="1.5" rx="3" filter="url(#glow-cyan-filter)" />
            <rect x="3" y="3" width="50" height="28" fill="url(#soil-grad)" rx="1" />
            
            {/* Live cian vermicular biological activity oscilloscope waveform */}
            <path
              d="M 6,17 Q 12,5 18,17 T 30,17 T 42,17 T 50,17"
              fill="none"
              stroke="#22d3ee"
              strokeWidth="1.5"
              strokeLinecap="round"
              className={activeWormsClass}
              style={{ filter: 'drop-shadow(0 0 3px rgba(34,211,238,0.75))' }}
            />
            
            <circle cx="12" cy="22" r="1.5" fill="#22d3ee" opacity="0.65" className="animate-pulse" />
            <circle cx="38" cy="10" r="1" fill="#22d3ee" opacity="0.5" className="animate-pulse" />
            
            <text x="28" y="29" fill="rgba(34,211,238,0.4)" fontSize="4.5" fontFamily="JetBrains Mono" textAnchor="middle" fontWeight="bold">VERMI_ACT</text>
          </g>

          {/* B. Compostera Volcánica Térmica Dome */}
          <g transform="translate(50, 480)">
            <ellipse cx="28" cy="30" rx="30" ry="7.5" fill="rgba(249, 115, 22, 0.28)" filter="url(#glow-thermal-filter)" />
            
            {/* Thermal silo gradient */}
            <path d="M 0,30 Q 28,-3 56,30 Z" fill="url(#compost-thermal-grad)" stroke="rgba(249, 115, 22, 0.4)" strokeWidth="1" />
            <path d="M 8,30 Q 28,6 48,30 Z" fill="url(#compost-core-grad)" opacity="0.85" />
            
            {/* Volumetric heatwaves */}
            <g className={activeSteamClass} stroke="url(#steam-grad)" strokeWidth="1.8" fill="none" strokeLinecap="round" style={{ pointerEvents: 'none' }}>
              <path d="M 12,12 Q 7,1 12,-11" />
              <path d="M 28,6 Q 33,-7 28,-20" />
              <path d="M 44,12 Q 39,1 44,-11" />
            </g>
            
            {/* Carbon active particles */}
            <circle cx="16" cy="8" r="1.5" fill="#facc15" className="animate-particle-1" style={{ '--tw-float-x': '5px' }} />
            <circle cx="29" cy="2" r="1" fill="#f97316" className="animate-particle-2" style={{ '--tw-float-x': '-3px' }} />
            
            <text x="28" y="27" fill="rgba(249,115,22,0.38)" fontSize="4.5" fontFamily="JetBrains Mono" textAnchor="middle" fontWeight="bold">THERMO_COMP</text>
          </g>
        </g>
      );
    }
  };

  const handleActuatorClick = async (e, actuator) => {
    e.stopPropagation();
    if (togglingId) return;
    setTogglingId(actuator.id);
    try {
      await api.toggleActuator(actuator.id);
      if (onActuatorToggled) onActuatorToggled();
    } catch (err) {
      console.error("Failed to toggle actuator:", err);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="relative w-full h-[600px] bg-black border border-zinc-900 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing select-none shadow-2xl">
      {/* High-tech CAD radial center glow backdrop */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-25" 
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(118, 185, 0, 0.08) 0%, transparent 70%), linear-gradient(rgba(118, 185, 0, 0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(118, 185, 0, 0.12) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 40px 40px, 40px 40px'
        }}
      />
      
      {/* Zoom/Pan Navigation Controls Overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <button 
          onClick={handleZoomIn}
          className="p-2 bg-zinc-950/80 border border-[#76B900]/30 hover:border-[#76B900] text-zinc-300 hover:text-white rounded-lg backdrop-blur-md transition-all shadow-md cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>
        <button 
          onClick={handleZoomOut}
          className="p-2 bg-zinc-950/80 border border-[#76B900]/30 hover:border-[#76B900] text-zinc-300 hover:text-white rounded-lg backdrop-blur-md transition-all shadow-md cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
        <button 
          onClick={handleReset}
          className="p-2 bg-zinc-950/80 border border-[#76B900]/30 hover:border-[#76B900] text-zinc-300 hover:text-white rounded-lg backdrop-blur-md transition-all shadow-md cursor-pointer"
          title="Reset View"
        >
          <Maximize2 size={16} />
        </button>
      </div>

      {/* Telemetry Diagnostics Panel */}
      <div className="absolute top-4 right-4 z-10 pointer-events-auto bg-zinc-950/80 border border-zinc-800 rounded-lg p-3 backdrop-blur-md shadow-xl text-left font-mono w-56 text-[10px]">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 mb-1.5 text-white font-bold">
          <div className="flex items-center gap-1">
            <Cpu size={12} className="text-[#76B900]" />
            <span>TELEMETRÍA DIGITAL TWIN</span>
          </div>
          <span className="text-[#76B900] animate-pulse">●</span>
        </div>
        <div className="space-y-1 text-zinc-400">
          <div className="flex justify-between">
            <span>MOTOR TWIN:</span>
            <span className="text-[#76B900] font-bold">ISAAC PHOTO-REAL</span>
          </div>
          <div className="flex justify-between">
            <span>ZONAS CULTIVO:</span>
            <span className="text-cyan-400">3 FOTO-RENDER + ECO</span>
          </div>
          <div className="flex justify-between">
            <span>ACTUADORES FÍSICOS:</span>
            <span className="text-[#76B900]">CIRCUITO LÁSER ACTIVADO</span>
          </div>
          <div className="flex justify-between">
            <span>RENDER FREQUENCY:</span>
            <span className="text-white">{fps} FPS</span>
          </div>
          <div className="flex justify-between">
            <span>TWIN LATENCY:</span>
            <span className="text-[#76B900] font-bold">REALTIME</span>
          </div>
        </div>
      </div>

      {/* Dynamic Floating Tooltips */}
      {hoveredSensor && (
        <div 
          className="absolute z-20 bg-zinc-950/95 border border-[#76B900] rounded p-2.5 shadow-2xl backdrop-blur-md text-left font-mono pointer-events-none"
          style={{
            left: `${Math.min(mapWidth - 160, Math.max(16, (hoveredSensor.x * zoom) + pan.x - 70))}px`,
            top: `${Math.min(mapHeight - 100, Math.max(16, (hoveredSensor.y * zoom) + pan.y - 75))}px`
          }}
        >
          <div className="text-[9px] text-zinc-500 font-bold tracking-wider uppercase">{hoveredSensor.sensorName}</div>
          <div className="text-white text-xs font-bold mt-0.5">ID: {hoveredSensor.id.slice(0, 8)}...</div>
          <div className="text-[#76B900] text-sm font-bold mt-1">
            LECTURA: {hoveredSensor.value !== null ? `${hoveredSensor.value.toFixed(1)} ${hoveredSensor.unit}` : 'OFFLINE'}
          </div>
        </div>
      )}

      {hoveredActuator && (
        <div 
          className="absolute z-20 bg-zinc-950/95 border border-cyan-400 rounded p-2.5 shadow-2xl backdrop-blur-md text-left font-mono pointer-events-none"
          style={{
            left: `${Math.min(mapWidth - 180, Math.max(16, (hoveredActuator.x * zoom) + pan.x - 80))}px`,
            top: `${Math.min(mapHeight - 110, Math.max(16, (hoveredActuator.y * zoom) + pan.y - 80))}px`
          }}
        >
          <div className="text-[9px] text-zinc-500 font-bold tracking-wider uppercase">ACTUADOR DE CAMPO</div>
          <div className="text-white text-xs font-bold mt-0.5">{hoveredActuator.name}</div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${hoveredActuator.is_on ? 'bg-[#76B900]/20 text-[#76B900] border border-[#76B900]/30' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}>
              {hoveredActuator.is_on ? 'ACTIVO' : 'INACTIVO'}
            </span>
            <span className="text-[8px] text-zinc-500">CLIC PARA INTERRUPTOR</span>
          </div>
        </div>
      )}

      {/* Main SVG Vector Canvas */}
      <svg
        ref={mapRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${mapWidth} ${mapHeight}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Premium Gradients, Filters and ClipPaths */}
        <defs>
          {/* Cybernetic CAD grids */}
          <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(118, 185, 0, 0.05)" strokeWidth="1" />
          </pattern>

          {/* Isometric Clip Paths to project realistic images onto 3D slabs */}
          <clipPath id="clip-zone-0">
            <polygon points="80,60 720,60 670,210 130,210" />
          </clipPath>
          <clipPath id="clip-zone-1">
            <polygon points="130,230 670,230 620,380 180,380" />
          </clipPath>
          <clipPath id="clip-zone-2">
            <polygon points="180,400 620,400 570,550 230,550" />
          </clipPath>

          {/* Gaussian blur glows */}
          <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="glow-cyan-filter" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComponentTransfer in="blur" result="glow">
              <feFuncA type="linear" slope="0.7"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="glow-thermal-filter" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Volumetric mist (hydroponics) */}
          <radialGradient id="mist-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00ffcc" stopOpacity="0.45" />
            <stop offset="65%" stopColor="#00ffcc" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#00ffcc" stopOpacity="0" />
          </radialGradient>

          {/* 3D slab soil depth side face gradients */}
          <linearGradient id="soil-side-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#18181b" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#09090b" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="soil-front-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#27272a" />
            <stop offset="30%" stopColor="#18181b" />
            <stop offset="100%" stopColor="#09090b" />
          </linearGradient>
          <linearGradient id="soil-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2e1907" />
            <stop offset="60%" stopColor="#180f05" />
            <stop offset="100%" stopColor="#0c0702" />
          </linearGradient>

          {/* Volcanic thermal composting gradients */}
          <radialGradient id="compost-thermal-grad" cx="50%" cy="100%" r="90%">
            <stop offset="0%" stopColor="#ca8a04" />
            <stop offset="35%" stopColor="#ea580c" />
            <stop offset="70%" stopColor="#9a3412" />
            <stop offset="100%" stopColor="#431407" />
          </radialGradient>
          <radialGradient id="compost-core-grad" cx="50%" cy="100%" r="50%">
            <stop offset="0%" stopColor="#facc15" />
            <stop offset="50%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
          </radialGradient>

          {/* Volumetric rising steam gradient */}
          <linearGradient id="steam-grad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#00ffcc" stopOpacity="0.45" />
            <stop offset="40%" stopColor="#22d3ee" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Technical grid backdrop */}
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />

        {/* 1. Planned Rover Patrolling Path Waypoints */}
        <g stroke="rgba(0, 255, 204, 0.12)" strokeWidth="1.5" strokeDasharray="5 3" fill="none">
          <polyline points={roverPathPoints.map(p => `${p.x},${p.y}`).join(' ')} />
          {/* Closed Loop */}
          <line x1={roverPathPoints[5].x} y1={roverPathPoints[5].y} x2={roverPathPoints[0].x} y2={roverPathPoints[0].y} />
        </g>
        
        {/* Plot Waypoint nodes */}
        {roverPathPoints.map((pt, i) => (
          <g key={`wpt-${i}`} transform={`translate(${pt.x}, ${pt.y})`}>
            <circle r="4" fill="#000" stroke="#00ffcc" strokeWidth="1" opacity="0.6" />
            <circle r="2" fill="#00ffcc" opacity="0.8" />
          </g>
        ))}

        {/* 2. Laser Energy Circuits (laser lines flowing when actuator is ON) */}
        {zones.map((zone, zIdx) => {
          const zonePoly = zonePolygons[zIdx];
          if (!zonePoly) return null;
          return zone.actuators?.map((actuator, aIdx) => {
            if (!actuator.is_on) return null;
            const actCoords = getActuatorCoords(actuator.type, zIdx, aIdx);
            return (
              <path
                key={`laser-circuit-${actuator.id}`}
                d={`M ${actCoords.x},${actCoords.y} Q ${(actCoords.x + zonePoly.center.x)/2},${(actCoords.y + zonePoly.center.y)/2 - 30} ${zonePoly.center.x},${zonePoly.center.y}`}
                fill="none"
                stroke={zIdx === 3 ? "#00ffcc" : "#76B900"}
                strokeWidth="1.5"
                opacity="0.85"
                className="animate-laser"
                style={{ filter: 'drop-shadow(0 0 4px rgba(0,255,204,0.5))' }}
              />
            );
          });
        })}

        {/* 3. 3D Isometric Zone Slabs */}
        {zonePolygons.map((zp) => {
          const zoneObj = zones[zp.id];
          const healthScore = zoneObj ? zoneObj.health_score : 100;
          const isHovered = hoveredZone === zp.id;
          const isActuatorActive = zoneObj?.actuators?.some(a => a.is_on) || false;
          
          const ledColor = getLedColor(healthScore, zp.id === 3);
          const isElevatedY = isHovered ? -8 : 0;

          // Camera images paths based on crop zone
          const getCamImage = (id) => {
            if (id === 0) return "/tomato_cam.png";
            if (id === 1) return "/lettuce_cam.png";
            if (id === 2) return "/corn_cam.png";
            return null;
          };

          const camImg = getCamImage(zp.id);

          return (
            <g 
              key={`zone-group-${zp.id}`}
              onMouseEnter={() => setHoveredZone(zp.id)}
              onMouseLeave={() => setHoveredZone(null)}
              className="isometric-slab-group"
              style={{
                transform: `translate(0px, ${isElevatedY}px)`,
                transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)'
              }}
            >
              {/* Face A: Ground Shadow (behind/below the slab) */}
              <polygon
                points={zp.faces.shadow}
                fill="rgba(0, 0, 0, 0.55)"
                style={{ filter: 'blur(7px)' }}
                opacity={isHovered ? 0.8 : 0.6}
              />

              {/* Face B: Soil Depth Left face */}
              <polygon
                points={zp.faces.left}
                fill="url(#soil-side-grad)"
                stroke="rgba(255, 255, 255, 0.03)"
                strokeWidth="0.5"
              />

              {/* Face C: Soil Depth Right face */}
              <polygon
                points={zp.faces.right}
                fill="url(#soil-side-grad)"
                stroke="rgba(255, 255, 255, 0.03)"
                strokeWidth="0.5"
              />

              {/* Face D: Soil Depth Front face */}
              <polygon
                points={zp.faces.front}
                fill="url(#soil-front-grad)"
                stroke="rgba(255, 255, 255, 0.04)"
                strokeWidth="0.5"
              />

              {/* Face E: Top Cultivation Face (Realistic Photographic / High-Tech twin fill) */}
              {camImg ? (
                <>
                  {/* Photo fill clipped to isometric top face coordinates */}
                  <image
                    href={camImg}
                    x={zp.id === 0 ? "80" : zp.id === 1 ? "130" : "180"}
                    y={zp.id === 0 ? "60" : zp.id === 1 ? "230" : "400"}
                    width={zp.id === 0 ? "640" : zp.id === 1 ? "540" : "440"}
                    height="150"
                    clipPath={`url(#clip-zone-${zp.id})`}
                    preserveAspectRatio="xMidYMid slice"
                    opacity={isHovered ? 0.98 : 0.85}
                    style={{
                      transition: 'opacity 0.3s ease, filter 0.3s ease',
                      filter: isHovered ? 'brightness(1.08) contrast(1.05) saturate(1.1)' : 'brightness(0.85) contrast(0.95)'
                    }}
                  />
                  {/* Glowing semi-transparent LED perimeter overlay */}
                  <polygon
                    points={zp.faces.top}
                    fill="none"
                    stroke={ledColor}
                    strokeWidth={isHovered ? "2.5" : "1.5"}
                    className="isometric-slab"
                    style={{
                      filter: isHovered ? `drop-shadow(0 0 12px ${ledColor})` : 'none',
                    }}
                  />
                </>
              ) : (
                // Non-photo zones (Eco-Sector) uses cybernetic cian slab
                <polygon
                  points={zp.faces.top}
                  fill={isHovered ? "rgba(18, 18, 22, 0.95)" : "rgba(10, 10, 12, 0.92)"}
                  stroke={ledColor}
                  strokeWidth={isHovered ? "2.5" : "1.5"}
                  className="isometric-slab"
                  style={{
                    filter: isHovered ? `drop-shadow(0 0 12px ${ledColor})` : 'none',
                  }}
                />
              )}
              
              {/* Technical zone labels overlay */}
              <text
                x={zp.center.x}
                y={zp.center.y - 45}
                textAnchor="middle"
                fill={isHovered ? ledColor : "rgba(255, 255, 255, 0.25)"}
                fontSize="9.5"
                fontFamily="JetBrains Mono"
                fontWeight="bold"
                letterSpacing="1"
                style={{ transition: 'fill 0.3s ease' }}
              >
                {zp.label.toUpperCase()}
              </text>

              {/* Dynamic weather/mist/oscilloscope overlays on top of the realistic renders */}
              {renderWeatherOverlay(zp.id, isActuatorActive)}
            </g>
          );
        })}

        {/* 4. Geolocated Sensors Coordinates & Pulses */}
        {zones.map((zone, zIdx) => (
          <g key={`sensors-zone-${zone.id}`}>
            {zone.sensors?.map((sensor, sIdx) => {
              const coords = getSensorCoords(sensor.type, zIdx, sIdx);
              const isCrit = sensor.latest_value !== null && (
                (sensor.type === 'temperature' && sensor.latest_value > 28) ||
                (sensor.type === 'soil_moisture' && (sensor.latest_value < 35 || (sensor.name.includes('Lombrices') && sensor.latest_value < 70))) ||
                (sensor.type === 'ph' && (sensor.latest_value < 6.0 || sensor.latest_value > 7.0))
              );
              
              const isZoneHovered = hoveredZone === zIdx;
              const sensorColor = isCrit ? '#ef4444' : zIdx === 3 ? '#22d3ee' : '#76B900';
              const yOffset = isZoneHovered ? -8 : 0;

              return (
                <g 
                  key={`sensor-node-${sensor.id}`} 
                  transform={`translate(${coords.x}, ${coords.y + yOffset})`}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredSensor({
                    ...coords,
                    x: coords.x,
                    y: coords.y + yOffset,
                    id: sensor.id,
                    sensorName: sensor.name,
                    value: sensor.latest_value,
                    unit: sensor.unit
                  })}
                  onMouseLeave={() => setHoveredSensor(null)}
                  style={{ transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)' }}
                >
                  {/* Pulsing telemetry circle */}
                  <circle
                    r="12"
                    fill="none"
                    stroke={sensorColor}
                    strokeWidth="1.5"
                    className="animate-ping"
                    style={{ animationDuration: '3s' }}
                    opacity="0.3"
                  />
                  
                  {/* Core border ring */}
                  <circle
                    r="6.5"
                    fill="#050505"
                    stroke={sensorColor}
                    strokeWidth="1.5"
                  />

                  {/* Core Indicator dot */}
                  <circle
                    r="2.5"
                    fill={sensorColor}
                  />
                </g>
              );
            })}
          </g>
        ))}

        {/* 5. Actuator Physical Switch Nodes */}
        {zones.map((zone, zIdx) => (
          <g key={`actuators-zone-${zone.id}`}>
            {zone.actuators?.map((actuator, aIdx) => {
              const coords = getActuatorCoords(actuator.type, zIdx, aIdx);
              const isToggling = togglingId === actuator.id;
              const isZoneHovered = hoveredZone === zIdx;
              const yOffset = isZoneHovered ? -8 : 0;

              return (
                <g
                  key={`actuator-node-${actuator.id}`}
                  transform={`translate(${coords.x}, ${coords.y + yOffset})`}
                  className="cursor-pointer group"
                  onMouseEnter={() => setHoveredActuator({
                    ...coords,
                    x: coords.x,
                    y: coords.y + yOffset,
                    id: actuator.id,
                    name: actuator.name,
                    is_on: actuator.is_on
                  })}
                  onMouseLeave={() => setHoveredActuator(null)}
                  onClick={(e) => handleActuatorClick(e, actuator)}
                  style={{ transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)' }}
                >
                  {/* Glowing active state circle */}
                  {actuator.is_on && (
                    <circle
                      r="16"
                      fill="none"
                      stroke="#00ffcc"
                      strokeWidth="1"
                      className="animate-pulse"
                      opacity="0.5"
                    />
                  )}

                  {/* Base tech ring */}
                  <circle
                    r="9"
                    fill="#080808"
                    stroke={actuator.is_on ? "#00ffcc" : "#555"}
                    strokeWidth="1.5"
                    className="group-hover:stroke-[#76B900] transition-colors"
                  />

                  {/* High-tech switch shapes */}
                  {isToggling ? (
                    <circle
                      r="4"
                      fill="none"
                      stroke="#00ffcc"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                      className="animate-spin"
                    />
                  ) : (
                    <polygon
                      points="-3,-3 3,-3 0,4"
                      fill={actuator.is_on ? "#00ffcc" : "#777"}
                      transform={actuator.is_on ? "rotate(180)" : ""}
                      style={{ transition: 'transform 0.5s ease-in-out' }}
                    />
                  )}
                </g>
              );
            })}
          </g>
        ))}

        {/* 6. Autonomous AgriRover-1 Representation with Sonar Waves */}
        {roverTelemetry && (
          <g transform={`translate(${roverX}, ${roverY})`}>
            
            {/* Active Holographic Radar Sonar Ring Expansion */}
            {roverTelemetry.status === "patrolling" && (
              <circle
                r="30"
                fill="none"
                stroke="#00ffcc"
                strokeWidth="1.2"
                className="animate-sonar"
                style={{ pointerEvents: 'none' }}
              />
            )}

            {/* Sweep LIDAR cone */}
            {roverTelemetry.status === "patrolling" && (
              <g 
                className="animate-lidar" 
                style={{ animationDuration: '4s', pointerEvents: 'none' }}
              >
                {/* Conal SVG Wedge */}
                <path
                  d="M 0,0 L -70,-120 A 140 140 0 0,1 70,-120 Z"
                  fill="url(#lidar-gradient)"
                  opacity="0.18"
                />
              </g>
            )}

            {/* Sweep LIDAR Gradient Definition */}
            <defs>
              <radialGradient id="lidar-gradient" cx="50%" cy="100%" r="100%">
                <stop offset="0%" stopColor="#00ffcc" stopOpacity="0.85" />
                <stop offset="40%" stopColor="#00ffcc" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#00ffcc" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Outer dotted locator ring */}
            <circle
              r="22"
              fill="none"
              stroke="#00ffcc"
              strokeWidth="0.75"
              strokeDasharray="4 4"
              className="animate-spin"
              style={{ animationDuration: '10s' }}
            />

            {/* Inner rover body capsule */}
            <circle
              r="14.5"
              fill="rgba(0, 0, 0, 0.95)"
              stroke="#00ffcc"
              strokeWidth="2"
              style={{ filter: 'drop-shadow(0 0 8px rgba(0,255,204,0.55))' }}
            />

            {/* Heading vector pointer */}
            <g transform={`rotate(${roverTelemetry.heading})`}>
              <polygon
                points="-5,4 5,4 0,-10"
                fill="#00ffcc"
              />
            </g>

            {/* Micro label banner */}
            <rect
              x="-24"
              y="19"
              width="48"
              height="10.5"
              rx="2.5"
              fill="rgba(0, 0, 0, 0.9)"
              stroke="rgba(0, 255, 204, 0.35)"
              strokeWidth="0.75"
            />
            <text
              x="0"
              y="26.5"
              textAnchor="middle"
              fill="#00ffcc"
              fontSize="6"
              fontFamily="JetBrains Mono"
              fontWeight="bold"
            >
              ROVER-1
            </text>
          </g>
        )}
      </svg>
      
      {/* Floating coordinates indicator bottom right */}
      {roverTelemetry && (
        <div className="absolute bottom-4 right-4 z-10 bg-zinc-950/80 border border-zinc-800 rounded px-2.5 py-1.5 backdrop-blur-md shadow-md font-mono text-[9px] text-cyan-400">
          ROVER POSE: X: {roverTelemetry.x.toFixed(2)}m | Y: {roverTelemetry.y.toFixed(2)}m | HDG: {roverTelemetry.heading.toFixed(1)}°
        </div>
      )}

      {/* Battery indicator bottom left */}
      {roverTelemetry && (
        <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 bg-zinc-950/80 border border-zinc-800 rounded px-2.5 py-1.5 backdrop-blur-md shadow-md font-mono text-[9px]">
          <span className="text-zinc-500">BATERÍA:</span>
          <div className="w-16 h-2 border border-zinc-700 bg-zinc-900 rounded overflow-hidden flex">
            <div 
              className={`h-full ${roverTelemetry.battery < 20 ? 'bg-red-500' : roverTelemetry.battery < 50 ? 'bg-amber-500' : 'bg-[#76B900]'}`}
              style={{ width: `${roverTelemetry.battery}%` }}
            />
          </div>
          <span className={`font-bold ${roverTelemetry.battery < 20 ? 'text-red-400' : roverTelemetry.battery < 50 ? 'text-amber-400' : 'text-[#76B900]'}`}>
            {roverTelemetry.battery}%
          </span>
          <span className="text-zinc-500 ml-1">ESTADO:</span>
          <span className={`font-bold uppercase ${roverTelemetry.status === 'charging' ? 'text-amber-400 animate-pulse' : 'text-[#76B900]'}`}>
            {roverTelemetry.status}
          </span>
        </div>
      )}
    </div>
  );
}
