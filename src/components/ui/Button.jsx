import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

const variants = {
  primary: 'bg-neon-pink hover:bg-neon-pink/80 text-white border-neon-pink hover:shadow-neon-pink',
  secondary: 'bg-void-700 hover:bg-void-600 text-white border-sentinel-border hover:border-sentinel-text',
  danger: 'bg-neon-red/20 hover:bg-neon-red/40 text-neon-red border-neon-red hover:shadow-neon-red',
  success: 'bg-neon-green/20 hover:bg-neon-green/40 text-neon-green border-neon-green hover:shadow-neon-green',
  ghost: 'bg-transparent hover:bg-void-700 text-sentinel-text hover:text-white border-transparent',
  outline: 'bg-transparent hover:bg-neon-pink/10 text-neon-pink border-neon-pink hover:shadow-neon-pink',
}

const sizes = {
  xs: 'px-2 py-1 text-xs gap-1',
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
  xl: 'px-8 py-4 text-lg gap-3',
  icon: 'p-2',
  'icon-sm': 'p-1.5',
  'icon-lg': 'p-3',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight: IconRight,
  className,
  ...props
}) {
  const isIconOnly = size.startsWith('icon')
  
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center',
        'font-display font-medium',
        'border rounded transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-neon-pink/50',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className={cn('animate-spin', isIconOnly ? 'w-5 h-5' : 'w-4 h-4')} />
      ) : (
        <>
          {Icon && <Icon className={cn(isIconOnly ? 'w-5 h-5' : 'w-4 h-4')} />}
          {!isIconOnly && children}
          {IconRight && <IconRight className="w-4 h-4" />}
        </>
      )}
    </button>
  )
}

export default Button
