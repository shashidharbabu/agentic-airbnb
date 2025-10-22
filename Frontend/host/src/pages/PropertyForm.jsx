import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

export default function PropertyForm() {
  const nav = useNavigate()
  const [form, setForm] = useState({
    name: '', description: '', location: '', address: '',
    price_per_night: 0, bedrooms: 1, bathrooms: 1, amenities: ''
  })
  const [error, setError] = useState('')
  const [propertyId, setPropertyId] = useState(null)
  const [files, setFiles] = useState([])
  const [photos, setPhotos] = useState([])

  async function submit(e) {
    e.preventDefault()
    setError('')
    try {
      const payload = {
        ...form,
        price_per_night: Number(form.price_per_night),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        amenities: form.amenities.split(',').map(s=>s.trim()).filter(Boolean)
      }
      const res = await api.post('/properties', payload)
      const id = res.data?.id
      if (id) setPropertyId(id)
      else nav('/')
    } catch (err) {
      setError(err?.response?.data?.error || 'Error')
    }
  }

  async function loadPhotos(id){
    try {
      const res = await api.get(`/properties/${id}`)
      setPhotos(res.data?.photos || [])
    } catch {}
  }

  useEffect(()=>{ if(propertyId) loadPhotos(propertyId) }, [propertyId])

  async function uploadPhotos(){
    if (!propertyId || files.length === 0) return
    const fd = new FormData()
    for (const f of files) fd.append('photos', f)
    try {
      await api.post(`/properties/${propertyId}/photos`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setFiles([])
      loadPhotos(propertyId)
    } catch (e){ setError(e?.response?.data?.error || 'Upload failed') }
  }

  return (
    <div style={{ maxWidth: 560, margin: '24px auto', fontFamily: 'system-ui, sans-serif' }}>
      <h2>{propertyId ? `Property #${propertyId}` : 'New property'}</h2>
      {!propertyId && (
        <form onSubmit={submit}>
          {['name','description','location','address','price_per_night','bedrooms','bathrooms','amenities'].map((k)=> (
            <div key={k} style={{ marginBottom: 8 }}>
              <label>{k}</label>
              <input value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} style={{ width: '100%' }} />
            </div>
          ))}
          {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
          <button type="submit">Create</button>
        </form>
      )}

      {propertyId && (
        <div style={{ marginTop: 16 }}>
          <h3>Upload photos</h3>
          <input type="file" multiple onChange={e=>setFiles(Array.from(e.target.files||[]))} />
          <button onClick={uploadPhotos} style={{ marginLeft: 8 }}>Upload</button>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: 8, marginTop: 12 }}>
            {photos.map(p => (
              <div key={p.id} style={{ border: '1px solid #eee', padding: 6, borderRadius: 6 }}>
                <img src={p.file_path} alt="property" style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 4 }} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <button onClick={()=>nav('/')} style={{ background: '#FF385C', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 12px', fontWeight: 700 }}>Finish</button>
          </div>
        </div>
      )}
    </div>
  )
}
