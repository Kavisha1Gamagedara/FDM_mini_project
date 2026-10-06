import React, { useState, useMemo } from 'react';
import { 
  CalendarCheck, User, Mail, Phone, Globe, BedDouble, 
  DollarSign, Users, Calendar, Clock, CreditCard, Sparkles, 
  CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, 
  ArrowRight, PlusCircle, Check, FileText, ChevronRight
} from 'lucide-react';

const ROOM_OPTIONS = [
  { code: 'A', name: 'Deluxe Limestone Suite', rate: 145, desc: 'King bed, private sea-facing balcony, rain shower' },
  { code: 'D', name: 'Executive Adriatic Suite', rate: 210, desc: 'Panoramic cliffside suite, soaking tub, ocean balcony' },
  { code: 'E', name: 'Salento Heritage Villa', rate: 290, desc: 'Bespoke travertine retreat, sun terrace, cove pathway' },
  { code: 'F', name: 'Presidential Cliff Penthouse', rate: 420, desc: '120m² promontory, plunge pool, cliff butler, 270° views' }
];

const COUNTRIES = [
  { code: 'PRT', name: 'Portugal (PRT)' },
  { code: 'GBR', name: 'United Kingdom (GBR)' },
  { code: 'FRA', name: 'France (FRA)' },
  { code: 'ESP', name: 'Spain (ESP)' },
  { code: 'DEU', name: 'Germany (DEU)' },
  { code: 'ITA', name: 'Italy (ITA)' },
  { code: 'USA', name: 'United States (USA)' },
  { code: 'CHE', name: 'Switzerland (CHE)' },
  { code: 'NLD', name: 'Netherlands (NLD)' },
  { code: 'BEL', name: 'Belgium (BEL)' },
  { code: 'BRA', name: 'Brazil (BRA)' },
  { code: 'IRL', name: 'Ireland (IRL)' }
];

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
  const res = new Date(d);
  res.setDate(res.getDate() + days);
  return res;
}

export default function AdminManualBookingForm({ 
  apiBaseUrl = 'http://127.0.0.1:8000',
  onRefresh,
  onSelectBooking,
  onGoToMonitor
}) {
  const today = useMemo(() => new Date(2026, 9, 7), []);
  const defaultCheckIn = useMemo(() => formatDate(addDays(today, 14)), [today]);
  const defaultCheckOut = useMemo(() => formatDate(addDays(today, 18)), [today]);

  // Form Fields
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [country, setCountry] = useState('ITA');

  const [checkIn, setCheckIn] = useState(defaultCheckIn);
  const [checkOut, setCheckOut] = useState(defaultCheckOut);
  const [roomType, setRoomType] = useState('A');
  const [roomCount, setRoomCount] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [babies, setBabies] = useState(0);
  const [customAdr, setCustomAdr] = useState(145);

  const [marketSegment, setMarketSegment] = useState('Direct');
  const [distributionChannel, setDistributionChannel] = useState('Direct');
  const [customerType, setCustomerType] = useState('Transient');
  const [bookingChannelNote, setBookingChannelNote] = useState('Telephone In-Person Concierge');

  const [mealPlan, setMealPlan] = useState('BB');
  const [depositType, setDepositType] = useState('No Deposit');
  const [parking, setParking] = useState(0);
  const [specialRequests, setSpecialRequests] = useState(1);
  const [isReturningGuest, setIsReturningGuest] = useState(0);
  const [prevCancellations, setPrevCancellations] = useState(0);
  const [guestHistory, setGuestHistory] = useState(null);
  const [isLookingUpHistory, setIsLookingUpHistory] = useState(false);

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdBooking, setCreatedBooking] = useState(null);

  // Automatically check MongoDB for prior reservations and cancellations when admin enters guest email
  useEffect(() => {
    const email = guestEmail.trim().toLowerCase();
    if (email && email.includes('@') && email.length > 5) {
      setIsLookingUpHistory(true);
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(`${apiBaseUrl}/auth/history/${encodeURIComponent(email)}`);
          if (res.ok) {
            const data = await res.json();
            setGuestHistory(data);
            if (data.total_past_bookings > 0) {
              setIsReturningGuest(data.is_repeated_guest);
              setPrevCancellations(data.previous_cancellations);
            }
          }
        } catch (e) {
          console.warn('Admin guest lookup error:', e);
        } finally {
          setIsLookingUpHistory(false);
        }
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setGuestHistory(null);
    }
  }, [guestEmail, apiBaseUrl]);

  // When room changes, auto-update custom ADR to default rate
  const handleRoomChange = (code) => {
    setRoomType(code);
    const found = ROOM_OPTIONS.find(r => r.code === code);
    if (found) setCustomAdr(found.rate);
  };

  // Compute Nights & Lead Time
  const { totalNights, weekendNights, weekNights, leadTime, arrivalMonth, arrivalWeek } = useMemo(() => {
    if (!checkIn || !checkOut) return { totalNights: 0, weekendNights: 0, weekNights: 0, leadTime: 0, arrivalMonth: 'October', arrivalWeek: 41 };
    
    const start = new Date(checkIn + 'T00:00:00');
    const end = new Date(checkOut + 'T00:00:00');
    const diffDays = Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));

    let wknd = 0;
    let wk = 0;
    const cur = new Date(start);
    while (cur < end) {
      const day = cur.getDay();
      if (day === 0 || day === 6) wknd++;
      else wk++;
      cur.setDate(cur.getDate() + 1);
    }

    const lead = Math.max(0, Math.round((start - today) / (1000 * 60 * 60 * 24)));
    const month = MONTH_NAMES[start.getMonth()] || 'October';

    // ISO week number
    const target = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()));
    target.setUTCDate(target.getUTCDate() + 4 - (target.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((target - yearStart) / 86400000) + 1) / 7);

    return {
      totalNights: diffDays,
      weekendNights: wknd,
      weekNights: wk,
      leadTime: lead,
      arrivalMonth: month,
      arrivalWeek: Math.min(Math.max(weekNo, 1), 53)
    };
  }, [checkIn, checkOut, today]);

  const estimatedTotal = useMemo(() => {
    return Math.round(customAdr * totalNights * roomCount);
  }, [customAdr, totalNights, roomCount]);

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setErrorMsg('Please provide the lead guest name.');
      return;
    }
    if (!guestEmail.trim()) {
      setErrorMsg('Please provide a valid contact email.');
      return;
    }
    if (totalNights <= 0) {
      setErrorMsg('Check-out date must be after check-in date.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const randomRefNum = Math.floor(100000 + Math.random() * 900000);
      const bookingPayload = {
        booking_ref: `OST-${randomRefNum}`,
        guest_name: guestName.trim(),
        guest_email: guestEmail.trim().toLowerCase(),
        hotel: 'City Hotel',
        lead_time: leadTime,
        arrival_date_month: arrivalMonth,
        arrival_date_week_number: arrivalWeek,
        stays_in_weekend_nights: weekendNights,
        stays_in_week_nights: weekNights,
        adults: Number(adults),
        children: Number(children),
        babies: Number(babies),
        meal: mealPlan,
        country: country,
        market_segment: marketSegment,
        distribution_channel: distributionChannel,
        is_repeated_guest: Number(isReturningGuest),
        previous_cancellations: Number(prevCancellations),
        previous_bookings_not_canceled: Number(isReturningGuest ? 1 : 0),
        reserved_room_type: roomType,
        deposit_type: depositType,
        customer_type: customerType,
        adr: Number(customAdr),
        required_car_parking_spaces: Number(parking),
        total_of_special_requests: Number(specialRequests),
        check_in_date: checkIn,
        check_out_date: checkOut,
        booking_channel_name: bookingChannelNote,
        room_count: Number(roomCount),
        status: 'confirmed',
        created_at: new Date().toISOString()
      };

      const res = await fetch(`${apiBaseUrl}/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Server rejected manual reservation creation.');
      }

      const savedReservation = await res.json();
      setCreatedBooking(savedReservation);
      if (onRefresh) onRefresh();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to connect to backend service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset to create another reservation
  const handleReset = () => {
    setCreatedBooking(null);
    setGuestName('');
    setGuestEmail('');
    setGuestPhone('');
    setErrorMsg('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* Header Banner */}
      <div className="mat-card" style={{ padding: '1.75rem 2rem', background: '#ffffff', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.25rem 0.65rem', borderRadius: '9999px', background: 'rgba(2, 132, 199, 0.08)', color: '#0284c7', fontSize: '0.74rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              <PlusCircle size={13} />
              <span>ADMINISTRATIVE CONCIERGE DESK</span>
            </div>
            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.01em' }}>
              Manual Reservation Registration
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '0.2rem', maxWidth: '750px' }}>
              Create on-demand reservations requested directly by customers via telephone or reception desk. Each reservation is automatically evaluated by the predictive cancellation risk engine and synchronized directly into the database.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#16a34a', background: 'rgba(22, 163, 74, 0.1)', padding: '0.35rem 0.75rem', borderRadius: '8px', fontWeight: 700, border: '1px solid rgba(22, 163, 74, 0.25)' }}>
              ● Live Database Sync Active
            </span>
          </div>
        </div>
      </div>

      {/* SUCCESS CONFIRMATION MODAL CARD */}
      {createdBooking && (
        <div className="mat-card" style={{ 
          padding: '2rem', 
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)', 
          border: '2px solid #86efac', 
          boxShadow: '0 10px 30px rgba(22, 163, 74, 0.12)',
          borderRadius: '18px'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#16a34a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(22, 163, 74, 0.35)' }}>
                <CheckCircle2 size={26} />
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#15803d', fontWeight: 700 }}>
                  RESERVATION CREATED SUCCESSFULLY
                </span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#14532d', marginTop: '0.15rem' }}>
                  Booking #{createdBooking.booking_ref} Confirmed & Scored
                </h3>
                <p style={{ fontSize: '0.84rem', color: '#4b5563', marginTop: '0.25rem' }}>
                  Guest <strong>{createdBooking.guest_name}</strong> has been registered in the database with live predictive cancellation risk scores.
                </p>
              </div>
            </div>

            {/* AI Risk Score Pill */}
            {createdBooking.prediction && (
              <div style={{ 
                padding: '0.75rem 1.25rem', 
                borderRadius: '12px', 
                background: createdBooking.prediction.risk_level === 'high' ? '#fee2e2' : createdBooking.prediction.risk_level === 'medium' ? '#fef3c7' : '#dcfce7',
                border: `1.5px solid ${createdBooking.prediction.risk_level === 'high' ? '#fca5a5' : createdBooking.prediction.risk_level === 'medium' ? '#fde68a' : '#86efac'}`,
                textAlign: 'right'
              }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase' }}>
                  Predictive Churn Assessment
                </span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: createdBooking.prediction.risk_level === 'high' ? '#b91c1c' : createdBooking.prediction.risk_level === 'medium' ? '#b45309' : '#15803d' }}>
                  {createdBooking.prediction.cancellation_probability_pct}% Risk ({createdBooking.prediction.risk_level.toUpperCase()})
                </div>
              </div>
            )}
          </div>

          {/* Quick Summary Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '1.5rem', padding: '1rem 1.25rem', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>Check-in Date</span>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1e293b' }}>{createdBooking.check_in_date}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>Duration</span>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1e293b' }}>
                {(createdBooking.stays_in_weekend_nights || 0) + (createdBooking.stays_in_week_nights || 0)} Nights
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>Room Allocation</span>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1e293b' }}>
                Suite {createdBooking.reserved_room_type} ({createdBooking.room_count || 1} Room)
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>ADR / Revenue</span>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0369a1' }}>
                ${createdBooking.adr} / night
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="mat-action-pill mat-action-accent"
              onClick={() => {
                if (onSelectBooking) onSelectBooking(createdBooking);
              }}
              style={{ padding: '0.6rem 1.25rem', fontSize: '0.84rem' }}
            >
              <Sparkles size={15} />
              <span>Inspect Feature Waterfall (AI Inspector)</span>
            </button>

            <button
              type="button"
              className="mat-action-pill"
              onClick={onGoToMonitor}
              style={{ padding: '0.6rem 1.25rem', fontSize: '0.84rem' }}
            >
              <CalendarCheck size={15} />
              <span>View in Live Risk Monitor Table</span>
            </button>

            <button
              type="button"
              className="mat-action-pill"
              onClick={handleReset}
              style={{ padding: '0.6rem 1.25rem', fontSize: '0.84rem' }}
            >
              <PlusCircle size={15} />
              <span>Register Another Customer Booking</span>
            </button>
          </div>
        </div>
      )}

      {/* MAIN RESERVATION FORM */}
      {!createdBooking && (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(340px, 1fr)', gap: '1.75rem', alignItems: 'start' }}>
          
          {/* LEFT COLUMN: FORM SECTIONS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* SECTION 1: Guest Information */}
            <div className="mat-card" style={{ padding: '1.75rem 2rem', border: '1.5px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid #f0f2f5', paddingBottom: '0.75rem' }}>
                <User size={18} color="#0284c7" />
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>
                  1. Customer & Guest Details
                </h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>
                    Lead Guest Full Name *
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Isabella Rossi"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.86rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>
                    Contact Email Address *
                  </label>
                  <input 
                    type="email"
                    required
                    placeholder="e.g. isabella.rossi@luxury.it"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.86rem', outline: 'none' }}
                  />
                  {isLookingUpHistory && (
                    <div style={{ fontSize: '0.72rem', color: '#0284c7', marginTop: '0.3rem' }}>
                      Checking MongoDB for past reservations...
                    </div>
                  )}
                  {guestHistory && (
                    <div style={{
                      marginTop: '0.35rem',
                      padding: '0.3rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      background: guestHistory.previous_cancellations > 0 ? '#fff1f2' : guestHistory.total_past_bookings > 0 ? '#ecfdf5' : '#f8fafc',
                      border: `1px solid ${guestHistory.previous_cancellations > 0 ? '#fecdd3' : guestHistory.total_past_bookings > 0 ? '#a7f3d0' : '#e2e8f0'}`,
                      color: guestHistory.previous_cancellations > 0 ? '#be123c' : guestHistory.total_past_bookings > 0 ? '#047857' : '#64748b'
                    }}>
                      <span>●</span>
                      <span>
                        {guestHistory.total_past_bookings > 0 
                          ? `Database record: ${guestHistory.total_past_bookings} prior stay(s) · ${guestHistory.previous_cancellations} cancellation(s) (Auto-populated)`
                          : `New Guest Profile: 0 prior reservations in database`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>
                    Contact Phone Number (Optional)
                  </label>
                  <input 
                    type="tel"
                    placeholder="+39 0832 948102"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.86rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>
                    Guest Country of Origin
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.86rem', background: '#fff', outline: 'none' }}
                  >
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 2: Stay Period & Suite Configuration */}
            <div className="mat-card" style={{ padding: '1.75rem 2rem', border: '1.5px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid #f0f2f5', paddingBottom: '0.75rem' }}>
                <Calendar size={18} color="#0284c7" />
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>
                  2. Stay Dates & Room Configuration
                </h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>
                    Check-in Date
                  </label>
                  <input 
                    type="date"
                    required
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.86rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>
                    Check-out Date
                  </label>
                  <input 
                    type="date"
                    required
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.86rem', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Suite Selection Cards */}
              <div style={{ marginTop: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '0.6rem' }}>
                  Assigned Suite Category
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  {ROOM_OPTIONS.map(rm => {
                    const isSelected = roomType === rm.code;
                    return (
                      <div 
                        key={rm.code}
                        onClick={() => handleRoomChange(rm.code)}
                        style={{
                          padding: '0.85rem 1rem',
                          borderRadius: '10px',
                          border: isSelected ? '2px solid #0284c7' : '1.5px solid #e2e8f0',
                          background: isSelected ? 'rgba(2, 132, 199, 0.05)' : '#f8fafc',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '0.88rem', color: isSelected ? '#0369a1' : '#1e293b' }}>
                            Suite {rm.code}
                          </strong>
                          <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0284c7' }}>
                            ${rm.rate}/nt
                          </span>
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.2rem' }}>
                          {rm.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Guests Count & Custom ADR */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginTop: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                    Rooms
                  </label>
                  <input 
                    type="number"
                    min="1"
                    max="10"
                    value={roomCount}
                    onChange={(e) => setRoomCount(Math.max(1, Number(e.target.value)))}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.86rem', textAlign: 'center' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                    Adults
                  </label>
                  <input 
                    type="number"
                    min="1"
                    max="6"
                    value={adults}
                    onChange={(e) => setAdults(Math.max(1, Number(e.target.value)))}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.86rem', textAlign: 'center' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                    Children
                  </label>
                  <input 
                    type="number"
                    min="0"
                    max="4"
                    value={children}
                    onChange={(e) => setChildren(Math.max(0, Number(e.target.value)))}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.86rem', textAlign: 'center' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                    ADR ($/Night)
                  </label>
                  <input 
                    type="number"
                    min="50"
                    max="2000"
                    value={customAdr}
                    onChange={(e) => setCustomAdr(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.86rem', textAlign: 'center', fontWeight: 700 }}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: Channel Routing & Policies */}
            <div className="mat-card" style={{ padding: '1.75rem 2rem', border: '1.5px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid #f0f2f5', paddingBottom: '0.75rem' }}>
                <CreditCard size={18} color="#0284c7" />
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>
                  3. Market Routing & Tariff Terms
                </h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>
                    Market Segment
                  </label>
                  <select
                    value={marketSegment}
                    onChange={(e) => setMarketSegment(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.86rem', background: '#fff' }}
                  >
                    <option value="Direct">Direct (Personal / Official Booking)</option>
                    <option value="Corporate">Corporate (Business / Enterprise Tariff)</option>
                    <option value="Online TA">Online TA (OTA Partner Inflow)</option>
                    <option value="Offline TA/TO">Offline TA/TO (Traditional Agency)</option>
                    <option value="Groups">Groups (Room Block Agreement)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>
                    Deposit Policy
                  </label>
                  <select
                    value={depositType}
                    onChange={(e) => setDepositType(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.86rem', background: '#fff' }}
                  >
                    <option value="No Deposit">Flexible (No Deposit Required)</option>
                    <option value="Non Refund">Non-Refundable (Advanced Payment)</option>
                    <option value="Refundable">Refundable Deposit</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>
                    Dining Package
                  </label>
                  <select
                    value={mealPlan}
                    onChange={(e) => setMealPlan(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.86rem', background: '#fff' }}
                  >
                    <option value="BB">Bed & Breakfast included (BB)</option>
                    <option value="HB">Half Board (Breakfast & Dinner)</option>
                    <option value="FB">Full Board (All 3 Meals)</option>
                    <option value="SC">Room Only (Self Catering)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>
                    Special Requests
                  </label>
                  <select
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.86rem', background: '#fff' }}
                  >
                    <option value={0}>0 - No Special Requests</option>
                    <option value={1}>1 - Single Request (e.g. Quiet Room)</option>
                    <option value={2}>2 - High Floor & Early Arrival</option>
                    <option value={3}>3+ - VIP Concierge Service</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>
                    Repeated Guest Status
                  </label>
                  <select
                    value={isReturningGuest}
                    onChange={(e) => setIsReturningGuest(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.86rem', background: '#fff' }}
                  >
                    <option value={0}>First Time Guest</option>
                    <option value={1}>Returning Guest (Has Prior Stays)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>
                    Booking Intake Channel
                  </label>
                  <input 
                    type="text"
                    value={bookingChannelNote}
                    onChange={(e) => setBookingChannelNote(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.86rem', outline: 'none' }}
                  />
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: EXECUTIVE ORDER SUMMARY & SUBMISSION */}
          <div style={{ position: 'sticky', top: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Live ML Evaluation Preview */}
            <div className="mat-card" style={{ padding: '1.75rem', border: '2px solid #cbd5e1', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #f0f2f5', paddingBottom: '0.75rem' }}>
                <Sparkles size={18} color="#0284c7" />
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>
                  Live Reservation Summary
                </h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.84rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Calculated Lead Time:</span>
                  <strong style={{ color: '#1e293b' }}>{leadTime} Days in advance</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Stay Duration:</span>
                  <strong style={{ color: '#1e293b' }}>{totalNights} Nights ({weekendNights} Wknd / {weekNights} Week)</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Room & Allocation:</span>
                  <strong style={{ color: '#1e293b' }}>Suite {roomType} × {roomCount} room(s)</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Rate per night:</span>
                  <strong style={{ color: '#0369a1' }}>${customAdr}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Arrival Month / Week:</span>
                  <strong style={{ color: '#1e293b' }}>{arrivalMonth} (Wk #{arrivalWeek})</strong>
                </div>
              </div>

              {/* Estimated Total Calculation */}
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f0f2f5', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155' }}>Total Scheduled Revenue:</span>
                <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
                  ${estimatedTotal.toLocaleString()}
                </span>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '8px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', fontSize: '0.8rem' }}>
                  {errorMsg}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || totalNights <= 0}
                style={{
                  width: '100%',
                  marginTop: '1.5rem',
                  padding: '0.85rem 1.25rem',
                  borderRadius: '10px',
                  background: isSubmitting ? '#94a3b8' : 'linear-gradient(135deg, #1e293b 0%, #344767 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 15px rgba(30, 41, 59, 0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    <span>Synchronizing with Database...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle size={17} />
                    <span>Confirm & Persist Reservation</span>
                  </>
                )}
              </button>

              <p style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', marginTop: '0.75rem' }}>
                ⚡ Runs predictive cancellation risk assessment & synchronizes reservation
              </p>
            </div>

          </div>

        </form>
      )}

    </div>
  );
}
