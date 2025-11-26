import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/client'
import OnboardingLayout from '../../components/OnboardingLayout'
import OptionCard from '../../components/OptionCard'
import { IconHouse } from '../../components/Icons'

export default function StepBooking(){
  const nav = useNavigate()
  const { id } = useParams()
  const [mode, setMode] = useState('APPROVAL')

  useEffect(()=>{ (async()=>{
    try{ const res = await api.get(`/properties/${id}`); const p=res.data.property||{}; setMode(p.booking_mode||'APPROVAL') }catch{}
  })() }, [id])

  async function finish(){
    await api.put(`/properties/${id}`, { booking_mode: mode })
    nav(`/properties/${id}`)
  }

  const footer = (
    <>
      <button onClick={()=>nav(`/onboarding/${id}/pricing`)} style={{ border:'1px solid #ddd', padding:'14px 20px', borderRadius:12, background:'#fff', fontWeight:600 }}>Back</button>
      <button onClick={finish} style={{ background:'#222', color:'#fff', border:'none', padding:'14px 20px', borderRadius:12, fontWeight:600 }}>Finish</button>
    </>
  )

  return (
    <OnboardingLayout title="Choose how guests book" footer={footer}>
      <div style={{ display:'grid', gap:16, maxWidth:640, margin:'0 auto', width:'100%' }}>
        {[
          { key:'APPROVAL', title:'Approve requests', subtitle:'You’ll review each request before guests can book.' },
          { key:'INSTANT', title:'Instant Book', subtitle:'Guests can book automatically without approval.' }
        ].map(opt => (
          <OptionCard key={opt.key} title={opt.title} subtitle={opt.subtitle} selected={mode===opt.key} onClick={()=>setMode(opt.key)} RightIcon={IconHouse} />
        ))}
      </div>
    </OnboardingLayout>
  )
}


