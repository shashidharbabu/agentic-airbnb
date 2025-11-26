import { useNavigate } from 'react-router-dom'

const fontFamily = '"Airbnb Cereal VF", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'

export default function FindCoHost() {
  const navigate = useNavigate()

  const benefits = [
    {
      icon: '⏰',
      title: 'Save time',
      description: 'Share hosting responsibilities and free up your schedule'
    },
    {
      icon: '💼',
      title: 'Professional management',
      description: 'Get help from experienced co-hosts in your area'
    },
    {
      icon: '📈',
      title: 'Grow your business',
      description: 'Manage multiple listings with trusted partners'
    }
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
          Find a co-host
        </h1>
        <p
          style={{
            margin: 0,
            marginBottom: 40,
            lineHeight: 1.6,
            color: '#484848'
          }}
        >
          Partner with experienced hosts to help manage your listings and provide great guest experiences.
        </p>

        <div style={{ marginBottom: 40 }}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 600,
              margin: 0,
              marginBottom: 20
            }}
          >
            Why work with a co-host?
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 24
            }}
          >
            {benefits.map((benefit, index) => (
              <div
                key={index}
                style={{
                  padding: '24px',
                  borderRadius: 16,
                  border: '1px solid #ebebeb',
                  background: '#fff'
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 12 }}>{benefit.icon}</div>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    margin: 0,
                    marginBottom: 8
                  }}
                >
                  {benefit.title}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    color: '#717171',
                    lineHeight: 1.5
                  }}
                >
                  {benefit.description}
                </p>
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
            Search for co-hosts
          </h2>
          <div
            style={{
              padding: '32px',
              borderRadius: 16,
              border: '1px solid #ebebeb',
              background: '#f7f7f7',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <h3
              style={{
                fontSize: 20,
                fontWeight: 600,
                margin: 0,
                marginBottom: 8
              }}
            >
              Find the perfect co-host
            </h3>
            <p
              style={{
                margin: '0 0 24px 0',
                fontSize: 15,
                color: '#717171',
                lineHeight: 1.5
              }}
            >
              Search by location, experience, and reviews to find trusted co-hosts
            </p>
            <input
              type="text"
              placeholder="Enter your location"
              style={{
                width: '100%',
                maxWidth: 400,
                padding: '14px 16px',
                borderRadius: 12,
                border: '1px solid #dddddd',
                fontSize: 16,
                outline: 'none'
              }}
              disabled
            />
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
            <strong>Coming soon:</strong> Browse verified co-hosts, view profiles, and send collaboration requests directly through the platform.
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

