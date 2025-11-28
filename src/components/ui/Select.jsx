import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '../../utils/cn'

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  label,
  error,
  disabled = false,
  className,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = useRef(null)

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (selectRef.current && !selectRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  const selectedOption = options.find((opt) => opt.value === value)

  return (
    <div className={cn('space-y-1', className)} ref={selectRef}>
      {label && (
        <label className="block text-sm font-medium text-sentinel-text">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'w-full flex items-center justify-between gap-2',
            'bg-void-700 border border-sentinel-border rounded px-3 py-2',
            'text-left font-mono text-sm',
            'focus:outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink/50',
            'transition-all duration-150',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            isOpen && 'border-neon-pink ring-1 ring-neon-pink/50',
            error && 'border-neon-red focus:border-neon-red focus:ring-neon-red/50'
          )}
        >
          <span className={selectedOption ? 'text-white' : 'text-sentinel-muted'}>
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-sentinel-text transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-void-700 border border-sentinel-border rounded shadow-lg animate-fade-in">
            <div className="py-1 max-h-60 overflow-auto">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2',
                    'text-left text-sm font-mono transition-colors',
                    option.value === value
                      ? 'bg-neon-pink/20 text-neon-pink'
                      : 'text-white hover:bg-void-600'
                  )}
                >
                  <span>{option.label}</span>
                  {option.value === value && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-neon-red">{error}</p>}
    </div>
  )
}

export default Select
