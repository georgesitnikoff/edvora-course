import { useMemo, useRef, useState } from 'react'

type TangentVariant = 'cubic' | 'motion'

const GRAPH_WIDTH = 360
const GRAPH_HEIGHT = 220

const VARIANTS: Record<TangentVariant, {
  minX: number
  maxX: number
  minY: number
  maxY: number
  initialX: number
  functionValue: (x: number) => number
  derivative: (x: number) => number
}> = {
  cubic: {
    minX: -3,
    maxX: 3,
    minY: -2,
    maxY: 2,
    initialX: 0.9,
    functionValue: (x) => 0.12 * x ** 3 - 0.8 * x,
    derivative: (x) => 0.36 * x ** 2 - 0.8,
  },
  motion: {
    minX: -1,
    maxX: 5,
    minY: -1,
    maxY: 5,
    initialX: 2,
    functionValue: (x) => -0.2 * (x - 2) ** 2 + 4,
    derivative: (x) => -0.4 * (x - 2),
  },
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function toCanvasX(x: number, minX: number, maxX: number) {
  return ((x - minX) / (maxX - minX)) * GRAPH_WIDTH
}

function toCanvasY(y: number, minY: number, maxY: number) {
  return GRAPH_HEIGHT - ((y - minY) / (maxY - minY)) * GRAPH_HEIGHT
}

export function TangentSlopeWidget({ variant = 'cubic' }: { variant?: TangentVariant }) {
  const config = VARIANTS[variant]
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [x0, setX0] = useState(config.initialX)

  const graphPoints = useMemo(() => {
    const points: string[] = []

    for (let i = 0; i <= 240; i += 1) {
      const x = config.minX + (i / 240) * (config.maxX - config.minX)
      const y = config.functionValue(x)
      const px = toCanvasX(x, config.minX, config.maxX)
      const py = toCanvasY(y, config.minY, config.maxY)
      points.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(2)} ${py.toFixed(2)}`)
    }

    return points.join(' ')
  }, [config])

  const pointY = config.functionValue(x0)
  const slope = config.derivative(x0)
  const tangentSlope = slope

  const xStart = config.minX
  const xEnd = config.maxX

  const tangentLineStart = {
    x: toCanvasX(xStart, config.minX, config.maxX),
    y: toCanvasY(pointY + tangentSlope * (xStart - x0), config.minY, config.maxY),
  }
  const tangentLineEnd = {
    x: toCanvasX(xEnd, config.minX, config.maxX),
    y: toCanvasY(pointY + tangentSlope * (xEnd - x0), config.minY, config.maxY),
  }

  const pointX = toCanvasX(x0, config.minX, config.maxX)
  const pointYCanvas = toCanvasY(pointY, config.minY, config.maxY)

  const slopeBadge =
    slope > 0.08
      ? { label: '▲ f\'(x) > 0', color: 'bg-emerald-500 text-white' }
      : slope < -0.08
        ? { label: '▼ f\'(x) < 0', color: 'bg-rose-500 text-white' }
        : { label: '● f\'(x) = 0', color: 'bg-amber-500 text-white' }

  const handlePointerMove = (clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const relativeX = clientX - rect.left
    const ratio = clamp(relativeX / rect.width, 0, 1)
    const nextX = config.minX + ratio * (config.maxX - config.minX)
    setX0(Number(nextX.toFixed(2)))
  }

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const firstTouch = event.touches[0]
    if (!firstTouch) return
    handlePointerMove(firstTouch.clientX)
  }

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    handlePointerMove(event.clientX)
  }

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        onPointerMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-sky-50 p-2"
      >
        <svg viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`} className="h-[240px] w-full select-none touch-none">
          <defs>
            <linearGradient id="graph-color" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
          </defs>

          {Array.from({ length: 7 }).map((_, index) => {
            const x = (index / 6) * GRAPH_WIDTH
            const y = (index / 6) * GRAPH_HEIGHT

            return (
              <g key={`grid-${index}`}>
                <line x1={x} x2={x} y1={0} y2={GRAPH_HEIGHT} stroke="#dbeafe" strokeWidth="0.7" />
                <line x1={0} x2={GRAPH_WIDTH} y1={y} y2={y} stroke="#dbeafe" strokeWidth="0.7" />
              </g>
            )
          })}

          <line x1={0} x2={GRAPH_WIDTH} y1={GRAPH_HEIGHT / 2} y2={GRAPH_HEIGHT / 2} stroke="#64748b" strokeWidth="1.2" />
          <line x1={GRAPH_WIDTH / 2} x2={GRAPH_WIDTH / 2} y1={0} y2={GRAPH_HEIGHT} stroke="#64748b" strokeWidth="1.2" />
          <path d={graphPoints} fill="none" stroke="url(#graph-color)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          <line
            x1={tangentLineStart.x}
            x2={tangentLineEnd.x}
            y1={tangentLineStart.y}
            y2={tangentLineEnd.y}
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeDasharray="8 6"
          />

          <circle cx={pointX} cy={pointYCanvas} r={7} fill="#1d4ed8" stroke="#ffffff" strokeWidth="3" />
          <circle cx={pointX} cy={pointYCanvas} r={15} fill="rgba(59,130,246,0.12)" />
          <circle cx={pointX} cy={pointYCanvas} r={24} fill="rgba(59,130,246,0.06)" />

          <text x={GRAPH_WIDTH - 12} y={GRAPH_HEIGHT / 2 - 10} textAnchor="end" fontSize="10" fill="#475569">x</text>
          <text x={GRAPH_WIDTH / 2 + 10} y={16} fontSize="10" fill="#475569">y</text>
        </svg>

        <div className={`absolute left-3 top-3 rounded-full px-2.5 py-1.5 text-[10px] font-semibold shadow-sm ${slopeBadge.color}`}>
          {slopeBadge.label}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2">
        <div className="mb-2 flex items-center justify-between text-[11px] font-medium text-slate-600">
          <span>Точка x₀</span>
          <span>{x0.toFixed(2)}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setX0((prev) => clamp(Number((prev - 0.25).toFixed(2)), config.minX, config.maxX))}
            className="h-10 w-10 rounded-xl bg-white text-lg font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200"
            aria-label="Уменьшить x0"
          >
            −
          </button>

          <input
            type="range"
            min={config.minX}
            max={config.maxX}
            step={0.01}
            value={x0}
            onChange={(event) => setX0(Number(event.target.value))}
            className="h-2 w-full accent-sky-500"
            aria-label="Положение точки x0"
          />

          <button
            type="button"
            onClick={() => setX0((prev) => clamp(Number((prev + 0.25).toFixed(2)), config.minX, config.maxX))}
            className="h-10 w-10 rounded-xl bg-white text-lg font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200"
            aria-label="Увеличить x0"
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}
