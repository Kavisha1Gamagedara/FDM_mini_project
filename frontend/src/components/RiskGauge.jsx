import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';

export default function RiskGauge({ probability = 0, riskBand = 'Low Risk', riskLevel = 'low' }) {
  // Radius and circumference for radial gauge (ViewBox: 220 x 220, Center: 110, 110)
  const radius = 86;
  const circumference = 2 * Math.PI * radius; // ~540.35
  const strokeDashoffset = circumference - (probability * circumference);

  // Dynamic styling based on risk band
  let strokeColor = '#10b981';
  let innerBg = '#f0fdf4';
  let Icon = ShieldCheck;

  if (riskLevel === 'medium') {
    strokeColor = '#f59e0b';
    innerBg = '#fffbeb';
    Icon = AlertTriangle;
  } else if (riskLevel === 'high') {
    strokeColor = '#f43f5e';
    innerBg = '#fff1f2';
    Icon = AlertOctagon;
  }

  const pctDisplay = (probability * 100).toFixed(1);

  return (
    <div className="gauge-container">
      {/* Perfectly constrained circular dial wrapper */}
      <div className="gauge-dial-wrap">
        <svg className="gauge-svg" viewBox="0 0 220 220">
          {/* Soft tinted inner disc */}
          <circle
            cx="110"
            cy="110"
            r="78"
            fill={innerBg}
          />

          {/* Background track */}
          <circle
            className="gauge-bg"
            cx="110"
            cy="110"
            r={radius}
          />

          {/* Animated fill track */}
          <circle
            className="gauge-fill"
            cx="110"
            cy="110"
            r={radius}
            style={{
              stroke: strokeColor,
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset
            }}
          />
        </svg>

        {/* Center probability text - mathematically centered within the dial */}
        <div className="gauge-center-text">
          <span className="gauge-percent" style={{ color: strokeColor }}>
            {pctDisplay}%
          </span>
          <span className="gauge-label">
            Cancellation Risk
          </span>
        </div>
      </div>

      {/* Risk Badge Pill */}
      <div style={{ marginTop: '1.25rem' }}>
        <div className={`risk-band-pill ${riskLevel}`}>
          <Icon size={18} />
          <span>{riskBand}</span>
        </div>
      </div>
    </div>
  );
}
