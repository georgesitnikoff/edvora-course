import fs from 'node:fs/promises'
import {loadCourse} from './load-course.mjs'
const {course}=await loadCourse()
const {emptyProgress,emptyStep,reviewed}=await import('../.validation-runtime/v2/progress.mjs')
const p=emptyProgress(),lesson=course.lessons[0]
for(const step of lesson.steps.filter(s=>!s.checkpoint))p.steps[step.id]=reviewed(emptyStep(step),step)
p.lastLesson=lesson.id;p.cursor[lesson.id]=lesson.steps.length-3
await fs.writeFile('qa/near-complete-lesson.json',JSON.stringify(p,null,2))
