export const COURSE_STORAGE_KEY = 'edvora-course-progress-v3'

const COURSE_STORAGE_KEYS = ['edvora-course-progress-v1', 'edvora-course-progress-v2', COURSE_STORAGE_KEY]
const LESSON_STORAGE_PREFIXES = [
  'edvora-lesson-progress-v1',
  'edvora-lesson-progress-v2',
  'edvora-lesson-progress-v3',
]

export function readCompletedLessonIds(): string[] {
  try {
    const saved = localStorage.getItem(COURSE_STORAGE_KEY)
    if (!saved) return []
    const parsed = JSON.parse(saved) as unknown
    if (!Array.isArray(parsed)) return []
    return Array.from(new Set(parsed.filter((value): value is string => typeof value === 'string')))
  } catch {
    return []
  }
}

export function writeCompletedLessonIds(next: string[]) {
  try {
    localStorage.setItem(COURSE_STORAGE_KEY, JSON.stringify(Array.from(new Set(next))))
  } catch {
    // Safari private mode and restrictive webviews may deny localStorage writes.
  }
}

export function readLessonProgress<T>(storageKey: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(storageKey)
    if (!saved) return fallback
    return JSON.parse(saved) as T
  } catch {
    return fallback
  }
}

export function writeLessonProgress<T>(storageKey: string, progress: T) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(progress))
  } catch {
    // Keep the lesson usable even if persistence is unavailable.
  }
}

export function addCompletedLessonId(lessonId: string) {
  const next = Array.from(new Set([...readCompletedLessonIds(), lessonId]))
  writeCompletedLessonIds(next)
  return next
}

export function clearCompletedLessonIds() {
  try {
    COURSE_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key))
  } catch {
    // The in-memory UI state is still reset by the caller.
  }
}

export function clearAllProgress() {
  clearCompletedLessonIds()

  try {
    Object.keys(localStorage).forEach((key) => {
      if (LESSON_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        localStorage.removeItem(key)
      }
    })
  } catch {
    // The in-memory UI state is still reset by the caller.
  }
}
