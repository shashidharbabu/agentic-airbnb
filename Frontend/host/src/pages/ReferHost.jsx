import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

const fontFamily = '"Airbnb Cereal VF", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'

export default function ReferHost() {
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const referralCode = 'HOST2024ABC'

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const rewards = [
    {
      icon: '💰',
      title: '$100 bonus',
      description: 'Earn $100 for every host you refer who completes their first booking'
    },
    {
      icon: '🎁',
      title: 'Your friend gets $50',
      description: 'They receive a $50 credit towards their first property setup'
    },
    {
      icon: '♾️',
      title: 'Unlimited referrals',
      description: 'No limit on how many friends you can refer and rewards you can earn'
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
          Refer a host
        </h1>
        <p
          style={{
            margin: 0,
            marginBottom: 40,
            lineHeight: 1.6,
            color: '#484848'
          }}
        >
          Invite friends to become Airbnb hosts and earn rewards when they get started.
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
            Your referral code
          </h2>
          <div
            style={{
              padding: '24px',
              borderRadius: 16,
              border: '1px solid #ebebeb',
              background: '#f7f7f7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap'
            }}
          >
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 12, color: '#717171', marginBottom: 4 }}>
                REFERRAL CODE
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: 2,
                  fontFamily: 'monospace'
                }}
              >
                {referralCode}
              </p>
            </div>
            <button
              onClick={handleCopy}
              style={{
                border: '1px solid #222',
                borderRadius: 12,
                padding: '12px 24px',
                fontSize: 15,
                fontWeight: 600,
                background: copied ? '#222' : '#fff',
                color: copied ? '#fff' : '#222',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {copied ? '✓ Copied!' : 'Copy Code'}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 40 }}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 600,
              margin: 0,
              marginBottom: 20
            }}
          >
            How it works
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 24
            }}
          >
            {rewards.map((reward, index) => (
              <div
                key={index}
                style={{
                  padding: '24px',
                  borderRadius: 16,
                  border: '1px solid #ebebeb',
                  background: '#fff'
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 12 }}>{reward.icon}</div>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    margin: 0,
                    marginBottom: 8
                  }}
                >
                  {reward.title}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    color: '#717171',
                    lineHeight: 1.5
                  }}
                >
                  {reward.description}
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
            Your referral stats
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
              <p style={{ margin: 0, fontSize: 32, fontWeight: 700, color: '#FF385C' }}>
                0
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: 14, color: '#717171' }}>
                Successful referrals
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
              <p style={{ margin: 0, fontSize: 32, fontWeight: 700, color: '#00A699' }}>
                $0
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: 14, color: '#717171' }}>
                Total earned
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
              <p style={{ margin: 0, fontSize: 32, fontWeight: 700, color: '#484848' }}>
                0
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: 14, color: '#717171' }}>
                Pending referrals
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
            <strong>Coming soon:</strong> Track your referrals in real-time and see when you earn rewards.
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

