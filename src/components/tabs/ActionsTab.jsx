import { useState } from 'react'
import {
  Lock,
  RotateCcw,
  Power,
  MessageSquare,
  Globe,
  Radio,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react'
import { cn } from '../../utils/cn'
import { commands, CommunicationMode } from '../../services/commands'
import { useCommandStore } from '../../store/commandStore'
import { formatTime } from '../../utils/formatters'
import { toast } from 'sonner'
import { isValidUrl } from '../../utils/validators'

function ActionsTab({ agent }) {
  const [activeModal, setActiveModal] = useState(null)
  const { getCommandHistoryForAgent } = useCommandStore()
  const history = getCommandHistoryForAgent(agent.hwid).slice(0, 20)

  const quickActions = [
    {
      id: 'lock',
      label: 'Lock',
      description: 'Lock workstation',
      icon: Lock,
      color: 'purple',
      action: () => {
        commands.lock(agent.hwid)
        toast.success('Lock command sent')
      },
    },
    {
      id: 'restart',
      label: 'Restart',
      description: 'Restart computer',
      icon: RotateCcw,
      color: 'orange',
      dangerous: true,
      action: () => setActiveModal('restart'),
    },
    {
      id: 'shutdown',
      label: 'Shutdown',
      description: 'Shutdown computer',
      icon: Power,
      color: 'red',
      dangerous: true,
      action: () => setActiveModal('shutdown'),
    },
    {
      id: 'message',
      label: 'Message',
      description: 'Send alert',
      icon: MessageSquare,
      color: 'green',
      action: () => setActiveModal('message'),
    },
    {
      id: 'openUrl',
      label: 'Open URL',
      description: 'Open in browser',
      icon: Globe,
      color: 'blue',
      action: () => setActiveModal('url'),
    },
    {
      id: 'switchMode',
      label: 'Switch Mode',
      description: agent.communicationMode || 'SESSION',
      icon: Radio,
      color: 'pink',
      action: () => setActiveModal('mode'),
    },
  ]

  const colorClasses = {
    purple: 'hover:border-neon-purple hover:shadow-neon-purple',
    orange: 'hover:border-neon-orange hover:shadow-[0_0_10px_rgba(255,170,0,0.5)]',
    red: 'hover:border-neon-red hover:shadow-neon-red',
    green: 'hover:border-neon-green hover:shadow-neon-green',
    blue: 'hover:border-neon-purple hover:shadow-neon-purple',
    pink: 'hover:border-neon-pink hover:shadow-neon-pink',
  }

  const iconColorClasses = {
    purple: 'text-neon-purple',
    orange: 'text-neon-orange',
    red: 'text-neon-red',
    green: 'text-neon-green',
    blue: 'text-neon-purple',
    pink: 'text-neon-pink',
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions Header */}
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-neon-pink" />
        <span className="font-display font-bold text-white">Quick Actions</span>
      </div>

      {/* Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={action.action}
            disabled={agent.status !== 'ONLINE'}
            className={cn(
              'card p-6 text-center transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              colorClasses[action.color]
            )}
          >
            <action.icon
              className={cn('w-8 h-8 mx-auto mb-3', iconColorClasses[action.color])}
            />
            <p className="font-display font-bold text-white text-sm">{action.label}</p>
            <p className="text-[10px] text-sentinel-text mt-1">{action.description}</p>
          </button>
        ))}
      </div>

      {/* Command History */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-sentinel-text" />
          <span className="font-display font-bold text-white">Command History</span>
        </div>

        {history.length === 0 ? (
          <p className="text-sentinel-text text-sm text-center py-8">
            No commands executed yet
          </p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {history.map((cmd) => (
              <div
                key={cmd.id}
                className="flex items-center justify-between py-2 px-3 bg-void-900 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-sentinel-text">
                    [{formatTime(cmd.sentAt)}]
                  </span>
                  <span className="text-sm font-mono text-white">{cmd.type}</span>
                  {cmd.payload?.length > 0 && (
                    <span className="text-xs text-sentinel-text truncate max-w-[200px]">
                      {cmd.payload.join(' ')}
                    </span>
                  )}
                </div>
                <StatusBadge status={cmd.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {activeModal === 'restart' && (
        <ConfirmModal
          title="Restart Computer"
          message="This will restart the target machine. The agent will reconnect automatically."
          confirmLabel="Restart"
          dangerous
          onConfirm={() => {
            commands.restart(agent.hwid)
            toast.success('Restart command sent')
            setActiveModal(null)
          }}
          onCancel={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'shutdown' && (
        <ConfirmModal
          title="Shutdown Computer"
          message="This will shut down the target machine. You will lose remote access until manually restarted."
          confirmLabel="Shutdown"
          dangerous
          countdown={5}
          onConfirm={() => {
            commands.shutdown(agent.hwid)
            toast.success('Shutdown command sent')
            setActiveModal(null)
          }}
          onCancel={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'message' && (
        <MessageModal
          onSend={(title, message) => {
            commands.message(agent.hwid, title, message)
            toast.success('Message sent')
            setActiveModal(null)
          }}
          onCancel={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'url' && (
        <UrlModal
          onOpen={(url) => {
            commands.openUrl(agent.hwid, url)
            toast.success('URL opened')
            setActiveModal(null)
          }}
          onCancel={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'mode' && (
        <ModeModal
          currentMode={agent.communicationMode || 'SESSION'}
          onSwitch={(mode, interval) => {
            commands.switchMode(agent.hwid, mode, interval)
            toast.success(`Switched to ${mode} mode`)
            setActiveModal(null)
          }}
          onCancel={() => setActiveModal(null)}
        />
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  const config = {
    SUCCESS: { icon: CheckCircle, class: 'text-neon-green' },
    ERROR: { icon: XCircle, class: 'text-neon-red' },
    PENDING: { icon: Loader2, class: 'text-neon-orange animate-spin' },
  }

  const { icon: Icon, class: className } = config[status] || config.PENDING

  return (
    <div className={cn('flex items-center gap-1 text-xs font-mono', className)}>
      <Icon className="w-3 h-3" />
      <span>{status}</span>
    </div>
  )
}

function ConfirmModal({ title, message, confirmLabel, dangerous, countdown, onConfirm, onCancel }) {
  const [remaining, setRemaining] = useState(countdown || 0)

  useState(() => {
    if (countdown) {
      const interval = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            clearInterval(interval)
            return 0
          }
          return r - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [countdown])

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-display font-bold text-white mb-2">{title}</h3>
        <p className="text-sentinel-text text-sm mb-6">{message}</p>

        {countdown && remaining > 0 && (
          <p className="text-center text-neon-orange text-sm mb-4">
            Confirm available in {remaining}s
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={countdown && remaining > 0}
            className={cn('btn', dangerous ? 'btn-danger' : 'btn-primary')}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function MessageModal({ onSend, onCancel }) {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-display font-bold text-white mb-4">Send Message</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-sentinel-text mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input w-full"
              placeholder="Alert Title"
            />
          </div>
          <div>
            <label className="block text-sm text-sentinel-text mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="input w-full h-24 resize-none"
              placeholder="Your message here..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={() => onSend(title, message)}
            disabled={!title.trim() || !message.trim()}
            className="btn btn-primary"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

function UrlModal({ onOpen, onCancel }) {
  const [url, setUrl] = useState('https://')
  const isValid = isValidUrl(url)

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-display font-bold text-white mb-4">Open URL</h3>

        <div>
          <label className="block text-sm text-sentinel-text mb-1">URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="input w-full"
            placeholder="https://example.com"
          />
          {url && !isValid && (
            <p className="text-neon-red text-xs mt-1">Please enter a valid URL</p>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
          <button onClick={() => onOpen(url)} disabled={!isValid} className="btn btn-primary">
            Open
          </button>
        </div>
      </div>
    </div>
  )
}

function ModeModal({ currentMode, onSwitch, onCancel }) {
  const [mode, setMode] = useState(currentMode)
  const [interval, setInterval] = useState(300)

  const intervals = [
    { value: 30, label: '30 seconds' },
    { value: 60, label: '1 minute' },
    { value: 300, label: '5 minutes' },
    { value: 900, label: '15 minutes' },
    { value: 1800, label: '30 minutes' },
    { value: 3600, label: '1 hour' },
  ]

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-display font-bold text-white mb-4">Switch Communication Mode</h3>

        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setMode('SESSION')}
              className={cn(
                'flex-1 p-4 rounded-lg border transition-colors',
                mode === 'SESSION'
                  ? 'border-neon-pink bg-neon-pink/10'
                  : 'border-sentinel-border hover:border-sentinel-text'
              )}
            >
              <p className="font-bold text-white">Session</p>
              <p className="text-xs text-sentinel-text">Persistent connection</p>
            </button>
            <button
              onClick={() => setMode('BEACON')}
              className={cn(
                'flex-1 p-4 rounded-lg border transition-colors',
                mode === 'BEACON'
                  ? 'border-neon-pink bg-neon-pink/10'
                  : 'border-sentinel-border hover:border-sentinel-text'
              )}
            >
              <p className="font-bold text-white">Beacon</p>
              <p className="text-xs text-sentinel-text">Periodic check-ins</p>
            </button>
          </div>

          {mode === 'BEACON' && (
            <div>
              <label className="block text-sm text-sentinel-text mb-1">Check-in Interval</label>
              <select
                value={interval}
                onChange={(e) => setInterval(+e.target.value)}
                className="input w-full"
              >
                {intervals.map((i) => (
                  <option key={i.value} value={i.value}>
                    {i.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={() => onSwitch(mode, mode === 'BEACON' ? interval : null)}
            className="btn btn-primary"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}

export default ActionsTab
