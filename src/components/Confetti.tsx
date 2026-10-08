'use client'
import { useEffect, useRef } from 'react'

interface ConfettiProps {
  trigger: number
}

export default function Confetti({ trigger }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (trigger === 0) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Rich confetti shapes
    type Piece = {
      x: number; y: number; r: number
      c: string; vY: number; vX: number
      rot: number; rotV: number; shape: string
      alpha: number
    }

    const shapes = ['rect', 'circle', 'triangle', 'star']
    const pieces: Piece[] = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -400,
      r: Math.random() * 8 + 4,
      c: `hsl(${Math.floor(Math.random() * 360)},90%,60%)`,
      vY: Math.random() * 3.5 + 2,
      vX: Math.random() * 3 - 1.5,
      rot: Math.random() * 360,
      rotV: Math.random() * 8 - 4,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      alpha: 0.85 + Math.random() * 0.15
    }))

    const drawStar = (ctx: CanvasRenderingContext2D, r: number) => {
      const spikes = 5
      let rot = (Math.PI / 2) * 3
      const step = Math.PI / spikes
      ctx.beginPath()
      ctx.moveTo(0, -r)
      for (let i = 0; i < spikes; i++) {
        ctx.lineTo(Math.cos(rot) * r, Math.sin(rot) * r)
        rot += step
        ctx.lineTo(Math.cos(rot) * (r * 0.45), Math.sin(rot) * (r * 0.45))
        rot += step
      }
      ctx.lineTo(0, -r)
      ctx.closePath()
    }

    let frame = 0
    let animId: number

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      pieces.forEach(p => {
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rot * Math.PI) / 180)
        ctx.fillStyle = p.c
        ctx.globalAlpha = p.alpha * Math.max(0, 1 - frame / 130)

        if (p.shape === 'circle') {
          ctx.beginPath()
          ctx.arc(0, 0, p.r, 0, Math.PI * 2)
          ctx.fill()
        } else if (p.shape === 'triangle') {
          ctx.beginPath()
          ctx.moveTo(0, -p.r)
          ctx.lineTo(p.r, p.r)
          ctx.lineTo(-p.r, p.r)
          ctx.closePath()
          ctx.fill()
        } else if (p.shape === 'star') {
          drawStar(ctx, p.r)
          ctx.fill()
        } else {
          ctx.fillRect(-p.r / 2, -p.r, p.r, p.r * 2)
        }

        ctx.restore()
        p.y += p.vY + frame * 0.02
        p.x += p.vX
        p.rot += p.rotV
        p.vY += 0.04  // gravity
      })

      frame++
      if (frame < 140) {
        animId = requestAnimationFrame(draw)
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }

    animId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animId)
  }, [trigger])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      aria-hidden="true"
    />
  )
}
