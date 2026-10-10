import { useCallback,useEffect,useRef,useState } from 'react'
import { CURRICULUM_REVISION,lessons,resolveLessonCursor,resolvePreviousCursor,stepMap } from '../curriculum'
import { remapStoredLabel } from '../curriculum/editorial'
import type { Step } from '../curriculum/schema'
import { initialLab } from './labEngine'
import type { LabState } from './labEngine'
import { validateDiagnostic } from './diagnosticLogic'
import type { DiagnosticArchive,DiagnosticChange } from './diagnosticLogic'

export const PROGRESS_KEY='edvora-v2-progress'
const FORMAT='edvora-progress'
const SCHEMA=2
export type StepProgress={
  completed:boolean;attempts:number;wrongAttempts:number;input:string;selected:string[];sequence:string[];
  hintsShown:number;solutionShown:boolean;lab?:LabState;completedAt?:number;dueAt?:number;reviewSuccess:number;reviewWrongAttempts:number;reviewActive:boolean;reviewFinished:boolean
}
export type StepPatch=Partial<StepProgress>|((current:StepProgress)=>Partial<StepProgress>)
export type Progress={
  format:typeof FORMAT;schema:typeof SCHEMA;course:'derivatives-v2';updatedAt:number;
  curriculumRevision:number;
  steps:Record<string,StepProgress>;cursor:Record<string,number>;lastLesson?:string;legacy?:Record<string,string>;diagnostic?:DiagnosticArchive
}
export const emptyProgress=():Progress=>({format:FORMAT,schema:SCHEMA,course:'derivatives-v2',curriculumRevision:CURRICULUM_REVISION,updatedAt:Date.now(),steps:{},cursor:{}})
export const emptyStep=(step:Step):StepProgress=>({completed:false,attempts:0,wrongAttempts:0,input:'',selected:[],sequence:[],hintsShown:0,solutionShown:false,reviewSuccess:0,reviewWrongAttempts:0,reviewActive:false,reviewFinished:false,lab:step.graph?initialLab(step.graph):undefined})
const isObject=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)
function count(v:unknown,max=1e6):number{return typeof v==='number'&&Number.isFinite(v)&&v>=0?Math.min(max,Math.floor(v)):0}

export function validateProgress(raw:unknown):Progress{
  if(!isObject(raw)||raw.format!==FORMAT||raw.schema!==SCHEMA||raw.course!=='derivatives-v2'||!isObject(raw.steps))throw new Error('Это не файл прогресса Edvora v2.')
  const result=emptyProgress()
  result.updatedAt=count(raw.updatedAt,Date.now()+86400000)
  for(const [id,data]of Object.entries(raw.steps)){
    const step=stepMap.get(id)
    if(!step||!isObject(data))throw new Error('В файле есть неизвестный или повреждённый шаг: '+id)
    const s=emptyStep(step)
    s.completed=data.completed===true;s.attempts=count(data.attempts);s.wrongAttempts=count(data.wrongAttempts)
    s.input=typeof data.input==='string'?data.input.slice(0,100):''
    const labels=step.labels??[]
    s.selected=Array.isArray(data.selected)?[...new Set(data.selected.filter((v):v is string=>typeof v==='string').map(remapStoredLabel).filter(v=>labels.includes(v)))]:[]
    const sequence=Array.isArray(data.sequence)?data.sequence.filter((v):v is string=>typeof v==='string').map(remapStoredLabel).filter(v=>labels.includes(v)):[]
    s.sequence=step.kind==='formula'?sequence.slice(0,step.formula?.slotLabels.length):[...new Set(sequence)]
    s.hintsShown=count(data.hintsShown,step.hints.length);s.solutionShown=data.solutionShown===true
    s.reviewSuccess=count(data.reviewSuccess,20)
    s.reviewWrongAttempts=count(data.reviewWrongAttempts)
    s.reviewActive=data.reviewActive===true
    s.reviewFinished=data.reviewFinished===true
    for(const key of ['completedAt','dueAt']as const)if(typeof data[key]==='number'&&Number.isFinite(data[key])&&data[key]>=0)s[key]=data[key]as number
    if(step.graph&&isObject(data.lab)){
      const lab=initialLab(step.graph)
      if(step.graph.context&&typeof data.lab.sceneTime==='number'&&Number.isFinite(data.lab.sceneTime)&&data.lab.sceneTime>=step.graph.context.domain[0]&&data.lab.sceneTime<=step.graph.context.domain[1])lab.sceneTime=Number(data.lab.sceneTime.toFixed(2))
      for(const c of step.graph.controls??[]){
        const v=isObject(data.lab.values)?data.lab.values[c.param]:undefined
        if(typeof v==='number'&&c.values.includes(v))lab.values[c.param]=v
        const visited=isObject(data.lab.visited)?data.lab.visited[c.param]:undefined
        if(Array.isArray(visited))lab.visited[c.param]=[...new Set(visited.filter((v):v is number=>typeof v==='number'&&c.values.includes(v)))]
      }
      s.lab=lab
    }
    result.steps[id]=s
  }
  if(isObject(raw.cursor))for(const [id,index]of Object.entries(raw.cursor))if(typeof index==='number'){
    const resolved=raw.curriculumRevision===CURRICULUM_REVISION?resolveLessonCursor(id,count(index)):resolvePreviousCursor(id,count(index))
    if(resolved)result.cursor[resolved.lesson.id]=resolved.index
  }
  if(typeof raw.lastLesson==='string')result.lastLesson=(raw.curriculumRevision===CURRICULUM_REVISION?resolveLessonCursor:resolvePreviousCursor)(raw.lastLesson,isObject(raw.cursor)?count(raw.cursor[raw.lastLesson]):0)?.lesson.id
  if(isObject(raw.legacy))result.legacy=Object.fromEntries(Object.entries(raw.legacy).filter((entry):entry is [string,string]=>entry[0].startsWith('edvora-')&&typeof entry[1]==='string'))
  if(raw.diagnostic!==undefined)result.diagnostic=validateDiagnostic(raw.diagnostic)
  return result
}
export function loadProgress():{progress:Progress;error:string|null}{
  let raw:string|null=null
  try{
    raw=localStorage.getItem(PROGRESS_KEY)
    if(raw)return {progress:validateProgress(JSON.parse(raw)),error:null}
    const progress=emptyProgress(),legacy:Record<string,string>={}
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i)
      if(key&&key.startsWith('edvora-')&&key!==PROGRESS_KEY)legacy[key]=localStorage.getItem(key)??''
    }
    if(Object.keys(legacy).length)progress.legacy=legacy
    return {progress,error:null}
  }catch{
    let backedUp=false
    const progress=emptyProgress(),backupKey=PROGRESS_KEY+'-unreadable-'+Date.now()
    if(raw){
      progress.legacy={[backupKey]:raw}
      try{localStorage.setItem(backupKey,raw);backedUp=true}catch{/* Raw data remains available in the export. */}
    }
    return {progress,error:backedUp?'Не удалось прочитать прогресс. Исходное сохранение оставлено отдельной копией в браузере и включено в экспорт.':'Не удалось прочитать сохранение. Скачай резервную копию, если браузер блокирует запись.'}
  }
}
export function completedCount(progress:Progress,lessonId?:string){
  return (lessonId?lessons.find(l=>l.id===lessonId)?.steps??[]:lessons.flatMap(l=>l.steps)).filter(s=>progress.steps[s.id]?.completed).length
}
export function dueSteps(progress:Progress,now=Date.now()){
  return lessons.flatMap(l=>l.steps.map((s,index)=>({lesson:l,step:s,index}))).filter(({step})=>{
    const p=progress.steps[step.id]
    return p?.completed&&p.dueAt!==undefined&&p.dueAt<=now&&['number','choice','select','order','interval','formula'].includes(step.kind)
  }).sort((a,b)=>(progress.steps[a.step.id].dueAt??0)-(progress.steps[b.step.id].dueAt??0))
}
export function reviewed(p:StepProgress,step:Step,review=false):StepProgress{
  const now=Date.now(),practice=['number','choice','select','order','interval','formula'].includes(step.kind)
  const assisted=review?Boolean(p.reviewWrongAttempts||p.hintsShown||p.solutionShown):Boolean(p.wrongAttempts||p.hintsShown||p.solutionShown)
  const success=review?(assisted?0:p.reviewSuccess+1):p.reviewSuccess
  const days=assisted?0:review?[1,3,7,14,30][Math.min(success-1,4)]:1
  return {...p,completed:true,reviewActive:false,reviewFinished:review,completedAt:p.completedAt??now,reviewSuccess:success,dueAt:practice?now+days*86400000:undefined}
}
export function checkpointScore(steps:Step[],progress:Progress){
  const checks=steps.filter(s=>s.checkpoint)
  const independent=checks.filter(s=>{const p=progress.steps[s.id];return p?.completed&&!p.wrongAttempts&&!p.hintsShown&&!p.solutionShown})
  return {total:checks.length,independent:independent.length,mistakes:checks.filter(s=>!independent.includes(s))}
}
export function exportProgress(progress:Progress){
  const url=URL.createObjectURL(new Blob([JSON.stringify(progress,null,2)],{type:'application/json'}))
  const a=document.createElement('a');a.href=url;a.download='Edvora_progress_'+new Date().toISOString().slice(0,10)+'.json';a.click()
  setTimeout(()=>URL.revokeObjectURL(url),1000)
}
export function useProgress(){
  const [initial]=useState(()=>loadProgress())
  const [progress,setProgress]=useState(initial.progress)
  const [storageError,setStorageError]=useState<string|null>(initial.error)
  const live=useRef(progress)
  const unsaved=useRef(false)
  const mutate=useCallback((change:(p:Progress)=>Progress)=>{
    const next={...change(live.current),updatedAt:Date.now()}
    live.current=next;setProgress(next)
    try{localStorage.setItem(PROGRESS_KEY,JSON.stringify(next));unsaved.current=false;setStorageError(null)}
    catch{unsaved.current=true;setStorageError('Не удалось сохранить изменения в браузере. Скачай резервную копию, прежде чем закрывать вкладку.')}
  },[])
  const updateStep=useCallback((id:string,patch:StepPatch)=>{
    const step=stepMap.get(id);if(!step)return
    mutate(p=>{
      const current=p.steps[id]??emptyStep(step)
      const change=typeof patch==='function'?patch(current):patch
      return {...p,steps:{...p.steps,[id]:{...current,...change}}}
    })
  },[mutate])
  const cursor=useCallback((lesson:string,index:number)=>mutate(p=>({...p,lastLesson:lesson,cursor:{...p.cursor,[lesson]:index}})),[mutate])
  const updateDiagnostic=useCallback((change:DiagnosticChange)=>mutate(p=>({...p,diagnostic:change(p.diagnostic)})),[mutate])
  const importData=useCallback((raw:unknown)=>{const valid=validateProgress(raw);mutate(()=>valid)},[mutate])
  useEffect(()=>{
    const receive=(e:StorageEvent)=>{
      if(e.key!==PROGRESS_KEY||!e.newValue||unsaved.current)return
      try{const next=validateProgress(JSON.parse(e.newValue));if(next.updatedAt>live.current.updatedAt){live.current=next;setProgress(next);setStorageError(null)}}catch{setStorageError('Другая вкладка записала непонятный формат прогресса. Текущие данные доступны для экспорта.')}
    }
    window.addEventListener('storage',receive);return()=>window.removeEventListener('storage',receive)
  },[])
  return {progress,storageError,updateStep,cursor,importData,updateDiagnostic}
}
