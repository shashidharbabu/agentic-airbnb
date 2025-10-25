import { useEffect, useRef, useState } from "react";
import { useNavigate, Link, Outlet } from "react-router-dom";
import logo from "../assets/Airbnb_logo.png";

export default function Layout() {
  const navigate = useNavigate();

  const [active, setActive] = useState("homes");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const btnRef = useRef(null);

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
    }
    function onEsc(e) {
      if (e.key === "Escape") {
        setMenuOpen(false);
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

      <main>
        <Outlet />
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
            {/* Consumers can render their own destination cards on pages */}
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


