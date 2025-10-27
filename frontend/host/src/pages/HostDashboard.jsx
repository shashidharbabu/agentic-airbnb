import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import '../styles/Listings.css'
import { currencyFormatter, transformProperty as transformListingProperty } from '../utils/listings'

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const formatDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return dateFormatter.format(date)
}

const formatRange = (start, end) => {
  if (!start && !end) return 'Dates TBD'
  if (!start) return `Until ${formatDate(end)}`
  if (!end) return `From ${formatDate(start)}`
  return `${formatDate(start)} → ${formatDate(end)}`
}

const getTravelerInitial = (name, email) => {
  if (name && name.trim().length > 0) return name.trim().charAt(0).toUpperCase()
  if (email && email.trim().length > 0) return email.trim().charAt(0).toUpperCase()
  return 'G'
}

export default function HostDashboard() {
  const nav = useNavigate()
  const [owner, setOwner] = useState(null)
  const [properties, setProperties] = useState([])
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)

  const apiBase = useMemo(() => {
    const baseValue = api.defaults.baseURL || (typeof window !== 'undefined' ? window.location.origin : '')
    return baseValue.endsWith('/') ? baseValue.slice(0, -1) : baseValue
  }, [])

  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        const me = await api.get('/auth/me')
        if (!me.data.owner) return nav('/login')
        setOwner(me.data.owner)
        
        const [propsRes, pendRes] = await Promise.all([
          api.get('/properties/mine'),
          api.get('/bookings/incoming', { params: { status: 'PENDING' } })
        ])
        
        setProperties(propsRes.data.properties || [])
        setPending(pendRes.data.bookings || [])
      } catch {
        nav('/login')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleBookingAction = async (bookingId, action) => {
    try {
      await api.post(`/bookings/${bookingId}/${action}`)
      setPending(p => p.filter(x => x.id !== bookingId))
    } catch (error) {
      console.error('Error updating booking:', error)
    }
  }

  const listings = useMemo(() => {
    return properties
      .map((property, index) => transformListingProperty(property, index, apiBase))
      .filter(Boolean)
  }, [properties, apiBase])

  const totalNightlyRate = useMemo(() => {
    return listings.reduce((sum, listing) => sum + (listing.price || 0), 0)
  }, [listings])

  const liveListings = useMemo(() => {
    return listings.filter(l => l.statusKey === 'live')
  }, [listings])

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ 
            width: 40, 
            height: 40, 
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #FF385C',
            borderRadius: '50%',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#6b7280' }}>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      maxWidth: 1400, 
      margin: '0 auto', 
      padding: '32px 40px 64px', 
      fontFamily: '"Airbnb Cereal VF", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
      background: '#f7f7f7',
      minHeight: 'calc(100vh - 200px)'
    }}>
      {/* Header Section */}
      <div style={{ 
        marginBottom: 40
      }}>
        <h1 style={{ 
          fontSize: 36, 
          fontWeight: 600, 
          margin: '0 0 8px 0',
          color: '#222',
          letterSpacing: '-0.5px'
        }}>
          Welcome back, {owner?.name}!
        </h1>
        <p style={{ 
          color: '#717171', 
          margin: 0,
          fontSize: 16
        }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: 24, 
        marginBottom: 40 
      }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          padding: 28, 
          borderRadius: 16, 
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
              Total Properties
            </div>
            <div style={{ fontSize: 40, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
              {listings.length}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
              {liveListings.length} live
            </div>
          </div>
          <div style={{ 
            position: 'absolute', 
            right: -20, 
            bottom: -20, 
            fontSize: 100, 
            opacity: 0.15 
          }}>🏠</div>
        </div>

        <div style={{ 
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
          padding: 28, 
          borderRadius: 16, 
          boxShadow: '0 4px 12px rgba(240, 147, 251, 0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
              Pending Requests
            </div>
            <div style={{ fontSize: 40, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
              {pending.length}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
              {pending.length > 0 ? 'Needs attention' : 'All clear'}
            </div>
          </div>
          <div style={{ 
            position: 'absolute', 
            right: -20, 
            bottom: -20, 
            fontSize: 100, 
            opacity: 0.15 
          }}>📅</div>
        </div>

        <div style={{ 
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 
          padding: 28, 
          borderRadius: 16, 
          boxShadow: '0 4px 12px rgba(79, 172, 254, 0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
              Total Nightly Rate
            </div>
            <div style={{ fontSize: 40, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
              {currencyFormatter.format(totalNightlyRate)}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
              Across all properties
            </div>
          </div>
          <div style={{ 
            position: 'absolute', 
            right: -20, 
            bottom: -20, 
            fontSize: 100, 
            opacity: 0.15 
          }}>💰</div>
        </div>

        <div style={{ 
          background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', 
          padding: 28, 
          borderRadius: 16, 
          boxShadow: '0 4px 12px rgba(250, 112, 154, 0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
              Avg. Price/Night
            </div>
            <div style={{ fontSize: 40, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
              {listings.length > 0 ? currencyFormatter.format(totalNightlyRate / listings.length) : '$0'}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
              Per property
            </div>
          </div>
          <div style={{ 
            position: 'absolute', 
            right: -20, 
            bottom: -20, 
            fontSize: 100, 
            opacity: 0.15 
          }}>📊</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Quick Actions */}
          <section style={{ 
            background: '#fff', 
            padding: 28, 
            borderRadius: 16,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 20px 0', color: '#222' }}>
              Quick Actions
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <button 
                onClick={() => nav('/onboarding/type')}
                style={{ 
                  background: '#FF385C', 
                  color: '#fff', 
                  border: 'none', 
                  padding: '16px 20px', 
                  borderRadius: 12, 
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                <span style={{ fontSize: 20 }}>➕</span>
                Add Property
              </button>
              <button 
                onClick={() => nav('/host/listings')}
                style={{ 
                  background: '#fff', 
                  color: '#222',
                  border: '1px solid #ddd', 
                  padding: '16px 20px', 
                  borderRadius: 12, 
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                <span style={{ fontSize: 20 }}>📋</span>
                View All Listings
              </button>
              <button 
                onClick={() => nav('/host/bookings')}
                style={{ 
                  background: '#fff', 
                  color: '#222',
                  border: '1px solid #ddd', 
                  padding: '16px 20px', 
                  borderRadius: 12, 
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                <span style={{ fontSize: 20 }}>📅</span>
                Manage Bookings
              </button>
            </div>
          </section>

          {/* Recent Properties */}
          <section style={{ 
            background: '#fff', 
            padding: 28, 
            borderRadius: 16,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: 24 
            }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0, color: '#222' }}>
                Recent Properties
              </h2>
              <button 
                onClick={() => nav('/host/listings')}
                style={{ 
                  color: '#FF385C', 
                  background: 'none',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                View all →
              </button>
            </div>
          
          {listings.length === 0 ? (
            <div style={{ 
              border: '2px dashed #e5e7eb', 
              padding: 48, 
              borderRadius: 12, 
              textAlign: 'center',
              background: '#fafafa'
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🏠</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px 0', color: '#374151' }}>
                No properties yet
              </h3>
              <p style={{ color: '#6b7280', margin: '0 0 24px 0', fontSize: 14 }}>
                Get started by adding your first property
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {listings.slice(0, 5).map((listing) => {
                const priceLabel = listing.price !== null && listing.price !== undefined
                  ? currencyFormatter.format(listing.price)
                  : '—'

                return (
                  <div 
                    key={listing.id} 
                    style={{ 
                      display: 'flex',
                      gap: 16,
                      padding: 16,
                      background: '#fafafa',
                      borderRadius: 12,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      border: '1px solid #f0f0f0'
                    }}
                    onClick={() => nav(`/host/listings/${listing.id}/details`)}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#f0f0f0'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#fafafa'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <div style={{
                      width: 100,
                      height: 80,
                      borderRadius: 8,
                      backgroundImage: `url(${listing.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      flexShrink: 0
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontSize: 16, 
                        fontWeight: 600, 
                        color: '#222', 
                        marginBottom: 4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {listing.title}
                      </div>
                      <div style={{ fontSize: 13, color: '#717171', marginBottom: 8 }}>
                        {listing.location}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ 
                          fontSize: 12, 
                          padding: '4px 8px', 
                          borderRadius: 6, 
                          background: listing.statusKey === 'live' ? '#d4edda' : '#f8d7da',
                          color: listing.statusKey === 'live' ? '#155724' : '#721c24',
                          fontWeight: 600
                        }}>
                          {listing.status}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#FF385C' }}>
                          {priceLabel}/night
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          </section>
        </div>

        {/* Right Column - Pending Bookings */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Pending Bookings Section */}
          <section style={{ 
            background: '#fff', 
            padding: 24, 
            borderRadius: 16,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: 20 
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: '#222' }}>
                Pending Requests
              </h2>
              {pending.length > 0 && (
                <span style={{ 
                  background: '#FF385C',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: 12
                }}>
                  {pending.length}
                </span>
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {pending.length === 0 ? (
                <div style={{ 
                  border: '2px dashed #e5e7eb', 
                  borderRadius: 12, 
                  padding: 32, 
                  textAlign: 'center',
                  background: '#fafafa'
                }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
                  <p style={{ color: '#6b7280', margin: 0, fontSize: 13 }}>
                    All caught up!
                  </p>
                  <p style={{ color: '#6b7280', margin: '4px 0 0 0', fontSize: 12 }}>
                    No pending requests
                  </p>
                </div>
              ) : (
                pending.map((booking) => {
                  const travelerName = booking.traveler?.name || 'Guest'
                  const travelerEmail = booking.traveler?.email || ''
                  const guests = typeof booking.guests === 'number' ? booking.guests : null
                  const propertyName = booking.property?.name || 'Untitled listing'
                  const stayRange = formatRange(booking.startDate, booking.endDate)
                  const initial = getTravelerInitial(travelerName, travelerEmail)

                  return (
                    <div key={booking.id} style={{ 
                      border: '1px solid #ebebeb', 
                      borderRadius: 12, 
                      padding: 16, 
                      background: '#fafafa',
                      transition: 'all 0.2s'
                    }}>
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        marginBottom: 12,
                        paddingBottom: 12,
                        borderBottom: '1px solid #ebebeb'
                      }}>
                        <div style={{ 
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 600,
                          fontSize: 14
                        }}>
                          {initial}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ 
                            fontWeight: 600, 
                            fontSize: 14, 
                            color: '#222',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {travelerName}
                          </div>
                          <div style={{ color: '#717171', fontSize: 11 }}>
                            {guests !== null ? `${guests} ${guests === 1 ? 'guest' : 'guests'}` : 'TBD guests'}
                          </div>
                        </div>
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <div style={{ 
                          fontWeight: 600, 
                          color: '#222', 
                          fontSize: 13, 
                          marginBottom: 4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {propertyName}
                        </div>
                        <div style={{ 
                          color: '#717171', 
                          fontSize: 12, 
                          marginBottom: 8
                        }}>
                          📅 {stayRange}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button 
                          onClick={() => handleBookingAction(booking.id, 'accept')}
                          style={{ 
                            flex: 1,
                            background: '#00a699', 
                            color: '#fff', 
                            border: 'none', 
                            padding: '8px 12px', 
                            borderRadius: 8, 
                            fontWeight: 600,
                            fontSize: 12,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => e.target.style.background = '#008c80'}
                          onMouseOut={(e) => e.target.style.background = '#00a699'}
                        >
                          ✓ Accept
                        </button>
                        <button 
                          onClick={() => handleBookingAction(booking.id, 'cancel')}
                          style={{ 
                            flex: 1,
                            border: '1px solid #ddd', 
                            padding: '8px 12px', 
                            borderRadius: 8, 
                            background: '#fff',
                            color: '#717171',
                            fontWeight: 600,
                            fontSize: 12,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            e.target.style.borderColor = '#aaa'
                            e.target.style.color = '#222'
                          }}
                          onMouseOut={(e) => {
                            e.target.style.borderColor = '#ddd'
                            e.target.style.color = '#717171'
                          }}
                        >
                          ✕ Decline
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </section>
        </aside>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
