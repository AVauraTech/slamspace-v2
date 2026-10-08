'use client'
import React, { useState } from 'react'

export interface RadarTraits {
  humor: number
  nostalgia: number
  chaos: number
  loyalty: number
  vibe: number
}

interface RadarChartProps {
  friendName: string
  traits?: RadarTraits
  score?: number
  onClose?: () => void
}

const DEFAULT_TRAITS: RadarTraits = {
  humor: 85,
  nostalgia: 92,
  chaos: 78,
  loyalty: 95,
  vibe: 90,
}

export default function RadarChart({
  friendName,
  traits = DEFAULT_TRAITS,
  score = 88,
  onClose,
}: RadarChartProps) {
  const axes = [
    { key: 'humor', label: 'Humor & Laughs 😂', val: traits.humor },
    { key: 'nostalgia', label: 'Nostalgia Vibe 📻', val: traits.nostalgia },
    { key: 'chaos', label: 'Playful Chaos ⚡', val: traits.chaos },
    { key: 'loyalty', label: 'Loyalty & Trust 🛡️', val: traits.loyalty },
    { key: 'vibe', label: 'Aesthetic Sync ✨', val: traits.vibe },
  ]

  const size = 300
  const center = size / 2
  const radius = 105
  const totalAxes = axes.length
  const angleStep = (Math.PI * 2) / totalAxes

  // Helper to convert polar to cartesian
  const getCoordinates = (value: number, index: number) => {
    const angle = index * angleStep - Math.PI / 2
    const r = (value / 100) * radius
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    }
  }

  // Polygon points string for data
  const points = axes
    .map((axis, i) => {
      const { x, y } = getCoordinates(axis.val, i)
      return `${x},${y}`
    })
    .join(' ')

  // Concentric background rings (20%, 40%, 60%, 80%, 100%)
  const rings = [0.2, 0.4, 0.6, 0.8, 1.0]

  return (
    <div className="bg-amber-50/95 border-2 border-amber-300 rounded-3xl p-6 shadow-2xl max-w-sm mx-auto text-center relative backdrop-blur-md">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-amber-500 hover:text-amber-800 text-lg w-8 h-8 rounded-full hover:bg-amber-100 flex items-center justify-center transition"
          aria-label="Close"
        >
          ✕
        </button>
      )}

      <div className="mb-2">
        <span className="text-3xl">🕸️</span>
        <h3 className="font-indie text-2xl font-bold text-amber-900 mt-1">
          Friendship Radar
        </h3>
        <p className="font-indie text-xs text-amber-700">
          Compatibility Analysis for <span className="font-bold underline decoration-amber-400">{friendName}</span>
        </p>
      </div>

      <div className="relative my-2 flex justify-center">
        <svg width={size} height={size} className="overflow-visible">
          <defs>
            <linearGradient id="radarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.65" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Concentric spiderweb rings */}
          {rings.map((ringScale, rIdx) => {
            const ringPoints = axes
              .map((_, i) => {
                const angle = i * angleStep - Math.PI / 2
                const r = ringScale * radius
                return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`
              })
              .join(' ')
            return (
              <polygon
                key={rIdx}
                points={ringPoints}
                fill="none"
                stroke="#e5cc79"
                strokeWidth={rIdx === rings.length - 1 ? 1.5 : 1}
                strokeDasharray={rIdx === rings.length - 1 ? 'none' : '3 3'}
                opacity={0.6}
              />
            )
          })}

          {/* Axis lines radiating from center */}
          {axes.map((_, i) => {
            const angle = i * angleStep - Math.PI / 2
            const endX = center + radius * Math.cos(angle)
            const endY = center + radius * Math.sin(angle)
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={endX}
                y2={endY}
                stroke="#d4a017"
                strokeWidth="1"
                opacity="0.4"
              />
            )
          })}

          {/* Filled radar data shape */}
          <polygon
            points={points}
            fill="url(#radarGrad)"
            stroke="#d97706"
            strokeWidth="2.5"
            filter="url(#glow)"
            className="transition-all duration-700 ease-out"
          />

          {/* Data point dots */}
          {axes.map((axis, i) => {
            const { x, y } = getCoordinates(axis.val, i)
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="4.5"
                fill="#b45309"
                stroke="#fff"
                strokeWidth="1.5"
                className="transition-all duration-700 ease-out"
              />
            )
          })}

          {/* Labels */}
          {axes.map((axis, i) => {
            const angle = i * angleStep - Math.PI / 2
            const labelRadius = radius + 24
            const x = center + labelRadius * Math.cos(angle)
            const y = center + labelRadius * Math.sin(angle)
            return (
              <text
                key={i}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="10"
                fontFamily="'Indie Flower', cursive"
                fill="#78350f"
                fontWeight="bold"
              >
                {axis.label}
              </text>
            )
          })}
        </svg>
      </div>

      {/* Overall score and affinity verdict */}
      <div className="mt-4 bg-amber-100/80 border border-amber-300 rounded-2xl p-3">
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl">💫</span>
          <span className="font-indie text-amber-900 text-lg font-bold">
            Affinity Score: {score}%
          </span>
        </div>
        <p className="font-indie text-xs text-amber-700 mt-1 italic">
          {score >= 90
            ? '🔥 Unbreakable Soul Connection — 2000s Bestie Status!'
            : score >= 80
            ? '✨ Stellar Companionship — Pure Nostalgic Chemistry!'
            : '🌟 Solid Friendship with room for more chaotic memories!'}
        </p>
      </div>
    </div>
  )
}
