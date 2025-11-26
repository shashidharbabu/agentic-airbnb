import { useEffect } from 'react'
import { Provider } from 'react-redux'
import { Routes, Route, Navigate } from 'react-router-dom'
import { store } from './store/store'
import { checkAuth } from './store/slices/authSlice'
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
import StepPhotos from './pages/onboarding/StepPhotos'
import StepPricing from './pages/onboarding/StepPricing'
import StepBooking from './pages/onboarding/StepBooking'
import HostProfile from './pages/HostProfile'
import ListingDetails from './pages/ListingDetails'
import PricingAvailability from './pages/PricingAvailability'
import LanguageCurrency from './pages/LanguageCurrency'
import HostingResources from './pages/HostingResources'
import GetHelp from './pages/GetHelp'
import FindCoHost from './pages/FindCoHost'
import ReferHost from './pages/ReferHost'
import { useAppSelector } from './store/hooks'

const loaderStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: '"Airbnb Cereal VF", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
  color: '#222',
  fontSize: '18px'
}

function FullPageLoader() {
  return <div style={loaderStyle}>Loading your host workspace…</div>
}

function RequireAuth({ children }) {
  const { currentUser, bootstrapping } = useAppSelector((state) => state.auth)
  if (bootstrapping) return <FullPageLoader />
  if (!currentUser) return <Navigate to="/login" replace />
  return children
}

function PublicOnly({ children }) {
  const { currentUser, bootstrapping } = useAppSelector((state) => state.auth)
  if (bootstrapping) return <FullPageLoader />
  if (currentUser) return <Navigate to="/" replace />
  return children
}

function AppContent() {
  // Initialize auth check on app load
  useEffect(() => {
    store.dispatch(checkAuth());
  }, []);

  return (
    <Routes>
        <Route
          path="/login"
          element={(
            <PublicOnly>
              <HostLogin />
            </PublicOnly>
          )}
        />
        <Route
          path="/"
          element={(
            <RequireAuth>
              <Layout>
                <HostDashboard />
              </Layout>
            </RequireAuth>
          )}
        />
        <Route
          path="/host/profile"
          element={(
            <RequireAuth>
              <Layout>
                <HostProfile />
              </Layout>
            </RequireAuth>
          )}
        />
        <Route
          path="/properties/new"
          element={(
            <RequireAuth>
              <Layout>
                <PropertyForm />
              </Layout>
            </RequireAuth>
          )}
        />
        <Route
          path="/bookings"
          element={(
            <RequireAuth>
              <Layout>
                <Bookings />
              </Layout>
            </RequireAuth>
          )}
        />
        <Route
          path="/host/bookings"
          element={(
            <RequireAuth>
              <Layout>
                <Bookings />
              </Layout>
            </RequireAuth>
          )}
        />
        <Route
          path="/host/listings"
          element={(
            <RequireAuth>
              <Layout>
                <Listings />
              </Layout>
            </RequireAuth>
          )}
        />
        <Route
          path="/host/listings/:id/details"
          element={(
            <RequireAuth>
              <Layout>
                <ListingDetails />
              </Layout>
            </RequireAuth>
          )}
        />
        <Route
          path="/host/listings/:id/pricing"
          element={(
            <RequireAuth>
              <Layout>
                <PricingAvailability />
              </Layout>
            </RequireAuth>
          )}
        />
        <Route
          path="/host/language"
          element={(
            <RequireAuth>
              <Layout>
                <LanguageCurrency />
              </Layout>
            </RequireAuth>
          )}
        />
        <Route
          path="/host/resources"
          element={(
            <RequireAuth>
              <Layout>
                <HostingResources />
              </Layout>
            </RequireAuth>
          )}
        />
        <Route
          path="/host/help"
          element={(
            <RequireAuth>
              <Layout>
                <GetHelp />
              </Layout>
            </RequireAuth>
          )}
        />
        <Route
          path="/host/co-host"
          element={(
            <RequireAuth>
              <Layout>
                <FindCoHost />
              </Layout>
            </RequireAuth>
          )}
        />
        <Route
          path="/host/refer"
          element={(
            <RequireAuth>
              <Layout>
                <ReferHost />
              </Layout>
            </RequireAuth>
          )}
        />
        <Route
          path="/onboarding/type"
          element={(
            <RequireAuth>
              <Layout>
                <StepType />
              </Layout>
            </RequireAuth>
          )}
        />
        <Route
          path="/onboarding/:id/privacy"
          element={(
            <RequireAuth>
              <Layout>
                <StepPrivacy />
              </Layout>
            </RequireAuth>
          )}
        />
        <Route
          path="/onboarding/:id/basics"
          element={(
            <RequireAuth>
              <Layout>
                <StepBasics />
              </Layout>
            </RequireAuth>
          )}
        />
        <Route
          path="/onboarding/:id/location"
          element={(
            <RequireAuth>
              <Layout>
                <StepLocation />
              </Layout>
            </RequireAuth>
          )}
        />
        <Route
          path="/onboarding/:id/highlights"
          element={(
            <RequireAuth>
              <Layout>
                <StepHighlights />
              </Layout>
            </RequireAuth>
          )}
        />
        <Route
          path="/onboarding/:id/amenities"
          element={(
            <RequireAuth>
              <Layout>
                <StepAmenities />
              </Layout>
            </RequireAuth>
          )}
        />
        <Route
          path="/onboarding/:id/safety"
          element={(
            <RequireAuth>
              <Layout>
                <StepSafety />
              </Layout>
            </RequireAuth>
          )}
        />
        <Route
          path="/onboarding/:id/title"
          element={(
            <RequireAuth>
              <Layout>
                <StepTitle />
              </Layout>
            </RequireAuth>
          )}
        />
        <Route
          path="/onboarding/:id/photos"
          element={(
            <RequireAuth>
              <Layout>
                <StepPhotos />
              </Layout>
            </RequireAuth>
          )}
        />
        <Route
          path="/onboarding/:id/pricing"
          element={(
            <RequireAuth>
              <Layout>
                <StepPricing />
              </Layout>
            </RequireAuth>
          )}
        />
        <Route
          path="/onboarding/:id/booking"
          element={(
            <RequireAuth>
              <Layout>
                <StepBooking />
              </Layout>
            </RequireAuth>
          )}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
  )
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  )
}
