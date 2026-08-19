import { useEffect, useMemo, useRef, useState } from 'react'

const VIEWPORT_WIDTH = 360
const MAX_ZOOM = 3

export default function ImageCropper({ file, aspect, outputWidth, outputHeight, onCancel, onApply }) {
  const viewportHeight = Math.round(VIEWPORT_WIDTH / aspect)
  const imgRef = useRef(null)
  const dragRef = useRef(null)
  const [imgUrl, setImgUrl] = useState(null)
  const [natural, setNatural] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setImgUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  const baseScale = useMemo(() => {
    if (!natural) return 1
    return Math.max(VIEWPORT_WIDTH / natural.width, viewportHeight / natural.height)
  }, [natural, viewportHeight])

  const scale = baseScale * zoom
  const displayW = natural ? natural.width * scale : 0
  const displayH = natural ? natural.height * scale : 0

  function clampPan(x, y, dW, dH) {
    const minX = Math.min(0, VIEWPORT_WIDTH - dW)
    const minY = Math.min(0, viewportHeight - dH)
    return {
      x: Math.min(0, Math.max(minX, x)),
      y: Math.min(0, Math.max(minY, y)),
    }
  }

  function handleImgLoad(e) {
    const { naturalWidth, naturalHeight } = e.target
    setNatural({ width: naturalWidth, height: naturalHeight })
    const s = Math.max(VIEWPORT_WIDTH / naturalWidth, viewportHeight / naturalHeight)
    const dW = naturalWidth * s
    const dH = naturalHeight * s
    setZoom(1)
    setPan({ x: (VIEWPORT_WIDTH - dW) / 2, y: (viewportHeight - dH) / 2 })
  }

  function handlePointerDown(e) {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y }
  }

  function handlePointerMove(e) {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    setPan(clampPan(dragRef.current.panX + dx, dragRef.current.panY + dy, displayW, displayH))
  }

  function handlePointerUp() {
    dragRef.current = null
  }

  function handleZoomChange(e) {
    const nextZoom = Number(e.target.value)
    const nextScale = baseScale * nextZoom
    const cx = VIEWPORT_WIDTH / 2
    const cy = viewportHeight / 2
    const ratio = nextScale / scale
    const nextX = cx - (cx - pan.x) * ratio
    const nextY = cy - (cy - pan.y) * ratio
    setZoom(nextZoom)
    setPan(clampPan(nextX, nextY, natural.width * nextScale, natural.height * nextScale))
  }

  function handleApply() {
    const canvas = document.createElement('canvas')
    canvas.width = outputWidth
    canvas.height = outputHeight
    const ctx = canvas.getContext('2d')
    const sourceX = -pan.x / scale
    const sourceY = -pan.y / scale
    const sourceW = VIEWPORT_WIDTH / scale
    const sourceH = viewportHeight / scale
    ctx.drawImage(imgRef.current, sourceX, sourceY, sourceW, sourceH, 0, 0, outputWidth, outputHeight)
    const outType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
    canvas.toBlob((blob) => {
      if (blob) onApply(blob, outType)
    }, outType, 0.9)
  }

  return (
    <div className="adm-crop-overlay" role="dialog" aria-modal="true" aria-label="Crop image">
      <div className="adm-crop-card">
        <h3>Crop Image</h3>
        <p className="adm-muted">Drag to reposition, use the slider to zoom. This is exactly how the image will appear on the site.</p>
        <div
          className="adm-crop-viewport"
          style={{ width: VIEWPORT_WIDTH, height: viewportHeight }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {imgUrl && (
            <img
              ref={imgRef}
              src={imgUrl}
              alt=""
              draggable={false}
              onLoad={handleImgLoad}
              style={{ width: displayW, height: displayH, transform: `translate(${pan.x}px, ${pan.y}px)` }}
            />
          )}
        </div>
        <input
          type="range"
          min="1"
          max={MAX_ZOOM}
          step="0.01"
          value={zoom}
          onChange={handleZoomChange}
          className="adm-crop-zoom"
          aria-label="Zoom"
          disabled={!natural}
        />
        <div className="adm-actions">
          <button type="button" className="adm-btn" onClick={onCancel}>Cancel</button>
          <button type="button" className="adm-btn adm-btn-primary" onClick={handleApply} disabled={!natural}>
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  )
}
