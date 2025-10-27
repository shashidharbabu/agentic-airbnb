import { useNavigate } from 'react-router-dom'

const fontFamily = '"Airbnb Cereal VF", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'

export default function LanguageCurrency() {
  const navigate = useNavigate()

  return (
    <div
      style={{
        maxWidth: 1040,
        margin: '0 auto',
        padding: '48px 24px 80px',
        fontFamily,
        color: '#222'
      }}
    >
      <section
        style={{
          background: '#fff',
          borderRadius: 24,
          border: '1px solid #ebebeb',
          boxShadow: '0 12px 32px rgba(0,0,0,0.06)',
          padding: '48px 56px'
        }}
      >
        <h1
          style={{
            fontSize: 32,
            fontWeight: 700,
            margin: 0,
            marginBottom: 12
          }}
        >
          Languages & currency
        </h1>
        <p
          style={{
            margin: 0,
            marginBottom: 40,
            lineHeight: 1.6,
            color: '#484848'
          }}
        >
          Manage your language and currency preferences for your Airbnb account.
        </p>

        <div style={{ marginBottom: 32 }}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 600,
              margin: 0,
              marginBottom: 16
            }}
          >
            Language
          </h2>
          <div
            style={{
              padding: '20px 24px',
              borderRadius: 12,
              border: '1px solid #ebebeb',
              background: '#f7f7f7'
            }}
          >
            <p style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>English (US)</p>
            <p style={{ margin: '8px 0 0 0', fontSize: 14, color: '#717171' }}>
              Current language setting
            </p>
          </div>
        </div>

        <div style={{ marginBottom: 32 }}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 600,
              margin: 0,
              marginBottom: 16
            }}
          >
            Currency
          </h2>
          <div
            style={{
              padding: '20px 24px',
              borderRadius: 12,
              border: '1px solid #ebebeb',
              background: '#f7f7f7'
            }}
          >
            <p style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>USD ($)</p>
            <p style={{ margin: '8px 0 0 0', fontSize: 14, color: '#717171' }}>
              United States Dollar
            </p>
          </div>
        </div>

        <div
          style={{
            marginTop: 40,
            padding: '24px',
            borderRadius: 12,
            background: '#f0f8ff',
            border: '1px solid #d0e8ff'
          }}
        >
          <p style={{ margin: 0, fontSize: 15, color: '#484848', lineHeight: 1.6 }}>
            <strong>Coming soon:</strong> Full language and currency customization settings will be available in a future update.
          </p>
        </div>

        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: 32,
            border: '1px solid #222',
            borderRadius: 12,
            padding: '14px 24px',
            fontSize: 15,
            fontWeight: 600,
            background: '#fff',
            cursor: 'pointer'
          }}
        >
          Back to Dashboard
        </button>
      </section>
    </div>
  )
}

