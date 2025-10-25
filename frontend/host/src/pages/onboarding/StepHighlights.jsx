import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/client'
import OnboardingLayout from '../../components/OnboardingLayout'
import { IconSparkle } from '../../components/Icons'
import OptionCard from '../../components/OptionCard'

const ALL = ['Peaceful','Unique','Family-friendly','Stylish','Central','Spacious']

export default function StepHighlights(){
  const nav = useNavigate()
  const { id } = useParams()
  const [selected, setSelected] = useState([])
  const [error, setError] = useState('')

  useEffect(()=>{ (async()=>{
    try{ const res = await api.get(`/properties/${id}`); const p=res.data.property||{}; setSelected(Array.isArray(p.highlights)? p.highlights : []) }catch{}
  })() }, [id])

  function toggle(tag){
    setSelected(s => {
      const next = s.includes(tag) ? s.filter(t=>t!==tag) : (s.length<2 ? [...s, tag] : s)
      return next
    })
    if (error) setError('')
  }

  async function next(){
    if (selected.length === 0) {
      setError('Choose at least one highlight to continue.')
      return
    }
    await api.put(`/properties/${id}`, { highlights: selected })
    nav(`/onboarding/${id}/amenities`)
  }

  const footer = (
    <>
      <button onClick={()=>nav(`/onboarding/${id}/location`)} style={{ border:'1px solid #ddd', padding:'14px 20px', borderRadius:12, background:'#fff', fontWeight:600 }}>Back</button>
      <button onClick={next} style={{ background:'#222', color:'#fff', border:'none', padding:'14px 20px', borderRadius:12, fontWeight:600 }}>Next</button>
    </>
  )

  return (
    <OnboardingLayout title={"Next, let's describe your house"} subtitle="Choose up to 2 highlights. We'll use these to get your description started." footer={footer}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, minmax(0, 1fr))', gap:20, marginTop:12 }}>
        {ALL.map(t => (
          <OptionCard
            key={t}
            title={t}
            selected={selected.includes(t)}
            onClick={()=>toggle(t)}
            RightIcon={IconSparkle}
          />
        ))}
      </div>
      {error && <div style={{ color:'#d93025', marginTop:16, fontFamily:"'Airbnb Cereal VF', Circular, -apple-system, 'system-ui', Roboto, 'Helvetica Neue', sans-serif" }}>{error}</div>}
    </OnboardingLayout>
  )
}
