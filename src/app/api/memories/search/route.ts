import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { query, memories } = await req.json()

    if (!query || !Array.isArray(memories) || memories.length === 0) {
      return NextResponse.json({ result: 'No memories to search through.' })
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const prompt = `You are a nostalgic assistant helping someone search through slam book memories.

User's search query: "${query}"

Here are the memories (format: "Author: content"):
${memories.map((m, i) => `${i + 1}. ${m}`).join('\n')}

Find and summarize the most relevant memories that match the query. Be warm, fun, and conversational. 
If nothing matches, say so kindly. Keep your response under 150 words. Reference the authors by name.`

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()

    return NextResponse.json({ result: text })
  } catch (err) {
    console.error('Memory search error:', err)
    return NextResponse.json({ result: 'Search failed. Try a different query!' })
  }
}
