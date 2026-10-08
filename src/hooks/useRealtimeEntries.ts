'use client'
import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Subscribe to realtime inserts on the entries table for a given roomId.
 * Calls `onNew` with the new entry whenever one is inserted by any client.
 */
export function useRealtimeEntries(
  roomId: string,
  onNew: (entry: Record<string, unknown>) => void
) {
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    const channel = supabase
      .channel(`entries-room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'entries',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          onNew(payload.new)
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, onNew])
}
