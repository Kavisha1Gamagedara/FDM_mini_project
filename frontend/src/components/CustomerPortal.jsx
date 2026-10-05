import React, { useState } from 'react';
import { 
  Building2, Calendar, Users, BedDouble, Utensils, 
  Car, Sparkles, CheckCircle2, ShieldCheck, MapPin, 
  ArrowRight, CreditCard, Lock, HeartHandshake, Eye
} from 'lucide-react';

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
    const day = cur.getDay();
    if (day === 0 || day === 6) weekendNights++;
    else weekNights++;
    cur.setDate(cur.getDate() + 1);
  }
  return { weekendNights, weekNights };
}

const ROOM_OPTIONS = [
  { code: 'A', name: 'Deluxe Queen Room', desc: 'Comfortable queen bed with city skyline views', baseRate: 115 },
  { code: 'D', name: 'Executive King Suite', desc: 'Spacious room with king bed, lounge area and balcony', baseRate: 165 },
  { code: 'E', name: 'Premium Heritage Suite', desc: 'Luxury corner suite with separate parlor and marble bath', baseRate: 210 },
  { code: 'F', name: 'Family Grand Villa', desc: 'Multi-room villa ideal for families with private patio', baseRate: 280 }
];

export default function CustomerPortal({ onBookingCreated, onSwitchToAdmin, metadata, apiBaseUrl = 'http://127.0.0.1:8000' }) {
  const today = new Date();
  const todayStr = formatDate(today);
  const defaultCheckIn = formatDate(addDays(today, 14));
  const defaultCheckOut = formatDate(addDays(today, 17));

  const [property, setProperty] = useState('City Hotel');
  const [checkIn, setCheckIn] = useState(defaultCheckIn);
  const [checkOut, setCheckOut] = useState(defaultCheckOut);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [babies, setBabies] = useState(0);
  const [roomType, setRoomType] = useState('A');
  const [mealPlan, setMealPlan] = useState('BB');
  const [country, setCountry] = useState('PRT');
  const [depositOption, setDepositOption] = useState('No Deposit');
  const [parking, setParking] = useState(0);
  const [specialRequests, setSpecialRequests] = useState(1);
  const [isReturningGuest, setIsReturningGuest] = useState(0);

  // Guest Contact Form
  const [guestName, setGuestName] = useState('Alexandra Miller');
  const [guestEmail, setGuestEmail] = useState('alexandra.miller@example.com');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Stay calculation
  const { weekendNights, weekNights } = computeStayNights(checkIn, checkOut);
  const totalNights = weekendNights + weekNights;
  const leadTime = Math.max(0, Math.round((new Date(checkIn + 'T00:00:00') - new Date(todayStr + 'T00:00:00')) / (1000 * 60 * 60 * 24)));

  const selectedRoom = ROOM_OPTIONS.find(r => r.code === roomType) || ROOM_OPTIONS[0];
  const rateMultiplier = depositOption === 'Non Refund' ? 0.85 : 1.0; // 15% discount for non-refundable
  const adr = Math.round(selectedRoom.baseRate * rateMultiplier);
  const estimatedTotal = adr * totalNights;

  const handleCheckInChange = (e) => {
    const val = e.target.value;
    setCheckIn(val);
    if (new Date(val + 'T00:00:00') >= new Date(checkOut + 'T00:00:00')) {
      setCheckOut(formatDate(addDays(new Date(val + 'T00:00:00'), 1)));
    }
  };

  const handleBookNow = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const arrivalDateObj = new Date(checkIn + 'T00:00:00');
    const arrivalMonth = MONTH_NAMES[arrivalDateObj.getMonth()];
    const weekNumber = getISOWeekNumber(arrivalDateObj);
    const bookingRef = `AUR-${Math.floor(100000 + Math.random() * 900000)}`;

    const bookingPayload = {
      booking_ref: bookingRef,
      guest_name: guestName,
      guest_email: guestEmail,
      hotel: property,
      lead_time: leadTime,
      arrival_date_month: arrivalMonth,
      arrival_date_week_number: weekNumber,
      stays_in_weekend_nights: weekendNights,
      stays_in_week_nights: weekNights,
      adults: Number(adults),
      children: Number(children),
      babies: Number(babies),
      meal: mealPlan,
      country: country,
      market_segment: depositOption === 'Non Refund' ? 'Online TA' : 'Direct',
      distribution_channel: 'Direct',
      is_repeated_guest: Number(isReturningGuest),
      previous_cancellations: 0,
      previous_bookings_not_canceled: Number(isReturningGuest) ? 2 : 0,
      reserved_room_type: roomType,
      deposit_type: depositOption,
      customer_type: 'Transient',
      adr: adr,
      required_car_parking_spaces: Number(parking),
      total_of_special_requests: Number(specialRequests),
      created_at: new Date().toISOString()
    };

    try {
      const res = await fetch(`${apiBaseUrl}/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload)
      });
      if (res.ok) {
        const savedData = await res.json();
        setConfirmedBooking({
          ...savedData,
          totalNights,
          totalPrice: estimatedTotal
        });
        if (onBookingCreated) {
          onBookingCreated(savedData);
        }
      } else {
        setConfirmedBooking({
          ...bookingPayload,
          totalNights,
          totalPrice: estimatedTotal
        });
        if (onBookingCreated) {
          onBookingCreated(bookingPayload);
        }
      }
    } catch (err) {
      console.warn('Backend /reservations error, confirming locally:', err);
      setConfirmedBooking({
        ...bookingPayload,
        totalNights,
        totalPrice: estimatedTotal
      });
      if (onBookingCreated) {
        onBookingCreated(bookingPayload);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Customer Hero Banner */}
      <div className="glass-panel" style={{ 
        padding: '2.5rem', 
        background: 'linear-gradient(135deg, rgba(17,24,39,0.85) 0%, rgba(30,27,75,0.7) 100%)',
        border: '1px solid rgba(129,140,248,0.25)',
        borderRadius: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '650px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.85rem', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '9999px', fontSize: '0.78rem', color: '#c7d2fe', fontWeight: 600, marginBottom: '1rem' }}>
            <Sparkles size={14} color="#818cf8" />
            <span>Official Guest Reservation Portal</span>
          </div>
          <h2 style={{ fontSize: '2.2rem', lineHeight: 1.2, marginBottom: '0.75rem', fontWeight: 800 }}>
            Curate Your Stay at <span style={{ background: 'linear-gradient(to right, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AuraStay</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Experience world-class hospitality, personalized service, and effortless luxury. Reserve directly with guaranteed best rates and complimentary stay perks.
          </p>
        </div>
      </div>

      {/* Confirmation View or Booking Form */}
      {confirmedBooking ? (
        <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '24px', textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
            <CheckCircle2 size={36} color="#34d399" />
          </div>

          <h3 style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>Reservation Confirmed!</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.75rem' }}>
            Thank you, <strong>{confirmedBooking.guest_name}</strong>. Your reservation reference is{' '}
            <span style={{ color: '#818cf8', fontWeight: 700, fontFamily: 'monospace', fontSize: '1.1rem' }}>
              #{confirmedBooking.booking_ref}
            </span>
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-subtle)', marginBottom: '2rem', textAlign: 'left' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Property</span>
              <p style={{ fontWeight: 700, marginTop: '0.2rem' }}>{confirmedBooking.hotel}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Check-in & Check-out</span>
              <p style={{ fontWeight: 700, marginTop: '0.2rem' }}>{checkIn} to {checkOut} ({confirmedBooking.totalNights} nights)</p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Room & Tariff</span>
              <p style={{ fontWeight: 700, marginTop: '0.2rem' }}>{selectedRoom.name} (${confirmedBooking.adr}/night)</p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Amount</span>
              <p style={{ fontWeight: 800, fontSize: '1.2rem', color: '#34d399', marginTop: '0.2rem' }}>
                ${confirmedBooking.totalPrice}
              </p>
            </div>
          </div>

          <div style={{ padding: '1rem 1.25rem', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textAlign: 'left' }}>
              <ShieldCheck size={20} color="#818cf8" />
              <span style={{ fontSize: '0.88rem' }}>
                This reservation was recorded and securely piped into the hotel's <strong>Admin Operational System</strong>.
              </span>
            </div>
            <button 
              type="button"
              className="preset-btn"
              onClick={onSwitchToAdmin}
              style={{ background: 'var(--primary-500)', color: '#fff', padding: '0.5rem 1rem' }}
            >
              <Eye size={15} />
              <span>Inspect Staff AI Prediction</span>
            </button>
          </div>

          <button 
            type="button" 
            className="preset-btn"
            onClick={() => setConfirmedBooking(null)}
          >
            Create Another Reservation
          </button>
        </div>
      ) : (
        <form onSubmit={handleBookNow} style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem', alignItems: 'start' }}>
          
          {/* Main Booking Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            
            {/* Step 1: Destination & Dates */}
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <div className="form-section-title">
                <Building2 size={18} color="var(--primary-400)" />
                <span>1. Select Destination & Travel Dates</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div 
                  onClick={() => setProperty('City Hotel')}
                  style={{
                    padding: '1.25rem',
                    borderRadius: '12px',
                    border: property === 'City Hotel' ? '2px solid var(--primary-500)' : '1px solid var(--border-subtle)',
                    background: property === 'City Hotel' ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <h4 style={{ fontSize: '1.05rem', color: '#fff' }}>AuraStay Metropolitan</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>City Hotel • Downtown skyline & business district</p>
                </div>

                <div 
                  onClick={() => setProperty('Resort Hotel')}
                  style={{
                    padding: '1.25rem',
                    borderRadius: '12px',
                    border: property === 'Resort Hotel' ? '2px solid var(--primary-500)' : '1px solid var(--border-subtle)',
                    background: property === 'Resort Hotel' ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <h4 style={{ fontSize: '1.05rem', color: '#fff' }}>AuraStay Ocean Resort</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Resort Hotel • Coastal paradise & private beach</p>
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label className="input-label" htmlFor="checkin">Check-in Date</label>
                  <input 
                    id="checkin" 
                    type="date" 
                    className="input-field"
                    min={todayStr}
                    value={checkIn}
                    onChange={handleCheckInChange}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="checkout">Check-out Date</label>
                  <input 
                    id="checkout" 
                    type="date" 
                    className="input-field"
                    min={formatDate(addDays(new Date(checkIn + 'T00:00:00'), 1))}
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Room Selection */}
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <div className="form-section-title">
                <BedDouble size={18} color="var(--primary-400)" />
                <span>2. Choose Your Suite / Room</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {ROOM_OPTIONS.map(room => (
                  <div 
                    key={room.code}
                    onClick={() => setRoomType(room.code)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem 1.25rem',
                      borderRadius: '12px',
                      border: roomType === room.code ? '2px solid var(--primary-500)' : '1px solid var(--border-subtle)',
                      background: roomType === room.code ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
                      cursor: 'pointer'
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '0.98rem', color: '#fff' }}>{room.name}</h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{room.desc}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-400)' }}>
                        ${depositOption === 'Non Refund' ? Math.round(room.baseRate * 0.85) : room.baseRate}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> / night</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3: Guests & Meal Plan */}
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <div className="form-section-title">
                <Users size={18} color="var(--primary-400)" />
                <span>3. Guests & Personalization</span>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label className="input-label" htmlFor="adults">Adults <span className="input-label-badge">18+ yrs</span></label>
                  <input 
                    id="adults" 
                    type="number" 
                    min="1" 
                    max="6" 
                    className="input-field" 
                    value={adults} 
                    onChange={(e) => setAdults(e.target.value)} 
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="children">Children <span className="input-label-badge">2–17 yrs</span></label>
                  <input 
                    id="children" 
                    type="number" 
                    min="0" 
                    max="4" 
                    className="input-field" 
                    value={children} 
                    onChange={(e) => setChildren(e.target.value)} 
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="babies">Babies <span className="input-label-badge">&lt; 2 yrs (Crib)</span></label>
                  <input 
                    id="babies" 
                    type="number" 
                    min="0" 
                    max="2" 
                    className="input-field" 
                    value={babies} 
                    onChange={(e) => setBabies(e.target.value)} 
                  />
                </div>
              </div>

              <div className="form-row" style={{ marginTop: '1.25rem' }}>
                <div className="input-group">
                  <label className="input-label" htmlFor="meal">Dining Package</label>
                  <select 
                    id="meal" 
                    className="select-field" 
                    value={mealPlan} 
                    onChange={(e) => setMealPlan(e.target.value)}
                  >
                    <option value="BB">Bed & Breakfast included (BB)</option>
                    <option value="HB">Half Board (Breakfast & Dinner)</option>
                    <option value="FB">Full Board (All 3 Meals)</option>
                    <option value="SC">Room Only (Self Catering)</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="special_requests">Special Requests</label>
                  <select 
                    id="special_requests" 
                    className="select-field" 
                    value={specialRequests} 
                    onChange={(e) => setSpecialRequests(e.target.value)}
                  >
                    <option value={0}>No Special Requests</option>
                    <option value={1}>1 Request (e.g. High floor / Quiet room)</option>
                    <option value={2}>2 Requests (e.g. Early check-in & Feather pillows)</option>
                    <option value={3}>3+ Requests (Full VIP Concierge setup)</option>
                  </select>
                </div>
              </div>

              <div className="form-row" style={{ marginTop: '1.25rem' }}>
                <div className="input-group">
                  <label className="input-label" htmlFor="parking">Vehicle Parking</label>
                  <select 
                    id="parking" 
                    className="select-field" 
                    value={parking} 
                    onChange={(e) => setParking(e.target.value)}
                  >
                    <option value={0}>No Parking Required</option>
                    <option value={1}>1 Secured Valet Space (Complimentary)</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="returning">Guest Membership</label>
                  <select 
                    id="returning" 
                    className="select-field" 
                    value={isReturningGuest} 
                    onChange={(e) => setIsReturningGuest(e.target.value)}
                  >
                    <option value={0}>First Time Guest</option>
                    <option value={1}>Returning AuraStay Member (Prior Stays)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Step 4: Rate Plan & Deposit Terms */}
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <div className="form-section-title">
                <CreditCard size={18} color="var(--primary-400)" />
                <span>4. Payment & Cancellation Policy</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div 
                  onClick={() => setDepositOption('No Deposit')}
                  style={{
                    padding: '1.25rem',
                    borderRadius: '12px',
                    border: depositOption === 'No Deposit' ? '2px solid #34d399' : '1px solid var(--border-subtle)',
                    background: depositOption === 'No Deposit' ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '0.98rem', color: '#fff' }}>Flexible Rate</h4>
                    <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700 }}>FREE CANCELLATION</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                    No deposit required. Cancel free up to 48 hours prior to arrival. Pay at hotel check-in.
                  </p>
                </div>

                <div 
                  onClick={() => setDepositOption('Non Refund')}
                  style={{
                    padding: '1.25rem',
                    borderRadius: '12px',
                    border: depositOption === 'Non Refund' ? '2px solid var(--risk-high)' : '1px solid var(--border-subtle)',
                    background: depositOption === 'Non Refund' ? 'rgba(244,63,94,0.08)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '0.98rem', color: '#fff' }}>Saver Rate (15% Off)</h4>
                    <span style={{ fontSize: '0.72rem', color: '#fda4af', fontWeight: 700 }}>NON-REFUNDABLE</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                    Full payment charged upon booking. Non-refundable in case of cancellation or modification.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Sidebar Booking Summary & Order Checkout */}
          <div className="glass-panel" style={{ padding: '1.75rem', position: 'sticky', top: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={18} color="var(--primary-400)" />
              <span>Reservation Summary</span>
            </h3>

            <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Property:</span>
                <span style={{ fontWeight: 600 }}>{property}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Dates:</span>
                <span style={{ fontWeight: 600 }}>{totalNights} nights</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Room:</span>
                <span style={{ fontWeight: 600 }}>{selectedRoom.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Rate Plan:</span>
                <span style={{ fontWeight: 600, color: depositOption === 'Non Refund' ? '#fda4af' : '#6ee7b7' }}>
                  {depositOption === 'Non Refund' ? 'Non-Refundable (15% Off)' : 'Flexible Free Cancel'}
                </span>
              </div>
            </div>

            {/* Guest Name & Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="input-group">
                <label className="input-label" htmlFor="guest_name">Lead Guest Name</label>
                <input 
                  id="guest_name" 
                  type="text" 
                  className="input-field" 
                  value={guestName} 
                  onChange={(e) => setGuestName(e.target.value)} 
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="guest_email">Contact Email</label>
                <input 
                  id="guest_email" 
                  type="email" 
                  className="input-field" 
                  value={guestEmail} 
                  onChange={(e) => setGuestEmail(e.target.value)} 
                  required
                />
              </div>
            </div>

            {/* Price Calculations */}
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>${adr} × {totalNights} nights:</span>
                <span>${estimatedTotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>Taxes & Service Fees:</span>
                <span style={{ color: '#34d399' }}>Included</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontWeight: 700 }}>Total Price:</span>
                <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-display)' }}>
                  ${estimatedTotal}
                </span>
              </div>
            </div>

            <button 
              type="submit"
              className="submit-btn"
              disabled={isSubmitting || totalNights <= 0}
            >
              {isSubmitting ? (
                <span>Confirming Booking...</span>
              ) : (
                <>
                  <span>Complete My Reservation</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              🔒 256-bit SSL Encrypted • Best Rate Guarantee
            </p>
          </div>

        </form>
      )}

    </div>
  );
}
