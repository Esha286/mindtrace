import { Routes, Route } from 'react-router-dom'
import UploadPage from './pages/UploadPage'
import PlayerPage from './pages/PlayerPage'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-indigo-600 text-white px-6 py-4 text-xl font-bold">
        MindTrace
      </header>
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/player" element={<PlayerPage />} />
      </Routes>
    </div>
  )
}