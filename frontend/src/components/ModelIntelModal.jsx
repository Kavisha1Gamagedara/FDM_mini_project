import React from 'react';
import { X, Cpu, CheckCircle2, BarChart2, ShieldAlert, Layers } from 'lucide-react';

export default function ModelIntelModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--primary-500), #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Cpu size={22} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem' }}>Operational Machine Learning Intelligence</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Hotel Cancellation Risk Prediction & Revenue Optimization Architecture
            </p>
          </div>
        </div>

        {/* Champion Model Performance */}
        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <BarChart2 size={16} color="var(--primary-400)" />
            <h4 style={{ fontSize: '0.9rem', color: '#fff' }}>Production Model Performance Benchmark</h4>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
            <div style={{ padding: '0.6rem', background: 'var(--bg-card)', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>F1-SCORE</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-400)' }}>0.810</div>
            </div>
            <div style={{ padding: '0.6rem', background: 'var(--bg-card)', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ROC-AUC</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399' }}>0.925</div>
            </div>
            <div style={{ padding: '0.6rem', background: 'var(--bg-card)', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ACCURACY</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>84.1%</div>
            </div>
            <div style={{ padding: '0.6rem', background: 'var(--bg-card)', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>RECALL</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24' }}>77.2%</div>
            </div>
          </div>
        </div>

        {/* Feature Pipeline */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
            <Layers size={16} color="var(--primary-400)" />
            <h4 style={{ fontSize: '0.9rem', color: '#fff' }}>Feature Pipeline Alignment (93 Features)</h4>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            The operational backend accepts raw hotel booking attributes, executes robust row-wise feature engineering (Total Stay, Total Guests, Lead Time Log transform, ADR Log transform, Season mapping, and Exact One-Hot Encoding), and guarantees 100% schema alignment with the 93 tree-based model features.
          </p>
        </div>

        {/* Risk Thresholds & Interventions */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <ShieldAlert size={16} color="var(--primary-400)" />
            <h4 style={{ fontSize: '0.9rem', color: '#fff' }}>Operational Risk Banding (Proposal Section 10)</h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--risk-low-bg)', border: '1px solid var(--risk-low-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#34d399', fontSize: '0.85rem' }}>
                <span>Low Risk Tier</span>
                <span>P &lt; 35%</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Secure booking. Standard automated check-in reminder. Eligible for pre-arrival room upgrades and ancillary service promotion.
              </p>
            </div>

            <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--risk-med-bg)', border: '1px solid var(--risk-med-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#fbbf24', fontSize: '0.85rem' }}>
                <span>Medium Risk Tier</span>
                <span>35% ≤ P &lt; 60%</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Moderate churn probability. Send personalized re-confirmation SMS/Email 7 days prior. Offer discounted non-refundable amendment incentives.
              </p>
            </div>

            <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--risk-high-bg)', border: '1px solid var(--risk-high-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#fb7185', fontSize: '0.85rem' }}>
                <span>High Risk Tier</span>
                <span>P ≥ 60%</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                High cancellation probability. Enforce mandatory guarantee / deposit, shorten free cancellation window, and feed into targeted revenue overbooking buffers.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
