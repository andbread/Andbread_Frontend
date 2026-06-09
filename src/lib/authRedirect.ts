export const getInternalRedirectPath = (next: string | null) => {
  if (
    !next ||
    !next.startsWith('/') ||
    next.startsWith('//') ||
    next.includes('\\')
  ) {
    return '/'
  }

  return next
}
