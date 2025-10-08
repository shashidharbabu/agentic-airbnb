import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Airbnb_logo.png";

const SUGGESTED = [
  { id: "nearby", title: "Nearby", sub: "Find what’s around you", icon: "📍" },
  { id: "lake-tahoe", title: "Lake Tahoe", sub: "Popular lake destination", icon: "🏞️" },
  { id: "san-diego", title: "San Diego, CA", sub: "For sights like Balboa Park", icon: "🏟️" },
  { id: "la", title: "Los Angeles, CA", sub: "For its bustling nightlife", icon: "🌆" },
  { id: "south-lake", title: "South Lake Tahoe, CA", sub: "For nature-lovers", icon: "🌲" },
  { id: "vegas", title: "Las Vegas, NV", sub: "For its top-notch dining", icon: "🎰" },
  { id: "sf", title: "San Francisco, CA", sub: "Golden Gate & more", icon: "🌉" },
];

const POPULAR_DESTINATIONS = [
  { city: "Tokyo",            type: "Villa rentals" },
  { city: "Honolulu",         type: "House rentals" },
  { city: "Mount Pocono",     type: "Apartment rentals" },
  { city: "Wilmington",       type: "House rentals" },
  { city: "Key West",         type: "Villa rentals" },
  { city: "Athens",           type: "Monthly rentals" },
  { city: "Kyoto",            type: "Vacation rentals" },
  { city: "Charleston",       type: "Apartment rentals" },
  { city: "Dallas",           type: "Apartment rentals" },
  { city: "Pittsburgh",       type: "Monthly rentals" },
  { city: "Kaua‘i County",    type: "Vacation rentals" },
  { city: "San Diego",        type: "Apartment rentals" },
];

export default function Home() {
  const navigate = useNavigate();

  const [active, setActive] = useState("homes");

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const btnRef = useRef(null);

  const [where, setWhere] = useState("");
  const [showWhere, setShowWhere] = useState(false);

  const [checkIn, setCheckIn] = useState("");
  const [showCheckIn, setShowCheckIn] = useState(false);

  const [checkOut, setCheckOut] = useState("");
  const [showCheckOut, setShowCheckOut] = useState(false);

  const [showGuests, setShowGuests] = useState(false);
  const [adults, setAdults] = useState(0);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [pets, setPets] = useState(0);
  const [showServiceInfo, setShowServiceInfo] = useState(false);

  const [activeSeg, setActiveSeg] = useState(null);
  const searchWrapRef = useRef(null);

  const [hostOpen, setHostOpen] = useState(false);
  const [hostChoice, setHostChoice] = useState(null); 

  useEffect(() => {
    function onDocClick(e) {
      if (
        menuRef.current &&
        btnRef.current &&
        !menuRef.current.contains(e.target) &&
        !btnRef.current.contains(e.target)
      ) {
        setMenuOpen(false);
      }
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setShowWhere(false);
        setShowCheckIn(false);
        setShowCheckOut(false);
        setShowGuests(false);
        setActiveSeg(null);
      }
    }
    function onEsc(e) {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setShowWhere(false);
        setShowCheckIn(false);
        setShowCheckOut(false);
        setShowGuests(false);
        setActiveSeg(null);
        setHostOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const anyPanelOpen = showWhere || showCheckIn || showCheckOut || showGuests;
  const totalGuests = adults + children + infants + pets;
  const hasSelection =
    (where && where.trim().length > 0) ||
    !!checkIn ||
    !!checkOut ||
    totalGuests > 0;

  const openHostFlow = (e) => {
    e?.preventDefault?.();
    setHostOpen(true);
  };

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <a href="/" className="logo" aria-label="Airbnb home">
            <img src={logo} alt="Airbnb" />
          </a>

          <nav className="nav-center" aria-label="Primary">
            <button
              type="button"
              className={`tab ${active === "homes" ? "active" : ""}`}
              onClick={() => setActive("homes")}
            >
              <span className="tab-icon" aria-hidden>🏠</span>
              <span>Homes</span>
            </button>

            <button
              type="button"
              className={`tab ${active === "trips" ? "active" : ""}`}
              onClick={() => setActive("trips")}
            >
              <span className="tab-icon" aria-hidden>🧳</span>
              <span>Trips</span>
            </button>

            <button
              type="button"
              className={`tab ${active === "messages" ? "active" : ""}`}
              onClick={() => setActive("messages")}
            >
              <span className="tab-icon" aria-hidden>💬</span>
              <span>Messages</span>
            </button>
          </nav>

          <div className="header-right">
            <button className="host-link" type="button" onClick={openHostFlow}>
              Become a host
            </button>

            <button
              ref={btnRef}
              type="button"
              className="menu-btn"
              aria-label="Open menu"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className="hamburger-lines" aria-hidden>
                <span></span><span></span><span></span>
              </span>
            </button>

            <div
              ref={menuRef}
              className={`menu ${menuOpen ? "open" : ""}`}
              role="menu"
            >
              <button className="menu-item" role="menuitem" onClick={openHostFlow}>
                Become a host
              </button>
              <p className="menu-subtext">
                It&apos;s easy to start hosting and earn extra income.
              </p>
              <a href="#" className="menu-item" role="menuitem">Refer a host</a>
              <button
                className="menu-item"
                role="menuitem"
                type="button"
                onClick={() => navigate("/login")}
              >
                Log in or Sign up
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="search-wrap" ref={searchWrapRef}>
        <div
          className={`search-bar ${anyPanelOpen ? "open" : ""}`}
          role="group"
          aria-label="Search"
        >
          <div
            className={`search-section where ${activeSeg === "where" ? "is-active" : ""}`}
            onClick={() => {
              setActiveSeg("where");
              setShowWhere(true);
              setShowCheckIn(false);
              setShowCheckOut(false);
              setShowGuests(false);
            }}
          >
            <div className="label">Where</div>
            <input
              className="where-input"
              type="text"
              placeholder="Search destinations"
              value={where}
              onChange={(e) => setWhere(e.target.value)}
              onFocus={() => {
                setActiveSeg("where");
                setShowWhere(true);
              }}
            />
            {showWhere && (
              <div className="popover suggestions" role="listbox" aria-label="Suggested destinations">
                <div className="suggest-title">Suggested destinations</div>
                <div className="suggest-list">
                  {SUGGESTED
                    .filter((s) =>
                      s.title.toLowerCase().includes(where.toLowerCase())
                    )
                    .map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className="suggest-item"
                        onClick={() => {
                          setWhere(s.title);
                          setShowWhere(false);
                          setActiveSeg(null);
                        }}
                      >
                        <span className="suggest-icon" aria-hidden>{s.icon}</span>
                        <span className="suggest-text">
                          <span className="suggest-name">{s.title}</span>
                          <span className="suggest-sub">{s.sub}</span>
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div className="divider" aria-hidden></div>

          <div
            className={`search-section checkin ${activeSeg === "checkin" ? "is-active" : ""}`}
            onClick={() => {
              setActiveSeg("checkin");
              setShowCheckIn(true);
              setShowWhere(false);
              setShowCheckOut(false);
              setShowGuests(false);
            }}
          >
            <div className="label">Check in</div>
            <button className="placeholder-btn" type="button">
              {checkIn || "Add dates"}
            </button>
            {showCheckIn && (
              <CalendarPopover
                onPick={({ text }) => { setCheckIn(text); }}
                onClose={() => { setShowCheckIn(false); setActiveSeg(null); }}
              />
            )}
          </div>

          <div className="divider" aria-hidden></div>

          <div
            className={`search-section checkout ${activeSeg === "checkout" ? "is-active" : ""}`}
            onClick={() => {
              setActiveSeg("checkout");
              setShowCheckOut(true);
              setShowWhere(false);
              setShowCheckIn(false);
              setShowGuests(false);
            }}
          >
            <div className="label">Check out</div>
            <button className="placeholder-btn" type="button">
              {checkOut || "Add dates"}
            </button>
            {showCheckOut && (
              <CalendarPopover
                onPick={({ text }) => { setCheckOut(text); }}
                onClose={() => { setShowCheckOut(false); setActiveSeg(null); }}
              />
            )}
          </div>

          <div className="divider" aria-hidden></div>

          <div
            className={`search-section who ${activeSeg === "who" ? "is-active" : ""}`}
            onClick={() => {
              setActiveSeg("who");
              setShowGuests(true);
              setShowWhere(false);
              setShowCheckIn(false);
              setShowCheckOut(false);
            }}
          >
            <div className="label">Who</div>
            <button className="placeholder-btn" type="button">
              {totalGuests
                ? `${totalGuests} guest${totalGuests > 1 ? "s" : ""}`
                : "Add guests"}
            </button>

            {showGuests && (
              <div className="popover guests">
                <GuestRow title="Adults"   sub="Ages 13 or above" value={adults}   setValue={setAdults} />
                <GuestRow title="Children" sub="Ages 2 - 12"     value={children} setValue={setChildren} />
                <GuestRow title="Infants"  sub="Under 2"         value={infants}  setValue={setInfants} />
                <GuestRow
                  title="Pets"
                  sub={
                    <span>
                      <a
                        className="service-link"
                        href="#"
                        onClick={(e) => { e.preventDefault(); setShowServiceInfo((v) => !v); }}
                      >
                        Bringing a service animal?
                      </a>
                    </span>
                  }
                  value={pets}
                  setValue={setPets}
                />

                {showServiceInfo && (
                  <div className="service-animal">
                    <img
                      src="https://www.shutterstock.com/image-vector/happy-couple-adopting-stray-dog-260nw-2483607635.jpg"
                      alt="Service animal"
                    />
                    <p>
                      <strong>Service animals</strong><br />
                      Service animals aren’t pets, so there’s no need to add them here.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            className={`search-btn ${(hasSelection || anyPanelOpen) ? "expanded" : ""}`}
            type="button"
            aria-label="Search"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path
                fill="currentColor"
                d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 10-1.06 1.06l.27.28v.79l4.25 4.25a1 1 0 101.41-1.41L15.5 14zm-6 0A5 5 0 1114.5 9 5 5 0 019.5 14z"
              />
            </svg>
            {(hasSelection || anyPanelOpen) && <span className="search-text">Search</span>}
          </button>
        </div>
      </div>

      <main>
        <p>Popular Homes</p>
      </main>

      <footer className="site-footer" aria-labelledby="footer-title">
        <div className="footer-inner">
          <h2 id="footer-title" className="footer-title">
            Inspiration for future getaways
          </h2>

          <div className="footer-tabs" role="tablist" aria-label="Footer categories">
            <button className="footer-tab active" role="tab" aria-selected="true" tabIndex={0} type="button">
              Popular
            </button>
          </div>

          <div className="dest-grid">
            {POPULAR_DESTINATIONS.map((d) => (
              <a key={d.city} href="#" className="dest" aria-label={`${d.city} – ${d.type}`}>
                <div className="dest-city">{d.city}</div>
                <div className="dest-type">{d.type}</div>
              </a>
            ))}
          </div>
        </div>
      </footer>

      {hostOpen && (
        <HostModal
          open={hostOpen}
          selected={hostChoice}
          onSelect={setHostChoice}
          onClose={() => setHostOpen(false)}
          onNext={() => {
            if (!hostChoice) return;
            setHostOpen(false);
            navigate(`/login?hostType=${encodeURIComponent(hostChoice)}`);
          }}
        />
      )}
    </>
  );
}

function CalendarPopover({ onPick, onClose }) {
  const [offset, setOffset] = useState(0);

  const base = new Date();
  base.setDate(1);

  const addMonths = (d, n) => {
    const nd = new Date(d);
    nd.setMonth(nd.getMonth() + n);
    return nd;
  };

  const monthLabel = (d) =>
    d.toLocaleString(undefined, { month: "long", year: "numeric" });

  const buildMonth = (d) => {
    const y = d.getFullYear();
    const m = d.getMonth();
    const first = new Date(y, m, 1);
    const start = (first.getDay() + 6) % 7; 
    const days = new Date(y, m + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < start; i++) cells.push(null);
    for (let day = 1; day <= days; day++) cells.push(new Date(y, m, day));
    while (cells.length % 7 !== 0) cells.push(null);
    while (cells.length < 42) cells.push(null);
    return { label: monthLabel(d), cells };
  };

  const mA = buildMonth(addMonths(base, offset));
  const mB = buildMonth(addMonths(base, offset + 1));

  const fmt = (date) =>
    date.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="popover date-popover" role="dialog" aria-label="Select dates">
      <div className="date-tabs" role="tablist">
        <button className="tab-chip active" type="button">Dates</button>
        <button className="tab-chip" type="button">Months</button>
        <button className="tab-chip" type="button">Flexible</button>
      </div>

      <div className="cal-panes">
        <button className="cal-nav left" type="button" aria-label="Previous months" onClick={() => setOffset(n => n - 1)}>‹</button>

        <MonthView data={mA} onPick={(d) => { onPick({ raw: d, text: fmt(d) }); onClose?.(); }} />
        <MonthView data={mB} onPick={(d) => { onPick({ raw: d, text: fmt(d) }); onClose?.(); }} />

        <button className="cal-nav right" type="button" aria-label="Next months" onClick={() => setOffset(n => n + 1)}>›</button>
      </div>

      <div className="flex-chips">
        <button type="button" className="chip active">Exact dates</button>
        <button type="button" className="chip">+ 1 day</button>
        <button type="button" className="chip">+ 2 days</button>
        <button type="button" className="chip">+ 3 days</button>
        <button type="button" className="chip">+ 7 days</button>
        <button type="button" className="chip">+ 14 days</button>
      </div>
    </div>
  );
}

function MonthView({ data, onPick }) {
  return (
    <div className="month">
      <div className="month-head">{data.label}</div>
      <div className="weekdays">
        <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
      </div>
      <div className="grid">
        {data.cells.map((d, i) =>
          d ? (
            <button key={i} type="button" className="day" onClick={() => onPick(d)}>
              {d.getDate()}
            </button>
          ) : <span key={i} className="day blank" />
        )}
      </div>
    </div>
  );
}

function GuestRow({ title, sub, value, setValue }) {
  return (
    <div className="guest-row">
      <div className="guest-info">
        <div className="guest-title">{title}</div>
        <div className="guest-sub">{sub}</div>
      </div>
      <div className="counter">
        <button
          className="counter-btn"
          onClick={(e) => { e.stopPropagation(); setValue(Math.max(0, value - 1)); }}
          type="button"
        >
          −
        </button>
        <div className="counter-value">{value}</div>
        <button
          className="counter-btn"
          onClick={(e) => { e.stopPropagation(); setValue(value + 1); }}
          type="button"
        >
          +
        </button>
      </div>
    </div>
  );
}

function HostModal({ open, selected, onSelect, onClose, onNext }) {
  if (!open) return null;
  const cards = [
    { id: "home", label: "Home", emoji: "🏠" },
    { id: "apartment", label: "Apartment", emoji: "🏢" },
    { id: "villa", label: "Villa", emoji: "🏡" },
  ];
  return (
    <div className="host-modal" role="dialog" aria-modal="true" aria-labelledby="host-title">
      <div className="host-overlay" onClick={onClose} />
      <div className="host-dialog">
        <button className="host-close" type="button" aria-label="Close" onClick={onClose}>✕</button>
        <h3 id="host-title" className="host-title">What would you like to host?</h3>

        <div className="host-grid">
          {cards.map(c => {
            const isSel = selected === c.id;
            return (
              <button
                key={c.id}
                type="button"
                className={`host-card ${isSel ? "selected" : ""}`}
                onClick={() => onSelect(c.id)}
                aria-pressed={isSel}
              >
                <div className="host-emoji" aria-hidden>{c.emoji}</div>
                <div className="host-label">{c.label}</div>
              </button>
            );
          })}
        </div>

        <div className="host-actions">
          <button
            type="button"
            className="host-next"
            disabled={!selected}
            onClick={onNext}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
