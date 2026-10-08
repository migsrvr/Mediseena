// ==============================================================================
// MEDISEENA PATIENT PROFILE
// Figma: PROFILE PAGE 671:7997 — sidebar + identity card + medical summary.
// Fields bind to the authenticated user; Figma sample values fill any gaps.
// ==============================================================================

import { useMemo, useRef, useState } from 'react'
import { Upload, FileText, CircleUserRound, Settings, LogOut } from 'lucide-react'
import logo from '../assets/logo.png'
import defaultAvatar from '../assets/profile/avatar.svg'
import emailIcon from '../assets/profile/email.svg'
import phoneIcon from '../assets/profile/phone.svg'
import calendarIcon from '../assets/profile/calendar.svg'
import locationIcon from '../assets/profile/location.svg'
import editIcon from '../assets/profile/edit.svg'
import allergiesIcon from '../assets/profile/allergies.svg'
import bloodIcon from '../assets/profile/blood.svg'
import conditionsIcon from '../assets/profile/conditions.svg'
import cameraIcon from '../assets/profile/camera.svg'
import { useAuth } from '../context/AuthContext.jsx'
import { formatDate } from '../utils/Formatters.js'

const FIGMA_DEFAULTS = {
  full_name: 'Juan Dela Cruz',
  email: 'juan.delacruz@gmail.com',
  phone_number: '+63 9123456789',
  date_of_birth: '2001-05-16',
  address: 'Metro Manila, Philippines',
  allergies: 'None',
  blood_type: 'AB',
  conditions: 'None',
}

const NAV_ITEMS = [
  { label: 'Upload', href: '/upload', icon: Upload, active: false },
  { label: 'My Prescriptions', href: '/dashboard', icon: FileText, active: false },
  { label: 'Profile', href: '/profile', icon: CircleUserRound, active: true },
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

function roleLabel(role) {
  if (!role) return 'Patient'
  return role.charAt(0).toUpperCase() + role.slice(1)
}

function FieldRow({ icon, alt, editing, value, onChange, type = 'text', placeholder }) {
  return (
    <div className="flex min-h-[23px] items-center gap-[17px]">
      <img src={icon} alt="" aria-hidden className="h-[26px] w-[30px] shrink-0 object-contain" />
      {editing ? (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full max-w-[280px] rounded-md border border-teal/40 bg-white px-2 py-0.5 text-[14px] font-normal text-black focus:border-teal-deep focus:outline-none"
        />
      ) : (
        <span className="text-[14px] font-normal text-black">{value || placeholder}</span>
      )}
    </div>
  )
}

function SummaryChip({ icon, iconBg, title, value, editing, onChange }) {
  return (
    <div className="flex min-h-[56px] flex-1 items-center gap-3 rounded-[15px] border-[0.5px] border-teal bg-[#F4F4F4] px-3 py-2 sm:px-4">
      {iconBg ? (
        <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-teal-light">
          <img src={icon} alt="" aria-hidden className="h-[29px] w-[30px] object-contain" />
        </span>
      ) : (
        <img src={icon} alt="" aria-hidden className="h-9 w-[35px] shrink-0 object-contain" />
      )}
      <div className="min-w-0 leading-tight">
        <p className="text-[20px] font-semibold text-black">{title}</p>
        {editing ? (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-transparent text-[15px] font-normal text-black focus:outline-none"
          />
        ) : (
          <p className="text-[15px] font-normal text-black">{value}</p>
        )}
      </div>
    </div>
  )
}

export default function Profile() {
  const { user, logout, updateProfile } = useAuth()
  const photoInputRef = useRef(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const seed = useMemo(
    () => ({
      full_name: user?.full_name || FIGMA_DEFAULTS.full_name,
      email: user?.email || FIGMA_DEFAULTS.email,
      phone_number: user?.phone_number || FIGMA_DEFAULTS.phone_number,
      date_of_birth: user?.date_of_birth || FIGMA_DEFAULTS.date_of_birth,
      address: user?.address || FIGMA_DEFAULTS.address,
      allergies: user?.allergies || FIGMA_DEFAULTS.allergies,
      blood_type: user?.blood_type || FIGMA_DEFAULTS.blood_type,
      conditions: user?.conditions || FIGMA_DEFAULTS.conditions,
      avatar_url: user?.avatar_url || '',
      role: user?.role || 'patient',
    }),
    [user],
  )

  const [form, setForm] = useState(seed)
  const display = editing ? form : seed
  const avatarSrc = display.avatar_url || defaultAvatar

  const setField = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }))

  const startEdit = () => {
    setForm(seed)
    setError('')
    setEditing(true)
  }

  const handlePhoto = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const next = { ...form, avatar_url: e.target.result }
      setForm(next)
      if (!editing) {
        updateProfile({ avatar_url: e.target.result }).catch(() => {})
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setError('')
    if (!form.full_name.trim()) {
      setError('Please enter your name.')
      return
    }
    setSaving(true)
    try {
      await updateProfile({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone_number: form.phone_number.trim(),
        date_of_birth: form.date_of_birth,
        address: form.address.trim(),
        allergies: form.allergies.trim() || 'None',
        blood_type: form.blood_type.trim() || 'None',
        conditions: form.conditions.trim() || 'None',
        avatar_url: form.avatar_url,
      })
      setEditing(false)
    } catch (err) {
      setError(err.message || 'Could not save profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-card-bg font-poppins">
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

        <main className="min-w-0 flex-1 pt-2 lg:pt-6">
          <section className="rounded-[20px] border-[6px] border-teal-light bg-white px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
            <h1 className="text-[28px] font-bold text-teal-deep sm:text-[36px] lg:text-[48px] lg:leading-[70px]">
              PATIENT DASHBOARD
            </h1>

            <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-[28px] font-semibold leading-tight text-black sm:text-[36px] lg:text-[40px]">
                  My Profile
                </h2>
                <p className="mt-1 text-[18px] font-medium text-black sm:text-[22px] lg:text-[24px]">
                  Manage your personal information and account details.
                </p>
              </div>

              {editing ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForm(seed)
                      setEditing(false)
                      setError('')
                    }}
                    className="inline-flex h-[47px] items-center justify-center rounded-[15px] border-[0.5px] border-black bg-white px-5 text-[18px] font-medium text-black lg:text-[20px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex h-[47px] min-w-[217px] items-center justify-center gap-2 rounded-[15px] border-[0.5px] border-black bg-teal-light px-4 text-[20px] font-medium text-black lg:text-[24px]"
                  >
                    {saving ? 'Saving…' : 'Save Profile'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={startEdit}
                  className="inline-flex h-[47px] w-[217px] items-center justify-center gap-2 rounded-[15px] border-[0.5px] border-black bg-white text-[24px] font-medium text-black"
                >
                  <img src={editIcon} alt="" aria-hidden className="h-8 w-8" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>

            {error && (
              <p className="mt-3 text-[14px] font-medium text-rose-600">{error}</p>
            )}

            <div className="mt-6 rounded-[15px] border-4 border-teal-light bg-white px-4 py-6 sm:px-6 lg:px-5 lg:py-7">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 flex-1 flex-col gap-6 sm:flex-row sm:items-start">
                  <div className="relative h-[189px] w-[189px] shrink-0">
                    <img
                      src={avatarSrc}
                      alt={`${display.full_name} avatar`}
                      className="h-full w-full rounded-full bg-white object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      aria-label="Change profile photo"
                      className="absolute bottom-[4px] right-[2px]"
                    >
                      <img src={cameraIcon} alt="" aria-hidden className="h-[43px] w-[50px]" />
                    </button>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handlePhoto(e.target.files[0])
                      }}
                    />
                  </div>

                  <div className="min-w-0 pt-1">
                    {editing ? (
                      <input
                        type="text"
                        value={form.full_name}
                        onChange={(e) => setField('full_name')(e.target.value)}
                        className="w-full max-w-[360px] border-b border-teal bg-transparent text-[28px] font-semibold text-black focus:outline-none lg:text-[36px]"
                      />
                    ) : (
                      <h3 className="text-[28px] font-semibold leading-tight text-black lg:text-[36px]">
                        {display.full_name}
                      </h3>
                    )}

                    <div className="mt-3 flex flex-col gap-[13px]">
                      <FieldRow
                        icon={emailIcon}
                        editing={editing}
                        value={display.email}
                        onChange={setField('email')}
                        type="email"
                      />
                      <FieldRow
                        icon={phoneIcon}
                        editing={editing}
                        value={display.phone_number}
                        onChange={setField('phone_number')}
                        type="tel"
                      />
                      <FieldRow
                        icon={calendarIcon}
                        editing={editing}
                        value={
                          editing
                            ? form.date_of_birth
                            : formatDate(display.date_of_birth)
                        }
                        onChange={setField('date_of_birth')}
                        type={editing ? 'date' : 'text'}
                      />
                      <FieldRow
                        icon={locationIcon}
                        editing={editing}
                        value={display.address}
                        onChange={setField('address')}
                      />
                    </div>
                  </div>
                </div>

                <span className="inline-flex h-[42px] w-[153px] shrink-0 items-center justify-center self-start rounded-[12px] border border-black bg-teal-light text-[24px] font-medium text-teal-deep">
                  {roleLabel(display.role)}
                </span>
              </div>

              <div className="mt-8 rounded-[15px] border-[0.5px] border-teal bg-white px-4 py-3 sm:px-5">
                <h4 className="text-[20px] font-semibold text-black">Medical Summary</h4>
                <p className="mt-0.5 text-[15px] font-normal text-black">
                  Important Information for your healthcare.
                </p>

                <div className="mt-4 flex flex-col gap-[15px] lg:flex-row">
                  <SummaryChip
                    icon={allergiesIcon}
                    title="Allergies"
                    value={display.allergies}
                    editing={editing}
                    onChange={setField('allergies')}
                  />
                  <SummaryChip
                    icon={bloodIcon}
                    iconBg
                    title="Blood Type"
                    value={display.blood_type}
                    editing={editing}
                    onChange={setField('blood_type')}
                  />
                  <SummaryChip
                    icon={conditionsIcon}
                    iconBg
                    title="Conditions"
                    value={display.conditions}
                    editing={editing}
                    onChange={setField('conditions')}
                  />
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
