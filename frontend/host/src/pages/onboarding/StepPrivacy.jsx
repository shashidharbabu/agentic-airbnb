import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/client'
import OnboardingLayout from '../../components/OnboardingLayout'
import OptionCard from '../../components/OptionCard'
import { IconHouse } from '../../components/Icons'

const fontFamily = "'Airbnb Cereal VF', Circular, -apple-system, 'system-ui', Roboto, 'Helvetica Neue', sans-serif";

export default function StepPrivacy(){
  const nav = useNavigate()
  const { id } = useParams()
  const [privacy, setPrivacy] = useState(null)
  const [error, setError] = useState('')

  useEffect(()=>{ (async()=>{
    try{
      const res = await api.get(`/properties/${id}`)
      const nextPrivacy = res.data.property.privacy_type || null
      setPrivacy(nextPrivacy)
    }catch{}
  })() }, [id])

  async function next(){
    if (!privacy) {
      setError('Select one option to continue.')
      return
    }
    await api.put(`/properties/${id}`, { privacy_type: privacy })
    nav(`/onboarding/${id}/basics`)
  }

  const selectPrivacy = (value) => {
    setPrivacy(value)
    if (error) setError('')
  }

  const canContinue = Boolean(privacy)

  const options = ['Entire place','Room','Shared']
  const footer = (
    <>
      <button onClick={()=>nav(`/onboarding/type`)} style={{ border:'1px solid #ddd', padding:'14px 20px', borderRadius:12, background:'#fff', fontWeight:600 }}>Back</button>
      <button
        onClick={next}
        disabled={!canContinue}
        style={{
          background: canContinue ? '#222' : '#a0a0a0',
          color:'#fff',
          border:'none',
          padding:'14px 20px',
          borderRadius:12,
          fontWeight:600,
          cursor: canContinue ? 'pointer' : 'not-allowed'
        }}
      >
        Next
      </button>
    </>
  )

  return (
    <OnboardingLayout title="What type of place will guests have?" footer={footer}>
      <div style={{ display:'grid', gap:16, marginTop:12 }}>
        {options.map(o => (
          <OptionCard
            key={o}
            title={o}
            subtitle={o==='Entire place' ? 'Guests have the whole place to themselves.' : o==='Room' ? 'Guests have their own room, plus access to shared spaces.' : 'Guests sleep in a shared room in a home or hostel.'}
            selected={privacy===o}
            onClick={()=>selectPrivacy(o)}
            RightIcon={IconHouse}
          />
        ))}
      </div>
      {error && <div style={{ color:'#d93025', marginTop:16, fontFamily }}>{error}</div>}
    </OnboardingLayout>
  )
}
