import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Filter,
  Monitor,
  Cpu,
  HardDrive,
  Clock,
  Radio,
  Users,
  AlertTriangle,
  Wifi,
  RefreshCw,
  LayoutGrid,
  List,
} from 'lucide-react'
import { cn } from '../utils/cn'
import { useAgentStore, AgentStatus } from '../store/agentStore'
import { useUIStore } from '../store/uiStore'
import { useDebounce } from '../hooks/useDebounce'
import { AgentCard } from '../components/AgentCard'
import { Button, Input, Select, Badge, Tooltip } from '../components/ui'

/**
 * Dashboard Page - Agent Grid (Lobby)
 */
function Dashboard() {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  
  const {
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    getFilteredAgents,
    getStats,
    isLoading,
  } = useAgentStore()
  
  const { wsConnected } = useUIStore()

  const debouncedSearch = useDebounce(searchQuery, 300)
  const filteredAgents = getFilteredAgents()
  const stats = getStats()

  const filters = [
    { value: 'ALL', label: 'All', count: stats.total },
    { value: 'ONLINE', label: 'Online', count: stats.online },
    { value: 'OFFLINE', label: 'Offline', count: stats.offline },
    { value: 'DEAD', label: 'Dead', count: stats.dead },
  ]

  const sortOptions = [
    { value: 'hostname', label: 'Hostname' },
    { value: 'cpuLoad', label: 'CPU Usage' },
    { value: 'ramUsage', label: 'RAM Usage' },
    { value: 'lastSeen', label: 'Last Seen' },
    { value: 'status', label: 'Status' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">
            Agent Dashboard
          </h1>
          <p className="text-sentinel-text text-sm">
            Monitor and control your connected agents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={wsConnected ? 'green' : 'red'} dot>
            {wsConnected ? 'Live Updates' : 'Disconnected'}
          </Badge>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          icon={Users}
          label="Online"
          value={stats.online}
          total={stats.total}
          color="green"
        />
        <KPICard
          icon={Monitor}
          label="Offline"
          value={stats.offline}
          total={stats.total}
          color="gray"
        />
        <KPICard
          icon={AlertTriangle}
          label="Dead"
          value={stats.dead}
          total={stats.total}
          color="red"
        />
        <KPICard
          icon={Radio}
          label="Beacon Mode"
          value={stats.beaconMode}
          total={stats.total}
          color="orange"
        />
      </div>

      {/* Toolbar */}
      <div className="bg-void-800 border border-sentinel-border rounded-lg p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Search */}
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sentinel-text" />
            <input
              type="text"
              placeholder="Search by hostname, IP, or HWID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-void-700 border border-sentinel-border rounded px-3 py-2 pl-10 text-white placeholder-sentinel-muted text-sm focus:outline-none focus:border-neon-pink transition-colors"
            />
          </div>

          {/* Filters & Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filters */}
            <div className="flex items-center gap-1 bg-void-700 rounded-lg p-1">
              {filters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-mono rounded transition-all flex items-center gap-1',
                    filter === f.value
                      ? 'bg-neon-pink text-white'
                      : 'text-sentinel-text hover:text-white hover:bg-void-600'
                  )}
                >
                  {f.label}
                  <span className={cn(
                    'text-[10px]',
                    filter === f.value ? 'text-white/70' : 'text-sentinel-text'
                  )}>
                    ({f.count})
                  </span>
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-void-700 border border-sentinel-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-neon-pink"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  Sort: {opt.label}
                </option>
              ))}
            </select>

            {/* View Mode */}
            <div className="flex items-center gap-1 bg-void-700 rounded-lg p-1">
              <Tooltip content="Grid view">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2 rounded transition-colors',
                    viewMode === 'grid'
                      ? 'bg-neon-pink text-white'
                      : 'text-sentinel-text hover:text-white'
                  )}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </Tooltip>
              <Tooltip content="List view">
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2 rounded transition-colors',
                    viewMode === 'list'
                      ? 'bg-neon-pink text-white'
                      : 'text-sentinel-text hover:text-white'
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Grid/List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-neon-pink/30 border-t-neon-pink rounded-full animate-spin" />
            <span className="text-sentinel-text">Loading agents...</span>
          </div>
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="bg-void-800 border border-sentinel-border rounded-lg p-12 text-center">
          <Monitor className="w-16 h-16 text-sentinel-text mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-display font-bold text-white mb-2">
            No agents found
          </h3>
          <p className="text-sentinel-text text-sm max-w-md mx-auto">
            {searchQuery
              ? `No agents match "${searchQuery}". Try adjusting your search.`
              : 'Waiting for agents to connect. Deploy the Sentinel implant to start monitoring.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAgents.map((agent) => (
            <AgentCard
              key={agent.hwid}
              agent={agent}
              onClick={() => navigate(`/agent/${agent.hwid}`)}
            />
          ))}
        </div>
      ) : (
        <AgentListView
          agents={filteredAgents}
          onSelect={(hwid) => navigate(`/agent/${hwid}`)}
        />
      )}

      {/* Results Count */}
      {!isLoading && filteredAgents.length > 0 && (
        <p className="text-center text-xs text-sentinel-text font-mono">
          Showing {filteredAgents.length} of {stats.total} agents
          {filter !== 'ALL' && ` (filtered by ${filter})`}
        </p>
      )}
    </div>
  )
}

/**
 * KPI Card Component
 */
function KPICard({ icon: Icon, label, value, total, color }) {
  const colorClasses = {
    green: 'text-neon-green bg-neon-green/10 border-neon-green/30',
    red: 'text-neon-red bg-neon-red/10 border-neon-red/30',
    purple: 'text-neon-purple bg-neon-purple/10 border-neon-purple/30',
    orange: 'text-neon-orange bg-neon-orange/10 border-neon-orange/30',
    gray: 'text-sentinel-text bg-sentinel-text/10 border-sentinel-text/30',
  }

  const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0

  return (
    <div className={cn('rounded-lg border p-4', colorClasses[color])}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5" />
          <div>
            <p className="text-2xl font-bold font-mono">{value}</p>
            <p className="text-xs opacity-80">{label}</p>
          </div>
        </div>
        <span className="text-xs font-mono opacity-60">{percentage}%</span>
      </div>
    </div>
  )
}

/**
 * Agent List View Component
 */
function AgentListView({ agents, onSelect }) {
  const statusColors = {
    ONLINE: 'text-neon-green',
    OFFLINE: 'text-sentinel-text',
    DEAD: 'text-neon-red',
  }

  return (
    <div className="bg-void-800 border border-sentinel-border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-void-700 text-left text-xs font-mono text-sentinel-text">
            <th className="p-3">Status</th>
            <th className="p-3">Hostname</th>
            <th className="p-3">IP Address</th>
            <th className="p-3">CPU</th>
            <th className="p-3">RAM</th>
            <th className="p-3">Mode</th>
            <th className="p-3">Last Seen</th>
          </tr>
        </thead>
        <tbody>
          {agents.map((agent, i) => (
            <tr
              key={agent.hwid}
              onClick={() => onSelect(agent.hwid)}
              className={cn(
                'border-t border-sentinel-border/50 cursor-pointer transition-colors',
                'hover:bg-void-700',
                i % 2 === 0 ? 'bg-void-800' : 'bg-void-800/50'
              )}
            >
              <td className="p-3">
                <span className={cn('font-mono text-xs', statusColors[agent.status])}>
                  ● {agent.status}
                </span>
              </td>
              <td className="p-3 font-medium text-white">{agent.hostname}</td>
              <td className="p-3 font-mono text-sm text-sentinel-text">{agent.ipLocal}</td>
              <td className="p-3 font-mono text-sm text-sentinel-text">
                {agent.status === 'ONLINE' ? `${agent.cpuLoad?.toFixed(1)}%` : '--'}
              </td>
              <td className="p-3 font-mono text-sm text-sentinel-text">
                {agent.status === 'ONLINE' ? `${(agent.ramUsage / 1024).toFixed(1)} GB` : '--'}
              </td>
              <td className="p-3">
                <Badge variant={agent.communicationMode === 'BEACON' ? 'orange' : 'purple'} size="xs">
                  {agent.communicationMode === 'BEACON' ? 'Beacon' : 'Session'}
                </Badge>
              </td>
              <td className="p-3 font-mono text-xs text-sentinel-text">
                {new Date(agent.lastSeen).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Dashboard
