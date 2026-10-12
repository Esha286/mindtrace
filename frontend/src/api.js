// Set to false when Eman's backend is running
const USE_FAKE = true
const BASE_URL = 'http://localhost:8000'

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, options)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

function postJSON(path, body) {
  return request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// POST /upload
export async function uploadFile(file) {
  if (USE_FAKE) return { id: 1, filename: file.name }
  const form = new FormData()
  form.append('file', file)
  return request('/upload', { method: 'POST', body: form })
}

// GET /recordings/{id}/segments  ->  [{ id, title, start_time, end_time }]
export async function getSegments(recordingId) {
  if (USE_FAKE) return null // the pages still use their fake segments
  return request(`/recordings/${recordingId}/segments`)
}

// GET /segments/{id}/checkpoint  ->  { question, options, correct_index }
export async function getCheckpoint(segmentId) {
  if (USE_FAKE) return null
  return request(`/segments/${segmentId}/checkpoint`)
}

// POST /responses
export async function sendResponse(segmentId, selected, isCorrect) {
  if (USE_FAKE) return console.log('Answer:', segmentId, selected, isCorrect)
  return postJSON('/responses', { segment_id: segmentId, selected, is_correct: isCorrect })
}

// POST /flags
export async function sendFlag(segmentId) {
  if (USE_FAKE) return console.log('Unresolved:', segmentId)
  return postJSON('/flags', { segment_id: segmentId })
}

// POST /replay-events
export async function sendReplayEvent(segmentId) {
  if (USE_FAKE) return console.log('Replay:', segmentId)
  return postJSON('/replay-events', { segment_id: segmentId })
}