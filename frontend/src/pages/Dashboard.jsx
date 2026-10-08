// ==============================================================================
// MEDISEENA PATIENT DASHBOARD
// Figma: PRESCRIPTION PAGE (PATIENT DASHBOARD) 671:7923 — sidebar + recent
// prescriptions card. Wired to usePrescriptions/useAuth; falls back to the
// Figma sample rows when the repository is empty.
// ==============================================================================

import { useMemo, useState } from 'react'
import {
  Upload,
  FileText,
  CircleUserRound,
  Settings,
  LogOut,
  Search,
} from 'lucide-react'
import logo from '../assets/logo.png'
import usePrescriptions from '../hooks/usePrescriptions.js'
import { useAuth } from '../context/AuthContext.jsx'
import { formatDate } from '../utils/Formatters.js'

// Exact sample rows from the Figma design (used when repository is empty)
const FIGMA_SAMPLE_ROWS = [
  { name: 'Omeprazole', date: 'Jul 18, 2026' },
  { name: 'Pantoprazole', date: 'Jun 29, 2026' },
  { name: 'Salbutamol', date: 'Apr 23, 2026' },
  { name: 'Amoxicillin', date: 'Apr 23, 2026' },
  { name: 'Loratadine', date: 'Mar 08, 2026' },
  { name: 'Paracetamol', date: 'Feb 14, 2026' },
  { name: 'Paracetamol', date: 'Jan 27, 2026' },
  { name: 'Ibuprofen', date: 'Dec 05, 2025' },
  { name: 'Cetirizine', date: 'Oct 19, 2025' },
  { name: 'Azithromycin', date: 'Aug 07, 2025' },
  { name: 'Cetirizine', date: 'Aug 07, 2025' },
  { name: 'Amlodipine', date: 'May 16, 2025' },
  { name: 'Cetirizine', date: 'Feb 03, 2025' },
]

const NAV_ITEMS = [
  { label: 'Upload', href: '/upload', icon: Upload, active: false },
  { label: 'My Prescriptions', href: '/dashboard', icon: FileText, active: true },
  { label: 'Profile', href: '/profile', icon: CircleUserRound, active: false },
  { label: 'Settings', href: '/settings', icon: Settings, active: false },
]

function Wordmark({ compact = false }) {
  return (
    <span
      className={`font-charon font-bold leading-none ${
        compact ? 'text-[28px]' : 'text-[30px] xl:text-[36px]'
      }`}
    >
      <span className="text-teal">Medi</span>
      <span className="text-teal-deep">seen</span>
      <span className="text-teal">a</span>
    </span>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { prescriptions } = usePrescriptions()
  const [query, setQuery] = useState('')

  const firstName = user?.full_name?.split(' ')[0] || 'Juan'

  // Flatten prescription records into per-medication rows; fall back to
  // the Figma sample rows when the repository is empty.
  const rows = useMemo(() => {
    const fromRecords = (prescriptions || []).flatMap((p) =>
      (p.medications || []).map((m) => ({
        name: m.medication_name || 'Prescription',
        date: formatDate(p.date_issued),
      })),
    )
    return fromRecords.length > 0 ? fromRecords : FIGMA_SAMPLE_ROWS
  }, [prescriptions])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => r.name.toLowerCase().includes(q))
  }, [rows, query])

  return (
    <div className="min-h-screen bg-card-bg font-poppins">
      {/* Mobile top bar (sidebar is lg+) */}
      <div className="flex items-center justify-between px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Mediseena" className="h-10 w-auto object-contain" />
          <Wordmark compact />
        </div>
        <a
          href="/logout"
          aria-label="Logout"
          className="rounded-xl p-2 text-teal-deep hover:bg-teal-light"
        >
          <LogOut className="h-5 w-5" />
        </a>
      </div>

      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 pb-12 sm:px-6 lg:px-8">
        {/* Sidebar — Figma PROFILE MENU */}
        <aside className="hidden w-[300px] shrink-0 flex-col pt-10 lg:flex xl:w-[341px]">
          <div className="flex items-center gap-3 px-2">
            <img src={logo} alt="Mediseena" className="h-12 w-auto object-contain" />
            <Wordmark />
          </div>

          <nav className="mt-10 flex flex-col gap-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-4 rounded-[12px] px-6 py-4 text-[22px] font-extralight transition ${
                    item.active
                      ? 'bg-teal-border font-normal text-white'
                      : 'text-teal-deep hover:bg-teal-light/60'
                  }`}
                >
                  <Icon className="h-7 w-7 shrink-0" strokeWidth={1.75} />
                  <span>{item.label}</span>
                </a>
              )
            })}
            <a
              href="/logout"
              className="flex items-center gap-4 rounded-[12px] px-6 py-4 text-left text-[22px] font-extralight text-teal-deep transition hover:bg-teal-light/60"
            >
              <LogOut className="h-7 w-7 shrink-0" strokeWidth={1.75} />
              <span>Logout</span>
            </a>
          </nav>
        </aside>

        {/* Main column */}
        <main className="min-w-0 flex-1 pt-2 lg:pt-10">
          <h1 className="text-center text-[28px] font-bold text-teal-deep sm:text-[36px] lg:text-[48px]">
            PATIENT DASHBOARD
          </h1>

          <section className="mt-6 rounded-[20px] bg-white px-5 py-8 shadow-sm sm:px-8 lg:px-10">
            <h2 className="text-[24px] font-semibold text-black sm:text-[32px] lg:text-[40px]">
              Welcome back, {firstName}!
            </h2>
            <p className="mt-1 text-[18px] font-medium text-black sm:text-[22px] lg:text-[27px]">
              Here are your recent prescriptions.
            </p>

            {/* Search — Figma search box */}
            <label className="mt-6 flex h-16 items-center gap-3 rounded-[12px] border-2 border-teal bg-white px-5 focus-within:border-teal-deep lg:h-[72px]">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search prescriptions"
                className="w-full bg-transparent text-[18px] font-medium text-black placeholder:text-[#bab4b4] focus:outline-none lg:text-[24px]"
              />
              <Search className="h-7 w-7 shrink-0 text-teal" strokeWidth={2} />
            </label>

            {/* Table header */}
            <div className="mt-6 grid grid-cols-[1fr_auto] items-center gap-4 border-b border-teal-light px-1 pb-3 text-[16px] font-medium text-black sm:grid-cols-[1fr_180px_210px] lg:text-[24px]">
              <span>Prescription</span>
              <span className="hidden sm:block">Date</span>
              <span className="text-right sm:text-left">Status</span>
            </div>

            {/* Rows */}
            {filtered.length === 0 ? (
              <p className="px-1 py-8 text-center text-[16px] text-slate-500">
                No prescriptions matching “{query}”.
              </p>
            ) : (
              <ul>
                {filtered.map((row, idx) => (
                  <li
                    key={`${row.name}-${row.date}-${idx}`}
                    className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-teal-light px-1 py-4 sm:grid-cols-[1fr_180px_210px] lg:py-5"
                  >
                    <span className="truncate text-[16px] font-medium text-black lg:text-[24px]">
                      {row.name}
                    </span>
                    <span className="hidden text-[16px] font-medium text-black sm:block lg:text-[24px]">
                      {row.date}
                    </span>
                    <span className="justify-self-stretch">
                      <span className="mx-[5px] block rounded-[12px] border border-black/10 bg-teal-light px-6 py-2 text-center text-[16px] font-medium text-black lg:py-2.5 lg:text-[24px]">
                        Saved
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}
