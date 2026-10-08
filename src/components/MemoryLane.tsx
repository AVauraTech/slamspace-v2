'use client'
import { useState, useEffect, useRef } from 'react'
import type { Memory } from '@/lib/supabase'

interface MemoryLaneProps {
  roomId: string
}

export default function MemoryLane({ roomId }: MemoryLaneProps) {
  const [open, setOpen] = useState(false)
  const [memories, setMemories] = useState<Memory[]>([])
  const [input, setInput] = useState('')
  const [author, setAuthor] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [aiSearching, setAiSearching] = useState(false)
  const [aiResults, setAiResults] = useState<string | null>(null)
  const [roomLink, setRoomLink] = useState('')
  const [copied, setCopied] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRoomLink(window.location.href)
    }
  }, [])

  const loadMemories = async () => {
    try {
      const res = await fetch(`/api/memories?room_id=${roomId}`)
      const data = await res.json()
      if (Array.isArray(data)) setMemories(data)
    } catch {}
  }

  useEffect(() => {
    if (open) loadMemories()
  }, [open])

  // Scroll to bottom when new memories arrive
  useEffect(() => {
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [memories, open])

  const addMemory = async () => {
    if (!input.trim()) return
    setLoading(true)
    try {
      await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: roomId, content: input, author: author || 'Anonymous' })
      })
      setInput('')
      await loadMemories()
    } catch {}
    setLoading(false)
  }

  const handleAiSearch = async () => {
    if (!searchQuery.trim()) return
    setAiSearching(true)
    setAiResults(null)
    try {
      const res = await fetch('/api/memories/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, memories: memories.map(m => `${m.author}: ${m.content}`) })
      })
      const data = await res.json()
      setAiResults(data.result || 'No relevant memories found.')
    } catch {
      setAiResults('Search failed. Try again!')
    }
    setAiSearching(false)
  }

  const copyRoomLink = () => {
    navigator.clipboard.writeText(roomLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const filteredMemories = searchQuery.trim() && !aiResults
    ? memories.filter(m =>
        m.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : memories

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open Memory Lane"
        className="fixed bottom-6 right-6 z-40 btn-glow font-indie text-sm transition
          bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-xl rounded-2xl px-5 py-3
          flex items-center gap-2 hover:scale-105 active:scale-95"
      >
        <span className="text-lg">📝</span>
        Memory Lane
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="glass-card w-[92vw] max-w-md max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/20">
              <div>
                <h3 className="font-indie text-amber-800 text-xl font-bold">Memory Lane 📝</h3>
                <p className="text-xs text-amber-500 font-grotesk mt-0.5">{memories.length} shared memories</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/10 transition"
              >
                ✕
              </button>
            </div>

            {/* Room Link Share */}
            <div className="px-4 py-2 bg-amber-50/60 border-b border-amber-100">
              <p className="text-xs text-amber-600 font-grotesk font-medium mb-1">🔗 Share this book</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={roomLink}
                  className="flex-1 text-xs bg-white/70 border border-amber-200 rounded-lg px-2 py-1 font-grotesk text-amber-700 truncate focus:outline-none"
                />
                <button
                  onClick={copyRoomLink}
                  className={`text-xs px-3 py-1 rounded-lg font-grotesk font-medium transition shrink-0 ${
                    copied
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-amber-100 hover:bg-amber-200 text-amber-700 border border-amber-300'
                  }`}
                >
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* AI Natural Language Search */}
            <div className="px-4 py-2 bg-purple-50/60 border-b border-purple-100">
              <p className="text-xs text-purple-600 font-grotesk font-medium mb-1">🤖 AI Memory Search</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setAiResults(null) }}
                  placeholder='e.g. "funny moments with Alex"'
                  className="flex-1 text-xs bg-white/70 border border-purple-200 rounded-lg px-3 py-1.5 font-indie text-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-300"
                  onKeyDown={e => { if (e.key === 'Enter') handleAiSearch() }}
                />
                <button
                  onClick={handleAiSearch}
                  disabled={aiSearching}
                  className="text-xs px-3 py-1.5 rounded-lg font-grotesk font-medium bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-300 transition disabled:opacity-50 shrink-0"
                >
                  {aiSearching ? (
                    <span className="flex gap-1">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </span>
                  ) : '🔍'}
                </button>
              </div>
              {aiResults && (
                <div className="mt-2 bg-purple-50 border border-purple-200 rounded-xl p-2 text-xs font-indie text-purple-800 leading-relaxed">
                  🤖 {aiResults}
                </div>
              )}
            </div>

            {/* Memory Feed */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {filteredMemories.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">🌟</div>
                  <p className="font-indie text-amber-400 text-sm">
                    {searchQuery ? 'No memories match your search.' : 'No memories yet. Be the first!'}
                  </p>
                </div>
              ) : (
                filteredMemories.map((m, idx) => (
                  <div
                    key={m.id}
                    className="bg-white/60 backdrop-blur-sm rounded-xl px-3 py-2 border border-amber-100 entry-animate"
                    style={{ animationDelay: `${idx * 0.04}s` }}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-amber-600 text-sm">{m.author}</span>
                      <span className="text-xs text-gray-400 font-grotesk">
                        {new Date(m.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-amber-800 text-sm font-indie leading-snug">{m.content}</p>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input area */}
            <div className="px-4 pb-5 pt-3 border-t border-white/20 space-y-2">
              <input
                type="text"
                placeholder="Your name"
                value={author}
                onChange={e => setAuthor(e.target.value)}
                maxLength={25}
                className="w-full font-indie border border-amber-200 bg-white/70 rounded-xl px-3 py-1.5 text-sm text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
              <div className="flex gap-2">
                <textarea
                  placeholder="Share a nostalgic memory... ✨"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addMemory() } }}
                  className="flex-1 font-indie border border-amber-200 bg-white/70 rounded-xl px-3 py-2 text-sm resize-none h-14 focus:outline-none focus:ring-2 focus:ring-amber-300 text-amber-800"
                />
                <button
                  onClick={addMemory}
                  disabled={loading || !input.trim()}
                  className="shrink-0 btn-glow bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl px-4 font-indie text-sm transition"
                >
                  {loading ? '...' : '✈️'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
