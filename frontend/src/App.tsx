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
const StoragePage = lazy(() =>
  import('./pages/StoragePage').then((module) => ({ default: module.StoragePage })),
)
const AboutPage = lazy(() =>
  import('./pages/AboutPage').then((module) => ({ default: module.AboutPage })),
)
const FaqPage = lazy(() =>
  import('./pages/FaqPage').then((module) => ({ default: module.FaqPage })),
)
const ContactPage = lazy(() =>
  import('./pages/ContactPage').then((module) => ({ default: module.ContactPage })),
)
const AdminPage = lazy(() =>
  import('./pages/AdminPage').then((module) => ({ default: module.AdminPage })),
)
const PrivacyPolicyPage = lazy(() =>
  import('./pages/PrivacyPolicyPage').then((module) => ({
    default: module.PrivacyPolicyPage,
  })),
)
const TermsOfServicePage = lazy(() =>
  import('./pages/TermsOfServicePage').then((module) => ({
    default: module.TermsOfServicePage,
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
          <Route element={<StoragePage />} path="/storage" />
          <Route element={<Navigate replace to="/account" />} path="/reserve-launch" />
          <Route element={<Navigate replace to="/account" />} path="/reserve-driver" />
          <Route element={<AboutPage />} path="/about" />
          <Route element={<FaqPage />} path="/faq" />
          <Route element={<ContactPage />} path="/contact" />
          <Route element={<AdminPage />} path="/admin" />
          <Route element={<AdminPage />} path="/account" />
          <Route element={<PrivacyPolicyPage />} path="/privacy-policy" />
          <Route element={<TermsOfServicePage />} path="/terms-of-service" />
          <Route element={<NotFoundPage />} path="*" />
        </Routes>
      </Suspense>
    </Layout>
  )
}

export default App
