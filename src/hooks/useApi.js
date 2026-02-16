 import { useState, useCallback } from 'react'

/**
 * Custom hook for managing API calls with loading and error states
 * @param {Function} apiFunction - The API function to call
 * @returns {Object} { data, loading, error, execute }
 */
export const useApi = (apiFunction) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const execute = useCallback(async (...params) => {
    try {
      setLoading(true)
      setError(null)
      const result = await apiFunction(...params)
      setData(result)
      return result
    } catch (err) {
      setError(err.message || 'An error occurred')
      throw err
    } finally {
      setLoading(false)
    }
  }, [apiFunction])

  return { data, loading, error, execute }
}
