import { useState } from 'react'
import {
  Settings as SettingsIcon,
  Volume2,
  Bell,
  Palette,
  Shield,
  Database,
  Save,
} from 'lucide-react'
import { cn } from '../utils/cn'
import { useUIStore } from '../store/uiStore'
import { toast } from 'sonner'

function Settings() {
  const {
    soundEnabled,
    notificationsEnabled,
    toggleSound,
    toggleNotifications,
  } = useUIStore()

  const [settings, setSettings] = useState({
    beaconDefaultInterval: 300,
    maxScreenshotStorage: 1024,
    autoRefreshInterval: 5,
  })

  const handleSave = () => {
    // In a real app, this would save to backend
    toast.success('Settings saved successfully')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <SettingsIcon className="w-8 h-8 text-neon-pink" />
        <h1 className="text-2xl font-display font-bold text-white">Settings</h1>
      </div>

      {/* Notifications Section */}
      <div className="card p-6">
        <h2 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-neon-pink" />
          Notifications
        </h2>

        <div className="space-y-4">
          <ToggleSetting
            label="Sound Effects"
            description="Play notification sounds when agents connect/disconnect"
            enabled={soundEnabled}
            onToggle={toggleSound}
          />
          <ToggleSetting
            label="Toast Notifications"
            description="Show popup notifications for events"
            enabled={notificationsEnabled}
            onToggle={toggleNotifications}
          />
        </div>
      </div>

      {/* Display Section */}
      <div className="card p-6">
        <h2 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-neon-purple" />
          Display
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Auto-refresh Interval
            </label>
            <select
              value={settings.autoRefreshInterval}
              onChange={(e) =>
                setSettings({ ...settings, autoRefreshInterval: +e.target.value })
              }
              className="input"
            >
              <option value={5}>5 seconds</option>
              <option value={10}>10 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={60}>1 minute</option>
            </select>
            <p className="text-xs text-sentinel-text mt-1">
              How often to refresh agent data from REST API (WebSocket updates are real-time)
            </p>
          </div>
        </div>
      </div>

      {/* Agent Defaults Section */}
      <div className="card p-6">
        <h2 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-neon-green" />
          Agent Defaults
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Default Beacon Interval
            </label>
            <select
              value={settings.beaconDefaultInterval}
              onChange={(e) =>
                setSettings({ ...settings, beaconDefaultInterval: +e.target.value })
              }
              className="input"
            >
              <option value={30}>30 seconds</option>
              <option value={60}>1 minute</option>
              <option value={300}>5 minutes</option>
              <option value={900}>15 minutes</option>
              <option value={1800}>30 minutes</option>
              <option value={3600}>1 hour</option>
            </select>
            <p className="text-xs text-sentinel-text mt-1">
              Default check-in interval when switching agents to Beacon mode
            </p>
          </div>
        </div>
      </div>

      {/* Storage Section */}
      <div className="card p-6">
        <h2 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-neon-orange" />
          Storage
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Max Screenshot Storage (MB)
            </label>
            <input
              type="number"
              value={settings.maxScreenshotStorage}
              onChange={(e) =>
                setSettings({ ...settings, maxScreenshotStorage: +e.target.value })
              }
              className="input"
              min={100}
              max={10240}
            />
            <p className="text-xs text-sentinel-text mt-1">
              Maximum storage per agent for screenshots (100 MB - 10 GB)
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button onClick={handleSave} className="btn btn-primary">
          <Save className="w-4 h-4" />
          Save Settings
        </button>
      </div>
    </div>
  )
}

/**
 * Toggle Setting Component
 */
function ToggleSetting({ label, description, enabled, onToggle }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-white">{label}</p>
        <p className="text-sm text-sentinel-text">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={cn(
          'relative w-12 h-6 rounded-full transition-colors',
          enabled ? 'bg-neon-pink' : 'bg-void-600'
        )}
      >
        <div
          className={cn(
            'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
            enabled ? 'translate-x-7' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  )
}

export default Settings
