import { useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { cn } from '../utils/cn'
import { authService } from '../services/api'
import { useSentinelSocket } from '../hooks/useSentinelSocket'
import { useUIStore } from '../store/uiStore'
import { useAgentStore } from '../store/agentStore'
import { agentService } from '../services/api'

function MainLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { connect, disconnect } = useSentinelSocket()
  const { wsConnected, soundEnabled, toggleSound } = useUIStore()
  const { setAgents, setLoading, setError } = useAgentStore()

  // Connect to WebSocket on mount
  useEffect(() => {
    connect()

    // Fetch initial agents via REST (WebSocket will provide updates)
    const fetchAgents = async () => {
      setLoading(true)
      try {
        const agents = await agentService.getAll()
        setAgents(agents)
      } catch (error) {
        console.error('Failed to fetch agents:', error)
        setError('Failed to load agents')
      }
    }

    fetchAgents()

    return () => {
      disconnect()
    }
  }, [connect, disconnect, setAgents, setLoading, setError])

  const handleLogout = () => {
    disconnect()
    authService.logout()
  }

  return (
    <div className="min-h-screen bg-void-900 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-void-800 border-b border-sentinel-border">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-neon-purple to-neon-pink rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <h1 className="text-xl font-display font-bold text-white glitch-text">
              SENTINEL VISION
            </h1>
          </Link>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono',
                wsConnected
                  ? 'bg-neon-green/10 text-neon-green'
                  : 'bg-neon-red/10 text-neon-red'
              )}
            >
              {wsConnected ? (
                <>
                  <Wifi className="w-3 h-3" />
                  <span>CONNECTED</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  <span>DISCONNECTED</span>
                </>
              )}
            </div>

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className={cn(
                'p-2 rounded-lg transition-colors',
                soundEnabled
                  ? 'text-neon-green hover:bg-void-700'
                  : 'text-sentinel-text hover:bg-void-700'
              )}
              title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
            >
              {soundEnabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </button>

            {/* Settings */}
            <Link
              to="/settings"
              className={cn(
                'p-2 rounded-lg transition-colors hover:bg-void-700',
                location.pathname === '/settings'
                  ? 'text-neon-pink'
                  : 'text-sentinel-text'
              )}
            >
              <Settings className="w-5 h-5" />
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-sentinel-text hover:bg-void-700 hover:text-neon-red transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Gradient Line */}
        <div className="gradient-line" />
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-sentinel-border py-3 px-6">
        <div className="flex items-center justify-between text-xs text-sentinel-text font-mono">
          <span>Sentinel Vision v1.0.6</span>
          <span>© 2025 - Educational Project</span>
        </div>
      </footer>
    </div>
  )
}

export default MainLayout
