import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchPatients } from '../../services/api'
import { savePatientsCache, loadPatientsCache } from '../../utils/storage'
import './PatientsList.css'

function PatientsList() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Try to load from cache first
    const cachedPatients = loadPatientsCache()
    if (cachedPatients) {
      setPatients(cachedPatients)
      setLoading(false)
    }
    // Then fetch fresh data
    loadPatients()
  }, [])

  const loadPatients = async () => {
    try {
      setLoading(true)
      const data = await fetchPatients()
      
      if (data.success) {
        setPatients(data.patients)
        savePatientsCache(data.patients) // Cache the data
        setError(null)
      } else {
        const errorMsg = data.error || 'Failed to fetch patients'
        if (errorMsg.includes('list_patients')) {
          setError('Backend Error: The EHRManager class is missing the list_patients() method. Please add this method to your backend.')
        } else {
          setError(errorMsg)
        }
      }
    } catch (err) {
      setError('Failed to connect to server: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePatientClick = (patientId) => {
    navigate(`/patient/${patientId}`)
  }

  const handleStartInterview = (patientId) => {
    navigate(`/interview/${patientId}`)
  }

  if (loading) {
    return (
      <div className="patients-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading patients...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="patients-container">
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <h2>Error Loading Patients</h2>
          <p>{error}</p>
          <button onClick={loadPatients} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="patients-container">
      <div className="patients-header">
        <div className="header-content">
          <h1>📋 Available Patients</h1>
          <p>Select a patient to view their details or start an interview</p>
        </div>
        <button onClick={loadPatients} className="refresh-button">
          🔄 Refresh
        </button>
      </div>

      <div className="patients-grid">
        {patients.length === 0 ? (
          <div className="no-patients">
            <span className="no-patients-icon">👥</span>
            <h3>No Patients Found</h3>
            <p>There are no patients available at the moment.</p>
          </div>
        ) : (
          patients.map((patient) => {
            const patientName = patient.first_name && patient.last_name 
              ? `${patient.first_name} ${patient.last_name}` 
              : patient.name || 'Unknown Patient'
            const patientInitial = patient.first_name 
              ? patient.first_name.charAt(0).toUpperCase() 
              : patient.name 
                ? patient.name.charAt(0).toUpperCase() 
                : '👤'
            
            return (
              <div key={patient.id || patient.patient_id} className="patient-card">
                <div className="patient-avatar">
                  {patientInitial}
                </div>
                <div className="patient-info">
                  <h3 className="patient-name">
                    {patientName}
                  </h3>
                  <div className="patient-meta">
                    <span className="patient-id">
                      ID: {patient.id || patient.patient_id}
                    </span>
                    {patient.age && (
                      <span className="patient-age">Age: {patient.age}</span>
                    )}
                    {patient.gender && (
                      <span className="patient-gender">
                        {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : patient.gender}
                      </span>
                    )}
                  </div>
                  {patient.condition && (
                    <div className="patient-condition">
                      <span className="condition-badge">{patient.condition}</span>
                    </div>
                  )}
                </div>
                <div className="patient-actions">
                  <button
                    onClick={() => handlePatientClick(patient.id || patient.patient_id)}
                    className="view-details-btn"
                  >
                    📄 View Details
                  </button>
                  <button
                    onClick={() => handleStartInterview(patient.id || patient.patient_id)}
                    className="start-interview-btn"
                  >
                    💬 Start Interview
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default PatientsList
