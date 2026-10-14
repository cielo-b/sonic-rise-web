'use client'

import { useRef, useState, useEffect } from 'react'
import { RotateCcw, Check, PenTool, Type } from 'lucide-react'
import { Button } from './ui'

interface SignaturePadProps {
  onSign: (dataUrl: string) => void
  onCancel?: () => void
  signerName?: string
}

export function SignaturePad({ onSign, onCancel, signerName = '' }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [mode, setMode] = useState<'draw' | 'type'>('draw')
  const [typedName, setTypedName] = useState(signerName)

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [mode])

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      const touch = e.touches[0]
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const { x, y } = getCoordinates(e)
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      ctx.moveTo(x, y)
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const { x, y } = getCoordinates(e)
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) {
      ctx.lineTo(x, y)
      ctx.stroke()
      setHasDrawn(true)
    }
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
  }

  const handleConfirm = () => {
    if (mode === 'draw') {
      const canvas = canvasRef.current
      if (!canvas || !hasDrawn) return
      onSign(canvas.toDataURL('image/png'))
    } else {
      if (!typedName.trim()) return
      // Render cursive typed signature to canvas to generate data URL
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = 400
      tempCanvas.height = 120
      const ctx = tempCanvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#090d16'
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
        ctx.fillStyle = '#22d3ee'
        ctx.font = 'italic 36px "Brush Script MT", "Caveat", "Segoe Script", cursive'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(typedName.trim(), 200, 60)
        onSign(tempCanvas.toDataURL('image/png'))
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Mode Switcher */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <span className="text-xs text-text-muted">Digital E-Signature</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('draw')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
              mode === 'draw' ? 'bg-brand-cyan/20 text-brand-cyan font-semibold' : 'text-text-muted hover:text-white'
            }`}
          >
            <PenTool size={13} /> Draw Signature
          </button>
          <button
            type="button"
            onClick={() => setMode('type')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
              mode === 'type' ? 'bg-brand-cyan/20 text-brand-cyan font-semibold' : 'text-text-muted hover:text-white'
            }`}
          >
            <Type size={13} /> Type Signature
          </button>
        </div>
      </div>

      {mode === 'draw' ? (
        <div className="space-y-2">
          <div className="relative border border-white/20 rounded-xl bg-black/60 overflow-hidden touch-none">
            <canvas
              ref={canvasRef}
              className="w-full h-36 cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {!hasDrawn && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs text-text-muted/60 select-none">
                Sign with finger or mouse here
              </div>
            )}
            <div className="absolute bottom-2 left-4 right-4 border-b border-white/10 pointer-events-none" />
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-text-muted">Sign above the line</span>
            <button
              type="button"
              onClick={clearCanvas}
              className="flex items-center gap-1 text-text-muted hover:text-white transition-colors"
            >
              <RotateCcw size={12} /> Clear
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Type your legal full name"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            className="input-studio text-sm w-full"
          />
          {typedName && (
            <div className="p-4 rounded-xl border border-white/10 bg-black/60 text-center font-serif italic text-2xl text-brand-cyan select-none">
              {typedName}
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
        {onCancel && (
          <Button variant="glass" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          size="sm"
          disabled={mode === 'draw' ? !hasDrawn : !typedName.trim()}
          onClick={handleConfirm}
        >
          <Check size={14} className="mr-1" /> Confirm & Apply Signature
        </Button>
      </div>
    </div>
  )
}
