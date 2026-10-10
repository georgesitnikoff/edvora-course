import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronRight, RefreshCcw, Sparkles, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Lesson, UserProgress } from '../../types/lesson'
import { M } from '../Formula'
import { ProgressBar } from './ProgressBar'
import { RichText } from './RichText'
import { StepVisuals } from './StepVisuals'

interface LessonPlayerProps {
  lesson: Lesson
  progress: UserProgress
  onProgressChange: (next: UserProgress) => void
  onExit: () => void
  onComplete: () => void
}

export function LessonPlayer({ lesson, progress, onProgressChange, onExit, onComplete }: LessonPlayerProps) {
  const totalSteps = lesson.steps.length
  const currentStepIndex = Math.min(Math.max(progress.currentStepIndex, 0), Math.max(totalSteps - 1, 0))
  const currentStep = lesson.steps[currentStepIndex] ?? lesson.steps[0]
  const mainRef = useRef<HTMLElement>(null)

  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null)
  const [resultState, setResultState] = useState<'correct' | 'wrong' | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'auto' })
  }, [currentStepIndex])

  if (!currentStep) {
    return null
  }

  const canCheckAnswer = currentStep.quiz !== undefined && selectedAnswerId !== null
  const isLastStep = currentStepIndex >= totalSteps - 1

  const handleNext = () => {
    if (isLastStep) {
      onComplete()
      return
    }

    setSelectedAnswerId(null)
    setResultState(null)
    setSheetOpen(false)
    onProgressChange({
      ...progress,
      currentStepIndex: currentStepIndex + 1,
    })
  }

  const handleCheckAnswer = () => {
    if (!currentStep.quiz || !selectedAnswerId || resultState !== null) return

    const selected = currentStep.quiz.options.find((option) => option.id === selectedAnswerId)
    if (!selected) return

    setResultState(selected.isCorrect ? 'correct' : 'wrong')
    setSheetOpen(true)
  }

  const handleRetry = () => {
    setSelectedAnswerId(null)
    setResultState(null)
    setSheetOpen(false)
  }

  const primaryActionLabel = currentStep.quiz !== undefined
    ? 'Проверить'
    : isLastStep
      ? 'Завершить урок'
      : 'Понятно, дальше'
  const showResultSheet = currentStep.quiz !== undefined && sheetOpen && resultState !== null
  const selectedFeedback = currentStep.quiz?.options.find((option) => option.id === selectedAnswerId)?.feedbackParts
  const renderAnswerLabel = (option: NonNullable<typeof currentStep.quiz>['options'][number]) => {
    if (option.textParts) return <RichText segments={option.textParts} />

    const combinedText = option.text ?? ''
    const shouldUseFormula = combinedText.includes('\\') || combinedText.includes('^') || combinedText.includes('_') || /^-?\d+(\.\d+)?$/.test(combinedText)

    if (shouldUseFormula) return <M tex={combinedText} />
    return <span>{combinedText}</span>
  }

  return (
    <div className="flex h-[100svh] min-h-[100svh] items-center justify-center overflow-hidden overscroll-none bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_42%),linear-gradient(180deg,_#e2e8f0_0%,_#cbd5e1_100%)] supports-[height:100dvh]:h-[100dvh] supports-[height:100dvh]:min-h-[100dvh] sm:p-3">
      <div className="flex h-full w-full max-w-[480px] flex-col overflow-hidden bg-white shadow-[0_20px_60px_rgba(15,23,42,0.12)] sm:rounded-[32px] sm:border sm:border-slate-200">
        <header
          className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3 pb-3 sm:px-4"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
        >
          <button
            type="button"
            onClick={onExit}
            className="flex h-12 w-12 shrink-0 touch-manipulation items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 active:scale-95"
            aria-label="Закрыть урок и сохранить текущий шаг"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            <ProgressBar total={totalSteps} currentIndex={currentStepIndex} />
          </div>

          <div className="hidden items-center gap-2 rounded-full bg-amber-50 px-2.5 py-1.5 text-[11px] font-medium text-amber-700 min-[390px]:flex">
            <Sparkles className="h-3.5 w-3.5" />
            Производная
          </div>
        </header>

        <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-5 pt-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="space-y-5"
            >
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">{currentStep.type}</p>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  {currentStep.titleParts ? <RichText segments={currentStep.titleParts} /> : currentStep.title}
                </h1>
              </div>

              {currentStep.theoryParts && (
                <div className="rounded-3xl bg-slate-50 p-4 text-base leading-7 text-slate-700 shadow-inner shadow-slate-200/40">
                  <p className="text-balance"><RichText segments={currentStep.theoryParts} /></p>
                </div>
              )}

              <StepVisuals stepId={currentStep.id} />

              {currentStep.quiz && (
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold text-slate-900"><RichText segments={currentStep.quiz.questionParts} /></h2>
                  <div className="space-y-2">
                    {currentStep.quiz.options.map((option) => {
                      const isSelected = selectedAnswerId === option.id
                      const isIncorrect = resultState === 'wrong' && isSelected && !option.isCorrect

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            if (resultState === null) setSelectedAnswerId(option.id)
                          }}
                          disabled={resultState !== null}
                          aria-pressed={isSelected}
                          className={[
                            'flex min-h-[52px] w-full touch-manipulation items-center justify-between rounded-2xl border px-4 py-3 text-left text-base font-medium transition-all disabled:cursor-default disabled:opacity-100',
                            isSelected
                              ? 'border-sky-500 bg-sky-50 text-sky-800 shadow-sm'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99]',
                            isIncorrect ? 'border-rose-300 bg-rose-50 text-rose-700' : '',
                          ].join(' ')}
                        >
                          <span>{renderAnswerLabel(option)}</span>
                          {isSelected && <span className="h-5 w-5 shrink-0 rounded-full border border-sky-500 bg-sky-500" aria-hidden="true" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {currentStep.hintParts && currentStep.type !== 'boss_fight' && (
                <div className="rounded-2xl border border-sky-100 bg-sky-50 px-3 py-2 text-sm text-sky-700">
                  <RichText segments={currentStep.hintParts} />
                </div>
              )}

              {currentStep.type === 'boss_fight' && !currentStep.quiz && (
                <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-sky-500 p-5 text-white shadow-lg">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                    <Check className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-semibold">Урок пройден</h2>
                  <p className="mt-2 text-sm text-emerald-50">Сверься с алгоритмом выше — теперь ты можешь повторить его без подсказки.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer
          className="shrink-0 border-t border-slate-200 bg-white/95 px-3 pt-3 backdrop-blur-sm"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <AnimatePresence initial={false}>
            {showResultSheet && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                role="status"
                aria-live="polite"
                className={[
                  'mb-3 rounded-2xl border p-3',
                  resultState === 'correct'
                    ? 'border-emerald-200 bg-emerald-500 text-white'
                    : 'border-rose-200 bg-rose-500 text-white',
                ].join(' ')}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15">
                    {resultState === 'correct' ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-semibold">{resultState === 'correct' ? 'Правильно!' : 'Неправильно'}</p>
                    <p className="mt-1 text-sm text-current/90"><RichText segments={selectedFeedback} /></p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={() => {
              if (currentStep.quiz) {
                if (resultState === 'correct') {
                  handleNext()
                  return
                }
                if (resultState === 'wrong') {
                  handleRetry()
                  return
                }
                handleCheckAnswer()
                return
              }
              handleNext()
            }}
            disabled={currentStep.quiz !== undefined && resultState === null && !canCheckAnswer}
            className={[
              'flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-2xl px-4 py-3 text-base font-semibold transition-all',
              currentStep.quiz && resultState === 'wrong'
                ? 'bg-rose-500 text-white hover:bg-rose-600'
                : currentStep.quiz && resultState === 'correct'
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                  : 'bg-slate-900 text-white hover:bg-slate-800',
              currentStep.quiz !== undefined && resultState === null && !canCheckAnswer
                ? 'cursor-not-allowed bg-slate-200 text-slate-400'
                : 'active:scale-[0.99]',
            ].join(' ')}
          >
            {currentStep.quiz && resultState === 'wrong' ? (
              <><RefreshCcw className="h-4 w-4" /> Попробовать снова</>
            ) : currentStep.quiz && resultState === 'correct' ? (
              <><Check className="h-4 w-4" /> Продолжить</>
            ) : (
              <>
                {primaryActionLabel}
                {currentStep.quiz === undefined && !isLastStep && <ChevronRight className="h-4 w-4" />}
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  )
}
