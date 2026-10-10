import { useState } from 'react'

export default function QuizModal({ topic, checkpoint, onContinue }) {
  const [selected, setSelected] = useState(null)
  const answered = selected !== null
  const isCorrect = selected === checkpoint.correct_index

  function optionStyle(i) {
    if (!answered) return 'border-slate-300 hover:bg-indigo-50 hover:border-indigo-400'
    if (i === checkpoint.correct_index) return 'border-emerald-500 bg-emerald-50 text-emerald-800'
    if (i === selected) return 'border-rose-500 bg-rose-50 text-rose-800'
    return 'border-slate-200 text-slate-400'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 mb-1">
          Checkpoint: {topic}
        </p>
        <h3 className="text-lg font-bold text-slate-800 mb-4">{checkpoint.question}</h3>

        <div className="space-y-2">
          {checkpoint.options.map((opt, i) => (
            <button
              key={i}
              disabled={answered}
              onClick={() => setSelected(i)}
              className={`w-full text-left px-4 py-3 rounded-lg border-2 transition ${optionStyle(i)}`}
            >
              {opt}
            </button>
          ))}
        </div>

        {answered && (
          <div className="mt-5">
            <p className={`font-semibold mb-3 ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isCorrect
                ? 'Correct!'
                : `Wrong. The right answer is: ${checkpoint.options[checkpoint.correct_index]}`}
            </p>
            <button
              onClick={() => onContinue({ selected, isCorrect })}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  )
}