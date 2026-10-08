import { NextRequest, NextResponse } from 'next/server'
import { generateSmartPrompt } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  const { messages } = await req.json()
  const prompt = await generateSmartPrompt(messages || [])
  return NextResponse.json({ prompt })
}
