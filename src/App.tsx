import { useEffect,useState } from 'react'
import { CURRICULUM_REVISION,lessons,resolveLessonCursor,resolvePreviousCursor } from './curriculum'
import { CourseMap } from './v2/CourseMap'
import type { View } from './v2/CourseMap'
import { LessonPlayer } from './v2/LessonPlayer'
import { dueSteps,useProgress } from './v2/progress'
import { DiagnosticPlayer } from './v2/DiagnosticPlayer'
import './v2/diagnostic.css'

function route(){
  const p=new URLSearchParams(window.location.hash.slice(1)),raw=Number(p.get('step')??1)
  const resolved=(p.get('rev')===String(CURRICULUM_REVISION)?resolveLessonCursor:resolvePreviousCursor)(p.get('lesson')??'',Number.isFinite(raw)?Math.floor(raw)-1:0)
  const lesson=resolved?.lesson,index=resolved?.index??0
  const view:View=p.get('view')==='review'?'review':p.get('view')==='reference'?'reference':p.get('view')==='diagnostic'?'diagnostic':'course'
  return {lesson,index,review:p.get('review')==='1',view}
}
export default function App(){
  const [current,setCurrent]=useState(route)
  const store=useProgress()
  const {cursor}=store
  useEffect(()=>{const change=()=>setCurrent(route());window.addEventListener('hashchange',change);return()=>window.removeEventListener('hashchange',change)},[])
  useEffect(()=>{
    if(current.lesson&&!current.review)cursor(current.lesson.id,current.index)
  },[current.lesson,current.index,current.review,cursor])
  const navigate=(hash:string)=>{window.location.hash=hash;setCurrent(route())}
  const onLesson=(id:string,index=0,review=false)=>{
    if(review)store.updateStep(lessons.find(l=>l.id===id)!.steps[index].id,{input:'',selected:[],sequence:[],hintsShown:0,solutionShown:false,reviewWrongAttempts:0,reviewActive:true,reviewFinished:false})
    navigate('lesson='+id+'&step='+(index+1)+'&rev='+CURRICULUM_REVISION+(review?'&review=1':''))
  }
  const onView=(view:View)=>{navigate(view==='course'?'':'view='+view);window.scrollTo({top:0,behavior:'instant'})}
  if(current.view==='diagnostic'&&!current.lesson)return <DiagnosticPlayer data={store.progress.diagnostic} storageError={store.storageError} onChange={store.updateDiagnostic} onHome={()=>onView('course')} onLesson={id=>onLesson(id,store.progress.cursor[id]??0)}/>
  if(current.lesson)return <LessonPlayer key={current.lesson.id+'-'+current.index+(current.review?'-review':'')} lesson={current.lesson} index={current.index} review={current.review} progress={store.progress} storageError={store.storageError}
    updateStep={store.updateStep} onHome={()=>onView(current.review?'review':'course')} onStep={i=>onLesson(current.lesson!.id,i,current.review)}
    onNextLesson={()=>{const next=lessons[current.lesson!.number];if(next)onLesson(next.id,store.progress.cursor[next.id]??0);else onView('course')}}
    lastLesson={current.lesson.number===lessons.length} onReviewStep={i=>onLesson(current.lesson!.id,i,true)}
    onReviewDone={()=>{const due=dueSteps(store.progress).filter(x=>x.step.id!==current.lesson!.steps[current.index].id);if(due.length)onLesson(due[0].lesson.id,due[0].index,true);else onView('review')}}/>
  return <CourseMap progress={store.progress} storageError={store.storageError} view={current.view} onView={onView} onLesson={onLesson} onImport={store.importData}/>
}
