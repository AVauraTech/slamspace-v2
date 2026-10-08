'use client'
import { useState, useRef, useCallback } from 'react'

const STICKERS = [
  { id: 'heart', emoji: '❤️', label: 'Heart' },
  { id: 'star', emoji: '⭐', label: 'Star' },
  { id: 'sparkle', emoji: '✨', label: 'Sparkle' },
  { id: 'fire', emoji: '🔥', label: 'Fire' },
  { id: 'rainbow', emoji: '🌈', label: 'Rainbow' },
  { id: 'flower', emoji: '🌸', label: 'Flower' },
  { id: 'gem', emoji: '💎', label: 'Gem' },
  { id: 'music', emoji: '🎵', label: 'Music' },
  { id: 'crown', emoji: '👑', label: 'Crown' },
  { id: 'lightning', emoji: '⚡', label: 'Lightning' },
  { id: 'butterfly', emoji: '🦋', label: 'Butterfly' },
  { id: 'camera', emoji: '📸', label: 'Camera' },
  { id: 'tape', emoji: '📼', label: 'VHS' },
  { id: 'disco', emoji: '🪩', label: 'Disco' },
  { id: 'polaroid', emoji: '🖼️', label: 'Polaroid' },
  { id: 'glitter', emoji: '🌟', label: 'Glitter' },
]

interface PlacedSticker {
  id: string
  stickerId: string
  x: number
  y: number
  rotation: number
  scale: number
}

interface StickerBoardProps {
  className?: string
}

export default function StickerBoard({ className = '' }: StickerBoardProps) {
  const [open, setOpen] = useState(false)
  const [placed, setPlaced] = useState<PlacedSticker[]>([])
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const boardRef = useRef<HTMLDivElement>(null)

  const placeSticker = (stickerId: string) => {
    if (!boardRef.current) return
    const rect = boardRef.current.getBoundingClientRect()
    setPlaced(prev => [
      ...prev,
      {
        id: `${stickerId}-${Date.now()}`,
        stickerId,
        x: Math.random() * (rect.width - 60) + 20,
        y: Math.random() * (rect.height - 60) + 20,
        rotation: (Math.random() - 0.5) * 30,
        scale: 0.8 + Math.random() * 0.6,
      }
    ])
  }

  const removeSticker = (id: string) => {
    setPlaced(prev => prev.filter(s => s.id !== id))
  }

  const handleMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    if (!boardRef.current) return
    const rect = boardRef.current.getBoundingClientRect()
    const sticker = placed.find(s => s.id === id)
    if (!sticker) return
    setDragging(id)
    setDragOffset({
      x: e.clientX - rect.left - sticker.x,
      y: e.clientY - rect.top - sticker.y,
    })
    e.preventDefault()
  }, [placed])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !boardRef.current) return
    const rect = boardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - dragOffset.x
    const y = e.clientY - rect.top - dragOffset.y
    setPlaced(prev => prev.map(s =>
      s.id === dragging
        ? { ...s, x: Math.max(0, Math.min(rect.width - 60, x)), y: Math.max(0, Math.min(rect.height - 60, y)) }
        : s
    ))
  }, [dragging, dragOffset])

  const handleMouseUp = useCallback(() => {
    setDragging(null)
  }, [])

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-40 btn-glow
          bg-gradient-to-br from-pink-400 to-purple-500 text-white shadow-xl
          rounded-2xl px-4 py-3 font-indie text-sm flex items-center gap-2
          hover:scale-105 active:scale-95 transition"
      >
        <span className="text-lg">🎨</span>
        Sticker Board
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
          <div className="glass-card w-[95vw] max-w-2xl h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/20 shrink-0">
              <div>
                <h3 className="font-indie text-amber-800 text-xl font-bold">🎨 Sticker Decorator</h3>
                <p className="text-xs text-amber-500 font-grotesk">Drag stickers around your board</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPlaced([])}
                  className="text-xs bg-red-100 hover:bg-red-200 text-red-600 border border-red-200 rounded-full px-3 py-1 font-grotesk font-medium transition"
                >
                  🗑️ Clear
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full hover:bg-black/10 transition flex items-center justify-center text-xl"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Sticker palette */}
            <div className="px-4 py-2 border-b border-white/20 shrink-0">
              <p className="text-xs text-amber-600 font-grotesk font-medium mb-2">Tap to place stickers:</p>
              <div className="flex flex-wrap gap-2">
                {STICKERS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => placeSticker(s.id)}
                    title={s.label}
                    className="text-2xl w-10 h-10 flex items-center justify-center rounded-xl
                      bg-white/60 hover:bg-white/90 border border-amber-200/50 hover:scale-125
                      transition-all shadow-sm hover:shadow-md active:scale-110"
                  >
                    {s.emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* The board itself */}
            <div
              ref={boardRef}
              className="flex-1 relative overflow-hidden bg-amber-50/40 cursor-crosshair"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Board grid lines for visual */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
                <defs>
                  <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(212,160,23,0.08)" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>

              {placed.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-4xl mb-2 opacity-20">🖼️</p>
                    <p className="font-indie text-amber-300 text-sm">Add stickers from the palette above</p>
                  </div>
                </div>
              )}

              {placed.map(s => {
                const stickerDef = STICKERS.find(st => st.id === s.stickerId)
                return (
                  <div
                    key={s.id}
                    className={`draggable-sticker select-none ${dragging === s.id ? 'z-50' : 'z-10'}`}
                    style={{
                      left: s.x,
                      top: s.y,
                      transform: `rotate(${s.rotation}deg) scale(${s.scale})`,
                      fontSize: '2.2rem',
                      lineHeight: 1,
                      cursor: dragging === s.id ? 'grabbing' : 'grab',
                    }}
                    onMouseDown={e => handleMouseDown(e, s.id)}
                    onDoubleClick={() => removeSticker(s.id)}
                    title="Drag to move • Double-click to remove"
                  >
                    {stickerDef?.emoji}
                  </div>
                )
              })}
            </div>

            <div className="px-4 py-2 text-center border-t border-white/20 shrink-0">
              <p className="text-xs text-amber-400 font-grotesk">Double-click any sticker to remove it</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
