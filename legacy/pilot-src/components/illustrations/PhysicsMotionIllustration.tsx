type PhysicsVariant = 'intro' | 'velocity' | 'stop' | 'count' | 'summary'

function pathValue(t: number, variant: PhysicsVariant) {
  switch (variant) {
    case 'intro':
      return -0.7 * t ** 2 + 5.5 * t + 2
    case 'velocity':
      return 6 * t ** 2 - 48 * t + 17
    case 'stop':
      return -0.9 * t ** 2 + 7 * t + 1
    case 'count':
      return 0.25 * t ** 3 - 2.4 * t ** 2 + 7.5 * t + 4
    default:
      return 0.2 * t ** 3 - 2.1 * t ** 2 + 5.5 * t + 3
  }
}

function toSvgX(t: number) {
  return 20 + ((t - 0) / 12) * 260
}

function toSvgY(y: number) {
  const minY = -90
  const maxY = 30
  return 150 - ((y - minY) / (maxY - minY)) * 120
}

export function PhysicsMotionIllustration({ variant = 'intro' }: { variant?: PhysicsVariant }) {
  const path = Array.from({ length: 80 }, (_, i) => {
    const t = (i / 79) * 12
    const y = pathValue(t, variant)
    return `${i === 0 ? 'M' : 'L'} ${toSvgX(t).toFixed(2)} ${toSvgY(y).toFixed(2)}`
  }).join(' ')

  const points = { intro: [2, 4, 6], velocity: [3, 4, 5], stop: [2, 4, 6], count: [1, 3, 5, 7], summary: [2, 4, 6] }[variant]

  return (
    <svg viewBox="0 0 320 180" className="h-[180px] w-full rounded-2xl bg-slate-50">
      {Array.from({ length: 7 }).map((_, index) => (
        <line key={`v-${index}`} x1={(index / 6) * 320} x2={(index / 6) * 320} y1={0} y2={180} stroke="#e2e8f0" strokeWidth="0.8" />
      ))}
      {Array.from({ length: 5 }).map((_, index) => (
        <line key={`h-${index}`} x1={0} x2={320} y1={(index / 4) * 180} y2={(index / 4) * 180} stroke="#e2e8f0" strokeWidth="0.8" />
      ))}

      <path d={path} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
      <line x1="20" x2="300" y1="150" y2="150" stroke="#94a3b8" strokeWidth="1.2" />
      <line x1="20" x2="20" y1="20" y2="150" stroke="#94a3b8" strokeWidth="1.2" />

      <g>
        {points.map((t, index) => {
          const y = pathValue(t, variant)
          const cx = toSvgX(t)
          const cy = toSvgY(y)
          const color = index % 3 === 0 ? '#f59e0b' : index % 3 === 1 ? '#ef4444' : '#22c55e'
          return (
            <g key={`physics-${index}`}>
              <circle cx={cx} cy={cy} r="5" fill={color} />
              <line x1={cx} x2={cx} y1={cy} y2="150" stroke={color} strokeWidth="2" strokeDasharray="6 4" />
            </g>
          )
        })}
      </g>

      <text x="18" y="20" fill="#475569" fontSize="12" fontWeight="600">s(t)</text>
      <text x="218" y="25" fill="#475569" fontSize="12" fontWeight="600">v(t) = 0</text>
    </svg>
  )
}
