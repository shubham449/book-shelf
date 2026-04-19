const PALETTE = [
  '#7C4B2A', '#4A7C7C', '#4A7C59', '#6B4A7C', '#7C6B4A',
  '#4A5B7C', '#7C4A5B', '#4B7C6B', '#7A5B4A', '#5A7A6B',
]

export function placeholderColor(str = '') {
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return PALETTE[Math.abs(h) % PALETTE.length]
}

export const STATUS_LABELS = {
  gifted:   'Gifted',
  reading:  'Reading',
  finished: 'Finished',
  dnf:      'Did Not Finish',
}

export const STATUS_OPTIONS = [
  { value: 'gifted',   label: 'Gifted' },
  { value: 'reading',  label: 'Reading' },
  { value: 'finished', label: 'Finished' },
  { value: 'dnf',      label: 'Did Not Finish' },
]

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function toDateInput(dateStr) {
  if (!dateStr) return ''
  return dateStr.slice(0, 10)
}
