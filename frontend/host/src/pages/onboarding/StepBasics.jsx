import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/client'

const fontFamily = "'Airbnb Cereal VF', Circular, -apple-system, 'system-ui', Roboto, 'Helvetica Neue', sans-serif";

function Counter({ label, value, setValue }){
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 0', borderBottom:'1px solid #eee' }}>
      <div style={{ fontSize:16 }}>{label}</div>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <button type="button" onClick={()=>setValue(Math.max(1, (value||1)-1))} style={{ width:36, height:36, borderRadius:9999, border:'1px solid #ddd', background:'#fff' }}>−</button>
        <div style={{ minWidth:24, textAlign:'center' }}>{value||0}</div>
        <button type="button" onClick={()=>setValue((value||0)+1)} style={{ width:36, height:36, borderRadius:9999, border:'1px solid #ddd', background:'#fff' }}>+</button>
      </div>
    </div>
  )
}

export default function StepBasics(){
  const nav = useNavigate()
  const { id } = useParams()
  const [maxGuests, setMaxGuests] = useState(1)
  const [bedrooms, setBedrooms] = useState(1)
  const [beds, setBeds] = useState(1)
  const [bathrooms, setBathrooms] = useState(1)
  const [error, setError] = useState('')

  useEffect(()=>{ (async()=>{
    try{ const res = await api.get(`/properties/${id}`); const p=res.data.property||{}; setMaxGuests(p.max_guests||1); setBedrooms(p.bedrooms||1); setBeds(p.beds||1); setBathrooms(p.bathrooms||1) }catch{}
  })() }, [id])

  async function next(){
    if (maxGuests < 1 || bedrooms < 1 || beds < 1 || bathrooms < 1) {
      setError('Please enter at least 1 for guests, bedrooms, beds, and bathrooms.')
      return
    }
    await api.put(`/properties/${id}`, { max_guests: maxGuests, bedrooms, beds, bathrooms })
    if (error) setError('')
    nav(`/onboarding/${id}/location`)
  }

  const footer = (
    <>
      <button onClick={()=>nav(`/onboarding/${id}/privacy`)} style={{ border:'1px solid #ddd', padding:'12px 18px', borderRadius:8, background:'#fff' }}>Back</button>
      <button onClick={next} style={{ background:'#222', color:'#fff', border:'none', padding:'12px 18px', borderRadius:8 }}>Next</button>
    </>
  )

  return (
    <div style={{ maxWidth: 960, margin: '72px auto', textAlign:'center' }}>
      <h2 style={{ fontSize: 44, marginBottom: 8 }}>Share some basics about your place</h2>
      <div>
        <Counter label="Guests" value={maxGuests} setValue={setMaxGuests} />
        <Counter label="Bedrooms" value={bedrooms} setValue={setBedrooms} />
        <Counter label="Beds" value={beds} setValue={setBeds} />
        <Counter label="Bathrooms" value={bathrooms} setValue={setBathrooms} />
      </div>
      {error && <div style={{ color:'#d93025', marginTop:16, fontFamily }}>{error}</div>}
      <div style={{ marginTop: 24, display:'flex', justifyContent:'space-between' }}>{footer}</div>
    </div>
  )
}
