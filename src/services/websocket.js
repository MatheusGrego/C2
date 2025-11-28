/**
 * Sentinel WebSocket Service
 * Implements Raw WebSocket protocol as specified in WEBSOCKET_PROTOCOL.md
 */

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080'

/**
 * Sentinel WebSocket Client
 * Manages raw WebSocket connection to /ws-dashboard endpoint
 */
class SentinelWebSocket {
  constructor() {
    this.ws = null
    this.connected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 10
    this.listeners = new Map()
    this.requestCallbacks = new Map()
    this.reconnectTimeout = null
  }

  /**
   * Connect to WebSocket server
   * @param {string} token - JWT token for authentication
   * @returns {Promise<void>}
   */
  connect(token) {
    return new Promise((resolve, reject) => {
      if (this.ws && this.connected) {
        console.log('[WS] Already connected')
        resolve()
        return
      }

      // Clear any pending reconnect timeout
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout)
        this.reconnectTimeout = null
      }

      // Build WebSocket URL with token as query parameter
      const url = `${WS_URL}/ws-dashboard?token=${token}`

      console.log('[WS] Connecting to:', url.replace(token, '***'))

      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        console.log('[WS] Connected to Sentinel Core')
        this.connected = true
        this.reconnectAttempts = 0
        this._emit('connect', { timestamp: new Date().toISOString() })
        resolve()
      }

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (error) {
          console.error('[WS] Failed to parse message:', error)
        }
      }

      this.ws.onclose = (event) => {
        console.log('[WS] Connection closed:', event.code, event.reason)
        this.connected = false
        this._emit('disconnect', event)
        this.handleDisconnect()
      }

      this.ws.onerror = (error) => {
        console.error('[WS] WebSocket error:', error)
        this._emit('error', error)
        reject(error)
      }
    })
  }

  /**
   * Handle incoming messages
   * @param {object} message - Parsed WebSocket message
   */
  handleMessage(message) {
    const { type, payload, request_id } = message

    console.log('[WS] Received:', type, request_id ? `(req: ${request_id})` : '')
    console.log('[WS] Full message:', message) // DEBUG: Ver mensagem completa

    // If message has request_id, it's a response to a request we sent
    if (request_id && this.requestCallbacks.has(request_id)) {
      const callback = this.requestCallbacks.get(request_id)
      this.requestCallbacks.delete(request_id)
      callback(payload)
      return
    }

    // Otherwise, it's a push message from server - notify listeners
    const listeners = this.listeners.get(type) || []
    console.log(`[WS] Notifying ${listeners.length} listeners for type: ${type}`) // DEBUG
    listeners.forEach((callback) => callback(payload))
  }

  /**
   * Register listener for a message type
   * @param {string} type - Message type (e.g., 'AGENT_UPDATE', 'COMMAND_UPDATE')
   * @param {function} callback - Handler function
   * @returns {function} Unsubscribe function
   */
  on(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, [])
    }
    this.listeners.get(type).push(callback)

    // Return unsubscribe function
    return () => {
      const list = this.listeners.get(type)
      const index = list.indexOf(callback)
      if (index > -1) list.splice(index, 1)
    }
  }

  /**
   * Remove listener
   * @param {string} type - Message type
   * @param {function} callback - Handler to remove
   */
  off(type, callback) {
    const handlers = this.listeners.get(type)
    if (handlers) {
      const index = handlers.indexOf(callback)
      if (index > -1) handlers.splice(index, 1)
    }
  }

  /**
   * Send message with expected response (request-response pattern)
   * @param {string} type - Message type
   * @param {object} payload - Message payload
   * @returns {Promise<object>} Response payload
   */
  send(type, payload = null) {
    return new Promise((resolve, reject) => {
      if (!this.connected || !this.ws) {
        reject(new Error('WebSocket not connected'))
        return
      }

      const requestId = crypto.randomUUID()

      // Register callback for response
      this.requestCallbacks.set(requestId, resolve)

      // Set timeout for request
      setTimeout(() => {
        if (this.requestCallbacks.has(requestId)) {
          this.requestCallbacks.delete(requestId)
          reject(new Error('Request timeout'))
        }
      }, 30000)

      // Send message
      const message = {
        type,
        payload,
        request_id: requestId,
      }

      this.ws.send(JSON.stringify(message))
      console.log('[WS] Sent:', type, `(req: ${requestId})`)
    })
  }

  /**
   * Send message without expecting response
   * @param {string} type - Message type
   * @param {object} payload - Message payload
   */
  sendNoWait(type, payload = null) {
    if (!this.connected || !this.ws) {
      console.warn('[WS] Cannot send: not connected')
      return
    }

    const message = { type, payload }
    this.ws.send(JSON.stringify(message))
    console.log('[WS] Sent (no wait):', type)
  }

  /**
   * Send command to agent
   * @param {string} hwid - Agent HWID
   * @param {string} type - Command type (SHELL, SCREENSHOT, etc)
   * @param {array} params - Command parameters
   * @returns {Promise<object>} Command confirmation
   */
  async sendCommand(hwid, type, params = []) {
    return this.send('SEND_COMMAND', {
      hwid,
      type,
      params,
    })
  }

  /**
   * Request agents list
   * @returns {Promise<array>} Agents list
   */
  async getAgents() {
    return this.send('GET_AGENTS')
  }

  /**
   * Request specific agent details
   * @param {string} hwid - Agent HWID
   * @returns {Promise<object>} Agent details
   */
  async getAgent(hwid) {
    return this.send('GET_AGENT', { hwid })
  }

  /**
   * Request dashboard statistics
   * @returns {Promise<object>} Dashboard stats
   */
  async getStats() {
    return this.send('GET_STATS')
  }

  /**
   * Request command history for agent
   * @param {string} hwid - Agent HWID
   * @param {number} page - Page number (0-indexed)
   * @param {number} size - Page size
   * @returns {Promise<object>} Paginated command history
   */
  async getCommands(hwid, page = 0, size = 50) {
    return this.send('GET_COMMANDS', { hwid, page, size })
  }

  /**
   * Request screenshots for agent
   * @param {string} hwid - Agent HWID
   * @param {number} page - Page number
   * @param {number} size - Page size
   * @returns {Promise<object>} Paginated screenshots
   */
  async getScreenshots(hwid, page = 0, size = 20) {
    return this.send('GET_SCREENSHOTS', { hwid, page, size })
  }

  /**
   * Send PING to keep connection alive
   * @returns {Promise<object>} PONG response
   */
  async ping() {
    return this.send('PING')
  }

  /**
   * Handle disconnect and attempt reconnection
   */
  handleDisconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
      this.reconnectAttempts++

      console.log(
        `[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`
      )

      this.reconnectTimeout = setTimeout(() => {
        const token = localStorage.getItem('sentinel_token')
        if (token) {
          this.connect(token).catch((err) => {
            console.error('[WS] Reconnect failed:', err)
          })
        }
      }, delay)
    } else {
      console.error('[WS] Max reconnect attempts reached')
      this._emit('maxReconnectReached')
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.connected = false
    this.requestCallbacks.clear()
  }

  /**
   * Check if connected
   * @returns {boolean}
   */
  isConnected() {
    return this.connected && this.ws?.readyState === WebSocket.OPEN
  }

  /**
   * Emit event to listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  _emit(event, data) {
    const handlers = this.listeners.get(event)
    if (handlers) {
      handlers.forEach((handler) => handler(data))
    }
  }
}

// Singleton instance
export const sentinelSocket = new SentinelWebSocket()

export default sentinelSocket
