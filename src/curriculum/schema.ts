import type { Model } from '../math/models'

export type Param = 'x'|'h'|'k'|'b'|'c'|'upper'|'zoom'|'rise'|'run'|'scaleX'|'scaleY'|'coefficient'
export type Control = { param:Param; label:string; values:number[]; initial:number; unit?:string }
export type Goal = { param:Param; target?:number; visit?:number[];measure?:'derivative'|'secant'|'accumulated' }
export type ContextSpec = {
  kind:'race'|'tank'|'terrain'; title:string; primary:string; domain:[number,number];
  comparison?:{model:Model;label:string}; capacity?:number; animate?:boolean; showRate?:boolean;
  variable?:string; inputUnit?:string; outputUnit?:string; initialTime?:number;
}
export type GraphSpec = {
  model:Model; label:string; order?:0|1; mode?:'point'|'slope'|'secant'|'tangent'|'zoom'|'linked'|'level'|'motion'|'family'|'area'|'intervals'|'parameter';parameterPower?:number;
  rangeX:[number,number]; rangeY:[number,number]; gridX?:number; gridY?:number;minorGridY?:number;
  at?:number; secondAt?:number; marks?:number[]; anchors?:[number,number][]; triangle?:boolean;
  controls?:Control[]; goals?:Goal[]; level?:number; constant?:number; from?:number; to?:number;
  secondaryLabel?:string; secondaryRangeY?:[number,number]; showReadout?:boolean; showTangent?:boolean;
  shade?:[number,number][]; horizontal?:number;
  context?:ContextSpec; regions?:{id:string;from:number;to:number}[];
  pickPoints?:{id:string;x:number;label:string}[]; axisXLabel?:string; axisYLabel?:string;
  symbolicLabels?:{left:string;right:string};
}
export type FormulaSpec={layout:'linear'|'ratio';prefix:string;variable?:string;slotLabels:string[];alternatives?:string[][];symbolic?:boolean}
export type Choice = { text:string; feedback:string }
export type Proof = {
  kind:'value'|'change'|'derivative'|'slope'|'secant'|'integral'|'signCount'|'zeroCount'|'extremaCount'|'extremePoint'|'globalPoint'|'globalValue'|'parallel'|'parallelPoint'|'tangentB'|'length'|'integerCount'|'coefficient';
  model:Model; x?:number; a?:number; b?:number; order?:number; power?:number; points?:number[]; roots?:number[]; target?:number; sign?:-1|0|1; extremum?:'min'|'max'; expected:number
}
export type Step = {
  id:string; kind:'read'|'choice'|'number'|'select'|'explore'|'order'|'interval'|'formula'; stage:'Введение'|'Разбор'|'Типичные ошибки'|'Практика'|'Проверка';
  title:string; body:string; question?:string; choices?:Choice[]; answer?:number|string[]; hints:string[]; solution:string;
  graph?:GraphSpec; labels?:string[]; proof?:Proof; skill:string; exam?:boolean; intervalVariable?:string; error?:string;formula?:FormulaSpec;checkpoint?:boolean;
}
export type Lesson = { id:string; number:number; title:string; description:string; unit:number; skills:string[]; prerequisites:string[]; steps:Step[];topic?:number;part?:number }
export const UNITS = [
  {id:1,title:'Читать изменение',description:'От координат к наклону',lessons:[1,2,3,4,5,6,7,8,9,10,11,12]},
  {id:2,title:'Понять производную',description:'Касательная и два графика',lessons:[13,14,15,16,17,18,19,20,21,22]},
  {id:3,title:'Исследовать функцию',description:'Знаки, экстремумы, границы',lessons:[23,24,25,26,27,28,29,30,31,32]},
  {id:4,title:'Решать по формуле',description:'Касательная и движение',lessons:[33,34,35,36,37,38,39,40,41,42]},
  {id:5,title:'Собрать всё вместе',description:'Первообразная и экзамен',lessons:[43,44,45,46,47,48,49]},
]
