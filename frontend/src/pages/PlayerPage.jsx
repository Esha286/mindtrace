import { useRef, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import Timeline from '../components/Timeline'

// Fake topics for now. Later these come from Eman's GET /recordings/{id}/segments.
// Times are in seconds as a fraction of the video, so they work for any file.
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

export default function PlayerPage() {
  const { state } = useLocation()
  const videoUrl = state?.videoUrl
  const name = state?.name

  const videoRef = useRef(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [segments, setSegments] = useState([])

  function handleLoadedMetadata() {
    const d = videoRef.current.duration
    setDuration(d)
    setSegments(makeFakeSegments(d))
  }

  function handleSeek(time) {
    videoRef.current.currentTime = time
    videoRef.current.play()
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
          onTimeUpdate={() => setCurrentTime(videoRef.current.currentTime)}
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
    </main>
  )
}