import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import logo from '../assets/login/logo.png'
import emailIcon from '../assets/login/email_icon.svg'
import passwordIcon from '../assets/login/password_icon.svg'
import backArrow from '../assets/login/back_arrow.svg'
import decoHeart from '../assets/login/deco1.svg'
import decoClipboard from '../assets/login/deco2.svg'
import decoPlusSm from '../assets/login/deco3.svg'
import decoPlusLg from '../assets/login/deco4.svg'
import decoPill from '../assets/login/deco5.svg'
import decoBottle from '../assets/login/deco_group.svg'

function Divider({ color = '#60aba8', lineWidth = 'w-[173px]' }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span className={`h-[2px] ${lineWidth} rounded-full`} style={{ backgroundColor: color }} />
      <span className="h-[12px] w-[13px] rounded-full" style={{ backgroundColor: color }} />
      <span className={`h-[2px] ${lineWidth} rounded-full`} style={{ backgroundColor: color }} />
    </div>
  )
}

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }
    setLoading(true)
    try {
      await login(email.trim(), password, remember)
      window.location.href = '/dashboard'
    } catch (err) {
      if (err.message?.toLowerCase().includes('email not confirmed')) {
        setError('Email not confirmed yet. Please check your email inbox to verify your account, or turn OFF "Confirm email" in your Supabase Auth settings to log in immediately.')
      } else if (err.message?.toLowerCase().includes('invalid login credentials')) {
        setError('Invalid email or password. Please check your credentials and try again.')
      } else {
        setError(err.message || 'Login failed. Please verify credentials.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-white font-poppins lg:flex-row">
      {/* Left panel */}
      <section className="relative flex w-full flex-col overflow-hidden bg-teal px-8 py-8 text-white sm:px-14 lg:min-h-screen lg:w-[50.7%] lg:px-[96px] lg:py-[47px]">
        {/* decorative medical icons — exact Figma SVGs, white 29% opacity built into file */}
        <img src={decoPlusSm} alt="" aria-hidden className="pointer-events-none absolute left-[28px] top-[104px] w-[63px] opacity-90" />
        <img src={decoPill} alt="" aria-hidden className="pointer-events-none absolute right-[38px] top-[28px] w-[74px]" />
        <img src={decoClipboard} alt="" aria-hidden className="pointer-events-none absolute bottom-[220px] right-[40px] w-[75px]" />
        <img src={decoPlusLg} alt="" aria-hidden className="pointer-events-none absolute bottom-[120px] left-[96px] w-[82px]" />
        <img src={decoBottle} alt="" aria-hidden className="pointer-events-none absolute bottom-[24px] right-[48px] w-[91px]" />
        <img src={decoHeart} alt="" aria-hidden className="pointer-events-none absolute bottom-[28px] left-[12px] w-[61px]" />

        <a href="/landing-page" aria-label="Back" className="relative z-10 block h-[30px] w-[24px]">
          <img src={backArrow} alt="Back" className="h-full w-full" />
        </a>

        <div className="relative z-10 mx-auto flex w-full max-w-[560px] flex-1 flex-col justify-center py-12 lg:py-0">
          <h1 className="text-center font-bold leading-none text-[42px] sm:text-[56px] lg:text-[77px]">
            Welcome Back!
          </h1>
          <div className="mt-5 flex items-center justify-center gap-4">
            <span className="h-[2px] w-[140px] rounded-full bg-white/90 sm:w-[200px] lg:w-[233px]" />
            <span className="h-[14px] w-[18px] rounded-full bg-white" />
            <span className="h-[2px] w-[140px] rounded-full bg-white/90 sm:w-[200px] lg:w-[233px]" />
          </div>

          <h2 className="mt-14 text-[28px] font-bold lg:mt-[76px] lg:text-[40px]">New to Mediseena?</h2>
          <p className="mt-4 max-w-[508px] text-[20px] font-medium leading-snug lg:text-[30px]">
            Create an account to transform handwritten prescriptions into clear, accessible digital records.
          </p>

          <a
            href="/register"
            className="mt-10 flex h-[62px] w-full max-w-[400px] items-center justify-center rounded-[20px] bg-white text-[25px] font-bold text-teal transition hover:bg-teal-light"
          >
            SIGN UP
          </a>
        </div>
      </section>

      {/* Right panel */}
      <section className="flex w-full flex-1 items-center justify-center bg-white px-6 py-10 sm:px-12 lg:w-[49.3%] lg:min-h-screen lg:px-8">
        <div className="w-full max-w-[550px]">
          <div className="flex flex-col items-center text-center">
            <img src={logo} alt="Mediseena logo" className="h-[120px] w-auto object-contain sm:h-[150px]" />
            <h1 className="mt-2 text-[34px] font-bold text-teal sm:text-[42px]">Welcome Back!</h1>
            <p className="mt-1 text-[18px] text-black sm:text-[20px]">Log in to continue to your account</p>
            <div className="mt-4">
              <Divider />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-10 space-y-6" noValidate>
            <label className="flex h-[62px] items-center gap-3 rounded-[6px] border-2 border-teal-border bg-white px-5 focus-within:border-teal">
              <img src={emailIcon} alt="" aria-hidden className="h-[24px] w-[24px] shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                autoComplete="email"
                className="w-full bg-transparent text-[20px] font-medium text-teal-deep placeholder:text-teal focus:outline-none"
              />
            </label>

            <label className="flex h-[62px] items-center gap-3 rounded-[6px] border-2 border-teal-border bg-white px-5 focus-within:border-teal">
              <img src={passwordIcon} alt="" aria-hidden className="h-[24px] w-[24px] shrink-0" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                className="w-full bg-transparent text-[20px] font-medium text-teal-deep placeholder:text-teal focus:outline-none"
              />
            </label>

            {error && <p className="text-[16px] text-red-600">{error}</p>}

            <div className="flex items-center justify-between text-[16px] text-teal">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-[24px] w-[24px] cursor-pointer appearance-none rounded-[4px] border-2 border-teal bg-white checked:bg-teal"
                />
                <span>Remember me</span>
              </label>
              <a href="/forgot-password" className="hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-[62px] w-full rounded-[16px] bg-teal text-[25px] font-bold text-white transition hover:bg-teal-deep disabled:opacity-60"
            >
              {loading ? 'SIGNING IN…' : 'SIGN IN'}
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
