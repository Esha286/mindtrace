const COLORS = [
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-sky-500',
  'bg-violet-500',
]

export default function Timeline({ segments, currentTime, duration, onSeek }) {
  if (!segments.length || !duration) {
    return (
      <div className="h-16 rounded-xl border-2 border-dashed border-slate-300
                      flex items-center justify-center text-slate-400">
        Timeline will appear here
      </div>
    )
  }

  return (
    <div className="flex w-full gap-1">
      {segments.map((seg, i) => {
        const width = ((seg.end_time - seg.start_time) / duration) * 100
        const isActive = currentTime >= seg.start_time && currentTime < seg.end_time

        return (
          <button
            key={seg.id}
            onClick={() => onSeek(seg.start_time)}
            style={{ width: `${width}%` }}
            className={`${COLORS[i % COLORS.length]} text-white text-xs font-semibold
                        px-2 py-3 rounded-lg truncate transition
                        ${isActive ? 'ring-4 ring-slate-800 scale-y-110' : 'opacity-70 hover:opacity-100'}`}
            title={seg.title}
          >
            {seg.title}
          </button>
        )
      })}
    </div>
  )
}