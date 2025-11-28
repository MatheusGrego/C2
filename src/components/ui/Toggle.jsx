import { cn } from '../../utils/cn'

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  className,
}) {
  const sizes = {
    sm: { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: 'translate-x-4' },
    md: { track: 'w-11 h-6', thumb: 'w-4 h-4', translate: 'translate-x-6' },
    lg: { track: 'w-14 h-7', thumb: 'w-5 h-5', translate: 'translate-x-8' },
  }

  const { track, thumb, translate } = sizes[size]

  return (
    <label
      className={cn(
        'flex items-center justify-between gap-3 cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {(label || description) && (
        <div className="flex-1">
          {label && <span className="font-medium text-white">{label}</span>}
          {description && (
            <p className="text-sm text-sentinel-text">{description}</p>
          )}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative rounded-full transition-colors duration-200',
          track,
          checked ? 'bg-neon-pink' : 'bg-void-600'
        )}
      >
        <span
          className={cn(
            'absolute top-1 left-1 bg-white rounded-full transition-transform duration-200',
            thumb,
            checked && translate
          )}
        />
      </button>
    </label>
  )
}

export default Toggle
