import { useNavigate } from 'react-router-dom'

const fontFamily = '"Airbnb Cereal VF", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'

export default function HostingResources() {
  const navigate = useNavigate()

  const resources = [
    {
      title: 'Host Community',
      description: 'Connect with other hosts and share experiences',
      icon: '👥'
    },
    {
      title: 'Hosting Guides',
      description: 'Learn best practices for managing your listings',
      icon: '📚'
    },
    {
      title: 'Safety Resources',
      description: 'Keep yourself and your guests safe',
      icon: '🛡️'
    },
    {
      title: 'Pricing Tips',
      description: 'Optimize your pricing strategy',
      icon: '💰'
    },
    {
      title: 'Guest Reviews',
      description: 'Understand and manage guest feedback',
      icon: '⭐'
    },
    {
      title: 'Legal & Tax Info',
      description: 'Stay compliant with local regulations',
      icon: '📋'
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
          Hosting resources
        </h1>
        <p
          style={{
            margin: 0,
            marginBottom: 40,
            lineHeight: 1.6,
            color: '#484848'
          }}
        >
          Everything you need to become a successful Airbnb host.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
            marginBottom: 32
          }}
        >
          {resources.map((resource, index) => (
            <div
              key={index}
              style={{
                padding: '24px',
                borderRadius: 16,
                border: '1px solid #ebebeb',
                background: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                ':hover': {
                  boxShadow: '0 6px 16px rgba(0,0,0,0.12)'
                }
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>{resource.icon}</div>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  margin: 0,
                  marginBottom: 8
                }}
              >
                {resource.title}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  color: '#717171',
                  lineHeight: 1.5
                }}
              >
                {resource.description}
              </p>
            </div>
          ))}
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
            <strong>Coming soon:</strong> Interactive guides, video tutorials, and downloadable resources will be available here.
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

