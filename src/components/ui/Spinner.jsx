import { cn } from '../../utils/cn'

const sizes = {
  xs: 'w-3 h-3 border',
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-2',
  xl: 'w-12 h-12 border-3',
}

const colors = {
  default: 'border-neon-pink/30 border-t-neon-pink',
  white: 'border-white/30 border-t-white',
  green: 'border-neon-green/30 border-t-neon-green',
  purple: 'border-neon-purple/30 border-t-neon-purple',
}

export function Spinner({
  size = 'md',
  color = 'default',
  className,
}) {
  return (
    <div
      className={cn(
        'rounded-full animate-spin',
        sizes[size],
        colors[color],
        className
      )}
    />
  )
}

export function LoadingOverlay({
  loading,
  children,
  text = 'Loading...',
  blur = true,
}) {
  return (
    <div className="relative">
      {children}
      {loading && (
        <div
          className={cn(
            'absolute inset-0 flex flex-col items-center justify-center gap-3',
            'bg-void-900/80 z-10',
            blur && 'backdrop-blur-sm'
          )}
        >
          <Spinner size="lg" />
          {text && <span className="text-sm text-sentinel-text">{text}</span>}
        </div>
      )}
    </div>
  )
}

export function SkeletonLoader({ className }) {
  return (
    <div
      className={cn(
        'animate-pulse bg-void-700 rounded',
        className
      )}
    />
  )
}

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Spinner size="xl" />
      <span className="text-sentinel-text">Loading...</span>
    </div>
  )
}

export default Spinner
