import { cn } from '../../utils/cn'

const variants = {
  default: 'bg-sentinel-text/20 text-sentinel-text border-sentinel-text/50',
  pink: 'bg-neon-pink/20 text-neon-pink border-neon-pink/50',
  purple: 'bg-neon-purple/20 text-neon-purple border-neon-purple/50',
  green: 'bg-neon-green/20 text-neon-green border-neon-green/50',
  red: 'bg-neon-red/20 text-neon-red border-neon-red/50',
  orange: 'bg-neon-orange/20 text-neon-orange border-neon-orange/50',
  // Status variants
  online: 'bg-neon-green/20 text-neon-green border-neon-green/50',
  offline: 'bg-sentinel-text/20 text-sentinel-text border-sentinel-text/50',
  dead: 'bg-neon-red/20 text-neon-red border-neon-red/50',
  // Mode variants
  session: 'bg-neon-purple/20 text-neon-purple border-neon-purple/50',
  beacon: 'bg-neon-orange/20 text-neon-orange border-neon-orange/50',
}

const sizes = {
  xs: 'px-1 py-0.5 text-[10px]',
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
}

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  icon: Icon,
  className,
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-mono rounded border',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            variant === 'green' || variant === 'online' ? 'bg-neon-green' :
            variant === 'red' || variant === 'dead' ? 'bg-neon-red' :
            variant === 'orange' || variant === 'beacon' ? 'bg-neon-orange' :
            variant === 'pink' ? 'bg-neon-pink' :
            variant === 'purple' || variant === 'session' ? 'bg-neon-purple' :
            'bg-sentinel-text'
          )}
        />
      )}
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  )
}

export function StatusBadge({ status }) {
  const statusConfig = {
    ONLINE: { variant: 'online', label: 'Online' },
    OFFLINE: { variant: 'offline', label: 'Offline' },
    DEAD: { variant: 'dead', label: 'Dead' },
  }
  
  const config = statusConfig[status] || statusConfig.OFFLINE
  
  return (
    <Badge variant={config.variant} dot>
      {config.label}
    </Badge>
  )
}

export function ModeBadge({ mode }) {
  const modeConfig = {
    SESSION: { variant: 'session', label: 'Session' },
    BEACON: { variant: 'beacon', label: 'Beacon' },
  }
  
  const config = modeConfig[mode] || modeConfig.SESSION
  
  return (
    <Badge variant={config.variant} size="xs">
      {mode === 'BEACON' ? 'B' : 'S'}
    </Badge>
  )
}

export default Badge
