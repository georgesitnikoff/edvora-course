import assert from 'node:assert/strict'
import {createElement}from'react'
import {renderToStaticMarkup}from'react-dom/server'
import {loadCourse}from'./load-course.mjs'
const{course}=await loadCourse()
const{GraphLab}=await import('../.validation-runtime/v2/GraphLab.mjs')
const{initialLab,updateLab}=await import('../.validation-runtime/v2/labEngine.mjs')
const{MathText}=await import('../.validation-runtime/v2/MathText.mjs')
let graphs=0,states=0,texts=0
for(const l of course.lessons)for(const s of l.steps){
  for(const text of[s.body,s.solution,s.question,...s.hints].filter(Boolean)){
    const html=renderToStaticMarkup(createElement(MathText,{text}))
    assert.ok(!html.includes('katex-error'),s.id);texts++
  }
  if(!s.graph)continue
  const g=s.graph,initial=initialLab(g),variants=[initial]
  if(g.context?.animate)for(const sceneTime of[g.context.domain[0],...Array.from({length:17},(_,i)=>Number((g.context.domain[0]+(g.context.domain[1]-g.context.domain[0])*(i+.57)/18).toFixed(2))),g.context.domain[1]])variants.push({...initial,sceneTime})
  for(const c of g.controls??[])for(const n of c.values)variants.push(updateLab(g,initial,c.param,n))
  for(const state of variants){
    const html=renderToStaticMarkup(createElement(GraphLab,{spec:g,state,onChange:()=>{}}))
    assert.ok(!/(?:d|transform|cx|cy|x|y|width|height)="[^"]*(?:NaN|Infinity)/.test(html),s.id+': повреждена геометрия SVG')
    assert.ok(html.includes('<svg'),s.id)
    states++
  }
  graphs++
}
console.log('Отображение: '+graphs+' графиков, '+states+' состояний, '+texts+' текстовых блоков — без ошибок')
