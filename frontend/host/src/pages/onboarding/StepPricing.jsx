import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/client'
import OnboardingLayout from '../../components/OnboardingLayout'

export default function StepPricing(){
  const nav = useNavigate()
  const { id } = useParams()
  const [price, setPrice] = useState(0)
  const [error, setError] = useState('')

  useEffect(()=>{ (async()=>{
    try{ const res = await api.get(`/properties/${id}`); const p=res.data.property||{}; setPrice(p.price_per_night||0) }catch{}
  })() }, [id])

  async function next(){
    const numericPrice = Number(price)
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setError('Enter a nightly price greater than 0.')
      return
    }
    await api.put(`/properties/${id}`, { price_per_night: numericPrice })
    if (error) setError('')
    nav(`/onboarding/${id}/booking`)
  }

  const footer = (
    <>
      <button onClick={()=>nav(`/onboarding/${id}/title`)} style={{ border:'1px solid #ddd', padding:'14px 20px', borderRadius:12, background:'#fff', fontWeight:600 }}>Back</button>
      <button onClick={next} style={{ background:'#222', color:'#fff', border:'none', padding:'14px 20px', borderRadius:12, fontWeight:600 }}>Next</button>
    </>
  )

  return (
    <OnboardingLayout title="Set your price per night" footer={footer}>
      <div style={{ display:'flex', justifyContent:'center' }}>
        <input
          type="number"
          value={price}
          onChange={e=>{ setPrice(e.target.value); if (error) setError('') }}
          style={{ height: 48, padding:'0 12px', borderRadius:12, border:'1px solid #ddd', width:240, textAlign:'center' }}
        />
      </div>
      {error && (
        <div
          style={{
            color:'#d93025',
            marginTop:16,
            fontFamily:"'Airbnb Cereal VF', Circular, -apple-system, 'system-ui', Roboto, 'Helvetica Neue', sans-serif",
            textAlign:'center'
          }}
        >
          {error}
        </div>
      )}
    </OnboardingLayout>
  )
}


