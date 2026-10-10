import { useLocation, Link } from 'react-router-dom'

export default function PlayerPage() {
  const { state } = useLocation()
  const videoUrl = state?.videoUrl
  const name = state?.name

  return (
    <main className="max-w-4xl mx-auto mt-8 px-4">
      <Link to="/" className="text-indigo-600 hover:underline text-sm">
        &larr; Upload another file
      </Link>

      <h2 className="text-xl font-bold text-slate-800 mt-2 mb-4">
        {name || 'No file selected'}
      </h2>

      {videoUrl ? (
        <video src={videoUrl} controls className="w-full rounded-xl bg-black" />
      ) : (
        <div className="w-full h-64 rounded-xl bg-slate-300 flex items-center justify-center text-slate-600">
          No video yet. Go back and upload a file.
        </div>
      )}

      <section className="mt-6">
        <h3 className="font-semibold text-slate-700 mb-2">Topic timeline</h3>
        <div className="h-16 rounded-xl border-2 border-dashed border-slate-300
                        flex items-center justify-center text-slate-400">
          Timeline will appear here
        </div>
      </section>
    </main>
  )
}