import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'

/**
 * Modal Types
 */
export const ModalType = {
  CONFIRM: 'CONFIRM',
  MESSAGE: 'MESSAGE',
  OPEN_URL: 'OPEN_URL',
  SWITCH_MODE: 'SWITCH_MODE',
  KILL_PROCESS: 'KILL_PROCESS',
  AGENT_DELETE: 'AGENT_DELETE',
  SCREENSHOT_VIEW: 'SCREENSHOT_VIEW',
  SETTINGS: 'SETTINGS',
}

/**
 * Zustand Store for UI State
 */
export const useUIStore = create(
  devtools(
    persist(
      (set, get) => ({
        // ============================================
        // State
        // ============================================

        // Connection
        wsConnected: false,
        wsReconnecting: false,

        // Modals
        activeModal: null,
        modalData: null,

        // Sidebar
        sidebarCollapsed: false,

        // Settings (persisted)
        soundEnabled: true,
        notificationsEnabled: true,

        // Active tab in Command Center
        activeTab: 'overview',

        // Selected items (for bulk actions)
        selectedAgentHwids: [],

        // ============================================
        // Connection Actions
        // ============================================

        setWsConnected: (connected) =>
          set({ wsConnected: connected, wsReconnecting: false }),

        setWsReconnecting: (reconnecting) => set({ wsReconnecting: reconnecting }),

        // ============================================
        // Modal Actions
        // ============================================

        openModal: (modalType, data = null) =>
          set({
            activeModal: modalType,
            modalData: data,
          }),

        closeModal: () =>
          set({
            activeModal: null,
            modalData: null,
          }),

        // ============================================
        // Sidebar Actions
        // ============================================

        toggleSidebar: () =>
          set((state) => ({
            sidebarCollapsed: !state.sidebarCollapsed,
          })),

        setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

        // ============================================
        // Settings Actions
        // ============================================

        toggleSound: () =>
          set((state) => ({
            soundEnabled: !state.soundEnabled,
          })),

        toggleNotifications: () =>
          set((state) => ({
            notificationsEnabled: !state.notificationsEnabled,
          })),

        setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
        setNotificationsEnabled: (enabled) =>
          set({ notificationsEnabled: enabled }),

        // ============================================
        // Tab Actions
        // ============================================

        setActiveTab: (tab) => set({ activeTab: tab }),

        // ============================================
        // Selection Actions
        // ============================================

        selectAgentHwid: (hwid) =>
          set((state) => ({
            selectedAgentHwids: state.selectedAgentHwids.includes(hwid)
              ? state.selectedAgentHwids
              : [...state.selectedAgentHwids, hwid],
          })),

        deselectAgentHwid: (hwid) =>
          set((state) => ({
            selectedAgentHwids: state.selectedAgentHwids.filter((h) => h !== hwid),
          })),

        toggleAgentSelection: (hwid) =>
          set((state) => ({
            selectedAgentHwids: state.selectedAgentHwids.includes(hwid)
              ? state.selectedAgentHwids.filter((h) => h !== hwid)
              : [...state.selectedAgentHwids, hwid],
          })),

        selectAllAgents: (hwids) => set({ selectedAgentHwids: hwids }),

        clearAgentSelection: () => set({ selectedAgentHwids: [] }),

        // ============================================
        // Selectors
        // ============================================

        isAgentSelected: (hwid) => {
          return get().selectedAgentHwids.includes(hwid)
        },

        getSelectedCount: () => {
          return get().selectedAgentHwids.length
        },

        isModalOpen: (modalType) => {
          return get().activeModal === modalType
        },
      }),
      {
        name: 'sentinel-ui-settings',
        partialize: (state) => ({
          // Only persist these fields
          soundEnabled: state.soundEnabled,
          notificationsEnabled: state.notificationsEnabled,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      }
    ),
    { name: 'ui-store' }
  )
)

export default useUIStore
