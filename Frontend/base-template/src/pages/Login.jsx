import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Airbnb_logo.png";

export default function Login() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const btnRef = useRef(null);

  const [hostOpen, setHostOpen] = useState(false);
  const [hostChoice, setHostChoice] = useState(null); 

  const [step, setStep] = useState("auth"); 
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");

  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [dob, setDob] = useState("");

  const [commitOpen, setCommitOpen] = useState(false);

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
        setCommitOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const emailOk = /^\S+@\S+\.\S+$/.test(email);
  const pwdOk = pwd.length >= 6;
  const canContinue = emailOk && pwdOk;

  const canAgree =
    first.trim() && last.trim() && dob && /^\S+@\S+\.\S+$/.test(email);

  const handleContinue = () => {
    if (canContinue) setStep("finish");
  };

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <a href="/" className="logo" aria-label="Airbnb home">
            <img src={logo} alt="Airbnb" />
          </a>

          <div className="header-right">
            <button className="host-link" type="button" onClick={() => setHostOpen(true)}>
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
              <button
                className="menu-item"
                role="menuitem"
                type="button"
                onClick={() => { setMenuOpen(false); setHostOpen(true); }}
              >
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

      {step === "finish" ? (
        <div className="login-page">
          <div className="finish-card">
            <div className="finish-header">
              <button className="icon-btn" aria-label="Back" onClick={() => setStep("auth")}>←</button>
              <h2 className="finish-title">Finish signing up</h2>
              <span style={{ width: 40 }} />
            </div>

            <section className="finish-section">
              <div className="finish-label">Legal name</div>
              <input className="login-input" placeholder="First name on ID" value={first} onChange={(e) => setFirst(e.target.value)} />
              <input className="login-input" style={{ marginTop: 10 }} placeholder="Last name on ID" value={last} onChange={(e) => setLast(e.target.value)} />
            </section>

            <section className="finish-section">
              <div className="finish-label">Date of birth</div>
              <input type="date" className="login-input" value={dob} onChange={(e) => setDob(e.target.value)} />
              <small className="finish-muted">
                To sign up, you need to be at least 18. Your birthday won’t be shared with other people who use Airbnb.
              </small>
            </section>

            <section className="finish-section">
              <div className="finish-label">Contact info</div>
              <input
                type="email"
                className="login-input"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <small className="finish-muted">We’ll email you trip confirmations and receipts.</small>
            </section>

            <button
              className="btn-primary-pink"
              disabled={!canAgree}
              onClick={() => setCommitOpen(true)}
              style={{
                width: "100%",
                minHeight: 48,
                borderRadius: 9999,
                background: "#FF385C",
                color: "#fff",
                fontWeight: 700,
                opacity: canAgree ? 1 : 0.5,
                cursor: canAgree ? "pointer" : "not-allowed",
              }}
            >
              Agree and continue
            </button>
          </div>
        </div>
      ) : (
        <div className="login-page">
          <div className="login-card">
            <div className="login-card-header">
              <h3 className="login-card-title">Log in or sign up</h3>
            </div>

            <div style={{ padding: 20 }}>
              <h2 className="login-welcome">Welcome to Airbnb</h2>

              <label className="login-label">Email</label>
              <input
                type="email"
                className="login-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <label className="login-label">Password</label>
              <input
                type="password"
                className="login-input"
                placeholder="Enter your password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
              />

              <button
                className="login-btn-continue"
                onClick={handleContinue}
                style={{ background: "#FF385C", color: "#fff" }}
              >
                Continue
              </button>

              <div className="login-or">
                <span className="login-or-line"></span>
                <span style={{ margin: "0 12px", color: "#717171" }}>or</span>
                <span className="login-or-line"></span>
              </div>

              <button className="login-google" onClick={() => setStep("finish")}>
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt=""
                  width="18"
                  height="18"
                  loading="lazy"
                />
                Continue with Google
              </button>
            </div>
          </div>
        </div>
      )}

      {hostOpen && (
        <HostModal
          open={hostOpen}
          selected={hostChoice}
          onSelect={setHostChoice}
          onClose={() => setHostOpen(false)}
          onNext={() => {
            if (!hostChoice) return;
            setHostOpen(false);
            setStep("auth"); 
            navigate(`/login?hostType=${encodeURIComponent(hostChoice)}`, {
              replace: true,
            });
          }}
        />
      )}

      {commitOpen && (
        <CommitmentModal
          open={commitOpen}
          onClose={() => setCommitOpen(false)}
          onAgree={() => setCommitOpen(false)}
          onDecline={() => setCommitOpen(false)}
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
          {cards.map((c) => {
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

function CommitmentModal({ open, onClose, onAgree, onDecline }) {
  if (!open) return null;
  return (
    <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="commit-title">
      <div className="auth-overlay" onClick={onClose} />
      <div
        className="auth-dialog"
        style={{
          width: "min(640px, 92%)",
          borderRadius: 20,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: 24 }}>
          <img
            src="/Airbn_symbol.png"
            alt=""
            width="28"
            height="28"
            style={{ display: "block", marginBottom: 12 }}
          />

          <div
            id="commit-title"
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#6b7280",
              textTransform: "none",
              letterSpacing: 0,
              marginBottom: 8,
            }}
          >
            Our community commitment
          </div>

          <h2 style={{ margin: "0 0 8px", fontSize: 26, lineHeight: 1.25, fontWeight: 800 }}>
            Airbnb is a community where anyone can belong
          </h2>

          <p style={{ color: "#374151", marginTop: 12 }}>
            To ensure this, we’re asking you to commit to the following:
          </p>

          <p style={{ color: "#374151", marginTop: 8 }}>
            I agree to treat everyone in the Airbnb community—regardless of their
            race, religion, national origin, ethnicity, skin color, disability, sex,
            gender identity, sexual orientation or age—with respect, and without
            judgment or bias.
          </p>


          <div style={{ marginTop: 18 }}>
            <button
              type="button"
              onClick={onAgree}
              style={{
                width: "100%",
                minHeight: 48,
                borderRadius: 12,
                background: "#FF385C",
                color: "#fff",
                fontWeight: 700,
              }}
            >
              Agree and continue
            </button>

            <button
              type="button"
              onClick={onDecline}
              style={{
                width: "100%",
                minHeight: 48,
                borderRadius: 12,
                background: "#fff",
                color: "#111",
                fontWeight: 600,
                border: "1px solid #d1d5db",
                marginTop: 10,
              }}
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
