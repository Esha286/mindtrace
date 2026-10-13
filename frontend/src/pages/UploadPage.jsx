import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadFile, transcribe, generate, getSegments } from '../api'

export default function UploadPage() {
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [status, setStatus] = useState('')
  const navigate = useNavigate()

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) setFile(dropped)
  }

 async function handleUpload() {
  if (!file) return
  try {
    setStatus('Uploading...')
    const up = await uploadFile(file)
    const id = up.id ?? up.recording_id

    setStatus('Processing... transcribing (this can take a minute)')
    await transcribe(id)

    setStatus('Processing... finding topics and questions')
    await generate(id)

    const segs = await getSegments(id)

    navigate('/player', {
      state: {
        videoUrl: URL.createObjectURL(file),
        name: file.name,
        recordingId: id,
        segments: segs,
      },
    })
  } catch (err) {
    console.error(err)
    setStatus('Error: ' + err.message)
  }
}

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-slate-800 mb-3">
          Learn smarter from every lecture
        </h1>
        <p className="text-slate-500 text-lg">
          Upload a lecture and MindTrace splits it into topics and quizzes you after each one.
        </p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`rounded-2xl border-2 border-dashed p-10 text-center bg-white transition
                    ${dragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300'}`}
      >
        <p className="text-slate-600 mb-4">
          {file ? `Selected: ${file.name}` : 'Drag and drop a video or audio file here'}
        </p>

        <label className="inline-block cursor-pointer bg-indigo-50 text-indigo-700
                          px-5 py-2 rounded-lg font-semibold hover:bg-indigo-100">
          Choose file
          <input
            type="file"
            accept="video/*,audio/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </label>

        <div className="mt-6">
          <button
            onClick={handleUpload}
            disabled={!file}
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold
                       hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Upload and start
          </button>
        </div>

        {status && <p className="mt-4 text-slate-600">{status}</p>}
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mt-10 text-center">
        {[
          ['1. Upload', 'Add your lecture video or audio.'],
          ['2. Topics', 'See the lecture split into topics.'],
          ['3. Quiz', 'Answer a question after each topic.'],
        ].map(([title, text]) => (
          <div key={title} className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-slate-700 mb-1">{title}</h3>
            <p className="text-sm text-slate-500">{text}</p>
          </div>
        ))}
      </div>
    </main>
  )
}