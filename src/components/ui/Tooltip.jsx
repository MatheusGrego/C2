import { useState, useRef, useEffect } from 'react'
import { cn } from '../../utils/cn'

const positions = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
}

const arrows = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-void-700 border-x-transparent border-b-transparent',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-void-700 border-x-transparent border-t-transparent',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-void-700 border-y-transparent border-r-transparent',
  right: 'right-full top-1/2 -translate-y-1/2 border-r-void-700 border-y-transparent border-l-transparent',
}

export function Tooltip({
  children,
  content,
  position = 'top',
  delay = 200,
  className,
}) {
  const [isVisible, setIsVisible] = useState(false)
  const timeoutRef = useRef(null)

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsVisible(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  if (!content) return children

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div
          className={cn(
            'absolute z-50 px-2 py-1 text-xs font-mono rounded whitespace-nowrap',
            'bg-void-700 border border-sentinel-border text-white shadow-lg',
            'animate-fade-in',
            positions[position],
            className
          )}
        >
          {content}
          <span
            className={cn(
              'absolute w-0 h-0 border-4',
              arrows[position]
            )}
          />
        </div>
      )}
    </div>
  )
}

export default Tooltip
