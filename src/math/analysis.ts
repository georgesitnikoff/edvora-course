import { derivativeModel, value } from './models'
import type { Model } from './models'

const EPS=1e-8
const unique=(xs:number[])=>xs.sort((a,b)=>a-b).filter((x,i,all)=>i===0||Math.abs(x-all[i-1])>1e-6).map(x=>Math.abs(x)<EPS?0:Math.abs(x-Math.round(x))<EPS?Math.round(x):x)
export function domain(model:Model):[number,number] {
  if(model.kind==='integratedLinear') return [model.knots[0][0],model.knots[model.knots.length-1][0]]
  return [-Infinity,Infinity]
}
export function zeros(model:Model,a:number,b:number,order=0):number[] {
  if(a>b) return zeros(model,b,a,order)
  if(model.kind==='poly') {
    let m=model
    for(let i=0;i<order;i++) m=derivativeModel(m) as typeof model
    while(m.c.length>1 && m.c[m.c.length-1].n===0) m={...m,c:m.c.slice(0,-1)}
    if(m.c.length<=1) return [] // A zero polynomial is handled as a special conceptual case in content.
    if(m.c.length===2) {
      const r=-value(m,0)/value(derivativeModel(m),0)
      return r>=a-EPS&&r<=b+EPS?[r]:[]
    }
    const turning=zeros(derivativeModel(m),a,b)
    const cuts=unique([a,...turning,b]),roots:number[]=[]
    for(const x of cuts) if(Math.abs(value(m,x))<EPS) roots.push(x)
    for(let i=0;i<cuts.length-1;i++) {
      let left=cuts[i],right=cuts[i+1],vl=value(m,left)
      const vr=value(m,right)
      if(vl*vr>=0) continue
      for(let j=0;j<70;j++) {
        const mid=(left+right)/2,vm=value(m,mid)
        if(vl*vm<=0) {right=mid} else {left=mid;vl=vm}
      }
      roots.push((left+right)/2)
    }
    return unique(roots)
  }
  if(model.kind==='integratedLinear' && order===1) {
    const roots:number[]=[]
    for(let i=0;i<model.knots.length-1;i++) {
      const [x0,y0]=model.knots[i],[x1,y1]=model.knots[i+1]
      if(y0===0) roots.push(x0)
      if(y0*y1<0) roots.push(x0-y0*(x1-x0)/(y1-y0))
      if(i===model.knots.length-2&&y1===0) roots.push(x1)
    }
    return unique(roots.filter(x=>x>=a-EPS&&x<=b+EPS))
  }
  if(model.kind==='abs'&&order===0) {
    if(model.offset>0) return []
    return unique([model.shift+model.offset,model.shift-model.offset].filter(x=>x>=a-EPS&&x<=b+EPS))
  }
  if(model.kind==='reciprocal'&&order===1) return []
  return []
}
export function stationary(model:Model,a:number,b:number):number[] { return zeros(model,a,b,1) }
export function extrema(model:Model,a:number,b:number,type:'min'|'max'):number[] {
  const [lo,hi]=domain(model)
  return stationary(model,a,b).filter(x=>{
    if(x<=lo+EPS||x>=hi-EPS) return false
    const step=Math.min(1e-4,(x-lo)/2,(hi-x)/2)
    const left=value(model,x-step,1),right=value(model,x+step,1)
    return type==='min'?left<0&&right>0:left>0&&right<0
  })
}
export function signIntervals(model:Model,a:number,b:number,sign:-1|1,order=1):[number,number][] {
  const cuts=unique([a,...zeros(model,a,b,order),b])
  return cuts.slice(0,-1).map((x,i)=>[x,cuts[i+1]] as [number,number]).filter(([l,r])=>sign*value(model,(l+r)/2,order)>0)
}
export function intervalLength(model:Model,a:number,b:number,sign:-1|1,order=1):number {
  return signIntervals(model,a,b,sign,order).reduce((sum,[l,r])=>sum+r-l,0)
}
export function integerCount(model:Model,a:number,b:number,sign:-1|0|1,order=1):number {
  let count=0
  for(let x=Math.ceil(a);x<=Math.floor(b);x++) {
    const y=value(model,x,order)
    if(Number.isFinite(y)&&(sign===0?Math.abs(y)<EPS:sign*y>EPS)) count++
  }
  return count
}
export function globalCandidates(model:Model,a:number,b:number):number[] {
  return unique([a,b,...stationary(model,a,b),...(model.kind==='abs'&&model.shift>=a&&model.shift<=b?[model.shift]:[])])
}
export function globalExtreme(model:Model,a:number,b:number,type:'min'|'max'):number[] {
  const candidates=globalCandidates(model,a,b),ys=candidates.map(x=>value(model,x))
  const best=type==='min'?Math.min(...ys):Math.max(...ys)
  return candidates.filter(x=>Math.abs(value(model,x)-best)<EPS)
}
