import { cn } from '../../utils/cn'

const variants = {
  default: 'bg-neon-pink',
  gradient: 'bg-gradient-to-r from-neon-purple to-neon-pink',
  success: 'bg-neon-green',
  warning: 'bg-neon-orange',
  danger: 'bg-neon-red',
  purple: 'bg-neon-purple',
}

const sizes = {
  xs: 'h-0.5',
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
  xl: 'h-4',
}

export function ProgressBar({
  value = 0,
  max = 100,
  variant = 'default',
  size = 'sm',
  showLabel = false,
  label,
  animated = false,
  className,
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-1">
          {label && <span className="text-xs text-sentinel-text">{label}</span>}
          {showLabel && (
            <span className="text-xs font-mono text-sentinel-text">
              {percentage.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          'w-full bg-void-600 rounded-full overflow-hidden',
          sizes[size]
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            variants[variant],
            animated && 'animate-pulse'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export function CircularProgress({
  value = 0,
  max = 100,
  size = 64,
  strokeWidth = 6,
  variant = 'default',
  showLabel = true,
  className,
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  const colors = {
    default: '#eb055a',
    success: '#00ff88',
    warning: '#ffaa00',
    danger: '#ff4444',
    purple: '#4632f0',
  }

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="#463f6a"
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={colors[variant]}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      {showLabel && (
        <span className="absolute text-xs font-mono text-white">
          {percentage.toFixed(0)}%
        </span>
      )}
    </div>
  )
}

export default ProgressBar
