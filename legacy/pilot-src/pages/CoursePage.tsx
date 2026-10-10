import { CheckCircle2, Download, Lock, Play } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { courseOverview } from '../data/derivativeCourse'
import { clearAllProgress, readCompletedLessonIds, readLessonProgress, writeCompletedLessonIds } from '../lib/courseProgress'

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface CoursePageProps {
  onSelectLesson: (lessonId: string) => void
}

export function CoursePage({ onSelectLesson }: CoursePageProps) {
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(() => readCompletedLessonIds())
  const [resetArmed, setResetArmed] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null)

  useEffect(() => {
    writeCompletedLessonIds(completedLessonIds)
  }, [completedLessonIds])

  useEffect(() => {
    if (!resetArmed) return
    const timeoutId = window.setTimeout(() => setResetArmed(false), 4000)
    return () => window.clearTimeout(timeoutId)
  }, [resetArmed])

  useEffect(() => {
    const captureInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as InstallPromptEvent)
    }
    const clearInstallPrompt = () => setInstallPrompt(null)

    window.addEventListener('beforeinstallprompt', captureInstallPrompt)
    window.addEventListener('appinstalled', clearInstallPrompt)
    return () => {
      window.removeEventListener('beforeinstallprompt', captureInstallPrompt)
      window.removeEventListener('appinstalled', clearInstallPrompt)
    }
  }, [])

  const completedCount = useMemo(
    () => courseOverview.filter((lesson) => completedLessonIds.includes(lesson.id)).length,
    [completedLessonIds],
  )

  const handleLessonClick = (lessonId: string, available: boolean) => {
    if (!available) return
    onSelectLesson(lessonId)
  }

  const handleReset = () => {
    if (!resetArmed) {
      setResetArmed(true)
      return
    }

    clearAllProgress()
    setCompletedLessonIds([])
    setResetArmed(false)
  }

  const handleInstall = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    await installPrompt.userChoice
    setInstallPrompt(null)
  }

  return (
    <div className="min-h-[100svh] overflow-x-hidden bg-slate-200 px-3 supports-[height:100dvh]:min-h-[100dvh] sm:flex sm:items-center sm:justify-center sm:py-6">
      <div
        className="mx-auto min-h-[100svh] w-full max-w-[480px] bg-white px-4 shadow-[0_20px_50px_rgba(15,23,42,0.12)] supports-[height:100dvh]:min-h-[100dvh] sm:min-h-0 sm:rounded-[32px] sm:border sm:border-slate-200"
        style={{
          paddingTop: 'max(1rem, env(safe-area-inset-top))',
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        }}
      >
        <header className="mb-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">ЕГЭ</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                Производная: графики и смысл
              </h1>
              <p className="mt-1 text-sm text-slate-500">Короткие уроки без регистрации</p>
            </div>
            <div className="rounded-full bg-sky-50 px-2.5 py-1.5 text-[11px] font-semibold text-sky-700">
              5 уроков
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-3">
            <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
              <span>Пройдено</span>
              <span className="font-semibold text-slate-900">
                {completedCount} / {courseOverview.length}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${(completedCount / courseOverview.length) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">Прогресс сохраняется только на этом устройстве</p>
          </div>

          {installPrompt && (
            <button
              type="button"
              onClick={handleInstall}
              className="flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 active:scale-[0.99]"
            >
              <Download className="h-4 w-4" />
              Установить на телефон
            </button>
          )}
        </header>

        <main className="space-y-3">
          {courseOverview.map((lesson) => {
            const done = completedLessonIds.includes(lesson.id)
            const available = lesson.available
            const savedProgress = readLessonProgress<{ currentStepIndex?: number }>(
              `edvora-lesson-progress-v3:${lesson.id}`,
              {},
            )
            const savedStepIndex = typeof savedProgress.currentStepIndex === 'number'
              ? Math.max(0, savedProgress.currentStepIndex)
              : 0

            return (
              <button
                key={lesson.id}
                type="button"
                onClick={() => handleLessonClick(lesson.id, available)}
                disabled={!available}
                className={[
                  'flex min-h-[72px] w-full touch-manipulation items-center gap-3 rounded-[24px] border p-3 text-left transition-all',
                  available
                    ? 'border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.99]'
                    : 'cursor-not-allowed border-slate-200 bg-slate-100 opacity-75',
                ].join(' ')}
              >
                <div
                  className={[
                    'flex h-11 w-11 items-center justify-center rounded-2xl',
                    done ? 'bg-emerald-500 text-white' : available ? 'bg-sky-50 text-sky-700' : 'bg-slate-200 text-slate-500',
                  ].join(' ')}
                >
                  {done ? <CheckCircle2 className="h-5 w-5" /> : available ? <Play className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-slate-900">{lesson.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {available
                      ? done
                        ? 'Повторить урок'
                        : savedStepIndex > 0
                          ? `Продолжить · шаг ${savedStepIndex + 1}`
                          : 'Начать урок'
                      : 'Скоро'}
                  </p>
                </div>

                {done && <span className="text-xs font-semibold text-emerald-600">Готово</span>}
              </button>
            )
          })}
        </main>

        <button
          type="button"
          onClick={handleReset}
          aria-label={resetArmed ? 'Подтвердить сброс всего прогресса' : 'Сбросить прогресс'}
          className={[
            'mt-5 min-h-11 w-full touch-manipulation rounded-2xl px-4 py-2 text-sm font-medium transition active:scale-[0.99]',
            resetArmed
              ? 'border border-rose-300 bg-rose-50 text-rose-700'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700',
          ].join(' ')}
        >
          {resetArmed ? 'Нажмите ещё раз, чтобы сбросить' : 'Сбросить прогресс'}
        </button>
      </div>
    </div>
  )
}
