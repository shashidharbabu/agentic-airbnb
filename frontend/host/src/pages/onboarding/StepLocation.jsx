import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/client'
import OnboardingLayout from '../../components/OnboardingLayout'

export default function StepLocation(){
  const nav = useNavigate()
  const { id } = useParams()
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [country, setCountry] = useState('United States')
  const [error, setError] = useState('')

  useEffect(()=>{ (async()=>{
    try{ const res = await api.get(`/properties/${id}`); const p=res.data.property||{}; setStreet(p.street||''); setCity(p.city||''); setState(p.state||''); setZip(p.zip||''); setCountry(p.country||'United States') }catch{}
  })() }, [id])

  async function next(){
    const trimmedStreet = street.trim()
    const trimmedCity = city.trim()
    const trimmedState = state.trim()
    const trimmedZip = zip.trim()
    const trimmedCountry = country.trim()

    if (!trimmedStreet || !trimmedCity || !trimmedState || !trimmedZip || !trimmedCountry) {
      setError('Please fill in street, city, state, ZIP, and country before continuing.')
      return
    }

    const locationLabel = [trimmedCity, trimmedState].filter(Boolean).join(', ')

    await api.put(`/properties/${id}`, {
      street: trimmedStreet,
      city: trimmedCity,
      state: trimmedState,
      zip: trimmedZip,
      country: trimmedCountry,
      location: locationLabel || trimmedCountry
    })
    if (error) setError('')
    nav(`/onboarding/${id}/highlights`)
  }

  const footer = (
    <>
      <button onClick={()=>nav(`/onboarding/${id}/privacy`)} style={{ border:'1px solid #ddd', padding:'14px 20px', borderRadius:12, background:'#fff', fontWeight:600 }}>Back</button>
      <button onClick={next} style={{ background:'#222', color:'#fff', border:'none', padding:'14px 20px', borderRadius:12, fontWeight:600 }}>Next</button>
    </>
  )

  return (
    <OnboardingLayout title="Where's your place located?" footer={footer}>
      <div style={{ display:'grid', gap:14 }}>
        <input placeholder="Street address" value={street} onChange={e=>{ setStreet(e.target.value); if (error) setError('') }} style={{ height: 48, padding: '0 12px', borderRadius:12, border:'1px solid #ddd' }} />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <input placeholder="City" value={city} onChange={e=>{ setCity(e.target.value); if (error) setError('') }} style={{ height: 48, padding: '0 12px', borderRadius:12, border:'1px solid #ddd' }} />
          <input placeholder="State" value={state} onChange={e=>{ setState(e.target.value); if (error) setError('') }} style={{ height: 48, padding: '0 12px', borderRadius:12, border:'1px solid #ddd' }} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <input placeholder="ZIP" value={zip} onChange={e=>{ setZip(e.target.value); if (error) setError('') }} style={{ height: 48, padding: '0 12px', borderRadius:12, border:'1px solid #ddd' }} />
          <input placeholder="Country" value={country} onChange={e=>{ setCountry(e.target.value); if (error) setError('') }} style={{ height: 48, padding: '0 12px', borderRadius:12, border:'1px solid #ddd' }} />
        </div>
      </div>
      {error && <div style={{ color:'#d93025', marginTop:16, fontFamily:"'Airbnb Cereal VF', Circular, -apple-system, 'system-ui', Roboto, 'Helvetica Neue', sans-serif" }}>{error}</div>}
    </OnboardingLayout>
  )
}
