import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/client'
import OnboardingLayout from '../../components/OnboardingLayout'
import { IconSmoke, IconCO, IconFirstAid, IconExtinguisher } from '../../components/Icons'
import OptionCard from '../../components/OptionCard'

const ALL = [
  { key:'Smoke alarm', icon: IconSmoke },
  { key:'Carbon monoxide alarm', icon: IconCO },
  { key:'First aid kit', icon: IconFirstAid },
  { key:'Fire extinguisher', icon: IconExtinguisher }
]

export default function StepSafety(){
  const nav = useNavigate()
  const { id } = useParams()
  const [safety, setSafety] = useState([])
  const [error, setError] = useState('')

  useEffect(()=>{ (async()=>{
    try{ const res = await api.get(`/properties/${id}`); const p=res.data.property||{}; setSafety(Array.isArray(p.safety)? p.safety : []) }catch{}
  })() }, [id])

  function toggle(a){
    setSafety(s => {
      const next = s.includes(a) ? s.filter(x=>x!==a) : [...s, a]
      return next
    })
    if (error) setError('')
  }

  async function next(){
    if (safety.length === 0) {
      setError('Select at least one safety item to continue.')
      return
    }
    await api.put(`/properties/${id}`, { safety })
    nav(`/onboarding/${id}/title`)
  }

  const footer = (
    <>
      <button onClick={()=>nav(`/onboarding/${id}/amenities`)} style={{ border:'1px solid #ddd', padding:'14px 20px', borderRadius:12, background:'#fff', fontWeight:600 }}>Back</button>
      <button onClick={next} style={{ background:'#222', color:'#fff', border:'none', padding:'14px 20px', borderRadius:12, fontWeight:600 }}>Next</button>
    </>
  )

  return (
    <OnboardingLayout title="Do you have any of these safety items?" footer={footer}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, minmax(0, 1fr))', gap:20, marginTop:12 }}>
        {ALL.map(({key, icon:Icon}) => (
          <OptionCard key={key} title={key} selected={safety.includes(key)} onClick={()=>toggle(key)} RightIcon={Icon} />
        ))}
      </div>
      {error && <div style={{ color:'#d93025', marginTop:16, fontFamily:"'Airbnb Cereal VF', Circular, -apple-system, 'system-ui', Roboto, 'Helvetica Neue', sans-serif" }}>{error}</div>}
    </OnboardingLayout>
  )
}


