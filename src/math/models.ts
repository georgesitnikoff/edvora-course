import { add, div, mul, neg, numberOf, q, rational, sub, texQ } from './exact'
import type { Q } from './exact'

export type Model =
  | { kind: 'poly'; c: Q[] }
  | { kind: 'integratedLinear'; knots: [number, number][]; initial: Q }
  | { kind: 'piecewiseLinear'; knots: [number, number][] }
  | { kind: 'reciprocal'; a: Q; shift: number; offset: number }
  | { kind: 'sine'; a: number; frequency: number; offset: number }
  | { kind: 'abs'; shift: number; offset: number }
  | { kind: 'exp'; a: number; frequency: number; offset: number }
  | { kind: 'log'; a: number; shift: number; offset: number }
  | { kind: 'sqrt'; a: number; shift: number; offset: number }

export const poly = (...coefficients: (number | Q)[]): Model => ({ kind: 'poly', c: coefficients.map(rational) })
export function polyDerivative(c: Q[]): Q[] { return c.length <= 1 ? [q(0)] : c.slice(1).map((v, i) => mul(v, q(i + 1))) }
export function polyPrimitive(c: Q[], constant: Q = q(0)): Q[] { return [constant, ...c.map((v, i) => div(v, q(i + 1)))] }
export function derivativeModel(model: Model): Model {
  if (model.kind !== 'poly') throw new Error('Символьная модель производной поддерживает многочлены')
  return { kind: 'poly', c: polyDerivative(model.c) }
}
export function primitiveModel(model: Model, constant: number | Q = 0): Model {
  if (model.kind !== 'poly') throw new Error('Символьная первообразная поддерживает многочлены')
  return { kind: 'poly', c: polyPrimitive(model.c, rational(constant)) }
}
export function exactValue(model: Model, x: number | Q, order = 0): Q | null {
  const X = rational(x)
  if (model.kind === 'poly') {
    let c = model.c
    for (let i = 0; i < order; i++) c = polyDerivative(c)
    return c.reduceRight((result, coefficient) => add(mul(result, X), coefficient), q(0))
  }
  if (model.kind === 'reciprocal') {
    const z = sub(X, rational(model.shift))
    if (z.n === 0) return null
    if (order === 0) return add(div(model.a, z), rational(model.offset))
    if (order === 1) return neg(div(model.a, mul(z, z)))
    return div(mul(q(2), model.a), mul(mul(z, z), z))
  }
  if (model.kind === 'abs') {
    const z = sub(X, rational(model.shift))
    if (order === 0) return add(q(Math.abs(z.n), z.d), rational(model.offset))
    if (z.n === 0) return null
    return order === 1 ? q(Math.sign(z.n)) : q(0)
  }
  if (model.kind === 'integratedLinear') {
    const xn = numberOf(X), knots = model.knots
    if (xn < knots[0][0] || xn > knots[knots.length - 1][0]) return null
    let accumulated = model.initial
    for (let i = 0; i < knots.length - 1; i++) {
      const [left, y0] = knots[i], [right, y1] = knots[i + 1]
      const slope = div(rational(y1 - y0), rational(right - left))
      const dx = sub(rational(Math.min(xn, right)), rational(left))
      if (xn <= right) {
        if (order === 1) return add(rational(y0), mul(slope, dx))
        if (order > 1) return (xn === left && i > 0) || (xn === right && i < knots.length - 2) ? null : slope
        return add(accumulated, add(mul(rational(y0), dx), div(mul(slope, mul(dx, dx)), q(2))))
      }
      accumulated = add(accumulated, add(mul(rational(y0), dx), div(mul(slope, mul(dx, dx)), q(2))))
    }
    return accumulated
  }
  if(model.kind==='piecewiseLinear'){
    const xn=numberOf(X),knots=model.knots
    if(xn<knots[0][0]||xn>knots[knots.length-1][0])return null
    const segment=knots.slice(0,-1).findIndex(([a],i)=>xn>=a&&xn<=knots[i+1][0])
    if(segment<0)return null
    const [a,y]=knots[segment],[b,z]=knots[segment+1]
    const slope=div(sub(rational(z),rational(y)),sub(rational(b),rational(a)))
    if(order===0)return add(rational(y),mul(slope,sub(X,rational(a))))
    if(xn===knots[0][0]||xn===knots[knots.length-1][0])return null
    const vertex=knots.findIndex(([t])=>t===xn)
    if(vertex>0){
      const left=div(sub(rational(knots[vertex][1]),rational(knots[vertex-1][1])),sub(rational(knots[vertex][0]),rational(knots[vertex-1][0])))
      const right=div(sub(rational(knots[vertex+1][1]),rational(knots[vertex][1])),sub(rational(knots[vertex+1][0]),rational(knots[vertex][0])))
      if(left.n!==right.n||left.d!==right.d)return null
    }
    return order===1?slope:q(0)
  }
  const xn=numberOf(X)
  if(model.kind==='sine'&&model.frequency*xn===0)return rational(order===0?model.offset:order===1?model.a*model.frequency:0)
  if(model.kind==='exp'&&model.frequency*xn===0)return rational(model.a*model.frequency**order+(order===0?model.offset:0))
  if(model.kind==='log'&&xn-model.shift===1)return rational(order===0?model.offset:order===1?model.a:-model.a)
  if(model.kind==='sqrt'){
    const z=sub(X,rational(model.shift)),n=Math.sqrt(z.n),d=Math.sqrt(z.d)
    if(Number.isSafeInteger(n)&&Number.isSafeInteger(d)&&(order===0||n!==0)){
      const root=q(n,d)
      return order===0?add(mul(rational(model.a),root),rational(model.offset)):order===1?div(rational(model.a),mul(q(2),root)):neg(div(rational(model.a),mul(q(4),mul(z,root))))
    }
  }
  return null
}

export function value(model: Model, x: number, order = 0): number {
  if (model.kind === 'poly') {
    let c = model.c
    for (let i = 0; i < order; i++) c = polyDerivative(c)
    return c.reduceRight((result, coefficient) => result * x + numberOf(coefficient), 0)
  }
  if (model.kind === 'integratedLinear') {
    const [first, last] = [model.knots[0], model.knots[model.knots.length - 1]]
    if (x < first[0] - 1e-9 || x > last[0] + 1e-9) return NaN
    let acc = numberOf(model.initial)
    for (let i = 0; i < model.knots.length - 1; i++) {
      const [a, y0] = model.knots[i], [b, y1] = model.knots[i + 1]
      const slope = (y1 - y0) / (b - a), dx = Math.min(x, b) - a
      if (x <= b + 1e-10) {
        if (order === 1) return y0 + slope * dx
        if (order > 1) return ((Math.abs(x-a) < 1e-10 && i > 0) || (Math.abs(x-b) < 1e-10 && i < model.knots.length-2)) ? NaN : slope
        return acc + y0 * dx + slope * dx * dx / 2
      }
      acc += y0 * dx + slope * dx * dx / 2
    }
    return acc
  }
  if(model.kind==='piecewiseLinear'){
    const knots=model.knots
    if(x<knots[0][0]||x>knots[knots.length-1][0])return NaN
    const i=knots.slice(0,-1).findIndex(([a],j)=>x>=a&&x<=knots[j+1][0])
    if(i<0)return NaN
    const [a,y]=knots[i],[b,z]=knots[i+1],slope=(z-y)/(b-a)
    if(order===0)return y+slope*(x-a)
    if(x===knots[0][0]||x===knots[knots.length-1][0])return NaN
    const j=knots.findIndex(([t])=>Math.abs(t-x)<1e-10)
    if(j>0){
      const left=(knots[j][1]-knots[j-1][1])/(knots[j][0]-knots[j-1][0])
      const right=(knots[j+1][1]-knots[j][1])/(knots[j+1][0]-knots[j][0])
      if(Math.abs(left-right)>1e-10)return NaN
    }
    return order===1?slope:0
  }
  if (model.kind === 'reciprocal') {
    const z = x - model.shift, a = numberOf(model.a)
    if (Math.abs(z) < 1e-12) return NaN
    return order === 0 ? a / z + model.offset : order === 1 ? -a / (z*z) : 2*a/(z*z*z)
  }
  if (model.kind === 'abs') return order === 0 ? Math.abs(x-model.shift)+model.offset : Math.abs(x-model.shift)<1e-10 ? NaN : order === 1 ? Math.sign(x-model.shift) : 0
  if (model.kind === 'sine') return order === 0 ? model.a*Math.sin(model.frequency*x)+model.offset : order === 1 ? model.a*model.frequency*Math.cos(model.frequency*x) : -model.a*model.frequency**2*Math.sin(model.frequency*x)
  if (model.kind === 'exp') return model.a*model.frequency**order*Math.exp(model.frequency*x)+(order===0?model.offset:0)
  if (model.kind === 'log') {
    const z = x-model.shift
    if (z <= 0) return NaN
    return order === 0 ? model.a*Math.log(z)+model.offset : order === 1 ? model.a/z : -model.a/(z*z)
  }
  const z = x-model.shift
  if (z < 0 || (order > 0 && z === 0)) return NaN
  return order === 0 ? model.a*Math.sqrt(z)+model.offset : order === 1 ? model.a/(2*Math.sqrt(z)) : -model.a/(4*z**1.5)
}

export function integral(model: Model, from: number, to: number, order = 0): number {
  if (model.kind === 'poly') {
    let c = model.c
    for(let i=0;i<order;i++) c=polyDerivative(c)
    const F = { kind:'poly' as const, c:polyPrimitive(c) }
    return value(F,to)-value(F,from)
  }
  if (model.kind === 'integratedLinear') {
    if (order === 1) return value(model,to)-value(model,from)
    if (from>to) return -integral(model,to,from,order)
    if (from<model.knots[0][0] || to>model.knots[model.knots.length-1][0]) return NaN
    let total=0, acc=numberOf(model.initial)
    for(let i=0;i<model.knots.length-1;i++) {
      const [a,y0]=model.knots[i], [b,y1]=model.knots[i+1], slope=(y1-y0)/(b-a)
      const l=Math.max(from,a), r=Math.min(to,b)
      if(r>l) {
        const F=(z:number)=>acc*z+y0*z*z/2+slope*z*z*z/6
        total+=F(r-a)-F(l-a)
      }
      acc+=y0*(b-a)+slope*(b-a)**2/2
    }
    return total
  }
  if(model.kind==='piecewiseLinear'){
    if(from>to)return -integral(model,to,from,order)
    if(from<model.knots[0][0]||to>model.knots[model.knots.length-1][0])return NaN
    if(order===1)return value(model,to)-value(model,from)
    let total=0
    for(let i=0;i<model.knots.length-1;i++){
      const l=Math.max(from,model.knots[i][0]),r=Math.min(to,model.knots[i+1][0])
      if(r>l)total+=(value(model,l)+value(model,r))*(r-l)/2
    }
    return total
  }
  return NaN
}
export function tangent(model: Model, a: number): { k: number; b: number } {
  const k=value(model,a,1)
  return { k, b:value(model,a)-k*a }
}
export function slopeBetween(model: Model, a: number, b: number): number { return a === b ? NaN : (value(model,b)-value(model,a))/(b-a) }
export function polynomialTex(model: Model): string {
  if(model.kind!=='poly') return ''
  const terms:string[]=[]
  for(let i=model.c.length-1;i>=0;i--) {
    const a=model.c[i]
    if(a.n===0) continue
    const magnitude=q(Math.abs(a.n),a.d)
    const coefficient=i>0 && magnitude.n===magnitude.d ? '' : texQ(magnitude)
    const monomial=i===0?'':i===1?'x':`x^{${i}}`
    terms.push(`${terms.length?(a.n<0?'-':'+'):(a.n<0?'-':'')}${coefficient}${monomial}`)
  }
  return terms.join('')||'0'
}

export const MODELS = {
  line: poly(1,2),
  square: poly(0,0,1),
  down: poly(4,0,-1),
  shifted: poly(5,-4,1),
  cubic: poly(0,-3,0,1),
  flat: poly(0,0,0,1),
  negativeFlat: poly(0,0,0,-1),
  multi: { kind:'integratedLinear', knots:[[-5,-2],[-3,2],[-1,-2],[1,2],[3,-2],[5,2]], initial:q(0) } as Model,
  touching: {kind:'integratedLinear',knots:[[-5,-2],[-3,0],[-1,-2],[1,0],[3,2],[5,0],[7,-2]],initial:q(0)} as Model,
  hyperbola:{kind:'reciprocal',a:q(4),shift:0,offset:0} as Model,
  sine:{kind:'sine',a:2,frequency:1,offset:0} as Model,
  corner:{kind:'abs',shift:0,offset:0} as Model,
  motion:poly(5,-4,1),
  area:poly(-2,1),
}
