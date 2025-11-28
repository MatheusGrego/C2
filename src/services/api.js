import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

/**
 * Axios instance configured for Sentinel API
 */
const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Request interceptor - Add JWT token to all requests
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sentinel_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * Response interceptor - Handle errors globally
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear auth and redirect to login
      localStorage.removeItem('sentinel_token')
      localStorage.removeItem('sentinel_user')
      window.location.href = '/login'
    }

    if (!error.response) {
      console.error('[API] Network error:', error.message)
    }

    return Promise.reject(error)
  }
)

export default api

// ============================================
// Auth Service
// ============================================
export const authService = {
  /**
   * Login to Sentinel Core
   * @param {string} username
   * @param {string} password
   * @returns {Promise<object>} { token, username, expiresIn }
   */
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password })
    const { token, username: user, expiresIn } = response.data

    localStorage.setItem('sentinel_token', token)
    localStorage.setItem('sentinel_user', user)

    return { token, username: user, expiresIn }
  },

  /**
   * Validate current token
   * @returns {Promise<boolean>}
   */
  validate: async () => {
    try {
      const response = await api.get('/auth/validate')
      return response.data.valid === true
    } catch {
      return false
    }
  },

  /**
   * Logout - clear local storage and redirect
   */
  logout: () => {
    localStorage.removeItem('sentinel_token')
    localStorage.removeItem('sentinel_user')
    window.location.href = '/login'
  },

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('sentinel_token')
  },

  /**
   * Get current username
   * @returns {string|null}
   */
  getCurrentUser: () => {
    return localStorage.getItem('sentinel_user')
  },
}

// ============================================
// Agent Service
// ============================================
export const agentService = {
  /**
   * Get all agents
   * @returns {Promise<array>}
   */
  getAll: async () => {
    const response = await api.get('/agents')
    return response.data
  },

  /**
   * Get agent by HWID
   * @param {string} hwid
   * @returns {Promise<object>}
   */
  getById: async (hwid) => {
    const response = await api.get(`/agents/${hwid}`)
    return response.data
  },

  /**
   * Get agents by status
   * @param {string} status - ONLINE, OFFLINE, or DEAD
   * @returns {Promise<array>}
   */
  getByStatus: async (status) => {
    const response = await api.get(`/agents/status/${status}`)
    return response.data
  },

  /**
   * Get online agents count
   * @returns {Promise<number>}
   */
  getOnlineCount: async () => {
    const response = await api.get('/agents/count/online')
    return response.data
  },

  /**
   * Delete agent
   * @param {string} hwid
   */
  delete: async (hwid) => {
    await api.delete(`/agents/${hwid}`)
  },
}

// ============================================
// Command Service
// ============================================
export const commandService = {
  /**
   * Send command to agent
   * @param {string} hwid - Agent HWID
   * @param {string} type - Command type
   * @param {array} params - Command parameters
   * @returns {Promise<object>} Command object
   */
  send: async (hwid, type, params = []) => {
    const response = await api.post('/commands', {
      hwid,
      type,
      params,
    })
    return response.data
  },

  /**
   * Get command by ID
   * @param {string} id - Command ID
   * @returns {Promise<object>}
   */
  getById: async (id) => {
    const response = await api.get(`/commands/${id}`)
    return response.data
  },

  /**
   * Get command history for agent
   * @param {string} hwid - Agent HWID
   * @returns {Promise<array>}
   */
  getHistory: async (hwid) => {
    const response = await api.get(`/commands/agent/${hwid}`)
    return response.data
  },

  /**
   * Get paginated command history
   * @param {string} hwid - Agent HWID
   * @param {number} page - Page number (0-indexed)
   * @param {number} size - Page size
   * @returns {Promise<object>} Paginated response
   */
  getHistoryPaged: async (hwid, page = 0, size = 50) => {
    const response = await api.get(`/commands/agent/${hwid}/paged`, {
      params: { page, size },
    })
    return response.data
  },

  /**
   * Get pending commands for agent
   * @param {string} hwid - Agent HWID
   * @returns {Promise<array>}
   */
  getPending: async (hwid) => {
    const response = await api.get(`/commands/agent/${hwid}/pending`)
    return response.data
  },
}

// ============================================
// Screenshot Service
// ============================================
export const screenshotService = {
  /**
   * Get screenshots for agent (paginated)
   * @param {string} hwid - Agent HWID
   * @param {number} page - Page number
   * @param {number} size - Page size
   * @returns {Promise<object>} Paginated screenshots
   */
  getAll: async (hwid, page = 0, size = 20) => {
    const response = await api.get(`/screenshots/agent/${hwid}`, {
      params: { page, size },
    })
    return response.data
  },

  /**
   * Get screenshot metadata by ID
   * @param {string} id - Screenshot ID
   * @returns {Promise<object>}
   */
  getMetadata: async (id) => {
    const response = await api.get(`/screenshots/${id}/metadata`)
    return response.data
  },

  /**
   * Get screenshot image (binary)
   * @param {string} id - Screenshot ID
   * @returns {Promise<Blob>}
   */
  getImage: async (id) => {
    const response = await api.get(`/screenshots/${id}/image`, {
      responseType: 'blob',
    })
    return response.data
  },

  /**
   * Get screenshot image URL with auth token
   * @param {string} id - Screenshot ID
   * @returns {string}
   */
  getImageUrl: (id) => {
    const token = localStorage.getItem('sentinel_token')
    return `${API_URL}/api/screenshots/${id}/image?token=${token}`
  },

  /**
   * Count screenshots for agent
   * @param {string} hwid - Agent HWID
   * @returns {Promise<number>}
   */
  getCount: async (hwid) => {
    const response = await api.get(`/screenshots/agent/${hwid}/count`)
    return response.data
  },

  /**
   * Delete screenshot
   * @param {string} id - Screenshot ID
   */
  delete: async (id) => {
    await api.delete(`/screenshots/${id}`)
  },
}

// ============================================
// Dashboard Stats Service
// ============================================
export const statsService = {
  /**
   * Get dashboard statistics
   * @returns {Promise<object>}
   */
  getStats: async () => {
    const response = await api.get('/dashboard/stats')
    return response.data
  },

  /**
   * Get WebSocket connection status
   * @returns {Promise<object>}
   */
  getConnections: async () => {
    const response = await api.get('/dashboard/connections')
    return response.data
  },

  /**
   * Health check
   * @returns {Promise<object>}
   */
  getHealth: async () => {
    const response = await api.get('/dashboard/health')
    return response.data
  },
}
