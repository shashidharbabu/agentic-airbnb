import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/client'
import '../styles/PricingAvailability.css'

const fontFamily = '"Airbnb Cereal VF", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'

export default function PricingAvailability() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [property, setProperty] = useState(null)
  const [bookings, setBookings] = useState([])

  const loadData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError('')
    
    try {
      // Load property details
      const { data: propertyData } = await api.get(`/properties/${id}`)
      if (!propertyData?.property) {
        setError('Property not found.')
        return
      }
      setProperty(propertyData.property)

      // Load bookings for this property
      try {
        const { data: bookingsData } = await api.get(`/bookings/property/${id}`)
        const allBookings = Array.isArray(bookingsData?.bookings) ? bookingsData.bookings : []
        setBookings(allBookings)
      } catch (bookingsErr) {
        console.error('Failed to load bookings:', bookingsErr)
        setBookings([])
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        setError('Property not found.')
      } else if (err?.response?.status === 403) {
        setError('You do not have permission to view this property.')
      } else {
        setError('Failed to load property information.')
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Separate bookings into past and upcoming
  const now = new Date()
  const upcomingBookings = bookings.filter(b => new Date(b.end_date) >= now)
  const pastBookings = bookings.filter(b => new Date(b.end_date) < now)

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACCEPTED': return '#00a699'
      case 'PENDING': return '#ff9800'
      case 'CANCELLED': return '#dc3545'
      case 'COMPLETED': return '#6c757d'
      default: return '#222'
    }
  }

  if (loading) {
    return (
      <div className="pricing-availability-page" style={{ fontFamily }}>
        <div className="pricing-availability-loading">Loading...</div>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="pricing-availability-page" style={{ fontFamily }}>
        <div className="pricing-availability-error">
          <p>{error || 'Property not found'}</p>
          <button onClick={() => navigate('/host/listings')} className="pa-button">
            Back to Listings
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="pricing-availability-page" style={{ fontFamily }}>
      {/* Header */}
      <header className="pa-header">
        <button onClick={() => navigate('/host/listings')} className="pa-back-button">
          ← Back to listings
        </button>
        <div className="pa-title-section">
          <h1>{property.name}</h1>
          <p>{property.location}</p>
        </div>
      </header>

      {/* Pricing Section */}
      <section className="pa-section">
        <h2>Pricing</h2>
        <div className="pa-pricing-grid">
          <div className="pa-pricing-card">
            <div className="pa-pricing-label">Base Price</div>
            <div className="pa-pricing-value">{formatCurrency(property.price_per_night)}</div>
            <div className="pa-pricing-unit">per night</div>
          </div>

          {property.weekend_premium_percent && property.weekend_premium_percent > 0 && (
            <div className="pa-pricing-card">
              <div className="pa-pricing-label">Weekend Premium</div>
              <div className="pa-pricing-value">{property.weekend_premium_percent}%</div>
              <div className="pa-pricing-unit">
                {formatCurrency(property.price_per_night * (1 + property.weekend_premium_percent / 100))} / night
              </div>
            </div>
          )}

          {property.discounts?.weekly > 0 && (
            <div className="pa-pricing-card">
              <div className="pa-pricing-label">Weekly Discount</div>
              <div className="pa-pricing-value">{property.discounts.weekly}%</div>
              <div className="pa-pricing-unit">7+ nights</div>
            </div>
          )}

          {property.discounts?.monthly > 0 && (
            <div className="pa-pricing-card">
              <div className="pa-pricing-label">Monthly Discount</div>
              <div className="pa-pricing-value">{property.discounts.monthly}%</div>
              <div className="pa-pricing-unit">28+ nights</div>
            </div>
          )}
        </div>
      </section>

      {/* Availability Section */}
      <section className="pa-section">
        <h2>Availability</h2>
        <div className="pa-availability-info">
          <div className="pa-availability-item">
            <div className="pa-availability-label">Booking Mode</div>
            <div className="pa-availability-value">
              {property.booking_mode === 'INSTANT' ? '⚡ Instant Book' : '📝 Request to Book'}
            </div>
          </div>

          {property.availability_start && (
            <div className="pa-availability-item">
              <div className="pa-availability-label">Available From</div>
              <div className="pa-availability-value">{formatDate(property.availability_start)}</div>
            </div>
          )}

          {property.availability_end && (
            <div className="pa-availability-item">
              <div className="pa-availability-label">Available Until</div>
              <div className="pa-availability-value">{formatDate(property.availability_end)}</div>
            </div>
          )}

          <div className="pa-availability-item">
            <div className="pa-availability-label">Property Status</div>
            <div className="pa-availability-value">
              <span className={`pa-status-badge pa-status-badge--${property.status === 'Live' ? 'live' : 'inactive'}`}>
                {property.status || 'Active'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Bookings */}
      <section className="pa-section">
        <h2>Upcoming Reservations ({upcomingBookings.length})</h2>
        {upcomingBookings.length === 0 ? (
          <div className="pa-empty-state">
            <p>No upcoming reservations yet.</p>
          </div>
        ) : (
          <div className="pa-bookings-list">
            {upcomingBookings.map((booking) => (
              <div key={booking.id} className="pa-booking-card">
                <div className="pa-booking-header">
                  <div className="pa-booking-guest">
                    <div className="pa-booking-avatar">
                      {booking.traveler_name?.[0]?.toUpperCase() || 'G'}
                    </div>
                    <div>
                      <div className="pa-booking-guest-name">{booking.traveler_name || 'Guest'}</div>
                      <div className="pa-booking-guest-email">{booking.traveler_email || ''}</div>
                    </div>
                  </div>
                  <div 
                    className="pa-booking-status"
                    style={{ color: getStatusColor(booking.status) }}
                  >
                    {booking.status}
                  </div>
                </div>
                <div className="pa-booking-details">
                  <div className="pa-booking-detail">
                    <span className="pa-detail-label">Check-in:</span>
                    <span className="pa-detail-value">{formatDate(booking.start_date)}</span>
                  </div>
                  <div className="pa-booking-detail">
                    <span className="pa-detail-label">Check-out:</span>
                    <span className="pa-detail-value">{formatDate(booking.end_date)}</span>
                  </div>
                  <div className="pa-booking-detail">
                    <span className="pa-detail-label">Guests:</span>
                    <span className="pa-detail-value">{booking.guests || 1}</span>
                  </div>
                  <div className="pa-booking-detail">
                    <span className="pa-detail-label">Total:</span>
                    <span className="pa-detail-value pa-detail-value--price">
                      {formatCurrency(booking.total_price)}
                    </span>
                  </div>
                </div>
                {booking.special_requests && (
                  <div className="pa-booking-requests">
                    <strong>Special Requests:</strong>
                    <p>{booking.special_requests}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Past Bookings */}
      <section className="pa-section">
        <h2>Past Reservations ({pastBookings.length})</h2>
        {pastBookings.length === 0 ? (
          <div className="pa-empty-state">
            <p>No past reservations.</p>
          </div>
        ) : (
          <div className="pa-bookings-list">
            {pastBookings.map((booking) => (
              <div key={booking.id} className="pa-booking-card pa-booking-card--past">
                <div className="pa-booking-header">
                  <div className="pa-booking-guest">
                    <div className="pa-booking-avatar">
                      {booking.traveler_name?.[0]?.toUpperCase() || 'G'}
                    </div>
                    <div>
                      <div className="pa-booking-guest-name">{booking.traveler_name || 'Guest'}</div>
                      <div className="pa-booking-guest-email">{booking.traveler_email || ''}</div>
                    </div>
                  </div>
                  <div 
                    className="pa-booking-status"
                    style={{ color: getStatusColor(booking.status) }}
                  >
                    {booking.status}
                  </div>
                </div>
                <div className="pa-booking-details">
                  <div className="pa-booking-detail">
                    <span className="pa-detail-label">Check-in:</span>
                    <span className="pa-detail-value">{formatDate(booking.start_date)}</span>
                  </div>
                  <div className="pa-booking-detail">
                    <span className="pa-detail-label">Check-out:</span>
                    <span className="pa-detail-value">{formatDate(booking.end_date)}</span>
                  </div>
                  <div className="pa-booking-detail">
                    <span className="pa-detail-label">Guests:</span>
                    <span className="pa-detail-value">{booking.guests || 1}</span>
                  </div>
                  <div className="pa-booking-detail">
                    <span className="pa-detail-label">Total:</span>
                    <span className="pa-detail-value pa-detail-value--price">
                      {formatCurrency(booking.total_price)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

