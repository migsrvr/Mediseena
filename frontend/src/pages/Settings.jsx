
import { useState, useEffect } from 'react'
import { Upload, FileText, CircleUserRound, Settings, LogOut, Bell, Globe, Calendar, Clock } from 'lucide-react'
import logo from '../assets/logo.png'
import { useAuth } from '../context/AuthContext.jsx'

const NAV_ITEMS = [
  { label: 'Upload', href: '/upload', icon: Upload, active: false },
  { label: 'My Prescriptions', href: '/dashboard', icon: FileText, active: false },
  { label: 'Profile', href: '/profile', icon: CircleUserRound, active: false },
  { label: 'Settings', href: '/settings', icon: Settings, active: true },
]

const TABS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'notifications', label: 'Notifications', icon: Bell },
]

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'tl', label: 'Tagalog' },
  { value: 'es', label: 'Spanish' },
]

const DATE_FORMAT_OPTIONS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
]

const TIME_FORMAT_OPTIONS = [
  { value: '12', label: '12-hour' },
  { value: '24', label: '24-hour' },
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

function Dropdown({ label, description, value, options, onChange, icon: Icon }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[12px] border-2 border-teal bg-white px-5 py-4 lg:px-6">
      <div className="flex-1">
        <h3 className="text-[20px] font-semibold text-black lg:text-[24px]">{label}</h3>
        <p className="mt-1 text-[16px] font-normal text-black/70 lg:text-[18px]">{description}</p>
      </div>
      <div className="relative w-[280px]">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          {Icon && <Icon className="h-6 w-6 text-teal" strokeWidth={1.5} />}
        </div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-[10px] border border-gray-300 bg-white py-3.5 pl-14 pr-10 text-[16px] font-medium text-teal lg:text-[18px] focus:border-teal-deep focus:outline-none focus:ring-1 focus:ring-teal-deep"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}

function ToggleSwitch({ label, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[12px] border-2 border-teal bg-white px-5 py-4 lg:px-6">
      <div className="flex-1">
        <h3 className="text-[20px] font-semibold text-black lg:text-[24px]">{label}</h3>
        {description && (
          <p className="mt-1 text-[16px] font-normal text-black/70 lg:text-[18px]">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-8 w-14 shrink-0 rounded-full transition lg:h-9 lg:w-16 ${
          checked ? 'bg-teal' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition lg:h-7 lg:w-7 ${
            checked ? 'left-7 lg:left-8' : 'left-1'
          }`}
        />
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('general')

  // Load settings from localStorage or use defaults
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('mediseena_settings')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return {
          language: 'en',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12',
          prescriptionReminders: true,
          emailNotifications: false,
        }
      }
    }
    return {
      language: 'en',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12',
      prescriptionReminders: true,
      emailNotifications: false,
    }
  })

  // Persist settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('mediseena_settings', JSON.stringify(settings))
  }, [settings])

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="min-h-screen bg-card-bg font-poppins">
      {/* Mobile top bar */}
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
        {/* Sidebar */}
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

        {/* Main content */}
        <main className="min-w-0 flex-1 pt-2 lg:pt-6">
          <section className="rounded-[20px] border-[6px] border-teal-light bg-white px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
            <h1 className="text-[28px] font-bold text-teal-deep sm:text-[36px] lg:text-[48px] lg:leading-[70px]">
              PATIENT DASHBOARD
            </h1>

            <div className="mt-2">
              <h2 className="text-[28px] font-semibold leading-tight text-black sm:text-[36px] lg:text-[40px]">
                Settings
              </h2>
              <p className="mt-1 text-[18px] font-medium text-black sm:text-[22px] lg:text-[24px]">
                Customize your Mediseena experience.
              </p>
            </div>

            {/* Tabs */}
            <div className="mt-6 flex gap-2 border-b-2 border-teal-light">
              {TABS.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 text-[18px] font-medium transition lg:text-[22px] ${
                      activeTab === tab.id
                        ? 'border-b-4 border-teal-deep text-teal-deep'
                        : 'text-black/60 hover:text-black'
                    }`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="mt-8 space-y-6">
                <Dropdown
                  label="Language"
                  description="Choose your preferred language."
                  value={settings.language}
                  options={LANGUAGE_OPTIONS}
                  onChange={(val) => updateSetting('language', val)}
                  icon={Globe}
                />

                <Dropdown
                  label="Date Format"
                  description="Choose your preferred date format."
                  value={settings.dateFormat}
                  options={DATE_FORMAT_OPTIONS}
                  onChange={(val) => updateSetting('dateFormat', val)}
                  icon={Calendar}
                />

                <Dropdown
                  label="Time Format"
                  description="Choose your preferred time format."
                  value={settings.timeFormat}
                  options={TIME_FORMAT_OPTIONS}
                  onChange={(val) => updateSetting('timeFormat', val)}
                  icon={Clock}
                />
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="mt-8 space-y-6">
                <ToggleSwitch
                  label="Prescription Reminders"
                  description="Get notified when it's time to refill or take your medication."
                  checked={settings.prescriptionReminders}
                  onChange={(val) => updateSetting('prescriptionReminders', val)}
                />

                <ToggleSwitch
                  label="Email Notifications"
                  description="Receive updates and alerts via email at your registered address."
                  checked={settings.emailNotifications}
                  onChange={(val) => updateSetting('emailNotifications', val)}
                />

                {/* Info banner */}
                <div className="flex items-start gap-3 rounded-[10px] border border-teal/30 bg-teal-light/20 px-4 py-3">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-teal-deep" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <p className="text-[14px] font-normal text-teal-deep">
                    You can update your notification preferences anytime.
                  </p>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}
