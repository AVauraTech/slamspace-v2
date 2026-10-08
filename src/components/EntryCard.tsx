'use client'
import { useState } from 'react'
import type { Entry } from '@/lib/supabase'

const THEMES: Record<string, { bg: string; border: string; text: string; accent: string; badge: string }> = {
  nostalgia: {
    bg: 'bg-amber-50/80',
    border: 'border-amber-300',
    text: 'text-amber-900',
    accent: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700',
  },
  bollywood: {
    bg: 'bg-pink-50/80',
    border: 'border-pink-300',
    text: 'text-pink-900',
    accent: 'text-pink-600',
    badge: 'bg-pink-100 text-pink-700',
  },
  kpop: {
    bg: 'bg-purple-50/80',
    border: 'border-purple-300',
    text: 'text-purple-900',
    accent: 'text-purple-600',
    badge: 'bg-purple-100 text-purple-700',
  },
}

interface CompatibilityBarProps {
  score: number
  label: string
}

function CompatibilityBar({ score, label }: CompatibilityBarProps) {
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444'
  return (
    <div className="mb-1">
      <div className="flex justify-between text-xs mb-0.5 font-grotesk">
        <span className="text-gray-500">{label}</span>
        <span style={{ color }} className="font-bold">{score}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${score}%`,
            background: `linear-gradient(90deg, ${color}99, ${color})`,
          }}
        />
      </div>
    </div>
  )
}

interface FriendshipRadarProps {
  score: number
  theme: string
}

function FriendshipRadar({ score, theme }: FriendshipRadarProps) {
  const color = theme === 'kpop' ? '#7c3aed' : theme === 'bollywood' ? '#e91e8c' : '#d4a017'
  // 6-axis radar labels
  const labels = ['Vibe', 'Loyalty', 'Humor', 'Care', 'Drama', 'Nostalgia']
  const n = labels.length
  const r = 42
  const cx = 60; const cy = 60

  // Randomize but seed by score so it's stable per entry
  const values = labels.map((_, i) => {
    const base = score / 100
    const jitter = Math.sin(score * 0.37 + i * 1.9) * 0.18
    return Math.max(0.25, Math.min(1, base + jitter))
  })

  const toXY = (val: number, i: number) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2
    return { x: cx + val * r * Math.cos(angle), y: cy + val * r * Math.sin(angle) }
  }

  const labelXY = (i: number) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2
    return { x: cx + (r + 14) * Math.cos(angle), y: cy + (r + 14) * Math.sin(angle) }
  }

  const pts = values.map((v, i) => toXY(v, i))
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'

  return (
    <div className="flex flex-col items-center">
      <svg width="120" height="120" viewBox="0 0 120 120" aria-label="Friendship radar chart">
        {/* Background grid */}
        {[0.25, 0.5, 0.75, 1].map(frac => {
          const ring = Array.from({ length: n }, (_, i) => toXY(frac, i))
          const ringD = ring.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
          return (
            <path key={frac} d={ringD} fill="none" stroke={color} strokeWidth={0.5} opacity={0.25} />
          )
        })}
        {/* Axes */}
        {labels.map((_, i) => {
          const end = toXY(1, i)
          return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke={color} strokeWidth={0.5} opacity={0.3} />
        })}
        {/* Data area */}
        <path d={d} fill={color} fillOpacity={0.18} stroke={color} strokeWidth={2} />
        {/* Data points */}
        {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={color} />)}
        {/* Labels */}
        {labels.map((lbl, i) => {
          const pos = labelXY(i)
          return (
            <text key={i} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle"
              fontSize="6" fill={color} fontFamily="Space Grotesk, sans-serif" fontWeight="500">
              {lbl}
            </text>
          )
        })}
      </svg>
      <p className="text-xs font-grotesk font-semibold mt-1" style={{ color }}>
        Compatibility: {score}%
      </p>
    </div>
  )
}

export default function EntryCard({ entry }: { entry: Entry }) {
  const [showPoem, setShowPoem] = useState(false)
  const [showRadar, setShowRadar] = useState(false)
  const [roast, setRoast] = useState('')
  const [loadingRoast, setLoadingRoast] = useState(false)

  const now = new Date()
  const isLocked = entry.unlock_at && new Date(entry.unlock_at) > now

  const theme = THEMES[entry.theme] || THEMES.nostalgia
  const stars = Math.round(entry.friendship_level / 2)

  const handleRoast = async () => {
    setLoadingRoast(true)
    try {
      const res = await fetch('/api/roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: entry.name, message: entry.message })
      })
      const data = await res.json()
      setRoast(data.roast)
    } catch {
      setRoast('Roast generator took a day off! 😄')
    }
    setLoadingRoast(false)
  }

  if (isLocked) {
    const unlockDate = new Date(entry.unlock_at!)
    const daysLeft = Math.ceil((unlockDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return (
      <div className={`glass-card border-l-4 ${theme.border} p-5 mb-4 opacity-80`}>
        <div className="text-center py-4">
          <div className="text-5xl mb-3 lock-pulse inline-block">🔒</div>
          <h3 className={`font-indie text-lg font-bold ${theme.text} mb-1`}>{entry.name}</h3>
          <p className="font-indie text-gray-500 text-sm">Time Capsule sealed until</p>
          <p className={`font-grotesk font-semibold text-sm mt-1 ${theme.accent}`}>
            {unlockDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <div className="mt-2 inline-flex items-center gap-1 badge-pill">
            ⏳ {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`glass-card border-l-4 ${theme.border} p-4 mb-4 relative transition-all hover:scale-[1.01] hover:shadow-xl`}
      style={{ fontFamily: "'Indie Flower', cursive" }}
    >
      {/* Avatar */}
      {entry.avatar_url && (
        <div className="absolute top-4 right-4">
          <div className="polaroid" style={{ padding: '6px 6px 20px 6px' }}>
            <img
              src={entry.avatar_url}
              alt={`${entry.name}'s photo`}
              className="w-14 h-14 object-cover"
            />
          </div>
        </div>
      )}

      {/* Header row */}
      <div className="flex flex-wrap gap-2 items-center mb-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-grotesk font-medium ${theme.badge}`}>
          ✎ {new Date(entry.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        <span
          className="w-4 h-4 rounded-full border-2 border-white/60 shadow inline-block"
          style={{ background: entry.fav_color }}
          title={`Fav color: ${entry.fav_color}`}
        />
        {entry.theme && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${theme.badge} font-grotesk`}>
            {entry.theme === 'nostalgia' ? '📒' : entry.theme === 'bollywood' ? '💃' : '🎵'} {entry.theme}
          </span>
        )}
      </div>

      <h3 className={`text-xl font-bold ${theme.text} mb-1`}>{entry.name}</h3>
      <p className={`${theme.text} text-base mb-3 leading-relaxed`}>{entry.message}</p>

      {/* Friendship stars */}
      <div className="star-rating flex gap-0.5 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={`star text-lg ${i < stars ? '' : 'opacity-20'}`}>⭐</span>
        ))}
        <span className={`text-xs ml-1 ${theme.accent} font-grotesk font-medium`}>
          {entry.friendship_level}/10
        </span>
      </div>

      {/* Signature */}
      {entry.signature_data && (
        <div className="mb-3 bg-white/60 rounded-xl border border-white/40 p-1.5 inline-block">
          <img
            src={entry.signature_data}
            alt="Signature"
            className="h-10 max-w-[200px]"
            style={{ imageRendering: 'crisp-edges' }}
          />
        </div>
      )}

      {/* Action buttons row */}
      <div className="flex flex-wrap gap-2 mt-2">
        {/* AI Poem */}
        {entry.ai_poem && (
          <button
            onClick={() => setShowPoem(!showPoem)}
            className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 border border-yellow-300 rounded-full px-3 py-1 transition font-grotesk font-medium"
          >
            {showPoem ? '🙈 Hide Poem' : '✨ AI Poem'}
          </button>
        )}

        {/* Radar */}
        {entry.ai_compatibility !== null && entry.ai_compatibility !== undefined && (
          <button
            onClick={() => setShowRadar(!showRadar)}
            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300 rounded-full px-3 py-1 transition font-grotesk font-medium"
          >
            {showRadar ? '📊 Hide Radar' : '📊 Compatibility'}
          </button>
        )}

        {/* Roast */}
        <button
          onClick={handleRoast}
          disabled={loadingRoast}
          className="text-xs bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 rounded-full px-3 py-1 transition disabled:opacity-50 font-grotesk font-medium"
        >
          {loadingRoast ? '🔥...' : '🔥 AI Roast'}
        </button>
      </div>

      {/* Expandable: AI Poem */}
      {showPoem && entry.ai_poem && (
        <div className="mt-3 bg-yellow-50/80 border border-yellow-200 rounded-2xl p-3 text-sm text-yellow-800 italic whitespace-pre-wrap leading-relaxed font-indie backdrop-blur-sm">
          {entry.ai_poem}
        </div>
      )}

      {/* Expandable: Compatibility Radar */}
      {showRadar && entry.ai_compatibility !== null && entry.ai_compatibility !== undefined && (
        <div className="mt-3 bg-white/60 border border-gray-200 rounded-2xl p-3 flex flex-col items-center backdrop-blur-sm">
          <FriendshipRadar score={entry.ai_compatibility} theme={entry.theme} />
          <div className="mt-2 w-full max-w-xs">
            <CompatibilityBar score={entry.ai_compatibility} label="Overall Vibe Match" />
            <CompatibilityBar score={Math.round(entry.friendship_level * 10)} label="Friendship Intensity" />
          </div>
        </div>
      )}

      {/* Roast result */}
      {roast && (
        <div className="mt-3 bg-red-50/80 border border-red-200 rounded-2xl p-3 text-sm text-red-800 backdrop-blur-sm">
          🔥 {roast}
        </div>
      )}
    </div>
  )
}
