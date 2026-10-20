// Account authentication and per-user profile persistence, with an explicit local account fallback.
import { supabase, isLiveSupabaseConfigured } from './api.js'

const SESSION_KEY = 'mediseena_auth_session'
const PROFILES_KEY = 'mediseena_user_profiles'
const ACCOUNTS_KEY = 'mediseena_registered_users'
const SIGNED_OUT_KEY = 'mediseena_signed_out'
const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i
const profileFields = ['full_name', 'phone_number', 'avatar_url', 'date_of_birth', 'address',
  'allergies', 'blood_type', 'conditions', 'organization', 'license_number']
const defaultProfile = { phone_number: '', avatar_url: null, date_of_birth: '', address: '',
  allergies: 'None', blood_type: 'None', conditions: 'None' }

function readJSON(storage, key, fallback) {
  try { return JSON.parse(storage.getItem(key) || 'null') ?? fallback } catch { return fallback }
}

function accounts() {
  const stored = readJSON(localStorage, ACCOUNTS_KEY, [])
  return Array.isArray(stored) ? stored : Object.values(stored || {})
}

function profiles() {
  const stored = readJSON(localStorage, PROFILES_KEY, {})
  return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {}
}

function editableFields(source = {}) {
  return Object.fromEntries(profileFields.filter(field => Object.hasOwn(source, field) && source[field] !== undefined)
    .map(field => [field, source[field]]))
}

function publicUser(account) {
  if (!account?.id) return null
  const { password, password_hash, password_salt, ...user } = account
  return user
}

function hydrate(user) {
  if (!user?.id) return null
  return { ...defaultProfile, ...publicUser(user), ...editableFields(profiles()[user.id] || {}) }
}

function activeSession() {
  // A session-only sign-in in this tab takes precedence over a remembered sign-in.
  const temporary = readJSON(sessionStorage, SESSION_KEY, null)
  const remembered = readJSON(localStorage, SESSION_KEY, null)
  return temporary?.id ? temporary : remembered?.id ? remembered : null
}

function saveProfile(userId, updates) {
  const stored = profiles()
  stored[userId] = { ...editableFields(stored[userId]), ...editableFields(updates) }
  localStorage.setItem(PROFILES_KEY, JSON.stringify(stored))
}

function saveSession(user, remember = true) {
  const previous = activeSession()
  if (previous?.id && previous.id !== user.id) sessionStorage.removeItem('mediseena_pending_review')
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(SIGNED_OUT_KEY)
  const hydrated = hydrate(user)
  ;(remember ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(hydrated))
  return hydrated
}

function persistActive(user) {
  const remembered = localStorage.getItem(SESSION_KEY) !== null
  const temporary = sessionStorage.getItem(SESSION_KEY) !== null
  if (remembered) localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  if (temporary) sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
  if (!remembered && !temporary) localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

function unavailable(error) {
  return error?.status >= 500 || error?.status === 0 ||
    ['TypeError', 'AuthRetryableFetchError', 'TimeoutError', 'AbortError'].includes(error?.name) ||
    /fetch|network|offline|unavailable|timeout|ECONN|ENOTFOUND|EAI_AGAIN/i.test(error?.message || '')
}

const hex = bytes => Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
const unhex = value => Uint8Array.from(value.match(/.{2}/g) || [], byte => parseInt(byte, 16))
async function passwordDigest(password, salt, iterations) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const result = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, key, 256)
  return hex(new Uint8Array(result))
}

async function storedPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iterations = 100000
  return { algorithm: 'PBKDF2-SHA256', salt: hex(salt), iterations, digest: await passwordDigest(password, salt, iterations) }
}

async function passwordMatches(password, stored) {
  // Permit a successful legacy local credential to be upgraded on its next login.
  if (typeof stored === 'string') return password === stored
  if (stored?.algorithm !== 'PBKDF2-SHA256' || !/^[0-9a-f]{32}$/i.test(stored.salt || '') ||
      !Number.isInteger(stored.iterations) || stored.iterations < 100000 || stored.iterations > 1000000) return false
  return await passwordDigest(password, unhex(stored.salt), stored.iterations) === stored.digest
}

async function remoteProfile(id) {
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
    return error ? null : data
  } catch { return null }
}

function remoteUser(user, profile, previous) {
  const sameUser = previous?.id === user.id ? previous : {}
  return hydrate({ ...defaultProfile, ...editableFields(sameUser), ...editableFields(profile || {}),
    id: user.id, email: user.email,
    full_name: profile?.full_name || sameUser.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || '',
    // Only the profile table or a previously authenticated session supplies a role.
    role: profile?.role || sameUser.role || 'patient', isLive: true,
  })
}

function profileDbPayload(profile) {
  return Object.fromEntries(profileFields.map(field => [field, profile[field] === '' ? null : profile[field] ?? null]))
}

export const authService = {
  async getSession() {
    if (localStorage.getItem(SIGNED_OUT_KEY) === 'true') return { user: null, role: 'patient', isLive: false }
    const cached = activeSession()
    const localAccount = cached && accounts().find(account => account.id === cached.id)
    if (localAccount) {
      const user = hydrate({ ...publicUser(localAccount), ...publicUser(cached), isLive: false })
      persistActive(user)
      return { user, role: user.role || 'patient', isLive: false }
    }
    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (!error && data?.session?.user) {
          const raw = data.session.user
          const user = remoteUser(raw, await remoteProfile(raw.id), cached)
          persistActive(user)
          return { user, role: user.role, isLive: true }
        }
      } catch { /* An existing authenticated session and profile remain usable offline. */ }
    }
    if (cached && UUID_PATTERN.test(cached.id)) {
      const user = hydrate(cached)
      persistActive(user)
      return { user, role: user.role || 'patient', isLive: false }
    }
    // Legacy fabricated demo sessions do not create an authenticated account.
    localStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(SESSION_KEY)
    return { user: null, role: 'patient', isLive: false }
  },

  async login(email, password, remember = true) {
    const normalizedEmail = String(email || '').trim().toLowerCase()
    if (!normalizedEmail || !password) throw new Error('Email and password are required.')
    const registered = accounts()
    const local = registered.find(account => String(account.email).trim().toLowerCase() === normalizedEmail)
    if (local) {
      if (!await passwordMatches(password, local.password)) throw new Error('Invalid email or password.')
      if (typeof local.password === 'string') {
        local.password = await storedPassword(password)
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(registered))
      }
      return saveSession({ ...publicUser(local), isLive: false }, remember)
    }
    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
        if (error) throw error
        if (!data?.user) throw new Error('Authentication service is unavailable.')
        const profile = await remoteProfile(data.user.id)
        return saveSession(remoteUser(data.user, profile, activeSession()), remember)
      } catch (error) {
        if (!unavailable(error)) throw error
        throw new Error('Sign-in is unavailable and no local account matches this email. Register a local account to continue offline.')
      }
    }
    throw new Error('Invalid email or password. Register an account before signing in.')
  },

  async register({ email, name, password, role = 'patient', licenseNumber = '' }) {
    const normalizedEmail = String(email || '').trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || !String(name || '').trim() || typeof password !== 'string' || password.length < 6) {
      throw new Error('A valid email, full name, and password of at least six characters are required.')
    }
    if (!['patient', 'pharmacist'].includes(role)) throw new Error('Choose a supported registration role.')
    if (accounts().some(account => String(account.email).trim().toLowerCase() === normalizedEmail)) {
      throw new Error('An account with this email is already registered.')
    }
    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signUp({ email: normalizedEmail, password,
          options: { data: { full_name: name.trim(), license_number: licenseNumber || null } } })
        if (error) throw error
        if (!data?.user) throw new Error('Registration service is unavailable.')
        const profile = data.session ? await remoteProfile(data.user.id) : null
        const user = remoteUser(data.user, profile, null)
        saveProfile(user.id, { full_name: user.full_name })
        if (data.session) return saveSession(user)
        return { ...user, needsEmailConfirmation: true }
      } catch (error) {
        if (!unavailable(error)) throw error
      }
    }
    const credential = await storedPassword(password)
    // Recheck after asynchronous hashing to avoid duplicate concurrent registrations in this tab.
    const registered = accounts()
    if (registered.some(account => String(account.email).trim().toLowerCase() === normalizedEmail)) {
      throw new Error('An account with this email is already registered.')
    }
    const user = { ...defaultProfile, id: `local_${crypto.randomUUID()}`, email: normalizedEmail,
      full_name: name.trim(), role, license_number: licenseNumber, isLive: false,
      registeredAt: new Date().toISOString() }
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...registered, { ...user, password: credential }]))
    saveProfile(user.id, user)
    return saveSession(user)
  },

  switchRole(targetRole) {
    const user = hydrate(activeSession())
    if (!user) throw new Error('Sign in before changing account settings.')
    if (targetRole !== user.role) throw new Error('Role changes require an administrator.')
    return user
  },

  async updateProfile(updates = {}) {
    const current = activeSession() || (await this.getSession()).user
    if (!current?.id) throw new Error('Sign in before updating your profile.')
    saveProfile(current.id, updates)
    const updated = hydrate(current)
    persistActive(updated)
    if (isLiveSupabaseConfigured && UUID_PATTERN.test(current.id)) {
      try {
        const { error } = await supabase.from('profiles').update(profileDbPayload(updated)).eq('id', current.id)
        if (error) throw error
      } catch { console.warn('Profile saved in this browser; remote profile update is unavailable.') }
    }
    // A slower remote request must not restore a different user or an earlier edit.
    return hydrate(activeSession())
  },

  async logout() {
    localStorage.setItem(SIGNED_OUT_KEY, 'true')
    localStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem('mediseena_pending_review')
    if (isLiveSupabaseConfigured) {
      try { await supabase.auth.signOut() } catch { /* Local sign-out remains effective offline. */ }
    }
    return true
  },
}
