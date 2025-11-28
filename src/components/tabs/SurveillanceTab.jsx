import { useState, useEffect } from 'react'
import { Camera, RefreshCw, Trash2, Download, ZoomIn, Loader2, AlertTriangle } from 'lucide-react'
import { cn } from '../../utils/cn'
import { screenshotService } from '../../services/api'
import { commands } from '../../services/commands'
import { formatDateTime, formatBytes } from '../../utils/formatters'
import { toast } from 'sonner'
import ConfirmModal from '../modals/ConfirmModal'

function SurveillanceTab({ agent }) {
  const [screenshots, setScreenshots] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isTaking, setIsTaking] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null, id: null })

  // Fetch screenshots on mount
  useEffect(() => {
    fetchScreenshots()
  }, [agent.hwid])

  const fetchScreenshots = async () => {
    setIsLoading(true)
    try {
      const response = await screenshotService.getAll(agent.hwid, 0, 20)
      setScreenshots(response.content || [])
    } catch (error) {
      console.error('Failed to fetch screenshots:', error)
      toast.error('Failed to load screenshots')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTakeScreenshot = () => {
    setIsTaking(true)
    commands.screenshot(agent.hwid)
    toast.info('Screenshot requested...')
    
    // Auto refresh after delay
    setTimeout(() => {
      fetchScreenshots()
      setIsTaking(false)
    }, 3000)
  }

  const handleDelete = async (id) => {
    setConfirmModal({ isOpen: true, action: 'delete', id })
  }

  const handleClearAll = async () => {
    setConfirmModal({ isOpen: true, action: 'clearAll', id: null })
  }

  const confirmAction = async () => {
    if (confirmModal.action === 'delete') {
      try {
        await screenshotService.delete(confirmModal.id)
        setScreenshots((prev) => prev.filter((s) => s.id !== confirmModal.id))
        toast.success('Screenshot deleted')
      } catch (error) {
        toast.error('Failed to delete screenshot')
      }
    } else if (confirmModal.action === 'clearAll') {
      try {
        await Promise.all(screenshots.map((s) => screenshotService.delete(s.id)))
        setScreenshots([])
        toast.success('All screenshots deleted')
      } catch (error) {
        toast.error('Failed to delete screenshots')
      }
    }
  }

  const handleDownload = async (screenshot) => {
    try {
      const blob = await screenshotService.getImage(screenshot.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `screenshot_${agent.hostname}_${screenshot.id}.jpg`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error('Failed to download screenshot')
    }
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-neon-pink" />
          <span className="font-display font-bold text-white">Screenshots</span>
          <span className="text-xs text-sentinel-text">({screenshots.length})</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTakeScreenshot}
            disabled={isTaking || agent.status !== 'ONLINE'}
            className="btn btn-primary"
          >
            {isTaking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
            Take Screenshot
          </button>
          
          <button
            onClick={fetchScreenshots}
            disabled={isLoading}
            className="btn btn-secondary"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </button>

          {screenshots.length > 0 && (
            <button onClick={handleClearAll} className="btn btn-danger">
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Gallery */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-neon-pink animate-spin" />
        </div>
      ) : screenshots.length === 0 ? (
        <div className="card p-12 text-center">
          <Camera className="w-12 h-12 text-sentinel-text mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No screenshots</h3>
          <p className="text-sentinel-text text-sm">
            Click "Take Screenshot" to capture the agent's screen
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {screenshots.map((screenshot) => (
            <ScreenshotCard
              key={screenshot.id}
              screenshot={screenshot}
              onView={() => setSelectedImage(screenshot)}
              onDownload={() => handleDownload(screenshot)}
              onDelete={() => handleDelete(screenshot.id)}
            />
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selectedImage && (
        <Lightbox
          screenshot={selectedImage}
          onClose={() => setSelectedImage(null)}
          onDownload={() => handleDownload(selectedImage)}
          onDelete={() => {
            handleDelete(selectedImage.id)
            setSelectedImage(null)
          }}
        />
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, action: null, id: null })}
        onConfirm={confirmAction}
        title={confirmModal.action === 'clearAll' ? 'Delete All Screenshots' : 'Delete Screenshot'}
        message={
          confirmModal.action === 'clearAll'
            ? `Are you sure you want to delete all ${screenshots.length} screenshots? This action cannot be undone.`
            : 'Are you sure you want to delete this screenshot? This action cannot be undone.'
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        icon={AlertTriangle}
      />
    </div>
  )
}

function ScreenshotCard({ screenshot, onView, onDownload, onDelete }) {
  const [imageUrl, setImageUrl] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let objectUrl = null

    const loadImage = async () => {
      try {
        const blob = await screenshotService.getImage(screenshot.id)
        objectUrl = URL.createObjectURL(blob)
        setImageUrl(objectUrl)
      } catch (error) {
        console.error('Failed to load screenshot:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadImage()

    // Cleanup blob URL on unmount
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [screenshot.id])

  return (
    <div className="card p-0 overflow-hidden group cursor-pointer" onClick={onView}>
      {/* Image */}
      <div className="relative aspect-video bg-void-900">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-neon-pink animate-spin" />
          </div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt="Screenshot"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sentinel-text">
            Failed to load
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button className="p-2 bg-void-700 rounded-lg hover:bg-void-600 transition-colors">
            <ZoomIn className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDownload()
            }}
            className="p-2 bg-void-700 rounded-lg hover:bg-void-600 transition-colors"
          >
            <Download className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-2 bg-neon-red/20 rounded-lg hover:bg-neon-red/40 transition-colors"
          >
            <Trash2 className="w-5 h-5 text-neon-red" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-xs font-mono text-sentinel-text">
          {formatDateTime(screenshot.capturedAt)}
        </p>
        {screenshot.size && (
          <p className="text-[10px] font-mono text-sentinel-text/70">
            {formatBytes(screenshot.size)}
          </p>
        )}
      </div>
    </div>
  )
}

function Lightbox({ screenshot, onClose, onDownload, onDelete }) {
  const [imageUrl, setImageUrl] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let objectUrl = null

    const loadImage = async () => {
      try {
        const blob = await screenshotService.getImage(screenshot.id)
        objectUrl = URL.createObjectURL(blob)
        setImageUrl(objectUrl)
      } catch (error) {
        console.error('Failed to load screenshot:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadImage()

    // Cleanup blob URL on unmount
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [screenshot.id])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {isLoading ? (
          <div className="flex items-center justify-center p-20">
            <Loader2 className="w-12 h-12 text-neon-pink animate-spin" />
          </div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt="Screenshot"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
        ) : (
          <div className="text-white p-20">Failed to load screenshot</div>
        )}
        
        {/* Controls */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            onClick={onDownload}
            className="p-2 bg-void-800/80 rounded-lg hover:bg-void-700 transition-colors"
          >
            <Download className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 bg-neon-red/20 rounded-lg hover:bg-neon-red/40 transition-colors"
          >
            <Trash2 className="w-5 h-5 text-neon-red" />
          </button>
          <button
            onClick={onClose}
            className="p-2 bg-void-800/80 rounded-lg hover:bg-void-700 transition-colors"
          >
            <span className="text-white text-xl leading-none">&times;</span>
          </button>
        </div>

        {/* Info */}
        <div className="absolute bottom-4 left-4 bg-void-800/80 px-3 py-2 rounded-lg">
          <p className="text-xs font-mono text-white">
            {formatDateTime(screenshot.capturedAt)}
          </p>
        </div>
      </div>
    </div>
  )
}

export default SurveillanceTab
