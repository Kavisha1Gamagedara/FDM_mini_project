import React, { useState, useEffect } from 'react';
import { 
  Building2, Calendar, Clock, UserCheck, CreditCard, Sparkles, 
  RotateCcw, AlertTriangle, AlertOctagon, CheckCircle2, Info, ChevronRight,
  TrendingUp, Compass, Award, ShieldAlert
} from 'lucide-react';
import RiskGauge from './RiskGauge';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function formatDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(d, days) {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}

function getISOWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return Math.min(Math.max(weekNo, 1), 53);
}

function computeStayNights(arrivalStr, departureStr) {
  if (!arrivalStr || !departureStr) return { weekendNights: 0, weekNights: 0 };
  const cur = new Date(arrivalStr + 'T00:00:00');
  const end = new Date(departureStr + 'T00:00:00');
  let weekendNights = 0;
  let weekNights = 0;
  while (cur < end) {
    const day = cur.getDay(); // 0 is Sunday, 6 is Saturday
    if (day === 0 || day === 6) {
      weekendNights++;
    } else {
      weekNights++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return { weekendNights, weekNights };
}

const DEFAULT_FORM = {
  hotel: 'City Hotel',
  lead_time: 45,
  arrival_date_month: 'July',
  arrival_date_week_number: 28,
  stays_in_weekend_nights: 1,
  stays_in_week_nights: 2,
  adults: 2,
  children: 0,
  babies: 0,
  meal: 'BB',
  country: 'PRT',
  market_segment: 'Online TA',
  distribution_channel: 'TA/TO',
  is_repeated_guest: 0,
  previous_cancellations: 0,
  previous_bookings_not_canceled: 0,
  reserved_room_type: 'A',
  deposit_type: 'No Deposit',
  customer_type: 'Transient',
  adr: 115.0,
  required_car_parking_spaces: 0,
  total_of_special_requests: 1
};

const PRESETS = {
  highRisk: {
    hotel: 'City Hotel',
    lead_time: 280,
    arrival_date_month: 'September',
    arrival_date_week_number: 37,
    stays_in_weekend_nights: 0,
    stays_in_week_nights: 3,
    adults: 2,
    children: 0,
    babies: 0,
    meal: 'BB',
    country: 'PRT',
    market_segment: 'Online TA',
    distribution_channel: 'TA/TO',
    is_repeated_guest: 0,
    previous_cancellations: 1,
    previous_bookings_not_canceled: 0,
    reserved_room_type: 'A',
    deposit_type: 'Non Refund',
    customer_type: 'Transient',
    adr: 120.0,
    required_car_parking_spaces: 0,
    total_of_special_requests: 0
  },
  lowRisk: {
    hotel: 'Resort Hotel',
    lead_time: 6,
    arrival_date_month: 'July',
    arrival_date_week_number: 28,
    stays_in_weekend_nights: 2,
    stays_in_week_nights: 2,
    adults: 2,
    children: 1,
    babies: 0,
    meal: 'HB',
    country: 'GBR',
    market_segment: 'Direct',
    distribution_channel: 'Direct',
    is_repeated_guest: 1,
    previous_cancellations: 0,
    previous_bookings_not_canceled: 4,
    reserved_room_type: 'D',
    deposit_type: 'No Deposit',
    customer_type: 'Transient-Party',
    adr: 140.0,
    required_car_parking_spaces: 1,
    total_of_special_requests: 2
  },
  medRisk: {
    hotel: 'City Hotel',
    lead_time: 95,
    arrival_date_month: 'August',
    arrival_date_week_number: 34,
    stays_in_weekend_nights: 1,
    stays_in_week_nights: 3,
    adults: 2,
    children: 0,
    babies: 0,
    meal: 'BB',
    country: 'FRA',
    market_segment: 'Online TA',
    distribution_channel: 'TA/TO',
    is_repeated_guest: 0,
    previous_cancellations: 0,
    previous_bookings_not_canceled: 0,
    reserved_room_type: 'A',
    deposit_type: 'No Deposit',
    customer_type: 'Transient',
    adr: 110.0,
    required_car_parking_spaces: 0,
    total_of_special_requests: 0
  }
};

export default function SinglePrediction({ metadata, apiBaseUrl, selectedCustomerBooking }) {
  const today = new Date();
  const todayStr = formatDate(today);
  const initialBookingDate = todayStr;
  const initialArrivalDate = formatDate(addDays(today, 45));
  const initialDepartureDate = formatDate(addDays(today, 48));

  const [bookingDate, setBookingDate] = useState(initialBookingDate);
  const [arrivalDate, setArrivalDate] = useState(initialArrivalDate);
  const [departureDate, setDepartureDate] = useState(initialDepartureDate);

  const [form, setForm] = useState(() => {
    const aDate = addDays(today, 45);
    return {
      ...DEFAULT_FORM,
      arrival_date_month: MONTH_NAMES[aDate.getMonth()],
      arrival_date_week_number: getISOWeekNumber(aDate)
    };
  });

  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);

  // Automatically populate form when a customer booking is selected from the live feed
  useEffect(() => {
    if (selectedCustomerBooking) {
      setForm(prev => ({
        ...prev,
        hotel: selectedCustomerBooking.hotel || prev.hotel,
        lead_time: selectedCustomerBooking.lead_time ?? prev.lead_time,
        arrival_date_month: selectedCustomerBooking.arrival_date_month || prev.arrival_date_month,
        arrival_date_week_number: selectedCustomerBooking.arrival_date_week_number || prev.arrival_date_week_number,
        stays_in_weekend_nights: selectedCustomerBooking.stays_in_weekend_nights ?? prev.stays_in_weekend_nights,
        stays_in_week_nights: selectedCustomerBooking.stays_in_week_nights ?? prev.stays_in_week_nights,
        adults: selectedCustomerBooking.adults ?? prev.adults,
        children: selectedCustomerBooking.children ?? prev.children,
        babies: selectedCustomerBooking.babies ?? prev.babies,
        meal: selectedCustomerBooking.meal || prev.meal,
        country: selectedCustomerBooking.country || prev.country,
        market_segment: selectedCustomerBooking.market_segment || prev.market_segment,
        distribution_channel: selectedCustomerBooking.distribution_channel || prev.distribution_channel,
        is_repeated_guest: selectedCustomerBooking.is_repeated_guest ?? prev.is_repeated_guest,
        reserved_room_type: selectedCustomerBooking.reserved_room_type || prev.reserved_room_type,
        deposit_type: selectedCustomerBooking.deposit_type || prev.deposit_type,
        customer_type: selectedCustomerBooking.customer_type || prev.customer_type,
        adr: selectedCustomerBooking.adr ?? prev.adr,
        required_car_parking_spaces: selectedCustomerBooking.required_car_parking_spaces ?? prev.required_car_parking_spaces,
        total_of_special_requests: selectedCustomerBooking.total_of_special_requests ?? prev.total_of_special_requests
      }));

      if (selectedCustomerBooking.prediction) {
        setPrediction(selectedCustomerBooking.prediction);
      }
    }
  }, [selectedCustomerBooking]);

  const countryList = (metadata?.top_countries || [
    { code: 'PRT', name: 'Portugal (PRT)' },
    { code: 'GBR', name: 'United Kingdom (GBR)' },
    { code: 'FRA', name: 'France (FRA)' },
    { code: 'ESP', name: 'Spain (ESP)' },
    { code: 'DEU', name: 'Germany (DEU)' },
    { code: 'ITA', name: 'Italy (ITA)' },
    { code: 'IRL', name: 'Ireland (IRL)' },
    { code: 'BEL', name: 'Belgium (BEL)' },
    { code: 'BRA', name: 'Brazil (BRA)' },
    { code: 'USA', name: 'United States (USA)' },
    { code: 'NLD', name: 'Netherlands (NLD)' },
    { code: 'CHE', name: 'Switzerland (CHE)' },
    { code: 'CN', name: 'China (CN)' },
    { code: 'AUT', name: 'Austria (AUT)' },
    { code: 'SWE', name: 'Sweden (SWE)' },
    { code: 'Other', name: 'Other Country' }
  ]).map(c => (typeof c === 'string' ? { code: c, name: c } : c));

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let parsedValue = value;
    if (type === 'number') {
      parsedValue = value === '' ? '' : Number(value);
    }
    setForm(prev => ({ ...prev, [name]: parsedValue }));
  };

  // Handlers for dynamic calendar synchronization with min date enforcement
  const handleBookingDateChange = (e) => {
    let newBooking = e.target.value;
    if (newBooking && newBooking < todayStr) {
      newBooking = todayStr;
    }
    setBookingDate(newBooking);
    if (newBooking && arrivalDate) {
      let curArrival = arrivalDate;
      if (curArrival < newBooking) {
        curArrival = newBooking;
        setArrivalDate(newBooking);
      }
      const b = new Date(newBooking + 'T00:00:00');
      const a = new Date(curArrival + 'T00:00:00');
      const leadTime = Math.max(0, Math.round((a - b) / (1000 * 60 * 60 * 24)));
      setForm(prev => ({ ...prev, lead_time: leadTime }));
    }
  };

  const handleArrivalDateChange = (e) => {
    let newArrival = e.target.value;
    const minArrival = bookingDate || todayStr;
    if (newArrival && newArrival < minArrival) {
      newArrival = minArrival;
    }
    setArrivalDate(newArrival);
    if (newArrival) {
      const a = new Date(newArrival + 'T00:00:00');
      const newMonth = MONTH_NAMES[a.getMonth()];
      const newWeek = getISOWeekNumber(a);

      let newLeadTime = form.lead_time;
      if (bookingDate) {
        const b = new Date(bookingDate + 'T00:00:00');
        newLeadTime = Math.max(0, Math.round((a - b) / (1000 * 60 * 60 * 24)));
      }

      // Check and adjust departure date if needed
      let updatedDep = departureDate;
      const depDateObj = new Date(departureDate + 'T00:00:00');
      if (depDateObj <= a) {
        const adjustedDep = addDays(a, 3);
        updatedDep = formatDate(adjustedDep);
        setDepartureDate(updatedDep);
      }

      const { weekendNights, weekNights } = computeStayNights(newArrival, updatedDep);

      setForm(prev => ({
        ...prev,
        lead_time: newLeadTime,
        arrival_date_month: newMonth,
        arrival_date_week_number: newWeek,
        stays_in_weekend_nights: weekendNights,
        stays_in_week_nights: weekNights
      }));
    }
  };

  const handleDepartureDateChange = (e) => {
    let newDeparture = e.target.value;
    const minDeparture = arrivalDate ? formatDate(addDays(new Date(arrivalDate + 'T00:00:00'), 1)) : todayStr;
    if (newDeparture && newDeparture < minDeparture) {
      newDeparture = minDeparture;
    }
    setDepartureDate(newDeparture);
    if (arrivalDate && newDeparture) {
      const { weekendNights, weekNights } = computeStayNights(arrivalDate, newDeparture);
      setForm(prev => ({
        ...prev,
        stays_in_weekend_nights: weekendNights,
        stays_in_week_nights: weekNights
      }));
    }
  };

  const handleLeadTimeSlider = (e) => {
    const newLead = Number(e.target.value);
    const b = bookingDate ? new Date(bookingDate + 'T00:00:00') : new Date();
    const newArrival = addDays(b, newLead);
    const newArrivalStr = formatDate(newArrival);
    const newMonth = MONTH_NAMES[newArrival.getMonth()];
    const newWeek = getISOWeekNumber(newArrival);

    const totalNightsStay = (Number(form.stays_in_weekend_nights) + Number(form.stays_in_week_nights)) || 3;
    const newDeparture = addDays(newArrival, totalNightsStay);
    const newDepartureStr = formatDate(newDeparture);

    setArrivalDate(newArrivalStr);
    setDepartureDate(newDepartureStr);

    const { weekendNights, weekNights } = computeStayNights(newArrivalStr, newDepartureStr);

    setForm(prev => ({
      ...prev,
      lead_time: newLead,
      arrival_date_month: newMonth,
      arrival_date_week_number: newWeek,
      stays_in_weekend_nights: weekendNights,
      stays_in_week_nights: weekNights
    }));
  };

  const handlePreset = (type) => {
    if (PRESETS[type]) {
      const p = PRESETS[type];
      const todayDate = new Date();
      const bStr = formatDate(todayDate);
      const aDate = addDays(todayDate, p.lead_time);
      const aStr = formatDate(aDate);
      const dDate = addDays(aDate, p.stays_in_weekend_nights + p.stays_in_week_nights);
      const dStr = formatDate(dDate);

      setBookingDate(bStr);
      setArrivalDate(aStr);
      setDepartureDate(dStr);

      setForm({
        ...p,
        arrival_date_month: MONTH_NAMES[aDate.getMonth()],
        arrival_date_week_number: getISOWeekNumber(aDate)
      });
      setPrediction(null);
      setError(null);
    }
  };

  const handleReset = () => {
    const todayDate = new Date();
    const bStr = formatDate(todayDate);
    const aDate = addDays(todayDate, DEFAULT_FORM.lead_time);
    const aStr = formatDate(aDate);
    const dDate = addDays(aDate, DEFAULT_FORM.stays_in_weekend_nights + DEFAULT_FORM.stays_in_week_nights);
    const dStr = formatDate(dDate);

    setBookingDate(bStr);
    setArrivalDate(aStr);
    setDepartureDate(dStr);

    setForm({
      ...DEFAULT_FORM,
      arrival_date_month: MONTH_NAMES[aDate.getMonth()],
      arrival_date_week_number: getISOWeekNumber(aDate)
    });
    setPrediction(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Prediction failed');
      }

      const data = await response.json();
      setPrediction(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error connecting to prediction backend.');
    } finally {
      setLoading(false);
    }
  };

  const totalNights = Number(form.stays_in_weekend_nights || 0) + Number(form.stays_in_week_nights || 0);
  const totalGuests = Number(form.adults || 0) + Number(form.children || 0) + Number(form.babies || 0);

  return (
    <div>
      {/* Presets and Quick Actions */}
      <div className="presets-bar">
        <div className="preset-title">
          <Sparkles size={17} color="#4f46e5" />
          <span>Quick Scenario Presets:</span>
        </div>
        <div className="preset-buttons">
          <button 
            type="button" 
            className="preset-btn high"
            onClick={() => handlePreset('highRisk')}
          >
            🔴 High Risk (Non-Refundable, 280d Lead)
          </button>
          <button 
            type="button" 
            className="preset-btn low"
            onClick={() => handlePreset('lowRisk')}
          >
            🟢 Low Risk (Direct, Repeat, 6d Lead)
          </button>
          <button 
            type="button" 
            className="preset-btn med"
            onClick={() => handlePreset('medRisk')}
          >
            🟡 Medium Risk (Online TA, 95d Lead)
          </button>
          <button 
            type="button" 
            className="preset-btn"
            onClick={handleReset}
            title="Reset Form"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <div className="single-grid">
        {/* Reservation Inputs Form */}
        <form className="form-card" onSubmit={handleSubmit}>
          
          {/* SECTION 1: Hotel & Stay Duration */}
          <div>
            <div className="form-section-title">
              <Building2 size={20} color="#4f46e5" />
              <span>1. Property & Stay Duration (Calendar Synced)</span>
            </div>

            {/* Row 1: Property and Calendar Date Pickers */}
            <div className="form-row">
              <div className="input-group">
                <label className="input-label" htmlFor="hotel">Hotel Type</label>
                <select 
                  id="hotel" 
                  name="hotel" 
                  className="select-field"
                  value={form.hotel} 
                  onChange={handleChange}
                >
                  <option value="City Hotel">City Hotel</option>
                  <option value="Resort Hotel">Resort Hotel</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="booking_date">
                  Booking Date
                  <span className="input-label-badge">Today onwards</span>
                </label>
                <input 
                  id="booking_date" 
                  type="date" 
                  className="input-field"
                  min={todayStr}
                  value={bookingDate} 
                  onChange={handleBookingDateChange}
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="arrival_date">
                  Arrival (Check-in)
                  <span className="input-label-badge" style={{ color: '#34d399' }}>Auto-synced</span>
                </label>
                <input 
                  id="arrival_date" 
                  type="date" 
                  className="input-field"
                  min={bookingDate || todayStr}
                  value={arrivalDate} 
                  onChange={handleArrivalDateChange}
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="departure_date">
                  Departure (Check-out)
                  <span className="input-label-badge" style={{ color: '#34d399' }}>Auto-synced</span>
                </label>
                <input 
                  id="departure_date" 
                  type="date" 
                  className="input-field"
                  min={arrivalDate ? formatDate(addDays(new Date(arrivalDate + 'T00:00:00'), 1)) : todayStr}
                  value={departureDate} 
                  onChange={handleDepartureDateChange}
                />
              </div>
            </div>

            {/* Auto-Calculated Schedule & Calendar Intelligence Banner */}
            <div className="auto-schedule-banner">
              <div className="auto-schedule-item">
                <span className="auto-schedule-label">
                  <Clock size={12} />
                  Lead Time
                </span>
                <span className="auto-schedule-value" style={{ color: form.lead_time > 150 ? '#fda4af' : '#6ee7b7' }}>
                  {form.lead_time} days
                </span>
              </div>

              <div className="auto-schedule-item">
                <span className="auto-schedule-label">
                  <Calendar size={12} />
                  Month
                </span>
                <span className="auto-schedule-value">
                  {form.arrival_date_month}
                </span>
              </div>

              <div className="auto-schedule-item">
                <span className="auto-schedule-label">
                  <Calendar size={12} />
                  Week No.
                </span>
                <span className="auto-schedule-value">
                  Week {form.arrival_date_week_number}
                </span>
              </div>

              <div className="auto-schedule-item">
                <span className="auto-schedule-label">
                  Weekend
                </span>
                <span className="auto-schedule-value">
                  {form.stays_in_weekend_nights} nts
                </span>
              </div>

              <div className="auto-schedule-item">
                <span className="auto-schedule-label">
                  Weekday
                </span>
                <span className="auto-schedule-value">
                  {form.stays_in_week_nights} nts
                </span>
              </div>

              <div className="auto-schedule-item">
                <span className="auto-schedule-label" style={{ color: '#f59e0b' }}>
                  Total Stay
                </span>
                <span className="auto-schedule-value" style={{ color: '#fde68a' }}>
                  {totalNights} nights
                </span>
              </div>
            </div>

            {/* Fine-Tuning Lead Time Slider & Night Overrides */}
            <div className="form-row" style={{ marginTop: '1.25rem' }}>
              <div className="input-group" style={{ gridColumn: 'span 2' }}>
                <div className="input-label">
                  <label htmlFor="lead_time">Lead Time Slider (Auto-shifts Arrival Date)</label>
                  <span className="input-label-badge">{form.lead_time} days elapsed</span>
                </div>
                <div className="slider-wrap">
                  <input 
                    id="lead_time" 
                    type="range" 
                    name="lead_time" 
                    min="0" 
                    max="500" 
                    className="range-slider"
                    value={form.lead_time} 
                    onChange={handleLeadTimeSlider}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span>0 days (Same-day check-in)</span>
                    <span>180 days (~6 months)</span>
                    <span>365+ days (Far advance)</span>
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="stays_in_weekend_nights">
                  Weekend Nights
                </label>
                <input 
                  id="stays_in_weekend_nights" 
                  type="number" 
                  name="stays_in_weekend_nights" 
                  className="input-field"
                  min="0" 
                  max="20" 
                  value={form.stays_in_weekend_nights} 
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="stays_in_week_nights">
                  Week Nights
                  <span className="input-label-badge">Total: {totalNights} nights</span>
                </label>
                <input 
                  id="stays_in_week_nights" 
                  type="number" 
                  name="stays_in_week_nights" 
                  className="input-field"
                  min="0" 
                  max="50" 
                  value={form.stays_in_week_nights} 
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Guest Profile & History */}
          <div>
            <div className="form-section-title">
              <UserCheck size={20} color="#4f46e5" />
              <span>2. Guest Profile & Booking History</span>
            </div>

            <div className="form-row">
              <div className="input-group">
                <label className="input-label" htmlFor="adults">
                  Adults
                  <span className="input-label-badge">Age 18+</span>
                </label>
                <input 
                  id="adults" 
                  type="number" 
                  name="adults" 
                  className="input-field"
                  min="1" 
                  max="10" 
                  value={form.adults} 
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="children">
                  Children
                  <span className="input-label-badge">Age 2–17 yrs</span>
                </label>
                <input 
                  id="children" 
                  type="number" 
                  name="children" 
                  className="input-field"
                  min="0" 
                  max="10" 
                  value={form.children} 
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="babies">
                  Babies (Infants)
                  <span className="input-label-badge">Age &lt; 2 yrs (Crib)</span>
                </label>
                <input 
                  id="babies" 
                  type="number" 
                  name="babies" 
                  className="input-field"
                  min="0" 
                  max="10" 
                  value={form.babies} 
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="country">Country</label>
                <select 
                  id="country" 
                  name="country" 
                  className="select-field"
                  value={form.country} 
                  onChange={handleChange}
                >
                  {countryList.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Informational Callout on Dataset Age Demographics */}
            <div style={{ marginTop: '0.95rem', padding: '0.85rem 1.15rem', background: '#eef2ff', border: '1.5px solid #c7d2fe', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.82rem', color: '#312e81' }}>
              <Info size={18} color="#4f46e5" style={{ flexShrink: 0 }} />
              <span>
                <strong>Dataset Demographic Policy:</strong> <strong>Babies (Infants)</strong> are guests aged &lt; 2 years (stay in baby crib/cot, typically free of charge). <strong>Children</strong> are minors aged 2 to 17 years (utilize standard/extra bedding and child meal packages). In the ML pipeline, having any children or babies automatically triggers the <code>is_family</code> indicator flag.
              </span>
            </div>

            <div className="form-row" style={{ marginTop: '1.25rem' }}>
              <div className="input-group">
                <label className="input-label" htmlFor="is_repeated_guest">Guest Status</label>
                <select 
                  id="is_repeated_guest" 
                  name="is_repeated_guest" 
                  className="select-field"
                  value={form.is_repeated_guest} 
                  onChange={handleChange}
                >
                  <option value={0}>New Guest</option>
                  <option value={1}>Repeated Guest</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="previous_cancellations">
                  Prior Cancellations
                </label>
                <input 
                  id="previous_cancellations" 
                  type="number" 
                  name="previous_cancellations" 
                  className="input-field"
                  min="0" 
                  max="30" 
                  value={form.previous_cancellations} 
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="previous_bookings_not_canceled">
                  Prior Completed Stays
                </label>
                <input 
                  id="previous_bookings_not_canceled" 
                  type="number" 
                  name="previous_bookings_not_canceled" 
                  className="input-field"
                  min="0" 
                  max="50" 
                  value={form.previous_bookings_not_canceled} 
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Booking Channels & Financials */}
          <div>
            <div className="form-section-title">
              <CreditCard size={20} color="#4f46e5" />
              <span>3. Financials & Channel Details</span>
            </div>

            <div className="form-row">
              <div className="input-group">
                <label className="input-label" htmlFor="deposit_type">Deposit Policy</label>
                <select 
                  id="deposit_type" 
                  name="deposit_type" 
                  className="select-field"
                  value={form.deposit_type} 
                  onChange={handleChange}
                >
                  <option value="No Deposit">No Deposit</option>
                  <option value="Non Refund">Non Refund (High Risk Indicator)</option>
                  <option value="Refundable">Refundable</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="market_segment">Market Segment</label>
                <select 
                  id="market_segment" 
                  name="market_segment" 
                  className="select-field"
                  value={form.market_segment} 
                  onChange={handleChange}
                >
                  <option value="Online TA">Online Travel Agent (TA)</option>
                  <option value="Offline TA/TO">Offline TA / Tour Operator</option>
                  <option value="Direct">Direct Booking</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Groups">Groups</option>
                  <option value="Complementary">Complementary</option>
                  <option value="Aviation">Aviation</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="distribution_channel">Distribution Channel</label>
                <select 
                  id="distribution_channel" 
                  name="distribution_channel" 
                  className="select-field"
                  value={form.distribution_channel} 
                  onChange={handleChange}
                >
                  <option value="TA/TO">TA / TO</option>
                  <option value="Direct">Direct</option>
                  <option value="Corporate">Corporate</option>
                  <option value="GDS">GDS</option>
                </select>
              </div>
            </div>

            <div className="form-row" style={{ marginTop: '1.25rem' }}>
              <div className="input-group">
                <label className="input-label" htmlFor="adr">ADR ($ Daily Rate)</label>
                <input 
                  id="adr" 
                  type="number" 
                  step="0.01" 
                  name="adr" 
                  className="input-field"
                  min="0" 
                  max="1000" 
                  value={form.adr} 
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="reserved_room_type">Reserved Room</label>
                <select 
                  id="reserved_room_type" 
                  name="reserved_room_type" 
                  className="select-field"
                  value={form.reserved_room_type} 
                  onChange={handleChange}
                >
                  {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'L', 'P'].map(r => (
                    <option key={r} value={r}>Room Type {r}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="required_car_parking_spaces">Parking Spaces</label>
                <input 
                  id="required_car_parking_spaces" 
                  type="number" 
                  name="required_car_parking_spaces" 
                  className="input-field"
                  min="0" 
                  max="5" 
                  value={form.required_car_parking_spaces} 
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="total_of_special_requests">Special Requests</label>
                <input 
                  id="total_of_special_requests" 
                  type="number" 
                  name="total_of_special_requests" 
                  className="input-field"
                  min="0" 
                  max="5" 
                  value={form.total_of_special_requests} 
                  onChange={handleChange}
                />
              </div>
            </div>

            {form.deposit_type === 'Non Refund' && (
              <div style={{ marginTop: '1.1rem', padding: '0.85rem 1.15rem', background: '#fff1f2', border: '1.5px solid #fecdd3', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.84rem', color: '#9f1239', fontWeight: 600 }}>
                <AlertTriangle size={18} color="#e11d48" style={{ flexShrink: 0 }} />
                <span>Notice: Empirical cancellation rate for Non-Refundable reservations exceeds 90% due to historical group booking practices.</span>
              </div>
            )}
          </div>

          {error && (
            <div style={{ padding: '0.85rem 1.25rem', background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.4)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.88rem' }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            id="submit-prediction-btn"
            className="submit-btn" 
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin" style={{ width: '20px', height: '20px', border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                <span>Evaluating Cancellation Risk...</span>
              </>
            ) : (
              <>
                <TrendingUp size={20} />
                <span>Analyze Cancellation Risk</span>
              </>
            )}
          </button>
        </form>

        {/* Real-time ML Prediction Results Card */}
        <div className="results-card">
          <div className="results-header">
            <h3 className="results-title">
              <Award size={22} color="#4f46e5" />
              <span>Risk Assessment</span>
            </h3>
            {prediction && (
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                Response: {prediction.timestamp?.split('T')[1]?.substring(0, 8)}
              </span>
            )}
          </div>

          {prediction ? (
            <>
              {/* Radial Gauge */}
              <RiskGauge 
                probability={prediction.cancellation_probability} 
                riskBand={prediction.risk_band}
                riskLevel={prediction.risk_level}
              />

              {/* Prescribed Operational Advice */}
              <div className={`recommendation-box ${prediction.risk_level}`}>
                <div className="recommendation-header">
                  <ShieldAlert size={17} />
                  <span>Revenue Management Protocol</span>
                </div>
                <p className="recommendation-text">
                  {prediction.suggested_action || prediction.recommendation}
                </p>
              </div>

              {/* Key Risk Drivers Breakdown */}
              <div>
                <h4 style={{ fontSize: '0.88rem', color: '#0f172a', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.04em' }}>
                  Top Risk Drivers (Feature Influence)
                </h4>
                <div className="drivers-list">
                  {prediction.key_risk_drivers && prediction.key_risk_drivers.length > 0 ? (
                    prediction.key_risk_drivers.map((driver, idx) => {
                      const isRisk = driver.includes('historically correlated') || 
                                     driver.includes('hazard') || 
                                     driver.includes('Zero special requests') || 
                                     driver.includes('cancellation(s)') ||
                                     driver.includes('Extended lead time') ||
                                     driver.includes('Non-Refundable');
                      const isPositive = driver.includes('positive') || 
                                         driver.includes('intent to stay') || 
                                         driver.includes('commitment') || 
                                         driver.includes('parking') || 
                                         driver.includes('special request(s)');
                      const badgeClass = isRisk ? 'driver-item risk' : isPositive ? 'driver-item positive' : 'driver-item neutral';
                      const Icon = isRisk ? AlertOctagon : isPositive ? CheckCircle2 : Info;
                      const iconColor = isRisk ? '#e11d48' : isPositive ? '#059669' : '#2563eb';

                      return (
                        <div key={idx} className={badgeClass}>
                          <Icon size={16} color={iconColor} style={{ flexShrink: 0 }} />
                          <span>{driver}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="driver-item neutral">
                      <Info size={16} color="#2563eb" style={{ flexShrink: 0 }} />
                      <span>Standard reservation profile without adverse risk indicators.</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="empty-results">
              <Compass size={48} strokeWidth={1.5} color="#4f46e5" />
              <div>
                <p style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem', fontSize: '1.05rem' }}>
                  No Prediction Run Yet
                </p>
                <p style={{ fontSize: '0.86rem', color: '#64748b', lineHeight: 1.5 }}>
                  Select a preset above or customize the booking details and click <strong style={{ color: '#4f46e5' }}>"Analyze Cancellation Risk"</strong>.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
