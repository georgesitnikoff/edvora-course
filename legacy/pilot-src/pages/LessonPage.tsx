import { useEffect, useState } from 'react'
import { LessonPlayer } from '../components/engine/LessonPlayer'
import { addCompletedLessonId, readLessonProgress, writeLessonProgress } from '../lib/courseProgress'
import type { Lesson, UserProgress } from '../types/lesson'

const STORAGE_KEY_PREFIX = 'edvora-lesson-progress-v3'

interface LessonPageProps {
  lesson: Lesson
  onBackHome: () => void
}

function initialProgress(lesson: Lesson): UserProgress {
  const fallback: UserProgress = {
    currentLessonId: lesson.id,
    currentStepIndex: 0,
    completedLessonIds: [],
  }
  const rawSaved = readLessonProgress<unknown>(`${STORAGE_KEY_PREFIX}:${lesson.id}`, fallback)
  if (!rawSaved || typeof rawSaved !== 'object') return fallback
  const saved = rawSaved as Partial<UserProgress>

  return {
    currentLessonId: lesson.id,
    currentStepIndex: typeof saved.currentStepIndex === 'number' && Number.isInteger(saved.currentStepIndex)
      ? Math.min(Math.max(saved.currentStepIndex, 0), Math.max(lesson.steps.length - 1, 0))
      : 0,
    completedLessonIds: Array.isArray(saved.completedLessonIds)
      ? saved.completedLessonIds.filter((id): id is string => typeof id === 'string')
      : [],
  }
}

export function LessonPage({ lesson, onBackHome }: LessonPageProps) {
  const storageKey = `${STORAGE_KEY_PREFIX}:${lesson.id}`
  const [progress, setProgress] = useState<UserProgress>(() => initialProgress(lesson))

  useEffect(() => {
    writeLessonProgress(storageKey, progress)
  }, [progress, storageKey])

  const handleComplete = () => {
    const nextCompleted = addCompletedLessonId(lesson.id)
    const completedProgress: UserProgress = {
      currentLessonId: lesson.id,
      currentStepIndex: 0,
      completedLessonIds: Array.from(new Set([...progress.completedLessonIds, ...nextCompleted])),
    }

    writeLessonProgress(storageKey, completedProgress)
    setProgress(completedProgress)
    onBackHome()
  }

  return (
    <LessonPlayer
      lesson={lesson}
      progress={progress}
      onProgressChange={setProgress}
      onExit={onBackHome}
      onComplete={handleComplete}
    />
  )
}
