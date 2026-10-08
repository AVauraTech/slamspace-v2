import { NextRequest, NextResponse } from 'next/server'
import { supabase, Entry } from '@/lib/supabase'
import { generateFriendshipPoem } from '@/lib/gemini'

// Pre-seeded nostalgic entries for instant out-of-the-box delight
const LOCAL_STORE: Entry[] = [
  {
    id: 'demo-1',
    name: 'Pooja (Your 2000s Desk Partner)',
    message: 'Remember sharing samosas during break & our code names for teachers? You will always be my #1 partner in crime! Don’t lose this slam book!! ✨',
    friendship_level: 10,
    fav_color: '#f59e0b',
    avatar_url: null,
    signature_data: null,
    theme: 'nostalgia',
    unlock_at: null,
    room_id: 'default',
    ai_poem: 'Golden desks and laughter bright,\nSamosa breaks in morning light.\nThough years may turn and seasons blend,\nYou will forever be my friend. ✨',
    ai_compatibility: 95,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'demo-2',
    name: 'Kabir (Mixtape King 🎧)',
    message: 'Still waiting for you to return my Linkin Park CD! Best friend forever, through all the exams and bunked lectures. 📼',
    friendship_level: 9,
    fav_color: '#3b82f6',
    avatar_url: null,
    signature_data: null,
    theme: 'bollywood',
    unlock_at: null,
    room_id: 'default',
    ai_poem: 'Rewound tapes and static tunes,\nUnderneath the classroom moons.\nA friendship stamped in classic rhyme,\nUnbreakable through all of time. 🎵',
    ai_compatibility: 92,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const roomId = searchParams.get('room_id') || 'default'

  try {
    const isConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project')

    if (isConfigured) {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })

      if (!error && data && data.length > 0) {
        return NextResponse.json(data)
      }
    }
  } catch {
    // Fall back to in-memory store
  }

  // Return in-memory fallback
  const filtered = LOCAL_STORE.filter(e => e.room_id === roomId || roomId === 'default')
  return NextResponse.json(filtered)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      name,
      message,
      friendship_level,
      fav_color,
      avatar_url,
      signature_data,
      theme,
      unlock_at,
      room_id,
    } = body

    // Generate AI poem using Gemini (or graceful fallback)
    const ai_poem = await generateFriendshipPoem(name, message, friendship_level)

    const isConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project')

    if (isConfigured) {
      try {
        const { data, error } = await supabase
          .from('entries')
          .insert([
            {
              name,
              message,
              friendship_level: friendship_level || 10,
              fav_color: fav_color || '#e4ba77',
              avatar_url,
              signature_data,
              theme: theme || 'nostalgia',
              unlock_at: unlock_at || null,
              room_id: room_id || 'default',
              ai_poem,
            },
          ])
          .select()
          .single()

        if (!error && data) {
          return NextResponse.json(data)
        }
      } catch {
        // Fall back to local store
      }
    }

    // Save to in-memory store
    const newEntry: Entry = {
      id: `entry-${Date.now()}`,
      name,
      message,
      friendship_level: friendship_level || 10,
      fav_color: fav_color || '#e4ba77',
      avatar_url,
      signature_data,
      theme: theme || 'nostalgia',
      unlock_at: unlock_at || null,
      room_id: room_id || 'default',
      ai_poem,
      ai_compatibility: 88,
      created_at: new Date().toISOString(),
    }

    LOCAL_STORE.unshift(newEntry)
    return NextResponse.json(newEntry)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to save entry' },
      { status: 500 }
    )
  }
}
