import type { Lesson,Step } from './schema'
import { assemblyPractice,checkpointDrafts,introduction } from './checkpoints'
import { lessonMeta } from './lessonMeta'
import { withFormulaBridges } from './bridges'
import { editStep } from './editorial'

function finalParts(steps:Step[]):Step[][]{
  const graphSet=new Set(['C01','C06','S01','S02','S03','S06',...Array.from({length:6},(_,i)=>'S'+String(i+9).padStart(2,'0')),...Array.from({length:4},(_,i)=>'S'+(i+31))])
  const motionSet=new Set(['C05','S05','S07','S08',...Array.from({length:12},(_,i)=>'S'+(i+38))])
  return [steps.filter(s=>graphSet.has(s.id.slice(-3))),steps.filter(s=>!graphSet.has(s.id.slice(-3))&&!motionSet.has(s.id.slice(-3))),steps.filter(s=>motionSet.has(s.id.slice(-3)))]
}
export function shortenCourse(topics:Lesson[]):Lesson[]{
  const result:Lesson[]=[]
  for(const topic of topics){
    const steps=withFormulaBridges(topic.number,topic.steps,topic.skills[0])
    // Add coordinate assembly beside the matching worked examples, before practice.
    const assembly=assemblyPractice(topic.number)
    if(assembly.length){const after=steps.findIndex(s=>s.id===topic.id+'-S07')+1;steps.splice(after,0,...assembly)}
    const split=Math.ceil(steps.length/2)
    const parts=topic.number===24?finalParts(steps):[steps.slice(0,split),steps.slice(split)]
    parts.forEach((content,part)=>{
      const id=topic.id+'-'+String.fromCharCode(97+part),number=result.length+1
      const [title,description]=lessonMeta[number-1]
      const intro={...introduction(title,description,part),id:id+'-I01',skill:topic.skills[0]}
      const checks=checkpointDrafts(topic.number,part).map((draft,i)=>{
        if(draft.kind==='choice'&&draft.choices){
          const correct=draft.choices[Number(draft.answer)],shift=(number+i)%draft.choices.length
          const choices=[...draft.choices.slice(shift),...draft.choices.slice(0,shift)]
          draft={...draft,choices,answer:choices.indexOf(correct)}
        }
        return {...draft,id:id+'-Q0'+(i+1),skill:topic.skills[0],checkpoint:true} as Step
      })
      const lesson:Lesson={...topic,id,number,title,description,topic:topic.number,part:part+1,prerequisites:result.length?[result[result.length-1].id]:[],steps:[intro,...content,...checks].map(editStep)}
      if(lesson.steps.length<20||lesson.steps.length>30)throw new Error(id+': нужно 20–30 этапов, сейчас '+lesson.steps.length)
      result.push(lesson)
    })
  }
  return result
}
