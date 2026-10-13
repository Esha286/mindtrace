import { useRef, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import Timeline from '../components/Timeline'
import QuizModal from '../components/QuizModal'
import { sendAnswer, sendFlag, sendReplay } from '../api'

// Convert Eman's segment into the shape QuizModal expects
function toCheckpoint(seg) {
  return {
    question: seg.question,
    options: seg.options,
    correct_index: 'ABCD'.indexOf(String(seg.correct_answer).trim().toUpperCase()),
  }
}

export default function PlayerPage() {
  const { state } = useLocation()
  const videoUrl = state?.videoUrl
  const name = state?.name
  const segments = state?.segments || []

  const videoRef = useRef(null)
  const askedRef = useRef(new Set())
  const watchedRef = useRef(new Set())
  const lastTimeRef = useRef(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [quizSeg, setQuizSeg] = useState(null)
  const [flagged, setFlagged] = useState(new Set())

  function handleLoadedMetadata() {
    setDuration(videoRef.current.duration)
  }

  function showQuiz(seg) {
    askedRef.current.add(seg.id)
    videoRef.current.pause()
    setQuizSeg(seg)
  }

  function handleTimeUpdate() {
    const v = videoRef.current
    const t = v.currentTime
    setCurrentTime(t)
    lastTimeRef.current = t

    const seg = segments.find((s) => t >= s.start_time && t < s.end_time)
    if (seg && !v.paused) watchedRef.current.add(seg.id)

    if (quizSeg || v.paused) return
    if (seg && seg.end_time - t < 0.5 && !askedRef.current.has(seg.id)) {
      showQuiz(seg)
    }
  }

  function handleSeeking() {
    const newTime = videoRef.current.currentTime
    if (newTime >= lastTimeRef.current - 1) return
    const seg = segments.find((s) => newTime >= s.start_time && newTime < s.end_time)
    if (seg && watchedRef.current.has(seg.id)) {
      sendReplay(seg.id).catch((e) => console.error('Replay failed', e))
    }
  }

  function handleEnded() {
    const last = segments[segments.length - 1]
    if (last && !askedRef.current.has(last.id)) showQuiz(last)
  }

  function handleSeek(time) {
    videoRef.current.currentTime = time
    videoRef.current.play()
  }

  function handleContinue(result) {
    const seg = quizSeg
    const letter = 'ABCD'[result.selected]
    sendAnswer(seg.id, letter, result.isCorrect).catch((e) =>
      console.error('Answer failed', e)
    )
    setQuizSeg(null)
    if (seg.end_time < duration - 0.5) {
      videoRef.current.currentTime = seg.end_time + 0.1
      videoRef.current.play()
    }
  }

  const currentSeg = segments.find(
    (s) => currentTime >= s.start_time && currentTime < s.end_time
  )

  function toggleUnresolved(seg) {
    const next = new Set(flagged)
    if (next.has(seg.id)) {
      next.delete(seg.id)
    } else {
      next.add(seg.id)
      sendFlag(seg.id).catch((e) => console.error('Flag failed', e))
    }
    setFlagged(next)
  }

  return (
    <main className="max-w-3xl mx-auto mt-8 px-4 pb-12">
      <Link to="/" className="text-indigo-600 hover:underline text-sm">
        &larr; Upload another file
      </Link>

      <h2 className="text-xl font-bold text-slate-800 mt-2 mb-4">
        {name || 'No file selected'}
      </h2>

      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onSeeking={handleSeeking}
          onEnded={handleEnded}
          className="w-full max-h-[50vh] rounded-xl bg-black"
        />
      ) : (
        <div className="w-full h-64 rounded-xl bg-slate-300 flex items-center justify-center text-slate-600">
          No video yet. Go back and upload a file.
        </div>
      )}

      <section className="mt-6">
        <h3 className="font-semibold text-slate-700 mb-2">Topic timeline</h3>
        <Timeline
          segments={segments}
          currentTime={currentTime}
          duration={duration}
          onSeek={handleSeek}
          flagged={flagged}
        />
      </section>

      {currentSeg && (
        <section className="mt-6 flex items-center justify-between bg-white rounded-xl shadow-sm p-4">
          <div>
            <p className="text-xs text-slate-500">Current topic</p>
            <p className="font-semibold text-slate-800">{currentSeg.title}</p>
          </div>
          <button
            onClick={() => toggleUnresolved(currentSeg)}
            className={`px-5 py-2 rounded-lg font-semibold transition ${
              flagged.has(currentSeg.id)
                ? 'bg-rose-600 text-white hover:bg-rose-700'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            {flagged.has(currentSeg.id)
              ? '🚩 Marked unresolved (click to undo)'
              : 'Mark as unresolved'}
          </button>
        </section>
      )}

      {quizSeg && (
        <QuizModal
          topic={quizSeg.title}
          checkpoint={toCheckpoint(quizSeg)}
          onContinue={handleContinue}
        />
      )}
    </main>
  )
}