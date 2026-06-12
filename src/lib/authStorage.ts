export const USER_STORE_KEY = 'user-store'

export const clearLegacyAuthStorage = () => {
  if (typeof window === 'undefined') return

  sessionStorage.removeItem(USER_STORE_KEY)
  sessionStorage.removeItem('access_token')
}

export const hasPersistedUser = () => {
  if (typeof window === 'undefined') return false

  const storedUser = localStorage.getItem(USER_STORE_KEY)
  if (!storedUser) return false

  try {
    return Boolean(JSON.parse(storedUser).state?.user)
  } catch {
    localStorage.removeItem(USER_STORE_KEY)
    return false
  }
}
