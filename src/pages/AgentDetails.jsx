import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Monitor,
  Terminal,
  Camera,
  ListTree,
  Zap,
  Cpu,
  HardDrive,
  Wifi,
} from 'lucide-react'
import { cn } from '../utils/cn'
import { useAgentStore } from '../store/agentStore'
import { useUIStore } from '../store/uiStore'
import { formatPercent, formatMB, formatRelativeTime } from '../utils/formatters'

// Tab Components (will be expanded later)
import OverviewTab from '../components/tabs/OverviewTab'
import TerminalTab from '../components/tabs/TerminalTab'
import SurveillanceTab from '../components/tabs/SurveillanceTab'
import ProcessesTab from '../components/tabs/ProcessesTab'
import ActionsTab from '../components/tabs/ActionsTab'

const TABS = [
  { id: 'overview', label: 'Overview', icon: Monitor },
  { id: 'terminal', label: 'Terminal', icon: Terminal },
  { id: 'surveillance', label: 'Surveillance', icon: Camera },
  { id: 'processes', label: 'Processes', icon: ListTree },
  { id: 'actions', label: 'Actions', icon: Zap },
]

function AgentDetails() {
  const { hwid } = useParams()
  const navigate = useNavigate()
  const { getAgentByHwid } = useAgentStore()
  const { activeTab, setActiveTab } = useUIStore()
  
  const agent = getAgentByHwid(hwid)

  // Reset to overview tab when agent changes
  useEffect(() => {
    setActiveTab('overview')
  }, [hwid, setActiveTab])

  if (!agent) {
    return (
      <div className="card p-12 text-center">
        <Monitor className="w-12 h-12 text-sentinel-text mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Agent not found</h3>
        <p className="text-sentinel-text text-sm mb-4">
          The agent with HWID "{hwid}" was not found.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn btn-secondary"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>
    )
  }

  const statusColors = {
    ONLINE: 'text-neon-green',
    OFFLINE: 'text-sentinel-text',
    DEAD: 'text-neon-red',
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab agent={agent} />
      case 'terminal':
        return <TerminalTab agent={agent} />
      case 'surveillance':
        return <SurveillanceTab agent={agent} />
      case 'processes':
        return <ProcessesTab agent={agent} />
      case 'actions':
        return <ActionsTab agent={agent} />
      default:
        return <OverviewTab agent={agent} />
    }
  }

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          {/* Left: Back + Agent Info */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="btn btn-ghost p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-3 h-3 rounded-full',
                  agent.status === 'ONLINE'
                    ? 'bg-neon-green shadow-neon-green'
                    : agent.status === 'DEAD'
                    ? 'bg-neon-red shadow-neon-red'
                    : 'bg-sentinel-text'
                )}
              />
              <div>
                <h2 className="text-lg font-display font-bold text-white">
                  {agent.hostname}
                </h2>
                <p className="text-xs font-mono text-sentinel-text">
                  {agent.ipLocal} • {agent.hwid}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Quick Stats */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-neon-pink" />
              <span className="text-sm font-mono text-white">
                {formatPercent(agent.cpuLoad)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-neon-purple" />
              <span className="text-sm font-mono text-white">
                {formatMB(agent.ramUsage)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-sentinel-text" />
              <span className="text-sm font-mono text-sentinel-text">
                {formatRelativeTime(agent.lastSeen)}
              </span>
            </div>
            <span
              className={cn(
                'px-2 py-1 rounded text-xs font-mono',
                statusColors[agent.status]
              )}
            >
              {agent.status}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="card p-0 overflow-hidden">
        <div className="flex border-b border-sentinel-border overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-6 py-4 font-display font-medium transition-all',
                'border-b-2 whitespace-nowrap',
                activeTab === tab.id
                  ? 'text-white border-neon-pink bg-void-700/50'
                  : 'text-sentinel-text border-transparent hover:text-white hover:bg-void-700/30'
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 animate-fade-in">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}

export default AgentDetails
