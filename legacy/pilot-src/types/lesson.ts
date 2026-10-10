export type StepType = 'theory' | 'interactive' | 'single_choice' | 'boss_fight'

export interface TextSegment {
  kind: 'text' | 'math'
  value: string
}

export interface LessonOption {
  id: string
  text?: string
  textParts?: TextSegment[]
  isCorrect: boolean
  feedback?: string
  feedbackParts?: TextSegment[]
}

export interface LessonQuiz {
  question?: string
  questionParts?: TextSegment[]
  options: LessonOption[]
}

export interface Step {
  id: string
  title: string
  titleParts?: TextSegment[]
  type: StepType
  theoryText?: string
  theoryParts?: TextSegment[]
  widgetType?: string
  quiz?: LessonQuiz
  hint?: string
  hintParts?: TextSegment[]
}

export interface Lesson {
  id: string
  title: string
  order: number
  steps: Step[]
}

export interface UserProgress {
  currentLessonId: string
  currentStepIndex: number
  completedLessonIds: string[]
}
