import React, { useState, useEffect, Component } from 'react';
import { UserCheck, Layers, HelpCircle, ShieldCheck, AlertOctagon } from 'lucide-react';
import Header from './components/Header';
import SinglePrediction from './components/SinglePrediction';
import BatchPrediction from './components/BatchPrediction';
import ModelIntelModal from './components/ModelIntelModal';

const API_BASE_URL = 'http://127.0.0.1:8000';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', margin: '2rem auto', maxWidth: '600px' }}>
          <AlertOctagon size={48} color="var(--risk-high)" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>An Unexpected UI Error Occurred</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            {this.state.error?.message || 'Component failed to render.'}
          </p>
          <button 
            className="preset-btn"
            onClick={() => window.location.reload()}
            style={{ margin: '0 auto', background: 'var(--primary-500)', color: '#fff' }}
          >
            Reload Platform
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState('single'); // 'single' | 'batch'
  const [backendHealth, setBackendHealth] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [intelOpen, setIntelOpen] = useState(false);

  // Poll or check backend health & metadata on startup
  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        const healthRes = await fetch(`${API_BASE_URL}/health`);
        if (healthRes.ok) {
          const healthData = await healthRes.json();
          setBackendHealth(healthData);
        }
      } catch (err) {
        console.warn('Backend server not detected yet on http://127.0.0.1:8000');
      }

      try {
        const metaRes = await fetch(`${API_BASE_URL}/metadata`);
        if (metaRes.ok) {
          const metaData = await metaRes.json();
          setMetadata(metaData);
        }
      } catch (err) {
        console.warn('Could not load metadata from backend');
      }
    };

    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      {/* Top Header & System Indicator */}
      <Header 
        backendHealth={backendHealth} 
        onOpenIntel={() => setIntelOpen(true)} 
      />

      {/* Primary Tab Navigation */}
      <nav className="tabs-nav">
        <button
          type="button"
          id="tab-single-btn"
          className={`tab-btn ${activeTab === 'single' ? 'active' : ''}`}
          onClick={() => setActiveTab('single')}
        >
          <UserCheck size={18} />
          <span>Single Booking Risk Assessment</span>
        </button>

        <button
          type="button"
          id="tab-batch-btn"
          className={`tab-btn ${activeTab === 'batch' ? 'active' : ''}`}
          onClick={() => setActiveTab('batch')}
        >
          <Layers size={18} />
          <span>Batch Portfolio CSV Analyzer</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main>
        <ErrorBoundary>
          {activeTab === 'single' ? (
            <SinglePrediction 
              metadata={metadata} 
              apiBaseUrl={API_BASE_URL} 
            />
          ) : (
            <BatchPrediction 
              apiBaseUrl={API_BASE_URL} 
            />
          )}
        </ErrorBoundary>
      </main>

      {/* Modal Dialog for Model Intel & Architecture */}
      <ModelIntelModal 
        isOpen={intelOpen} 
        onClose={() => setIntelOpen(false)} 
      />

      {/* Footer */}
      <footer style={{ marginTop: '3.5rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        <p>AuraStay AI Intelligence • Stage 9 Operational Deployment • Rogue One Hotel Cancellation Analysis</p>
      </footer>
    </div>
  );
}
