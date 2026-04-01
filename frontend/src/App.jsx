import React, { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueueProvider } from './context/QueueContext'

import RoleSelection from './pages/RoleSelection'

// Lazy loaded components for faster initial load
const ReceptionPanel = lazy(() => import('./pages/ReceptionPanel'))
const DoctorPanel = lazy(() => import('./pages/DoctorPanel'))
const PatientDisplayPanel = lazy(() => import('./pages/PatientDisplayPanel'))
const DailySummary = lazy(() => import('./pages/DailySummary'))
const DoctorConsultationHistory = lazy(() => import('./pages/DoctorConsultationHistory'))
const PatientCheckIn = lazy(() => import('./pages/PatientCheckIn'))

function App() {
  return (
    <QueueProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-primary font-headline text-2xl font-bold animate-pulse">Loading SwasthyaFlow...</div>}>
          <Routes>
            <Route path="/" element={<RoleSelection />} />
            <Route path="/reception" element={<ReceptionPanel />} />
            <Route path="/doctor" element={<DoctorPanel />} />
            <Route path="/patient/join/:sessionId" element={<PatientCheckIn />} />
            <Route path="/patient/:tokenId" element={<PatientDisplayPanel />} />
            <Route path="/daily-summary" element={<DailySummary />} />
            <Route path="/doctor/history" element={<DoctorConsultationHistory />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueueProvider>
  )
}

export default App
