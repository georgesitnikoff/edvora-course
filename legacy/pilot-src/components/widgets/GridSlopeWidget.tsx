import { useMemo, useState } from 'react'
import { InlineMath } from 'react-katex'

const GRID_MIN = -1
const GRID_MAX = 6
const CELL = 36

type GridVariant = 'intro' | 'practice' | 'prototype'

const VARIANTS: Record<GridVariant, {
  functionValue: (x: number) => number
  derivative: (x: number) => number
  x0: number
}> = {
  intro: {
    functionValue: (x) => x ** 2 - 2 * x + 4,
    derivative: (x) => 2 * x - 2,
    x0: 2,
  },
  practice: {
    functionValue: (x) => x ** 2 - 4 * x + 7,
    derivative: (x) => 2 * x - 4,
    x0: 2.5,
  },
  prototype: {
    functionValue: (x) => x ** 2 - x + 2,
    derivative: (x) => 2 * x - 1,
    x0: 2.5,
  },
}

function xToSvg(value: number) {
  return (value - GRID_MIN) * CELL
}

function yToSvg(value: number) {
  return (GRID_MAX - value) * CELL
}

export function GridSlopeWidget({ variant = 'intro' }: { variant?: GridVariant }) {
  const [showTriangle, setShowTriangle] = useState(false)
  const config = VARIANTS[variant]

  const pointA = { x: 1, y: config.functionValue(1) }
  const pointB = { x: 4, y: config.functionValue(4) }

  const dx = pointB.x - pointA.x
  const dy = pointB.y - pointA.y
  const curve = config.functionValue

  const svgPoints = useMemo(() => {
    const points: { x: number; y: number }[] = []
    for (let y = GRID_MIN; y <= GRID_MAX; y += 1) {
      for (let x = GRID_MIN; x <= GRID_MAX; x += 1) {
        points.push({ x: xToSvg(x), y: yToSvg(y) })
      }
    }
    return points
  }, [])

  const curvePath = useMemo(() => {
    const path: string[] = []
    for (let x = GRID_MIN; x <= GRID_MAX; x += 0.2) {
      const y = curve(x)
      const px = xToSvg(x)
      const py = yToSvg(y)
      path.push(`${x === GRID_MIN ? 'M' : 'L'} ${px.toFixed(2)} ${py.toFixed(2)}`)
    }
    return path.join(' ')
  }, [curve])

  const ax = xToSvg(pointA.x)
  const ay = yToSvg(pointA.y)
  const bx = xToSvg(pointB.x)
  const by = yToSvg(pointB.y)
  const width = (GRID_MAX - GRID_MIN + 1) * CELL

  const slopeValue = Number((dy / dx).toFixed(3))

  return (
    <div className="space-y-3 rounded-[28px] border border-slate-200 bg-slate-50 p-3">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <svg viewBox={`0 0 ${width} ${width}`} className="h-[260px] w-full">
          {svgPoints.map((point, index) => (
            <circle key={`grid-${index}`} cx={point.x} cy={point.y} r={1.2} fill="#dfe7f4" />
          ))}

          <line x1={0} y1={yToSvg(0)} x2={width} y2={yToSvg(0)} stroke="#94a3b8" strokeWidth="1.5" />
          <line x1={xToSvg(0)} y1={0} x2={xToSvg(0)} y2={width} stroke="#94a3b8" strokeWidth="1.5" />

          <path d={curvePath} fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />

          <line x1={ax} y1={ay} x2={bx} y2={by} stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" />

          {showTriangle && (
            <polygon
              points={`${ax},${ay} ${bx},${ay} ${bx},${by}`}
              fill="rgba(124, 58, 237, 0.12)"
              stroke="rgba(124, 58, 237, 0.45)"
              strokeWidth="1.5"
            />
          )}

          <circle cx={ax} cy={ay} r={8} fill="#10b981" stroke="#fff" strokeWidth="3" />
          <circle cx={bx} cy={by} r={8} fill="#ef4444" stroke="#fff" strokeWidth="3" />

          <text x={ax + 10} y={ay - 12} fontSize="11" fill="#047857">A</text>
          <text x={bx + 10} y={by - 12} fontSize="11" fill="#b91c1c">B</text>
        </svg>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setShowTriangle((prev) => !prev)}
          className="rounded-xl bg-violet-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-600 active:scale-[0.99]"
        >
          {showTriangle ? 'Скрыть треугольник' : 'Показать треугольник'}
        </button>

        <div className="text-right text-sm font-medium text-slate-600">
          <div><InlineMath math={`\\Delta x = ${Math.round(dx)}`} /></div>
          <div><InlineMath math={`\\Delta y = ${Math.round(dy)}`} /></div>
        </div>
      </div>

      <div className="rounded-2xl border border-violet-100 bg-violet-50 px-3 py-2 text-sm text-violet-800">
        <InlineMath math={`\\tan \\alpha = \\frac{\\Delta y}{\\Delta x} = \\frac{y_2 - y_1}{x_2 - x_1} = ${Number(slopeValue.toFixed(2))}`} />
      </div>
    </div>
  )
}
