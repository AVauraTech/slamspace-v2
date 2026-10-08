'use client'
import React, { useState } from 'react'
import { sound } from '@/lib/sound'

interface Question {
  q: string
  options: string[]
  answer: number
  trivia: string
}

const QUESTIONS: Question[] = [
  {
    q: 'What was the ultimate sign of friendship in the early 2000s?',
    options: [
      'Putting them in your Top 8 on Myspace or Orkut Scrapbook',
      'Sending a 5-second Bluetooth song transfer',
      'Giving them the glitter gel pen during recess',
      'All of the above! 🌟',
    ],
    answer: 3,
    trivia: 'The golden holy trinity of early 2000s camaraderie!',
  },
  {
    q: 'What sound made everyone instantly hold their breath while waiting for dial-up internet?',
    options: [
      'The Windows XP startup chime',
      'Screeching modem handshake noise 📶',
      'MSN Messenger nudge buzzer',
      'The CD-ROM tray closing',
    ],
    answer: 1,
    trivia: 'Pshhhkkkkkkrrrrkbingbingbing... 56kbps pure suspense!',
  },
  {
    q: 'In classic slam books, what question sparked the most scandalous gasps in school?',
    options: [
      '“What is your favourite colour?”',
      '“Who is your secret crush? 😉”',
      '“What do you want to become?”',
      '“Describe our friendship in one word”',
    ],
    answer: 1,
    trivia: 'Friends would fold the corner of the page or use code names!',
  },
  {
    q: 'Which artifact was essential for decorating a handwritten slam book?',
    options: [
      'Fluorescent scented gel pens & glitter glue ✨',
      'Stickers torn from notebook covers',
      'Washi tape & cut-out magazines',
      'Every single one in the pencil box!',
    ],
    answer: 3,
    trivia: 'Your hands would be covered in metallic ink by period 4!',
  },
  {
    q: 'If your friendship level in this slam book is a 10/10, what does it legally guarantee?',
    options: [
      'Free snacks for life',
      'Lifelong partner in crime & endless laughter',
      'First listen on every secret playlist',
      'Immunity from all playful roasts',
    ],
    answer: 1,
    trivia: 'Certified forever besties, sealed in ink and memory!',
  },
]

export default function TriviaGame({ onClose }: { onClose: () => void }) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  const currentQ = QUESTIONS[currentIdx]

  const handleSelect = (idx: number) => {
    if (showAnswer) return
    setSelectedOpt(idx)
    setShowAnswer(true)
    sound.playClick()

    if (idx === currentQ.answer) {
      setScore(s => s + 1)
      sound.playStickerPop()
    }
  }

  const handleNext = () => {
    sound.playClick()
    if (currentIdx + 1 < QUESTIONS.length) {
      setCurrentIdx(i => i + 1)
      setSelectedOpt(null)
      setShowAnswer(false)
    } else {
      setIsFinished(true)
      sound.playChime()
    }
  }

  const handleRestart = () => {
    setCurrentIdx(0)
    setSelectedOpt(null)
    setScore(0)
    setShowAnswer(false)
    setIsFinished(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 shadow-2xl max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-amber-600 hover:text-amber-900 text-lg w-8 h-8 rounded-full hover:bg-amber-100 flex items-center justify-center transition"
          aria-label="Close"
        >
          ✕
        </button>

        {!isFinished ? (
          <div>
            <div className="text-center mb-4">
              <span className="text-3xl">🎮</span>
              <h3 className="font-indie text-2xl font-bold text-amber-900">
                Nostalgia Bestie Trivia
              </h3>
              <p className="font-indie text-xs text-amber-700">
                Question {currentIdx + 1} of {QUESTIONS.length} • Score: {score}
              </p>
            </div>

            {/* Question card */}
            <div className="bg-white/80 border border-amber-200 rounded-2xl p-4 shadow-sm mb-4">
              <p className="font-indie text-amber-950 text-base font-bold leading-snug">
                {currentQ.q}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-2 mb-4">
              {currentQ.options.map((opt, i) => {
                let btnStyle = 'bg-white/70 border-amber-200 text-amber-900 hover:bg-amber-100/80'
                if (showAnswer) {
                  if (i === currentQ.answer) {
                    btnStyle = 'bg-green-100 border-green-400 text-green-900 font-bold'
                  } else if (i === selectedOpt) {
                    btnStyle = 'bg-red-100 border-red-300 text-red-900 line-through'
                  } else {
                    btnStyle = 'bg-gray-50 border-gray-200 text-gray-400 opacity-60'
                  }
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    disabled={showAnswer}
                    className={`w-full text-left font-indie text-sm p-3 rounded-xl border transition flex items-center gap-2 ${btnStyle}`}
                  >
                    <span className="font-bold text-xs bg-amber-200/60 rounded px-1.5 py-0.5">
                      {['A', 'B', 'C', 'D'][i]}
                    </span>
                    <span>{opt}</span>
                  </button>
                )
              })}
            </div>

            {/* Trivia snippet after answering */}
            {showAnswer && (
              <div className="bg-amber-100/80 border border-amber-300 rounded-xl p-3 mb-4 text-xs font-indie text-amber-800">
                💡 <span className="italic">{currentQ.trivia}</span>
              </div>
            )}

            {showAnswer && (
              <button
                onClick={handleNext}
                className="w-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-indie text-sm font-bold py-2.5 rounded-xl shadow transition"
              >
                {currentIdx + 1 < QUESTIONS.length ? 'Next Question →' : 'See Results 🌟'}
              </button>
            )}
          </div>
        ) : (
          /* Results screen with badge award */
          <div className="text-center py-2">
            <span className="text-5xl animate-bounce inline-block mb-2">🎖️</span>
            <h3 className="font-indie text-2xl font-bold text-amber-900">
              Quiz Completed!
            </h3>
            <p className="font-indie text-base text-amber-800 mt-1">
              You scored <span className="font-bold text-xl text-amber-600">{score}</span> out of {QUESTIONS.length}
            </p>

            {/* Badge earned */}
            <div className="my-5 bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 border-2 border-amber-400 rounded-2xl p-4 shadow-md">
              <div className="text-3xl mb-1">
                {score >= 4 ? '👑' : score >= 2 ? '📼' : '🌟'}
              </div>
              <p className="font-indie font-bold text-base text-amber-900">
                {score >= 4
                  ? 'Title: 2000s Nostalgia Royalty'
                  : score >= 2
                  ? 'Title: Certified Mixtape Master'
                  : 'Title: Honorary Slam Book Rookie'}
              </p>
              <p className="font-indie text-xs text-amber-700 mt-1">
                {score >= 4
                  ? 'Your friendship and 2000s memory is unmatched! True OG Bestie!'
                  : 'Great vibes and fond memories all around!'}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleRestart}
                className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-800 font-indie text-sm py-2 rounded-xl border border-amber-300 transition"
              >
                Play Again 🔄
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-indie text-sm py-2 rounded-xl shadow transition"
              >
                Done ✨
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
