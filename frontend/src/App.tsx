import { Suspense, lazy } from 'react'

import { Navigate, Route, Routes } from 'react-router-dom'

import { Layout } from './components/layout/Layout'
import { ScrollToTop } from './components/layout/ScrollToTop'

const HomePage = lazy(() =>
  import('./pages/HomePage').then((module) => ({ default: module.HomePage })),
)
const ServicesPage = lazy(() =>
  import('./pages/ServicesPage').then((module) => ({ default: module.ServicesPage })),
)
const PricingPage = lazy(() =>
  import('./pages/PricingPage').then((module) => ({ default: module.PricingPage })),
)
const GalleryPage = lazy(() =>
  import('./pages/GalleryPage').then((module) => ({ default: module.GalleryPage })),
)
const AdvisoryPage = lazy(() =>
  import('./pages/AdvisoryPage').then((module) => ({ default: module.AdvisoryPage })),
)
const AboutPage = lazy(() =>
  import('./pages/AboutPage').then((module) => ({ default: module.AboutPage })),
)
const ContactPage = lazy(() =>
  import('./pages/ContactPage').then((module) => ({ default: module.ContactPage })),
)
const BookingPage = lazy(() =>
  import('./pages/BookingPage').then((module) => ({ default: module.BookingPage })),
)
const ConfirmationPage = lazy(() =>
  import('./pages/ConfirmationPage').then((module) => ({
    default: module.ConfirmationPage,
  })),
)
const AdminPage = lazy(() =>
  import('./pages/AdminPage').then((module) => ({ default: module.AdminPage })),
)
const PortalPage = lazy(() =>
  import('./pages/PortalPage').then((module) => ({ default: module.PortalPage })),
)
const PrivacyPolicyPage = lazy(() =>
  import('./pages/PrivacyPolicyPage').then((module) => ({
    default: module.PrivacyPolicyPage,
  })),
)
const ServiceAgreementPage = lazy(() =>
  import('./pages/ServiceAgreementPage').then((module) => ({
    default: module.ServiceAgreementPage,
  })),
)
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })),
)

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f8fa] px-6 pt-36 text-center">
      <div className="soft-panel max-w-lg px-8 py-10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lake">
          North Shore Nautical
        </p>
        <p className="mt-3 font-display text-4xl font-semibold text-ink">
          Preparing the page...
        </p>
      </div>
    </div>
  )
}

function App() {
  return (
    <Layout>
      <ScrollToTop />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<HomePage />} path="/" />
          <Route element={<ServicesPage />} path="/services" />
          <Route element={<PricingPage />} path="/pricing" />
          <Route element={<GalleryPage />} path="/gallery" />
          <Route element={<AdvisoryPage />} path="/advisory" />
          <Route element={<AboutPage />} path="/about" />
          <Route element={<ContactPage />} path="/contact" />
          <Route element={<BookingPage />} path="/booking" />
          <Route element={<ConfirmationPage />} path="/booking/confirmation" />
          <Route element={<AdminPage />} path="/admin" />
          <Route element={<PortalPage />} path="/portal" />
          <Route element={<Navigate replace to="/services" />} path="/storage" />
          <Route element={<Navigate replace to="/contact" />} path="/faq" />
          <Route element={<Navigate replace to="/portal" />} path="/reserve-launch" />
          <Route element={<Navigate replace to="/portal" />} path="/reserve-driver" />
          <Route element={<Navigate replace to="/portal" />} path="/account" />
          <Route element={<PrivacyPolicyPage />} path="/privacy-policy" />
          <Route element={<ServiceAgreementPage />} path="/service-agreement" />
          <Route element={<Navigate replace to="/service-agreement" />} path="/terms-of-service" />
          <Route element={<NotFoundPage />} path="*" />
        </Routes>
      </Suspense>
    </Layout>
  )
}

export default App
