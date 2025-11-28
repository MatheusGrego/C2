/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} Is valid URL
 */
export function isValidUrl(url) {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

/**
 * Validate HWID format (MAC-like or UUID-like)
 * @param {string} hwid - Hardware ID to validate
 * @returns {boolean} Is valid HWID
 */
export function isValidHwid(hwid) {
  if (!hwid || typeof hwid !== 'string') return false
  // Accept formats like: AA-BB-CC-DD-EE-FF or UUID format
  const macPattern = /^([0-9A-Fa-f]{2}-){5}[0-9A-Fa-f]{2}$/
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return macPattern.test(hwid) || uuidPattern.test(hwid)
}

/**
 * Validate IP address (IPv4)
 * @param {string} ip - IP address to validate
 * @returns {boolean} Is valid IPv4
 */
export function isValidIPv4(ip) {
  if (!ip) return false
  const pattern = /^(\d{1,3}\.){3}\d{1,3}$/
  if (!pattern.test(ip)) return false
  return ip.split('.').every((octet) => {
    const num = parseInt(octet, 10)
    return num >= 0 && num <= 255
  })
}

/**
 * Validate hostname
 * @param {string} hostname - Hostname to validate
 * @returns {boolean} Is valid hostname
 */
export function isValidHostname(hostname) {
  if (!hostname || hostname.length > 255) return false
  const pattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/
  return pattern.test(hostname)
}

/**
 * Sanitize shell command (basic)
 * @param {string} command - Command to sanitize
 * @returns {string} Sanitized command
 */
export function sanitizeCommand(command) {
  if (!command) return ''
  // Remove null bytes and control characters (except newlines/tabs)
  return command.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
}

/**
 * Validate message box input
 * @param {string} title - MessageBox title
 * @param {string} message - MessageBox message
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateMessageBox(title, message) {
  const errors = []

  if (!title || title.trim().length === 0) {
    errors.push('Title is required')
  } else if (title.length > 100) {
    errors.push('Title must be less than 100 characters')
  }

  if (!message || message.trim().length === 0) {
    errors.push('Message is required')
  } else if (message.length > 1000) {
    errors.push('Message must be less than 1000 characters')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Check if value is empty (null, undefined, empty string, empty array)
 * @param {any} value - Value to check
 * @returns {boolean} Is empty
 */
export function isEmpty(value) {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}
