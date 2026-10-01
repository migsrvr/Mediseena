// ==============================================================================
// MEDISEENA HOOK: usePrescriptions.js
// ==============================================================================

import { useState, useEffect, useCallback } from 'react'
import { prescriptionService } from '../services/prescriptionService.js'
import { useAuth } from '../context/AuthContext.jsx'

export function usePrescriptions({ initialStatus = 'all' } = {}) {
  const { user, role } = useAuth()
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState(initialStatus)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState(null)

  const fetchPrescriptions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await prescriptionService.getPrescriptions({
        status: statusFilter,
        search: searchQuery,
        role,
        userId: user?.id,
      })
      setPrescriptions(data)
    } catch (err) {
      console.error('Error fetching prescriptions:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, searchQuery, role, user?.id])

  useEffect(() => {
    fetchPrescriptions()
  }, [fetchPrescriptions])

  const deleteRecord = async (id) => {
    await prescriptionService.deletePrescription(id, user)
    setPrescriptions(prev => prev.filter(p => p.id !== id))
  }

  return {
    prescriptions,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    refresh: fetchPrescriptions,
    deleteRecord,
  }
}

export default usePrescriptions
