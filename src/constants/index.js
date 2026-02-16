// API Base URL
export const API_BASE_URL = 'http://127.0.0.1:5000'

// API Endpoints
export const API_ENDPOINTS = {
  PATIENTS: '/api/patients',
  PATIENT_DETAIL: (id) => `/api/patients/${id}`,
  INTERVIEW: '/api/interview',
  DIAGNOSIS: '/api/diagnosis',
  SECOND_INTERVIEW: '/api/second-interview',
  FINAL_REPORT: '/api/final-report',
}

// App Constants
export const APP_NAME = 'MedGemma'
export const DOCTOR_NAME = 'MedGemma'

// Message Types
export const MESSAGE_SENDER = {
  DOCTOR: 'doctor',
  PATIENT: 'patient',
}

// Patient Status
export const PATIENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
}
