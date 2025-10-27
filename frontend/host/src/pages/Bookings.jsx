import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../api/client'
import '../styles/Bookings.css'

const fontFamily = '"Airbnb Cereal VF", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'
const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const STATUS_TABS = [
  { key: 'PENDING', label: 'Requests' },
  { key: 'ACCEPTED', label: 'Upcoming' },
  { key: 'CANCELLED', label: 'Cancelled' }
]

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

const calculateNights = (start, end) => {
  const startDate = start ? new Date(start) : null
  const endDate = end ? new Date(end) : null
  if (!startDate || !endDate) return 0
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 0
  const diff = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

const buildLocationLabel = (property = {}) => {
  if (property.location) return property.location
  const parts = []
  if (property.city) parts.push(property.city)
  if (property.state) parts.push(property.state)
  if (!property.state && property.country) parts.push(property.country)
  else if (property.country) parts.push(property.country)
  return parts.length ? parts.join(', ') : 'Location not set'
}

export default function Bookings() {
  const [status, setStatus] = useState('PENDING')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [actingId, setActingId] = useState(null)

  const loadBookings = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/bookings/incoming', { params: { status } })
      setBookings(Array.isArray(data?.bookings) ? data.bookings : [])
    } catch (err) {
      const message = err?.response?.data?.error
      setError(message || 'We could not load your bookings right now.')
      setBookings([])
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    loadBookings()
    // Poll for new bookings every 30 seconds for real-time updates
    const pollInterval = setInterval(() => {
      loadBookings()
    }, 30000)
    
    return () => clearInterval(pollInterval)
  }, [loadBookings])

  const handleDecision = async (id, action) => {
    setActingId(id)
    setError('')
    try {
      const endpoint = action === 'accept' ? 'accept' : 'cancel'
      await api.post(`/bookings/${id}/${endpoint}`)
      await loadBookings()
    } catch (err) {
      const message = err?.response?.data?.error
      if (message === 'date_conflict') {
        setError('Those dates are already booked for this listing.')
      } else if (message === 'already_cancelled') {
        setError('This booking was already cancelled.')
      } else {
        setError(message || 'We could not update that booking. Please try again.')
      }
    } finally {
      setActingId(null)
    }
  }

  const summaryLabel = useMemo(() => {
    const tab = STATUS_TABS.find((t) => t.key === status)
    const noun = bookings.length === 1 ? 'booking' : 'bookings'
    return `${bookings.length} ${noun} • ${tab ? tab.label : status}`
  }, [bookings.length, status])

  return (
    <div className="bookings-page" style={{ fontFamily }}>
      <header className="bookings-page__header">
        <div>
          <h1>Bookings</h1>
          <p>Review guest requests, accept stays, or cancel when necessary.</p>
        </div>
        <div className="bookings-tabs" role="tablist" aria-label="Booking status filters">
          {STATUS_TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              role="tab"
              className={`bookings-tabs__button ${status === key ? 'bookings-tabs__button--active' : ''}`}
              onClick={() => setStatus(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="bookings-page__summary">{summaryLabel}</div>

      {error ? <div className="bookings-alert bookings-alert--error">{error}</div> : null}

      {loading ? (
        <div className="bookings-skeleton">Loading bookings…</div>
      ) : bookings.length === 0 ? (
        <div className="bookings-empty">
          <strong>No {status.toLowerCase()} bookings right now.</strong>
          <span>When a guest requests a stay, you will see it here.</span>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map((booking) => {
            const nights = calculateNights(booking.startDate, booking.endDate)
            const guests = typeof booking.guests === 'number' ? booking.guests : null

            return (
              <article key={booking.id} className="booking-card">
                <header className="booking-card__header">
                  <div>
                    <h2>{booking.property?.name || 'Untitled listing'}</h2>
                    <span>{buildLocationLabel(booking.property)}</span>
                  </div>
                  <span className={`booking-status booking-status--${booking.status?.toLowerCase() || 'pending'}`}>
                    {booking.status || 'PENDING'}
                  </span>
                </header>

                <div className="booking-card__body">
                  <div className="booking-card__row">
                    <span className="booking-card__label">Guest</span>
                    <div className="booking-card__value">
                      <strong>{booking.traveler?.name || 'Guest'}</strong>
                      <span>{booking.traveler?.email || 'No email provided'}</span>
                    </div>
                  </div>

                  <div className="booking-card__row">
                    <span className="booking-card__label">Stay</span>
                    <div className="booking-card__value">
                      <strong>{formatRange(booking.startDate, booking.endDate)}</strong>
                      <span>{nights ? `${nights} ${nights === 1 ? 'night' : 'nights'}` : 'Flexible nights'}</span>
                    </div>
                  </div>

                  <div className="booking-card__row">
                    <span className="booking-card__label">Guests</span>
                    <div className="booking-card__value">
                      <strong>{guests !== null ? guests : '—'}</strong>
                      <span>{guests === 1 ? 'guest' : 'guests'}</span>
                    </div>
                  </div>

                  <div className="booking-card__row">
                    <span className="booking-card__label">Requested</span>
                    <div className="booking-card__value">
                      <strong>{formatDate(booking.createdAt)}</strong>
                      <span>Submitted</span>
                    </div>
                  </div>

                  {booking.totalPrice && (
                    <div className="booking-card__row">
                      <span className="booking-card__label">Total</span>
                      <div className="booking-card__value">
                        <strong>${Number(booking.totalPrice).toFixed(2)}</strong>
                        <span>{nights ? `$${(Number(booking.totalPrice) / nights).toFixed(2)} per night` : 'Total amount'}</span>
                      </div>
                    </div>
                  )}

                  {booking.specialRequests && (
                    <div className="booking-card__row booking-card__row--full">
                      <span className="booking-card__label">Special Requests</span>
                      <div className="booking-card__value">
                        <p style={{ margin: 0, fontStyle: 'italic', color: '#484848' }}>{booking.specialRequests}</p>
                      </div>
                    </div>
                  )}
                </div>

                {status === 'PENDING' ? (
                  <footer className="booking-card__footer">
                    <button
                      type="button"
                      className="booking-button booking-button--primary"
                      onClick={() => handleDecision(booking.id, 'accept')}
                      disabled={actingId === booking.id}
                    >
                      {actingId === booking.id ? 'Accepting…' : 'Accept booking'}
                    </button>
                    <button
                      type="button"
                      className="booking-button booking-button--ghost"
                      onClick={() => handleDecision(booking.id, 'cancel')}
                      disabled={actingId === booking.id}
                    >
                      {actingId === booking.id ? 'Processing…' : 'Cancel request'}
                    </button>
                  </footer>
                ) : null}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
