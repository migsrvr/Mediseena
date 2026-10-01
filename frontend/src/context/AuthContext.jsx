// ==============================================================================
// MEDISEENA AUTH CONTEXT
// Section 3.3: Role-based Access Control (Patient, Pharmacist, Admin)
// ==============================================================================

import { createContext, useContext, useEffect, useState } from 'react'
import { authService } from '../services/authService.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState('pharmacist')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function initSession() {
      try {
        const session = await authService.getSession()
        if (session?.user) {
          setUser(session.user)
          setRole(session.role || session.user.role || 'patient')
        }
      } catch (err) {
        console.error('Failed to restore auth session:', err)
      } finally {
        setLoading(false)
      }
    }
    initSession()
  }, [])

  const handleLogin = async (email, password, remember) => {
    setLoading(true)
    try {
      const loggedUser = await authService.login(email, password, remember)
      setUser(loggedUser)
      setRole(loggedUser.role || 'patient')
      return loggedUser
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (data) => {
    setLoading(true)
    try {
      const newUser = await authService.register(data)
      setUser(newUser)
      setRole(newUser.role || 'patient')
      return newUser
    } finally {
      setLoading(false)
    }
  }

  const handleRoleSwitch = (targetRole) => {
    const switchedUser = authService.switchRole(targetRole)
    setUser(switchedUser)
    setRole(switchedUser.role)
    return switchedUser
  }

  const handleLogout = async () => {
    await authService.logout()
    setUser(null)
    setRole('patient')
    window.location.href = '/login'
  }

  const value = {
    user,
    role,
    loading,
    isPatient: role === 'patient',
    isPharmacist: role === 'pharmacist',
    isAdmin: role === 'admin',
    login: handleLogin,
    register: handleRegister,
    switchRole: handleRoleSwitch,
    logout: handleLogout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
