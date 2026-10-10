import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import katex from 'katex'
import {loadCourse} from './load-course.mjs'
const {course}=await loadCourse()
const {diagnosticTasks:tasks}=await import('../.validation-runtime/curriculum/diagnostic.mjs')
const logic=await import('../.validation-runtime/v2/diagnosticLogic.mjs')
const {emptyProgress,validateProgress,emptyStep}=await import('../.validation-runtime/v2/progress.mjs')
const {previousLessonStepIds}=await import('../.validation-runtime/curriculum/previousCursors.mjs')
const {formatNumber}=await import('../.validation-runtime/math/exact.mjs')
assert.equal(tasks.length,20);assert.equal(new Set(tasks.map(t=>t.id)).size,20)
assert.equal(tasks.filter(t=>t.source.kind!=='author').length,16)
assert.equal(tasks.filter(t=>t.source.kind==='author').length,4)
let formulaCount=0
for(const [i,t] of tasks.entries()){
  assert.ok(t.answer!==undefined&&Number.isFinite(t.answer),t.id)
  assert.ok(t.solution.length>100&&t.question.length>25,t.id)
  assert.ok(t.topics.length&&t.topics.every(n=>course.lessons.some(l=>l.topic===n)),t.id)
  if(i)assert.ok(t.level>=tasks[i-1].level,'Диагностика должна идти от простых задач к сложным')
  if(t.source.kind!=='author')assert.ok(t.source.year>=2023&&t.source.url.startsWith('https://doc.fipi.ru/')&&t.source.task&&t.source.page,t.id)
  if(t.image)await fs.access('public/'+t.image)
  for(const text of [t.question,t.solution])for(const match of text.matchAll(/\$([^$]+)\$/g)){katex.renderToString(match[1],{throwOnError:true});formulaCount++}
}
function round(overrides={}){
  const r=logic.newDiagnostic()
  for(const t of tasks)r.answers[t.id]={input:formatNumber(t.answer,8),confidence:'confident',skipped:false,submittedAt:Date.now(),...overrides}
  r.completedAt=Date.now();return r
}
const all=round(),good=logic.diagnosticReport(all)
assert.equal(good.correct,20);assert.equal(good.priority.length,0)
assert.ok(logic.diagnosticComplete(all))
const wrong=round({input:'999'}),bad=logic.diagnosticReport(wrong)
assert.equal(bad.correct,0);assert.deepEqual(bad.priority.map(r=>r.id),[1,2,3,4,5])
const skipped=round({input:'',skipped:true,confidence:undefined}),empty=logic.diagnosticReport(skipped)
assert.equal(empty.skipped,20);assert.ok(empty.rows.every(r=>r.status==='unmeasured'&&r.wrong===0))
const uncertain=logic.diagnosticReport(round({confidence:'unsure'}))
assert.equal(uncertain.correct,20);assert.ok(uncertain.rows.every(r=>r.status==='practice'))
const target=round()
for(const t of tasks.filter(t=>t.unit>=4))target.answers[t.id].input='999'
const specific=logic.diagnosticReport(target)
assert.deepEqual(specific.rows.slice(0,3).map(r=>r.status),['strong','strong','strong'])
assert.deepEqual(specific.priority.map(r=>r.id),[4,5])
assert.ok(specific.priority.every(r=>r.lessons.length&&r.lessons.every(l=>course.lessons.some(c=>c.id===l.id))))
assert.equal(logic.correctDiagnostic('D01',{input:'−7/4',skipped:false}),true)
assert.equal(logic.correctDiagnostic('D02',{input:'-1,4',skipped:false}),true)
assert.equal(logic.correctDiagnostic('D03',{input:'1.6',skipped:false}),true)
assert.equal(logic.correctDiagnostic('D01',{input:'0',skipped:false}),false)
assert.equal(logic.correctDiagnostic('D01',{input:'-7/0',skipped:false}),false)
const p=emptyProgress();p.diagnostic={current:target,history:[all]}
const lesson=course.lessons[0];p.steps[lesson.steps[0].id]={...emptyStep(lesson.steps[0]),completed:true};p.lastLesson=lesson.id;p.cursor[lesson.id]=4
assert.deepEqual(validateProgress(JSON.parse(JSON.stringify(p))),p,'Экспорт/импорт должен сохранять диагностику вместе с уроками')
const draft=logic.newDiagnostic();draft.cursor=7;draft.answers.D08={input:'0',skipped:false,confidence:'unsure'}
assert.deepEqual(logic.validateDiagnostic({current:draft,history:[]}).current,draft,'Черновик с ответом 0 должен переживать перезагрузку')
let repeated={current:all,history:[]}
for(let n=0;n<8;n++){repeated=logic.restartDiagnostic(repeated);repeated.current={...round(),startedAt:all.startedAt+n+1,completedAt:all.startedAt+n+2}}
assert.equal(repeated.history.length,5);assert.deepEqual(repeated.history[0],all,'Первое измерение не должно теряться при повторах')
const damaged=structuredClone(p);delete damaged.diagnostic.current.answers.D20
assert.throws(()=>validateProgress(damaged),/отсутствуют ответы/)
let migrated=0
for(const [id,ids]of Object.entries(previousLessonStepIds))for(const [index,stepId]of ids.entries()){
  const before={...emptyProgress(),curriculumRevision:2,lastLesson:id,cursor:{[id]:index}}
  const after=validateProgress(before),l=course.lessons.find(l=>l.id===after.lastLesson)
  assert.equal(l.steps[after.cursor[l.id]].id,stepId,`Потерян старый курсор ${id}:${index}`);migrated++
}
for(const l of course.topics)for(const [index,step]of l.steps.entries()){
  const r=course.resolvePreviousCursor(l.id,index);assert.equal(r.lesson.steps[r.index].id,step.id)
}
for(const l of course.lessons){assert.ok(!/[Δδ]|\$|f[′']|\bx\b|\by\b/.test(l.title),'Заголовок карточки должен быть обычным текстом: '+l.title)}
for(const l of course.lessons)for(const s of l.steps){assert.ok(!/Открытие|без заучивания|победител|честная|пробег/.test(JSON.stringify(s)),s.id+': осталась неестественная формулировка')}
await fs.writeFile('.validation-runtime/diagnostic.json',JSON.stringify(tasks,null,2))
await fs.writeFile('qa/reports/diagnostic-validation.json',JSON.stringify({questions:tasks.length,official:16,author:4,formulaCount,migratedCursors:migrated,scenarios:['all-correct','all-wrong','skipped','uncertain','blocks-4-5','fractions','zero-draft','reload','export-import','retake-history','damaged-import','previous-cursors']},null,2))
console.log(`Диагностика: 20 заданий, ${formulaCount} формул, 12 сценариев и ${migrated} старых курсоров — проверены`)
