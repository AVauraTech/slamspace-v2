import { NextRequest, NextResponse } from 'next/server'
import { generateRoast } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  const { name, message } = await req.json()
  const roast = await generateRoast(name, message)
  return NextResponse.json({ roast })
}
