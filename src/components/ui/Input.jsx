import { forwardRef } from 'react'
import { cn } from '../../utils/cn'

export const Input = forwardRef(function Input(
  {
    type = 'text',
    label,
    error,
    icon: Icon,
    iconRight: IconRight,
    className,
    containerClassName,
    ...props
  },
  ref
) {
  return (
    <div className={cn('space-y-1', containerClassName)}>
      {label && (
        <label className="block text-sm font-medium text-sentinel-text">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sentinel-text pointer-events-none" />
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            'w-full bg-void-700 border border-sentinel-border rounded px-3 py-2',
            'text-white placeholder-sentinel-muted font-mono text-sm',
            'focus:outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink/50',
            'transition-all duration-150',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            Icon && 'pl-10',
            IconRight && 'pr-10',
            error && 'border-neon-red focus:border-neon-red focus:ring-neon-red/50',
            className
          )}
          {...props}
        />
        {IconRight && (
          <IconRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sentinel-text" />
        )}
      </div>
      {error && (
        <p className="text-xs text-neon-red">{error}</p>
      )}
    </div>
  )
})

export default Input
