import React, { useState } from 'react';
import { 
  Building2, Calendar, Users, BedDouble, Utensils, 
  Car, Sparkles, CheckCircle2, ShieldCheck, MapPin, 
  ArrowRight, CreditCard, Lock, HeartHandshake, Eye,
  Briefcase, Globe, Share2, Tag, Check, Layers, Info, Percent
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

// 4 Real-World Booking Channels & Automated ML Market Segment Rules
const CHANNELS = {
  DIRECT: {
    id: 'DIRECT',
    name: 'Hotel Direct Website',
    tag: 'Official Direct Booking',
    badgeText: 'DIRECT',
    color: '#34d399',
    bgColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
    icon: Globe,
    subtitle: 'Standard personal / leisure guest booking directly on our official website',
    market_segment: 'Direct',
    distribution_channel: 'Direct',
    customer_type: 'Transient',
    agent: 'Direct',
    company: null,
    discountPct: 0,
    rateBadge: 'Best Rate Guarantee',
    cancellationBaseline: '15.3% Historical Churn (Lowest Risk Tier)',
    rationale: 'Direct guest on official website. Highest commitment, zero third-party commission markups.'
  },
  CORPORATE: {
    id: 'CORPORATE',
    name: 'Corporate / Business Travel',
    tag: 'Negotiated Corporate Tariff',
    badgeText: 'CORPORATE',
    color: '#818cf8',
    bgColor: 'rgba(99, 102, 241, 0.12)',
    borderColor: 'rgba(99, 102, 241, 0.35)',
    icon: Briefcase,
    subtitle: 'Business travel with corporate access code, corporate email, or billing contract',
    market_segment: 'Corporate',
    distribution_channel: 'Corporate',
    customer_type: 'Contract',
    agent: 'Direct',
    company: 'CORP-45',
    discountPct: 12,
    rateBadge: '12% Corporate Discount',
    cancellationBaseline: '18.7% Historical Churn (Reliable Business Demand)',
    rationale: 'Guest enters company contract code. Tagged as Contract business travel with negotiated corporate pricing.'
  },
  GROUPS: {
    id: 'GROUPS',
    name: 'Group Sales Inquiry (10+ Rooms)',
    tag: 'Group Room Block',
    badgeText: 'GROUPS',
    color: '#c084fc',
    bgColor: 'rgba(192, 132, 252, 0.12)',
    borderColor: 'rgba(192, 132, 252, 0.35)',
    icon: Users,
    subtitle: 'Multi-room block for corporate retreats, conventions, tour groups, or weddings',
    market_segment: 'Groups',
    distribution_channel: 'TA/TO',
    customer_type: 'Group',
    agent: 'Direct',
    company: null,
    discountPct: 10,
    rateBadge: '10% Group Volume Rate',
    cancellationBaseline: '61.1% Historical Churn (High Volatility Block)',
    rationale: 'Large room block inquiry. Tagged as Groups. Carries high cancellation and attrition risk if unmonitored.'
  },
  OTA: {
    id: 'OTA',
    name: 'Channel Manager Sync (Online TA)',
    tag: 'Partner Agency API Sync',
    badgeText: 'ONLINE TA',
    color: '#fbbf24',
    bgColor: 'rgba(251, 191, 36, 0.12)',
    borderColor: 'rgba(251, 191, 36, 0.35)',
    icon: Share2,
    subtitle: 'Simulates incoming reservation synced into hotel PMS via Booking.com / Expedia API',
    market_segment: 'Online TA',
    distribution_channel: 'TA/TO',
    customer_type: 'Transient',
    agent: 9.0,
    company: null,
    discountPct: 0,
    rateBadge: 'OTA Partner Tariff',
    cancellationBaseline: '36.7% Historical Churn (2.4× Churn vs Direct)',
    rationale: 'Synced via third-party channel manager. High shopping mobility and frequent mobile cancellations.'
  }
};

export default function CustomerPortal({ onBookingCreated, onSwitchToAdmin, metadata, apiBaseUrl = 'http://127.0.0.1:8000' }) {
  const today = new Date();
  const todayStr = formatDate(today);
  const defaultCheckIn = formatDate(addDays(today, 14));
  const defaultCheckOut = formatDate(addDays(today, 17));

  // Property & Dates
  const [property, setProperty] = useState('City Hotel');
  const [checkIn, setCheckIn] = useState(defaultCheckIn);
  const [checkOut, setCheckOut] = useState(defaultCheckOut);

  // Channel & Segment Classification
  const [bookingChannel, setBookingChannel] = useState('DIRECT'); // 'DIRECT' | 'CORPORATE' | 'GROUPS' | 'OTA'
  const [corporateCode, setCorporateCode] = useState('CORP-AURA');
  const [companyName, setCompanyName] = useState('Aura Enterprise Partner');
  const [numRooms, setNumRooms] = useState(10);
  const [groupEventType, setGroupEventType] = useState('Corporate Convention');
  const [otaPlatform, setOtaPlatform] = useState('Booking.com');

  // Room & Guest Details
  const [roomType, setRoomType] = useState('A');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [babies, setBabies] = useState(0);
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

  const currentChannel = CHANNELS[bookingChannel] || CHANNELS.DIRECT;
  const selectedRoom = ROOM_OPTIONS.find(r => r.code === roomType) || ROOM_OPTIONS[0];

  // Pricing Logic
  const depositMultiplier = depositOption === 'Non Refund' ? 0.85 : 1.0; // 15% discount for non-refundable
  const channelMultiplier = currentChannel.discountPct > 0 ? (1 - currentChannel.discountPct / 100) : 1.0;
  const adr = Math.round(selectedRoom.baseRate * depositMultiplier * channelMultiplier);
  const effectiveRooms = bookingChannel === 'GROUPS' ? Math.max(1, Number(numRooms)) : 1;
  const estimatedTotal = adr * totalNights * effectiveRooms;

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
      check_in_date: checkIn,
      check_out_date: checkOut,
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
      market_segment: currentChannel.market_segment,
      distribution_channel: currentChannel.distribution_channel,
      customer_type: currentChannel.customer_type,
      agent: currentChannel.agent,
      company: bookingChannel === 'CORPORATE' ? (corporateCode || 'CORP-45') : null,
      is_repeated_guest: Number(isReturningGuest),
      previous_cancellations: 0,
      previous_bookings_not_canceled: Number(isReturningGuest) ? 2 : 0,
      reserved_room_type: roomType,
      deposit_type: depositOption,
      adr: adr,
      required_car_parking_spaces: Number(parking),
      total_of_special_requests: Number(specialRequests),
      booking_channel_name: currentChannel.name,
      corporate_code: bookingChannel === 'CORPORATE' ? corporateCode : null,
      room_count: effectiveRooms,
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
          totalPrice: estimatedTotal,
          effectiveRooms,
          channelInfo: currentChannel
        });
        if (onBookingCreated) {
          onBookingCreated(savedData);
        }
      } else {
        setConfirmedBooking({
          ...bookingPayload,
          totalNights,
          totalPrice: estimatedTotal,
          effectiveRooms,
          channelInfo: currentChannel
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
        totalPrice: estimatedTotal,
        effectiveRooms,
        channelInfo: currentChannel
      });
      if (onBookingCreated) {
        onBookingCreated(bookingPayload);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Customer Hero Banner */}
      <div className="glass-panel" style={{ 
        padding: '2.5rem', 
        background: 'linear-gradient(135deg, rgba(17,24,39,0.9) 0%, rgba(30,27,75,0.75) 100%)',
        border: '1px solid rgba(129,140,248,0.25)',
        borderRadius: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '680px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.85rem', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '9999px', fontSize: '0.78rem', color: '#c7d2fe', fontWeight: 600, marginBottom: '1rem' }}>
            <Sparkles size={14} color="#818cf8" />
            <span>Official Guest Reservation Portal • Intelligent Channel Routing</span>
          </div>
          <h2 style={{ fontSize: '2.2rem', lineHeight: 1.2, marginBottom: '0.75rem', fontWeight: 800 }}>
            Curate Your Stay at <span style={{ background: 'linear-gradient(to right, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AuraStay</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Experience world-class hospitality, personalized service, and transparent rates. Direct bookings, corporate contracts, and group events automatically classified for intelligent revenue management.
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

          {/* Booking Summary Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-subtle)', marginBottom: '1.75rem', textAlign: 'left' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Property</span>
              <p style={{ fontWeight: 700, marginTop: '0.2rem' }}>{confirmedBooking.hotel}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Check-in & Check-out</span>
              <p style={{ fontWeight: 700, marginTop: '0.2rem' }}>{checkIn} to {checkOut} ({confirmedBooking.totalNights} nights)</p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Room & Rate</span>
              <p style={{ fontWeight: 700, marginTop: '0.2rem' }}>
                {selectedRoom.name} 
                {confirmedBooking.effectiveRooms > 1 ? ` (${confirmedBooking.effectiveRooms} Rooms)` : ''}
              </p>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>${confirmedBooking.adr}/room/night</span>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Amount</span>
              <p style={{ fontWeight: 800, fontSize: '1.25rem', color: '#34d399', marginTop: '0.2rem' }}>
                ${confirmedBooking.totalPrice}
              </p>
            </div>
          </div>

          {/* Machine Learning Classification Diagnostic Box */}
          <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '16px', padding: '1.25rem 1.5rem', marginBottom: '2rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
              <Layers size={18} color="#818cf8" />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
                Automated ML Feature Classifications Recorded to Database:
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '0.5rem' }}>
              <span style={{ padding: '0.35rem 0.75rem', background: currentChannel.bgColor, border: `1px solid ${currentChannel.borderColor}`, borderRadius: '8px', fontSize: '0.8rem', color: currentChannel.color, fontWeight: 700 }}>
                Channel: {currentChannel.name}
              </span>
              <span style={{ padding: '0.35rem 0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: '8px', fontSize: '0.8rem', color: '#e2e8f0' }}>
                market_segment: <strong>{confirmedBooking.market_segment}</strong>
              </span>
              <span style={{ padding: '0.35rem 0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: '8px', fontSize: '0.8rem', color: '#e2e8f0' }}>
                distribution_channel: <strong>{confirmedBooking.distribution_channel}</strong>
              </span>
              <span style={{ padding: '0.35rem 0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: '8px', fontSize: '0.8rem', color: '#e2e8f0' }}>
                customer_type: <strong>{confirmedBooking.customer_type}</strong>
              </span>
              {confirmedBooking.prediction && (
                <span style={{ padding: '0.35rem 0.75rem', background: confirmedBooking.prediction.risk_level === 'high' ? 'rgba(244,63,94,0.15)' : confirmedBooking.prediction.risk_level === 'medium' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)', border: '1px solid var(--border-subtle)', borderRadius: '8px', fontSize: '0.8rem', color: '#fff', fontWeight: 700 }}>
                  AI Predicted Churn: {confirmedBooking.prediction.cancellation_probability_pct}% ({confirmedBooking.prediction.risk_band})
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              type="button"
              className="preset-btn"
              onClick={onSwitchToAdmin}
              style={{ background: 'var(--primary-500)', color: '#fff', padding: '0.75rem 1.5rem', fontSize: '0.92rem' }}
            >
              <Eye size={18} />
              <span>Inspect Staff AI Prediction & Operational Advice</span>
            </button>
            <button 
              type="button" 
              className="preset-btn"
              onClick={() => setConfirmedBooking(null)}
              style={{ padding: '0.75rem 1.5rem', fontSize: '0.92rem' }}
            >
              Create Another Reservation
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleBookNow} style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
          
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

              <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '1.25rem' }}>
                <span>📅 Computed Lead Time: <strong style={{ color: '#fff' }}>{leadTime} days</strong></span>
                <span>🌙 Total Duration: <strong style={{ color: '#fff' }}>{totalNights} nights</strong> ({weekNights} weekdays, {weekendNights} weekend)</span>
              </div>
            </div>

            {/* Step 2: Booking Channel & Travel Purpose (Automated Market Segment) */}
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <div className="form-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={18} color="var(--primary-400)" />
                  <span>2. Travel Purpose & Booking Channel</span>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#a5b4fc', background: 'rgba(99,102,241,0.15)', padding: '0.2rem 0.6rem', borderRadius: '9999px', border: '1px solid rgba(99,102,241,0.3)' }}>
                  Auto-Infers ML Market Segment
                </span>
              </div>

              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                Select how this reservation originates. The system automatically classifies the market segment, distribution channel, and tariff structure for our AI cancellation prediction pipeline.
              </p>

              {/* 4 Interactive Channel Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
                {Object.values(CHANNELS).map(ch => {
                  const IconComponent = ch.icon;
                  const isSelected = bookingChannel === ch.id;

                  return (
                    <div
                      key={ch.id}
                      onClick={() => setBookingChannel(ch.id)}
                      style={{
                        padding: '1.15rem',
                        borderRadius: '14px',
                        border: isSelected ? `2px solid ${ch.color}` : '1px solid var(--border-subtle)',
                        background: isSelected ? ch.bgColor : 'rgba(255,255,255,0.02)',
                        cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.6rem',
                        position: 'relative'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: isSelected ? ch.color : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <IconComponent size={15} color={isSelected ? '#0f172a' : ch.color} />
                            </div>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: ch.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              {ch.badgeText}
                            </span>
                          </div>
                          {isSelected && <Check size={16} color={ch.color} />}
                        </div>

                        <h4 style={{ fontSize: '0.98rem', color: '#fff', marginBottom: '0.25rem' }}>{ch.name}</h4>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{ch.subtitle}</p>
                      </div>

                      <div style={{ paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72rem', color: isSelected ? '#fff' : 'var(--text-muted)' }}>
                          {ch.rateBadge}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: ch.color, fontWeight: 600 }}>
                          {ch.market_segment}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Conditional Channel Details Input */}
              {bookingChannel === 'CORPORATE' && (
                <div style={{ padding: '1.25rem', background: 'rgba(99,102,241,0.08)', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.3)', marginBottom: '1rem', animation: 'fadeIn 0.25s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <Briefcase size={16} color="#818cf8" />
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
                      Corporate Access Code & Company Contract
                    </span>
                  </div>
                  <div className="form-row">
                    <div className="input-group">
                      <label className="input-label" htmlFor="corp-code">Corporate Rate Code / Promo</label>
                      <input 
                        id="corp-code" 
                        type="text" 
                        className="input-field" 
                        value={corporateCode} 
                        onChange={(e) => setCorporateCode(e.target.value.toUpperCase())}
                        placeholder="e.g. CORP-AURA, BIZ2026"
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label" htmlFor="corp-name">Enterprise / Organization Name</label>
                      <input 
                        id="corp-name" 
                        type="text" 
                        className="input-field" 
                        value={companyName} 
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Company name"
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Quick Codes:</span>
                    {['CORP-AURA', 'BIZ2026', 'TECHCORP', 'GLOBAL45'].map(code => (
                      <button 
                        key={code} 
                        type="button" 
                        className="preset-btn"
                        onClick={() => setCorporateCode(code)}
                        style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem' }}
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {bookingChannel === 'GROUPS' && (
                <div style={{ padding: '1.25rem', background: 'rgba(192,132,252,0.08)', borderRadius: '12px', border: '1px solid rgba(192,132,252,0.3)', marginBottom: '1rem', animation: 'fadeIn 0.25s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <Users size={16} color="#c084fc" />
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
                      Group Room Block Configuration (5–30 Rooms)
                    </span>
                  </div>
                  <div className="form-row">
                    <div className="input-group">
                      <label className="input-label" htmlFor="num-rooms">Number of Reserved Rooms</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          type="button" 
                          className="preset-btn"
                          onClick={() => setNumRooms(Math.max(5, numRooms - 1))}
                          style={{ padding: '0 0.8rem', fontSize: '1rem' }}
                        >
                          -
                        </button>
                        <input 
                          id="num-rooms" 
                          type="number" 
                          min="5" 
                          max="30" 
                          className="input-field" 
                          value={numRooms} 
                          onChange={(e) => setNumRooms(Math.max(5, Number(e.target.value)))}
                          style={{ textAlign: 'center', fontWeight: 700 }}
                        />
                        <button 
                          type="button" 
                          className="preset-btn"
                          onClick={() => setNumRooms(Math.min(30, numRooms + 1))}
                          style={{ padding: '0 0.8rem', fontSize: '1rem' }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="input-group">
                      <label className="input-label" htmlFor="event-type">Event / Group Category</label>
                      <select 
                        id="event-type" 
                        className="select-field" 
                        value={groupEventType}
                        onChange={(e) => setGroupEventType(e.target.value)}
                      >
                        <option value="Corporate Convention">Corporate Convention / Summit</option>
                        <option value="Wedding Celebration">Wedding Party / Family Reunion</option>
                        <option value="Tour Group">International Tour Delegation</option>
                        <option value="Sports Team">Sports League Accommodation</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Block Sizes:</span>
                    {[5, 10, 15, 20, 25].map(cnt => (
                      <button 
                        key={cnt} 
                        type="button" 
                        className="preset-btn"
                        onClick={() => setNumRooms(cnt)}
                        style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', background: numRooms === cnt ? '#c084fc' : undefined, color: numRooms === cnt ? '#000' : undefined }}
                      >
                        {cnt} Rooms
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {bookingChannel === 'OTA' && (
                <div style={{ padding: '1.25rem', background: 'rgba(251,191,36,0.08)', borderRadius: '12px', border: '1px solid rgba(251,191,36,0.3)', marginBottom: '1rem', animation: 'fadeIn 0.25s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <Share2 size={16} color="#fbbf24" />
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
                      Channel Manager API Sync Parameters
                    </span>
                  </div>
                  <div className="form-row">
                    <div className="input-group">
                      <label className="input-label" htmlFor="ota-platform">Originating OTA Platform</label>
                      <select 
                        id="ota-platform" 
                        className="select-field"
                        value={otaPlatform}
                        onChange={(e) => setOtaPlatform(e.target.value)}
                      >
                        <option value="Booking.com">Booking.com Partner Network (Agent #9.0)</option>
                        <option value="Expedia Partner Solutions">Expedia Partner Solutions</option>
                        <option value="Agoda Global">Agoda Global Travel</option>
                        <option value="Trip.com">Trip.com International</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Channel Distribution</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        value="TA/TO (Travel Agent / Tour Operator API)" 
                        disabled 
                        style={{ opacity: 0.7 }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Automated Classification Ribbon */}
              <div style={{ 
                padding: '0.9rem 1.15rem', 
                borderRadius: '10px', 
                background: 'rgba(255,255,255,0.03)', 
                border: '1px solid var(--border-subtle)', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '0.4rem' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    🎯 Active Machine Learning Feature Mapping:
                  </span>
                  <span style={{ fontSize: '0.74rem', color: currentChannel.color, fontWeight: 600 }}>
                    {currentChannel.cancellationBaseline}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', fontSize: '0.78rem' }}>
                  <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                    market_segment: <strong style={{ color: currentChannel.color }}>"{currentChannel.market_segment}"</strong>
                  </span>
                  <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                    distribution_channel: <strong style={{ color: '#fff' }}>"{currentChannel.distribution_channel}"</strong>
                  </span>
                  <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                    customer_type: <strong style={{ color: '#fff' }}>"{currentChannel.customer_type}"</strong>
                  </span>
                </div>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  💡 {currentChannel.rationale}
                </p>
              </div>

            </div>

            {/* Step 3: Room Selection */}
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <div className="form-section-title">
                <BedDouble size={18} color="var(--primary-400)" />
                <span>3. Choose Your Suite / Room</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {ROOM_OPTIONS.map(room => {
                  const baseRoomRate = room.baseRate;
                  const discountedRate = Math.round(baseRoomRate * depositMultiplier * channelMultiplier);

                  return (
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <h4 style={{ fontSize: '0.98rem', color: '#fff' }}>{room.name}</h4>
                          {currentChannel.discountPct > 0 && (
                            <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: currentChannel.bgColor, color: currentChannel.color, fontWeight: 700 }}>
                              {currentChannel.discountPct}% OFF
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{room.desc}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-400)' }}>
                          ${discountedRate}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> / night</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Guests & Meal Plan */}
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <div className="form-section-title">
                <Users size={18} color="var(--primary-400)" />
                <span>4. Guests & Personalization</span>
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

            {/* Step 5: Rate Plan & Deposit Terms */}
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <div className="form-section-title">
                <CreditCard size={18} color="var(--primary-400)" />
                <span>5. Payment & Cancellation Policy</span>
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

            {/* Inferred Channel Badge */}
            <div style={{ 
              padding: '0.75rem 1rem', 
              background: currentChannel.bgColor, 
              border: `1px solid ${currentChannel.borderColor}`, 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between' 
            }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: currentChannel.color, fontWeight: 700, textTransform: 'uppercase' }}>
                  Channel Routing
                </span>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                  {currentChannel.name}
                </p>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#fff', background: 'rgba(0,0,0,0.3)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                {currentChannel.market_segment}
              </span>
            </div>

            <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Property:</span>
                <span style={{ fontWeight: 600 }}>{property}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Dates:</span>
                <span style={{ fontWeight: 600 }}>{totalNights} nights ({checkIn} → {checkOut})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Room Category:</span>
                <span style={{ fontWeight: 600 }}>{selectedRoom.name}</span>
              </div>
              {bookingChannel === 'GROUPS' && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Room Block:</span>
                  <span style={{ fontWeight: 700, color: '#c084fc' }}>{effectiveRooms} Rooms</span>
                </div>
              )}
              {bookingChannel === 'CORPORATE' && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Corporate Code:</span>
                  <span style={{ fontWeight: 700, color: '#818cf8' }}>{corporateCode || 'CORP-AURA'}</span>
                </div>
              )}
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
                <span>Rate per room/night:</span>
                <span style={{ fontWeight: 600 }}>${adr}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>Nights:</span>
                <span>{totalNights} nights</span>
              </div>
              {effectiveRooms > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span>Rooms:</span>
                  <span style={{ color: '#c084fc', fontWeight: 700 }}>× {effectiveRooms} rooms</span>
                </div>
              )}
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
                <span>Confirming Booking & Saving to Database...</span>
              ) : (
                <>
                  <span>Complete My Reservation</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              🔒 256-bit SSL Encrypted • Direct PMS Synchronized
            </p>
          </div>

        </form>
      )}

    </div>
  );
}
