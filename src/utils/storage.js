/**
 * Storage utility for managing localStorage with patient-specific data
 */

const STORAGE_KEYS = {
  PATIENTS_LIST: 'patients_list',
  PATIENTS_CACHE_TIME: 'patients_cache_time',
  INTERVIEW_STATE: (patientId) => `interview_state_${patientId}`,
  PATIENT_DETAIL: (patientId) => `patient_detail_${patientId}`,
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Save data to localStorage
 */
export const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
    return true
  } catch (error) {
    console.error('Error saving to localStorage:', error)
    return false
  }
}

/**
 * Load data from localStorage
 */
export const loadFromStorage = (key) => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  } catch (error) {
    console.error('Error loading from localStorage:', error)
    return null
  }
}

/**
 * Remove data from localStorage
 */
export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error('Error removing from localStorage:', error)
    return false
  }
}

/**
 * Clear all app data from localStorage
 */
export const clearAllAppData = () => {
  try {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('interview_state_') || 
          key.startsWith('patient_detail_') ||
          key === STORAGE_KEYS.PATIENTS_LIST ||
          key === STORAGE_KEYS.PATIENTS_CACHE_TIME) {
        localStorage.removeItem(key)
      }
    })
    return true
  } catch (error) {
    console.error('Error clearing app data:', error)
    return false
  }
}

/**
 * Save patients list with timestamp
 */
export const savePatientsCache = (patients) => {
  saveToStorage(STORAGE_KEYS.PATIENTS_LIST, patients)
  saveToStorage(STORAGE_KEYS.PATIENTS_CACHE_TIME, Date.now())
}

/**
 * Load patients list if cache is valid
 */
export const loadPatientsCache = () => {
  const cacheTime = loadFromStorage(STORAGE_KEYS.PATIENTS_CACHE_TIME)
  if (!cacheTime || Date.now() - cacheTime > CACHE_DURATION) {
    return null // Cache expired
  }
  return loadFromStorage(STORAGE_KEYS.PATIENTS_LIST)
}

/**
 * Save interview state for a specific patient
 */
export const saveInterviewState = (patientId, state) => {
  return saveToStorage(STORAGE_KEYS.INTERVIEW_STATE(patientId), state)
}

/**
 * Load interview state for a specific patient
 */
export const loadInterviewState = (patientId) => {
  return loadFromStorage(STORAGE_KEYS.INTERVIEW_STATE(patientId))
}

/**
 * Clear interview state for a specific patient
 */
export const clearInterviewState = (patientId) => {
  return removeFromStorage(STORAGE_KEYS.INTERVIEW_STATE(patientId))
}

/**
 * Save patient detail with timestamp
 */
export const savePatientDetail = (patientId, detail) => {
  return saveToStorage(STORAGE_KEYS.PATIENT_DETAIL(patientId), {
    ...detail,
    cachedAt: Date.now()
  })
}

/**
 * Load patient detail if cache is valid
 */
export const loadPatientDetail = (patientId) => {
  const cached = loadFromStorage(STORAGE_KEYS.PATIENT_DETAIL(patientId))
  if (!cached || Date.now() - cached.cachedAt > CACHE_DURATION) {
    return null // Cache expired
  }
  return cached
}

/**
 * Clear all interview states (useful for logout or reset)
 */
export const clearAllInterviews = () => {
  try {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('interview_state_')) {
        localStorage.removeItem(key)
      }
    })
    return true
  } catch (error) {
    console.error('Error clearing interviews:', error)
    return false
  }
}

export default {
  saveToStorage,
  loadFromStorage,
  removeFromStorage,
  clearAllAppData,
  savePatientsCache,
  loadPatientsCache,
  saveInterviewState,
  loadInterviewState,
  clearInterviewState,
  savePatientDetail,
  loadPatientDetail,
  clearAllInterviews
}
