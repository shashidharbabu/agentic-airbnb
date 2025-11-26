import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '../firebase'
import { useAppDispatch } from '../store/hooks'
import { login, signup, checkAuth } from '../store/slices/authSlice'

export default function HostLogin() {
  const nav = useNavigate()
  const dispatch = useAppDispatch()
  const [view, setView] = useState('main') // 'main', 'email', 'signup', 'phone', 'verify'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [signupPhone, setSignupPhone] = useState('')
  const [signupLocation, setSignupLocation] = useState('')
  const [countryCode, setCountryCode] = useState('+1')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [confirmationResult, setConfirmationResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleEmailLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await dispatch(login({ email, password }))
      if (login.fulfilled.match(result)) {
        nav('/')
      } else {
        setError(result.payload || 'Invalid email or password')
      }
    } catch (err) {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignup(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const normalizedEmail = email.trim()
      const payload = {
        email: normalizedEmail,
        password,
        name: (name || 'Host').trim(),
        phone: signupPhone.trim(),
        location: signupLocation.trim()
      }

      const signupResult = await dispatch(signup(payload))
      if (signup.fulfilled.match(signupResult)) {
        // Auto-login after signup
        const loginResult = await dispatch(login({ email: normalizedEmail, password }))
        if (login.fulfilled.match(loginResult)) {
          nav('/')
        }
      } else {
        const errorCode = signupResult.payload
        if (errorCode === 'email_in_use') {
          setError('That email is already registered. Try logging in instead.')
        } else if (errorCode === 'phone_in_use') {
          setError('That phone number is already connected to another account.')
        } else {
          setError(errorCode || 'Error creating account')
        }
      }
    } catch (err) {
      setError('Error creating account')
    } finally {
      setLoading(false)
    }
  }

  function handleGoogleLogin() {
    // Redirect to backend Google OAuth endpoint
    const backendUrl = import.meta.env.VITE_HOST_API || 'http://localhost:4000'
    window.location.href = `${backendUrl}/auth/google`
  }

  // Helper: initialize invisible reCAPTCHA
  const initRecaptcha = () => {
    const container = document.getElementById('recaptcha-container')
    // If already rendered, just reset instead of creating again
    if (container && window.recaptchaVerifier && typeof window.grecaptcha !== 'undefined' && window.recaptchaWidgetId !== undefined) {
      try { window.grecaptcha.reset(window.recaptchaWidgetId) } catch {}
      return window.recaptchaVerifier
    }
    if (container && !window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA solved')
          },
          'expired-callback': () => {
            console.log('reCAPTCHA expired')
          }
        })
        // Explicitly render to avoid timeouts in some browsers
        window.recaptchaVerifier.render().then((widgetId) => {
          window.recaptchaWidgetId = widgetId
          console.log('reCAPTCHA initialized')
        })
      } catch (error) {
        console.error('reCAPTCHA init error:', error)
        setError('Failed to initialize reCAPTCHA. Please refresh the page.')
      }
    }
    return window.recaptchaVerifier
  }

  // Initialize reCAPTCHA when main view is shown
  useEffect(() => {
    if (view === 'main') {
      // Clean up existing verifier
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear()
        } catch (e) {
          console.log('Could not clear recaptcha:', e)
        }
        window.recaptchaVerifier = null
      }

      // Wait for DOM to be ready
      const timer = setTimeout(() => {
        initRecaptcha()
      }, 100)

      return () => {
        clearTimeout(timer)
      }
    }
  }, [view])

  async function handlePhoneSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const digits = (phoneNumber || '').replace(/[^0-9]/g, '')
      const fullPhoneNumber = `${countryCode}${digits}`
      // Ensure a verifier exists (user might have retried after an error)
      const appVerifier = initRecaptcha()
      // Manually obtain a reCAPTCHA token to avoid invalid-app-credential
      try { await appVerifier.verify() } catch (e) { /* invisible will re-verify on submit */ }
      
      const confirmation = await signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier)
      setConfirmationResult(confirmation)
      setView('verify')
    } catch (err) {
      console.error('Phone auth error:', err)
      setError(err.message || 'Failed to send verification code')
      // Reset reCAPTCHA on error
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear()
        window.recaptchaVerifier = null
      }
      // Reinitialize so user can retry immediately
      setTimeout(() => initRecaptcha(), 50)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyCode(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Verify the code with Firebase
      const result = await confirmationResult.confirm(verificationCode)
      const idToken = await result.user.getIdToken()

      // Send token to backend, then refresh auth so UI sees the logged-in session
      await api.post('/auth/phone/verify', { idToken, name: name || 'Host' })
      await refreshAuth()
      nav('/')
    } catch (err) {
      console.error('Code verification error:', err)
      setError(err?.response?.data?.error || 'Invalid verification code')
    } finally {
      setLoading(false)
    }
  }

  function handlePhoneClick() {
    setView('phone')
    setError('')
  }

  // Header Component
  const Header = () => (
    <header style={{ 
      background: '#fff', 
      borderBottom: '1px solid #ebebeb',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ 
        maxWidth: 1280, 
        margin: '0 auto', 
        padding: '16px 24px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between' 
      }}>
        <Link to="/" aria-label="Airbnb home" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <img src="/Airbnb_logo.png" alt="Airbnb" width="102" height="32" />
        </Link>
      </div>
    </header>
  )

  // Footer Component
  const Footer = () => (
    <footer style={{ 
      marginTop: 'auto', 
      borderTop: '1px solid #dddddd', 
      background: '#f7f7f7',
      padding: '48px 0 24px'
    }}>
      <div style={{ 
        maxWidth: 1280, 
        margin: '0 auto', 
        padding: '0 80px'
      }}>
        {/* Footer Links Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 48,
          marginBottom: 48
        }}>
          {/* Support Column */}
          <div>
            <h3 style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#222',
              marginBottom: 16,
              marginTop: 0
            }}>
              Support
            </h3>
            <ul style={{ 
              listStyle: 'none', 
              padding: 0, 
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <li><a href="#" style={{ color: '#222', textDecoration: 'none', fontSize: 14 }}>Help Center</a></li>
              <li><a href="#" style={{ color: '#222', textDecoration: 'none', fontSize: 14 }}>Get help with a safety issue</a></li>
              <li><a href="#" style={{ color: '#222', textDecoration: 'none', fontSize: 14 }}>AirCover</a></li>
              <li><a href="#" style={{ color: '#222', textDecoration: 'none', fontSize: 14 }}>Anti-discrimination</a></li>
              <li><a href="#" style={{ color: '#222', textDecoration: 'none', fontSize: 14 }}>Disability support</a></li>
              <li><a href="#" style={{ color: '#222', textDecoration: 'none', fontSize: 14 }}>Cancellation options</a></li>
              <li><a href="#" style={{ color: '#222', textDecoration: 'none', fontSize: 14 }}>Report neighborhood concern</a></li>
            </ul>
          </div>

          {/* Hosting Column */}
          <div>
            <h3 style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#222',
              marginBottom: 16,
              marginTop: 0
            }}>
              Hosting
            </h3>
            <ul style={{ 
              listStyle: 'none', 
              padding: 0, 
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <li><a href="#" style={{ color: '#222', textDecoration: 'none', fontSize: 14 }}>Airbnb your home</a></li>
              <li><a href="#" style={{ color: '#222', textDecoration: 'none', fontSize: 14 }}>Airbnb your experience</a></li>
              <li><a href="#" style={{ color: '#222', textDecoration: 'none', fontSize: 14 }}>Airbnb your service</a></li>
              <li><a href="#" style={{ color: '#222', textDecoration: 'none', fontSize: 14 }}>AirCover for Hosts</a></li>
              <li><a href="#" style={{ color: '#222', textDecoration: 'none', fontSize: 14 }}>Hosting resources</a></li>
              <li><a href="#" style={{ color: '#222', textDecoration: 'none', fontSize: 14 }}>Community forum</a></li>
              <li><a href="#" style={{ color: '#222', textDecoration: 'none', fontSize: 14 }}>Hosting responsibly</a></li>
              <li><a href="#" style={{ color: '#222', textDecoration: 'none', fontSize: 14 }}>Airbnb-friendly apartments</a></li>
              <li><a href="#" style={{ color: '#222', textDecoration: 'none', fontSize: 14 }}>Join a free Hosting class</a></li>
              <li><a href="#" style={{ color: '#222', textDecoration: 'none', fontSize: 14 }}>Find a co-host</a></li>
            </ul>
          </div>

          {/* Airbnb Column */}
          <div>
            <h3 style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#222',
              marginBottom: 16,
              marginTop: 0
            }}>
              Airbnb
            </h3>
            <ul style={{ 
              listStyle: 'none', 
              padding: 0, 
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <li><a href="#" style={{ color: '#222', textDecoration: 'none', fontSize: 14 }}>2025 Summer Release</a></li>
              <li><a href="#" style={{ color: '#222', textDecoration: 'none', fontSize: 14 }}>Newsroom</a></li>
              <li><a href="#" style={{ color: '#222', textDecoration: 'none', fontSize: 14 }}>Careers</a></li>
              <li><a href="#" style={{ color: '#222', textDecoration: 'none', fontSize: 14 }}>Investors</a></li>
              <li><a href="#" style={{ color: '#222', textDecoration: 'none', fontSize: 14 }}>Gift cards</a></li>
              <li><a href="#" style={{ color: '#222', textDecoration: 'none', fontSize: 14 }}>Airbnb.org emergency stays</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 24,
          borderTop: '1px solid #dddddd',
          flexWrap: 'wrap',
          gap: 16
        }}>
          {/* Left Side - Copyright and Links */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 14,
            color: '#222',
            flexWrap: 'wrap'
          }}>
            <span>© {new Date().getFullYear()} Airbnb, Inc.</span>
            <span style={{ color: '#dddddd' }}>·</span>
            <a href="#" style={{ color: '#222', textDecoration: 'none' }}>Terms</a>
            <span style={{ color: '#dddddd' }}>·</span>
            <a href="#" style={{ color: '#222', textDecoration: 'none' }}>Sitemap</a>
            <span style={{ color: '#dddddd' }}>·</span>
            <a href="#" style={{ color: '#222', textDecoration: 'none' }}>Privacy</a>
            <span style={{ color: '#dddddd' }}>·</span>
            <a href="#" style={{ color: '#222', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              Your Privacy Choices
              <svg width="26" height="12" fill="none">
                <rect width="26" height="12" rx="6" fill="#0066FF"/>
                <path d="M8 2.5h10m-10 7h10" stroke="#FFF" strokeWidth="1"/>
              </svg>
            </a>
          </div>

          {/* Right Side - Language, Currency, Social */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16
          }}>
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'transparent',
              border: 'none',
              fontSize: 14,
              fontWeight: 600,
              color: '#222',
              cursor: 'pointer',
              padding: 0
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0a8 8 0 110 16A8 8 0 018 0zm0 1a7 7 0 100 14A7 7 0 008 1zm3.36 4.3c.1.15.17.32.17.5 0 .28-.11.53-.29.71l-.71.71v.58c0 .28-.11.53-.29.71l-.71.71v1.08c0 .28-.11.53-.29.71a1 1 0 01-1.42 0l-.71-.71H5.5a1 1 0 01-1-1V8.2l2.5-2.5c.09-.09.13-.2.13-.33V4.3h.58c.28 0 .53-.11.71-.29l.71-.71c.18-.18.43-.29.71-.29s.53.11.71.29l.71.71c.09.09.2.13.33.13h.58z"/>
              </svg>
              English (US)
            </button>

            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'transparent',
              border: 'none',
              fontSize: 14,
              fontWeight: 600,
              color: '#222',
              cursor: 'pointer',
              padding: 0
            }}>
              $ USD
            </button>

            {/* Social Icons */}
            <div style={{ display: 'flex', gap: 16 }}>
              <a href="#" style={{ color: '#222' }} aria-label="Facebook">
                <svg width="18" height="18" viewBox="0 0 32 32" fill="currentColor">
                  <path d="M32 16c0-8.837-7.163-16-16-16S0 7.163 0 16c0 7.988 5.851 14.605 13.5 15.806v-11.18H9.437V16h4.063v-3.525c0-4.01 2.389-6.225 6.043-6.225 1.75 0 3.582.313 3.582.313v3.937h-2.018c-1.988 0-2.607 1.234-2.607 2.5V16h4.438l-.71 4.625h-3.728v11.18C26.149 30.605 32 23.988 32 16z"/>
                </svg>
              </a>
              <a href="#" style={{ color: '#222' }} aria-label="Twitter">
                <svg width="18" height="18" viewBox="0 0 32 32" fill="currentColor">
                  <path d="M31.117 6.284a13.08 13.08 0 01-3.71 1.016 6.487 6.487 0 002.845-3.577 13.002 13.002 0 01-4.122 1.574A6.487 6.487 0 0021.513 3c-3.573 0-6.488 2.897-6.488 6.488 0 .508.058 1.003.169 1.477A18.416 18.416 0 013.165 4.231a6.462 6.462 0 00-.878 3.262c0 2.25 1.145 4.235 2.886 5.396a6.465 6.465 0 01-2.94-.812v.082c0 3.144 2.237 5.766 5.204 6.363a6.527 6.527 0 01-2.928.111c.826 2.578 3.218 4.456 6.052 4.509A13.022 13.022 0 011.45 26.39 18.367 18.367 0 0011.39 29c11.867 0 18.36-9.835 18.36-18.361 0-.28-.006-.558-.019-.835a13.12 13.12 0 003.215-3.342z"/>
                </svg>
              </a>
              <a href="#" style={{ color: '#222' }} aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 32 32" fill="currentColor">
                  <path d="M16 2.881c4.275 0 4.781.019 6.462.094 1.563.069 2.406.331 2.969.55a4.952 4.952 0 011.837 1.194 5.015 5.015 0 011.2 1.838c.219.563.481 1.412.55 2.969.075 1.688.094 2.194.094 6.463s-.019 4.781-.094 6.463c-.069 1.563-.331 2.406-.55 2.969a4.94 4.94 0 01-1.194 1.837 5.02 5.02 0 01-1.838 1.2c-.563.219-1.413.481-2.969.55-1.688.075-2.194.094-6.463.094s-4.781-.019-6.463-.094c-1.563-.069-2.406-.331-2.969-.55a4.952 4.952 0 01-1.838-1.194 5.02 5.02 0 01-1.2-1.837c-.219-.563-.481-1.413-.55-2.969-.075-1.688-.094-2.194-.094-6.463s.019-4.781.094-6.463c.069-1.563.331-2.406.55-2.969a4.964 4.964 0 011.194-1.838 5.015 5.015 0 011.838-1.2c.563-.219 1.412-.481 2.969-.55 1.681-.075 2.188-.094 6.463-.094zM16 0c-4.344 0-4.887.019-6.594.094-1.7.075-2.869.35-3.881.744a7.847 7.847 0 00-2.838 1.85A7.867 7.867 0 00.838 5.525C.444 6.537.169 7.7.094 9.4.019 11.113 0 11.656 0 16s.019 4.887.094 6.594c.075 1.7.35 2.869.744 3.881a7.88 7.88 0 001.85 2.838 7.867 7.867 0 002.838 1.85c1.012.394 2.181.669 3.881.744 1.706.075 2.25.094 6.594.094s4.887-.019 6.594-.094c1.7-.075 2.869-.35 3.881-.744a7.847 7.847 0 002.838-1.85 7.867 7.867 0 001.85-2.838c.394-1.012.669-2.181.744-3.881.075-1.706.094-2.25.094-6.594s-.019-4.887-.094-6.594c-.075-1.7-.35-2.869-.744-3.881a7.88 7.88 0 00-1.85-2.838A7.863 7.863 0 0026.475.838C25.463.444 24.294.169 22.594.094 20.887.019 20.344 0 16 0z"/>
                  <path d="M16 7.781c-4.537 0-8.219 3.681-8.219 8.219s3.681 8.219 8.219 8.219 8.219-3.681 8.219-8.219A8.221 8.221 0 0016 7.781zm0 13.55a5.331 5.331 0 110-10.663 5.331 5.331 0 010 10.663zM26.462 7.456a1.919 1.919 0 11-3.838 0 1.919 1.919 0 013.838 0z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )

  // Main login screen with options
  if (view === 'main') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'
      }}>
        <Header />
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff',
          padding: '48px 24px'
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 8px 28px rgba(0,0,0,0.12)',
          maxWidth: 568,
          width: '100%',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '24px 24px 16px',
            borderBottom: '1px solid #ebebeb',
            textAlign: 'center',
            position: 'relative'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 600,
              color: '#222'
            }}>
              Log in or sign up
            </h2>
          </div>

          {/* Content */}
          <div style={{ padding: 24 }}>
            <h3 style={{
              fontSize: 22,
              fontWeight: 600,
              margin: '0 0 24px 0',
              color: '#222'
            }}>
              Welcome to Airbnb
            </h3>

            {/* Country/Phone Input */}
            <div style={{ marginBottom: 16 }}>
              <div style={{
                border: '1px solid #b0b0b0',
                borderRadius: 8,
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid #ebebeb',
                  fontSize: 12,
                  color: '#222'
                }}>
                  Country code
                </div>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 12px',
                    border: 'none',
                    borderBottom: '1px solid #ebebeb',
                    fontSize: 16,
                    color: '#222',
                    outline: 'none',
                    background: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  <option value="+1">United States (+1)</option>
                  <option value="+44">United Kingdom (+44)</option>
                  <option value="+91">India (+91)</option>
                  <option value="+86">China (+86)</option>
                  <option value="+81">Japan (+81)</option>
                  <option value="+33">France (+33)</option>
                  <option value="+49">Germany (+49)</option>
                </select>
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 12px',
                    border: 'none',
                    fontSize: 16,
                    color: '#222',
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{
                fontSize: 12,
                color: '#717171',
                marginTop: 8,
                lineHeight: 1.4
              }}>
                We'll call or text you to confirm your number. Standard message and data rates apply.{' '}
                <a href="#" style={{ color: '#222', textDecoration: 'underline' }}>Privacy Policy</a>
              </div>
            </div>

            {/* Continue Button */}
            <button
              onClick={handlePhoneSubmit}
              disabled={loading || !phoneNumber}
              style={{
                width: '100%',
                padding: '14px',
                background: loading || !phoneNumber 
                  ? '#ccc' 
                  : 'linear-gradient(to right, #E61E4D 0%, #E31C5F 50%, #D70466 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                cursor: loading || !phoneNumber ? 'not-allowed' : 'pointer',
                marginBottom: 16,
                opacity: loading || !phoneNumber ? 0.6 : 1
              }}
            >
              {loading ? 'Sending code...' : 'Continue'}
            </button>
            
            {/* reCAPTCHA container */}
            <div id="recaptcha-container"></div>

            {/* Divider */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              margin: '16px 0',
              color: '#717171',
              fontSize: 12
            }}>
              <div style={{ flex: 1, height: 1, background: '#ebebeb' }}></div>
              <span style={{ padding: '0 16px' }}>or</span>
              <div style={{ flex: 1, height: 1, background: '#ebebeb' }}></div>
            </div>

            {/* Social Login Buttons */}
            <button
              onClick={handleGoogleLogin}
              style={{
                width: '100%',
                padding: '14px',
                background: '#fff',
                border: '1px solid #222',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
                <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
              </svg>
              Continue with Google
            </button>

            <button
              onClick={() => setView('email')}
              style={{
                width: '100%',
                padding: '14px',
                background: '#fff',
                border: '1px solid #222',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12
              }}
            >
              <svg width="18" height="18" viewBox="0 0 32 32" fill="currentColor">
                <path d="M26 4H6a4 4 0 00-4 4v16a4 4 0 004 4h20a4 4 0 004-4V8a4 4 0 00-4-4zm2 20a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h20a2 2 0 012 2v16z"/>
                <path d="M16 16.5l-6.4-5.3c-.4-.3-.9-.3-1.2 0s-.3.9 0 1.2l7 5.8c.4.3.9.3 1.2 0l7-5.8c.4-.3.4-.9 0-1.2s-.9-.3-1.2 0L16 16.5z"/>
              </svg>
              Continue with email
            </button>
          </div>
        </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Email login view
  if (view === 'email') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'
      }}>
        <Header />
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff',
          padding: '48px 24px'
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 8px 28px rgba(0,0,0,0.12)',
          maxWidth: 568,
          width: '100%',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '24px 24px 16px',
            borderBottom: '1px solid #ebebeb',
            position: 'relative'
          }}>
            <button
              onClick={() => setView('main')}
              style={{
                position: 'absolute',
                left: 24,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4
              }}
            >
              <svg width="16" height="16" fill="currentColor">
                <path d="M10 3L3 10l7 7"/>
              </svg>
            </button>
            <h2 style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 600,
              color: '#222',
              textAlign: 'center'
            }}>
              Log in
            </h2>
          </div>

          {/* Content */}
          <form onSubmit={handleEmailLogin} style={{ padding: 24 }}>
            <h3 style={{
              fontSize: 22,
              fontWeight: 600,
              margin: '0 0 24px 0',
              color: '#222'
            }}>
              Welcome to Airbnb
            </h3>

            <div style={{ marginBottom: 24 }}>
              <div style={{
                border: '1px solid #b0b0b0',
                borderRadius: 8,
                overflow: 'hidden'
              }}>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 12px',
                    border: 'none',
                    borderBottom: '1px solid #ebebeb',
                    fontSize: 16,
                    color: '#222',
                    outline: 'none'
                  }}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 12px',
                    border: 'none',
                    fontSize: 16,
                    color: '#222',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {error && (
              <div style={{
                color: '#c13515',
                fontSize: 14,
                marginBottom: 16,
                padding: 12,
                background: '#fff5f5',
                borderRadius: 8
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(to right, #E61E4D 0%, #E31C5F 50%, #D70466 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: 16
              }}
            >
              Continue
            </button>

            <div style={{ textAlign: 'center', fontSize: 14 }}>
              <span style={{ color: '#717171' }}>Don't have an account? </span>
              <button
                type="button"
                onClick={() => setView('signup')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#222',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14
                }}
              >
                Sign up
              </button>
            </div>
          </form>
        </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Signup view
  if (view === 'signup') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'
      }}>
        <Header />
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff',
          padding: '48px 24px'
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 8px 28px rgba(0,0,0,0.12)',
          maxWidth: 568,
          width: '100%',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '24px 24px 16px',
            borderBottom: '1px solid #ebebeb',
            position: 'relative'
          }}>
            <button
              onClick={() => setView('email')}
              style={{
                position: 'absolute',
                left: 24,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4
              }}
            >
              <svg width="16" height="16" fill="currentColor">
                <path d="M10 3L3 10l7 7"/>
              </svg>
            </button>
            <h2 style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 600,
              color: '#222',
              textAlign: 'center'
            }}>
              Sign up
            </h2>
          </div>

          {/* Content */}
          <form onSubmit={handleSignup} style={{ padding: 24 }}>
            <h3 style={{
              fontSize: 22,
              fontWeight: 600,
              margin: '0 0 24px 0',
              color: '#222'
            }}>
              Welcome to Airbnb
            </h3>

            <div style={{ marginBottom: 24 }}>
              <div style={{
                border: '1px solid #b0b0b0',
                borderRadius: 8,
                overflow: 'hidden'
              }}>
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 12px',
                    border: 'none',
                    borderBottom: '1px solid #ebebeb',
                    fontSize: 16,
                    color: '#222',
                    outline: 'none'
                  }}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 12px',
                    border: 'none',
                    borderBottom: '1px solid #ebebeb',
                    fontSize: 16,
                    color: '#222',
                    outline: 'none'
                  }}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 12px',
                    border: 'none',
                    borderBottom: '1px solid #ebebeb',
                    fontSize: 16,
                    color: '#222',
                    outline: 'none'
                  }}
                />
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 12px',
                    border: 'none',
                    borderBottom: '1px solid #ebebeb',
                    fontSize: 16,
                    color: '#222',
                    outline: 'none'
                  }}
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={signupLocation}
                  onChange={(e) => setSignupLocation(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 12px',
                    border: 'none',
                    fontSize: 16,
                    color: '#222',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {error && (
              <div style={{
                color: '#c13515',
                fontSize: 14,
                marginBottom: 16,
                padding: 12,
                background: '#fff5f5',
                borderRadius: 8
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(to right, #E61E4D 0%, #E31C5F 50%, #D70466 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: 16
              }}
            >
              Agree and continue
            </button>

            <div style={{ textAlign: 'center', fontSize: 14 }}>
              <span style={{ color: '#717171' }}>Already have an account? </span>
              <button
                type="button"
                onClick={() => setView('email')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#222',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14
                }}
              >
                Log in
              </button>
            </div>
          </form>
        </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Phone verification code view
  if (view === 'verify') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'
      }}>
        <Header />
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff',
          padding: '48px 24px'
        }}>
        <div style={{
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 8px 28px rgba(0,0,0,0.12)',
          maxWidth: 568,
          width: '100%',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '24px 24px 16px',
            borderBottom: '1px solid #ebebeb',
            position: 'relative'
          }}>
            <button
              onClick={() => setView('main')}
              style={{
                position: 'absolute',
                left: 24,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4
              }}
            >
              <svg width="16" height="16" fill="currentColor">
                <path d="M10 3L3 10l7 7"/>
              </svg>
            </button>
            <h2 style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 600,
              color: '#222',
              textAlign: 'center'
            }}>
              Confirm your number
            </h2>
          </div>

          {/* Content */}
          <form onSubmit={handleVerifyCode} style={{ padding: 24 }}>
            <p style={{
              fontSize: 16,
              color: '#222',
              marginBottom: 24,
              lineHeight: 1.5
            }}>
              Enter the code we sent over SMS to {countryCode} {phoneNumber}:
            </p>

            <div style={{ marginBottom: 24 }}>
              {/* Individual digit boxes */}
              <div style={{
                display: 'flex',
                gap: 8,
                justifyContent: 'center',
                marginBottom: 24
              }}>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    id={`digit-${index}`}
                    type="text"
                    maxLength={1}
                    value={verificationCode[index] || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '')
                      if (value.length <= 1) {
                        const newCode = verificationCode.split('')
                        newCode[index] = value
                        setVerificationCode(newCode.join(''))
                        
                        // Auto-focus next input
                        if (value && index < 5) {
                          document.getElementById(`digit-${index + 1}`)?.focus()
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      // Handle backspace to go to previous input
                      if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
                        document.getElementById(`digit-${index - 1}`)?.focus()
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault()
                      const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6)
                      setVerificationCode(pastedData)
                      // Focus the last filled digit or the next empty one
                      const nextIndex = Math.min(pastedData.length, 5)
                      document.getElementById(`digit-${nextIndex}`)?.focus()
                    }}
                    style={{
                      width: 48,
                      height: 56,
                      border: '2px solid #222',
                      borderRadius: 8,
                      fontSize: 24,
                      fontWeight: 600,
                      color: '#222',
                      textAlign: 'center',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#222'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = verificationCode[index] ? '#222' : '#b0b0b0'
                    }}
                  />
                ))}
              </div>
            </div>

            {error && (
              <div style={{
                color: '#c13515',
                fontSize: 14,
                marginBottom: 16,
                padding: 12,
                background: '#fff5f5',
                borderRadius: 8
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || verificationCode.length !== 6}
              style={{
                width: '100%',
                padding: '14px',
                background: loading || verificationCode.length !== 6
                  ? '#f7f7f7'
                  : 'linear-gradient(to right, #E61E4D 0%, #E31C5F 50%, #D70466 100%)',
                color: loading || verificationCode.length !== 6 ? '#b0b0b0' : '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                cursor: loading || verificationCode.length !== 6 ? 'not-allowed' : 'pointer',
                marginBottom: 24
              }}
            >
              {loading ? 'Verifying...' : 'Continue'}
            </button>

            <div style={{ textAlign: 'center', fontSize: 14 }}>
              <button
                type="button"
                onClick={async () => {
                  setError('')
                  setVerificationCode('')
                  setView('phone')
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#222',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14
                }}
              >
                Choose a different option
              </button>
            </div>
          </form>
        </div>
        </div>
        <Footer />
      </div>
    )
  }
}