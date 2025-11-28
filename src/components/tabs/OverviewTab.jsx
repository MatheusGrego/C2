import { useState, useEffect } from 'react'
import { Cpu, HardDrive, Monitor, Clock, Wifi, Activity, Eye } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { formatPercent, formatMB, formatUptime, formatRelativeTime, formatTime } from '../../utils/formatters'
import { useInterval } from '../../hooks/useInterval'
import { cn } from '../../utils/cn'

function OverviewTab({ agent }) {
  // Telemetry history for charts
  const [cpuHistory, setCpuHistory] = useState([])
  const [ramHistory, setRamHistory] = useState([])

  // Update history when agent data changes
  useEffect(() => {
    if (agent.status === 'ONLINE') {
      const timestamp = new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      })
      
      setCpuHistory(prev => {
        const newHistory = [...prev, { time: timestamp, value: agent.cpuLoad || 0 }]
        return newHistory.slice(-30) // Keep last 30 data points
      })
      
      setRamHistory(prev => {
        const newHistory = [...prev, { time: timestamp, value: agent.ramUsage || 0 }]
        return newHistory.slice(-30)
      })
    }
  }, [agent.cpuLoad, agent.ramUsage, agent.status])

  return (
    <div className="space-y-6">
      {/* Top Row - System Info + Current Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Information */}
        <div className="bg-void-700 border border-sentinel-border rounded-lg p-5">
          <h3 className="text-sm font-display font-bold text-white mb-4 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-neon-pink" />
            System Information
          </h3>
          <div className="space-y-3 font-mono text-sm">
            <InfoRow label="OS" value={agent.osInfo || 'Windows'} />
            <InfoRow label="Hostname" value={agent.hostname} />
            <InfoRow label="IP Address" value={agent.ipLocal} />
            <InfoRow label="HWID" value={agent.hwid?.slice(0, 16) + '...'} mono />
            <InfoRow 
              label="Mode" 
              value={agent.communicationMode || 'SESSION'} 
              badge 
              badgeColor={agent.communicationMode === 'BEACON' ? 'orange' : 'purple'}
            />
            <InfoRow label="Status" value={agent.status} badge badgeColor={agent.status === 'ONLINE' ? 'green' : 'gray'} />
          </div>
        </div>

        {/* CPU Gauge */}
        <div className="bg-void-700 border border-sentinel-border rounded-lg p-5">
          <h3 className="text-sm font-display font-bold text-white mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-neon-pink" />
            CPU Usage
          </h3>
          <div className="flex flex-col items-center">
            <CircularGauge 
              value={agent.cpuLoad || 0} 
              max={100} 
              color="#eb055a"
              size={120}
            />
            <p className="mt-3 text-2xl font-mono font-bold text-white">
              {formatPercent(agent.cpuLoad)}
            </p>
            <p className="text-xs text-sentinel-text">Current Load</p>
          </div>
        </div>

        {/* RAM Gauge */}
        <div className="bg-void-700 border border-sentinel-border rounded-lg p-5">
          <h3 className="text-sm font-display font-bold text-white mb-4 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-neon-purple" />
            Memory Usage
          </h3>
          <div className="flex flex-col items-center">
            <CircularGauge 
              value={agent.ramUsage || 0} 
              max={32768} 
              color="#4632f0"
              size={120}
            />
            <p className="mt-3 text-2xl font-mono font-bold text-white">
              {formatMB(agent.ramUsage)}
            </p>
            <p className="text-xs text-sentinel-text">Used Memory</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU Chart */}
        <div className="bg-void-700 border border-sentinel-border rounded-lg p-5">
          <h3 className="text-sm font-display font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-neon-pink" />
            CPU History
          </h3>
          <div className="h-48">
            {cpuHistory.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cpuHistory}>
                  <defs>
                    <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#eb055a" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#eb055a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="time" 
                    stroke="#463f6a" 
                    tick={{ fill: '#68648c', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    stroke="#463f6a"
                    tick={{ fill: '#68648c', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#1c1437', 
                      border: '1px solid #463f6a',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value) => [`${value.toFixed(1)}%`, 'CPU']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#eb055a" 
                    strokeWidth={2}
                    fill="url(#cpuGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sentinel-text text-sm">
                Collecting data...
              </div>
            )}
          </div>
        </div>

        {/* RAM Chart */}
        <div className="bg-void-700 border border-sentinel-border rounded-lg p-5">
          <h3 className="text-sm font-display font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-neon-purple" />
            Memory History
          </h3>
          <div className="h-48">
            {ramHistory.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ramHistory}>
                  <defs>
                    <linearGradient id="ramGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4632f0" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4632f0" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="time" 
                    stroke="#463f6a" 
                    tick={{ fill: '#68648c', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    domain={[0, 'dataMax']} 
                    stroke="#463f6a"
                    tick={{ fill: '#68648c', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${(v/1024).toFixed(0)}G`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#1c1437', 
                      border: '1px solid #463f6a',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value) => [formatMB(value), 'RAM']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#4632f0" 
                    strokeWidth={2}
                    fill="url(#ramGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sentinel-text text-sm">
                Collecting data...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Window */}
      <div className="bg-void-700 border border-sentinel-border rounded-lg p-5">
        <h3 className="text-sm font-display font-bold text-white mb-4 flex items-center gap-2">
          <Eye className="w-4 h-4 text-neon-green" />
          Active Window Monitor
        </h3>
        <div className="bg-void-900 rounded-lg p-4 border border-sentinel-border/50">
          {agent.status === 'ONLINE' && agent.activeWindow ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-void-700 rounded-lg flex items-center justify-center">
                <Monitor className="w-5 h-5 text-neon-green" />
              </div>
              <div>
                <p className="font-mono text-sm text-white">{agent.activeWindow}</p>
                <p className="text-xs text-sentinel-text">Currently in focus</p>
              </div>
            </div>
          ) : (
            <p className="text-sentinel-text text-sm text-center py-2">
              {agent.status === 'ONLINE' ? 'No active window detected' : 'Agent offline'}
            </p>
          )}
        </div>
      </div>

      {/* Connection Info */}
      <div className="bg-void-700 border border-sentinel-border rounded-lg p-5">
        <h3 className="text-sm font-display font-bold text-white mb-4 flex items-center gap-2">
          <Wifi className="w-4 h-4 text-sentinel-text" />
          Connection Details
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Last Seen" value={formatRelativeTime(agent.lastSeen)} />
          <StatCard label="Mode" value={agent.communicationMode || 'SESSION'} />
          {agent.communicationMode === 'BEACON' && agent.beaconInterval && (
            <StatCard label="Interval" value={`${agent.beaconInterval}s`} />
          )}
          <StatCard label="IP" value={agent.ipLocal} mono />
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, mono = false, badge = false, badgeColor = 'purple' }) {
  const badgeColors = {
    purple: 'bg-neon-purple/20 text-neon-purple border-neon-purple/50',
    green: 'bg-neon-green/20 text-neon-green border-neon-green/50',
    orange: 'bg-neon-orange/20 text-neon-orange border-neon-orange/50',
    gray: 'bg-sentinel-text/20 text-sentinel-text border-sentinel-text/50',
  }

  return (
    <div className="flex justify-between items-center py-1.5 border-b border-sentinel-border/30 last:border-0">
      <span className="text-sentinel-text text-xs">{label}</span>
      {badge ? (
        <span className={cn('px-2 py-0.5 rounded text-[10px] border', badgeColors[badgeColor])}>
          {value}
        </span>
      ) : (
        <span className={cn('text-white text-xs', mono && 'font-mono')}>{value}</span>
      )}
    </div>
  )
}

function StatCard({ label, value, mono = false }) {
  return (
    <div className="bg-void-800 rounded-lg p-3 border border-sentinel-border/50">
      <p className="text-[10px] text-sentinel-text mb-1">{label}</p>
      <p className={cn('text-sm text-white', mono && 'font-mono')}>{value}</p>
    </div>
  )
}

function CircularGauge({ value, max, color, size = 100 }) {
  const percentage = Math.min((value / max) * 100, 100)
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  return (
    <svg width={size} height={size} className="-rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        stroke="#1f1942"
        fill="none"
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        stroke={color}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-500"
        style={{
          filter: `drop-shadow(0 0 6px ${color}50)`
        }}
      />
    </svg>
  )
}

export default OverviewTab
