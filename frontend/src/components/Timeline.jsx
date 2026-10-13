const COLORS = [
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-sky-500',
  'bg-violet-500',
]

function fmt(sec) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function Timeline({ segments, currentTime, onSeek, flagged = new Set() }) {
  if (!segments.length) {
    return (
      <div className="h-16 rounded-xl border-2 border-dashed border-slate-300
                      flex items-center justify-center text-slate-400">
        Timeline will appear here
      </div>
    )
  }

  return (
    <div className="flex w-full gap-2">
      {segments.map((seg, i) => {
        const isActive = currentTime >= seg.start_time && currentTime < seg.end_time
        return (
          <button
            key={seg.id}
            onClick={() => onSeek(seg.start_time)}
            className={`${COLORS[i % COLORS.length]} flex-1 text-white px-3 py-3 rounded-lg
                        text-left transition
                        ${isActive ? 'ring-4 ring-slate-800' : 'opacity-70 hover:opacity-100'}`}
            title={seg.title}
          >
            <span className="block text-sm font-semibold truncate">
              {flagged.has(seg.id) ? '🚩 ' : ''}{seg.title}
            </span>
            <span className="block text-xs opacity-90">
              {fmt(seg.start_time)} - {fmt(seg.end_time)}
            </span>
          </button>
        )
      })}
    </div>
  )
}