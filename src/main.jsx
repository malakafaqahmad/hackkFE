import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './styles/index.css'
import Home from './pages/Home.jsx'
import PatientsList from './pages/patients/PatientsList.jsx'
import PatientDetail from './pages/patients/PatientDetail.jsx'
import Interview from './pages/interview/Interview.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/patients" element={<PatientsList />} />
      <Route path="/patient/:patientId" element={<PatientDetail />} />
      <Route path="/interview/:patientId" element={<Interview />} />
      <Route path="/interview" element={<Interview />} />
    </Routes>
  </BrowserRouter>,
)
