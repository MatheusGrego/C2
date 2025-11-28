import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

/**
 * Command Status Enum
 * Matches backend status values
 */
export const CommandStatus = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  EXECUTED: 'EXECUTED',
  FAILED: 'FAILED',
}

/**
 * Zustand Store for Commands
 */
export const useCommandStore = create(
  devtools(
    (set, get) => ({
      // ============================================
      // State
      // ============================================
      pendingCommands: [],
      commandHistory: [],
      terminalOutputs: {}, // { [hwid]: TerminalLine[] }

      // ============================================
      // Command Actions
      // ============================================

      /**
       * Add a command (from backend response or update)
       */
      addCommand: (command) =>
        set((state) => {
          // Check if command already exists
          const existingIndex = state.commandHistory.findIndex(
            (c) => c.id === command.id
          )

          if (existingIndex !== -1) {
            // Update existing command
            const newHistory = [...state.commandHistory]
            newHistory[existingIndex] = { ...newHistory[existingIndex], ...command }
            return { commandHistory: newHistory }
          }

          // Add new command to history
          return {
            commandHistory: [command, ...state.commandHistory].slice(0, 100),
          }
        }),

      /**
       * Update a command (used by WebSocket updates)
       */
      updateCommand: (command) =>
        set((state) => {
          const existingIndex = state.commandHistory.findIndex(
            (c) => c.id === command.id
          )

          if (existingIndex !== -1) {
            const newHistory = [...state.commandHistory]
            newHistory[existingIndex] = { ...newHistory[existingIndex], ...command }
            return { commandHistory: newHistory }
          }

          // If command not found, add it
          return {
            commandHistory: [command, ...state.commandHistory].slice(0, 100),
          }
        }),

      /**
       * Add a pending command (legacy, kept for compatibility)
       */
      addPendingCommand: (command) =>
        set((state) => ({
          pendingCommands: [
            ...state.pendingCommands,
            {
              ...command,
              status: CommandStatus.PENDING,
              sentAt: new Date().toISOString(),
            },
          ],
        })),

      /**
       * Update command status
       */
      updateCommandStatus: (commandId, status, output = null) =>
        set((state) => {
          const pendingIndex = state.pendingCommands.findIndex(
            (c) => c.id === commandId
          )

          if (pendingIndex === -1) {
            // Command not found in pending, might already be in history
            return state
          }

          const command = state.pendingCommands[pendingIndex]
          const completedCommand = {
            ...command,
            status,
            output,
            completedAt: new Date().toISOString(),
          }

          // Remove from pending, add to history
          const newPending = [...state.pendingCommands]
          newPending.splice(pendingIndex, 1)

          return {
            pendingCommands: newPending,
            commandHistory: [completedCommand, ...state.commandHistory].slice(
              0,
              100
            ), // Keep last 100
          }
        }),

      /**
       * Clear command history
       */
      clearHistory: () => set({ commandHistory: [] }),

      /**
       * Clear pending commands
       */
      clearPending: () => set({ pendingCommands: [] }),

      // ============================================
      // Terminal Actions
      // ============================================

      /**
       * Append line to terminal output
       */
      appendTerminalOutput: (hwid, text, type = 'output') =>
        set((state) => {
          const currentOutput = state.terminalOutputs[hwid] || []
          const newLine = {
            id: crypto.randomUUID(),
            text,
            type, // 'command', 'output', 'error', 'system'
            timestamp: new Date().toISOString(),
          }

          return {
            terminalOutputs: {
              ...state.terminalOutputs,
              [hwid]: [...currentOutput, newLine].slice(-500), // Keep last 500 lines
            },
          }
        }),

      /**
       * Clear terminal for agent
       */
      clearTerminal: (hwid) =>
        set((state) => ({
          terminalOutputs: {
            ...state.terminalOutputs,
            [hwid]: [],
          },
        })),

      /**
       * Clear all terminals
       */
      clearAllTerminals: () => set({ terminalOutputs: {} }),

      // ============================================
      // Selectors
      // ============================================

      /**
       * Get terminal output for agent
       */
      getTerminalOutput: (hwid) => {
        return get().terminalOutputs[hwid] || []
      },

      /**
       * Get command history for agent
       */
      getCommandHistoryForAgent: (hwid) => {
        return get().commandHistory.filter((c) => c.targetHwid === hwid)
      },

      /**
       * Get pending commands for agent
       */
      getPendingForAgent: (hwid) => {
        return get().pendingCommands.filter((c) => c.targetHwid === hwid)
      },

      /**
       * Check if there are pending commands
       */
      hasPendingCommands: () => {
        return get().pendingCommands.length > 0
      },
    }),
    { name: 'command-store' }
  )
)

export default useCommandStore
