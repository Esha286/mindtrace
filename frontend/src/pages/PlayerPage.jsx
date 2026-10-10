import { useRef, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import Timeline from '../components/Timeline'
import QuizModal from '../components/QuizModal'

// Fake topics. Later: Eman's GET /recordings/{id}/segments
function makeFakeSegments(duration) {
  const titles = ['Introduction', 'Main Concept', 'Example', 'Summary']
  const part = duration / titles.length
  return titles.map((title, i) => ({
    id: i + 1,
    title,
    start_time: i * part,
    end_time: (i + 1) * part,
  }))
}

// Fake question. Later: Eman's GET /segments/{id}/checkpoint
function makeFakeCheckpoint(seg) {
  return {
    question: `What was the main idea of "${seg.title}"?`,
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correct_index: 1,
  }
}

export default function PlayerPage() {
  const { state } = useLocation()
  const videoUrl = state?.videoUrl
  const name = state?.name

  const videoRef = useRef(null)
  const askedRef = useRef(new Set()) // segment ids already quizzed
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [segments, setSegments] = useState([])
  const [quizSeg, setQuizSeg] = useState(null) // segment being quizzed

  function handleLoadedMetadata() {
    const d = videoRef.current.duration
    setDuration(d)
    setSegments(makeFakeSegments(d))
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
    if (quizSeg || v.paused) return

    const seg = segments.find((s) => t >= s.start_time && t < s.end_time)
    if (seg && seg.end_time - t < 0.5 && !askedRef.current.has(seg.id)) {
      showQuiz(seg)
    }
  }

  function handleEnded() {
    // Safety net: quiz the last topic if the video ended first
    const last = segments[segments.length - 1]
    if (last && !askedRef.current.has(last.id)) showQuiz(last)
  }

  function handleSeek(time) {
    videoRef.current.currentTime = time
    videoRef.current.play()
  }

  function handleContinue(result) {
    // Later: POST /responses with { segment_id, selected, isCorrect }
    console.log('Answer:', quizSeg.id, result)
    const seg = quizSeg
    setQuizSeg(null)
    if (seg.end_time < duration - 0.5) {
      videoRef.current.currentTime = seg.end_time + 0.1
      videoRef.current.play()
    }
  }

  return (
    <main className="max-w-4xl mx-auto mt-8 px-4 pb-12">
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
          onEnded={handleEnded}
          className="w-full rounded-xl bg-black"
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
        />
      </section>

      {quizSeg && (
        <QuizModal
          topic={quizSeg.title}
          checkpoint={makeFakeCheckpoint(quizSeg)}
          onContinue={handleContinue}
        />
      )}
    </main>
  )
}