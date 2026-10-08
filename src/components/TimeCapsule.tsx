'use client'
import { useState } from 'react'

interface TimeCapsuleProps {
  value: string | null
  onChange: (date: string | null) => void
}

export default function TimeCapsule({ value, onChange }: TimeCapsuleProps) {
  const [enabled, setEnabled] = useState(false)

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().slice(0, 10)

  // Quick preset dates
  const presets = [
    { label: 'Next year', days: 365 },
    { label: 'Graduation 2025', date: '2025-06-15' },
    { label: 'Graduation 2026', date: '2026-06-15' },
    { label: 'New Year 2026', date: '2026-01-01' },
  ]

  const setPreset = (days?: number, date?: string) => {
    if (date) {
      onChange(date)
    } else if (days) {
      const d = new Date()
      d.setDate(d.getDate() + days)
      onChange(d.toISOString().slice(0, 10))
    }
  }

  return (
    <div className="glass-card border border-purple-200/50 p-4 mt-2">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={e => {
            setEnabled(e.target.checked)
            if (!e.target.checked) onChange(null)
          }}
          className="accent-purple-500 w-4 h-4"
        />
        <span className="font-indie text-purple-700 text-sm font-semibold">
          ⏳ Time Capsule — Lock this entry until a future date
        </span>
      </label>

      {enabled && (
        <div className="mt-3 space-y-3">
          {/* Quick presets */}
          <div>
            <p className="text-xs text-purple-400 font-grotesk mb-1.5">Quick presets:</p>
            <div className="flex flex-wrap gap-1.5">
              {presets.map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setPreset(p.days, p.date)}
                  className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-300 rounded-full px-3 py-0.5 transition font-grotesk font-medium"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom date */}
          <div>
            <p className="text-xs text-purple-400 font-grotesk mb-1">Or pick a date:</p>
            <input
              type="date"
              min={minDate}
              value={value || ''}
              onChange={e => onChange(e.target.value)}
              className="font-grotesk bg-white/70 border border-purple-300 rounded-xl px-3 py-2 text-purple-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 w-full"
            />
          </div>

          {value && (
            <div className="flex items-start gap-2 bg-purple-50/80 rounded-xl p-3">
              <span className="text-lg">🔐</span>
              <div>
                <p className="text-xs text-purple-700 font-indie leading-snug">
                  This entry will be hidden until{' '}
                  <strong>{new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                </p>
                <p className="text-xs text-purple-400 font-grotesk mt-0.5">
                  Cryptographically sealed with love 💜
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
