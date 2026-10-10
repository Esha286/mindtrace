import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function UploadPage() {
  const [file, setFile] = useState(null)
  const navigate = useNavigate()

  function handleUpload() {
    if (!file) return
    // Fake for now: pass the file to the player page.
    // Later this will call POST /upload on the backend.
    const url = URL.createObjectURL(file)
    navigate('/player', { state: { videoUrl: url, name: file.name } })
  }

  return (
    <main className="max-w-xl mx-auto mt-16 bg-white rounded-xl shadow p-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Upload a lecture</h2>
      <p className="text-slate-500 mb-6">Choose a video or audio file.</p>

      <input
        type="file"
        accept="video/*,audio/*"
        onChange={(e) => setFile(e.target.files[0])}
        className="block w-full mb-4 text-sm text-slate-600
                   file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                   file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
      />

      {file && <p className="text-sm text-slate-600 mb-4">Selected: {file.name}</p>}

      <button
        onClick={handleUpload}
        disabled={!file}
        className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold
                   hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Upload
      </button>
    </main>
  )
}