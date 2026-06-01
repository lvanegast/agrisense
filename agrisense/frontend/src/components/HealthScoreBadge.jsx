import React from 'react';

export default function HealthScoreBadge({ value, size = 80 }) {
  const score = Math.max(0, Math.min(100, typeof value === 'number' ? value : 0));
  
  // Healthy Sprout Sprout Green, Amber, Red theme color mapping
  let color = '#22c55e'; // Sprout Green
  let shadow = 'rgba(34, 197, 94, 0.15)';
  if (score < 40) {
    color = '#ef4444'; // Red
    shadow = 'rgba(239, 68, 68, 0.15)';
  } else if (score < 70) {
    color = '#f59e0b'; // Amber
    shadow = 'rgba(245, 158, 11, 0.15)';
  }

  const radius = size * 0.4;
  const strokeWidth = size * 0.08;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Outer Accent Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius + strokeWidth / 1.5}
          fill="none"
          stroke="rgba(255, 255, 255, 0.04)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        
        {/* Background track */}
        <circle
          className="text-zinc-850"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 2px 4px ${shadow})`,
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      </svg>
      
      {/* Centered Percentage HUD text */}
      <div className="absolute flex flex-col items-center justify-center">
        <span className="font-mono font-bold leading-none select-none" style={{ fontSize: size * 0.28, color: color }}>
          {Math.round(score)}
        </span>
        <span className="text-[7px] font-mono tracking-wider text-zinc-500 uppercase font-semibold leading-none mt-0.5">
          SALUD
        </span>
      </div>
    </div>
  );
}
