import { foundations } from './foundations'
import { meaningLessons } from './meaning'
import { investigationLessons } from './investigation'
import { formulaLessons } from './formulas'
import { consolidationLessons } from './consolidation'
import { withStories } from './stories'
import { shortenCourse } from './shortLessons'
import { previousLessonStepIds } from './previousCursors'
export { UNITS } from './schema'
export const topics=withStories([...foundations,...meaningLessons,...investigationLessons,...formulaLessons,...consolidationLessons])
export const lessons=shortenCourse(topics)
export function resolveLessonCursor(id:string,index=0){
  const current=lessons.find(l=>l.id===id)
  if(current)return {lesson:current,index:Math.max(0,Math.min(current.steps.length-1,Math.floor(index)))}
  const old=topics.find(l=>l.id===id)
  if(!old)return undefined
  const step=old.steps[Math.max(0,Math.min(old.steps.length-1,Math.floor(index)))]
  const lesson=lessons.find(l=>l.steps.some(s=>s.id===step.id))!
  return {lesson,index:lesson.steps.findIndex(s=>s.id===step.id)}
}
export const CURRICULUM_REVISION=3
export function resolvePreviousCursor(id:string,index=0){
  const previous=previousLessonStepIds[id]
  if(!previous)return resolveLessonCursor(id,index)
  const stepId=previous[Math.max(0,Math.min(previous.length-1,Math.floor(index)))]
  const lesson=lessons.find(l=>l.steps.some(s=>s.id===stepId))
  return lesson?{lesson,index:lesson.steps.findIndex(s=>s.id===stepId)}:resolveLessonCursor(id,index)
}
export const stepMap=new Map(lessons.flatMap(l=>l.steps.map(s=>[s.id,s] as const)))
export const totalSteps=lessons.reduce((n,l)=>n+l.steps.length,0)
export const totalInteractives=lessons.reduce((n,l)=>n+l.steps.filter(s=>s.kind==='explore').length,0)
export const totalScenes=lessons.reduce((n,l)=>n+l.steps.filter(s=>s.graph?.context).length,0)
