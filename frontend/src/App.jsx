import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueueProvider } from './context/QueueContext'

import RoleSelection from './pages/RoleSelection'
import ReceptionPanel from './pages/ReceptionPanel'
import DoctorPanel from './pages/DoctorPanel'
import PatientDisplayPanel from './pages/PatientDisplayPanel'
import DailySummary from './pages/DailySummary'
import DoctorConsultationHistory from './pages/DoctorConsultationHistory'
import PatientCheckIn from './pages/PatientCheckIn'

function App() {
  return (
    <QueueProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RoleSelection />} />
          <Route path="/reception" element={<ReceptionPanel />} />
          <Route path="/doctor" element={<DoctorPanel />} />
          <Route path="/patient/join/:sessionId" element={<PatientCheckIn />} />
          <Route path="/patient/:tokenId" element={<PatientDisplayPanel />} />
          <Route path="/daily-summary" element={<DailySummary />} />
          <Route path="/doctor/history" element={<DoctorConsultationHistory />} />
        </Routes>
      </BrowserRouter>
    </QueueProvider>
  )
}

export default App
