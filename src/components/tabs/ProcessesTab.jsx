import { useState, useEffect, useCallback } from 'react'
import { ListTree, RefreshCw, Search, Skull, Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'
import { commands } from '../../services/commands'
import { useCommandStore } from '../../store/commandStore'
import { formatBytes } from '../../utils/formatters'
import { toast } from 'sonner'
import { sentinelSocket } from '../../services/websocket'
import ConfirmModal from '../modals/ConfirmModal'

function ProcessesTab({ agent }) {
  const [processes, setProcesses] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [selected, setSelected] = useState([])
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, process: null, isMultiple: false })

  // Listen for command updates (process list responses)
  const handleCommandUpdate = useCallback((command) => {
    if (command.agentHwid === agent.hwid && command.type === 'PROCESS_LIST' && command.responseText) {
      try {
        // Parse the process list from response
        const parsed = JSON.parse(command.responseText)
        if (Array.isArray(parsed)) {
          setProcesses(parsed)
          setIsLoading(false)
          return
        }
      } catch (e) {
        console.error('Failed to parse process list:', e)
      }
    }
  }, [agent.hwid])

  useEffect(() => {
    // Listen for command updates
    const unsubscribe = sentinelSocket.on('COMMAND_UPDATE', handleCommandUpdate)

    return () => {
      // Cleanup listener
      if (unsubscribe) unsubscribe()
    }
  }, [handleCommandUpdate])

  const fetchProcesses = () => {
    setIsLoading(true)
    commands.processList(agent.hwid)
    toast.info('Fetching process list...')
  }

  const handleKillProcess = (processName) => {
    setConfirmModal({ isOpen: true, process: processName, isMultiple: false })
  }

  const handleKillSelected = () => {
    setConfirmModal({ isOpen: true, process: null, isMultiple: true })
  }

  const confirmKillProcess = () => {
    if (confirmModal.isMultiple) {
      // Kill multiple selected processes
      selected.forEach((name) => {
        commands.killProcess(agent.hwid, name)
      })
      toast.info(`Killing ${selected.length} processes...`)
      setProcesses((prev) => prev.filter((p) => !selected.includes(p.name)))
      setSelected([])
    } else {
      // Kill single process
      const processName = confirmModal.process
      commands.killProcess(agent.hwid, processName)
      toast.info(`Killing process: ${processName}`)
      setProcesses((prev) => prev.filter((p) => p.name !== processName))
      setSelected((prev) => prev.filter((n) => n !== processName))
    }
  }

  const toggleSelect = (name) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    )
  }

  const toggleSelectAll = () => {
    if (selected.length === filteredProcesses.length) {
      setSelected([])
    } else {
      setSelected(filteredProcesses.map((p) => p.name))
    }
  }

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  // Filter and sort
  const filteredProcesses = processes
    .filter((p) => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return (
        (p.name && p.name.toLowerCase().includes(query)) ||
        (p.user && p.user.toLowerCase().includes(query)) ||
        (p.pid && String(p.pid).includes(query))
      )
    })
    .sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'pid':
          comparison = (a.pid || 0) - (b.pid || 0)
          break
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '')
          break
        case 'user':
          comparison = (a.user || '').localeCompare(b.user || '')
          break
        case 'memory':
          comparison = (a.mem_kb || 0) - (b.mem_kb || 0)
          break
        default:
          comparison = 0
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-2">
          <ListTree className="w-5 h-5 text-neon-green" />
          <span className="font-display font-bold text-white">Process Manager</span>
          <span className="text-xs text-sentinel-text">({processes.length})</span>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sentinel-text" />
            <input
              type="text"
              placeholder="Search processes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-void-700 border border-sentinel-border rounded px-3 py-2 pl-10 text-white placeholder-sentinel-muted text-sm focus:outline-none focus:border-neon-pink"
            />
          </div>

          <button
            onClick={fetchProcesses}
            disabled={isLoading || agent.status !== 'ONLINE'}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded border transition-all',
              'bg-void-700 border-sentinel-border text-white',
              'hover:bg-void-600 disabled:opacity-50'
            )}
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            Refresh
          </button>

          {selected.length > 0 && (
            <button
              onClick={handleKillSelected}
              className="flex items-center gap-2 px-4 py-2 rounded border bg-neon-red/20 border-neon-red text-neon-red hover:bg-neon-red/30 transition-all"
            >
              <Skull className="w-4 h-4" />
              Kill ({selected.length})
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-void-800 border border-sentinel-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-void-700 text-left">
                <th className="p-3 w-10">
                  <input
                    type="checkbox"
                    checked={selected.length === filteredProcesses.length && filteredProcesses.length > 0}
                    onChange={toggleSelectAll}
                    className="accent-neon-pink"
                  />
                </th>
                <HeaderCell label="PID" sortKey="pid" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                <HeaderCell label="Name" sortKey="name" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                <HeaderCell label="User" sortKey="user" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                <HeaderCell label="Memory" sortKey="memory" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                <th className="p-3 w-20 text-xs font-mono text-sentinel-text">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <Loader2 className="w-8 h-8 text-neon-pink animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredProcesses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-sentinel-text">
                    {processes.length === 0
                      ? 'Click Refresh to load processes'
                      : 'No processes match your search'}
                  </td>
                </tr>
              ) : (
                filteredProcesses.map((process, index) => (
                  <tr
                    key={`${process.pid}-${process.name}`}
                    className={cn(
                      'border-t border-sentinel-border/50 hover:bg-void-700/50 transition-colors',
                      index % 2 === 0 ? 'bg-void-800' : 'bg-void-800/50',
                      selected.includes(process.name) && 'bg-neon-pink/5'
                    )}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(process.name)}
                        onChange={() => toggleSelect(process.name)}
                        className="accent-neon-pink"
                      />
                    </td>
                    <td className="p-3 font-mono text-sm text-neon-purple">{process.pid || 'N/A'}</td>
                    <td className="p-3 font-mono text-sm text-white">
                      {process.name || 'Unknown'}
                      {process.name === 'sentinel.exe' && (
                        <span className="ml-2 text-[10px] text-neon-pink">(AGENT)</span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-sm text-sentinel-text">{process.user || 'N/A'}</td>
                    <td className="p-3 font-mono text-sm text-sentinel-text">
                      {process.mem_kb ? formatBytes(process.mem_kb * 1024) : 'N/A'}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleKillProcess(process.name)}
                        disabled={process.name === 'sentinel.exe'}
                        className={cn(
                          'p-1.5 rounded transition-colors',
                          process.name === 'sentinel.exe'
                            ? 'bg-sentinel-text/10 text-sentinel-text cursor-not-allowed'
                            : 'bg-neon-red/10 text-neon-red hover:bg-neon-red/20'
                        )}
                        title={process.name === 'sentinel.exe' ? 'Cannot kill agent process' : 'Kill process'}
                      >
                        <Skull className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      {filteredProcesses.length > 0 && (
        <p className="text-xs text-sentinel-text font-mono text-center">
          Showing {filteredProcesses.length} of {processes.length} processes
          {selected.length > 0 && ` • ${selected.length} selected`}
        </p>
      )}

      {/* Confirm Kill Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, process: null, isMultiple: false })}
        onConfirm={confirmKillProcess}
        title="Kill Process"
        message={
          confirmModal.isMultiple
            ? `Are you sure you want to kill ${selected.length} selected processes? This action cannot be undone.`
            : `Are you sure you want to kill "${confirmModal.process}"? This action cannot be undone.`
        }
        confirmText="Kill Process"
        cancelText="Cancel"
        variant="danger"
        icon={Skull}
      />
    </div>
  )
}

function HeaderCell({ label, sortKey, sortBy, sortOrder, onSort }) {
  const isActive = sortBy === sortKey
  
  return (
    <th
      className="p-3 text-xs font-mono text-sentinel-text cursor-pointer hover:text-white transition-colors select-none"
      onClick={() => onSort(sortKey)}
    >
      <span className="flex items-center gap-1">
        {label}
        {isActive && (
          <span className="text-neon-pink">{sortOrder === 'asc' ? '↑' : '↓'}</span>
        )}
      </span>
    </th>
  )
}

export default ProcessesTab
