import { useState, useRef, useEffect } from 'react'
import { Terminal, Send, Trash2 } from 'lucide-react'
import { cn } from '../../utils/cn'
import { useCommandStore } from '../../store/commandStore'
import { commands, ShellType } from '../../services/commands'
import { formatTime } from '../../utils/formatters'

function TerminalTab({ agent }) {
  const [input, setInput] = useState('')
  const [shellType, setShellType] = useState(ShellType.CMD)
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  
  const terminalRef = useRef(null)
  const inputRef = useRef(null)
  
  const { getTerminalOutput, appendTerminalOutput, clearTerminal } = useCommandStore()
  const output = getTerminalOutput(agent.hwid)

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [output])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim()) return

    // Add to history
    setHistory((prev) => [...prev, input].slice(-100))
    setHistoryIndex(-1)

    // Add command to terminal output
    appendTerminalOutput(agent.hwid, `${shellType === ShellType.POWERSHELL ? 'PS>' : 'C:\\>'} ${input}`, 'command')
    appendTerminalOutput(agent.hwid, '[EXECUTING...]', 'system')

    // Send command
    commands.shell(agent.hwid, input, shellType)

    // Clear input
    setInput('')
  }

  const handleKeyDown = (e) => {
    // History navigation
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (history.length > 0) {
        const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex
        setHistoryIndex(newIndex)
        setInput(history[history.length - 1 - newIndex] || '')
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setInput(history[history.length - 1 - newIndex] || '')
      } else {
        setHistoryIndex(-1)
        setInput('')
      }
    }

    // Clear terminal
    if (e.ctrlKey && e.key === 'l') {
      e.preventDefault()
      clearTerminal(agent.hwid)
    }
  }

  const getLineClass = (type) => {
    switch (type) {
      case 'command':
        return 'text-sentinel-muted'
      case 'output':
        return 'text-neon-green'
      case 'error':
        return 'text-neon-red'
      case 'system':
        return 'text-neon-orange'
      default:
        return 'text-white'
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-neon-green" />
          <span className="font-display font-bold text-white">Remote Shell</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Shell Type Toggle */}
          <div className="flex bg-void-700 rounded-lg p-1">
            <button
              onClick={() => setShellType(ShellType.CMD)}
              className={cn(
                'px-3 py-1 text-xs font-mono rounded transition-colors',
                shellType === ShellType.CMD
                  ? 'bg-neon-pink text-white'
                  : 'text-sentinel-text hover:text-white'
              )}
            >
              CMD
            </button>
            <button
              onClick={() => setShellType(ShellType.POWERSHELL)}
              className={cn(
                'px-3 py-1 text-xs font-mono rounded transition-colors',
                shellType === ShellType.POWERSHELL
                  ? 'bg-neon-pink text-white'
                  : 'text-sentinel-text hover:text-white'
              )}
            >
              PowerShell
            </button>
          </div>

          {/* Clear Button */}
          <button
            onClick={() => clearTerminal(agent.hwid)}
            className="btn btn-ghost p-2"
            title="Clear terminal (Ctrl+L)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal Window */}
      <div className="terminal h-[500px] flex flex-col">
        {/* Output Area */}
        <div ref={terminalRef} className="flex-1 overflow-y-auto space-y-1 pb-4">
          {output.length === 0 ? (
            <div className="text-sentinel-text text-center py-8">
              <p>Terminal ready. Type a command and press Enter.</p>
              <p className="text-xs mt-2">Ctrl+L to clear • ↑↓ for history</p>
            </div>
          ) : (
            output.map((line) => (
              <div key={line.id} className="flex gap-2">
                <span className="text-sentinel-text text-[10px] opacity-50">
                  [{formatTime(line.timestamp)}]
                </span>
                <pre className={cn('whitespace-pre-wrap break-all', getLineClass(line.type))}>
                  {line.text}
                </pre>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-2 border-t border-sentinel-border">
          <span className="terminal-prompt font-bold">
            {shellType === ShellType.POWERSHELL ? 'PS>' : 'C:\\>'}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-neon-green outline-none font-mono"
            placeholder="Enter command..."
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="btn btn-ghost p-2 text-neon-green disabled:opacity-30"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Help */}
      <div className="text-xs text-sentinel-text font-mono">
        <span className="text-neon-pink">Tip:</span> Use common Windows commands like{' '}
        <code className="bg-void-700 px-1 rounded">ipconfig</code>,{' '}
        <code className="bg-void-700 px-1 rounded">dir</code>,{' '}
        <code className="bg-void-700 px-1 rounded">tasklist</code>,{' '}
        <code className="bg-void-700 px-1 rounded">systeminfo</code>
      </div>
    </div>
  )
}

export default TerminalTab
