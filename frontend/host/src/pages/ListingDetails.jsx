import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import '../styles/ListingDetails.css'

const fontFamily = '"Airbnb Cereal VF", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'

const createEmptyForm = () => ({
  name: '',
  description: '',
  property_type: '',
  privacy_type: '',
  location: '',
  address: '',
  street: '',
  unit: '',
  city: '',
  state: '',
  zip: '',
  country: '',
  price_per_night: '',
  weekend_premium_percent: '',
  discountWeekly: '',
  discountMonthly: '',
  bedrooms: '',
  bathrooms: '',
  beds: '',
  max_guests: '',
  amenitiesText: '',
  highlightsText: '',
  safetyText: '',
  booking_mode: 'APPROVAL',
  availability_start: '',
  availability_end: '',
  latitude: '',
  longitude: ''
})

const listToText = (value) => (Array.isArray(value) && value.length ? value.join('\n') : '')

const textToList = (value) => {
  if (!value) return []
  return value
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

const toDateInput = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

const parseInteger = (value) => {
  if (value === '' || value === null || value === undefined) return null
  const parsed = parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : null
}

const parseFloatSafe = (value) => {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export default function ListingDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { refreshAuth } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editing, setEditing] = useState(false)
  const [property, setProperty] = useState(null)
  const [form, setForm] = useState(() => createEmptyForm())

  const propertyId = useMemo(() => Number(id), [id])

  const syncForm = useCallback((raw) => {
    if (!raw) return
    setForm({
      name: raw.name || '',
      description: raw.description || '',
      property_type: raw.property_type || '',
      privacy_type: raw.privacy_type || '',
      location: raw.location || '',
      address: raw.address || '',
      street: raw.street || '',
      unit: raw.unit || '',
      city: raw.city || '',
      state: raw.state || '',
      zip: raw.zip || '',
      country: raw.country || '',
      price_per_night: raw.price_per_night !== null && raw.price_per_night !== undefined ? String(raw.price_per_night) : '',
      weekend_premium_percent:
        raw.weekend_premium_percent !== null && raw.weekend_premium_percent !== undefined
          ? String(raw.weekend_premium_percent)
          : '',
      discountWeekly:
        raw.discounts && typeof raw.discounts.weekly === 'number' ? String(raw.discounts.weekly) : '',
      discountMonthly:
        raw.discounts && typeof raw.discounts.monthly === 'number' ? String(raw.discounts.monthly) : '',
      bedrooms: raw.bedrooms !== null && raw.bedrooms !== undefined ? String(raw.bedrooms) : '',
      bathrooms: raw.bathrooms !== null && raw.bathrooms !== undefined ? String(raw.bathrooms) : '',
      beds: raw.beds !== null && raw.beds !== undefined ? String(raw.beds) : '',
      max_guests: raw.max_guests !== null && raw.max_guests !== undefined ? String(raw.max_guests) : '',
      amenitiesText: listToText(raw.amenities),
      highlightsText: listToText(raw.highlights),
      safetyText: listToText(raw.safety),
      booking_mode: raw.booking_mode || 'APPROVAL',
      availability_start: toDateInput(raw.availability_start),
      availability_end: toDateInput(raw.availability_end),
      latitude: raw.latitude !== null && raw.latitude !== undefined ? String(raw.latitude) : '',
      longitude: raw.longitude !== null && raw.longitude !== undefined ? String(raw.longitude) : ''
    })
  }, [])

  const loadProperty = useCallback(async () => {
    if (!propertyId) return
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get(`/properties/${propertyId}`)
      if (!data?.property) {
        setError('We could not find that listing.')
        return
      }
      setProperty(data.property)
      syncForm(data.property)
    } catch (err) {
      if (err?.response?.status === 404) {
        setError('We could not find that listing.')
      } else if (err?.response?.status === 401) {
        setError('Please sign in to manage this listing.')
        await refreshAuth()
      } else if (err?.response?.status === 403) {
        setError('You do not have permission to edit this listing.')
      } else {
        setError('Something went wrong while loading this listing.')
      }
    } finally {
      setLoading(false)
    }
  }, [propertyId, refreshAuth, syncForm])

  useEffect(() => {
    loadProperty()
  }, [loadProperty])

  const handleChange = (field) => (event) => {
    const { value } = event.target
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleCancel = () => {
    setEditing(false)
    setError('')
    setSuccess('')
    if (property) syncForm(property)
  }

  const validateForm = () => {
    if (!form.name.trim()) return 'Listing name is required.'
    if (!form.location.trim()) return 'Include a general location for guests.'
    const price = Number(form.price_per_night)
    if (form.price_per_night === '' || !Number.isFinite(price) || price < 0) return 'Nightly price must be zero or more.'
    const bedrooms = Number(form.bedrooms)
    if (form.bedrooms === '' || !Number.isFinite(bedrooms) || bedrooms < 0) return 'Bedrooms must be zero or more.'
    const bathrooms = Number(form.bathrooms)
    if (form.bathrooms === '' || !Number.isFinite(bathrooms) || bathrooms < 0) return 'Bathrooms must be zero or more.'
    return ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!propertyId) return
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }
    setError('')
    setSuccess('')
    setSaving(true)

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      property_type: form.property_type.trim() || null,
      privacy_type: form.privacy_type || null,
      location: form.location.trim(),
      address: form.address.trim() || null,
      street: form.street.trim() || null,
      unit: form.unit.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      zip: form.zip.trim() || null,
      country: form.country.trim() || null,
      price_per_night: Number(form.price_per_night),
      weekend_premium_percent: parseFloatSafe(form.weekend_premium_percent) ?? 0,
      discounts: {
        weekly: parseFloatSafe(form.discountWeekly) ?? 0,
        monthly: parseFloatSafe(form.discountMonthly) ?? 0
      },
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
  beds: parseInteger(form.beds),
  max_guests: parseInteger(form.max_guests),
      amenities: textToList(form.amenitiesText),
      highlights: textToList(form.highlightsText),
      safety: textToList(form.safetyText),
      booking_mode: form.booking_mode,
      availability_start: form.availability_start || null,
      availability_end: form.availability_end || null,
      latitude: parseFloatSafe(form.latitude),
      longitude: parseFloatSafe(form.longitude)
    }

    try {
      const { data } = await api.put(`/properties/${propertyId}`, payload)
      if (data?.property) {
        setProperty(data.property)
        syncForm(data.property)
        setEditing(false)
        setSuccess('Listing updated successfully.')
      } else {
        setSuccess('Changes saved.')
      }
    } catch (err) {
      const message = err?.response?.data?.error
      if (message) {
        setError(typeof message === 'string' ? message : 'Unable to save changes.')
      } else {
        setError('Unable to save changes right now. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  const statusLabel = property?.status || 'Live'
  const locationLabel = useMemo(() => {
    if (!property) return ''
    const parts = []
    if (property.city) parts.push(property.city)
    if (property.state) parts.push(property.state)
    if (!property.state && property.country) parts.push(property.country)
    return parts.length ? parts.join(', ') : property.location || 'Location not set'
  }, [property])

  if (!propertyId) {
    return (
      <div className="listing-details-page" style={{ fontFamily }}>
        <div className="listing-details__empty">We could not determine which listing to load.</div>
      </div>
    )
  }

  return (
    <div className="listing-details-page" style={{ fontFamily }}>
      <header className="listing-details__header">
        <div className="listing-details__breadcrumbs">
          <button type="button" onClick={() => navigate(-1)} aria-label="Back" className="listing-details__back">
            <span aria-hidden="true">←</span>
            Back to listings
          </button>
        </div>
        <div className="listing-details__header-main">
          <div>
            <h1>{form.name || 'Untitled listing'}</h1>
            <p>{locationLabel}</p>
          </div>
          <div className="listing-details__status">
            <span className={`listing-details__status-dot listing-details__status-dot--${statusLabel?.toLowerCase() || 'live'}`} />
            {statusLabel}
          </div>
        </div>
        <div className="listing-details__header-actions">
          {editing ? (
            <div className="listing-details__action-group">
              <button type="button" className="outline-button" onClick={handleCancel} disabled={saving}>
                Cancel
              </button>
              <button type="submit" form="listing-details-form" className="primary-button" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          ) : (
            <button type="button" className="primary-button" onClick={() => setEditing(true)} disabled={loading || !!error}>
              Edit listing
            </button>
          )}
        </div>
      </header>

      {error ? <div className="listing-details__alert listing-details__alert--error">{error}</div> : null}
      {success ? <div className="listing-details__alert listing-details__alert--success">{success}</div> : null}

      {loading ? (
        <div className="listing-details__skeleton">Loading listing details…</div>
      ) : !property ? (
        <div className="listing-details__empty">We could not load this listing.</div>
      ) : (
        <form id="listing-details-form" className="listing-details__form" onSubmit={handleSubmit}>
          <section className="listing-details__section">
            <header>
              <h2>Basics</h2>
              <p>Update essential information for guests.</p>
            </header>
            <div className="listing-details__grid listing-details__grid--two">
              <label>
                <span>Name</span>
                <input type="text" value={form.name} onChange={handleChange('name')} disabled={!editing} required />
              </label>
              <label>
                <span>Property type</span>
                <input type="text" value={form.property_type} onChange={handleChange('property_type')} disabled={!editing} placeholder="e.g. Apartment" />
              </label>
              <label>
                <span>Privacy type</span>
                <select value={form.privacy_type} onChange={handleChange('privacy_type')} disabled={!editing}>
                  <option value="">Select</option>
                  <option value="Entire place">Entire place</option>
                  <option value="Room">Room</option>
                  <option value="Shared">Shared</option>
                </select>
              </label>
              <label>
                <span>Booking mode</span>
                <select value={form.booking_mode} onChange={handleChange('booking_mode')} disabled={!editing}>
                  <option value="APPROVAL">Request to book</option>
                  <option value="INSTANT">Instant book</option>
                </select>
              </label>
            </div>
            <label className="listing-details__fullwidth">
              <span>Description</span>
              <textarea value={form.description} onChange={handleChange('description')} disabled={!editing} rows={4} placeholder="Describe your place." />
            </label>
          </section>

          <section className="listing-details__section">
            <header>
              <h2>Location</h2>
              <p>Keep address details up to date so guests can find you.</p>
            </header>
            <div className="listing-details__grid listing-details__grid--two">
              <label>
                <span>Location label</span>
                <input type="text" value={form.location} onChange={handleChange('location')} disabled={!editing} placeholder="e.g. San Jose, California" />
              </label>
              <label>
                <span>Street</span>
                <input type="text" value={form.street} onChange={handleChange('street')} disabled={!editing} />
              </label>
              <label>
                <span>Unit</span>
                <input type="text" value={form.unit} onChange={handleChange('unit')} disabled={!editing} />
              </label>
              <label>
                <span>City</span>
                <input type="text" value={form.city} onChange={handleChange('city')} disabled={!editing} />
              </label>
              <label>
                <span>State / Province</span>
                <input type="text" value={form.state} onChange={handleChange('state')} disabled={!editing} />
              </label>
              <label>
                <span>Postal code</span>
                <input type="text" value={form.zip} onChange={handleChange('zip')} disabled={!editing} />
              </label>
              <label>
                <span>Country</span>
                <input type="text" value={form.country} onChange={handleChange('country')} disabled={!editing} />
              </label>
              <label>
                <span>Address line</span>
                <input type="text" value={form.address} onChange={handleChange('address')} disabled={!editing} placeholder="Optional" />
              </label>
              <label>
                <span>Latitude</span>
                <input type="text" value={form.latitude} onChange={handleChange('latitude')} disabled={!editing} />
              </label>
              <label>
                <span>Longitude</span>
                <input type="text" value={form.longitude} onChange={handleChange('longitude')} disabled={!editing} />
              </label>
            </div>
          </section>

          <section className="listing-details__section">
            <header>
              <h2>Spaces</h2>
              <p>Let guests know how many people you can host comfortably.</p>
            </header>
            <div className="listing-details__grid listing-details__grid--four">
              <label>
                <span>Bedrooms</span>
                <input type="number" min="0" value={form.bedrooms} onChange={handleChange('bedrooms')} disabled={!editing} />
              </label>
              <label>
                <span>Bathrooms</span>
             <input type="number" min="0" step="1" value={form.bathrooms} onChange={handleChange('bathrooms')} disabled={!editing} />
              </label>
              <label>
                <span>Beds</span>
                <input type="number" min="0" value={form.beds} onChange={handleChange('beds')} disabled={!editing} />
              </label>
              <label>
                <span>Maximum guests</span>
                <input type="number" min="0" value={form.max_guests || ''} onChange={handleChange('max_guests')} disabled={!editing} />
              </label>
            </div>
          </section>

          <section className="listing-details__section">
            <header>
              <h2>Amenities & highlights</h2>
              <p>List each item on a new line. We will create guest-friendly tags.</p>
            </header>
            <div className="listing-details__grid listing-details__grid--three">
              <label>
                <span>Amenities</span>
                <textarea value={form.amenitiesText} onChange={handleChange('amenitiesText')} disabled={!editing} rows={6} placeholder="Wifi\nKitchen\nFree parking" />
              </label>
              <label>
                <span>Highlights</span>
                <textarea value={form.highlightsText} onChange={handleChange('highlightsText')} disabled={!editing} rows={6} placeholder="City skyline view" />
              </label>
              <label>
                <span>Safety</span>
                <textarea value={form.safetyText} onChange={handleChange('safetyText')} disabled={!editing} rows={6} placeholder="Smoke detector\nFire extinguisher" />
              </label>
            </div>
          </section>

          <section className="listing-details__section">
            <header>
              <h2>Pricing & availability</h2>
              <p>Adjust nightly rate and calendar window.</p>
            </header>
            <div className="listing-details__grid listing-details__grid--two">
              <label>
                <span>Base price (per night)</span>
                <div className="listing-details__input-prefix">
                  <span>$</span>
              <input type="number" min="0" step="0.01" value={form.price_per_night} onChange={handleChange('price_per_night')} disabled={!editing} />
                </div>
              </label>
              <label>
                <span>Weekend premium (%)</span>
                <input type="number" min="0" step="0.5" value={form.weekend_premium_percent} onChange={handleChange('weekend_premium_percent')} disabled={!editing} />
              </label>
              <label>
                <span>Weekly discount (%)</span>
                <input type="number" min="0" step="0.5" value={form.discountWeekly} onChange={handleChange('discountWeekly')} disabled={!editing} />
              </label>
              <label>
                <span>Monthly discount (%)</span>
                <input type="number" min="0" step="0.5" value={form.discountMonthly} onChange={handleChange('discountMonthly')} disabled={!editing} />
              </label>
              <label>
                <span>Available from</span>
                <input type="date" value={form.availability_start} onChange={handleChange('availability_start')} disabled={!editing} />
              </label>
              <label>
                <span>Available until</span>
                <input type="date" value={form.availability_end} onChange={handleChange('availability_end')} disabled={!editing} />
              </label>
            </div>
          </section>
        </form>
      )}
    </div>
  )
}
