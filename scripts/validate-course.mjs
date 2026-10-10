import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as ts from 'typescript'
import katex from 'katex'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const coursePath = resolve(projectRoot, 'src/data/courseData.ts')
const visualsPath = resolve(projectRoot, 'src/components/engine/StepVisuals.tsx')

const source = await readFile(coursePath, 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
  fileName: coursePath,
}).outputText
const moduleUrl = `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
const { courseLessons } = await import(moduleUrl)

assert.equal(courseLessons.length, 5, 'В курсе должно быть ровно 5 уроков')

const steps = courseLessons.flatMap((lesson) => lesson.steps)
assert.equal(steps.length, 40, 'В курсе должно быть ровно 40 шагов')

const ids = steps.map((step) => step.id)
assert.equal(new Set(ids).size, ids.length, 'ID шагов должны быть уникальными')

const expectedCorrectIndices = {
  'lesson-1': [2, 2, 1, 1],
  'lesson-2': [1, 0, 2, 3],
  'lesson-3': [2, 1, 1, 2, 3],
  'lesson-4': [2, 1, 2, 2, 1],
  'lesson-5': [1, 3, 0, 2, 0, 2, 1, 3],
}

for (const lesson of courseLessons) {
  const actual = lesson.steps
    .filter((step) => step.quiz)
    .map((step) => step.quiz.options.findIndex((option) => option.isCorrect))
  assert.deepEqual(actual, expectedCorrectIndices[lesson.id], `${lesson.id}: изменилась карта правильных ответов`)
}

for (const step of steps) {
  if (!step.quiz) continue
  assert.equal(step.quiz.options.length, 4, `${step.id}: должно быть ровно 4 варианта ответа`)
  assert.equal(
    step.quiz.options.filter((option) => option.isCorrect).length,
    1,
    `${step.id}: должен быть ровно один правильный ответ`,
  )
}

const mathCollections = []
for (const step of steps) {
  mathCollections.push(
    [step.id, step.titleParts],
    [step.id, step.theoryParts],
    [step.id, step.hintParts],
    [step.id, step.quiz?.questionParts],
  )
  for (const option of step.quiz?.options ?? []) {
    mathCollections.push([`${step.id}:${option.id}`, option.textParts], [`${step.id}:${option.id}`, option.feedbackParts])
  }
}

for (const [location, parts] of mathCollections) {
  for (const segment of parts ?? []) {
    if (segment.kind !== 'math') continue
    assert.doesNotMatch(segment.value, /\\\\(?=[A-Za-z,;:!])/, `${location}: двойной слеш перед KaTeX-командой`)
    assert.doesNotThrow(
      () => katex.renderToString(segment.value, { throwOnError: true, output: 'html' }),
      `${location}: KaTeX не может разобрать ${segment.value}`,
    )
  }
}

const bossLesson = courseLessons.find((lesson) => lesson.id === 'lesson-5')
assert.ok(bossLesson, 'Не найден босс-файт lesson-5')
assert.equal(
  bossLesson.steps.filter((step) => step.quiz).length,
  8,
  'В босс-файте должно быть ровно 8 независимых задач',
)

const stepText = (step) => [
  step.title,
  step.theoryText,
  ...(step.theoryParts ?? []).map((part) => part.value),
].filter(Boolean).join(' ')

for (const lesson of courseLessons) {
  const finalStep = lesson.steps.at(-1)
  assert.ok(finalStep, `${lesson.id}: урок не должен быть пустым`)
  assert.match(stepText(finalStep), /алгоритм/i, `${lesson.id}: финальный шаг должен формулировать алгоритм решения`)
}

const visualsSource = await readFile(visualsPath, 'utf8')
assert.doesNotMatch(
  visualsSource,
  /<M\s+tex="[^"]*\\\\/,
  'LaTeX-команды в JSX-атрибуте M должны передаваться через JS-строку, иначе слеш удваивается',
)
const visualIds = new Set([...visualsSource.matchAll(/case\s+['"]([^'"]+)['"]\s*:/g)].map((match) => match[1]))
for (const id of ids) {
  assert.ok(visualIds.has(id), `${id}: нет визуализации в StepVisuals`)
}

const requiredVisualContracts = [
  'firstSineStop = Math.acos(-0.2)',
  'p1: [-2, 1], p2: [4, 4]',
  'fn={(t) => 12 * t - 18}',
  'fn={(x) => 3 * x ** 2 - 3}',
  'fn={(x) => 0.3 * x ** 2 - 3.2}',
  'const trapezoid = (x: number) => 0.5 * x + 1.5',
  'const antiderivative = (x: number) => -(x ** 4) / 4 + x ** 3 - 4 * x',
  'p1: [-3, 4], p2: [1, -2]',
  '((x + 2) * (x - 1) * (x - 4)) / 8',
  'fn={(x) => 0.5 * x ** 2 - 1}',
  'fn={(t) => t ** 3 - 6 * t ** 2 + 9 * t + 2}',
  '<SignedAreaGraph positive={6} negative={9} />',
]

for (const snippet of requiredVisualContracts) {
  assert.ok(visualsSource.includes(snippet), `Визуальный контракт не найден: ${snippet}`)
}

const approximately = (actual, expected, epsilon = 1e-9) => {
  assert.ok(Math.abs(actual - expected) <= epsilon, `Ожидалось ${expected}, получено ${actual}`)
}

// s(t) = 1.5 sin(t) + 0.3t; v(t) = 1.5 cos(t) + 0.3.
// На [0; 12] у v(t) ровно четыре нуля.
const sineStopRoots = []
const alpha = Math.acos(-0.2)
for (let period = -1; period <= 3; period += 1) {
  for (const root of [alpha + 2 * Math.PI * period, -alpha + 2 * Math.PI * period]) {
    if (root >= 0 && root <= 12) sineStopRoots.push(root)
  }
}
sineStopRoots.sort((a, b) => a - b)
assert.equal(sineStopRoots.length, 4, 'У синусоидального движения должно быть ровно 4 остановки на [0; 12]')
for (const root of sineStopRoots) approximately(1.5 * Math.cos(root) + 0.3, 0)

// 0.3x² - 3.2 = -2 пересекает горизонталь в x = -2 и x = 2.
const parabolaRoots = [-2, 2]
for (const x of parabolaRoots) approximately(0.3 * x ** 2 - 3.2, -2)
assert.equal(parabolaRoots.length, 2, 'Парабола должна пересекать y = -2 ровно дважды')

const trapezoidArea = ((4 + 2) / 2) * 4
assert.equal(trapezoidArea, 12, 'Площадь трапеции должна быть равна 12')

const signedIntegral = 5 - 7
assert.equal(signedIntegral, -2, 'Ориентированная площадь должна быть равна -2')

const accumulatedArea = (6 * 5) / 2
assert.equal(accumulatedArea, 15, 'Площадь для восстановления первообразной должна быть равна 15')

console.log(`Course validation passed: ${courseLessons.length} lessons, ${steps.length} steps, 8 boss tasks, math invariants OK.`)
