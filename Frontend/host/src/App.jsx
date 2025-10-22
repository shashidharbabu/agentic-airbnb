import { Routes, Route, Navigate } from 'react-router-dom'
import HostLogin from './pages/HostLogin'
import HostDashboard from './pages/HostDashboard'
import PropertyForm from './pages/PropertyForm'
import Bookings from './pages/Bookings'
import Listings from './pages/Listings'
import Layout from './components/Layout'
import StepType from './pages/onboarding/StepType'
import StepPrivacy from './pages/onboarding/StepPrivacy'
import StepLocation from './pages/onboarding/StepLocation'
import StepBasics from './pages/onboarding/StepBasics'
import StepHighlights from './pages/onboarding/StepHighlights'
import StepAmenities from './pages/onboarding/StepAmenities'
import StepSafety from './pages/onboarding/StepSafety'
import StepTitle from './pages/onboarding/StepTitle'
import StepPricing from './pages/onboarding/StepPricing'
import StepDiscounts from './pages/onboarding/StepDiscounts'
import StepBooking from './pages/onboarding/StepBooking'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<HostLogin />} />
      <Route path="/" element={<Layout><HostDashboard /></Layout>} />
  <Route path="/properties/new" element={<Layout><PropertyForm /></Layout>} />
  <Route path="/bookings" element={<Layout><Bookings /></Layout>} />
  <Route path="/host/listings" element={<Layout><Listings /></Layout>} />
      <Route path="/onboarding/type" element={<Layout><StepType /></Layout>} />
      <Route path="/onboarding/:id/privacy" element={<Layout><StepPrivacy /></Layout>} />
      <Route path="/onboarding/:id/basics" element={<Layout><StepBasics /></Layout>} />
      <Route path="/onboarding/:id/location" element={<Layout><StepLocation /></Layout>} />
      <Route path="/onboarding/:id/highlights" element={<Layout><StepHighlights /></Layout>} />
      <Route path="/onboarding/:id/amenities" element={<Layout><StepAmenities /></Layout>} />
      <Route path="/onboarding/:id/safety" element={<Layout><StepSafety /></Layout>} />
      <Route path="/onboarding/:id/title" element={<Layout><StepTitle /></Layout>} />
      <Route path="/onboarding/:id/pricing" element={<Layout><StepPricing /></Layout>} />
      <Route path="/onboarding/:id/discounts" element={<Layout><StepDiscounts /></Layout>} />
      <Route path="/onboarding/:id/booking" element={<Layout><StepBooking /></Layout>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
