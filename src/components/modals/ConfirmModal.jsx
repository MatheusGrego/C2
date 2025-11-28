import { X, AlertTriangle } from 'lucide-react'
import { cn } from '../../utils/cn'

/**
 * Confirm Modal Component
 * Customizable confirmation dialog
 */
function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'info'
  icon: Icon = AlertTriangle
}) {
  if (!isOpen) return null

  const variantStyles = {
    danger: {
      icon: 'text-neon-red',
      button: 'bg-neon-red hover:bg-neon-red/80',
      border: 'border-neon-red/50',
    },
    warning: {
      icon: 'text-neon-orange',
      button: 'bg-neon-orange hover:bg-neon-orange/80',
      border: 'border-neon-orange/50',
    },
    info: {
      icon: 'text-neon-purple',
      button: 'bg-neon-purple hover:bg-neon-purple/80',
      border: 'border-neon-purple/50',
    },
  }

  const styles = variantStyles[variant]

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className={cn(
          'relative bg-void-800 border rounded-lg shadow-2xl max-w-md w-full mx-4 animate-scale-in',
          styles.border
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-sentinel-border">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg bg-void-700', styles.icon)}>
              <Icon className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-display font-bold text-white">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-void-700 text-sentinel-text hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sentinel-text leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-sentinel-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border border-sentinel-border text-white hover:bg-void-700 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={cn(
              'px-4 py-2 rounded text-white font-medium transition-colors',
              styles.button
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
