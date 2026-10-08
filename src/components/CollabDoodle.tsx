'use client'
import React, { useRef, useState, useEffect } from 'react'
import { sound } from '@/lib/sound'

interface CollabDoodleProps {
  onClose: () => void
  onSaveToEntry?: (dataUrl: string) => void
}

const COLORS = [
  { name: 'Gel Pen Gold', hex: '#d4a017' },
  { name: 'Ink Blue', hex: '#1e3a8a' },
  { name: 'Cherry Red', hex: '#dc2626' },
  { name: 'Bubblegum Pink', hex: '#ec4899' },
  { name: 'Neon Green', hex: '#16a34a' },
  { name: 'Retro Violet', hex: '#7c3aed' },
  { name: 'Pencil Charcoal', hex: '#374151' },
]

const STAMP_STICKERS = ['⭐', '💖', '✨', '🦋', '🌸', '👑', '🌈', '🔥']

export default function CollabDoodle({ onClose, onSaveToEntry }: CollabDoodleProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedColor, setSelectedColor] = useState('#d4a017')
  const [brushSize, setBrushSize] = useState(3)
  const [isDrawing, setIsDrawing] = useState(false)
  const [selectedStamp, setSelectedStamp] = useState<string | null>(null)
  const [history, setHistory] = useState<ImageData[]>([])
  const lastPosRef = useRef<{ x: number; y: number } | null>(null)

  // Initialize canvas with paper texture background
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set high DPI scale
    canvas.width = 600
    canvas.height = 400

    ctx.fillStyle = '#fffdf5'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Save initial state to history
    setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)])
  }, [])

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    if ('touches' in e && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    } else if ('clientX' in e) {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      }
    }
    return { x: 0, y: 0 }
  }

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x, y } = getCanvasCoords(e)

    // Stamp mode
    if (selectedStamp) {
      ctx.font = '28px serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(selectedStamp, x, y)
      sound.playStickerPop()
      saveState()
      return
    }

    // Normal drawing
    setIsDrawing(true)
    lastPosRef.current = { x, y }
    sound.playPenScratch()
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || selectedStamp) return
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx || !lastPosRef.current) return

    const { x, y } = getCanvasCoords(e)

    ctx.strokeStyle = selectedColor
    ctx.lineWidth = brushSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    ctx.beginPath()
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y)
    ctx.lineTo(x, y)
    ctx.stroke()

    lastPosRef.current = { x, y }
  }

  const stopDraw = () => {
    if (isDrawing) {
      setIsDrawing(false)
      lastPosRef.current = null
      saveState()
    }
  }

  const saveState = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
    setHistory(h => [...h.slice(-10), data])
  }

  const undo = () => {
    if (history.length <= 1) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const newHistory = [...history]
    newHistory.pop()
    const previous = newHistory[newHistory.length - 1]
    ctx.putImageData(previous, 0, 0)
    setHistory(newHistory)
    sound.playClick()
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#fffdf5'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    saveState()
    sound.playPageFlip()
  }

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    sound.playChime()
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `SlamSpace-Doodle-${Date.now()}.png`
    a.click()
    if (onSaveToEntry) {
      onSaveToEntry(url)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 shadow-2xl max-w-2xl w-full relative">
        <div className="flex items-center justify-between pb-3 border-b border-amber-200">
          <div>
            <h3 className="font-indie text-xl font-bold text-amber-900 flex items-center gap-2">
              <span>✍️</span> Collaborative "Pass The Book" Doodlepad
            </h3>
            <p className="font-indie text-xs text-amber-600">
              Draw retro doodles, sign with gel pens, or stamp stickers together!
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-amber-600 hover:text-amber-900 text-lg w-8 h-8 rounded-full hover:bg-amber-100 flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Toolbar: Color picker, stroke width, stickers */}
        <div className="py-3 flex flex-wrap items-center justify-between gap-2 border-b border-amber-200">
          {/* Colors */}
          <div className="flex items-center gap-1.5">
            {COLORS.map(c => (
              <button
                key={c.hex}
                onClick={() => {
                  setSelectedColor(c.hex)
                  setSelectedStamp(null)
                  sound.playClick()
                }}
                className={`w-6 h-6 rounded-full border-2 transition ${
                  selectedColor === c.hex && !selectedStamp
                    ? 'border-amber-900 scale-125 shadow-md'
                    : 'border-white hover:scale-110'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
          </div>

          {/* Stamp stickers */}
          <div className="flex items-center gap-1">
            {STAMP_STICKERS.map(s => (
              <button
                key={s}
                onClick={() => {
                  setSelectedStamp(selectedStamp === s ? null : s)
                  sound.playClick()
                }}
                className={`text-lg w-7 h-7 flex items-center justify-center rounded-lg transition ${
                  selectedStamp === s
                    ? 'bg-amber-200 border border-amber-400 scale-110'
                    : 'hover:bg-amber-100'
                }`}
                title={`Stamp ${s}`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Size slider */}
          <div className="flex items-center gap-1.5 text-xs font-indie text-amber-800">
            <span>Size:</span>
            <input
              type="range"
              min="1"
              max="16"
              value={brushSize}
              onChange={e => setBrushSize(Number(e.target.value))}
              className="w-16 accent-amber-500"
            />
          </div>
        </div>

        {/* Canvas */}
        <div className="my-3 flex justify-center bg-white rounded-2xl border-2 border-dashed border-amber-300 overflow-hidden shadow-inner">
          <canvas
            ref={canvasRef}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
            className="w-full max-w-full h-auto cursor-crosshair touch-none select-none"
            style={{ maxHeight: '340px' }}
          />
        </div>

        {/* Action footer */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-2">
            <button
              onClick={undo}
              disabled={history.length <= 1}
              className="text-xs font-indie px-3 py-1.5 rounded-xl border border-amber-300 bg-white hover:bg-amber-100 disabled:opacity-40 transition"
            >
              ↩️ Undo
            </button>
            <button
              onClick={clearCanvas}
              className="text-xs font-indie px-3 py-1.5 rounded-xl border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition"
            >
              🗑️ Clear
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="text-xs font-indie px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow transition"
            >
              💾 Save Doodle
            </button>
            <button
              onClick={onClose}
              className="text-xs font-indie px-4 py-1.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
