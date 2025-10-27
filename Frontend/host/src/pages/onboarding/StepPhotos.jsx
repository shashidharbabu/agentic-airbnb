import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/client'
import OnboardingLayout from '../../components/OnboardingLayout'

export default function StepPhotos() {
  const nav = useNavigate()
  const { id } = useParams()
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadPhotos()
  }, [id])

  async function loadPhotos() {
    try {
      const res = await api.get(`/properties/${id}`)
      if (res.data.photos && Array.isArray(res.data.photos)) {
        setPhotos(res.data.photos)
      }
    } catch (err) {
      console.error('Failed to load photos:', err)
    }
  }

  async function handleFileChange(e) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      for (let i = 0; i < files.length; i++) {
        formData.append('photos', files[i])
      }

      await api.post(`/properties/${id}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      await loadPhotos()
      e.target.value = '' // Reset input
    } catch (err) {
      setError('Failed to upload photos. Please try again.')
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(photoId) {
    try {
      await api.delete(`/properties/${id}/photos/${photoId}`)
      setPhotos(photos.filter(p => p.id !== photoId))
    } catch (err) {
      setError('Failed to delete photo.')
      console.error('Delete error:', err)
    }
  }

  function next() {
    if (photos.length === 0) {
      setError('Please add at least one photo to continue.')
      return
    }
    nav(`/onboarding/${id}/pricing`)
  }

  const footer = (
    <>
      <button 
        onClick={() => nav(`/onboarding/${id}/title`)} 
        style={{ 
          border: '1px solid #ddd', 
          padding: '14px 20px', 
          borderRadius: 12, 
          background: '#fff', 
          fontWeight: 600,
          cursor: 'pointer'
        }}
      >
        Back
      </button>
      <button 
        onClick={next} 
        disabled={uploading}
        style={{ 
          background: uploading ? '#ddd' : '#222', 
          color: '#fff', 
          border: 'none', 
          padding: '14px 20px', 
          borderRadius: 12, 
          fontWeight: 600,
          cursor: uploading ? 'not-allowed' : 'pointer'
        }}
      >
        {uploading ? 'Uploading...' : 'Next'}
      </button>
    </>
  )

  return (
    <OnboardingLayout 
      title="Add photos of your place" 
      subtitle="Show guests what makes your space special"
      footer={footer}
    >
      <div style={{ 
        fontFamily: '"Airbnb Cereal VF", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif' 
      }}>
        {/* Upload Section */}
        <div style={{ 
          marginBottom: 32, 
          textAlign: 'center',
          padding: '48px 24px',
          border: '2px dashed #ddd',
          borderRadius: 16,
          background: '#fafafa',
          position: 'relative'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📷</div>
          <h3 style={{ 
            fontSize: 18, 
            fontWeight: 600, 
            margin: '0 0 8px 0',
            color: '#222'
          }}>
            Upload photos
          </h3>
          <p style={{ 
            color: '#717171', 
            margin: '0 0 24px 0',
            fontSize: 14
          }}>
            Add at least 5 photos. You can add more later.
          </p>
          
          <label style={{ 
            display: 'inline-block',
            background: '#FF385C',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: 12,
            fontWeight: 600,
            cursor: uploading ? 'not-allowed' : 'pointer',
            opacity: uploading ? 0.6 : 1,
            transition: 'all 0.2s'
          }}>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              disabled={uploading}
              style={{ display: 'none' }}
            />
            {uploading ? '📤 Uploading...' : '📷 Choose Photos'}
          </label>
          
          <p style={{ 
            color: '#717171', 
            margin: '12px 0 0 0',
            fontSize: 12
          }}>
            You can select multiple photos at once
          </p>
        </div>

        {/* Photos Grid */}
        {photos.length > 0 && (
          <div>
            <h3 style={{ 
              fontSize: 18, 
              fontWeight: 600, 
              margin: '0 0 16px 0',
              color: '#222'
            }}>
              Your photos ({photos.length})
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: 16
            }}>
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: '#f0f0f0',
                    border: '1px solid #ebebeb'
                  }}
                >
                  <img
                    src={`http://localhost:4000${photo.file_path}`}
                    alt="Property"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.src = photo.file_path.startsWith('http') 
                        ? photo.file_path 
                        : `http://localhost:4000${photo.file_path}`
                    }}
                  />
                  <button
                    onClick={() => handleDelete(photo.id)}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      border: 'none',
                      background: 'rgba(255, 255, 255, 0.95)',
                      color: '#222',
                      fontSize: 20,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#ff385c'
                      e.currentTarget.style.color = '#fff'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'
                      e.currentTarget.style.color = '#222'
                    }}
                    title="Delete photo"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{ 
            color: '#d93025', 
            marginTop: 16, 
            padding: '12px 16px',
            background: '#fce8e6',
            borderRadius: 8,
            fontSize: 14
          }}>
            {error}
          </div>
        )}

        {/* Tips */}
        <div style={{ 
          marginTop: 32, 
          padding: 20,
          background: '#f7f7f7',
          borderRadius: 12,
          border: '1px solid #ebebeb'
        }}>
          <h4 style={{ 
            fontSize: 14, 
            fontWeight: 600, 
            margin: '0 0 12px 0',
            color: '#222'
          }}>
            📸 Photo tips
          </h4>
          <ul style={{ 
            margin: 0, 
            paddingLeft: 20,
            color: '#717171',
            fontSize: 13,
            lineHeight: 1.6
          }}>
            <li>Use natural light when possible</li>
            <li>Show all rooms and key features</li>
            <li>Keep spaces clean and clutter-free</li>
            <li>Include outdoor spaces if available</li>
            <li>High-resolution photos work best</li>
          </ul>
        </div>
      </div>
    </OnboardingLayout>
  )
}

