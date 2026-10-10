import { DIAGNOSTIC_SET,DIAGNOSTIC_VERSION,diagnosticTasks } from '../curriculum/diagnostic'
import { lessons,UNITS } from '../curriculum'
import { parseAnswer } from '../math/exact'
export type DiagnosticAnswer={input:string;confidence?:'confident'|'unsure';skipped:boolean;submittedAt?:number}
export type DiagnosticRound={version:number;set:string;startedAt:number;completedAt?:number;cursor:number;answers:Record<string,DiagnosticAnswer>}
export type DiagnosticArchive={current:DiagnosticRound;history:DiagnosticRound[]}
export type DiagnosticChange=(current:DiagnosticArchive|undefined)=>DiagnosticArchive
export const emptyDiagnosticAnswer=():DiagnosticAnswer=>({input:'',skipped:false})
export const newDiagnostic=():DiagnosticRound=>({version:DIAGNOSTIC_VERSION,set:DIAGNOSTIC_SET,startedAt:Date.now(),cursor:0,answers:{}})
export const diagnosticComplete=(r:DiagnosticRound)=>diagnosticTasks.every(t=>Boolean(r.answers[t.id]?.submittedAt))
export function correctDiagnostic(id:string,a?:DiagnosticAnswer){
  const task=diagnosticTasks.find(t=>t.id===id),n=a&&!a.skipped?parseAnswer(a.input):null
  return Boolean(task&&n!==null&&Math.abs(n-task.answer)<=Number.EPSILON*8*Math.max(1,Math.abs(task.answer)))
}
export function restartDiagnostic(d?:DiagnosticArchive):DiagnosticArchive{
  const previous=d?.current.completedAt?[...(d?.history??[]),d.current]:d?.history??[]
  // Keep the first measurement and the four latest repeats.
  const history=previous.length>5?[previous[0],...previous.slice(-4)]:previous
  return {current:newDiagnostic(),history}
}
export function diagnosticReport(r:DiagnosticRound){
  const rows=UNITS.map(unit=>{
    const tasks=diagnosticTasks.filter(t=>t.unit===unit.id)
    const correct=tasks.filter(t=>correctDiagnostic(t.id,r.answers[t.id]))
    const skipped=tasks.filter(t=>r.answers[t.id]?.skipped||!r.answers[t.id]?.submittedAt)
    const wrong=tasks.filter(t=>r.answers[t.id]?.submittedAt&&!r.answers[t.id]?.skipped&&!correctDiagnostic(t.id,r.answers[t.id]))
    const unsure=correct.filter(t=>r.answers[t.id]?.confidence==='unsure')
    const needs=[...wrong,...skipped,...unsure]
    const topics=[...new Set(needs.flatMap(t=>t.topics))].sort((a,b)=>a-b)
    const recommended=topics.map(topic=>lessons.find(l=>l.topic===topic)!).filter(Boolean)
    return {...unit,total:tasks.length,correct:correct.length,skipped:skipped.length,wrong:wrong.length,unsure:unsure.length,
      status:wrong.length?'recommended':skipped.length?'unmeasured':unsure.length?'practice':'strong',
      lessons:recommended,skills:[...new Set(needs.map(t=>t.skill))]}
  })
  return {rows,priority:rows.filter(r=>r.status!=='strong'),correct:diagnosticTasks.filter(t=>correctDiagnostic(t.id,r.answers[t.id])).length,
    skipped:diagnosticTasks.filter(t=>r.answers[t.id]?.skipped).length,total:diagnosticTasks.length}
}
const object=(v:unknown):v is Record<string,unknown>=>Boolean(v)&&typeof v==='object'&&!Array.isArray(v)
function validateRound(raw:unknown):DiagnosticRound{
  if(!object(raw)||raw.version!==DIAGNOSTIC_VERSION||raw.set!==DIAGNOSTIC_SET||!object(raw.answers)||typeof raw.startedAt!=='number'||!Number.isFinite(raw.startedAt)||raw.startedAt<=0)throw new Error('Повреждены данные входной диагностики.')
  const r:DiagnosticRound={version:DIAGNOSTIC_VERSION,set:DIAGNOSTIC_SET,startedAt:raw.startedAt,cursor:typeof raw.cursor==='number'&&Number.isFinite(raw.cursor)?Math.max(0,Math.min(diagnosticTasks.length-1,Math.floor(raw.cursor))):0,answers:{}}
  for(const [id,a]of Object.entries(raw.answers)){
    if(!diagnosticTasks.some(t=>t.id===id)||!object(a)||typeof a.input!=='string')throw new Error('В диагностике есть неизвестное или повреждённое задание.')
    const saved:DiagnosticAnswer={input:a.input.slice(0,64),skipped:a.skipped===true}
    if(a.confidence==='confident'||a.confidence==='unsure')saved.confidence=a.confidence
    if(typeof a.submittedAt==='number'&&Number.isFinite(a.submittedAt)&&a.submittedAt>0){
      if(!saved.skipped&&(parseAnswer(saved.input)===null||!saved.confidence))throw new Error('В диагностике сохранён некорректный ответ.')
      saved.submittedAt=a.submittedAt
    }
    r.answers[id]=saved
  }
  if(typeof raw.completedAt==='number'&&Number.isFinite(raw.completedAt)&&raw.completedAt>=r.startedAt){
    if(!diagnosticComplete(r))throw new Error('В завершённой диагностике отсутствуют ответы.')
    r.completedAt=raw.completedAt
  }
  return r
}
export function validateDiagnostic(raw:unknown):DiagnosticArchive{
  if(!object(raw)||!Array.isArray(raw.history))throw new Error('Повреждена история диагностики.')
  const history=raw.history.map(validateRound)
  if(history.some(r=>!r.completedAt)||history.length>5)throw new Error('Повреждена история диагностики.')
  return {current:validateRound(raw.current),history}
}
