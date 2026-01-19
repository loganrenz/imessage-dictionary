export function normalizeTerm(term) {
  if (!term) return ''
  return String(term).trim().toLowerCase()
}

export function canonicalPath(term) {
  const normalized = normalizeTerm(term)
  return `/w/${encodeURIComponent(normalized)}`
}

export function isPhraseTerm(term) {
  const normalized = normalizeTerm(term)
  if (!normalized) return false
  return /[\s/]/.test(normalized)
}

export function classifyBucket(term) {
  const normalized = normalizeTerm(term)
  const firstChar = normalized[0]
  if (!firstChar) return '0-9'
  if (firstChar >= 'a' && firstChar <= 'z') {
    return firstChar
  }
  if (firstChar >= '0' && firstChar <= '9') {
    return '0-9'
  }
  return '0-9'
}
