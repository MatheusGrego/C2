/**
 * Format bytes to human readable string
 * @param {number} bytes - Bytes value
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted string (e.g., "1.5 GB")
 */
export function formatBytes(bytes, decimals = 1) {
  if (bytes === 0) return '0 B'
  if (!bytes || isNaN(bytes)) return '--'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
}

/**
 * Format megabytes to human readable string
 * @param {number} mb - Megabytes value
 * @returns {string} Formatted string
 */
export function formatMB(mb) {
  if (!mb || isNaN(mb)) return '--'
  if (mb < 1024) return `${mb.toFixed(0)} MB`
  return `${(mb / 1024).toFixed(1)} GB`
}

/**
 * Format percentage value
 * @param {number} value - Percentage value (0-100)
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted percentage
 */
export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) return '--%'
  return `${parseFloat(value).toFixed(decimals)}%`
}

/**
 * Format timestamp to relative time (e.g., "2 minutes ago")
 * @param {string|Date} timestamp - ISO timestamp or Date object
 * @returns {string} Relative time string
 */
export function formatRelativeTime(timestamp) {
  if (!timestamp) return 'Never'

  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 10) return 'Just now'
  if (diffSec < 60) return `${diffSec}s ago`
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`

  return date.toLocaleDateString()
}

/**
 * Format timestamp to time string (HH:MM:SS)
 * @param {string|Date} timestamp - ISO timestamp or Date object
 * @returns {string} Time string
 */
export function formatTime(timestamp) {
  if (!timestamp) return '--:--:--'
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { hour12: false })
}

/**
 * Format timestamp to datetime string
 * @param {string|Date} timestamp - ISO timestamp or Date object
 * @returns {string} Datetime string
 */
export function formatDateTime(timestamp) {
  if (!timestamp) return '--'
  const date = new Date(timestamp)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/**
 * Truncate string with ellipsis
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 */
export function truncate(str, maxLength = 30) {
  if (!str) return ''
  if (str.length <= maxLength) return str
  return `${str.slice(0, maxLength)}...`
}

/**
 * Format uptime from seconds
 * @param {number} seconds - Uptime in seconds
 * @returns {string} Formatted uptime (e.g., "3d 12h 45m")
 */
export function formatUptime(seconds) {
  if (!seconds || isNaN(seconds)) return '--'

  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`)

  return parts.join(' ')
}
