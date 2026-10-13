const BASE_URL = 'http://localhost:8000'

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, options)
  if (!res.ok) throw new Error(`Request failed: ${res.status} ${path}`)
  return res.json()
}

const postJSON = (path, body) =>
  request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

export function uploadFile(file) {
  const form = new FormData()
  form.append('file', file)
  return request('/upload', { method: 'POST', body: form })
}

export const transcribe = (id) => request(`/transcribe/${id}`, { method: 'POST' })
export const generate = (id) => request(`/generate/${id}`, { method: 'POST' })
export const getSegments = (id) => request(`/segments/${id}`)

// Eman's endpoints. Check the exact fields of /answer in /docs > Schemas > Answer.
export const sendAnswer = (segmentId, selected, isCorrect) =>
  postJSON('/answer', { segment_id: segmentId, selected, is_correct: isCorrect })
export const sendFlag = (segmentId) => request(`/flag/${segmentId}`, { method: 'POST' })
export const sendReplay = (segmentId) => request(`/replay/${segmentId}`, { method: 'POST' })