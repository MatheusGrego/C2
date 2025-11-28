import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

/**
 * Agent Status Enum
 */
export const AgentStatus = {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
  DEAD: 'DEAD',
}

/**
 * Zustand Store for Agents
 */
export const useAgentStore = create(
  devtools(
    (set, get) => ({
      // ============================================
      // State
      // ============================================
      agents: [],
      selectedAgentHwid: null,
      filter: 'ALL',
      searchQuery: '',
      sortBy: 'hostname',
      sortOrder: 'asc',
      isLoading: false,
      error: null,

      // ============================================
      // Basic Actions
      // ============================================

      /**
       * Set all agents (replace)
       */
      setAgents: (agents) => set({ agents, isLoading: false, error: null }),

      /**
       * Update a single agent
       */
      updateAgent: (hwid, updates) =>
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.hwid === hwid ? { ...agent, ...updates } : agent
          ),
        })),

      /**
       * Add new agent
       */
      addAgent: (agent) =>
        set((state) => {
          // Check if agent already exists
          const exists = state.agents.some((a) => a.hwid === agent.hwid)
          if (exists) {
            // Update existing
            return {
              agents: state.agents.map((a) =>
                a.hwid === agent.hwid ? { ...a, ...agent } : a
              ),
            }
          }
          // Add new
          return { agents: [...state.agents, agent] }
        }),

      /**
       * Remove agent
       */
      removeAgent: (hwid) =>
        set((state) => ({
          agents: state.agents.filter((a) => a.hwid !== hwid),
          selectedAgentHwid:
            state.selectedAgentHwid === hwid ? null : state.selectedAgentHwid,
        })),

      /**
       * Select agent by HWID
       */
      selectAgent: (hwid) => set({ selectedAgentHwid: hwid }),

      /**
       * Clear selection
       */
      clearSelection: () => set({ selectedAgentHwid: null }),

      // ============================================
      // Filter & Sort Actions
      // ============================================

      setFilter: (filter) => set({ filter }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSortBy: (sortBy) => set({ sortBy }),
      setSortOrder: (order) => set({ sortOrder: order }),
      toggleSortOrder: () =>
        set((state) => ({
          sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc',
        })),

      // ============================================
      // Loading & Error
      // ============================================

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error, isLoading: false }),
      clearError: () => set({ error: null }),

      // ============================================
      // Selectors (Computed)
      // ============================================

      /**
       * Get selected agent object
       */
      getSelectedAgent: () => {
        const { agents, selectedAgentHwid } = get()
        return agents.find((a) => a.hwid === selectedAgentHwid) || null
      },

      /**
       * Get agent by HWID
       */
      getAgentByHwid: (hwid) => {
        return get().agents.find((a) => a.hwid === hwid) || null
      },

      /**
       * Get filtered and sorted agents
       */
      getFilteredAgents: () => {
        const { agents, filter, searchQuery, sortBy, sortOrder } = get()

        let filtered = [...agents]

        // Filter by status
        if (filter !== 'ALL') {
          filtered = filtered.filter((a) => a.status === filter)
        }

        // Filter by communication mode
        if (filter === 'SESSION' || filter === 'BEACON') {
          filtered = filtered.filter((a) => a.communicationMode === filter)
        }

        // Search by hostname or IP
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          filtered = filtered.filter(
            (a) =>
              a.hostname?.toLowerCase().includes(query) ||
              a.ipLocal?.toLowerCase().includes(query) ||
              a.hwid?.toLowerCase().includes(query)
          )
        }

        // Sort
        filtered.sort((a, b) => {
          let comparison = 0

          switch (sortBy) {
            case 'hostname':
              comparison = (a.hostname || '').localeCompare(b.hostname || '')
              break
            case 'cpuLoad':
              comparison = (a.cpuLoad || 0) - (b.cpuLoad || 0)
              break
            case 'ramUsage':
              comparison = (a.ramUsage || 0) - (b.ramUsage || 0)
              break
            case 'lastSeen':
              comparison =
                new Date(b.lastSeen || 0) - new Date(a.lastSeen || 0)
              break
            case 'status':
              const statusOrder = { ONLINE: 0, OFFLINE: 1, DEAD: 2 }
              comparison =
                (statusOrder[a.status] || 2) - (statusOrder[b.status] || 2)
              break
            default:
              comparison = 0
          }

          return sortOrder === 'asc' ? comparison : -comparison
        })

        return filtered
      },

      /**
       * Get statistics
       */
      getStats: () => {
        const { agents } = get()
        return {
          total: agents.length,
          online: agents.filter((a) => a.status === AgentStatus.ONLINE).length,
          offline: agents.filter((a) => a.status === AgentStatus.OFFLINE).length,
          dead: agents.filter((a) => a.status === AgentStatus.DEAD).length,
          sessionMode: agents.filter((a) => a.communicationMode === 'SESSION')
            .length,
          beaconMode: agents.filter((a) => a.communicationMode === 'BEACON')
            .length,
        }
      },
    }),
    { name: 'agent-store' }
  )
)

export default useAgentStore
