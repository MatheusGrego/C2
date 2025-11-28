import { useEffect, useCallback } from 'react'
import { sentinelSocket } from '../services/websocket'
import { useAgentStore } from '../store/agentStore'
import { useCommandStore } from '../store/commandStore'
import { useUIStore } from '../store/uiStore'
import { toast } from 'sonner'

/**
 * Hook to manage WebSocket connection and subscriptions
 * Implements protocol from WEBSOCKET_PROTOCOL.md
 */
export function useSentinelSocket() {
  const { setAgents, updateAgent, addAgent } = useAgentStore()
  const { addCommand, updateCommand, appendTerminalOutput } = useCommandStore()
  const { setWsConnected, setWsReconnecting, soundEnabled, notificationsEnabled } =
    useUIStore()

  /**
   * Play notification sound
   */
  const playSound = useCallback(() => {
    if (soundEnabled) {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.value = 800
        oscillator.type = 'sine'
        gainNode.gain.value = 0.1

        oscillator.start()
        oscillator.stop(audioContext.currentTime + 0.1)
      } catch (e) {
        // Audio not supported or blocked
      }
    }
  }, [soundEnabled])

  /**
   * Handle AGENTS_LIST message (initial data on connect)
   */
  const handleAgentsList = useCallback(
    (agents) => {
      console.log('[WS] Received agents list:', agents.length)
      setAgents(agents)
    },
    [setAgents]
  )

  /**
   * Handle AGENT_UPDATE message (telemetry updates)
   */
  const handleAgentUpdate = useCallback(
    (agent) => {
      console.log('[WS] Agent update:', agent.hwid)

      // Update agent in store (addAgent handles both add and update)
      addAgent(agent)
    },
    [addAgent]
  )

  /**
   * Handle ADMIN_EVENT message
   */
  const handleAdminEvent = useCallback(
    (event) => {
      console.log('[WS] Admin event:', event.eventType, event.agentHwid)

      const { eventType, agentHwid, message, timestamp } = event

      switch (eventType) {
        case 'AGENT_CONNECTED':
          if (notificationsEnabled) {
            toast.success(message || `Agent ${agentHwid} connected`)
            playSound()
          }
          break

        case 'AGENT_DISCONNECTED':
          if (notificationsEnabled) {
            toast.info(message || `Agent ${agentHwid} disconnected`)
          }
          updateAgent(agentHwid, {
            status: 'OFFLINE',
            lastSeen: timestamp,
          })
          break

        case 'AGENT_STATUS_CHANGED':
          if (notificationsEnabled) {
            toast.info(message || `Agent ${agentHwid} status changed`)
          }
          break

        case 'COMMAND_RESULT':
          if (notificationsEnabled) {
            toast.success(message || 'Command executed')
          }
          break

        case 'SCREENSHOT_RECEIVED':
          if (notificationsEnabled) {
            toast.success(message || `Screenshot received from ${agentHwid}`)
            playSound()
          }
          break

        default:
          console.log('[WS] Unknown event type:', eventType)
      }
    },
    [updateAgent, notificationsEnabled, playSound]
  )

  /**
   * Handle COMMAND_UPDATE message
   */
  const handleCommandUpdate = useCallback(
    (command) => {
      console.log('[WS] Command update received!') // DEBUG
      console.log('[WS] Command data:', command) // DEBUG: Ver dados completos
      console.log('[WS] Command update:', command.id, command.status)

      // Update command in store
      updateCommand(command)

      // Append output to terminal if command was executed
      if (command.responseText) {
        const outputType = command.status === 'EXECUTED' ? 'output' : 'error'
        appendTerminalOutput(command.agentHwid, command.responseText, outputType)
      }

      // Show notification based on status
      if (command.status === 'EXECUTED' && notificationsEnabled) {
        toast.success(`Command executed on ${command.agentHwid}`)
      } else if (command.status === 'FAILED' && notificationsEnabled) {
        toast.error(`Command failed on ${command.agentHwid}`)
      }
    },
    [updateCommand, appendTerminalOutput, notificationsEnabled]
  )

  /**
   * Handle STATS message
   */
  const handleStats = useCallback(
    (stats) => {
      console.log('[WS] Stats update:', stats)
      // Stats can be stored in a dedicated store if needed
      // For now, we just log them
    },
    []
  )

  /**
   * Handle ERROR message
   */
  const handleError = useCallback(
    (error) => {
      console.error('[WS] Server error:', error)
      if (notificationsEnabled) {
        toast.error(error.error || 'Server error occurred')
      }
    },
    [notificationsEnabled]
  )

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(async () => {
    const token = localStorage.getItem('sentinel_token')
    if (!token) {
      console.warn('[WS] No token found, skipping connection')
      return
    }

    try {
      // Clear all existing listeners to avoid duplicates
      sentinelSocket.listeners.clear()

      // Set up event listeners BEFORE connecting
      sentinelSocket.on('connect', () => {
        console.log('[WS] Connected!')
        setWsConnected(true)
        setWsReconnecting(false)
        toast.success('Connected to Sentinel Core')
      })

      sentinelSocket.on('disconnect', () => {
        console.log('[WS] Disconnected')
        setWsConnected(false)
        setWsReconnecting(true)
        toast.error('Disconnected from Sentinel Core')
      })

      sentinelSocket.on('error', (error) => {
        console.error('[WS] Connection error:', error)
        toast.error('WebSocket connection error')
      })

      sentinelSocket.on('maxReconnectReached', () => {
        setWsReconnecting(false)
        toast.error('Failed to reconnect. Please refresh the page.')
      })

      // Register message type listeners
      sentinelSocket.on('AGENTS_LIST', handleAgentsList)
      sentinelSocket.on('AGENT_UPDATE', handleAgentUpdate)
      sentinelSocket.on('ADMIN_EVENT', handleAdminEvent)
      sentinelSocket.on('COMMAND_UPDATE', handleCommandUpdate)
      sentinelSocket.on('STATS', handleStats)
      sentinelSocket.on('ERROR', handleError)

      // Connect
      await sentinelSocket.connect(token)

      // Start ping interval to keep connection alive
      const pingInterval = setInterval(() => {
        if (sentinelSocket.isConnected()) {
          sentinelSocket.ping().catch((err) => {
            console.warn('[WS] Ping failed:', err)
          })
        }
      }, 30000) // Ping every 30 seconds

      // Cleanup function
      return () => {
        clearInterval(pingInterval)
      }
    } catch (error) {
      console.error('[WS] Failed to connect:', error)
      toast.error('Failed to connect to Sentinel Core')
    }
  }, [
    handleAgentsList,
    handleAgentUpdate,
    handleAdminEvent,
    handleCommandUpdate,
    handleStats,
    handleError,
    setWsConnected,
    setWsReconnecting,
  ])

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    sentinelSocket.disconnect()
  }, [])

  /**
   * Send command helper
   * @param {string} hwid - Agent HWID
   * @param {string} type - Command type
   * @param {array} params - Command parameters
   * @returns {Promise<object>} Command response
   */
  const sendCommand = useCallback(async (hwid, type, params = []) => {
    try {
      const response = await sentinelSocket.sendCommand(hwid, type, params)

      // Add command to store
      if (response && addCommand) {
        addCommand(response)
      }

      return response
    } catch (error) {
      console.error('[WS] Failed to send command:', error)
      toast.error('Failed to send command')
      throw error
    }
  }, [addCommand])

  /**
   * Check connection status
   */
  const isConnected = useCallback(() => {
    return sentinelSocket.isConnected()
  }, [])

  return {
    connect,
    disconnect,
    sendCommand,
    isConnected,
  }
}

export default useSentinelSocket
