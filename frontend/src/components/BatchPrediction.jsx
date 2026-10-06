import React, { useState } from 'react';
import { 
  UploadCloud, FileText, Download, CheckCircle2, 
  AlertOctagon, AlertTriangle, ShieldCheck, Search, Filter, 
  ArrowUpDown, RefreshCw
} from 'lucide-react';

export default function BatchPrediction({ apiBaseUrl }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [batchResult, setBatchResult] = useState(null);
  const [error, setError] = useState(null);
  const [filterBand, setFilterBand] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Handle Drag & Drop
  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  // Download Sample CSV
  const handleDownloadSample = () => {
    const csvContent = 
      "hotel,lead_time,arrival_date_month,arrival_date_week_number,stays_in_weekend_nights,stays_in_week_nights,adults,children,babies,meal,country,market_segment,distribution_channel,is_repeated_guest,previous_cancellations,previous_bookings_not_canceled,reserved_room_type,deposit_type,customer_type,adr,required_car_parking_spaces,total_of_special_requests\n" +
      "City Hotel,280,September,37,0,3,2,0,0,BB,PRT,Online TA,TA/TO,0,1,0,A,Non Refund,Transient,120.0,0,0\n" +
      "Resort Hotel,6,July,28,2,2,2,1,0,HB,GBR,Direct,Direct,1,0,4,D,No Deposit,Transient-Party,140.0,1,2\n" +
      "City Hotel,95,August,34,1,3,2,0,0,BB,FRA,Online TA,TA/TO,0,0,0,A,No Deposit,Transient,110.0,0,0\n" +
      "Resort Hotel,45,June,25,1,2,2,0,0,BB,ESP,Offline TA/TO,TA/TO,0,0,0,A,No Deposit,Transient,85.0,0,1\n" +
      "City Hotel,312,October,41,0,2,2,0,0,BB,PRT,Online TA,TA/TO,0,2,0,A,Non Refund,Transient,135.0,0,0\n" +
      "Resort Hotel,12,August,32,2,5,2,2,0,FB,DEU,Direct,Direct,0,0,1,G,No Deposit,Transient,220.0,1,3\n";

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_hotel_bookings_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit Batch File
  const handleUpload = async () => {
    if (!file) {
      setError('Please select or drop a CSV file first.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${apiBaseUrl}/predict/batch`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Batch processing failed.');
      }

      const data = await response.json();
      setBatchResult(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error executing batch prediction.');
    } finally {
      setLoading(false);
    }
  };

  // Export Results to CSV
  const handleExportResults = () => {
    if (!batchResult || !batchResult.predictions) return;

    const headers = [
      "Row_ID", "Hotel", "Lead_Time", "Country", "Deposit_Type", 
      "ADR", "Risk_Band", "Cancellation_Probability_Pct", "Recommendation"
    ];

    const rows = batchResult.predictions.map(p => [
      p.row_id,
      `"${p.hotel}"`,
      p.lead_time,
      `"${p.country}"`,
      `"${p.deposit_type}"`,
      p.adr,
      `"${p.risk_band}"`,
      p.cancellation_probability_pct,
      `"${p.recommendation.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `aurastay_batch_risk_results_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Predictions for Table View
  const filteredPredictions = (batchResult?.predictions || []).filter(item => {
    const matchesBand = filterBand === 'ALL' || item.risk_band.toUpperCase().includes(filterBand);
    const matchesSearch = 
      searchTerm === '' ||
      item.hotel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.deposit_type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesBand && matchesSearch;
  });

  return (
    <div className="batch-container">
      {/* Upload Box & Actions */}
      <div className="mat-card" style={{ padding: '2.5rem', borderRadius: '18px' }}>
        <div 
          className="upload-dropzone"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => document.getElementById('csv-file-input').click()}
        >
          <input 
            type="file" 
            id="csv-file-input" 
            accept=".csv" 
            style={{ display: 'none' }} 
            onChange={handleFileChange}
          />
          <div className="dropzone-icon">
            <UploadCloud size={32} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>
              {file ? file.name : 'Upload Batch Bookings CSV'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {file 
                ? `${(file.size / 1024).toFixed(1)} KB selected - Click to change` 
                : 'Drag and drop your reservations CSV file here, or click to browse'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <button 
            type="button" 
            className="preset-btn"
            onClick={handleDownloadSample}
          >
            <Download size={15} />
            <span>Download Compliant CSV Template</span>
          </button>

          <button 
            type="button" 
            className="submit-btn" 
            style={{ width: 'auto', minWidth: '220px' }}
            onClick={handleUpload}
            disabled={!file || loading}
          >
            {loading ? (
              <>
                <div className="animate-spin" style={{ width: '18px', height: '18px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                <span>Evaluating Portfolio...</span>
              </>
            ) : (
              <>
                <FileText size={18} />
                <span>Process Portfolio Bookings</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div style={{ marginTop: '1.25rem', padding: '0.85rem 1.25rem', background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.4)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.88rem' }}>
            {error}
          </div>
        )}
      </div>

      {/* Batch Results & Portfolio Analytics */}
      {batchResult && (
        <>
          {/* 5 Portfolio Summary Metric Cards */}
          <div className="batch-stats-grid">
            <div className="stat-card">
              <span className="stat-title">Total Evaluated</span>
              <span className="stat-value" style={{ color: 'var(--text-primary)' }}>
                {batchResult.total_bookings}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reservations analyzed</span>
            </div>

            <div className="stat-card" style={{ borderColor: 'var(--risk-high-border)' }}>
              <span className="stat-title" style={{ color: '#fda4af' }}>High Risk Tier</span>
              <span className="stat-value" style={{ color: 'var(--risk-high)' }}>
                {batchResult.high_risk_count}
                <span style={{ fontSize: '1rem', fontWeight: 600, marginLeft: '0.4rem' }}>
                  ({batchResult.high_risk_pct}%)
                </span>
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>P ≥ 60% (Action Required)</span>
            </div>

            <div className="stat-card" style={{ borderColor: 'var(--risk-med-border)' }}>
              <span className="stat-title" style={{ color: '#fde68a' }}>Medium Risk Tier</span>
              <span className="stat-value" style={{ color: 'var(--risk-med)' }}>
                {batchResult.medium_risk_count}
                <span style={{ fontSize: '1rem', fontWeight: 600, marginLeft: '0.4rem' }}>
                  ({batchResult.medium_risk_pct}%)
                </span>
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>35% ≤ P &lt; 60%</span>
            </div>

            <div className="stat-card" style={{ borderColor: 'var(--risk-low-border)' }}>
              <span className="stat-title" style={{ color: '#6ee7b7' }}>Low Risk Tier</span>
              <span className="stat-value" style={{ color: 'var(--risk-low)' }}>
                {batchResult.low_risk_count}
                <span style={{ fontSize: '1rem', fontWeight: 600, marginLeft: '0.4rem' }}>
                  ({batchResult.low_risk_pct}%)
                </span>
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>P &lt; 35% (Secure)</span>
            </div>

            <div className="stat-card">
              <span className="stat-title">Avg Portfolio Risk</span>
              <span className="stat-value" style={{ color: 'var(--primary-400)' }}>
                {batchResult.average_cancellation_probability_pct}%
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mean cancellation prob</span>
            </div>
          </div>

          {/* Interactive Results Table */}
          <div className="table-card">
            <div className="table-toolbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', padding: '0.45rem 0.85rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', width: '260px' }}>
                  <Search size={16} color="var(--text-muted)" style={{ marginRight: '0.5rem' }} />
                  <input 
                    type="text" 
                    placeholder="Search hotel, country..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: '#0f172a', fontSize: '0.85rem', width: '100%', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(band => (
                    <button
                      key={band}
                      className={`preset-btn ${filterBand === band ? 'active' : ''}`}
                      onClick={() => setFilterBand(band)}
                      style={{
                        background: filterBand === band ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.03)',
                        borderColor: filterBand === band ? 'var(--primary-500)' : 'var(--border-subtle)',
                        color: filterBand === band ? '#ffffff' : 'var(--text-secondary)'
                      }}
                    >
                      {band}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                type="button"
                className="preset-btn"
                onClick={handleExportResults}
                style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)', color: '#34d399' }}
              >
                <Download size={14} />
                <span>Export Evaluated CSV</span>
              </button>
            </div>

            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Hotel</th>
                    <th>Lead Time</th>
                    <th>Country</th>
                    <th>Deposit</th>
                    <th>ADR</th>
                    <th>Risk Band</th>
                    <th>Cancel Prob</th>
                    <th>Revenue Advice</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPredictions.map((row) => {
                    let badgeClass = 'low';
                    if (row.risk_band === 'High Risk') badgeClass = 'high';
                    else if (row.risk_band === 'Medium Risk') badgeClass = 'medium';

                    return (
                      <tr key={row.row_id}>
                        <td style={{ color: 'var(--text-muted)' }}>{row.row_id}</td>
                        <td style={{ fontWeight: 600 }}>{row.hotel}</td>
                        <td>{row.lead_time} days</td>
                        <td>{row.country}</td>
                        <td>{row.deposit_type}</td>
                        <td>${Number(row.adr).toFixed(2)}</td>
                        <td>
                          <span className={`risk-band-pill ${badgeClass}`} style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                            {row.risk_band}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700 }}>
                          {row.cancellation_probability_pct}%
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: '280px' }}>
                          {row.recommendation}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
