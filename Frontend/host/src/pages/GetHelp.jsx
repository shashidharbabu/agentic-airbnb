import { useNavigate } from 'react-router-dom'

const fontFamily = '"Airbnb Cereal VF", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'

export default function GetHelp() {
  const navigate = useNavigate()

  const helpTopics = [
    { title: 'Account & Registration', count: '12 articles' },
    { title: 'Listing Management', count: '18 articles' },
    { title: 'Reservations & Bookings', count: '15 articles' },
    { title: 'Cancellations & Refunds', count: '10 articles' },
    { title: 'Payments & Pricing', count: '14 articles' },
    { title: 'Guest Communication', count: '8 articles' }
  ]

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
          Get help
        </h1>
        <p
          style={{
            margin: 0,
            marginBottom: 40,
            lineHeight: 1.6,
            color: '#484848'
          }}
        >
          Find answers to common questions or contact our support team.
        </p>

        <div style={{ marginBottom: 32 }}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 600,
              margin: 0,
              marginBottom: 20
            }}
          >
            Popular help topics
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {helpTopics.map((topic, index) => (
              <div
                key={index}
                style={{
                  padding: '16px 20px',
                  borderRadius: 12,
                  border: '1px solid #ebebeb',
                  background: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f7f7f7'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#fff'
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 500 }}>{topic.title}</span>
                <span style={{ fontSize: 14, color: '#717171' }}>{topic.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 32 }}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 600,
              margin: 0,
              marginBottom: 20
            }}
          >
            Contact support
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 16
            }}
          >
            <div
              style={{
                padding: '20px',
                borderRadius: 12,
                border: '1px solid #ebebeb',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                Live Chat
              </h3>
              <p style={{ margin: 0, fontSize: 14, color: '#717171' }}>
                Available 24/7
              </p>
            </div>
            <div
              style={{
                padding: '20px',
                borderRadius: 12,
                border: '1px solid #ebebeb',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>📧</div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                Email Support
              </h3>
              <p style={{ margin: 0, fontSize: 14, color: '#717171' }}>
                Response within 24 hours
              </p>
            </div>
            <div
              style={{
                padding: '20px',
                borderRadius: 12,
                border: '1px solid #ebebeb',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>📞</div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                Phone Support
              </h3>
              <p style={{ margin: 0, fontSize: 14, color: '#717171' }}>
                Mon-Fri, 9am-5pm
              </p>
            </div>
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
            <strong>Coming soon:</strong> Interactive help center with searchable FAQs and direct contact options.
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

