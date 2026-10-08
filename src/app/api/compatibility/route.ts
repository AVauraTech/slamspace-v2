import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: NextRequest) {
  try {
    const { name, message, friendship_level } = await req.json()

    // Default fallback calculation based on message characteristics
    const len = (message || '').length
    const fLevel = Number(friendship_level) || 10

    // Deterministic pseudo-random variation based on name
    let hash = 0
    for (let i = 0; i < (name || '').length; i++) {
      hash = (hash << 5) - hash + name.charCodeAt(i)
      hash |= 0
    }
    const seed = Math.abs(hash) % 20

    const defaultTraits = {
      humor: Math.min(100, Math.max(60, 75 + (seed % 15))),
      nostalgia: Math.min(100, Math.max(70, 80 + ((seed * 3) % 18))),
      chaos: Math.min(100, Math.max(50, 65 + ((seed * 7) % 30))),
      loyalty: Math.min(100, Math.max(75, 85 + Math.round((fLevel / 10) * 12))),
      vibe: Math.min(100, Math.max(65, 80 + ((seed * 2) % 15))),
    }

    const defaultScore = Math.round(
      (defaultTraits.humor +
        defaultTraits.nostalgia +
        defaultTraits.chaos +
        defaultTraits.loyalty +
        defaultTraits.vibe) /
        5
    )

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-gemini-api-key-here') {
      return NextResponse.json({
        traits: defaultTraits,
        score: defaultScore,
        source: 'local',
      })
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const prompt = `You are an AI Friendship Analyst for a 2000s nostalgic slam book.
Evaluate the friendship compatibility between the book owner and their friend named "${name}".
Friend's slam book message: "${message}".
Friendship rating: ${fLevel}/10.

Output ONLY a JSON object with this exact structure (scores between 50 and 100):
{
  "humor": 85,
  "nostalgia": 90,
  "chaos": 75,
  "loyalty": 95,
  "vibe": 88,
  "score": 87
}`

    const result = await model.generateContent(prompt)
    const raw = result.response.text().trim()
    const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json({
      traits: {
        humor: parsed.humor || defaultTraits.humor,
        nostalgia: parsed.nostalgia || defaultTraits.nostalgia,
        chaos: parsed.chaos || defaultTraits.chaos,
        loyalty: parsed.loyalty || defaultTraits.loyalty,
        vibe: parsed.vibe || defaultTraits.vibe,
      },
      score: parsed.score || defaultScore,
      source: 'gemini',
    })
  } catch {
    return NextResponse.json({
      traits: { humor: 85, nostalgia: 92, chaos: 78, loyalty: 95, vibe: 90 },
      score: 88,
      source: 'fallback',
    })
  }
}
