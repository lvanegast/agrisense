import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Cpu, 
  Navigation,
  Loader2,
  Activity
} from 'lucide-react';

// ─── Animated Tomato Plant Cluster ────────────────────────────────────────────
function TomatoPlants({ x, y, width, height, isWatered, isHovered }) {
  const plants = [
    { px: 0.15, delay: 0 }, { px: 0.28, delay: 0.4 }, { px: 0.42, delay: 0.8 },
    { px: 0.56, delay: 0.3 }, { px: 0.70, delay: 0.6 }, { px: 0.83, delay: 1.0 },
    { px: 0.22, delay: 1.2 }, { px: 0.48, delay: 0.9 }, { px: 0.64, delay: 0.2 },
    { px: 0.36, delay: 1.5 },
  ];
  const tomatoColor = isHovered ? '#ef4444' : '#dc2626';
  const leafColor = isHovered ? '#4ade80' : '#16a34a';
  const stemColor = '#15803d';

  return (
    <g>
      {/* Soil bed gradient */}
      <rect x={x} y={y + height * 0.6} width={width} height={height * 0.4}
        fill="url(#tomato-soil)" opacity="0.7" />

      {plants.map((p, i) => {
        const px = x + p.px * width;
        const py = y + height * 0.6;
        const h = height * (0.35 + (i % 3) * 0.05);
        return (
          <g key={`tomato-${i}`} style={{
            transformOrigin: `${px}px ${py}px`,
            animation: `plantSway ${3.5 + p.delay}s infinite ease-in-out`,
            animationDelay: `${p.delay}s`,
          }}>
            {/* Main stem */}
            <line x1={px} y1={py} x2={px} y2={py - h}
              stroke={stemColor} strokeWidth="2" strokeLinecap="round" />
            {/* Leaves */}
            <ellipse cx={px - 8} cy={py - h * 0.5} rx="9" ry="4"
              fill={leafColor} opacity="0.9" transform={`rotate(-25, ${px - 8}, ${py - h * 0.5})`} />
            <ellipse cx={px + 8} cy={py - h * 0.55} rx="9" ry="4"
              fill={leafColor} opacity="0.9" transform={`rotate(25, ${px + 8}, ${py - h * 0.55})`} />
            <ellipse cx={px - 6} cy={py - h * 0.75} rx="7" ry="3.5"
              fill={leafColor} opacity="0.85" transform={`rotate(-20, ${px - 6}, ${py - h * 0.75})`} />
            <ellipse cx={px + 6} cy={py - h * 0.78} rx="7" ry="3.5"
              fill={leafColor} opacity="0.85" transform={`rotate(20, ${px + 6}, ${py - h * 0.78})`} />
            {/* Tomatoes */}
            <circle cx={px} cy={py - h + 4} r="5.5" fill={tomatoColor}
              style={{ filter: `drop-shadow(0 0 3px ${tomatoColor}80)` }} />
            <circle cx={px - 10} cy={py - h * 0.8} r="4" fill={tomatoColor} opacity="0.8" />
            <circle cx={px + 9} cy={py - h * 0.72} r="3.5" fill="#f97316" opacity="0.75" />
            {/* Water droplets when irrigated */}
            {isWatered && (
              <>
                <circle cx={px - 3} cy={py - h * 0.3} r="1.5" fill="#38bdf8" opacity="0.7"
                  style={{ animation: 'waterDrop 1.5s infinite linear', animationDelay: `${p.delay * 0.5}s` }} />
                <circle cx={px + 4} cy={py - h * 0.15} r="1" fill="#38bdf8" opacity="0.5"
                  style={{ animation: 'waterDrop 2s infinite linear', animationDelay: `${p.delay * 0.3}s` }} />
              </>
            )}
          </g>
        );
      })}
    </g>
  );
}

// ─── Animated Lettuce Bed ─────────────────────────────────────────────────────
function LettuceBed({ x, y, width, height, isWatered, isHovered }) {
  const heads = [
    { px: 0.1, py: 0.55, r: 0.05 }, { px: 0.22, py: 0.5, r: 0.055 },
    { px: 0.34, py: 0.55, r: 0.05 }, { px: 0.46, py: 0.5, r: 0.06 },
    { px: 0.58, py: 0.55, r: 0.05 }, { px: 0.70, py: 0.5, r: 0.055 },
    { px: 0.82, py: 0.55, r: 0.05 }, { px: 0.92, py: 0.5, r: 0.045 },
    { px: 0.16, py: 0.7, r: 0.05 }, { px: 0.28, py: 0.68, r: 0.055 },
    { px: 0.40, py: 0.72, r: 0.05 }, { px: 0.52, py: 0.67, r: 0.06 },
    { px: 0.64, py: 0.70, r: 0.05 }, { px: 0.76, py: 0.68, r: 0.05 },
    { px: 0.88, py: 0.72, r: 0.045 },
  ];

  return (
    <g>
      <rect x={x} y={y + height * 0.55} width={width} height={height * 0.45}
        fill="url(#lettuce-soil)" opacity="0.65" />
      {/* Irrigation rows */}
      {[0.35, 0.55, 0.75].map((row, ri) => (
        <line key={`row-${ri}`} x1={x + 5} y1={y + height * row}
          x2={x + width - 5} y2={y + height * row}
          stroke="#374151" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.3" />
      ))}
      {heads.map((h, i) => {
        const cx = x + h.px * width;
        const cy = y + h.py * height;
        const r = h.r * Math.min(width, height * 2);
        const green = i % 3 === 0 ? '#86efac' : i % 3 === 1 ? '#4ade80' : '#22c55e';
        const innerGreen = i % 3 === 0 ? '#bbf7d0' : '#86efac';
        return (
          <g key={`lettuce-${i}`} style={{
            transformOrigin: `${cx}px ${cy}px`,
            animation: `gentlePulse ${4 + (i % 3) * 0.8}s infinite ease-in-out`,
            animationDelay: `${(i * 0.3) % 2}s`,
          }}>
            {/* Outer leaves */}
            <ellipse cx={cx} cy={cy} rx={r * 1.6} ry={r * 1.1} fill={green} opacity="0.85" />
            <ellipse cx={cx} cy={cy} rx={r * 1.25} ry={r * 0.85} fill={innerGreen} opacity="0.9" />
            {/* Center heart */}
            <ellipse cx={cx} cy={cy} rx={r * 0.55} ry={r * 0.4} fill="#ecfdf5" opacity="0.7" />
            {/* Leaf veins */}
            <line x1={cx} y1={cy - r * 0.8} x2={cx} y2={cy + r * 0.8}
              stroke={green} strokeWidth="0.5" opacity="0.5" />
            <line x1={cx - r * 0.8} y1={cy} x2={cx + r * 0.8} y2={cy}
              stroke={green} strokeWidth="0.5" opacity="0.5" />
            {isWatered && i % 3 === 0 && (
              <circle cx={cx + r * 0.3} cy={cy - r * 0.9} r="1.2" fill="#38bdf8" opacity="0.7"
                style={{ animation: 'waterDrop 1.8s infinite', animationDelay: `${i * 0.2}s` }} />
            )}
          </g>
        );
      })}
    </g>
  );
}

// ─── Animated Corn Field ──────────────────────────────────────────────────────
function CornField({ x, y, width, height, isVentilated, isHovered }) {
  const stalks = Array.from({ length: 14 }, (_, i) => ({
    px: 0.04 + (i / 13) * 0.92,
    h: 0.55 + (i % 4) * 0.06,
    delay: i * 0.15,
  }));
  const cornColor = isHovered ? '#fbbf24' : '#f59e0b';
  const leafColor = '#22c55e';
  const stalkColor = '#15803d';

  return (
    <g>
      <rect x={x} y={y + height * 0.65} width={width} height={height * 0.35}
        fill="url(#corn-soil)" opacity="0.7" />
      {stalks.map((s, i) => {
        const sx = x + s.px * width;
        const base = y + height * 0.68;
        const top = base - s.h * height;
        return (
          <g key={`corn-${i}`} style={{
            transformOrigin: `${sx}px ${base}px`,
            animation: `cornSway ${4 + s.delay * 0.3}s infinite ease-in-out`,
            animationDelay: `${s.delay}s`,
          }}>
            {/* Main stalk */}
            <line x1={sx} y1={base} x2={sx} y2={top}
              stroke={stalkColor} strokeWidth="2.5" strokeLinecap="round" />
            {/* Corn cob */}
            <rect x={sx - 3} y={top + (base - top) * 0.25} width="6" height="16" rx="3"
              fill={cornColor} opacity="0.9"
              style={{ filter: `drop-shadow(0 0 4px ${cornColor}60)` }} />
            <rect x={sx - 2} y={top + (base - top) * 0.25} width="4" height="16" rx="2"
              fill="#fde68a" opacity="0.5" />
            {/* Silk */}
            <path d={`M ${sx} ${top + (base - top) * 0.25} Q ${sx + 5} ${top + (base - top) * 0.18} ${sx + 8} ${top + (base - top) * 0.12}`}
              stroke="#fde68a" strokeWidth="1" fill="none" opacity="0.7" />
            {/* Leaves */}
            <path d={`M ${sx} ${top + (base - top) * 0.45} Q ${sx - 18} ${top + (base - top) * 0.35} ${sx - 22} ${top + (base - top) * 0.55}`}
              stroke={leafColor} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.85" />
            <path d={`M ${sx} ${top + (base - top) * 0.62} Q ${sx + 18} ${top + (base - top) * 0.52} ${sx + 20} ${top + (base - top) * 0.72}`}
              stroke={leafColor} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.85" />
            <path d={`M ${sx} ${top + (base - top) * 0.8} Q ${sx - 15} ${top + (base - top) * 0.72} ${sx - 18} ${top + (base - top) * 0.88}`}
              stroke={leafColor} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
            {/* Tassel at top */}
            <path d={`M ${sx} ${top} Q ${sx + 4} ${top - 8} ${sx + 6} ${top - 14}`}
              stroke="#fde68a" strokeWidth="1.5" fill="none" opacity="0.8" />
            <path d={`M ${sx} ${top} Q ${sx - 3} ${top - 6} ${sx - 5} ${top - 12}`}
              stroke="#fde68a" strokeWidth="1.5" fill="none" opacity="0.7" />
            {/* Wind effect when ventilated */}
            {isVentilated && i % 3 === 0 && (
              <path d={`M ${sx - 25} ${top + (base - top) * 0.3} Q ${sx - 10} ${top + (base - top) * 0.25} ${sx + 5} ${top + (base - top) * 0.35}`}
                stroke="rgba(147,197,253,0.4)" strokeWidth="1.5" strokeDasharray="4 3" fill="none"
                style={{ animation: 'windFlow 1.2s infinite linear', animationDelay: `${i * 0.1}s` }} />
            )}
          </g>
        );
      })}
    </g>
  );
}

// ─── Main FarmMap Component ───────────────────────────────────────────────────
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
  const [tick, setTick] = useState(0);

  const mapRef = useRef(null);

  // Fluctuating FPS to simulate live telemetry rendering
  useEffect(() => {
    const interval = setInterval(() => {
      setFps(+(60 + (Math.random() * 1 - 0.5)).toFixed(1));
      setTick(t => t + 1);
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
    if (e.button !== 0) return;
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

  // Zone layout polygons
  const zonePolygons = [
    {
      id: 0,
      label: "Sector Norte (Tomates)",
      center: { x: 400, y: 135 },
      faces: {
        top: "80,60 720,60 670,210 130,210",
        front: "130,210 670,210 670,222 130,222",
        left: "80,60 130,210 130,222 80,72",
        right: "720,60 670,210 670,222 720,72",
        shadow: "70,72 730,72 680,222 120,222"
      },
      // Bounding box for the top face
      bbox: { x: 80, y: 60, w: 640, h: 150 }
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
      },
      bbox: { x: 130, y: 230, w: 540, h: 150 }
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
      },
      bbox: { x: 180, y: 400, w: 440, h: 150 }
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
      },
      bbox: { x: 45, y: 410, w: 120, h: 150 }
    }
  ];

  const getSensorCoords = (type, zoneIndex, idx) => {
    if (zoneIndex === 0) {
      if (idx === 0) return { x: 220, y: 120 };
      if (idx === 1) return { x: 400, y: 100 };
      return { x: 580, y: 120 };
    } else if (zoneIndex === 1) {
      if (idx === 0) return { x: 280, y: 290 };
      if (idx === 1) return { x: 400, y: 270 };
      return { x: 520, y: 290 };
    } else if (zoneIndex === 2) {
      if (idx === 0) return { x: 310, y: 460 };
      if (idx === 1) return { x: 400, y: 490 };
      return { x: 490, y: 460 };
    } else {
      if (idx === 0) return { x: 75, y: 435 };
      if (idx === 1) return { x: 105, y: 435 };
      if (idx === 2) return { x: 135, y: 435 };
      if (idx === 3) return { x: 75, y: 535 };
      return { x: 135, y: 535 };
    }
  };

  const getActuatorCoords = (type, zoneIndex, idx) => {
    if (zoneIndex === 0) {
      return idx === 0 ? { x: 150, y: 150 } : { x: 650, y: 150 };
    } else if (zoneIndex === 1) {
      return { x: 600, y: 310 };
    } else if (zoneIndex === 2) {
      return { x: 250, y: 480 };
    } else {
      return idx === 0 ? { x: 60, y: 485 } : { x: 150, y: 485 };
    }
  };

  const getLedColor = (score, isEco = false) => {
    if (isEco) return "#22d3ee";
    if (score >= 70) return "#76B900";
    if (score >= 40) return "#f59e0b";
    return "#ef4444";
  };

  const roverX = roverTelemetry ? (roverTelemetry.x / 100) * mapWidth : 0;
  const roverY = roverTelemetry ? (roverTelemetry.y / 100) * mapHeight : 0;

  const roverPathPoints = [
    { x: 0.25 * mapWidth, y: 0.25 * mapHeight },
    { x: 0.50 * mapWidth, y: 0.25 * mapHeight },
    { x: 0.50 * mapWidth, y: 0.50 * mapHeight },
    { x: 0.75 * mapWidth, y: 0.50 * mapHeight },
    { x: 0.75 * mapWidth, y: 0.75 * mapHeight },
    { x: 0.25 * mapWidth, y: 0.75 * mapHeight },
  ];


  // ── Eco-Sector Overlay: Lombricultivo + Compostera ──────────────────────────
  const renderEcoOverlay = (isActuatorActive) => {
    const wormAnim  = isActuatorActive ? 'animate-worm-fast'  : 'animate-worm-slow';
    const steamAnim = isActuatorActive ? 'animate-steam-fast' : 'animate-steam-slow';
    const glow      = isActuatorActive
      ? 'drop-shadow(0 0 6px rgba(34,211,238,0.9))'
      : 'drop-shadow(0 0 3px rgba(34,211,238,0.5))';

    /* ── coordinate origin: eco-sector top-left ≈ (45, 410) in SVG space ── */
    return (
      <g>
        {/* ── A. LOMBRICULTIVO: stacked worm-bin trays ── */}
        {/* drawn relative to eco-sector origin (45,410) */}
        <g transform="translate(47, 415)">
          {/* tray shadow */}
          <ellipse cx="35" cy="75" rx="32" ry="5" fill="rgba(0,0,0,0.45)" style={{ filter: 'blur(3px)' }} />

          {/* tray 3 – bottom (soil) */}
          <rect x="4"  y="55" width="62" height="16" rx="3" fill="#1a0d04" stroke="#22d3ee" strokeWidth="0.8" opacity="0.9" />
          <rect x="6"  y="57" width="58" height="12" rx="2" fill="#2e1907" opacity="0.7" />
          {/* worm wave bottom */}
          <path d="M 8,63 Q 14,57 20,63 T 32,63 T 44,63 T 56,63 T 64,63"
            fill="none" stroke="#22d3ee" strokeWidth="1.2" strokeLinecap="round"
            className={wormAnim} style={{ filter: glow }} />

          {/* tray 2 – middle */}
          <rect x="6"  y="36" width="58" height="16" rx="3" fill="#1a0d04" stroke="#22d3ee" strokeWidth="0.8" opacity="0.9" />
          <rect x="8"  y="38" width="54" height="12" rx="2" fill="#2e1907" opacity="0.6" />
          {/* worm wave middle */}
          <path d="M 10,44 Q 18,38 26,44 T 42,44 T 58,44"
            fill="none" stroke="#22d3ee" strokeWidth="1.2" strokeLinecap="round"
            className={wormAnim} style={{ filter: glow, animationDelay: '0.5s' }} />

          {/* tray 1 – top (harvest-ready) */}
          <rect x="8"  y="18" width="54" height="16" rx="3" fill="#1a0d04" stroke="#22d3ee" strokeWidth="0.9" />
          <rect x="10" y="20" width="50" height="12" rx="2" fill="#3b1c08" opacity="0.7" />
          {/* humus particles */}
          {[14,22,30,38,46,54,60].map((cx, i) => (
            <circle key={i} cx={cx} cy={26 + (i % 3) * 2} r="1.2"
              fill={i % 2 === 0 ? '#22d3ee' : '#6ee7b7'} opacity="0.6"
              className="animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}

          {/* lid */}
          <rect x="10" y="11" width="50" height="6" rx="2" fill="#0c1a1a" stroke="#22d3ee" strokeWidth="0.8" />
          <ellipse cx="35" cy="11" rx="25" ry="3" fill="#0d2626" stroke="#22d3ee" strokeWidth="0.6" />

          {/* ventilation holes on lid */}
          {[20,28,35,42,50].map((cx, i) => (
            <circle key={i} cx={cx} cy="11" r="1" fill="none" stroke="#22d3ee" strokeWidth="0.5" opacity="0.5" />
          ))}

          {/* label */}
          <text x="35" y="82" fill="#22d3ee" fontSize="5.5" fontFamily="JetBrains Mono"
            textAnchor="middle" fontWeight="bold" opacity="0.75">LOMBRICULTIVO</text>
          <text x="35" y="89" fill="#22d3ee" fontSize="4" fontFamily="JetBrains Mono"
            textAnchor="middle" opacity="0.45">VERMI-3 CAPAS</text>

          {/* active indicator dot */}
          <circle cx="62" cy="15" r="2.5"
            fill={isActuatorActive ? '#22d3ee' : '#374151'}
            className={isActuatorActive ? 'animate-pulse' : ''}
            style={{ filter: isActuatorActive ? 'drop-shadow(0 0 4px #22d3ee)' : 'none' }} />
        </g>

        {/* ── B. COMPOSTERA: cylindrical barrel with dome ── */}
        {/* offset to the right half of the eco-sector, which is narrow so we overlap slightly */}
        <g transform="translate(47, 505)">
          {/* barrel shadow */}
          <ellipse cx="35" cy="60" rx="30" ry="5" fill="rgba(0,0,0,0.4)" style={{ filter: 'blur(3px)' }} />

          {/* barrel body */}
          <rect x="8" y="18" width="54" height="40" rx="4"
            fill="url(#compost-barrel-grad)" stroke="rgba(249,115,22,0.6)" strokeWidth="1" />

          {/* barrel hoops */}
          {[26, 36, 46].map((y, i) => (
            <rect key={i} x="8" y={y} width="54" height="2" rx="1"
              fill="rgba(249,115,22,0.25)" stroke="rgba(249,115,22,0.4)" strokeWidth="0.5" />
          ))}

          {/* dome cap */}
          <ellipse cx="35" cy="18" rx="27" ry="7"
            fill="url(#compost-dome-grad)" stroke="rgba(249,115,22,0.7)" strokeWidth="1" />
          <ellipse cx="35" cy="18" rx="18" ry="4.5" fill="rgba(234,88,12,0.35)" />

          {/* vent pipe on top */}
          <rect x="32" y="8" width="6" height="10" rx="2"
            fill="#1c0a00" stroke="rgba(249,115,22,0.5)" strokeWidth="0.8" />
          <ellipse cx="35" cy="8" rx="3" ry="1.5" fill="rgba(249,115,22,0.4)" />

          {/* steam rising from vent */}
          <g className={steamAnim} style={{ pointerEvents: 'none' }}>
            <path d="M 31,8 Q 28,-2 31,-12" stroke="rgba(251,191,36,0.5)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M 35,6 Q 38,-4 35,-16" stroke="rgba(249,115,22,0.45)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M 39,8 Q 42,-2 39,-12" stroke="rgba(251,191,36,0.4)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          </g>

          {/* thermal glow at base */}
          <ellipse cx="35" cy="58" rx="27" ry="6"
            fill="rgba(249,115,22,0.2)" filter="url(#glow-thermal-filter)" />

          {/* floating hot carbon particles */}
          <circle cx="25" cy="12" r="1.5" fill="#facc15" className="animate-particle-1" />
          <circle cx="38" cy="4"  r="1"   fill="#f97316" className="animate-particle-2" />
          <circle cx="46" cy="10" r="1.2" fill="#ef4444" className="animate-particle-3" />

          {/* inspection hatch */}
          <rect x="14" y="30" width="12" height="10" rx="2"
            fill="#130800" stroke="rgba(249,115,22,0.4)" strokeWidth="0.8" />
          <line x1="20" y1="30" x2="20" y2="40" stroke="rgba(249,115,22,0.3)" strokeWidth="0.5" />
          <line x1="14" y1="35" x2="26" y2="35" stroke="rgba(249,115,22,0.3)" strokeWidth="0.5" />

          {/* temp readout badge */}
          <rect x="30" y="29" width="26" height="11" rx="2"
            fill="rgba(12,5,0,0.85)" stroke="rgba(249,115,22,0.4)" strokeWidth="0.7" />
          <text x="43" y="36.5" fill="#fb923c" fontSize="5" fontFamily="JetBrains Mono"
            textAnchor="middle" fontWeight="bold">
            {isActuatorActive ? '58°C ▲' : '42°C —'}
          </text>

          {/* label */}
          <text x="35" y="68" fill="#fb923c" fontSize="5.5" fontFamily="JetBrains Mono"
            textAnchor="middle" fontWeight="bold" opacity="0.85">COMPOSTERA</text>
          <text x="35" y="75" fill="#fb923c" fontSize="4" fontFamily="JetBrains Mono"
            textAnchor="middle" opacity="0.5">AERÓBICA 200L</text>

          {/* active indicator */}
          <circle cx="60" cy="21" r="2.5"
            fill={isActuatorActive ? '#f97316' : '#374151'}
            className={isActuatorActive ? 'animate-pulse' : ''}
            style={{ filter: isActuatorActive ? 'drop-shadow(0 0 5px #f97316)' : 'none' }} />
        </g>
      </g>
    );
  };

  // Mist/water overlay on top of zones
  const renderWeatherOverlay = (zoneId, isActuatorActive) => {
    if (!isActuatorActive) return null;
    if (zoneId === 0) {
      return (
        <g style={{ pointerEvents: 'none' }}>
          <ellipse cx="400" cy="135" rx="220" ry="45" fill="url(#mist-grad)" opacity="0.45" className="animate-pulse" />
          <g opacity="0.7" stroke="#22d3ee" strokeWidth="1" strokeLinecap="round" className="animate-pulse">
            <line x1="240" y1="90" x2="236" y2="105" />
            <line x1="380" y1="80" x2="376" y2="95" />
            <line x1="520" y1="90" x2="516" y2="105" />
            <line x1="300" y1="120" x2="296" y2="135" />
            <line x1="480" y1="110" x2="476" y2="125" />
            <line x1="600" y1="95" x2="596" y2="110" />
          </g>
        </g>
      );
    } else if (zoneId === 1) {
      return (
        <g style={{ pointerEvents: 'none' }}>
          <ellipse cx="400" cy="305" rx="190" ry="40" fill="url(#mist-grad)" opacity="0.38" className="animate-pulse" />
          <g opacity="0.7" stroke="#22d3ee" strokeWidth="1.2" strokeLinecap="round" className="animate-pulse">
            <line x1="280" y1="260" x2="276" y2="275" />
            <line x1="400" y1="250" x2="396" y2="265" />
            <line x1="500" y1="260" x2="496" y2="275" />
            <line x1="330" y1="310" x2="326" y2="325" />
            <line x1="450" y1="310" x2="446" y2="325" />
          </g>
        </g>
      );
    } else if (zoneId === 2) {
      return (
        <g style={{ pointerEvents: 'none' }}>
          <g stroke="rgba(147,197,253,0.35)" strokeWidth="1.5" strokeDasharray="10 15" fill="none" className="animate-laser" style={{ animationDuration: '0.8s' }}>
            <path d="M 200,450 Q 300,430 400,460 T 600,440" />
            <path d="M 220,490 Q 320,470 420,500 T 580,480" />
          </g>
        </g>
      );
    }
    return null;
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
      {/* CSS keyframes injected inline for SVG animations */}
      <style>{`
        @keyframes plantSway {
          0%, 100% { transform: rotate(-2.5deg); }
          50% { transform: rotate(2.5deg); }
        }
        @keyframes cornSway {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        @keyframes gentlePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        @keyframes waterDrop {
          0% { transform: translateY(0); opacity: 0.8; }
          100% { transform: translateY(12px); opacity: 0; }
        }
        @keyframes windFlow {
          0% { stroke-dashoffset: 0; opacity: 0.4; }
          100% { stroke-dashoffset: -30; opacity: 0.1; }
        }
      `}</style>

      {/* Background grid glow */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-25" 
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(118, 185, 0, 0.08) 0%, transparent 70%), linear-gradient(rgba(118, 185, 0, 0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(118, 185, 0, 0.12) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 40px 40px, 40px 40px'
        }}
      />
      
      {/* Zoom/Pan Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <button onClick={handleZoomIn}
          className="p-2 bg-zinc-950/80 border border-[#76B900]/30 hover:border-[#76B900] text-zinc-300 hover:text-white rounded-lg backdrop-blur-md transition-all shadow-md cursor-pointer">
          <ZoomIn size={16} />
        </button>
        <button onClick={handleZoomOut}
          className="p-2 bg-zinc-950/80 border border-[#76B900]/30 hover:border-[#76B900] text-zinc-300 hover:text-white rounded-lg backdrop-blur-md transition-all shadow-md cursor-pointer">
          <ZoomOut size={16} />
        </button>
        <button onClick={handleReset}
          className="p-2 bg-zinc-950/80 border border-[#76B900]/30 hover:border-[#76B900] text-zinc-300 hover:text-white rounded-lg backdrop-blur-md transition-all shadow-md cursor-pointer">
          <Maximize2 size={16} />
        </button>
      </div>

      {/* Telemetry HUD Panel */}
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
            <span className="text-[#76B900] font-bold">SIMULACIÓN SVG</span>
          </div>
          <div className="flex justify-between">
            <span>CULTIVOS VIVOS:</span>
            <span className="text-cyan-400">3 ANIMADOS + ECO</span>
          </div>
          <div className="flex justify-between">
            <span>RENDER FREQ:</span>
            <span className="text-white">{fps} FPS</span>
          </div>
          <div className="flex justify-between">
            <span>TWIN LATENCY:</span>
            <span className="text-[#76B900] font-bold">REALTIME</span>
          </div>
        </div>
      </div>

      {/* Sensor Tooltip */}
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

      {/* Actuator Tooltip */}
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

      {/* Main SVG Canvas */}
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
        {/* Gradients & Filters */}
        <defs>
          <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(118, 185, 0, 0.05)" strokeWidth="1" />
          </pattern>

          {/* Crop zone clip paths */}
          <clipPath id="clip-zone-0">
            <polygon points="80,60 720,60 670,210 130,210" />
          </clipPath>
          <clipPath id="clip-zone-1">
            <polygon points="130,230 670,230 620,380 180,380" />
          </clipPath>
          <clipPath id="clip-zone-2">
            <polygon points="180,400 620,400 570,550 230,550" />
          </clipPath>

          {/* Gaussian glows */}
          <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-cyan-filter" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComponentTransfer in="blur" result="glow"><feFuncA type="linear" slope="0.7"/></feComponentTransfer>
            <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-thermal-filter" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>

          {/* Mist gradient */}
          <radialGradient id="mist-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00ffcc" stopOpacity="0.45" />
            <stop offset="65%" stopColor="#00ffcc" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#00ffcc" stopOpacity="0" />
          </radialGradient>

          {/* Soil gradients */}
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

          {/* Crop bed soils */}
          <linearGradient id="tomato-soil" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b1c08" />
            <stop offset="100%" stopColor="#1a0c04" />
          </linearGradient>
          <linearGradient id="lettuce-soil" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1c2e1a" />
            <stop offset="100%" stopColor="#0a150a" />
          </linearGradient>
          <linearGradient id="corn-soil" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2a1a06" />
            <stop offset="100%" stopColor="#130d03" />
          </linearGradient>

          {/* Zone ambient glow gradients */}
          <radialGradient id="zone0-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#dc2626" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="zone1-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#16a34a" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="zone2-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>

          {/* Compost gradients */}
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
          <linearGradient id="steam-grad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#00ffcc" stopOpacity="0.45" />
            <stop offset="40%" stopColor="#22d3ee" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          {/* Compost barrel gradients */}
          <linearGradient id="compost-barrel-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#2d1200" />
            <stop offset="30%"  stopColor="#1a0900" />
            <stop offset="70%"  stopColor="#1a0900" />
            <stop offset="100%" stopColor="#0f0500" />
          </linearGradient>
          <radialGradient id="compost-dome-grad" cx="50%" cy="60%" r="70%">
            <stop offset="0%"   stopColor="#ca8a04" />
            <stop offset="50%"  stopColor="#9a3412" />
            <stop offset="100%" stopColor="#431407" />
          </radialGradient>
        </defs>


        {/* Grid backdrop */}
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />

        {/* Rover Path */}
        <g stroke="rgba(0, 255, 204, 0.12)" strokeWidth="1.5" strokeDasharray="5 3" fill="none">
          <polyline points={roverPathPoints.map(p => `${p.x},${p.y}`).join(' ')} />
          <line x1={roverPathPoints[5].x} y1={roverPathPoints[5].y}
            x2={roverPathPoints[0].x} y2={roverPathPoints[0].y} />
        </g>
        {roverPathPoints.map((pt, i) => (
          <g key={`wpt-${i}`} transform={`translate(${pt.x}, ${pt.y})`}>
            <circle r="4" fill="#000" stroke="#00ffcc" strokeWidth="1" opacity="0.6" />
            <circle r="2" fill="#00ffcc" opacity="0.8" />
          </g>
        ))}

        {/* Active Actuator Laser Circuits */}
        {zones.map((zone, zIdx) => {
          const zonePoly = zonePolygons[zIdx];
          if (!zonePoly) return null;
          return zone.actuators?.map((actuator, aIdx) => {
            if (!actuator.is_on) return null;
            const actCoords = getActuatorCoords(actuator.type, zIdx, aIdx);
            return (
              <path
                key={`laser-circuit-${actuator.id}`}
                d={`M ${actCoords.x},${actCoords.y} Q ${(actCoords.x + zonePoly.center.x) / 2},${(actCoords.y + zonePoly.center.y) / 2 - 30} ${zonePoly.center.x},${zonePoly.center.y}`}
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

        {/* Zone Slabs + Animated Crops */}
        {zonePolygons.map((zp) => {
          const zoneObj = zones[zp.id];
          const healthScore = zoneObj ? zoneObj.health_score : 100;
          const isHovered = hoveredZone === zp.id;
          const isActuatorActive = zoneObj?.actuators?.some(a => a.is_on) || false;
          const ledColor = getLedColor(healthScore, zp.id === 3);
          const isElevatedY = isHovered ? -8 : 0;
          const bb = zp.bbox;

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
              {/* Shadow */}
              <polygon points={zp.faces.shadow} fill="rgba(0, 0, 0, 0.55)"
                style={{ filter: 'blur(7px)' }} opacity={isHovered ? 0.8 : 0.6} />

              {/* 3D Slab sides */}
              <polygon points={zp.faces.left} fill="url(#soil-side-grad)"
                stroke="rgba(255, 255, 255, 0.03)" strokeWidth="0.5" />
              <polygon points={zp.faces.right} fill="url(#soil-side-grad)"
                stroke="rgba(255, 255, 255, 0.03)" strokeWidth="0.5" />
              <polygon points={zp.faces.front} fill="url(#soil-front-grad)"
                stroke="rgba(255, 255, 255, 0.04)" strokeWidth="0.5" />

              {/* Top face base fill */}
              {zp.id < 3 ? (
                <>
                  {/* Dark base fill for crop zones */}
                  <polygon points={zp.faces.top}
                    fill={`rgba(10, 8, 5, 0.92)`}
                    stroke="none" />
                  {/* Zone ambient color glow */}
                  <polygon points={zp.faces.top}
                    fill={`url(#zone${zp.id}-glow)`}
                    stroke="none" opacity={isHovered ? 0.8 : 0.5} />
                  {/* Animated crop simulation clipped to top face */}
                  <g clipPath={`url(#clip-zone-${zp.id})`}>
                    {zp.id === 0 && (
                      <TomatoPlants
                        x={bb.x} y={bb.y} width={bb.w} height={bb.h}
                        isWatered={isActuatorActive} isHovered={isHovered}
                      />
                    )}
                    {zp.id === 1 && (
                      <LettuceBed
                        x={bb.x} y={bb.y} width={bb.w} height={bb.h}
                        isWatered={isActuatorActive} isHovered={isHovered}
                      />
                    )}
                    {zp.id === 2 && (
                      <CornField
                        x={bb.x} y={bb.y} width={bb.w} height={bb.h}
                        isVentilated={isActuatorActive} isHovered={isHovered}
                      />
                    )}
                  </g>
                  {/* LED perimeter */}
                  <polygon points={zp.faces.top} fill="none"
                    stroke={ledColor} strokeWidth={isHovered ? "2.5" : "1.5"}
                    className="isometric-slab"
                    style={{ filter: isHovered ? `drop-shadow(0 0 12px ${ledColor})` : 'none' }} />
                </>
              ) : (
                <>
                  {/* Eco-Sector: Cybernetic cian slab */}
                  <polygon points={zp.faces.top}
                    fill={isHovered ? "rgba(18, 18, 22, 0.95)" : "rgba(10, 10, 12, 0.92)"}
                    stroke={ledColor} strokeWidth={isHovered ? "2.5" : "1.5"}
                    className="isometric-slab"
                    style={{ filter: isHovered ? `drop-shadow(0 0 12px ${ledColor})` : 'none' }} />
                  {renderEcoOverlay(isActuatorActive)}
                </>
              )}

              {/* Zone label */}
              <text x={zp.center.x} y={zp.center.y - 45}
                textAnchor="middle"
                fill={isHovered ? ledColor : "rgba(255, 255, 255, 0.25)"}
                fontSize="9.5" fontFamily="JetBrains Mono" fontWeight="bold"
                letterSpacing="1"
                style={{ transition: 'fill 0.3s ease' }}>
                {zp.label.toUpperCase()}
              </text>

              {/* Weather / mist overlays */}
              {renderWeatherOverlay(zp.id, isActuatorActive)}
            </g>
          );
        })}

        {/* Sensor Nodes */}
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
                    ...coords, x: coords.x, y: coords.y + yOffset,
                    id: sensor.id, sensorName: sensor.name,
                    value: sensor.latest_value, unit: sensor.unit
                  })}
                  onMouseLeave={() => setHoveredSensor(null)}
                  style={{ transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)' }}
                >
                  <circle r="12" fill="none" stroke={sensorColor} strokeWidth="1.5"
                    className="animate-ping" style={{ animationDuration: '3s' }} opacity="0.3" />
                  <circle r="6.5" fill="#050505" stroke={sensorColor} strokeWidth="1.5" />
                  <circle r="2.5" fill={sensorColor} />
                </g>
              );
            })}
          </g>
        ))}

        {/* Actuator Nodes */}
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
                    ...coords, x: coords.x, y: coords.y + yOffset,
                    id: actuator.id, name: actuator.name, is_on: actuator.is_on
                  })}
                  onMouseLeave={() => setHoveredActuator(null)}
                  onClick={(e) => handleActuatorClick(e, actuator)}
                  style={{ transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)' }}
                >
                  {actuator.is_on && (
                    <circle r="16" fill="none" stroke="#00ffcc" strokeWidth="1"
                      className="animate-pulse" opacity="0.5" />
                  )}
                  <circle r="9" fill="#080808"
                    stroke={actuator.is_on ? "#00ffcc" : "#555"}
                    strokeWidth="1.5" className="group-hover:stroke-[#76B900] transition-colors" />
                  {isToggling ? (
                    <circle r="4" fill="none" stroke="#00ffcc" strokeWidth="1.5"
                      strokeDasharray="4 2" className="animate-spin" />
                  ) : (
                    <polygon points="-3,-3 3,-3 0,4"
                      fill={actuator.is_on ? "#00ffcc" : "#777"}
                      transform={actuator.is_on ? "rotate(180)" : ""}
                      style={{ transition: 'transform 0.5s ease-in-out' }} />
                  )}
                </g>
              );
            })}
          </g>
        ))}

        {/* AgriRover */}
        {roverTelemetry && (
          <g transform={`translate(${roverX}, ${roverY})`}>
            {roverTelemetry.status === "patrolling" && (
              <circle r="30" fill="none" stroke="#00ffcc" strokeWidth="1.2"
                className="animate-sonar" style={{ pointerEvents: 'none' }} />
            )}
            {roverTelemetry.status === "patrolling" && (
              <g className="animate-lidar" style={{ animationDuration: '4s', pointerEvents: 'none' }}>
                <path d="M 0,0 L -70,-120 A 140 140 0 0,1 70,-120 Z"
                  fill="url(#lidar-gradient)" opacity="0.18" />
              </g>
            )}
            <defs>
              <radialGradient id="lidar-gradient" cx="50%" cy="100%" r="100%">
                <stop offset="0%" stopColor="#00ffcc" stopOpacity="0.85" />
                <stop offset="40%" stopColor="#00ffcc" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#00ffcc" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle r="22" fill="none" stroke="#00ffcc" strokeWidth="0.75"
              strokeDasharray="4 4" className="animate-spin" style={{ animationDuration: '10s' }} />
            <circle r="14.5" fill="rgba(0,0,0,0.95)" stroke="#00ffcc" strokeWidth="2"
              style={{ filter: 'drop-shadow(0 0 8px rgba(0,255,204,0.55))' }} />
            <g transform={`rotate(${roverTelemetry.heading})`}>
              <polygon points="-5,4 5,4 0,-10" fill="#00ffcc" />
            </g>
            <rect x="-24" y="19" width="48" height="10.5" rx="2.5"
              fill="rgba(0,0,0,0.9)" stroke="rgba(0,255,204,0.35)" strokeWidth="0.75" />
            <text x="0" y="26.5" textAnchor="middle" fill="#00ffcc"
              fontSize="6" fontFamily="JetBrains Mono" fontWeight="bold">ROVER-1</text>
          </g>
        )}
      </svg>

      {/* Rover Pose Indicator */}
      {roverTelemetry && (
        <div className="absolute bottom-4 right-4 z-10 bg-zinc-950/80 border border-zinc-800 rounded px-2.5 py-1.5 backdrop-blur-md shadow-md font-mono text-[9px] text-cyan-400">
          ROVER POSE: X: {roverTelemetry.x.toFixed(2)}m | Y: {roverTelemetry.y.toFixed(2)}m | HDG: {roverTelemetry.heading.toFixed(1)}°
        </div>
      )}

      {/* Battery Indicator */}
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
