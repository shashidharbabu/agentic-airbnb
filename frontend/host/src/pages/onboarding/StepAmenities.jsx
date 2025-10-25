import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/client'
import OnboardingLayout from '../../components/OnboardingLayout'
import { IconWifi, IconTV, IconKitchen, IconWasher, IconParking, IconAC, IconWorkspace } from '../../components/Icons'
import OptionCard from '../../components/OptionCard'

const ALL = [
  { key:'Wifi', icon: IconWifi },
  { key:'TV', icon: IconTV },
  { key:'Kitchen', icon: IconKitchen },
  { key:'Washer', icon: IconWasher },
  { key:'Free parking', icon: IconParking },
  { key:'Air conditioning', icon: IconAC },
  { key:'Dedicated workspace', icon: IconWorkspace }
]

export default function StepAmenities(){
  const nav = useNavigate()
  const { id } = useParams()
  const [amenities, setAmenities] = useState([])
  const [error, setError] = useState('')

  useEffect(()=>{ (async()=>{
    try{ const res = await api.get(`/properties/${id}`); const p=res.data.property||{}; setAmenities(Array.isArray(p.amenities)? p.amenities : []) }catch{}
  })() }, [id])

  function toggle(a){
    setAmenities(s => {
      const next = s.includes(a) ? s.filter(x=>x!==a) : [...s, a]
      return next
    })
    if (error) setError('')
  }

  async function next(){
    if (amenities.length === 0) {
      setError('Select at least one amenity to continue.')
      return
    }
    await api.put(`/properties/${id}`, { amenities })
    nav(`/onboarding/${id}/safety`)
  }

  const footer = (
    <>
      <button onClick={()=>nav(`/onboarding/${id}/highlights`)} style={{ border:'1px solid #ddd', padding:'14px 20px', borderRadius:12, background:'#fff', fontWeight:600 }}>Back</button>
      <button onClick={next} style={{ background:'#222', color:'#fff', border:'none', padding:'14px 20px', borderRadius:12, fontWeight:600 }}>Next</button>
    </>
  )

  return (
    <OnboardingLayout title="Tell guests what amenities you offer" footer={footer}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, minmax(0, 1fr))', gap:20, marginTop:12 }}>
        {ALL.map(({key, icon:Icon}) => (
          <OptionCard key={key} title={key} selected={amenities.includes(key)} onClick={()=>toggle(key)} RightIcon={Icon} />
        ))}
      </div>
      {error && <div style={{ color:'#d93025', marginTop:16, fontFamily:"'Airbnb Cereal VF', Circular, -apple-system, 'system-ui', Roboto, 'Helvetica Neue', sans-serif" }}>{error}</div>}
    </OnboardingLayout>
  )
}


