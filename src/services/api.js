import { API_BASE_URL, API_ENDPOINTS } from '../constants'

/**
 * Fetch all patients from the API
 * @returns {Promise<Object>} Response containing patients list
 */
export const fetchPatients = async () => {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PATIENTS}`)
  return await response.json()
}

/**
 * Fetch details for a specific patient
 * @param {string} patientId - The patient ID
 * @returns {Promise<Object>} Response containing patient details
 */
export const fetchPatientDetails = async (patientId) => {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PATIENT_DETAIL(patientId)}`)
  return await response.json()
}

/**
 * Handle interview conversation - both starting and continuing
 * @param {string} patientId - The patient ID
 * @param {string} message - The message text (optional for starting)
 * @param {Array} conversationHistory - Previous conversation messages
 * @param {string} conversationId - The conversation ID (optional, for continuing)
 * @param {string} currentReport - The current report text (always provided)
 * @returns {Promise<Object>} Response from the assistant with updated report
 */
export const sendInterviewMessage = async (patientId, message = null, conversationHistory = [], conversationId = null, currentReport = '') => {
  // Default report template if none provided
  const defaultReport = `## Chief Complaint
To be determined from patient interview.

## History of Present Illness (HPI)
To be filled based on patient interview.

## Relevant Medical History
To be extracted from EHR and interview.

## Current Medications
To be extracted from EHR.

## Allergies
To be extracted from EHR.`
  
  const body = {
    patient_id: patientId || 'unknown',
    current_report: currentReport || defaultReport,
  }
  
  if (message) {
    body.message = message
  }
  
  if (conversationHistory.length > 0) {
    body.conversation_history = conversationHistory
  }
  
  if (conversationId) {
    body.conversation_id = conversationId
  }
  
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.INTERVIEW}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  return await response.json()
}

/**
 * Handle second interview messages after differential diagnosis
 * @param {string} patientId - The patient ID
 * @param {string} message - The message text (optional for first message)
 * @param {Array} conversationHistory - Previous conversation messages
 * @param {string} conversationId - The second interview conversation ID (optional for first message)
 * @param {string} currentReport - The current report text
 * @param {Array} differentialDiagnoses - The differential diagnoses array
 * @returns {Promise<Object>} Response from the second interview
 */
export const sendSecondInterviewMessage = async (patientId, message = null, conversationHistory = [], conversationId = null, currentReport = '', differentialDiagnoses = []) => {
  const body = {
    patient_id: patientId,
    current_report: currentReport,
    differential_diagnoses: differentialDiagnoses,
  }
  
  if (message) {
    body.message = message
  }
  
  if (conversationHistory.length > 0) {
    body.conversation_history = conversationHistory
  }
  
  if (conversationId) {
    body.conversation_id = conversationId
  }
  
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SECOND_INTERVIEW}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  return await response.json()
}

/**
 * Generate differential diagnosis based on conversation and report
 * @param {string} patientId - The patient ID
 * @param {Array} conversationHistory - Previous conversation messages
 * @param {string} currentReport - The current medical report
 * @returns {Promise<Object>} Response containing differential diagnoses
 */
export const generateDiagnosis = async (patientId, conversationHistory, currentReport) => {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DIAGNOSIS}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      patient_id: patientId,
      conversation_history: conversationHistory,
      current_report: currentReport,
    }),
  })
  return await response.json()
}

/**
 * Generate comprehensive final medical report
 * @param {string} patientId - The patient ID
 * @param {string} conversationHistory - Complete conversation transcript
 * @param {string} currentReport - The current medical report
 * @param {any} differentialDiagnoses - The differential diagnoses (array or string)
 * @returns {Promise<Object>} Response containing final report
 */
export const generateFinalReport = async (patientId, conversationHistory, currentReport, differentialDiagnoses) => {
  const body = {
    patient_id: patientId,
    conversation_history: conversationHistory,
    current_report: currentReport,
    differential_diagnoses: differentialDiagnoses,
  }
  
  console.log('🌐 Calling /api/final-report with:', {
    patient_id: patientId,
    conversation_length: conversationHistory?.length || 0,
    report_length: currentReport?.length || 0,
    has_diagnoses: !!differentialDiagnoses
  })
  
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.FINAL_REPORT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    console.log('🌐 Final report response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('🌐 Final report error response:', errorText)
      return {
        success: false,
        error: `Server error: ${response.status} - ${errorText}`
      }
    }
    
    const result = await response.json()
    console.log('🌐 Final report parsed response:', result)
    return result
  } catch (error) {
    console.error('🌐 Final report fetch error:', error)
    return {
      success: false,
      error: `Network error: ${error.message}`
    }
  }
}
