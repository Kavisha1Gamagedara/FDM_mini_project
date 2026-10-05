import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';

export default function RiskGauge({ probability = 0, riskBand = 'Low Risk', riskLevel = 'low' }) {
  // Radius and circumference for radial gauge
  const radius = 80;
  const circumference = 2 * Math.PI * radius; // ~502.65
  const strokeDashoffset = circumference - (probability * circumference);

  // Dynamic styling based on risk band
  let strokeColor = 'var(--risk-low)';
  let glowColor = 'var(--risk-low-glow)';
  let Icon = ShieldCheck;

  if (riskLevel === 'medium') {
    strokeColor = 'var(--risk-med)';
    glowColor = 'var(--risk-med-glow)';
    Icon = AlertTriangle;
  } else if (riskLevel === 'high') {
    strokeColor = 'var(--risk-high)';
    glowColor = 'var(--risk-high-glow)';
    Icon = AlertOctagon;
  }

  const pctDisplay = (probability * 100).toFixed(1);

  return (
    <div className="gauge-container">
      <svg className="gauge-svg" viewBox="0 0 200 200">
        {/* Background track */}
        <circle
          className="gauge-bg"
          cx="100"
          cy="100"
          r={radius}
        />
        {/* Animated fill track */}
        <circle
          className="gauge-fill"
          cx="100"
          cy="100"
          r={radius}
          style={{
            stroke: strokeColor,
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
            filter: `drop-shadow(0 0 10px ${glowColor})`
          }}
        />
      </svg>

      {/* Center probability text */}
      <div className="gauge-center-text">
        <span className="gauge-percent" style={{ color: strokeColor }}>
          {pctDisplay}%
        </span>
        <span className="gauge-label">Cancellation Probability</span>
      </div>

      {/* Risk Badge Pill */}
      <div style={{ marginTop: '1rem' }}>
        <div className={`risk-band-pill ${riskLevel}`}>
          <Icon size={18} />
          <span>{riskBand}</span>
        </div>
      </div>
    </div>
  );
}
