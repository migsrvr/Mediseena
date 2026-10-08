// ==============================================================================
// MEDISEENA LOGOUT PAGE
// Figma: LOGOUT PAGE 773:3600 — sidebar + confirmation card with large brand
// wordmark centered and a Logout confirm button at the bottom of the card.
// ==============================================================================

import { useState } from 'react'
import { Upload, FileText, CircleUserRound, Settings, LogOut } from 'lucide-react'
import logo from '../assets/logo.png'
import { useAuth } from '../context/AuthContext.jsx'

const NAV_ITEMS = [
  { label: 'Upload', href: '/upload', icon: Upload, active: false },
  { label: 'My Prescriptions', href: '/dashboard', icon: FileText, active: false },
  { label: 'Profile', href: '/profile', icon: CircleUserRound, active: false },
  { label: 'Settings', href: '/settings', icon: Settings, active: false },
]

function Wordmark({ className = '' }) {
  return (
    <span className={`font-charon font-bold leading-none ${className}`}>
      <span className="text-teal">Medi</span>
      <span className="text-teal-deep">seen</span>
      <span className="text-teal">a</span>
    </span>
  )
}

export default function LogoutPage() {
  const { logout } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    await logout()
  }

  return (
    <div className="min-h-screen bg-card-bg font-poppins">
      {/* ── Mobile top bar (sidebar only visible on lg+) ──────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Mediseena" className="h-10 w-auto object-contain" />
          <Wordmark className="text-[28px]" />
        </div>
        {/* On mobile, the logout button directly triggers the action */}
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Logout"
          className="rounded-xl p-2 text-teal-deep hover:bg-teal-light"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 pb-12 sm:px-6 lg:px-8">
        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <aside className="hidden w-[300px] shrink-0 flex-col pt-10 lg:flex xl:w-[341px]">
          <div className="flex items-center gap-3 px-2">
            <img src={logo} alt="Mediseena" className="h-12 w-auto object-contain" />
            <Wordmark className="text-[30px] xl:text-[36px]" />
          </div>

          <nav className="mt-10 flex flex-col gap-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-4 rounded-[12px] px-6 py-4 text-[22px] font-extralight text-teal-deep transition hover:bg-teal-light/60"
                >
                  <Icon className="h-7 w-7 shrink-0" strokeWidth={1.75} />
                  <span>{item.label}</span>
                </a>
              )
            })}

            {/* Logout — active / highlighted in the sidebar */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-4 rounded-[12px] bg-teal-border px-6 py-4 text-left text-[22px] font-normal text-white transition hover:bg-teal-border/90"
            >
              <LogOut className="h-7 w-7 shrink-0" strokeWidth={1.75} />
              <span>Logout</span>
            </button>
          </nav>
        </aside>

        {/* ── Main column ─────────────────────────────────────────────────── */}
        <main className="min-w-0 flex-1 pt-2 lg:pt-10">
          <h1 className="text-center text-[28px] font-bold text-teal-deep sm:text-[36px] lg:text-[40px]">
            PATIENT DASHBOARD
          </h1>

          {/* White card — Figma node 773:3602 */}
          <section className="relative mt-6 flex min-h-[700px] flex-col items-center justify-center rounded-[20px] bg-white shadow-sm lg:min-h-[832px]">

            {/* ── Centered brand area (LogoTwitch in Figma) ─────────────── */}
            <div className="flex flex-col items-center gap-6 px-6 py-16">
              {/* Large logo image */}
              <div className="relative h-[200px] w-[220px] overflow-hidden sm:h-[260px] sm:w-[285px] lg:h-[320px] lg:w-[350px]">
                <img
                  src={logo}
                  alt="Mediseena logo"
                  className="absolute left-[-67.57%] top-[-34.25%] h-[252%] w-[232%] max-w-none object-contain pointer-events-none"
                />
              </div>

              {/* Large wordmark — Figma: Iosevka Charon, ~96px */}
              <Wordmark className="text-[56px] sm:text-[72px] lg:text-[96px]" />

              {/* Confirmation copy */}
              <p className="mt-2 max-w-[460px] text-center text-[16px] font-medium text-teal-deep lg:text-[20px]">
                Are you sure you want to log out of your Mediseena account?
              </p>

              {/* Action buttons */}
              <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
                <a
                  href="/dashboard"
                  className="inline-flex h-[42px] w-[146px] items-center justify-center rounded-[8px] border border-teal-deep bg-white text-[18px] font-semibold text-teal-deep transition hover:bg-teal-light/40"
                >
                  Cancel
                </a>

                {/* Logout confirm button — Figma node 773:3605: bg-[#5fa7a2], rounded-[8px], white "Logout" text */}
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loading}
                  className="inline-flex h-[42px] w-[146px] items-center justify-center rounded-[8px] bg-[#5fa7a2] text-[20px] font-semibold text-white transition hover:bg-teal-deep disabled:opacity-60"
                >
                  {loading ? 'Logging out…' : 'Logout'}
                </button>
              </div>
            </div>

          </section>
        </main>
      </div>
    </div>
  )
}
