import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/client'
import OnboardingLayout from '../../components/OnboardingLayout'

export default function StepDiscounts(){
  const nav = useNavigate()
  const { id } = useParams()
  const [weekendPremium, setWeekendPremium] = useState(0)
  const [discounts, setDiscounts] = useState({ weekly: 0, monthly: 0 })

  useEffect(()=>{ (async()=>{
    try{ const res = await api.get(`/properties/${id}`); const p=res.data.property||{}; setWeekendPremium(p.weekend_premium_percent||0); setDiscounts(p.discounts||{ weekly:0, monthly:0 }) }catch{}
  })() }, [id])

  async function next(){
    await api.put(`/properties/${id}`, { weekend_premium_percent: Number(weekendPremium)||0, discounts })
    nav(`/onboarding/${id}/booking`)
  }

  const footer = (
    <>
      <button onClick={()=>nav(`/onboarding/${id}/pricing`)} style={{ border:'1px solid #ddd', padding:'14px 20px', borderRadius:12, background:'#fff', fontWeight:600 }}>Back</button>
      <button onClick={next} style={{ background:'#222', color:'#fff', border:'none', padding:'14px 20px', borderRadius:12, fontWeight:600 }}>Next</button>
    </>
  )

  return (
    <OnboardingLayout title="Add premiums and discounts" footer={footer}>
      <div style={{ display:'grid', gap:12, maxWidth:420, margin:'0 auto', width:'100%' }}>
        <label>Weekend premium %
          <input type="number" value={weekendPremium} onChange={e=>setWeekendPremium(e.target.value)} style={{ height: 48, padding:'0 12px', borderRadius:12, border:'1px solid #ddd', width:'100%' }} />
        </label>
        <label>Weekly discount %
          <input type="number" value={discounts.weekly} onChange={e=>setDiscounts(d=>({...d, weekly: Number(e.target.value)||0}))} style={{ height: 48, padding:'0 12px', borderRadius:12, border:'1px solid #ddd', width:'100%' }} />
        </label>
        <label>Monthly discount %
          <input type="number" value={discounts.monthly} onChange={e=>setDiscounts(d=>({...d, monthly: Number(e.target.value)||0}))} style={{ height: 48, padding:'0 12px', borderRadius:12, border:'1px solid #ddd', width:'100%' }} />
        </label>
      </div>
    </OnboardingLayout>
  )
}


