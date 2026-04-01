import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueueProvider } from './context/QueueContext'

import RoleSelection from './pages/RoleSelection'
import ReceptionPanel from './pages/ReceptionPanel'
import DoctorPanel from './pages/DoctorPanel'
import PatientDisplayPanel from './pages/PatientDisplayPanel'
import DailySummary from './pages/DailySummary'
import DoctorConsultationHistory from './pages/DoctorConsultationHistory'
import EmergencyView from './pages/EmergencyView'
import PatientCheckIn from './pages/PatientCheckIn'
import MedicalMigrationMap from './pages/MedicalMigrationMap'

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
          <Route path="/emergency/:tokenId" element={<EmergencyView />} />
          <Route path="/hospital-map" element={<MedicalMigrationMap />} />
        </Routes>
      </BrowserRouter>
    </QueueProvider>
  )
}

export default App
