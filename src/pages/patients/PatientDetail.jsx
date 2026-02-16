import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchPatientDetails } from '../../services/api'
import { formatDate, calculateAge, getSeverityColor, getStatusColor } from '../../utils/helpers'
import { savePatientDetail, loadPatientDetail } from '../../utils/storage'
import './PatientDetail.css'

function PatientDetail() {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const [patientData, setPatientData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  const loadPatientDetails = useCallback(async () => {
    try {
      // Try to load from cache first
      const cached = loadPatientDetail(patientId)
      if (cached) {
        setPatientData(cached)
        setLoading(false)
      }
      
      // Then fetch fresh data
      setLoading(true)
      const data = await fetchPatientDetails(patientId)
      
      if (data.success) {
        setPatientData(data.data)
        savePatientDetail(patientId, data.data) // Cache the data
      } else {
        setError(data.error || 'Failed to fetch patient details')
      }
    } catch (err) {
      setError('Failed to connect to server: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    loadPatientDetails()
  }, [loadPatientDetails])

  if (loading) {
    return (
      <div className="patient-detail-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading patient details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="patient-detail-container">
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <h2>Error Loading Patient Details</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={loadPatientDetails} className="retry-button">
              Retry
            </button>
            <button onClick={() => navigate('/patients')} className="back-button">
              Back to Patients
            </button>
          </div>
        </div>
      </div>
    )
  }

  const patient = patientData?.patient || {}
  const observations = patientData?.observations?.[0]?.observations || []
  const medications = patientData?.medications || []
  const allergies = patientData?.allergies || []
  const medicalHistory = patientData?.medical_history || []
  const labResults = patientData?.lab_results || []
  const appointments = patientData?.appointments || []
  const encounters = patientData?.encounters || []

  const patientName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Unknown Patient'
  const patientAge = calculateAge(patient.date_of_birth)

  return (
    <div className="patient-detail-container">
      <div className="detail-header">
        <button onClick={() => navigate('/patients')} className="back-btn">
          ← Back to Patients
        </button>
        <button onClick={() => navigate(`/interview/${patientId}`)} className="interview-btn">
          💬 Start Interview
        </button>
      </div>

      <div className="detail-content">
        {/* Patient Header Card */}
        <div className="patient-header-card">
          <div className="patient-avatar-large">
            {patient.first_name ? patient.first_name.charAt(0).toUpperCase() : '👤'}
          </div>
          <div className="patient-main-info">
            <h1>{patientName}</h1>
            <div className="patient-meta-row">
              <span className="meta-item">
                <strong>ID:</strong> {patient.id || patientId}
              </span>
              <span className="meta-item">
                <strong>Age:</strong> {patientAge} years
              </span>
              <span className="meta-item">
                <strong>Gender:</strong> {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : patient.gender}
              </span>
              <span className="meta-item">
                <strong>Blood Type:</strong> {patient.blood_type || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="stat-card">
            <div className="stat-icon">💊</div>
            <div className="stat-value">{medications.filter(m => m.status === 'active').length}</div>
            <div className="stat-label">Active Medications</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⚠️</div>
            <div className="stat-value">{allergies.length}</div>
            <div className="stat-label">Allergies</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-value">{appointments.filter(a => a.status === 'Scheduled').length}</div>
            <div className="stat-label">Upcoming Appointments</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔬</div>
            <div className="stat-value">{labResults.length}</div>
            <div className="stat-label">Lab Results</div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="tabs-nav">
          <button className={activeTab === 'overview' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('overview')}>
            Overview
          </button>
          <button className={activeTab === 'medications' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('medications')}>
            Medications
          </button>
          <button className={activeTab === 'allergies' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('allergies')}>
            Allergies
          </button>
          <button className={activeTab === 'history' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('history')}>
            Medical History
          </button>
          <button className={activeTab === 'labs' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('labs')}>
            Lab Results
          </button>
          <button className={activeTab === 'appointments' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('appointments')}>
            Appointments
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="section-grid">
                {/* Contact Information */}
                <div className="info-section">
                  <h3>📞 Contact Information</h3>
                  <div className="info-list">
                    <div className="info-item">
                      <span className="info-label">Email:</span>
                      <span className="info-value">{patient.email || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Phone:</span>
                      <span className="info-value">{patient.contact_number || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Emergency:</span>
                      <span className="info-value">{patient.emergency_contact || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Address:</span>
                      <span className="info-value">{patient.address || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Vital Signs */}
                <div className="info-section">
                  <h3>💓 Latest Vital Signs</h3>
                  <div className="vitals-grid">
                    {observations.map((obs) => (
                      <div key={obs.id} className="vital-item">
                        <span className="vital-label">{obs.type}</span>
                        <span className="vital-value">{obs.value} <span className="vital-unit">{obs.unit}</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Encounters */}
              {encounters.length > 0 && (
                <div className="info-section full-width">
                  <h3>🏥 Recent Encounters</h3>
                  {encounters.slice(0, 3).map((encounter) => (
                    <div key={encounter.id} className="encounter-card">
                      <div className="encounter-header">
                        <span className="encounter-type">{encounter.encounter_type}</span>
                        <span className="encounter-date">{formatDate(encounter.encounter_date)}</span>
                      </div>
                      <p className="encounter-reason"><strong>Reason:</strong> {encounter.reason_for_visit}</p>
                      <div className="encounter-diagnoses">
                        {encounter.diagnosis?.map((diag, idx) => (
                          <span key={idx} className="diagnosis-badge">{diag}</span>
                        ))}
                      </div>
                      <p className="encounter-notes">{encounter.notes}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'medications' && (
            <div className="medications-tab">
              {medications.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">💊</span>
                  <p>No medications recorded</p>
                </div>
              ) : (
                <div className="cards-grid">
                  {medications.map((med) => (
                    <div key={med.id} className="medication-card">
                      <div className="card-header">
                        <h4>{med.drug_name}</h4>
                        <span className="status-badge" style={{ backgroundColor: getStatusColor(med.status) }}>
                          {med.status}
                        </span>
                      </div>
                      <div className="card-body">
                        <p><strong>Dosage:</strong> {med.dosage}</p>
                        <p><strong>Instructions:</strong> {med.instructions}</p>
                        <div className="date-range">
                          <span>{formatDate(med.start_date)}</span>
                          <span>→</span>
                          <span>{formatDate(med.end_date)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'allergies' && (
            <div className="allergies-tab">
              {allergies.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">⚠️</span>
                  <p>No allergies recorded</p>
                </div>
              ) : (
                <div className="cards-grid">
                  {allergies.map((allergy) => (
                    <div key={allergy.id} className="allergy-card" style={{ borderLeftColor: getSeverityColor(allergy.severity) }}>
                      <div className="card-header">
                        <h4>{allergy.allergen}</h4>
                        <span className="severity-badge" style={{ backgroundColor: getSeverityColor(allergy.severity) }}>
                          {allergy.severity}
                        </span>
                      </div>
                      <div className="card-body">
                        <p><strong>Reaction:</strong> {allergy.reaction}</p>
                        <p><strong>Notes:</strong> {allergy.notes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="history-tab">
              {medicalHistory.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📋</span>
                  <p>No medical history recorded</p>
                </div>
              ) : (
                <div className="timeline">
                  {medicalHistory.map((history) => (
                    <div key={history.id} className="timeline-item">
                      <div className="timeline-marker" style={{ backgroundColor: getStatusColor(history.status) }}></div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <h4>{history.condition}</h4>
                          <span className="timeline-date">{formatDate(history.diagnosis_date)}</span>
                        </div>
                        <span className="status-badge" style={{ backgroundColor: getStatusColor(history.status) }}>
                          {history.status}
                        </span>
                        <p className="timeline-notes">{history.notes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'labs' && (
            <div className="labs-tab">
              {labResults.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🔬</span>
                  <p>No lab results available</p>
                </div>
              ) : (
                <div className="cards-grid">
                  {labResults.map((lab) => (
                    <div key={lab.id} className="lab-card">
                      <div className="card-header">
                        <h4>{lab.test_name}</h4>
                        <span className="lab-date">{formatDate(lab.date_conducted)}</span>
                      </div>
                      <div className="card-body">
                        <div className="lab-result">
                          <span className="result-value">{lab.result}</span>
                          <span className="result-unit">{lab.unit}</span>
                        </div>
                        <div className="lab-reference">
                          <span>Reference: {lab.reference_range}</span>
                        </div>
                        <p className="lab-notes">{lab.notes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="appointments-tab">
              {appointments.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📅</span>
                  <p>No appointments scheduled</p>
                </div>
              ) : (
                <div className="cards-grid">
                  {appointments.map((appt) => (
                    <div key={appt.id} className="appointment-card">
                      <div className="card-header">
                        <h4>{appt.reason}</h4>
                        <span className="status-badge" style={{ backgroundColor: getStatusColor(appt.status) }}>
                          {appt.status}
                        </span>
                      </div>
                      <div className="card-body">
                        <p><strong>📅 Date:</strong> {formatDate(appt.scheduled_time)}</p>
                        <p><strong>🕐 Time:</strong> {new Date(appt.scheduled_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                        <p><strong>👨‍⚕️ Doctor:</strong> {appt.doctor_id}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PatientDetail
