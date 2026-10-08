import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const fileName = `avatars/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
  
  const { data, error } = await supabase.storage
    .from('slam-media')
    .upload(fileName, buffer, { contentType: file.type })
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  
  const { data: urlData } = supabase.storage.from('slam-media').getPublicUrl(fileName)
  return NextResponse.json({ url: urlData.publicUrl })
}
