import React, { useState, useEffect } from 'react';
import { 
  Building2, Calendar, Users, BedDouble, Utensils, 
  Car, Sparkles, CheckCircle2, ShieldCheck, MapPin, 
  ArrowRight, CreditCard, Lock, HeartHandshake, Eye,
  Briefcase, Globe, Share2, Tag, Check, Layers, Info, Percent,
  User, History, AlertCircle, Trash2, LogIn, ChevronDown, ChevronUp, UserCheck,
  Waves, Compass, Star, Award, Coffee, Anchor, Quote
} from 'lucide-react';

const COUNTRIES = [
  { code: 'ITA', name: 'Italy (ITA)' },
  { code: 'GBR', name: 'United Kingdom (GBR)' },
  { code: 'FRA', name: 'France (FRA)' },
  { code: 'DEU', name: 'Germany (DEU)' },
  { code: 'ESP', name: 'Spain (ESP)' },
  { code: 'USA', name: 'United States (USA)' },
  { code: 'CHE', name: 'Switzerland (CHE)' },
  { code: 'PRT', name: 'Portugal (PRT)' },
  { code: 'NLD', name: 'Netherlands (NLD)' },
  { code: 'BEL', name: 'Belgium (BEL)' },
  { code: 'IRL', name: 'Ireland (IRL)' },
  { code: 'BRA', name: 'Brazil (BRA)' },
  { code: 'AUT', name: 'Austria (AUT)' },
  { code: 'SWE', name: 'Sweden (SWE)' },
  { code: 'POL', name: 'Poland (POL)' }
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
  { code: 'A', name: 'Deluxe Limestone Suite', desc: 'Carved local Tufo stone sanctuary with private sea-facing balcony, king bed, and rainfall shower', baseRate: 145 },
  { code: 'D', name: 'Executive Adriatic Suite', desc: 'Panoramic cliffside suite with floor-to-ceiling glass, freestanding soaking stone tub, and sunset ocean balcony', baseRate: 210 },
  { code: 'E', name: 'Salento Heritage Villa', desc: 'Bespoke travertine retreat with private sun terrace, sommelier bar, and direct cove pathway', baseRate: 290 },
  { code: 'F', name: 'Presidential Cliff Penthouse', desc: '120m² private promontory, horizon plunge pool, dedicated cliff butler, and 270° Adriatic views', baseRate: 420 }
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

export default function CustomerPortal({ 
  onBookingCreated, 
  onSwitchToAdmin, 
  metadata, 
  apiBaseUrl = 'http://127.0.0.1:8000',
  currentUser = null,
  onOpenAuth
}) {
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
  const [country, setCountry] = useState('ITA');
  const [depositOption, setDepositOption] = useState('No Deposit');
  const [parking, setParking] = useState(0);
  const [specialRequests, setSpecialRequests] = useState(1);

  // Guest Contact Form & Automated History Verification
  const [guestName, setGuestName] = useState(currentUser?.name || 'Alexandra Miller');
  const [guestEmail, setGuestEmail] = useState(currentUser?.email || 'alexandra.miller@example.com');
  const [userHistory, setUserHistory] = useState(null);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [cancellingRef, setCancellingRef] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Auto-query guest stay and cancellation history from MongoDB
  const fetchUserHistory = async (identifier) => {
    if (!identifier) return;
    try {
      const res = await fetch(`${apiBaseUrl}/auth/history/${encodeURIComponent(identifier)}`);
      if (res.ok) {
        const data = await res.json();
        setUserHistory(data);
      }
    } catch (e) {
      console.warn('Could not load user booking history:', e);
    }
  };

  // Sync with logged in user
  useEffect(() => {
    if (currentUser) {
      setGuestName(currentUser.name || currentUser.username);
      setGuestEmail(currentUser.email || '');
      fetchUserHistory(currentUser.email || currentUser.username);
    } else {
      setUserHistory(null);
    }
  }, [currentUser]);

  // Dynamically auto-check MongoDB history whenever guest email or username changes
  useEffect(() => {
    const ident = (guestEmail || currentUser?.email || currentUser?.username || '').trim();
    if (ident && (ident.includes('@') || ident.length >= 3)) {
      const timer = setTimeout(() => {
        fetchUserHistory(ident);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [guestEmail]);

  const handleCancelBooking = async (bookingRef) => {
    if (!window.confirm(`Are you sure you want to cancel reservation #${bookingRef}? This cancellation will be recorded in your account history.`)) {
      return;
    }
    setCancellingRef(bookingRef);
    try {
      const res = await fetch(`${apiBaseUrl}/reservations/${bookingRef}/cancel`, {
        method: 'POST'
      });
      if (res.ok) {
        if (currentUser) {
          await fetchUserHistory(currentUser.email || currentUser.username);
        }
        alert(`Reservation #${bookingRef} successfully cancelled in MongoDB!`);
      } else {
        alert('Failed to cancel reservation.');
      }
    } catch (e) {
      alert('Network error while cancelling reservation.');
    } finally {
      setCancellingRef(null);
    }
  };

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

  const handleCheckOutChange = (e) => {
    const val = e.target.value;
    if (new Date(val + 'T00:00:00') > new Date(checkIn + 'T00:00:00')) {
      setCheckOut(val);
    } else {
      setCheckOut(formatDate(addDays(new Date(checkIn + 'T00:00:00'), 1)));
    }
  };

  const handleBookNow = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      if (onOpenAuth) {
        onOpenAuth('login', false);
      }
      return;
    }
    setIsSubmitting(true);

    const arrivalDateObj = new Date(checkIn + 'T00:00:00');
    const arrivalMonth = MONTH_NAMES[arrivalDateObj.getMonth()];
    const weekNumber = getISOWeekNumber(arrivalDateObj);
    const bookingRef = `AUR-${Math.floor(100000 + Math.random() * 900000)}`;

    const bookingPayload = {
      booking_ref: bookingRef,
      username: currentUser ? currentUser.username : null,
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
      is_repeated_guest: userHistory?.is_repeated_guest ? 1 : 0,
      previous_cancellations: userHistory?.previous_cancellations || 0,
      previous_bookings_not_canceled: userHistory?.previous_bookings_not_canceled || 0,
      reserved_room_type: roomType,
      deposit_type: depositOption,
      adr: adr,
      required_car_parking_spaces: Number(parking),
      total_of_special_requests: Number(specialRequests),
      booking_channel_name: currentChannel.name,
      corporate_code: bookingChannel === 'CORPORATE' ? corporateCode : null,
      room_count: effectiveRooms,
      status: 'confirmed',
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
        if (currentUser) {
          fetchUserHistory(currentUser.email || currentUser.username);
        }
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

  const scrollToBooking = (selectedRoomCode) => {
    if (selectedRoomCode) {
      setRoomType(selectedRoomCode);
    }
    const el = document.getElementById('booking-engine');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* ========================================================
          OSTRO CINEMATIC HERO & QUICK-AVAILABILITY CONSOLE (FULL BACKGROUND)
          ======================================================== */}
      <section className="ostro-hero-container">
        {/* Background Image & Editorial Twilight Vignette */}
        <div 
          className="ostro-hero-bg"
          style={{ backgroundImage: `url('/images/ostro_hero.jpg')` }}
        />
        <div className="ostro-hero-overlay" />

        {/* Content Box (Expansive Widescreen Studio Layout) */}
        <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: '1280px', margin: '0 auto', textAlign: 'center', padding: '0 1.5rem' }}>
          
          {/* Geographical & Architectural Crest */}
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.65rem', 
            padding: '0.45rem 1.15rem', 
            background: 'rgba(217, 119, 6, 0.15)', 
            border: '1px solid rgba(245, 158, 11, 0.4)', 
            borderRadius: '9999px', 
            backdropFilter: 'blur(12px)',
            marginBottom: '1.5rem',
            animation: 'fadeIn 0.8s ease'
          }}>
            <Compass size={14} color="#f59e0b" />
            <span style={{ 
              fontSize: '0.78rem', 
              letterSpacing: '0.18em', 
              textTransform: 'uppercase', 
              color: '#fde68a', 
              fontWeight: 600 
            }}>
              SALENTO, PUGLIA • 40.1417° N, 18.4908° E • CLIFF RETREAT
            </span>
          </div>

          {/* Editorial Headline */}
          <h1 className="ostro-hero-title" style={{ 
            fontFamily: 'var(--font-serif)', 
            fontSize: 'clamp(2.5rem, 5.2vw, 4.4rem)', 
            fontWeight: 400, 
            lineHeight: 1.12, 
            letterSpacing: '-0.01em', 
            color: '#ffffff',
            maxWidth: '1000px',
            margin: '0 auto 1.25rem auto',
            textShadow: '0 4px 30px rgba(0,0,0,0.85)'
          }}>
            Where Mediterranean Stone <br />
            <span style={{ fontStyle: 'italic', fontWeight: 300, color: '#fde68a' }}>
              Meets Adriatic Horizons
            </span>
          </h1>

          {/* Subtitle */}
          <p style={{ 
            fontFamily: 'var(--font-serif)', 
            fontSize: 'clamp(1.1rem, 2vw, 1.35rem)', 
            fontStyle: 'italic', 
            color: '#f5eee6', 
            lineHeight: 1.65, 
            maxWidth: '820px',
            margin: '0 auto 2.25rem auto',
            textShadow: '0 2px 14px rgba(0,0,0,0.8)'
          }}>
            Suspended sixty meters above the crystalline waters of Salento, OSTRO is a sanctuary carved into white coastal limestone — where timeless Italian silence converges with predictive machine-learning hospitality.
          </p>

          {/* Anchor Navigation CTAs */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            <button 
              type="button"
              className="ostro-btn-gold"
              onClick={() => scrollToBooking()}
              style={{ fontSize: '0.92rem', padding: '0.85rem 2rem' }}
            >
              <BedDouble size={18} />
              <span>Reserve Your Sanctuary</span>
            </button>

            <a 
              href="#suites"
              className="ostro-btn-secondary"
              style={{ fontSize: '0.92rem', padding: '0.85rem 1.85rem' }}
            >
              <Sparkles size={16} />
              <span>Explore Suites & Villas</span>
              <ArrowRight size={15} />
            </a>

            <a 
              href="#philosophy"
              className="ostro-btn-ghost"
              style={{ fontSize: '0.92rem', padding: '0.85rem 1.85rem' }}
            >
              <Compass size={15} />
              <span>The Sanctuary Ethos</span>
            </a>
          </div>

          {/* Panoramic Luxury Booking Console (Expansive Horizontal Dock) */}
          <div className="ostro-wide-dock">
            <div className="ostro-dock-col">
              <label className="ostro-dock-label">
                <Calendar size={13} color="#f59e0b" />
                <span>Check-in Date</span>
              </label>
              <input 
                type="date"
                className="ostro-dock-input"
                min={todayStr}
                value={checkIn}
                onChange={handleCheckInChange}
              />
            </div>

            <div className="ostro-dock-col">
              <label className="ostro-dock-label">
                <Calendar size={13} color="#f59e0b" />
                <span>Check-out Date</span>
              </label>
              <input 
                type="date"
                className="ostro-dock-input"
                min={checkIn}
                value={checkOut}
                onChange={handleCheckOutChange}
              />
            </div>

            <div className="ostro-dock-col">
              <label className="ostro-dock-label">
                <BedDouble size={13} color="#f59e0b" />
                <span>Suite Category</span>
              </label>
              <select 
                className="ostro-dock-input"
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
              >
                {ROOM_OPTIONS.map(r => (
                  <option key={r.code} value={r.code}>{r.name} (${r.baseRate}/nt)</option>
                ))}
              </select>
            </div>

            <div className="ostro-dock-col">
              <label className="ostro-dock-label">
                <Users size={13} color="#f59e0b" />
                <span>Guests & Adults</span>
              </label>
              <select 
                className="ostro-dock-input"
                value={adults}
                onChange={(e) => setAdults(Number(e.target.value))}
              >
                <option value={1}>1 Solo Voyager</option>
                <option value={2}>2 Adults</option>
                <option value={3}>3 Adults</option>
                <option value={4}>4 Adults</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button 
                type="button" 
                className="ostro-btn-gold"
                onClick={() => scrollToBooking(roomType)}
                style={{ width: '100%', padding: '0.85rem 1.6rem', fontSize: '0.88rem' }}
              >
                <span>Check Live Rates</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================
          MAIN CONTENT CONTAINER (EXPANSIVE WIDESCREEN 1440PX)
          ======================================================== */}
      <div style={{ maxWidth: '1440px', width: '100%', margin: '0 auto', padding: '5.5rem 2.5rem 4rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '5.5rem' }}>

      {/* ========================================================
          SECTION 1: THE ARCHITECTURAL ETHOS & LOCATION (EDITORIAL SPREAD)
          ======================================================== */}
      <section id="philosophy" style={{ scrollMarginTop: '110px' }}>
        <div className="ostro-editorial-spread">
          {/* Left Column: Architectural Manifesto & Credential Specs */}
          <div className="ostro-manifesto-card" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            borderRadius: '28px',
            padding: '3rem 2.5rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '220px', height: '220px', background: 'radial-gradient(circle, rgba(200, 125, 85, 0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
            
            <div>
              <span className="ostro-badge-gold" style={{ marginBottom: '1.5rem' }}>
                ✦ ARCHITECTURAL MANIFESTO
              </span>
              <h2 style={{ 
                fontFamily: 'var(--font-serif)', 
                fontSize: 'clamp(2.1rem, 3.2vw, 3rem)', 
                fontWeight: 400, 
                lineHeight: 1.18, 
                color: 'var(--text-primary)',
                marginBottom: '1.5rem'
              }}>
                Carved into White Limestone, <br />
                <span style={{ fontStyle: 'italic', color: 'var(--ostro-terracotta)' }}>
                  Suspended in Marine Silence
                </span>
              </h2>
              <p style={{ 
                fontFamily: 'var(--font-serif)',
                fontSize: '1.12rem', 
                fontStyle: 'italic', 
                color: 'var(--text-secondary)', 
                lineHeight: 1.7, 
                marginBottom: '2rem' 
              }}>
                "Natura non facit saltus — We did not impose architecture upon the cliffs of Salento; we carved our sanctuary into them. Here, southerly winds, warm stone, and sea compose an uninterrupted dialogue."
              </p>
            </div>

            {/* Architectural Credential Badges */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '1.5rem',
              paddingTop: '2rem',
              borderTop: '1px solid var(--border-subtle)'
            }}>
              <div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.9rem', color: '#f59e0b', fontWeight: 300 }}>60m</div>
                <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Adriatic Cliff Elevation</div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.9rem', color: '#f59e0b', fontWeight: 300 }}>100%</div>
                <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Direct Sea-Facing Orient</div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.9rem', color: '#f59e0b', fontWeight: 300 }}>24°C</div>
                <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Passive Geothermal Inertia</div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.9rem', color: '#f59e0b', fontWeight: 300 }}>1860</div>
                <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Olive Terraces Heritage</div>
              </div>
            </div>
          </div>

          {/* Right Column: 4 Numbered Architectural Pillars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="glass-panel ostro-card-hover" style={{ padding: '1.85rem 2rem', borderRadius: '22px', border: '1px solid var(--border-subtle)', display: 'flex', gap: '1.75rem', alignItems: 'flex-start' }}>
              <div className="ostro-editorial-num">01</div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.45rem' }}>
                  Pietra Leccese & Sun-Bleached Travertine
                </h3>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                  Sculpted using indigenous coastal limestone with lime plasters that remain naturally cool beneath the Italian midday sun, honoring centuries of Salento stone craftsmanship.
                </p>
              </div>
            </div>

            <div className="glass-panel ostro-card-hover" style={{ padding: '1.85rem 2rem', borderRadius: '22px', border: '1px solid var(--border-subtle)', display: 'flex', gap: '1.75rem', alignItems: 'flex-start' }}>
              <div className="ostro-editorial-num">02</div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.45rem' }}>
                  Strait of Otranto Marine Horizons
                </h3>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                  Perched on dramatic promontories where every private suite commands uninterrupted ocean sunrises and night moonpaths across the Adriatic Sea.
                </p>
              </div>
            </div>

            <div className="glass-panel ostro-card-hover" style={{ padding: '1.85rem 2rem', borderRadius: '22px', border: '1px solid var(--border-subtle)', display: 'flex', gap: '1.75rem', alignItems: 'flex-start' }}>
              <div className="ostro-editorial-num">03</div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.45rem' }}>
                  Sea-to-Table Gastronomy & Thermal Grotto
                </h3>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                  Ristorante La Scogliera curates day-boat red prawns from Castro Marina, organic ancient grain pastas, and subterranean Roman sea salt baths carved in rock.
                </p>
              </div>
            </div>

            <div className="glass-panel ostro-card-hover" style={{ padding: '1.85rem 2rem', borderRadius: '22px', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'flex', gap: '1.75rem', alignItems: 'flex-start' }}>
              <div className="ostro-editorial-num" style={{ color: 'var(--ostro-gold)' }}>04</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.35rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    Guaranteed Reservation & Stay Integrity
                  </h3>
                  <span style={{ fontSize: '0.68rem', padding: '0.12rem 0.5rem', borderRadius: '9999px', background: 'rgba(245,158,11,0.15)', color: '#b45309', fontWeight: 700, border: '1px solid rgba(245,158,11,0.3)' }}>Direct Assurance</span>
                </div>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                  Guaranteed arrival concierge, eliminating overbooking uncertainty and curating bespoke arrival preparation tailored to your sanctuary.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 2: SUITES & SANCTUARIES SHOWCASE
          ======================================================== */}
      <section id="suites" style={{ scrollMarginTop: '100px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
          <div>
            <span className="ostro-badge-gold" style={{ marginBottom: '0.75rem' }}>
              ✦ PRIVATE SANCTUARIES
            </span>
            <h2 style={{ 
              fontFamily: 'var(--font-serif)', 
              fontSize: 'clamp(2rem, 3.2vw, 2.8rem)', 
              fontWeight: 400, 
              color: 'var(--text-primary)' 
            }}>
              Suites Suspended Above the Sea
            </h2>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontStyle: 'italic', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              Every residence features floor-to-ceiling Adriatic panoramas, private stone terraces, and Italian linen.
            </p>
          </div>
          <button 
            type="button" 
            className="ostro-btn-outline"
            onClick={() => scrollToBooking()}
            style={{ fontSize: '0.85rem', padding: '0.65rem 1.25rem' }}
          >
            <span>View All Availability</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* 3 Showcase Suite Cards (Expanded Widescreen Editorial Presentation) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
          
          {/* Card 1: Deluxe Limestone Suite (Room A) */}
          <div className="glass-panel ostro-card-hover" style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
            <div className="ostro-img-wrapper" style={{ height: '270px' }}>
              <img 
                src="/images/ostro_suite.jpg" 
                alt="Deluxe Limestone Suite" 
              />
              <div style={{ position: 'absolute', top: '1.25rem', left: '1.25rem', background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(10px)', padding: '0.4rem 0.85rem', borderRadius: '9999px', fontSize: '0.74rem', color: '#fde68a', border: '1px solid rgba(245,158,11,0.3)', fontWeight: 600 }}>
                SUITE 01 • LIMESTONE TERRACE (48 m²)
              </div>
              <div style={{ position: 'absolute', bottom: '1.25rem', right: '1.25rem', background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(10px)', padding: '0.4rem 0.95rem', borderRadius: '9999px', fontSize: '0.9rem', color: '#fff', fontWeight: 700, border: '1px solid rgba(255,255,255,0.1)' }}>
                $145 <span style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.7)', fontWeight: 400 }}>/ night</span>
              </div>
            </div>

            <div style={{ padding: '2rem 1.75rem', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Ground Cliff Level • East Facing
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Sparkles size={11} /> Best Direct Rate
                  </span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.65rem' }}>
                  Deluxe Limestone Suite
                </h3>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '1.25rem' }}>
                  Carved local Tufo stone sanctuary with private sea-facing balcony, plush king bed, rainfall shower, and organic olive-oil amenities.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.75rem' }}>
                  <span className="ostro-suite-pill">King Featherbed</span>
                  <span className="ostro-suite-pill">Sea Balcony</span>
                  <span className="ostro-suite-pill">Rain Shower</span>
                </div>
              </div>

              <button 
                type="button" 
                className="ostro-btn-gold"
                onClick={() => scrollToBooking('A')}
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.86rem', padding: '0.75rem 1rem' }}
              >
                <span>Select & Configure Room A</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>

          {/* Card 2: Executive Adriatic Suite (Room D) */}
          <div className="glass-panel ostro-card-hover" style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(245,158,11,0.35)', display: 'flex', flexDirection: 'column' }}>
            <div className="ostro-img-wrapper" style={{ height: '270px' }}>
              <img 
                src="/images/ostro_hero.jpg" 
                alt="Executive Adriatic Suite" 
              />
              <div style={{ position: 'absolute', top: '1.25rem', left: '1.25rem', background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(10px)', padding: '0.4rem 0.85rem', borderRadius: '9999px', fontSize: '0.74rem', color: '#fde68a', border: '1px solid rgba(245,158,11,0.3)', fontWeight: 600 }}>
                SUITE 02 • CLIFFSIDE EDGE (68 m²)
              </div>
              <div style={{ position: 'absolute', bottom: '1.25rem', right: '1.25rem', background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(10px)', padding: '0.4rem 0.95rem', borderRadius: '9999px', fontSize: '0.9rem', color: '#fff', fontWeight: 700, border: '1px solid rgba(255,255,255,0.1)' }}>
                $210 <span style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.7)', fontWeight: 400 }}>/ night</span>
              </div>
            </div>

            <div style={{ padding: '2rem 1.75rem', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Mid Promontory • Horizon Vista
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Sparkles size={11} /> Most Requested
                  </span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.65rem' }}>
                  Executive Adriatic Suite
                </h3>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '1.25rem' }}>
                  Panoramic cliffside suite with floor-to-ceiling glass, freestanding soaking stone tub overlooking the sea, and sunset ocean balcony.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.75rem' }}>
                  <span className="ostro-suite-pill">Soaking Stone Tub</span>
                  <span className="ostro-suite-pill">Panoramic Glass</span>
                  <span className="ostro-suite-pill">Sunset Balcony</span>
                </div>
              </div>

              <button 
                type="button" 
                className="ostro-btn-gold"
                onClick={() => scrollToBooking('D')}
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.86rem', padding: '0.75rem 1rem' }}
              >
                <span>Select & Configure Room D</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>

          {/* Card 3: Presidential Cliff Penthouse (Room F) */}
          <div className="glass-panel ostro-card-hover" style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
            <div className="ostro-img-wrapper" style={{ height: '270px' }}>
              <img 
                src="/images/ostro_dining.jpg" 
                alt="Presidential Cliff Penthouse" 
              />
              <div style={{ position: 'absolute', top: '1.25rem', left: '1.25rem', background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(10px)', padding: '0.4rem 0.85rem', borderRadius: '9999px', fontSize: '0.74rem', color: '#fde68a', border: '1px solid rgba(245,158,11,0.3)', fontWeight: 600 }}>
                SUITE 03 • TOP PROMONTORY (120 m²)
              </div>
              <div style={{ position: 'absolute', bottom: '1.25rem', right: '1.25rem', background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(10px)', padding: '0.4rem 0.95rem', borderRadius: '9999px', fontSize: '0.9rem', color: '#fff', fontWeight: 700, border: '1px solid rgba(255,255,255,0.1)' }}>
                $420 <span style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.7)', fontWeight: 400 }}>/ night</span>
              </div>
            </div>

            <div style={{ padding: '2rem 1.75rem', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Summit Crest • 270° Marine Vista
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#b45309', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    ✦ VIP Concierge Included
                  </span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.65rem' }}>
                  Presidential Cliff Penthouse
                </h3>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '1.25rem' }}>
                  Private cliff promontory, horizon seawater plunge pool, dedicated butler service, curated Salento wine cellar, and 270° marine vista.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.75rem' }}>
                  <span className="ostro-suite-pill">Plunge Pool</span>
                  <span className="ostro-suite-pill">Cliff Butler</span>
                  <span className="ostro-suite-pill">Private Solarium</span>
                </div>
              </div>

              <button 
                type="button" 
                className="ostro-btn-gold"
                onClick={() => scrollToBooking('F')}
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.86rem', padding: '0.75rem 1rem' }}
              >
                <span>Select & Configure Room F</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================
          SECTION 3: CLIFF GASTRONOMY & COASTAL WELLNESS
          ======================================================== */}
      <section id="dining" style={{ scrollMarginTop: '100px' }}>
        <div className="glass-panel" style={{ 
          borderRadius: '24px', 
          overflow: 'hidden', 
          border: '1px solid rgba(245,158,11,0.25)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))'
        }}>
          {/* Visual Column */}
          <div style={{ position: 'relative', minHeight: '380px' }}>
            <img 
              src="/images/ostro_dining.jpg" 
              alt="Ristorante La Scogliera at OSTRO" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{ 
              position: 'absolute', 
              bottom: '1.5rem', 
              left: '1.5rem', 
              background: 'rgba(15,23,42,0.85)', 
              backdropFilter: 'blur(10px)', 
              padding: '0.65rem 1rem', 
              borderRadius: '12px',
              border: '1px solid rgba(245,158,11,0.3)'
            }}>
              <div style={{ fontSize: '0.72rem', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>
                Gastronomic Excellence
              </div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: '#fff', fontWeight: 500 }}>
                Ristorante La Scogliera
              </div>
            </div>
          </div>

          {/* Editorial Description Column */}
          <div style={{ padding: '2.75rem 2.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span className="ostro-badge-gold" style={{ marginBottom: '0.75rem', alignSelf: 'flex-start' }}>
              ✦ CULINARY & REJUVENATION
            </span>
            <h2 style={{ 
              fontFamily: 'var(--font-serif)', 
              fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', 
              fontWeight: 400, 
              color: 'var(--text-primary)',
              lineHeight: 1.25,
              marginBottom: '1rem'
            }}>
              Sea-Sculpted Dining & Grotto Thermal Baths
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              Evenings at OSTRO begin as the sun dips behind the Salento ridge, casting amber reflections across the sea. Savor wild red shrimp from Gallipoli, artisanal hand-rolled orecchiette, and rare Puglia vintages curated by our head sommelier.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
              <div style={{ borderLeft: '2px solid rgba(245,158,11,0.5)', paddingLeft: '0.85rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>Thermal Grotto Spa</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Subterranean Roman sea salt baths and hydrotherapy</div>
              </div>
              <div style={{ borderLeft: '2px solid rgba(245,158,11,0.5)', paddingLeft: '0.85rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>Sunset Spritz Bar</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Artisanal amari and cliffside apertivi at twilight</div>
              </div>
            </div>

            <div>
              <button 
                type="button" 
                className="ostro-btn-gold"
                onClick={() => scrollToBooking()}
                style={{ fontSize: '0.85rem', padding: '0.65rem 1.5rem' }}
              >
                <span>Book A Stay with Half-Board (HB)</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 4: THE OFFICIAL BOOKING ENGINE (ANCHOR WRAPPER)
          ======================================================== */}
      <section id="booking-engine" style={{ scrollMarginTop: '80px', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        
        {/* Editorial Section Anchor Header */}
        <div style={{ 
          padding: '2rem 2.25rem', 
          background: 'linear-gradient(135deg, rgba(20, 24, 33, 0.95) 0%, rgba(33, 23, 18, 0.9) 100%)', 
          border: '1px solid rgba(245, 158, 11, 0.3)', 
          borderRadius: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#f59e0b', fontWeight: 600, marginBottom: '0.35rem' }}>
              <Sparkles size={14} color="#f59e0b" />
              <span>OFFICIAL RESERVATION ENGINE • REAL-TIME CHANNEL CLASSIFICATION</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.1rem', fontWeight: 400, color: '#fff' }}>
              Curate Your Stay at OSTRO Salento
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Direct bookings enjoy best rates, complimentary Puglia breakfast, and flexible cancellation assurance.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', borderRadius: '9999px', background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', fontWeight: 600 }}>
              ● Best Rate Guarantee & Direct Booking Concierge
            </span>
          </div>
        </div>

      {/* Logged In Guest Loyalty & Account History Bar */}
      {currentUser ? (
        <div className="glass-panel" style={{ 
          padding: '1.25rem 1.5rem', 
          borderRadius: '16px', 
          background: 'rgba(99,102,241,0.08)', 
          border: '1px solid rgba(99,102,241,0.25)', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1rem' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={20} color="#818cf8" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h4 style={{ fontSize: '1rem', color: '#fff', fontWeight: 700 }}>
                    {currentUser.name}
                  </h4>
                  <span style={{ 
                    fontSize: '0.68rem', 
                    padding: '0.12rem 0.45rem', 
                    borderRadius: '9999px', 
                    background: userHistory?.has_ever_visited ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)', 
                    color: userHistory?.has_ever_visited ? '#34d399' : '#c7d2fe', 
                    border: `1px solid ${userHistory?.has_ever_visited ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.3)'}`, 
                    fontWeight: 700 
                  }}>
                    {userHistory?.has_ever_visited ? '✨ Returning OSTRO Member' : '🌱 First-Time Guest'}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {currentUser.email} • <strong>{userHistory ? userHistory.total_past_bookings : 0} Stays on File</strong> • 
                  <span style={{ color: userHistory?.previous_cancellations > 0 ? '#fda4af' : '#6ee7b7', marginLeft: '0.25rem' }}>
                    {userHistory ? userHistory.previous_cancellations : 0} Recorded Cancellations
                  </span>
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {userHistory && userHistory.total_past_bookings > 0 && (
                <button
                  type="button"
                  className="preset-btn"
                  onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
                  style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <History size={14} />
                  <span>{showHistoryDrawer ? 'Hide Stays' : `My Stays & Cancellations (${userHistory.total_past_bookings})`}</span>
                  {showHistoryDrawer ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              )}
            </div>
          </div>

          {/* Collapsible History Drawer */}
          {showHistoryDrawer && userHistory?.history && (
            <div style={{ paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)', animation: 'fadeIn 0.25s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
                  Your Account Reservation History:
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Manage existing reservations or submit cancellations in accordance with hotel terms.
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {userHistory.history.map((bk, i) => {
                  const isCancelled = bk.status === 'cancelled' || bk.deposit_type === 'Cancelled';
                  return (
                    <div 
                      key={bk.booking_ref || i}
                      style={{ 
                        padding: '0.75rem 1rem', 
                        background: 'rgba(255,255,255,0.03)', 
                        borderRadius: '10px', 
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>
                            {bk.hotel}
                          </span>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#818cf8' }}>
                            #{bk.booking_ref}
                          </span>
                          <span style={{ 
                            fontSize: '0.66rem', 
                            padding: '0.1rem 0.4rem', 
                            borderRadius: '4px',
                            fontWeight: 700,
                            background: isCancelled ? 'rgba(244,63,94,0.15)' : 'rgba(16,185,129,0.15)',
                            color: isCancelled ? '#fda4af' : '#6ee7b7'
                          }}>
                            {isCancelled ? 'CANCELLED' : 'CONFIRMED'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          Dates: {bk.check_in_date || bk.arrival_date_month} • Rate: ${bk.adr}/nt • Segment: {bk.market_segment || 'Direct'}
                        </div>
                      </div>

                      <div>
                        {!isCancelled && (
                          <button
                            type="button"
                            className="preset-btn"
                            disabled={cancellingRef === bk.booking_ref}
                            onClick={() => handleCancelBooking(bk.booking_ref)}
                            style={{ 
                              fontSize: '0.72rem', 
                              padding: '0.25rem 0.65rem', 
                              color: '#fda4af', 
                              borderColor: 'rgba(244,63,94,0.3)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem'
                            }}
                          >
                            <Trash2 size={12} />
                            <span>{cancellingRef === bk.booking_ref ? 'Cancelling...' : 'Cancel Reservation'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-panel" style={{ 
          padding: '1.15rem 1.5rem', 
          borderRadius: '16px', 
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.08) 100%)', 
          border: '1px solid rgba(129,140,248,0.3)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '0.85rem' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={17} color="#818cf8" />
            </div>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
                Customer Sign In Required to Reserve Rooms
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                Explore properties and rates freely. Sign in or register as a guest to confirm reservations and record stay history.
              </div>
            </div>
          </div>
          <button
            type="button"
            className="preset-btn"
            onClick={() => onOpenAuth && onOpenAuth('login')}
            style={{ 
              fontSize: '0.8rem', 
              padding: '0.45rem 1rem', 
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', 
              color: '#fff', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.4rem',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
            }}
          >
            <LogIn size={14} />
            <span>Sign In / Register as Customer</span>
          </button>
        </div>
      )}

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
        <form onSubmit={handleBookNow} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: '2.5rem', alignItems: 'start' }}>
          
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
                    background: property === 'City Hotel' ? 'rgba(99,102,241,0.12)' : 'var(--bg-card-elevated)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>OSTRO Palazzo Lecce</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>City Hotel • Baroque historic center & gardens</p>
                </div>

                <div 
                  onClick={() => setProperty('Resort Hotel')}
                  style={{
                    padding: '1.25rem',
                    borderRadius: '12px',
                    border: property === 'Resort Hotel' ? '2px solid #f59e0b' : '1px solid var(--border-subtle)',
                    background: property === 'Resort Hotel' ? 'rgba(217, 119, 6, 0.15)' : 'var(--bg-card-elevated)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>OSTRO Cliff Sanctuary Salento</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Resort Hotel • Salento cliffside promontory & private cove</p>
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
                <span>📅 Computed Lead Time: <strong style={{ color: 'var(--text-primary)' }}>{leadTime} days</strong></span>
                <span>🌙 Total Duration: <strong style={{ color: 'var(--text-primary)' }}>{totalNights} nights</strong> ({weekNights} weekdays, {weekendNights} weekend)</span>
              </div>
            </div>

            {/* Step 2: Booking Channel & Travel Purpose (Automated Market Segment) */}
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <div className="form-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={18} color="var(--primary-400)" />
                  <span>2. Travel Purpose & Booking Channel</span>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#6366f1', background: 'rgba(99,102,241,0.12)', padding: '0.2rem 0.6rem', borderRadius: '9999px', border: '1px solid rgba(99,102,241,0.3)', fontWeight: 600 }}>
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
                        background: isSelected ? ch.bgColor : 'var(--bg-card-elevated)',
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
                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: isSelected ? ch.color : 'rgba(99,102,241,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <IconComponent size={15} color={isSelected ? '#ffffff' : ch.color} />
                            </div>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: ch.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              {ch.badgeText}
                            </span>
                          </div>
                          {isSelected && <Check size={16} color={ch.color} />}
                        </div>

                        <h4 style={{ fontSize: '0.98rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{ch.name}</h4>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{ch.subtitle}</p>
                      </div>

                      <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72rem', color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: isSelected ? 600 : 400 }}>
                          {ch.rateBadge}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: ch.color, fontWeight: 700 }}>
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
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
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

              {/* Channel Terms Ribbon */}
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
                  <span style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 700 }}>
                    ✦ {currentChannel.name} • Terms & Inclusions
                  </span>
                  <span style={{ fontSize: '0.74rem', color: currentChannel.color, fontWeight: 600 }}>
                    {currentChannel.rateBadge}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem', lineHeight: 1.5 }}>
                  {currentChannel.rationale}
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
                        background: roomType === room.code ? 'rgba(99,102,241,0.1)' : 'var(--bg-card-elevated)',
                        cursor: 'pointer'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <h4 style={{ fontSize: '0.98rem', color: 'var(--text-primary)' }}>{room.name}</h4>
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
                  <label className="input-label" htmlFor="country">Country of Residence / Nationality</label>
                  <select 
                    id="country" 
                    className="select-field" 
                    value={country} 
                    onChange={(e) => setCountry(e.target.value)}
                  >
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="parking">Vehicle Parking & Valet</label>
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
              </div>

              {/* Automated Guest Stay & Cancellation History Card */}
              <div className={`ostro-guest-history-card ${userHistory?.previous_cancellations > 0 ? 'is-risk' : 'is-clean'}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={18} color={userHistory?.previous_cancellations > 0 ? '#f43f5e' : '#059669'} />
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Automated Stay & Cancellation History
                    </span>
                    <span style={{
                      fontSize: '0.66rem',
                      padding: '0.12rem 0.45rem',
                      borderRadius: '9999px',
                      fontWeight: 700,
                      background: 'rgba(16, 185, 129, 0.12)',
                      color: '#059669',
                      border: '1px solid rgba(16, 185, 129, 0.3)'
                    }}>
                      ● Verified Guest Profile
                    </span>
                  </div>

                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Guest Profile: <strong style={{ color: 'var(--text-primary)' }}>{guestEmail || currentUser?.email || 'guest@ostro.it'}</strong>
                  </span>
                </div>

                {/* Live Metrics Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                  <div className="ostro-history-metric-box">
                    <div className="ostro-history-metric-label">
                      Prior Reservations
                    </div>
                    <div className="ostro-history-metric-val">
                      {userHistory ? userHistory.total_past_bookings : 0} {userHistory?.total_past_bookings === 1 ? 'Stay' : 'Stays'}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      {userHistory?.is_repeated_guest ? 'Returning Member' : 'First-Time Guest'}
                    </div>
                  </div>

                  <div className="ostro-history-metric-box">
                    <div className="ostro-history-metric-label">
                      Completed Stays
                    </div>
                    <div className="ostro-history-metric-val" style={{ color: '#059669' }}>
                      {userHistory ? userHistory.previous_bookings_not_canceled : 0} Kept
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      Honored bookings
                    </div>
                  </div>

                  <div className="ostro-history-metric-box">
                    <div className="ostro-history-metric-label" style={{ color: userHistory?.previous_cancellations > 0 ? '#dc2626' : undefined }}>
                      Past Cancellations
                    </div>
                    <div className="ostro-history-metric-val" style={{ color: userHistory?.previous_cancellations > 0 ? '#dc2626' : undefined }}>
                      {userHistory ? userHistory.previous_cancellations : 0} Cancelled
                    </div>
                    <div style={{ fontSize: '0.68rem', color: userHistory?.previous_cancellations > 0 ? '#ef4444' : 'var(--text-muted)', marginTop: '0.15rem' }}>
                      {userHistory?.previous_cancellations > 0 ? 'On Account File' : 'Clean Record'}
                    </div>
                  </div>
                </div>

                {/* Status Notification Banner */}
                <div className={userHistory?.previous_cancellations > 0 ? "ostro-history-banner-risk" : "ostro-history-banner-clean"}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    {userHistory?.previous_cancellations > 0 ? (
                      <AlertCircle size={16} color="#dc2626" />
                    ) : userHistory?.is_repeated_guest ? (
                      <CheckCircle2 size={16} color="#059669" />
                    ) : (
                      <UserCheck size={16} color="#6366f1" />
                    )}
                    <span>
                      {userHistory?.previous_cancellations > 0
                        ? `Account Record: You have ${userHistory.previous_cancellations} previous cancellation(s) recorded on file. Your reservation details will be processed automatically.`
                        : userHistory?.is_repeated_guest
                          ? `Recognized Returning Member: Welcome back! You have 0 past cancellations on file. We look forward to hosting you again.`
                          : `Welcome to OSTRO Salento! This reservation will be automatically registered to your new guest account.`}
                    </span>
                  </div>

                  {userHistory && userHistory.total_past_bookings > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary-500)',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        marginLeft: '0.5rem'
                      }}
                    >
                      {showHistoryDrawer ? 'Hide Stays' : `View ${userHistory.total_past_bookings} Past Reservation(s)`}
                    </button>
                  )}
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
                    background: depositOption === 'No Deposit' ? 'rgba(16,185,129,0.08)' : 'var(--bg-card-elevated)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '0.98rem', color: 'var(--text-primary)' }}>Flexible Rate</h4>
                    <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>FREE CANCELLATION</span>
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
                    background: depositOption === 'Non Refund' ? 'rgba(244,63,94,0.08)' : 'var(--bg-card-elevated)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '0.98rem', color: 'var(--text-primary)' }}>Saver Rate (15% Off)</h4>
                    <span style={{ fontSize: '0.72rem', color: 'var(--risk-high)', fontWeight: 700 }}>NON-REFUNDABLE</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                    Full payment charged upon booking. Non-refundable in case of cancellation or modification.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Sidebar Booking Summary & Order Checkout */}
          <div className="glass-panel" style={{ padding: '1.75rem', position: 'sticky', top: '6rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
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
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {currentChannel.name}
                </p>
              </div>
              <span style={{ fontSize: '0.75rem', color: currentChannel.color, background: 'rgba(99,102,241,0.08)', border: `1px solid ${currentChannel.borderColor}`, padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 600 }}>
                {currentChannel.market_segment}
              </span>
            </div>

            <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Property:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{property}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Dates:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{totalNights} nights ({checkIn} → {checkOut})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Room Category:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedRoom.name}</span>
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
                <span style={{ fontWeight: 600, color: depositOption === 'Non Refund' ? 'var(--risk-high)' : '#059669' }}>
                  {depositOption === 'Non Refund' ? 'Non-Refundable (15% Off)' : 'Flexible Free Cancel'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Country of Origin:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{COUNTRIES.find(c => c.code === country)?.name || country}</span>
              </div>
            </div>

            {/* Guest Name & Email OR Sign-In / Locked State */}
            {!currentUser ? (
              <div className="ostro-locked-sidebar-card">
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(99,102,241,0.25)',
                  border: '1px solid rgba(129,140,248,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto'
                }}>
                  <Lock size={18} color="#6366f1" />
                </div>
                <div>
                  <h5 style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    Customer Account Required to Reserve
                  </h5>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    Reservations are reserved exclusively for customer accounts. Please sign in or register to unlock the reservation engine.
                  </p>
                </div>

                <button
                  type="button"
                  className="ostro-reserve-auth-btn"
                  onClick={() => onOpenAuth && onOpenAuth('login', false)}
                >
                  <LogIn size={15} />
                  <span>Sign In / Register as Customer</span>
                </button>
              </div>
            ) : currentUser.role === 'admin' ? (
              <div style={{
                padding: '1.15rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1.5px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#dc2626', fontWeight: 700, fontSize: '0.85rem' }}>
                  <Lock size={16} />
                  <span>Administrator Account: Reservation Locked</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#b91c1c', lineHeight: 1.45 }}>
                  Public guest reservations can only be created by customer accounts. As an administrator, please use the <strong>Manual Reservation Desk</strong> in the Admin Dashboard to register bookings for guests.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.78rem',
                  color: '#059669',
                  fontWeight: 600
                }}>
                  <CheckCircle2 size={16} color="#059669" />
                  <span>Authenticated Customer: <strong>@{currentUser.username}</strong></span>
                </div>

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

                <div className="input-group">
                  <label className="input-label" htmlFor="sidebar_country">Country of Residence / Nationality</label>
                  <select 
                    id="sidebar_country" 
                    className="select-field" 
                    value={country} 
                    onChange={(e) => setCountry(e.target.value)}
                  >
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Price Calculations */}
            <div style={{ padding: '1rem', background: 'var(--bg-card-subtle)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.4rem', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>Rate per room/night:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>${adr}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>Nights:</span>
                <span style={{ color: 'var(--text-primary)' }}>{totalNights} nights</span>
              </div>
              {effectiveRooms > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span>Rooms:</span>
                  <span style={{ color: 'var(--ostro-terracotta)', fontWeight: 700 }}>× {effectiveRooms} rooms</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>Taxes & Service Fees:</span>
                <span style={{ color: '#059669', fontWeight: 600 }}>Included</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Total Price:</span>
                <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                  ${estimatedTotal}
                </span>
              </div>
            </div>

            {/* Final Action Button: Locked for Non-Customers or Admins */}
            {!currentUser ? (
              <button 
                type="button"
                className="ostro-reserve-auth-btn"
                onClick={() => onOpenAuth && onOpenAuth('login', false)}
              >
                <Lock size={16} />
                <span>🔒 Reservation Locked — Sign In as Customer to Book</span>
              </button>
            ) : currentUser.role === 'admin' ? (
              <button 
                type="button"
                className="submit-btn"
                disabled={true}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'var(--text-muted)',
                  cursor: 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <Lock size={16} />
                <span>🔒 Reservation Locked (Customer Accounts Only)</span>
              </button>
            ) : (
              <button 
                type="submit"
                className="ostro-reserve-submit-btn"
                disabled={isSubmitting || totalNights <= 0}
              >
                {isSubmitting ? (
                  <span>Confirming Booking & Saving to Database...</span>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    <span>Confirm & Reserve Room (${estimatedTotal})</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            )}

            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              🔒 256-bit SSL Encrypted • Direct PMS Synchronized
            </p>
          </div>

        </form>
      )}
      </section>

      {/* ========================================================
          SECTION 5: EDITORIAL ACCOLADES & RECOGNITION
          ======================================================== */}
      <section style={{ margin: '1rem 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span className="ostro-badge-gold" style={{ marginBottom: '0.5rem' }}>
            ✦ CRITICAL ACCLAIM & AWARDS
          </span>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 400, color: 'var(--text-primary)' }}>
            Celebrated by the International Architectural Press
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: '18px', border: '1px solid rgba(245,158,11,0.2)' }}>
            <Quote size={24} color="#f59e0b" style={{ marginBottom: '1rem', opacity: 0.8 }} />
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontStyle: 'italic', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              "A triumph of Italian minimalism. OSTRO turns the wild cliffs of Salento into an unforgettable sanctuary suspended between raw stone and open sky."
            </p>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f59e0b', letterSpacing: '0.05em' }}>
              ARCHITECTURAL DIGEST ITALIA
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Cover Feature • Mediterranean Escapes</div>
          </div>

          <div className="glass-panel" style={{ padding: '2rem', borderRadius: '18px', border: '1px solid rgba(245,158,11,0.2)' }}>
            <Quote size={24} color="#f59e0b" style={{ marginBottom: '1rem', opacity: 0.8 }} />
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontStyle: 'italic', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              "The most breathtaking ocean terrace in Southern Europe. The saltwater infinity pool merges seamlessly with the Adriatic at sunset."
            </p>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f59e0b', letterSpacing: '0.05em' }}>
              CONDÉ NAST TRAVELER
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Gold List • Best Cliffside Retreats</div>
          </div>

          <div className="glass-panel" style={{ padding: '2rem', borderRadius: '18px', border: '1px solid rgba(245,158,11,0.2)' }}>
            <Quote size={24} color="#f59e0b" style={{ marginBottom: '1rem', opacity: 0.8 }} />
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontStyle: 'italic', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              "Intimate brutalism executed with supreme warmth. Machine-learning rate precision meets timeless Pugliese hospitality."
            </p>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f59e0b', letterSpacing: '0.05em' }}>
              THE TELEGRAPH LUXURY
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>9.8 / 10 • Exceptional Rating</div>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 6: CURATED OSTRO FOOTER & CONCIERGE INFO
          ======================================================== */}
      <footer className="ostro-site-footer">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
          <div style={{ maxWidth: '380px' }}>
            <div className="ostro-footer-brand" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--text-primary)', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              OSTRO
            </div>
            <div style={{ fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Cliff Hotel & Sanctuaries • Salento, Puglia
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Strada Panoramica dei Faraglioni 14, 73030 Santa Cesarea Terme / Castro, Lecce, Italy.<br />
              Coordinates: 40.1417° N, 18.4908° E
            </p>
          </div>

          <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#f59e0b', fontWeight: 600, marginBottom: '0.75rem' }}>
                Sanctuary Concierge
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <li>Direct: +39 0836 945 800</li>
                <li>WhatsApp: +39 340 882 1990</li>
                <li>Email: concierge@ostro-salento.it</li>
                <li>Check-in: 15:00 • Check-out: 11:00</li>
              </ul>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#f59e0b', fontWeight: 600, marginBottom: '0.75rem' }}>
                Sanctuary Navigation
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <li><a href="#philosophy" style={{ color: 'inherit', textDecoration: 'none' }}>The Ethos & Location</a></li>
                <li><a href="#suites" style={{ color: 'inherit', textDecoration: 'none' }}>Suites & Sanctuaries</a></li>
                <li><a href="#dining" style={{ color: 'inherit', textDecoration: 'none' }}>Ristorante La Scogliera</a></li>
                <li><a href="#booking-engine" style={{ color: 'inherit', textDecoration: 'none' }}>Booking & Risk Intel Engine</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="ostro-footer-divider" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <div>
            © {new Date().getFullYear()} OSTRO Salento S.r.l. • Inspired by Behance OSTRO Architectural Concept.
          </div>
          <div>
            OSTRO Luxury Sanctuaries • All Rights Reserved.
          </div>
        </div>
      </footer>

      </div>

    </div>
  );
}
