// ==============================================================================
// MEDISEENA APP HEADER & NAVIGATION
// Section 3.3: System Roles & Navigation Bar
// ==============================================================================

import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import logo from '../../assets/logo.png'
import {
  LayoutDashboard,
  Upload,
  FileCheck2,
  BarChart3,
  LogOut,
  ShieldAlert,
  Menu,
  X,
  Pill,
  User
} from 'lucide-react'

export default function AppHeader({ currentPath = '/dashboard' }) {
  const { user, role, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Upload & Scan', href: '/upload', icon: Upload },
    { label: 'KPI Analytics', href: '/kpis', icon: BarChart3 },
  ]

  const getRoleBadge = (r) => {
    switch (r) {
      case 'pharmacist':
        return { label: 'Pharmacist', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: Pill }
      case 'admin':
        return { label: 'Administrator', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: ShieldAlert }
      case 'patient':
      default:
        return { label: 'Patient', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: User }
    }
  }

  const roleInfo = getRoleBadge(role)
  const RoleIcon = roleInfo.icon

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-8">
          <a href="/dashboard" className="flex items-center gap-3">
            <img src={logo} alt="Mediseena" className="h-10 w-auto object-contain" />
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = currentPath === link.href
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-teal/15 text-teal-deep shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-teal' : 'text-slate-500'}`} />
                  {link.label}
                </a>
              )
            })}
          </nav>
        </div>

        {/* Right side controls: current role badge & user profile */}
        <div className="hidden md:flex items-center gap-3">
          {/* Current role badge (read-only, reflects the logged-in user) */}
          <div
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-2xs ${roleInfo.color}`}
            title="Your current role"
          >
            <RoleIcon className="h-3.5 w-3.5" />
            <span>{roleInfo.label}</span>
          </div>

          {/* User Profile display */}
          <div className="flex items-center gap-3 border-l border-slate-200 pl-3">
            <div className="text-right">
              <div className="text-xs font-bold text-slate-800">{user?.full_name || 'User'}</div>
              <div className="text-[10px] text-slate-500 truncate max-w-[140px]">{user?.email || 'user@mediseena.ph'}</div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-deep text-white font-bold text-xs shadow-2xs">
              {(user?.full_name || 'U').substring(0, 2).toUpperCase()}
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mobile menu hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <div className="mb-3 flex items-center justify-between border-b pb-3">
            <div>
              <div className="text-sm font-bold text-slate-800">{user?.full_name}</div>
              <div className="text-xs text-slate-500">{user?.email}</div>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleInfo.color}`}>
              {roleInfo.label}
            </span>
          </div>

          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                    currentPath === link.href ? 'bg-teal/15 text-teal-deep font-bold' : 'text-slate-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </a>
              )
            })}
          </div>

          <div className="mt-4 pt-3 border-t">
            <button
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
