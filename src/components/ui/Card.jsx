import { cn } from '../../utils/cn'

export function Card({
  children,
  title,
  icon: Icon,
  action,
  hoverable = false,
  variant = 'default',
  className,
  ...props
}) {
  const variants = {
    default: 'bg-void-800 border-sentinel-border',
    elevated: 'bg-void-700 border-sentinel-border shadow-lg',
    outline: 'bg-transparent border-sentinel-border',
    ghost: 'bg-void-800/50 border-transparent',
  }

  return (
    <div
      className={cn(
        'border rounded-lg transition-all duration-150',
        variants[variant],
        hoverable && 'cursor-pointer hover:border-neon-pink hover:shadow-neon-pink',
        className
      )}
      {...props}
    >
      {(title || action) && (
        <div className="flex items-center justify-between p-4 border-b border-sentinel-border">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="w-5 h-5 text-neon-pink" />}
            {title && (
              <h3 className="font-display font-bold text-white">{title}</h3>
            )}
          </div>
          {action}
        </div>
      )}
      <div className={title ? 'p-4' : 'p-4'}>
        {children}
      </div>
    </div>
  )
}

export function CardHeader({ children, className }) {
  return (
    <div className={cn('p-4 border-b border-sentinel-border', className)}>
      {children}
    </div>
  )
}

export function CardContent({ children, className }) {
  return (
    <div className={cn('p-4', className)}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className }) {
  return (
    <div className={cn('p-4 border-t border-sentinel-border', className)}>
      {children}
    </div>
  )
}

export default Card
