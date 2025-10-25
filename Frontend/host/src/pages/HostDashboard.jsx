import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client'
import AgentPanel from '../components/AgentPanel'
import '../styles/Listings.css'
import { currencyFormatter, transformProperty as transformListingProperty } from '../utils/listings'

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
      maxWidth: 1200, 
      margin: '32px auto', 
      padding: '0 24px', 
      fontFamily: 'system-ui, sans-serif',
      minHeight: 'calc(100vh - 200px)'
    }}>
      {/* Header Section */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: 32,
        paddingBottom: 20,
        borderBottom: '1px solid #f0f0f0'
      }}>
        <div>
          <h1 style={{ 
            fontSize: 32, 
            fontWeight: 700, 
            margin: '0 0 8px 0',
            color: '#222'
          }}>
            Welcome back, {owner?.name}!
          </h1>
          <p style={{ 
            color: '#6b7280', 
            margin: 0,
            fontSize: 16
          }}>
            Manage your properties and bookings
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: 20, 
        marginBottom: 32 
      }}>
        <div style={{ 
          background: '#fff', 
          padding: 24, 
          borderRadius: 16, 
          border: '1px solid #f0f0f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#FF385C', marginBottom: 8 }}>
            {listings.length}
          </div>
          <div style={{ color: '#6b7280', fontSize: 14, fontWeight: 500 }}>
            Total Properties
          </div>
        </div>
        <div style={{ 
          background: '#fff', 
          padding: 24, 
          borderRadius: 16, 
          border: '1px solid #f0f0f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#FF385C', marginBottom: 8 }}>
            {pending.length}
          </div>
          <div style={{ color: '#6b7280', fontSize: 14, fontWeight: 500 }}>
            Pending Bookings
          </div>
        </div>
        <div style={{ 
          background: '#fff', 
          padding: 24, 
          borderRadius: 16, 
          border: '1px solid #f0f0f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#FF385C', marginBottom: 8 }}>
            {currencyFormatter.format(totalNightlyRate)}
          </div>
          <div style={{ color: '#6b7280', fontSize: 14, fontWeight: 500 }}>
            Total Nightly Rate
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 32 }}>
        {/* Properties Section */}
        <section>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: 20 
          }}>
            <h2 style={{ fontSize: 24, fontWeight: 600, margin: 0, color: '#222' }}>
              My Properties
            </h2>
            <span style={{ 
              color: '#6b7280', 
              fontSize: 14,
              background: '#f7f7f7',
              padding: '4px 12px',
              borderRadius: 20
            }}>
              {listings.length} {listings.length === 1 ? 'property' : 'properties'}
            </span>
          </div>
          
          {listings.length === 0 ? (
            <div style={{ 
              border: '2px dashed #e5e7eb', 
              padding: 48, 
              borderRadius: 16, 
              textAlign: 'center',
              background: '#fafafa'
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🏠</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px 0', color: '#374151' }}>
                No properties yet
              </h3>
              <p style={{ color: '#6b7280', margin: '0 0 24px 0' }}>
                Get started by adding your first property
              </p>
              <Link 
                to="/onboarding/type" 
                style={{ 
                  background: '#FF385C', 
                  color: '#fff', 
                  padding: '12px 24px', 
                  borderRadius: 12, 
                  fontWeight: 600, 
                  textDecoration: 'none',
                  display: 'inline-block'
                }}
              >
                Add your first property
              </Link>
            </div>
          ) : (
            <div className="listings-page__grid">
              {listings.map((listing) => {
                const ratingLabel = listing.rating !== null && listing.rating !== undefined ? listing.rating.toFixed(2) : '—'
                const reviewsLabel = typeof listing.reviews === 'number' ? listing.reviews.toLocaleString('en-US') : '—'
                const viewsLabel = typeof listing.views === 'number' ? listing.views.toLocaleString('en-US') : '—'
                const priceLabel =
                  listing.price !== null && listing.price !== undefined
                    ? currencyFormatter.format(listing.price)
                    : '—'

                return (
                  <article key={listing.id} className="listing-card">
                    <div className="listing-card__media" style={{ backgroundImage: `url(${listing.image})` }}>
                      <div className="listing-card__pill listing-card__pill--status">
                        <span aria-hidden="true">
                          <svg viewBox="0 0 24 24">
                            <path d="m5.25 12 4.5 4.5 9-9" />
                          </svg>
                        </span>
                        {listing.status}
                      </div>
                      <button
                        className="listing-card__pill listing-card__pill--light"
                        type="button"
                        onClick={() => nav(`/listing/${listing.id}`)}
                      >
                        Preview
                      </button>
                    </div>

                    <div className="listing-card__body">
                      <div className="listing-card__header">
                        <div>
                          <h2>{listing.title}</h2>
                          <span>{listing.location}</span>
                        </div>
                        <button className="icon-button" aria-label="Open quick actions" type="button">
                          <svg viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="1.5" />
                            <circle cx="12" cy="6" r="1.5" />
                            <circle cx="12" cy="18" r="1.5" />
                          </svg>
                        </button>
                      </div>

                      <div className="listing-card__metrics">
                        <div className="metric">
                          <span className="metric__icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24">
                              <path d="M12 2.25 14.7 8.4l6.3.45-4.8 4.05 1.5 6.15L12 15.9 6.3 19.05l1.5-6.15-4.8-4.05 6.3-.45Z" />
                            </svg>
                          </span>
                          <div>
                            <strong>{ratingLabel}</strong>
                            <span>Guest rating</span>
                          </div>
                        </div>
                        <div className="metric">
                          <span className="metric__icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24">
                              <path d="M7.5 21.75h9" />
                              <path d="M5.25 7.5h13.5" />
                              <path d="M6.75 7.5v-3h10.5v3" />
                              <path d="M9 7.5v14.25" />
                              <path d="M15 7.5v14.25" />
                            </svg>
                          </span>
                          <div>
                            <strong>{reviewsLabel}</strong>
                            <span>Total reviews</span>
                          </div>
                        </div>
                        <div className="metric">
                          <span className="metric__icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24">
                              <path d="M3.75 12c0-4.556 3.694-8.25 8.25-8.25S20.25 7.444 20.25 12 16.556 20.25 12 20.25 3.75 16.556 3.75 12Z" />
                              <path d="m9.75 10.5 2.25 2.25 5.25-5.25" />
                            </svg>
                          </span>
                          <div>
                            <strong>{viewsLabel}</strong>
                            <span>Views (90 days)</span>
                          </div>
                        </div>
                        <div className="metric">
                          <span className="metric__icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24">
                              <path d="M3.75 7.5h16.5" />
                              <path d="M7.5 7.5v-3h9v3" />
                              <path d="M6.75 7.5v12.75" />
                              <path d="M17.25 7.5v12.75" />
                              <path d="M6.75 15.75h10.5" />
                            </svg>
                          </span>
                          <div>
                            <strong>{priceLabel}</strong>
                            <span>Average nightly price</span>
                          </div>
                        </div>
                      </div>

                      <div className="listing-card__footer">
                        <button className="outline-button" type="button" onClick={() => nav(`/host/listings/${listing.id}/details`)}>
                          Listing details
                        </button>
                        <button className="outline-button" type="button" onClick={() => nav(`/host/listings/${listing.id}/pricing`)}>
                          Pricing &amp; availability
                        </button>
                        <button className="outline-button" type="button" onClick={() => nav(`/host/listings/${listing.id}/reservations`)}>
                          Reservations
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        {/* Sidebar */}
        <aside>
          <h2 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 20px 0', color: '#222' }}>
            Pending Bookings
          </h2>
          <div style={{ display: 'grid', gap: 16 }}>
            {pending.length === 0 ? (
              <div style={{ 
                border: '1px solid #e5e7eb', 
                borderRadius: 16, 
                padding: 32, 
                textAlign: 'center',
                background: '#fafafa'
              }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
                <p style={{ color: '#6b7280', margin: 0, fontSize: 14 }}>
                  No pending requests
                </p>
              </div>
            ) : (
              pending.map(b => (
                <div key={b.id} style={{ 
                  border: '1px solid #e5e7eb', 
                  borderRadius: 16, 
                  padding: 20, 
                  background: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 12
                  }}>
                    <div style={{ 
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: '#FF385C',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: 16
                    }}>
                      {b.traveler_name?.charAt(0)?.toUpperCase() || 'G'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 16, color: '#222' }}>
                        {b.traveler_name}
                      </div>
                      <div style={{ color: '#6b7280', fontSize: 12 }}>
                        {b.guests} {b.guests === 1 ? 'guest' : 'guests'}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ 
                    color: '#6b7280', 
                    fontSize: 14, 
                    marginBottom: 16,
                    padding: 12,
                    background: '#f7f7f7',
                    borderRadius: 8
                  }}>
                    📅 {b.start_date?.slice(0,10)} → {b.end_date?.slice(0,10)}
                  </div>
                  
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      onClick={() => handleBookingAction(b.id, 'accept')}
                      style={{ 
                        flex: 1,
                        background: '#FF385C', 
                        color: '#fff', 
                        border: 'none', 
                        padding: '10px 16px', 
                        borderRadius: 8, 
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => e.target.style.background = '#E31C5F'}
                      onMouseOut={(e) => e.target.style.background = '#FF385C'}
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => handleBookingAction(b.id, 'cancel')}
                      style={{ 
                        flex: 1,
                        border: '1px solid #d1d5db', 
                        padding: '10px 16px', 
                        borderRadius: 8, 
                        background: '#fff',
                        color: '#374151',
                        fontWeight: 500,
                        fontSize: 14,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => e.target.style.borderColor = '#9ca3af'}
                      onMouseOut={(e) => e.target.style.borderColor = '#d1d5db'}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div style={{ marginTop: 32 }}>
            <AgentPanel />
          </div>
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
