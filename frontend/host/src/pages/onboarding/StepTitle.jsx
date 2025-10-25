import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/client'
import OnboardingLayout from '../../components/OnboardingLayout'

export default function StepTitle(){
  const nav = useNavigate()
  const { id } = useParams()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  useEffect(()=>{ (async()=>{
    try{ const res = await api.get(`/properties/${id}`); const p=res.data.property||{}; setName(p.name||''); setDescription(p.description||'') }catch{}
  })() }, [id])

  async function next(){
    const trimmedName = name.trim()
    const trimmedDescription = description.trim()

    if (!trimmedName || !trimmedDescription) {
      setError('Add both a title and a description to continue.')
      return
    }

    await api.put(`/properties/${id}`, { name: trimmedName, description: trimmedDescription })
    if (error) setError('')
    nav(`/onboarding/${id}/pricing`)
  }

  const footer = (
    <>
      <button onClick={()=>nav(`/onboarding/${id}/safety`)} style={{ border:'1px solid #ddd', padding:'14px 20px', borderRadius:12, background:'#fff', fontWeight:600 }}>Back</button>
      <button onClick={next} style={{ background:'#222', color:'#fff', border:'none', padding:'14px 20px', borderRadius:12, fontWeight:600 }}>Next</button>
    </>
  )

  return (
    <OnboardingLayout title="Now give your place a title and description" footer={footer}>
      <div style={{ display:'grid', gap:12 }}>
        <input placeholder="Listing title" value={name} onChange={e=>{ setName(e.target.value); if (error) setError('') }} style={{ height: 48, padding:'0 12px', borderRadius:12, border:'1px solid #ddd' }} />
        <textarea placeholder="Describe your place" value={description} onChange={e=>{ setDescription(e.target.value); if (error) setError('') }} rows={6} style={{ padding:'12px', borderRadius:12, border:'1px solid #ddd', resize:'vertical' }} />
      </div>
      {error && <div style={{ color:'#d93025', marginTop:16, fontFamily:"'Airbnb Cereal VF', Circular, -apple-system, 'system-ui', Roboto, 'Helvetica Neue', sans-serif" }}>{error}</div>}
    </OnboardingLayout>
  )
}


