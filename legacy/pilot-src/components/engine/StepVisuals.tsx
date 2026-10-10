import { useState } from 'react'
import { M } from '../Formula'
import { SmartMathGraph } from './SmartMathGraph'

interface StepVisualsProps {
  stepId: string
}

const firstSineStop = Math.acos(-0.2)
const sineStopTimes = [
  firstSineStop,
  2 * Math.PI - firstSineStop,
  2 * Math.PI + firstSineStop,
  4 * Math.PI - firstSineStop,
]
const motion = (t: number) => 1.5 * Math.sin(t) + 0.3 * t

function NoteCard({
  title,
  children,
  tone = 'sky',
}: {
  title: string
  children: React.ReactNode
  tone?: 'sky' | 'emerald' | 'amber' | 'violet'
}) {
  const tones = {
    sky: 'border-sky-200 bg-gradient-to-br from-sky-50 via-white to-blue-50',
    emerald: 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50',
    amber: 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50',
    violet: 'border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50',
  }

  return (
    <div className={`rounded-[28px] border p-4 text-sm text-slate-700 shadow-sm ${tones[tone]}`}>
      <p className="font-semibold text-slate-950">{title}</p>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  )
}

function LabeledGraph({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1.5" aria-label={`График ${label}`}>
      <p className="px-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      {children}
    </section>
  )
}

function AreaExplorer() {
  const [rightBoundary, setRightBoundary] = useState(4)
  const leftBoundary = 1
  const integrand = (x: number) => 3 - x
  const area = 3 * (rightBoundary - leftBoundary) - 0.5 * (rightBoundary ** 2 - leftBoundary ** 2)

  return (
    <div className="space-y-3">
      <SmartMathGraph
        fn={integrand}
        rangeX={[1, 6]}
        rangeY={[-3, 4]}
        tangentAtX={rightBoundary}
        interactivePoint
        onPointChange={(x) => setRightBoundary(x)}
        shadedArea={{ fromX: leftBoundary, toX: rightBoundary, fn: integrand }}
      />
      <div className="rounded-2xl bg-sky-50 px-4 py-3 text-center text-sm text-sky-950" aria-live="polite">
        <M tex={`\\int_{1}^{${rightBoundary.toFixed(1)}}(3-x)\\,dx \\approx ${area.toFixed(2)}`} />
        <p className="mt-1 text-xs text-sky-700">Веди пальцем синюю точку: правая граница и площадь меняются вместе.</p>
      </div>
    </div>
  )
}

function SineStops() {
  return (
    <div className="space-y-3">
      <SmartMathGraph
        fn={motion}
        derivativeFn={(t) => 1.5 * Math.cos(t) + 0.3}
        rangeX={[0, 12]}
        rangeY={[-1, 5]}
        markedPoints={sineStopTimes.map((x) => ({
          x,
          y: motion(x),
          label: '',
          color: '#f59e0b',
        }))}
        markedLines={sineStopTimes.map((x) => ({
          p1: [x - 0.42, motion(x)],
          p2: [x + 0.42, motion(x)],
          color: '#f59e0b',
          style: 'dashed' as const,
        }))}
      />
      <p className="rounded-xl bg-amber-50 px-3 py-2 text-center text-xs font-semibold text-amber-800">Считай только настоящие горизонтальные касательные.</p>
    </div>
  )
}

function SignedAreaGraph({ positive = 5, negative = 7 }: { positive?: number; negative?: number }) {
  const signedShape = (x: number) => {
    if (x <= 1) return positive * x
    if (x <= 2) return positive * (2 - x)
    if (x <= 5) return -(negative / 9) * (x - 2)
    return -(negative / 9) * (8 - x)
  }

  return (
    <div className="space-y-2">
      <SmartMathGraph
        fn={signedShape}
        rangeX={[0, 8]}
        rangeY={[-Math.ceil(negative / 3) - 1, positive + 1]}
        shadedArea={{ fromX: 0, toX: 8, fn: signedShape, color: 'rgba(14,165,233,0.18)' }}
      />
      <div className="flex justify-center gap-2 text-xs font-semibold">
        <span className="rounded-xl bg-emerald-50 px-3 py-2 text-emerald-700">над OX: +{positive}</span>
        <span className="rounded-xl bg-rose-50 px-3 py-2 text-rose-700">под OX: −{negative}</span>
        <span className="rounded-xl bg-slate-100 px-3 py-2 text-slate-700">итог: {positive - negative}</span>
      </div>
    </div>
  )
}

function AlgorithmCard({ integral = false }: { integral?: boolean }) {
  return (
    <NoteCard title={integral ? 'Алгоритм для площади и первообразной' : 'Алгоритм чтения производной'} tone="emerald">
      <ol className="space-y-2 pl-5 marker:font-bold marker:text-emerald-600">
        {integral ? (
          <>
            <li>Разбей фигуру по нулям функции.</li>
            <li>Площади над OX бери со знаком «+», под OX — со знаком «−».</li>
            <li>Используй <M tex={'F(b)=F(a)+\\int_a^b f(x)\\,dx'} />.</li>
          </>
        ) : (
          <>
            <li>Определи, чей график дан: <M tex="f" /> или <M tex="f'" />.</li>
            <li>Свяжи наклон <M tex="f" /> со знаком <M tex="f'" />.</li>
            <li>Для экстремума проверь смену знака, а на отрезке — ещё и концы.</li>
          </>
        )}
      </ol>
    </NoteCard>
  )
}

export function StepVisuals({ stepId }: StepVisualsProps) {
  switch (stepId) {
    case 'lesson-1-step-1':
      return <SmartMathGraph fn={(x) => -0.15 * x ** 3 + 0.9 * x} rangeX={[-3, 3]} rangeY={[-2, 2]} />
    case 'lesson-1-step-2':
      return <SmartMathGraph fn={(x) => -0.15 * x ** 3 + 0.9 * x} derivativeFn={(x) => -0.45 * x ** 2 + 0.9} tangentAtX={0} interactivePoint onPointChange={() => undefined} rangeX={[-2.5, 2.5]} rangeY={[-2, 2]} />
    case 'lesson-1-step-3': {
      const fn = (x: number) => 0.1 * x ** 3 - 0.6 * x
      return <SmartMathGraph fn={fn} rangeX={[-3, 3]} rangeY={[-2, 2]} markedPoints={[-2.2, -0.8, 0.5, 2.2].map((x, index) => ({ x, y: fn(x), label: `x${index + 1}`, color: '#7c3aed' }))} />
    }
    case 'lesson-1-step-4':
      return <SmartMathGraph markedLines={[{ p1: [0, 0], p2: [6, 2], color: '#7c3aed' }]} markedPoints={[{ x: 0, y: 0, label: 'A', color: '#7c3aed' }, { x: 6, y: 2, label: 'B', color: '#7c3aed' }]} rangeX={[0, 8]} rangeY={[0, 4]} showSlopeTriangle />
    case 'lesson-1-step-5':
      return <SmartMathGraph markedLines={[{ p1: [-2, 1], p2: [4, 4], color: '#f59e0b' }]} markedPoints={[{ x: -2, y: 1, label: '(−2; 1)', color: '#f59e0b' }, { x: 4, y: 4, label: '(4; 4)', color: '#f59e0b' }]} rangeX={[-3, 5]} rangeY={[0, 5]} showSlopeTriangle />
    case 'lesson-1-step-6':
      return (
        <div className="grid gap-3">
          <LabeledGraph label="Первая: k₁ = −3/2"><SmartMathGraph markedLines={[{ p1: [-2, 3], p2: [2, -3], color: '#f97316' }]} rangeX={[-3, 3]} rangeY={[-4, 4]} height={155} /></LabeledGraph>
          <LabeledGraph label="Вторая: k₂ = 1/2"><SmartMathGraph markedLines={[{ p1: [-3, -1.5], p2: [3, 1.5], color: '#0ea5e9' }]} rangeX={[-3, 3]} rangeY={[-4, 4]} height={155} /></LabeledGraph>
        </div>
      )
    case 'lesson-1-step-7':
      return <SmartMathGraph fn={(x) => 3 * x ** 2 - 3} rangeX={[-3, 3]} rangeY={[-4, 25]} markedLines={[{ p1: [-3, 9], p2: [3, 9], color: '#f59e0b', style: 'dashed' }]} markedPoints={[-2, 2].map((x) => ({ x, y: 9, label: `${x}`, color: '#f59e0b' }))} />
    case 'lesson-1-step-8':
      return <AlgorithmCard />

    case 'lesson-2-step-1':
      return (
        <NoteCard title="Координата — не пройденный путь" tone="violet">
          <p><M tex="x(t)" /> может уменьшаться и быть отрицательной: это положение на оси.</p>
          <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-white/80 p-3 text-base"><M tex="x(t)" /><span>→</span><M tex="v(t)=x'(t)" /><span>→</span><M tex="a(t)=v'(t)" /></div>
          <p>Путь же только накапливается; его нельзя автоматически подставлять вместо координаты.</p>
        </NoteCard>
      )
    case 'lesson-2-step-2':
      return (
        <NoteCard title="Степень спускается вперёд" tone="sky">
          <div className="rounded-2xl bg-white/80 p-4 text-center text-lg"><M tex="(at^n)'=an t^{n-1}" /></div>
          <p className="text-center"><M tex="(2t^3-3t^2+5)'=6t^2-6t" /></p>
        </NoteCard>
      )
    case 'lesson-2-step-3':
      return <SmartMathGraph fn={(t) => 3 * t ** 2 - 18 * t + 4} derivativeFn={(t) => 6 * t - 18} tangentAtX={5} rangeX={[0, 7]} rangeY={[-25, 30]} markedPoints={[{ x: 5, y: -11, label: 't=5', color: '#f59e0b' }]} />
    case 'lesson-2-step-4':
      return (
        <div className="grid gap-3">
          <LabeledGraph label="x=t²: остановка и разворот"><SmartMathGraph fn={(t) => t ** 2} derivativeFn={(t) => 2 * t} tangentAtX={0} rangeX={[-2, 2]} rangeY={[-1, 4]} height={155} /></LabeledGraph>
          <LabeledGraph label="x=t³: остановка без разворота"><SmartMathGraph fn={(t) => t ** 3} derivativeFn={(t) => 3 * t ** 2} tangentAtX={0} rangeX={[-2, 2]} rangeY={[-5, 5]} height={155} /></LabeledGraph>
        </div>
      )
    case 'lesson-2-step-5':
      return <SineStops />
    case 'lesson-2-step-6':
      return (
        <div className="space-y-3">
          <SmartMathGraph fn={(t) => 12 * t - 18} rangeX={[0, 4]} rangeY={[-20, 32]} markedPoints={[{ x: 2, y: 6, label: 'a(2)=6', color: '#10b981' }]} />
          <div className="rounded-2xl bg-emerald-50 p-3 text-center text-sm font-semibold text-emerald-800"><M tex={'x(t)=2t^3-9t^2+12t \\Rightarrow v=6t^2-18t+12 \\Rightarrow a=12t-18'} /></div>
        </div>
      )
    case 'lesson-2-step-7':
      return (
        <NoteCard title="Алгоритм задачи о движении" tone="emerald">
          <ol className="space-y-2 pl-5"><li>Проверь: дана координата, скорость или ускорение.</li><li>Бери производную нужное число раз.</li><li>Подставляй момент только после дифференцирования.</li><li>Для разворота проверяй смену знака скорости.</li></ol>
        </NoteCard>
      )

    case 'lesson-3-step-1':
      return (
        <div className="grid gap-3">
          <LabeledGraph label="f(x)"><SmartMathGraph fn={(x) => 0.1 * x ** 3 - 0.5 * x} rangeX={[-4, 4]} rangeY={[-5, 5]} height={170} /></LabeledGraph>
          <LabeledGraph label="f′(x)=0,3x²−0,5"><SmartMathGraph fn={(x) => 0.3 * x ** 2 - 0.5} rangeX={[-4, 4]} rangeY={[-1.5, 4.5]} height={170} /></LabeledGraph>
        </div>
      )
    case 'lesson-3-step-2':
      return (
        <NoteCard title="Перевод с языка f′ на язык f" tone="sky">
          <p><M tex="f'(x)>0" /> — график <M tex="f" /> растёт.</p>
          <p><M tex="f'(x)<0" /> — график <M tex="f" /> убывает.</p>
          <p><M tex="f'(x)=0" /> — возможен экстремум, но нужна смена знака.</p>
        </NoteCard>
      )
    case 'lesson-3-step-3':
      return (
        <div className="grid gap-3">
          <LabeledGraph label="Дан f(x)=x³−3x"><SmartMathGraph fn={(x) => x ** 3 - 3 * x} rangeX={[-2, 2]} rangeY={[-3, 3]} height={170} /></LabeledGraph>
          <LabeledGraph label="Кандидат f′(x)=3x²−3"><SmartMathGraph fn={(x) => 3 * x ** 2 - 3} rangeX={[-2, 2]} rangeY={[-4, 10]} height={170} markedPoints={[{ x: -1, y: 0, label: '−1', color: '#f59e0b' }, { x: 1, y: 0, label: '1', color: '#f59e0b' }]} /></LabeledGraph>
        </div>
      )
    case 'lesson-3-step-4':
      return <SmartMathGraph fn={(x) => (x + 2) * (x - 1)} rangeX={[-4, 3]} rangeY={[-4, 10]} markedPoints={[-2, 1].map((x) => ({ x, y: 0, label: `${x}`, color: '#7c3aed' }))} />
    case 'lesson-3-step-5':
      return <SmartMathGraph fn={(x) => -0.12 * (x + 0.5) ** 2 - 0.5} rangeX={[-3, 2]} rangeY={[-2.5, 1]} markedLines={[{ p1: [-3, 0], p2: [2, 0], color: '#ef4444', style: 'dashed' }]} markedPoints={[{ x: -3, y: -1.25, label: 'начало', color: '#10b981' }, { x: 2, y: -1.25, label: 'конец', color: '#64748b' }]} />
    case 'lesson-3-step-6':
      return <SmartMathGraph fn={(x) => (x - 1) * (x - 5)} rangeX={[0, 6]} rangeY={[-5, 6]} markedPoints={[1, 2, 3, 4, 5].map((x) => ({ x, y: (x - 1) * (x - 5), label: `${x}`, color: '#7c3aed' }))} />
    case 'lesson-3-step-7':
      return <SmartMathGraph fn={(x) => 0.3 * x ** 2 - 3.2} rangeX={[-4, 4]} rangeY={[-4, 3]} markedLines={[{ p1: [-4, -2], p2: [4, -2], color: '#f59e0b', style: 'dashed' }]} markedPoints={[-2, 2].map((x) => ({ x, y: -2, label: `${x}`, color: '#f59e0b' }))} />
    case 'lesson-3-step-8':
      return (
        <div className="space-y-3">
          <SmartMathGraph fn={(x) => x ** 2} rangeX={[-2, 2]} rangeY={[-1, 4]} markedPoints={[{ x: 0, y: 0, label: '0 без смены знака', color: '#f59e0b' }]} height={190} />
          <AlgorithmCard />
        </div>
      )

    case 'lesson-4-step-1':
      return (
        <NoteCard title="Формула Ньютона — Лейбница" tone="violet">
          <div className="rounded-2xl bg-white/80 p-4 text-center text-lg"><M tex={'F(b)-F(a)=\\int_a^b f(x)\\,dx'} /></div>
          <p>Участок над OX увеличивает интеграл, участок под OX — уменьшает.</p>
        </NoteCard>
      )
    case 'lesson-4-step-2': {
      const trapezoid = (x: number) => 0.5 * x + 1.5
      return <SmartMathGraph fn={trapezoid} rangeX={[0, 6]} rangeY={[0, 5]} shadedArea={{ fromX: 1, toX: 5, fn: trapezoid }} markedPoints={[{ x: 1, y: 2, label: '(1; 2)', color: '#7c3aed' }, { x: 5, y: 4, label: '(5; 4)', color: '#7c3aed' }]} />
    }
    case 'lesson-4-step-3':
      return <SignedAreaGraph />
    case 'lesson-4-step-4':
      return (
        <div className="space-y-3">
          <SmartMathGraph fn={(x) => (5 / 3) * Math.max(0, 3 - Math.abs(x - 5))} rangeX={[1, 9]} rangeY={[0, 6]} shadedArea={{ fromX: 2, toX: 8, fn: (x) => (5 / 3) * Math.max(0, 3 - Math.abs(x - 5)) }} />
          <div className="rounded-2xl bg-violet-50 p-3 text-center text-sm text-violet-900"><M tex="F(8)=-3+15=12" /></div>
        </div>
      )
    case 'lesson-4-step-5': {
      const antiderivative = (x: number) => -(x ** 4) / 4 + x ** 3 - 4 * x
      return <SmartMathGraph fn={antiderivative} rangeX={[-2, 3.5]} rangeY={[-9, 4]} markedPoints={[{ x: -1, y: antiderivative(-1), label: 'max, x=−1', color: '#10b981' }, { x: 2, y: antiderivative(2), label: 'перегиб, x=2', color: '#f59e0b' }]} markedLines={[{ p1: [-1.5, antiderivative(-1)], p2: [-0.5, antiderivative(-1)], color: '#10b981', style: 'dashed' }, { p1: [1.5, antiderivative(2)], p2: [2.5, antiderivative(2)], color: '#f59e0b', style: 'dashed' }]} />
    }
    case 'lesson-4-step-6':
      return <AreaExplorer />
    case 'lesson-4-step-7':
      return (
        <div className="space-y-3">
          <SignedAreaGraph />
          <AlgorithmCard integral />
        </div>
      )
    case 'lesson-4-step-8':
      return <AlgorithmCard integral />

    case 'lesson-5-step-1':
      return <SmartMathGraph markedLines={[{ p1: [-3, 4], p2: [1, -2], color: '#7c3aed' }]} markedPoints={[{ x: -3, y: 4, label: '(−3; 4)', color: '#7c3aed' }, { x: 1, y: -2, label: '(1; −2)', color: '#7c3aed' }]} rangeX={[-4, 2]} rangeY={[-3, 5]} showSlopeTriangle />
    case 'lesson-5-step-2': {
      const fn = (x: number) => x ** 3 - 3 * x
      return <SmartMathGraph fn={fn} rangeX={[-2.5, 2.5]} rangeY={[-9, 9]} markedPoints={[-2, -1, 0, 2].map((x) => ({ x, y: fn(x), label: `${x}`, color: '#7c3aed' }))} />
    }
    case 'lesson-5-step-3':
      return <SmartMathGraph fn={(x) => ((x + 2) * (x - 1) * (x - 4)) / 8} rangeX={[-3, 5]} rangeY={[-4, 5]} markedPoints={[-2, 1, 4].map((x) => ({ x, y: 0, label: `${x}`, color: '#7c3aed' }))} />
    case 'lesson-5-step-4':
      return <SmartMathGraph fn={(x) => -0.08 * (x + 2) ** 2 - 0.5} rangeX={[-5, 1]} rangeY={[-2, 1]} markedLines={[{ p1: [-5, 0], p2: [1, 0], color: '#ef4444', style: 'dashed' }]} />
    case 'lesson-5-step-5':
      return <SmartMathGraph fn={(x) => (x - 2) * (x - 6)} rangeX={[0, 8]} rangeY={[-5, 12]} markedPoints={[2, 3, 4, 5, 6].map((x) => ({ x, y: (x - 2) * (x - 6), label: `${x}`, color: '#7c3aed' }))} />
    case 'lesson-5-step-6':
      return <SmartMathGraph fn={(x) => 0.5 * x ** 2 - 1} rangeX={[-5, 5]} rangeY={[-2, 12]} markedLines={[{ p1: [-5, 7], p2: [5, 7], color: '#f59e0b', style: 'dashed' }]} />
    case 'lesson-5-step-7':
      return <SmartMathGraph fn={(t) => t ** 3 - 6 * t ** 2 + 9 * t + 2} derivativeFn={(t) => 3 * t ** 2 - 12 * t + 9} tangentAtX={4} rangeX={[0, 5]} rangeY={[-2, 24]} markedPoints={[{ x: 4, y: 6, label: 't=4', color: '#f59e0b' }]} />
    case 'lesson-5-step-8':
      return <SignedAreaGraph positive={6} negative={9} />
    case 'lesson-5-step-9':
      return (
        <NoteCard title="Экзаменационный маршрут" tone="emerald">
          <p>Определи объект → выбери связь → посчитай → проверь знак и границы.</p>
          <div className="rounded-2xl bg-white/80 p-3 text-center font-semibold text-emerald-900">График — это данные задачи, а не иллюстрация «для красоты».</div>
        </NoteCard>
      )
    default:
      return null
  }
}
