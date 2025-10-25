import { useEffect, useState } from 'react'
import agent from '../api/agent'
import api from '../api/client'

export default function AgentPanel() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [selectedBooking, setSelectedBooking] = useState('')
  const [bookings, setBookings] = useState([])

  useEffect(() => {
    if (open) {
      (async()=>{
        try {
          const pend = await api.get('/bookings/incoming', { params: { status: 'PENDING' } })
          setBookings(pend.data.bookings || [])
        } catch {}
      })()
    }
  }, [open])

  async function runAgent() {
    setLoading(true); setError(''); setResult(null)
    try {
      const b = bookings.find(x=> String(x.id) === String(selectedBooking))
      if (!b) { setError('Pick a booking'); setLoading(false); return }
      // Build minimal request for agent
      const payload = {
        booking_context: {
          check_in_date: b.start_date?.slice(0,10),
          check_out_date: b.end_date?.slice(0,10),
          location: 'San Jose, CA',
          party_type: 'GROUP',
          party_size: b.guests || 1
        },
        preferences: {
          budget_tier: 'MID_RANGE',
          interests: ['food','culture'],
          mobility_needs: [],
          dietary_restrictions: []
        },
        user_message: 'Suggest a 2-day plan with restaurants.'
      }
      const res = await agent.post('/api/concierge', payload)
      setResult(res.data)
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'Error')
    } finally { setLoading(false) }
  }

  return (
    <>
      <button onClick={()=>setOpen(true)} style={{
        position: 'fixed', right: 24, bottom: 24, background: '#FF385C', color: '#fff',
        border: 'none', borderRadius: 9999, padding: '12px 16px', fontWeight: 700, boxShadow: '0 6px 18px rgba(0,0,0,.15)'
      }}>Agent</button>

      {open && (
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, background: '#fff', borderLeft: '1px solid #eee', boxShadow: '0 0 24px rgba(0,0,0,.12)', padding: 16, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>AI Concierge</h3>
            <button onClick={()=>setOpen(false)} style={{ border: 'none', background: 'transparent', fontSize: 18 }}>×</button>
          </div>

          <div style={{ marginTop: 12 }}>
            <label>Pick a booking</label>
            <select value={selectedBooking} onChange={e=>setSelectedBooking(e.target.value)} style={{ width: '100%' }}>
              <option value="">Select…</option>
              {bookings.map(b => (
                <option key={b.id} value={b.id}>#{b.id} · {b.traveler_name} · {b.start_date?.slice(0,10)}→{b.end_date?.slice(0,10)}</option>
              ))}
            </select>
          </div>

          <button disabled={loading} onClick={runAgent} style={{ marginTop: 12, background: '#FF385C', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 12px', fontWeight: 700 }}>
            {loading ? 'Thinking…' : 'Generate itinerary'}
          </button>

          {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}

          {result && (
            <div style={{ marginTop: 12 }}>
              <h4 style={{ margin: '8px 0' }}>Agent notes</h4>
              <div style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>{result.agent_notes || result.agent_response || JSON.stringify(result)}</div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
