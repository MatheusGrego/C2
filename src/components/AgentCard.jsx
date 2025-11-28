import { memo } from 'react'
import { Cpu, HardDrive, Clock, Wifi, Monitor } from 'lucide-react'
import { cn } from '../utils/cn'
import { formatRelativeTime, formatPercent, formatMB } from '../utils/formatters'
import { ModeBadge } from './ui/Badge'
import { Tooltip } from './ui/Tooltip'

/**
 * Agent Card Component
 * Displays agent information in a card format
 */
export const AgentCard = memo(function AgentCard({ agent, onClick, selected = false }) {
  const statusColors = {
    ONLINE: 'bg-neon-green shadow-[0_0_8px_rgba(0,255,136,0.6)]',
    OFFLINE: 'bg-sentinel-text',
    DEAD: 'bg-neon-red shadow-[0_0_8px_rgba(255,68,68,0.6)]',
  }

  const statusTextColors = {
    ONLINE: 'text-neon-green',
    OFFLINE: 'text-sentinel-text',
    DEAD: 'text-neon-red',
  }

  const isOnline = agent.status === 'ONLINE'

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative bg-void-800 border rounded-lg p-4 cursor-pointer',
        'transition-all duration-200 group',
        'hover:border-neon-pink hover:shadow-neon-pink',
        selected ? 'border-neon-pink shadow-neon-pink' : 'border-sentinel-border'
      )}
    >
      {/* Status Indicator Line */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 h-0.5 rounded-t-lg transition-all',
          isOnline ? 'bg-gradient-to-r from-neon-green to-neon-green/50' : 
          agent.status === 'DEAD' ? 'bg-gradient-to-r from-neon-red to-neon-red/50' :
          'bg-sentinel-border'
        )}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Tooltip content={agent.status}>
            <div
              className={cn(
                'w-2.5 h-2.5 rounded-full transition-all',
                statusColors[agent.status]
              )}
            />
          </Tooltip>
          <span className={cn('text-xs font-mono uppercase', statusTextColors[agent.status])}>
            {agent.status}
          </span>
        </div>
        <ModeBadge mode={agent.communicationMode || 'SESSION'} />
      </div>

      {/* OS Icon + Hostname */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-void-700 rounded-lg flex items-center justify-center">
          <Monitor className="w-5 h-5 text-neon-purple" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-white text-lg truncate group-hover:text-neon-pink transition-colors">
            {agent.hostname || 'Unknown Host'}
          </h3>
          <p className="text-xs font-mono text-sentinel-text truncate">
            {agent.ipLocal || '---.---.---.---'}
          </p>
        </div>
      </div>

      {/* Metrics */}
      {isOnline ? (
        <div className="space-y-2 mb-3">
          {/* CPU */}
          <MetricBar
            icon={Cpu}
            label="CPU"
            value={agent.cpuLoad}
            max={100}
            color="pink"
          />
          {/* RAM */}
          <MetricBar
            icon={HardDrive}
            label="RAM"
            value={agent.ramUsage}
            max={32768}
            displayValue={formatMB(agent.ramUsage)}
            color="purple"
          />
        </div>
      ) : (
        <div className="h-[52px] flex items-center justify-center text-sentinel-text text-sm">
          {agent.status === 'DEAD' ? 'Agent lost' : 'Agent offline'}
        </div>
      )}

      {/* Active Window (if online) */}
      {isOnline && agent.activeWindow && (
        <div className="mb-3 p-2 bg-void-900 rounded border border-sentinel-border/50">
          <p className="text-[10px] text-sentinel-text mb-1">Active Window</p>
          <p className="text-xs font-mono text-white truncate">{agent.activeWindow}</p>
        </div>
      )}

      {/* Footer */}
      <div className="pt-3 border-t border-sentinel-border/50 flex items-center justify-between">
        <Tooltip content={`Last seen: ${new Date(agent.lastSeen).toLocaleString()}`}>
          <div className="flex items-center gap-1 text-sentinel-text">
            <Clock className="w-3 h-3" />
            <span className="text-[10px] font-mono">
              {formatRelativeTime(agent.lastSeen)}
            </span>
          </div>
        </Tooltip>
        <Tooltip content={agent.hwid}>
          <span className="text-[10px] font-mono text-sentinel-text">
            {agent.hwid?.slice(0, 8)}...
          </span>
        </Tooltip>
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison for performance
  return (
    prevProps.agent.hwid === nextProps.agent.hwid &&
    prevProps.agent.status === nextProps.agent.status &&
    prevProps.agent.cpuLoad === nextProps.agent.cpuLoad &&
    prevProps.agent.ramUsage === nextProps.agent.ramUsage &&
    prevProps.agent.lastSeen === nextProps.agent.lastSeen &&
    prevProps.agent.activeWindow === nextProps.agent.activeWindow &&
    prevProps.selected === nextProps.selected
  )
})

/**
 * Metric Bar Component
 */
function MetricBar({ icon: Icon, label, value, max, displayValue, color = 'pink' }) {
  const percentage = Math.min((value / max) * 100, 100)
  
  const colorClasses = {
    pink: 'bg-neon-pink',
    purple: 'bg-neon-purple',
    green: 'bg-neon-green',
  }

  return (
    <div className="flex items-center gap-2">
      <Icon className="w-3 h-3 text-sentinel-text flex-shrink-0" />
      <div className="flex-1 h-1 bg-void-600 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', colorClasses[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-mono text-sentinel-text w-14 text-right">
        {displayValue || formatPercent(value)}
      </span>
    </div>
  )
}

export default AgentCard
