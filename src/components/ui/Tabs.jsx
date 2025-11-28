import { cn } from '../../utils/cn'

export function Tabs({ value, onChange, children, className }) {
  return (
    <div className={cn('w-full', className)}>
      {children}
    </div>
  )
}

export function TabList({ children, className }) {
  return (
    <div
      className={cn(
        'flex border-b border-sentinel-border overflow-x-auto scrollbar-hide',
        className
      )}
    >
      {children}
    </div>
  )
}

export function Tab({
  value,
  selected,
  onClick,
  children,
  icon: Icon,
  disabled = false,
  className,
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onClick?.(value)}
      disabled={disabled}
      className={cn(
        'flex items-center gap-2 px-4 py-3 font-display font-medium whitespace-nowrap',
        'border-b-2 transition-all duration-200',
        'focus:outline-none',
        selected
          ? 'text-white border-neon-pink bg-void-700/50'
          : 'text-sentinel-text border-transparent hover:text-white hover:bg-void-700/30',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  )
}

export function TabPanel({ value, selected, children, className }) {
  if (!selected) return null

  return (
    <div className={cn('animate-fade-in', className)}>
      {children}
    </div>
  )
}

export default Tabs
