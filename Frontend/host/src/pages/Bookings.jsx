import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

export default function Bookings() {
  const nav = useNavigate()
  const [status, setStatus] = useState('PENDING')
  const [bookings, setBookings] = useState([])

  async function load() {
    try {
      const me = await api.get('/auth/me')
      if (!me.data.owner) return nav('/login')
      const res = await api.get('/bookings/incoming', { params: { status } })
      setBookings(res.data.bookings || [])
    } catch {
      nav('/login')
    }
  }

  useEffect(() => { load() }, [status])

  async function act(id, action) {
    await api.post(`/bookings/${id}/${action}`)
    load()
  }

  return (
    <div style={{ maxWidth: 800, margin: '24px auto', fontFamily: 'system-ui, sans-serif' }}>
      <h2>Bookings</h2>
      <select value={status} onChange={e=>setStatus(e.target.value)}>
        {['PENDING','ACCEPTED','CANCELLED'].map(s=> <option key={s} value={s}>{s}</option>)}
      </select>
      <ul>
        {bookings.map(b => (
          <li key={b.id}>
            {b.traveler_name} — {b.start_date?.slice(0,10)} to {b.end_date?.slice(0,10)} — {b.status}
            {status==='PENDING' && (
              <>
                <button onClick={()=>act(b.id,'accept')} style={{ marginLeft: 8 }}>Accept</button>
                <button onClick={()=>act(b.id,'cancel')} style={{ marginLeft: 8 }}>Cancel</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
