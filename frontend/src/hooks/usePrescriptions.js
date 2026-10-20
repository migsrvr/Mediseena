// Prescription repository state: ignore stale responses and keep successful deletions removed.
import { useState, useEffect, useCallback, useRef } from 'react'
import { prescriptionService } from '../services/prescriptionService.js'
import { useAuth } from '../context/AuthContext.jsx'

export function usePrescriptions({ initialStatus = 'all', forcedRole, forcedUserId } = {}) {
  const { user, role } = useAuth()
  const queryRole = forcedRole ?? role
  const queryUserId = forcedUserId !== undefined ? forcedUserId : user?.id
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState(initialStatus)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState(null)
  const requestVersion = useRef(0)
  const mounted = useRef(false)
  const deletedIds = useRef(new Set())
  const visibleOwner = useRef(queryUserId)

  const fetchPrescriptions = useCallback(async () => {
    const version = ++requestVersion.current
    if (!mounted.current) return
    setLoading(true)
    setError(null)
    if (visibleOwner.current !== queryUserId) {
      visibleOwner.current = queryUserId
      deletedIds.current.clear()
      setPrescriptions([])
    }
    if (!queryUserId) {
      setPrescriptions([])
      setLoading(false)
      return
    }
    try {
      const rows = await prescriptionService.getPrescriptions({
        status: statusFilter, search: searchQuery, role: queryRole, userId: queryUserId,
      })
      if (mounted.current && version === requestVersion.current) {
        setPrescriptions(rows.filter(row => !deletedIds.current.has(row.id)))
      }
    } catch (err) {
      if (mounted.current && version === requestVersion.current) setError(err.message)
    } finally {
      if (mounted.current && version === requestVersion.current) setLoading(false)
    }
  }, [statusFilter, searchQuery, queryRole, queryUserId])

  const latestFetch = useRef(fetchPrescriptions)
  latestFetch.current = fetchPrescriptions

  useEffect(() => {
    mounted.current = true
    fetchPrescriptions()
    return () => {
      mounted.current = false
      requestVersion.current++
    }
  }, [fetchPrescriptions])

  const deleteRecord = useCallback(async id => {
    const removeFromState = () => {
      deletedIds.current.add(id)
      requestVersion.current++
      if (mounted.current) setPrescriptions(previous => previous.filter(row => row.id !== id))
    }
    try {
      await prescriptionService.deletePrescription(id, user)
      removeFromState()
      // A filter may have changed while deletion was pending. Refresh the latest query.
      if (mounted.current) await latestFetch.current()
    } catch (err) {
      if (err.deletionCompleted) {
        removeFromState()
        if (mounted.current) await latestFetch.current()
      }
      if (mounted.current) setError(err.message)
      throw err
    }
  }, [user])

  return {
    prescriptions: visibleOwner.current === queryUserId ? prescriptions : [],
    loading, error, statusFilter, setStatusFilter,
    searchQuery, setSearchQuery, refresh: fetchPrescriptions, deleteRecord,
  }
}

export default usePrescriptions
