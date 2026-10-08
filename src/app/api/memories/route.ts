import { NextRequest, NextResponse } from 'next/server'
import { supabase, Memory } from '@/lib/supabase'

const LOCAL_MEMORIES: Memory[] = [
  {
    id: 'mem-1',
    room_id: 'default',
    content: 'Sneaking extra gulab jamuns from the canteen while the bell rang!',
    author: 'Rohan',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'mem-2',
    room_id: 'default',
    content: 'Drawing doodles in the back of our chemistry notebooks during rain showers.',
    author: 'Simran',
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
        .from('memories')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (!error && data && data.length > 0) {
        return NextResponse.json(data)
      }
    }
  } catch {
    // Fall back
  }

  const filtered = LOCAL_MEMORIES.filter(m => m.room_id === roomId || roomId === 'default')
  return NextResponse.json(filtered)
}

export async function POST(req: NextRequest) {
  try {
    const { room_id, content, author } = await req.json()

    const isConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project')

    if (isConfigured) {
      try {
        const { data, error } = await supabase
          .from('memories')
          .insert([{ room_id: room_id || 'default', content, author: author || 'Anonymous' }])
          .select()
          .single()

        if (!error && data) {
          return NextResponse.json(data)
        }
      } catch {
        // Fall back
      }
    }

    const newMemory: Memory = {
      id: `mem-${Date.now()}`,
      room_id: room_id || 'default',
      content,
      author: author || 'Anonymous',
      created_at: new Date().toISOString(),
    }

    LOCAL_MEMORIES.push(newMemory)
    return NextResponse.json(newMemory)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to save memory' },
      { status: 500 }
    )
  }
}
