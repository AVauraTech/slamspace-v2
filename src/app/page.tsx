'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import SignaturePad, { SignaturePadHandle } from '@/components/SignaturePad'
import EntryCard from '@/components/EntryCard'
import TimeCapsule from '@/components/TimeCapsule'
import MemoryLane from '@/components/MemoryLane'
import Confetti from '@/components/Confetti'
import StickerBoard from '@/components/StickerBoard'
import PdfExport from '@/components/PdfExport'
import TriviaGame from '@/components/TriviaGame'
import CollabDoodle from '@/components/CollabDoodle'
import RadarChart from '@/components/RadarChart'
import { sound } from '@/lib/sound'
import { useRealtimeEntries } from '@/hooks/useRealtimeEntries'
import type { Entry } from '@/lib/supabase'

// Dynamically import 3D book (no SSR - Three.js needs window)
const Book3D = dynamic(() => import('@/components/Book3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 flex flex-col items-center justify-center gap-3">
      <div className="text-4xl animate-bounce">📚</div>
      <div className="text-amber-700 font-indie text-xl animate-pulse">Summoning 3D Slam Book...</div>
    </div>
  )
})

const THEMES = ['nostalgia', 'bollywood', 'kpop'] as const
type Theme = typeof THEMES[number]

const THEME_META: Record<Theme, { label: string; emoji: string; subtitle: string; bg: string; accent: string }> = {
  nostalgia: {
    label: '2000s Nostalgia',
    emoji: '📒',
    subtitle: 'Gel pens, slam notes & dial-up memories',
    bg: 'bg-amber-50',
    accent: 'bg-amber-400'
  },
  bollywood: {
    label: 'Bollywood Retro',
    emoji: '💃',
    subtitle: 'Filmy drama, colorful romance & retro flair',
    bg: 'bg-pink-50',
    accent: 'bg-pink-500'
  },
  kpop: {
    label: 'K-Pop Neon',
    emoji: '🎵',
    subtitle: 'Pastel dream, photocards & pop aesthetics',
    bg: 'bg-purple-50',
    accent: 'bg-purple-500'
  },
}

const ROOM_ID = 'default'

export default function HomePage() {
  const [bookOpen, setBookOpen] = useState(false)
  const [theme, setTheme] = useState<Theme>('nostalgia')
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [confettiTrigger, setConfettiTrigger] = useState(0)
  const [aiPrompt, setAiPrompt] = useState("What's your funniest memory with me?")
  const [promptLoading, setPromptLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Advanced feature modal states
  const [showTrivia, setShowTrivia] = useState(false)
  const [showDoodle, setShowDoodle] = useState(false)
  const [showRadarModal, setShowRadarModal] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [friendshipLevel, setFriendshipLevel] = useState(10)
  const [favColor, setFavColor] = useState('#e4ba77')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [unlockAt, setUnlockAt] = useState<string | null>(null)

  const sigPadRef = useRef<SignaturePadHandle>(null)

  // Sync theme to root html element for CSS variables in globals.css
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Load entries from server
  const loadEntries = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/entries?room_id=${ROOM_ID}`)
      const data = await res.json()
      if (Array.isArray(data)) setEntries(data)
    } catch (e) {
      console.error('Failed to load entries:', e)
    }
    setLoading(false)
  }, [])

  // Hook up realtime entry subscription
  useRealtimeEntries(ROOM_ID, (newRawEntry) => {
    const newEntry = newRawEntry as Entry
    if (newEntry && newEntry.id) {
      setEntries(prev => {
        if (prev.some(e => e.id === newEntry.id)) return prev
        return [newEntry, ...prev]
      })
    }
  })

  // Fetch AI-generated smart prompt based on recent messages
  const fetchAiPrompt = useCallback(async (msgs: string[]) => {
    setPromptLoading(true)
    try {
      const res = await fetch('/api/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs })
      })
      const data = await res.json()
      if (data.prompt) setAiPrompt(data.prompt)
    } catch {
      // fallback handled gracefully
    }
    setPromptLoading(false)
  }, [])

  useEffect(() => {
    if (bookOpen) {
      loadEntries()
      fetchAiPrompt([])
    }
  }, [bookOpen, loadEntries, fetchAiPrompt])

  // Handle avatar upload preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  // Submit entry
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !message.trim()) {
      alert('Please fill in your name and message!')
      return
    }
    setSubmitting(true)

    try {
      let avatarUrl: string | null = null

      // Upload avatar if selected
      if (imageFile) {
        const fd = new FormData()
        fd.append('file', imageFile)
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd })
        const uploadData = await uploadRes.json()
        avatarUrl = uploadData.url || null
      }

      // Get signature data URL from canvas
      const signatureData = sigPadRef.current?.isEmpty() ? null : sigPadRef.current?.getDataURL()

      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          message: message.trim(),
          friendship_level: friendshipLevel,
          fav_color: favColor,
          avatar_url: avatarUrl,
          signature_data: signatureData || null,
          theme,
          unlock_at: unlockAt,
          room_id: ROOM_ID
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to submit')
      }

      // Reset form
      setName('')
      setMessage('')
      setFriendshipLevel(10)
      setFavColor('#e4ba77')
      setImageFile(null)
      setImagePreview(null)
      setUnlockAt(null)
      sigPadRef.current?.clear()

      // Reload entries and trigger confetti
      await loadEntries()
      sound.playChime()
      setConfettiTrigger(t => t + 1)
      fetchAiPrompt(entries.map(e => e.message))

    } catch (err) {
      alert(`Oops! Something went wrong: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
    setSubmitting(false)
  }

  // Filtered entries for search
  const filteredEntries = searchQuery.trim()
    ? entries.filter(e =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.message.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : entries

  const themeMeta = THEME_META[theme]

  // ==================== COVER PAGE ====================
  if (!bookOpen) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
        {/* Decorative backdrop glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-4 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-300 text-amber-800 text-xs font-grotesk font-semibold mb-3 shadow-sm">
            <span>✨</span> Next-Gen Interactive Slam Book
          </div>
          <h1 className="font-homemade text-4xl md:text-5xl text-amber-950 drop-shadow-sm tracking-wide">
            SlamSpace
          </h1>
          <p className="font-indie text-amber-800 text-lg md:text-xl mt-2">
            Where friendships, secrets & inside jokes live forever 💛
          </p>
        </div>

        {/* 3D Book Interactive Canvas */}
        <div className="w-full max-w-xl z-10 my-2">
          <Book3D onOpen={() => setBookOpen(true)} />
        </div>

        <button
          onClick={() => setBookOpen(true)}
          className="z-10 mt-2 px-8 py-3 rounded-full font-indie text-lg text-white bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2 border border-amber-300/40"
        >
          <span>📖</span> Open Slam Book
        </button>

        <p className="font-indie text-amber-600 text-sm mt-3 animate-pulse z-10">
          Click the book or tap above to flip inside!
        </p>

        {/* Feature Badges */}
        <div className="mt-8 flex flex-wrap gap-2.5 justify-center max-w-xl z-10">
          {[
            '🎨 3D Skeuomorphic Cover',
            '✨ Gemini Friendship Poems',
            '🔥 AI Roast Mode',
            '📊 Friendship Radar Charts',
            '⏳ Time Capsule Unlocks',
            '🎨 Live Sticker Board',
            '📄 Scrapbook PDF Export',
            '✍️ Smooth Canvas Signatures',
          ].map(f => (
            <span
              key={f}
              className="bg-white/80 backdrop-blur-sm border border-amber-200/80 text-amber-900 font-grotesk text-xs font-medium px-3.5 py-1.5 rounded-full shadow-xs hover:border-amber-400 transition"
            >
              {f}
            </span>
          ))}
        </div>
      </main>
    )
  }

  // ==================== BOOK INTERIOR ====================
  return (
    <main className={`min-h-screen ${themeMeta.bg} transition-colors duration-500 relative pb-28`}>
      <Confetti trigger={confettiTrigger} />
      <MemoryLane roomId={ROOM_ID} />
      <StickerBoard />

      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-amber-200/60 shadow-xs">
        <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
          <button
            onClick={() => {
              sound.playPageFlip()
              setBookOpen(false)
            }}
            className="font-indie text-amber-800 hover:text-amber-950 text-sm transition flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-amber-100/50"
          >
            <span>←</span> Close Book
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xl">📖</span>
            <h1 className="font-homemade text-xl text-amber-900">SlamSpace</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme switcher */}
            <div className="flex gap-1 bg-amber-100/60 p-1 rounded-xl border border-amber-200/60">
              {THEMES.map(t => (
                <button
                  key={t}
                  onClick={() => {
                    sound.playClick()
                    setTheme(t)
                  }}
                  title={THEME_META[t].label}
                  className={`font-grotesk text-xs px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    theme === t
                      ? 'bg-amber-500 text-white font-semibold shadow-xs'
                      : 'text-amber-800 hover:bg-white/60'
                  }`}
                >
                  <span>{THEME_META[t].emoji}</span>
                  <span className="hidden sm:inline">{THEME_META[t].label.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            {/* PDF Export Action */}
            <PdfExport entries={entries} theme={theme} />
          </div>
        </div>

        {/* Quick-Access Interactive Feature Bar */}
        <div className="bg-amber-50/70 border-t border-amber-200/40 px-4 py-1.5">
          <div className="max-w-3xl mx-auto flex items-center justify-center sm:justify-start gap-2 overflow-x-auto">
            <button
              onClick={() => {
                sound.playClick()
                setShowTrivia(true)
              }}
              className="text-xs bg-white/80 hover:bg-white text-amber-900 border border-amber-300 rounded-full px-3 py-1 font-grotesk font-medium shadow-xs transition flex items-center gap-1 shrink-0"
            >
              <span>🎮</span> Bestie Trivia
            </button>
            <button
              onClick={() => {
                sound.playClick()
                setShowDoodle(true)
              }}
              className="text-xs bg-white/80 hover:bg-white text-purple-900 border border-purple-300 rounded-full px-3 py-1 font-grotesk font-medium shadow-xs transition flex items-center gap-1 shrink-0"
            >
              <span>✍️</span> Pass The Book (Doodle)
            </button>
            <button
              onClick={() => {
                sound.playClick()
                setShowRadarModal(true)
              }}
              className="text-xs bg-white/80 hover:bg-white text-blue-900 border border-blue-300 rounded-full px-3 py-1 font-grotesk font-medium shadow-xs transition flex items-center gap-1 shrink-0"
            >
              <span>🕸️</span> Friendship Radar
            </button>
          </div>
        </div>
      </header>

      {/* Main Book Page Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Realistic spiral binding decoration */}
        <div className="flex gap-3 justify-center mb-6 overflow-hidden py-1" aria-hidden="true">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="w-3.5 h-8 bg-gradient-to-r from-gray-700 via-gray-400 to-gray-800 rounded-full shadow-md shrink-0 border-t border-white/40"
              style={{ borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%' }}
            />
          ))}
        </div>

        {/* AI Smart Prompt of the Moment */}
        <div className="glass-card p-4 mb-6 washi-tape relative">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-amber-600 font-grotesk font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                <span>✨</span> AI Prompt of the Moment
              </p>
              <p className="font-indie text-amber-950 text-lg leading-snug">
                {promptLoading ? '🤔 Cooking up a fresh question...' : `"${aiPrompt}"`}
              </p>
            </div>
            <button
              onClick={() => fetchAiPrompt(entries.map(e => e.message))}
              disabled={promptLoading}
              title="Get another AI question"
              className="shrink-0 text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 rounded-full px-3 py-1.5 transition disabled:opacity-50 font-grotesk font-medium shadow-xs"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* ================= ENTRY FORM ================= */}
        <form
          onSubmit={handleSubmit}
          className="glass-card p-6 mb-8 relative border-2 border-dashed border-amber-300/80 shadow-md"
        >
          <div className="text-center mb-5">
            <h2 className="font-homemade text-2xl text-amber-900 font-bold">
              ✍️ Sign My Slam Book
            </h2>
            <p className="font-indie text-amber-700 text-sm mt-1">
              Leave your signature, pick your favorite vibe, and let AI capture our bond!
            </p>
          </div>

          {/* Name Field */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <label className="font-indie text-amber-800 text-base font-bold">Your Name / Nickname</label>
              <span className="text-xs text-amber-500 font-grotesk">{name.length}/25</span>
            </div>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Rahul, Simran, or Batman 🦇"
              maxLength={25}
              required
              className="w-full bg-white/50 border-b-2 border-dashed border-amber-300 font-indie text-amber-950 text-lg py-1.5 px-2 focus:outline-none focus:border-amber-600 focus:bg-white/80 transition rounded-t"
            />
          </div>

          {/* Message Field */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-1">
              <label className="font-indie text-amber-800 text-base font-bold">Your Message / Memory</label>
              <span className="text-xs text-amber-500 font-grotesk">{message.length}/200</span>
            </div>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Spill the tea! Write something funny, emotional, or unforgettable..."
              maxLength={200}
              required
              rows={3}
              className="w-full bg-white/50 border-b-2 border-dashed border-amber-300 font-indie text-amber-950 text-base py-2 px-2 resize-none focus:outline-none focus:border-amber-600 focus:bg-white/80 transition rounded-t"
            />
          </div>

          {/* Friendship Level Slider */}
          <div className="mb-5 p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200/50">
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-indie text-amber-800 text-sm font-bold">Friendship Score:</label>
              <div className="flex items-center gap-1.5 font-indie font-bold text-amber-800">
                <span className="text-base">{friendshipLevel}/10</span>
                <span>{friendshipLevel === 10 ? '👑 Besties!' : friendshipLevel >= 7 ? '💛 Close Friends' : '🌱 Growing bond'}</span>
              </div>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={friendshipLevel}
              onChange={e => setFriendshipLevel(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-amber-500 font-grotesk mt-1 px-1">
              <span>Casual</span>
              <span>Good Pals</span>
              <span>Ride or Die 🔥</span>
            </div>
          </div>

          {/* Fav Color Picker & Photo Upload */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            {/* Color */}
            <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-200/50 flex items-center justify-between">
              <div>
                <label className="font-indie text-amber-800 text-sm font-bold block">Aesthetic Color:</label>
                <span className="text-xs text-amber-600 font-mono">{favColor}</span>
              </div>
              <input
                type="color"
                value={favColor}
                onChange={e => setFavColor(e.target.value)}
                className="w-10 h-10 rounded-full border-2 border-amber-300 cursor-pointer p-0.5 bg-white shadow-xs"
              />
            </div>

            {/* Photo upload */}
            <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-200/50">
              <label className="font-indie text-amber-800 text-sm font-bold block mb-1">Polaroid Photo:</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="text-xs text-amber-800 file:mr-2 file:py-1 file:px-2.5 file:rounded-full file:border file:border-amber-300 file:text-amber-800 file:bg-white file:font-grotesk file:cursor-pointer hover:file:bg-amber-100"
              />
              {imagePreview && (
                <div className="mt-2 flex items-center gap-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-12 h-12 rounded-lg object-cover border-2 border-white shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null) }}
                    className="text-xs text-red-500 hover:text-red-700 font-grotesk"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Canvas Signature */}
          <div className="mb-5">
            <label className="font-indie text-amber-800 text-base font-bold block mb-1">
              Handwritten Signature ✒️:
            </label>
            <SignaturePad ref={sigPadRef} />
          </div>

          {/* Time Capsule Lock Option */}
          <div className="mb-5">
            <TimeCapsule value={unlockAt} onChange={setUnlockAt} />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white font-indie text-lg font-bold py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <span className="inline-block animate-spin">✨</span>
                <span>Composing AI Poem & Sealing Entry...</span>
              </>
            ) : (
              <>
                <span>🌟</span>
                <span>Seal Entry into Slam Book</span>
              </>
            )}
          </button>
        </form>

        {/* ================= SEARCH & FILTER ================= */}
        <div className="mb-5 flex gap-2 items-center">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="🔍 Search entries by name, memory, or quote..."
              className="w-full glass-card border border-amber-300/80 rounded-2xl px-4 py-2.5 font-indie text-amber-950 text-base focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-amber-500/60"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-amber-600 hover:text-amber-900 bg-amber-100 rounded-full w-5 h-5 flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ================= ENTRIES LIST ================= */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="font-homemade text-2xl text-amber-950">
                Entries ({filteredEntries.length})
              </h2>
              {searchQuery && (
                <span className="text-xs bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-grotesk">
                  filtered
                </span>
              )}
            </div>
            <button
              onClick={loadEntries}
              disabled={loading}
              className="text-xs bg-white/70 hover:bg-white text-amber-800 border border-amber-300 rounded-full px-3 py-1.5 transition disabled:opacity-50 font-grotesk font-medium shadow-xs"
            >
              {loading ? 'Refreshing...' : '🔄 Refresh'}
            </button>
          </div>

          {loading && entries.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl animate-spin inline-block">📖</div>
              <p className="font-indie text-amber-700 text-lg mt-3">Turning the vintage pages...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-14 glass-card border border-dashed border-amber-300">
              <div className="text-5xl mb-3">🌟</div>
              <p className="font-indie text-amber-800 text-lg font-bold">
                {searchQuery ? 'No memories match your search query.' : 'Be the very first friend to sign this book!'}
              </p>
              <p className="font-grotesk text-xs text-amber-600 mt-1">
                Fill the form above to leave your eternal digital stamp.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEntries.map(entry => (
                <div key={entry.id} className="entry-animate">
                  <EntryCard entry={entry} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center pb-12">
          <p className="font-homemade text-base text-amber-700">
            SlamSpace • Nostalgia, Code & Friendship
          </p>
          <p className="font-grotesk text-xs text-amber-500 mt-1">
            Powered by Next.js 16 • Three.js • Supabase • Gemini AI
          </p>
        </footer>
      </div>

      {/* ================= MODALS ================= */}
      {showTrivia && (
        <TriviaGame onClose={() => setShowTrivia(false)} />
      )}

      {showDoodle && (
        <CollabDoodle
          onClose={() => setShowDoodle(false)}
          onSaveToEntry={(dataUrl) => {
            sound.playChime()
            setShowDoodle(false)
            alert('Doodle saved! You can also download or share it!')
          }}
        />
      )}

      {showRadarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop bg-black/50 backdrop-blur-sm p-4">
          <RadarChart
            friendName={entries[0]?.name || 'Your Bestie'}
            score={entries[0]?.ai_compatibility || 91}
            onClose={() => setShowRadarModal(false)}
          />
        </div>
      )}
    </main>
  )
}
