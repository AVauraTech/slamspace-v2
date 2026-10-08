'use client'
import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react'

export interface SignaturePadHandle {
  getDataURL: () => string
  clear: () => void
  isEmpty: () => boolean
}

const SignaturePad = forwardRef<SignaturePadHandle>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 })
  const [empty, setEmpty] = useState(true)

  useImperativeHandle(ref, () => ({
    getDataURL: () => canvasRef.current?.toDataURL() || '',
    clear: () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
      setEmpty(true)
    },
    isEmpty: () => empty
  }))

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    }
    return { x: (e as MouseEvent).offsetX, y: (e as MouseEvent).offsetY }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.strokeStyle = '#c69b28'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    const start = (e: MouseEvent | TouchEvent) => {
      e.preventDefault()
      setDrawing(true)
      setEmpty(false)
      const pos = getPos(e, canvas)
      setLastPos(pos)
    }
    const move = (e: MouseEvent | TouchEvent) => {
      e.preventDefault()
      if (!drawing) return
      const pos = getPos(e, canvas)
      ctx.beginPath()
      ctx.moveTo(lastPos.x, lastPos.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
      setLastPos(pos)
    }
    const end = () => setDrawing(false)

    canvas.addEventListener('mousedown', start)
    canvas.addEventListener('touchstart', start, { passive: false })
    canvas.addEventListener('mousemove', move)
    canvas.addEventListener('touchmove', move, { passive: false })
    canvas.addEventListener('mouseup', end)
    canvas.addEventListener('touchend', end)
    canvas.addEventListener('mouseleave', end)

    return () => {
      canvas.removeEventListener('mousedown', start)
      canvas.removeEventListener('touchstart', start)
      canvas.removeEventListener('mousemove', move)
      canvas.removeEventListener('touchmove', move)
      canvas.removeEventListener('mouseup', end)
      canvas.removeEventListener('touchend', end)
      canvas.removeEventListener('mouseleave', end)
    }
  }, [drawing, lastPos])

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={240}
        height={60}
        className="bg-amber-50 border-2 border-amber-300 rounded-lg cursor-crosshair touch-none"
        aria-label="Draw your signature"
      />
      <button
        type="button"
        onClick={() => {
          const canvas = canvasRef.current
          if (!canvas) return
          canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
          setEmpty(true)
        }}
        className="ml-2 text-xs bg-amber-100 text-amber-700 border border-amber-300 rounded px-3 py-1 hover:bg-amber-200 transition"
      >
        Clear ✏️
      </button>
    </div>
  )
})

SignaturePad.displayName = 'SignaturePad'
export default SignaturePad
