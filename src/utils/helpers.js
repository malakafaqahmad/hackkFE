/**
 * Format a date string to a readable format
 * @param {string} dateString - The date string to format
 * @returns {string} Formatted date string or 'N/A'
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Calculate age from date of birth
 * @param {string} dob - Date of birth string
 * @returns {number|string} Age in years or 'N/A'
 */
export const calculateAge = (dob) => {
  if (!dob) return 'N/A'
  const birthDate = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

/**
 * Get color code for severity level
 * @param {string} severity - Severity level (Severe, Moderate, Mild)
 * @returns {string} Color hex code
 */
export const getSeverityColor = (severity) => {
  const colors = {
    'Severe': '#e53e3e',
    'Moderate': '#ed8936',
    'Mild': '#48bb78'
  }
  return colors[severity] || '#718096'
}

/**
 * Get color code for status
 * @param {string} status - Status string
 * @returns {string} Color hex code
 */
export const getStatusColor = (status) => {
  const lowerStatus = status?.toLowerCase()
  const colors = {
    'active': '#48bb78',
    'non-active': '#718096',
    'inactive': '#718096',
    'scheduled': '#4299e1',
    'completed': '#38a169',
    'chronic': '#ed8936',
    'resolved': '#9f7aea'
  }
  return colors[lowerStatus] || '#718096'
}

/**
 * Format time from date string
 * @param {string} dateString - Date string containing time
 * @returns {string} Formatted time string
 */
export const formatTime = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}
