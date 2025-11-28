import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'
import { Button } from './Button'

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-[90vw]',
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closable = true,
  footer,
  className,
}) {
  const overlayRef = useRef(null)

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && closable) {
        onClose()
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose, closable])

  // Close on overlay click
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current && closable) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        className={cn(
          'bg-void-800 border border-sentinel-border rounded-lg shadow-2xl w-full',
          'animate-slide-up',
          sizes[size],
          className
        )}
      >
        {/* Header */}
        {(title || closable) && (
          <div className="flex items-center justify-between p-4 border-b border-sentinel-border">
            <div>
              {title && (
                <h2 className="text-lg font-display font-bold text-white">{title}</h2>
              )}
              {description && (
                <p className="text-sm text-sentinel-text mt-1">{description}</p>
              )}
            </div>
            {closable && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                className="text-sentinel-text hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 p-4 border-t border-sentinel-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  loading = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sentinel-text">{message}</p>
    </Modal>
  )
}

export default Modal
