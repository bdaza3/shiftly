// Client-side input sanitization helpers


export function sanitizeString(value: string, maxLength = 500) {
  if (value === null || value === undefined) return ''
  if (typeof value !== 'string') value = String(value)
  // remove control characters except newline/tab, collapse whitespace
  let s = value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  s = s.replace(/\s+/g, ' ')
  s = s.trim()
  // remove angle brackets to reduce risk of injected HTML
  s = s.replace(/[<>]/g, '')
  if (s.length > maxLength) s = s.slice(0, maxLength)
  return s
}

export function sanitizeEmail(value: string) {
  if (value === null || value === undefined) return ''
  if (typeof value !== 'string') value = String(value)
  const s = value.trim().toLowerCase()
  // length cap of 254 chars (max length of email local part + domain is 254)
  return s.slice(0, 254)
}

export function sanitizePassword(value: string) {
  if (value === null || value === undefined) return ''
  if (typeof value !== 'string') value = String(value)
  // don't trim password (user may include leading/trailing spaces intentionally), but cap length
  return value.length > 256 ? value.slice(0, 256) : value
}

export function sanitizePhone(value: string) {
  if (value === null || value === undefined) return ''
  if (typeof value !== 'string') value = String(value)
  const s = value.replace(/[^0-9+()\-\s]/g, '').trim()
  // length cap of 15 chars (max length of E.164 international phone numbers)
  return s.slice(0, 15)
}

export function sanitizeJoinCode(value: string) {
  if (value === null || value === undefined) return ''
  if (typeof value !== 'string') value = String(value)
  //only uppercase letters and numbers, max length 6
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
}
