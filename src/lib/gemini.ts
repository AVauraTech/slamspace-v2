import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function generateFriendshipPoem(name: string, message: string, friendshipLevel: number): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const prompt = `You are a nostalgic, whimsical poet. Write a short 4-line poem about a friendship between the slam book owner and their friend named "${name}". The friend wrote: "${message}". Their friendship level is ${friendshipLevel}/10. Make it warm, fun, and a little retro. Just the poem, no explanation.`
    const result = await model.generateContent(prompt)
    return result.response.text().trim()
  } catch {
    return 'Friends forever, side by side,\nThrough every laugh and every tide.\nThis memory etched in gold we keep,\nA friendship bond, forever deep.'
  }
}

export async function generateSmartPrompt(existingMessages: string[]): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const context = existingMessages.slice(-5).join('; ')
    const prompt = `You are helping run a digital slam book (like a school yearbook guestbook). Based on these recent entries: "${context}", generate ONE creative, fun, personalized question for the next friend to answer. Make it nostalgic, playful, and unique. Just the question, no explanation.`
    const result = await model.generateContent(prompt)
    return result.response.text().trim()
  } catch {
    return "What's your funniest memory with me?"
  }
}

export async function generateRoast(name: string, message: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const prompt = `You are a witty, friendly roast comedian. Give a 2-sentence playful roast of ${name} based on what they wrote: "${message}". Keep it fun and friendly, not mean. Just the roast.`
    const result = await model.generateContent(prompt)
    return result.response.text().trim()
  } catch {
    return `${name} — mysterious as ever! Even their slam book entry left us with more questions than answers! 😂`
  }
}

export async function computeCompatibility(msg1: string, msg2: string): Promise<number> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const prompt = `Compare these two friendship messages and score their emotional/personality compatibility from 0-100. Just output the number, nothing else.\nMessage 1: "${msg1}"\nMessage 2: "${msg2}"`
    const result = await model.generateContent(prompt)
    const num = parseInt(result.response.text().trim())
    return isNaN(num) ? 75 : Math.min(100, Math.max(0, num))
  } catch {
    return 75
  }
}
