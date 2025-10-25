import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import OnboardingLayout from '../../components/OnboardingLayout'
import OptionCard from '../../components/OptionCard'
import { IconHouse, IconApartment, IconBarn, IconBoat, IconCabin } from '../../components/Icons'

export default function StepType(){
  const nav = useNavigate()
  const [propertyType, setPropertyType] = useState(null)
  const [error, setError] = useState('')

  async function next(){
    if (!propertyType) {
      setError('Please choose a property type to continue.')
      return
    }
    const res = await api.post('/properties', {
      name: 'Untitled listing',
      location: 'Unknown',
      price_per_night: 0,
      bedrooms: 1,
      bathrooms: 1,
      amenities: [],
      property_type: propertyType
    })
    nav(`/onboarding/${res.data.id}/privacy`)
  }

  const selectType = (value) => {
    setPropertyType(value)
    if (error) setError('')
  }

  const canContinue = Boolean(propertyType)

  const options = [
    { key:'House', icon: IconHouse },
    { key:'Apartment', icon: IconApartment },
    { key:'Barn', icon: IconBarn },
    { key:'Boat', icon: IconBoat },
    { key:'Cabin', icon: IconCabin }
  ]
  const footer = (
    <>
      <span />
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
    <OnboardingLayout title="Which of these best describes your place?" footer={footer}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, minmax(0, 1fr))', gap:20, justifyItems:'stretch', marginTop:12 }}>
        {options.map(({ key, icon:Icon }) => (
          <OptionCard key={key} title={key} selected={propertyType===key} onClick={()=>selectType(key)} RightIcon={Icon} titleSize={18} iconSize={26} height={112} />
        ))}
      </div>
      {error && <div style={{ color:'#d93025', marginTop:16, fontFamily:"'Airbnb Cereal VF', Circular, -apple-system, 'system-ui', Roboto, 'Helvetica Neue', sans-serif" }}>{error}</div>}
    </OnboardingLayout>
  )
}
