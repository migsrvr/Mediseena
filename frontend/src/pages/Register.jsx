import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import logo from '../assets/register/logo.png'
import backArrow from '../assets/register/back_arrow.svg'
import emailIcon from '../assets/register/email_icon.svg'
import nameIcon from '../assets/register/name_icon.svg'
import passwordIcon from '../assets/register/password_icon.svg'
import lockIcon from '../assets/register/lock.svg'
import cameraIcon from '../assets/register/camera_icon.svg'
import pillIcon from '../assets/register/pill_icon.svg'
import decoHeart from '../assets/register/deco_a.svg'
import decoPlusSm from '../assets/register/deco_b.svg'
import decoPlusLg from '../assets/register/deco_c.svg'
import decoBottle from '../assets/register/deco_group_teal.svg'

function TealDivider() {
  return (
    <div className="flex items-center justify-center gap-3">
      <span className="h-[2px] w-[140px] rounded-full bg-teal sm:w-[173px]" />
      <span className="h-[12px] w-[13px] rounded-full bg-teal" />
      <span className="h-[2px] w-[140px] rounded-full bg-teal sm:w-[173px]" />
    </div>
  )
}

export default function Register() {
  const { register } = useAuth()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [role, setRole] = useState('patient') // 'patient' | 'pharmacist'
  const [agree, setAgree] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    if (!email.trim() || !name.trim() || !password || !confirm) {
      setError('Please fill in all fields.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (!agree) {
      setError('Please agree to the Terms of Service and Privacy Policy.')
      return
    }
    setLoading(true)
    try {
      const res = await register({ email: email.trim(), name: name.trim(), password, role })
      if (res?.needsEmailConfirmation) {
        setSuccessMsg('Account created successfully! A confirmation email has been sent. Please confirm your email before signing in (or disable "Confirm email" in your Supabase Auth settings to log in immediately).')
      } else {
        window.location.href = '/dashboard'
      }
    } catch (err) {
      setError(err.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = agree && !loading

  return (
    <div className="flex min-h-screen w-full flex-col bg-white font-poppins lg:flex-row">
      {/* Left white panel */}
      <section className="relative flex w-full flex-col overflow-hidden bg-white px-8 py-8 sm:px-14 lg:min-h-screen lg:w-[50.7%] lg:px-[54px] lg:py-[47px]">
        <img src={decoPlusSm} alt="" aria-hidden className="pointer-events-none absolute left-[32px] top-[110px] w-[63px]" />
        <img src={decoHeart} alt="" aria-hidden className="pointer-events-none absolute left-[12px] top-[48%] w-[106px]" />
        <img src={decoPlusLg} alt="" aria-hidden className="pointer-events-none absolute bottom-[40px] left-[24px] w-[82px]" />
        <img src={decoBottle} alt="" aria-hidden className="pointer-events-none absolute bottom-[24px] right-[32px] w-[91px]" />
        <a href="/landing-page" aria-label="Back" className="relative z-10 block h-[30px] w-[24px]">
          <img src={backArrow} alt="Back" className="h-full w-full" />
        </a>

        <div className="relative z-10 mx-auto flex w-full max-w-[560px] flex-1 flex-col items-center py-10 text-center lg:py-6">
          <h1 className="text-[34px] font-bold text-teal sm:text-[50px]">Hello, Friend!</h1>

          <div className="mt-4 flex items-center justify-center gap-3">
            <img src={logo} alt="Mediseena logo" className="h-[64px] w-auto object-contain sm:h-[92px]" />
            <p className="font-charon text-[42px] font-bold leading-none sm:text-[64px]">
              <span className="text-teal">Medi</span>
              <span className="text-teal-deep">seen</span>
              <span className="text-teal">a</span>
            </p>
          </div>

          <div className="mt-5">
            <TealDivider />
          </div>
          <p className="mt-3 text-[18px] text-black sm:text-[20px]">Your Smart Prescription Assistant</p>

          <div className="mt-10 w-full max-w-[420px] space-y-8 text-left">
            <div className="flex items-center gap-5">
              <span className="flex h-[88px] w-[90px] shrink-0 items-center justify-center rounded-full bg-teal-light">
                <img src={cameraIcon} alt="" aria-hidden className="h-[40px] w-[44px]" />
              </span>
              <div>
                <p className="text-[20px] text-black">Scan Prescription</p>
                <p className="mt-1 text-[13px] text-black">Quickly digitize handwritten prescriptions</p>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <span className="flex h-[88px] w-[90px] shrink-0 items-center justify-center rounded-full bg-teal-light">
                <img src={pillIcon} alt="" aria-hidden className="h-[40px] w-[40px]" />
              </span>
              <div>
                <p className="text-[20px] text-black">Scan Prescription</p>
                <p className="mt-1 text-[13px] text-black">Quickly digitize handwritten prescriptions</p>
              </div>
            </div>
          </div>

          <div className="mt-12 w-full max-w-[375px]">
            <div className="h-[2px] w-full bg-teal/40" />
            <p className="mt-3 text-[13px] text-black">© 2026 Mediseena</p>
            <p className="mt-2 text-[13px] font-bold text-teal">
              <a href="/privacy" className="hover:underline">
                Privacy Policy
              </a>
              <span className="mx-2 text-teal/60">•</span>
              <a href="/terms" className="hover:underline">
                Terms of Service
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Right teal panel */}
      <section className="relative flex w-full flex-1 items-center justify-center bg-teal px-6 py-10 text-white sm:px-12 lg:w-[49.3%] lg:min-h-screen lg:px-8">
        <div className="w-full max-w-[550px]">
          <h1 className="text-center text-[38px] font-bold leading-none sm:text-[52px] lg:text-[68px]">
            Create Account
          </h1>

          <form onSubmit={handleSubmit} className="mt-10 space-y-6" noValidate>
            <label className="flex h-[62px] items-center gap-3 rounded-[6px] border-[3px] border-white bg-teal px-5 focus-within:bg-teal-deep/20">
              <img src={emailIcon} alt="" aria-hidden className="h-[24px] w-[24px] shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                autoComplete="email"
                className="w-full bg-transparent text-[20px] font-medium text-white placeholder:text-white focus:outline-none"
              />
            </label>

            <label className="flex h-[62px] items-center gap-3 rounded-[6px] border-[3px] border-white bg-teal px-5 focus-within:bg-teal-deep/20">
              <img src={nameIcon} alt="" aria-hidden className="h-[24px] w-[24px] shrink-0" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                autoComplete="name"
                className="w-full bg-transparent text-[20px] font-medium text-white placeholder:text-white focus:outline-none"
              />
            </label>

            <label className="flex h-[62px] items-center gap-3 rounded-[6px] border-[3px] border-white bg-teal px-5 focus-within:bg-teal-deep/20">
              <img src={passwordIcon} alt="" aria-hidden className="h-[24px] w-[24px] shrink-0" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="new-password"
                className="w-full bg-transparent text-[20px] font-medium text-white placeholder:text-white focus:outline-none"
              />
            </label>

            <label className="flex h-[62px] items-center gap-3 rounded-[6px] border-[3px] border-white bg-teal px-5 focus-within:bg-teal-deep/20">
              <img src={lockIcon} alt="" aria-hidden className="h-[24px] w-[24px] shrink-0" />
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm Password"
                autoComplete="new-password"
                className="w-full bg-transparent text-[20px] font-medium text-white placeholder:text-white focus:outline-none"
              />
            </label>

            {error && <p className="text-[16px] font-medium text-rose-200 bg-rose-900/40 p-3 rounded-lg border border-rose-300/40">{error}</p>}
            {successMsg && (
              <div className="text-[14px] font-medium text-emerald-900 bg-emerald-100 p-4 rounded-xl border border-emerald-300">
                <p className="font-bold mb-1">✓ {successMsg}</p>
                <a href="/login" className="font-bold text-teal-deep underline text-xs mt-2 inline-block">
                  Proceed to Sign In →
                </a>
              </div>
            )}

            {/* Role Selection (Section 3.3 System Users) */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-white/90">Select Account Role (Section 3.3):</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('patient')}
                  className={`rounded-lg py-2.5 px-3 text-sm font-bold border-2 transition ${
                    role === 'patient'
                      ? 'bg-white text-teal border-white shadow-xs'
                      : 'bg-transparent text-white border-white/60 hover:border-white'
                  }`}
                >
                  Patient
                </button>
                <button
                  type="button"
                  onClick={() => setRole('pharmacist')}
                  className={`rounded-lg py-2.5 px-3 text-sm font-bold border-2 transition ${
                    role === 'pharmacist'
                      ? 'bg-white text-teal border-white shadow-xs'
                      : 'bg-transparent text-white border-white/60 hover:border-white'
                  }`}
                >
                  Pharmacist / HCW
                </button>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-[16px] text-white">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="h-[20px] w-[20px] cursor-pointer appearance-none rounded-[3px] border-2 border-white bg-transparent checked:bg-white"
              />
              <span>I agree to the Terms of Service and Privacy Policy</span>
            </label>

            <button
              type="submit"
              disabled={!canSubmit}
              className="h-[62px] w-full rounded-[6px] bg-white text-[25px] font-bold text-teal transition hover:bg-teal-light disabled:cursor-not-allowed disabled:bg-white/60 disabled:text-teal/70"
            >
              {loading ? 'CREATING…' : 'Create Account'}
            </button>

            <div className="flex items-center gap-3 text-[13px] text-white">
              <span className="h-px flex-1 bg-white/70" />
              <span>or</span>
              <span className="h-px flex-1 bg-white/70" />
            </div>
            <p className="text-center text-[13px] text-white">
              Already have an account?{' '}
              <a href="/login" className="font-bold hover:underline">
                Sign In
              </a>
            </p>
          </form>
        </div>
      </section>
    </div>
  )
}
