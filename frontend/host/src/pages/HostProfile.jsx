import { useEffect, useMemo, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

const fontFamily = '"Airbnb Cereal VF", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'

const infoRowStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: '16px 0',
  borderBottom: '1px solid #ebebeb'
}

export default function HostProfile() {
  const { currentUser, refreshAuth } = useAuth()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    bio: ''
  })
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editingBio, setEditingBio] = useState(false)
  const [savingBio, setSavingBio] = useState(false)
  const [bioError, setBioError] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState('')

  const canSave = useMemo(() => {
    return Boolean(
      form.name.trim() &&
      form.phone.trim() &&
      form.location.trim()
    )
  }, [form.name, form.phone, form.location])

  useEffect(() => {
    if (currentUser) {
      setForm({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        location: currentUser.location || '',
        bio: currentUser.bio || ''
      })
    }
  }, [currentUser])

  const baseDetails = useMemo(() => ({
    name: form.name?.trim() || currentUser?.name || 'Host',
    email: form.email || currentUser?.email || 'Not provided',
    phone: form.phone || currentUser?.phone || 'Not provided',
    location: form.location || currentUser?.location || 'Not provided',
    bio: form.bio || currentUser?.bio || '',
    avatar_url: currentUser?.avatar_url || null
  }), [form, currentUser])

  const initial = (baseDetails.name || baseDetails.email || 'Host').charAt(0).toUpperCase()

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setAvatarError('Please upload a valid image file (JPEG, PNG, GIF, or WebP)')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('File size must be less than 5MB')
      return
    }

    setAvatarError('')
    setUploadingAvatar(true)

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await api.post('/auth/profile/picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      console.log('Avatar uploaded:', response.data)
      await refreshAuth()
    } catch (err) {
      console.error('Avatar upload error:', err)
      setAvatarError(err?.response?.data?.error || 'Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleAvatarDelete = async () => {
    if (!confirm('Are you sure you want to delete your profile picture?')) return

    setUploadingAvatar(true)
    setAvatarError('')

    try {
      await api.delete('/auth/profile/picture')
      await refreshAuth()
    } catch (err) {
      console.error('Avatar delete error:', err)
      setAvatarError('Failed to delete avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const startEditing = () => {
    setError('')
    setEditing(true)
  }

  const cancelEditing = () => {
    setError('')
    setEditing(false)
    setEditingBio(false)
    setBioError('')
    if (currentUser) {
      setForm({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        location: currentUser.location || '',
        bio: currentUser.bio || ''
      })
    }
  }

  const handleSave = async () => {
    setError('')
    setSaving(true)
    try {
      await api.put('/auth/profile', {
        name: form.name.trim(),
        phone: form.phone.trim(),
        location: form.location.trim(),
        bio: form.bio.trim()
      })
      await refreshAuth()
      setEditing(false)
      setEditingBio(false)
      setBioError('')
    } catch (err) {
      const message = err?.response?.data?.error
      if (message === 'phone_in_use') {
        setError('That phone number is already linked to another host.')
      } else if (message) {
        setError(message)
      } else {
        setError('Failed to update your profile. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  const startEditingBio = () => {
    setBioError('')
    setEditingBio(true)
  }

  const cancelEditingBio = () => {
    setBioError('')
    setEditingBio(false)
    if (currentUser) {
      setForm((prev) => ({
        ...prev,
        bio: currentUser.bio || ''
      }))
    }
  }

  const handleSaveBio = async () => {
    setBioError('')
    setSavingBio(true)
    try {
      await api.put('/auth/profile', {
        name: form.name.trim() || currentUser?.name || 'Host',
        phone: form.phone.trim() || currentUser?.phone || '',
        location: form.location.trim() || currentUser?.location || '',
        bio: form.bio.trim()
      })
      await refreshAuth()
      setEditingBio(false)
      setBioError('')
    } catch (err) {
      const message = err?.response?.data?.error
      setBioError(message || 'Failed to save your intro. Please try again.')
    } finally {
      setSavingBio(false)
    }
  }

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
          padding: '48px 56px',
          marginBottom: 48
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 32,
                fontWeight: 700,
                margin: 0,
                marginBottom: 12
              }}
            >
              My profile
            </h1>
            <p
              style={{
                margin: 0,
                maxWidth: 520,
                lineHeight: 1.6,
                color: '#484848'
              }}
            >
              Hosts and guests can see your profile and it may appear across Airbnb to help us build trust in our community.
              {' '}
              <a href="#" style={{ color: '#222', textDecoration: 'underline', fontWeight: 600 }}>Learn more</a>
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {editing ? (
              <button
                type="button"
                onClick={cancelEditing}
                style={{
                  border: '1px solid #222',
                  borderRadius: 20,
                  padding: '10px 18px',
                  fontSize: 14,
                  fontWeight: 600,
                  background: '#fff',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            ) : null}
            <button
              type="button"
              onClick={editing ? handleSave : startEditing}
              disabled={(editing && (!canSave || saving))}
              style={{
                border: 'none',
                borderRadius: 20,
                padding: '10px 20px',
                fontSize: 14,
                fontWeight: 600,
                background: editing ? '#222' : '#f7f7f7',
                color: editing ? '#fff' : '#222',
                cursor: saving ? 'wait' : 'pointer',
                opacity: editing && !canSave ? 0.5 : saving ? 0.7 : 1
              }}
            >
              {editing ? (saving ? 'Saving…' : 'Save changes') : 'Edit profile'}
            </button>
          </div>
        </header>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 56,
            marginTop: 40
          }}
        >
          <div
            style={{
              flex: '1 1 240px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 24
            }}
          >
            <div
              style={{
                width: 180,
                height: 180,
                borderRadius: '50%',
                background: baseDetails.avatar_url ? '#fff' : '#111',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 64,
                fontWeight: 700,
                letterSpacing: 2,
                boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
                overflow: 'hidden',
                border: baseDetails.avatar_url ? '2px solid #ebebeb' : 'none'
              }}
              aria-label="Profile avatar"
            >
              {baseDetails.avatar_url ? (
                <img
                  src={`http://localhost:4000${baseDetails.avatar_url}`}
                  alt={baseDetails.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <span>{initial || 'H'}</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <input
                type="file"
                id="avatar-upload"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleAvatarUpload}
                style={{ display: 'none' }}
                disabled={uploadingAvatar}
              />
              <label
                htmlFor="avatar-upload"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 16px',
                  borderRadius: 20,
                  border: '1px solid #000',
                  fontSize: 14,
                  fontWeight: 600,
                  background: '#fff',
                  cursor: uploadingAvatar ? 'wait' : 'pointer',
                  opacity: uploadingAvatar ? 0.6 : 1
                }}
              >
                <span>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#000"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                </span>
                {uploadingAvatar ? 'Uploading...' : baseDetails.avatar_url ? 'Change' : 'Add'}
              </label>
              {baseDetails.avatar_url && (
                <button
                  type="button"
                  onClick={handleAvatarDelete}
                  disabled={uploadingAvatar}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 20,
                    border: '1px solid #d93025',
                    fontSize: 14,
                    fontWeight: 600,
                    background: '#fff',
                    color: '#d93025',
                    cursor: uploadingAvatar ? 'wait' : 'pointer',
                    opacity: uploadingAvatar ? 0.6 : 1
                  }}
                >
                  Delete
                </button>
              )}
            </div>
            {avatarError && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: '#fff5f5',
                  color: '#c13515',
                  fontSize: 13,
                  textAlign: 'center',
                  maxWidth: 240
                }}
              >
                {avatarError}
              </div>
            )}
          </div>

          <div
            style={{
              flex: '2 1 320px',
              minWidth: 320
            }}
          >
            <div
              style={{
                border: '1px solid #ebebeb',
                borderRadius: 16,
                padding: '28px 32px',
                background: '#fff'
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 600,
                  marginBottom: 12
                }}
              >
                Account details
              </h2>
              <div style={{ borderTop: '1px solid #ebebeb' }}>
                <div style={infoRowStyle}>
                  <span
                    style={{
                      fontSize: 12,
                      letterSpacing: 0.6,
                      textTransform: 'uppercase',
                      color: '#717171'
                    }}
                  >
                    Full name
                  </span>
                  {editing ? (
                    <input
                      type="text"
                      value={form.name}
                      onChange={handleChange('name')}
                      placeholder="Full name"
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        border: '1px solid #dddddd',
                        borderRadius: 12,
                        fontSize: 16,
                        color: '#222',
                        outline: 'none'
                      }}
                      required
                    />
                  ) : (
                    <span style={{ fontSize: 16, fontWeight: 500 }}>
                      {baseDetails.name}
                    </span>
                  )}
                </div>
                <div style={infoRowStyle}>
                  <span
                    style={{
                      fontSize: 12,
                      letterSpacing: 0.6,
                      textTransform: 'uppercase',
                      color: '#717171'
                    }}
                  >
                    Email
                  </span>
                  {editing ? (
                    <input
                      type="email"
                      value={form.email}
                      readOnly
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        border: '1px solid #dddddd',
                        borderRadius: 12,
                        fontSize: 16,
                        color: '#717171',
                        background: '#f7f7f7'
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: 16, fontWeight: 500 }}>
                      {baseDetails.email}
                    </span>
                  )}
                </div>
                <div style={infoRowStyle}>
                  <span
                    style={{
                      fontSize: 12,
                      letterSpacing: 0.6,
                      textTransform: 'uppercase',
                      color: '#717171'
                    }}
                  >
                    Phone
                  </span>
                  {editing ? (
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={handleChange('phone')}
                      placeholder="Phone number"
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        border: '1px solid #dddddd',
                        borderRadius: 12,
                        fontSize: 16,
                        color: '#222',
                        outline: 'none'
                      }}
                      required
                    />
                  ) : (
                    <span style={{ fontSize: 16, fontWeight: 500 }}>
                      {baseDetails.phone}
                    </span>
                  )}
                </div>
                <div style={{ ...infoRowStyle, borderBottom: 'none', paddingBottom: 0 }}>
                  <span
                    style={{
                      fontSize: 12,
                      letterSpacing: 0.6,
                      textTransform: 'uppercase',
                      color: '#717171'
                    }}
                  >
                    Location
                  </span>
                  {editing ? (
                    <input
                      type="text"
                      value={form.location}
                      onChange={handleChange('location')}
                      placeholder="City, country"
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        border: '1px solid #dddddd',
                        borderRadius: 12,
                        fontSize: 16,
                        color: '#222',
                        outline: 'none'
                      }}
                      required
                    />
                  ) : (
                    <span style={{ fontSize: 16, fontWeight: 500 }}>
                      {baseDetails.location}
                    </span>
                  )}
                </div>
              </div>
              {error ? (
                <div
                  style={{
                    marginTop: 16,
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: '#fff5f5',
                    color: '#c13515',
                    fontSize: 14
                  }}
                >
                  {error}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section
        style={{
          background: '#fff',
          borderRadius: 24,
          border: '1px solid #ebebeb',
          padding: '40px 48px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.04)'
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 600,
            marginBottom: 12
          }}
        >
          About me
        </h2>
        <p style={{ margin: 0, color: '#717171', fontSize: 14, marginBottom: 24 }}>
          Write something fun and punchy.
        </p>
        {editingBio ? (
          <>
            <textarea
              value={form.bio}
              onChange={handleChange('bio')}
              placeholder="Tell guests about yourself, your space, and what you love about hosting."
              rows={6}
              style={{
                width: '100%',
                padding: '16px 18px',
                borderRadius: 16,
                border: '1px solid #dddddd',
                fontSize: 16,
                lineHeight: 1.5,
                color: '#222',
                resize: 'vertical',
                background: '#fff'
              }}
            />
            {bioError ? (
              <div
                style={{
                  marginTop: 16,
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: '#fff5f5',
                  color: '#c13515',
                  fontSize: 14
                }}
              >
                {bioError}
              </div>
            ) : null}
            <div
              style={{
                marginTop: 24,
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 12
              }}
            >
              <button
                type="button"
                onClick={cancelEditingBio}
                style={{
                  border: '1px solid #222',
                  borderRadius: 12,
                  padding: '12px 20px',
                  fontSize: 15,
                  fontWeight: 600,
                  background: '#fff',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBio}
                disabled={savingBio}
                style={{
                  border: 'none',
                  borderRadius: 12,
                  padding: '12px 24px',
                  fontSize: 15,
                  fontWeight: 600,
                  background: '#222',
                  color: '#fff',
                  cursor: savingBio ? 'wait' : 'pointer',
                  opacity: savingBio ? 0.7 : 1
                }}
              >
                {savingBio ? 'Saving…' : 'Save intro'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                padding: '24px 28px',
                borderRadius: 16,
                border: '1px solid #ebebeb',
                background: '#fafafa'
              }}
            >
              {baseDetails.bio ? (
                <p
                  style={{
                    margin: 0,
                    fontSize: 16,
                    lineHeight: 1.6,
                    color: '#222'
                  }}
                >
                  {baseDetails.bio}
                </p>
              ) : (
                <p
                  style={{
                    margin: 0,
                    fontSize: 16,
                    lineHeight: 1.6,
                    color: '#717171'
                  }}
                >
                  <strong style={{ color: '#484848' }}>Introduce yourself.</strong>
                  {' '}
                  Share what makes you a great host and what guests can look forward to.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={startEditingBio}
              style={{
                border: '1px solid #222',
                borderRadius: 12,
                padding: '14px 18px',
                fontSize: 15,
                fontWeight: 600,
                background: '#fff',
                cursor: 'pointer',
                display: 'inline-flex',
                gap: 8,
                alignItems: 'center',
                marginTop: 24
              }}
            >
              <span>{baseDetails.bio ? 'Edit intro' : 'Add intro'}</span>
            </button>
          </>
        )}
      </section>
    </div>
  )
}
