import { numberOf, q, texQ } from '../math/exact'
import { derivativeModel,exactValue, integral, MODELS, poly, polynomialTex, slopeBetween, tangent, value } from '../math/models'
import type { Model } from '../math/models'
import type { Control, GraphSpec, Lesson, Proof, Step } from './schema'

export type Draft = Omit<Step,'id'|'skill'> & { skill?:string }
export const dollar = (s:string) => `$${s}$`
export function graph(model:Model=MODELS.square, options:Partial<GraphSpec>={}): GraphSpec {
  const spec:GraphSpec={ model,label:model.kind==='poly'?`f(x)=${polynomialTex(model)}`:'f(x)',rangeX:[-3,3],rangeY:[-3,6],showReadout:false,...options }
  const xs=[...(spec.marks??[]),...(spec.at===undefined?[]:[spec.at]),...(spec.secondAt===undefined?[]:[spec.secondAt]),...(spec.controls?.find(c=>c.param==='x')?.values??[])]
  if(spec.mode==='secant' && spec.at!==undefined) for(const h of spec.controls?.find(c=>c.param==='h')?.values??[]) xs.push(spec.at+h)
  const ys=xs.map(x=>value(model,x,spec.order??0)).filter(Number.isFinite)
  if(xs.length) spec.rangeX=[Math.min(spec.rangeX[0],...xs),Math.max(spec.rangeX[1],...xs)]
  if(ys.length) spec.rangeY=[Math.min(spec.rangeY[0],...ys.map(y=>Math.floor(y)-1)),Math.max(spec.rangeY[1],...ys.map(y=>Math.ceil(y)+1))]
  return spec
}
export const control=(param:Control['param'],label:string,values:number[],initial=values[0]):Control=>({param,label,values,initial})
export const xControl=(values=[-2,-1,0,1,2],initial=0)=>control('x','Абсцисса точки',values,initial)
export function read(title:string,body:string,g?:GraphSpec):Draft {
  return {kind:'read',stage:'Разбор',title,body,graph:g,hints:[],solution:body}
}
export function explore(title:string,body:string,g:GraphSpec,solution:string):Draft {
  return {kind:'explore',stage:'Разбор',title,body,graph:{...g,showReadout:true},hints:['Измени указанный параметр ползунком или кнопками под графиком.','Смотри на то, что меняется на рисунке и в значениях рядом с ним.'],solution}
}
export function choice(title:string,body:string,question:string,correct:string,wrong:[string,string][],solution:string,g?:GraphSpec,hints?:string[]):Draft {
  const choices=[{text:correct,feedback:solution},...wrong.map(([text,feedback])=>({text,feedback}))]
  return {kind:'choice',stage:'Разбор',title,body,question,choices,answer:0,hints:hints??['Определи, какая величина дана и какую нужно найти.','Используй правило из предыдущего шага; отдельно проверь знак.'],solution,graph:g}
}
function numericalHints(p?:Omit<Proof,'expected'>,g?:GraphSpec):string[]{
  const fallback=['Сначала выпиши нужную связь, затем подставь числа.','Проверь знак и то, что отвечаешь именно на заданный вопрос.']
  if(!p)return fallback
  const derivative=p.model.kind==='poly'?polynomialTex(derivativeModel(p.model)):undefined
  if(p.kind==='derivative'||p.kind==='slope')return [
    g?.order===1?'На рисунке сама производная: нужное число — высота при заданном x.':g?'Значение производной — наклон касательной. Высота исходной кривой отвечает на другой вопрос.':'Сначала найди производную всей функции. После этого подставляй аргумент.',
    derivative?'Для этой функции $f\\prime(x)='+derivative+'$. Подставь $x='+p.x+'$.':'Для прямой используй разность высот, делённую на разность абсцисс; для другой функции — соответствующее правило производной.',
    'Проверь направление и знак. Отрицательный наклон сохраняет минус; горизонтальная касательная даёт ноль.']
  if(p.kind==='value')return ['Нужно значение функции, то есть её высота, а не производная.','Найди $x='+p.x+'$ и прочитай ординату соответствующей точки. Если дана формула, подставь аргумент вместе с его знаком.','Не меняй местами вход в скобках и полученное значение.']
  if(p.kind==='signCount')return ['Сначала прочитай подпись: изображена функция или её производная?','На f наклон определяют по направлению; на f′ её знак определяют по высоте. Проверяй каждую отмеченную абсциссу.','Горизонтальная касательная даёт 0. Этот случай не входит ни в строгий плюс, ни в строгий минус.']
  if(p.kind==='extremaCount'||p.kind==='extremePoint')return ['Нужна смена знака производной, а не просто пересечение или касание оси.','Максимум: +→−. Минимум: −→+. В нуле без смены знака экстремума нет.','После определения типа отбирай абсциссы из заданного отрезка. Закрытые границы отбора включают уже существующие экстремумы всей функции.']
  if(p.kind==='globalPoint'||p.kind==='globalValue')return ['На отрезке сравнивают все допустимые значения, включая оба конца.','Добавь внутренние стационарные точки и точки без производной, если такие есть. Вычисли значение в каждом кандидате.','Вопрос про точку требует x победителя; вопрос про наибольшее значение требует f(x). Это разные числа.']
  if(p.kind==='parallel'||p.kind==='parallelPoint')return ['Параллельные прямые имеют одинаковый угловой коэффициент. Свободный член заданной прямой здесь не влияет.','Запиши $f\\prime(x)='+p.target+'$'+(derivative?': здесь $f\\prime(x)='+derivative+'$.':'. На графике f′ это пересечение с горизонтальным уровнем.'),'Найди все решения, затем отбери допустимые абсциссы. Проверь, спрашивают их количество или конкретное x.']
  if(p.kind==='tangentB')return ['Свободный член не равен высоте точки касания, если её x не нулевой.','Используй $b=f(a)-a f\\prime(a)$. Сначала отдельно найди высоту и наклон.','Подставь a в полученную прямую: она должна вернуть f(a).']
  if(p.kind==='integral')return ['Нужно накопление со знаком. Участок ниже Ox уменьшает первообразную.','Раздели промежуток в нулях функции и посчитай площади простых фигур. Положительные и отрицательные вклады складывай алгебраически.','Добавь начальное значение: $F(b)=F(a)+\\int_a^b f(x)\\,dx$. Приращение и конечный уровень не всегда совпадают.']
  if(p.kind==='length')return ['Сначала выдели только участки нужного знака внутри заданных границ.','Длина каждого участка — правый конец минус левый. Число клеток предварительно переводи в единицы.','Сложи длины всех подходящих частей. Количество целых точек здесь не спрашивают.']
  if(p.kind==='integerCount')return ['Проверь целые аргументы от '+Math.ceil(p.a??-3)+' до '+Math.floor(p.b??3)+' включительно.','В каждой точке отдельно выясни знак производной.'+(p.sign===0?' Сейчас требуется именно равенство нулю.':' Нули не входят в строгое неравенство.'),'Считай точки, а не длину интервала. На открытой границе нулевая производная не подходит строгому знаку.']
  if(p.kind==='zeroCount')return ['Уточни, нули какой функции нужны. Буквы f и F меняют роль при условии F′=f.','Если дана первообразная F, нули f соответствуют горизонтальным касательным F. Если нарисована сама нужная функция — ищи высоту 0.','Ноль без смены знака всё равно является решением равенства. Не путай число нулей и число экстремумов.']
  if(p.kind==='coefficient')return ['Параметр в коэффициенте меняет формулу производной. Сначала продифференцируй выражение с буквой A.','Подставь заданное x и приравняй производную к нужному наклону. Получится уравнение на A.','Постоянный член исчезает при дифференцировании; параметр при x или x² остаётся. Проверь найденный A обратной подстановкой.']
  return fallback
}
export function num(title:string,body:string,question:string,answer:number,solution:string,g?:GraphSpec,proof?:Omit<Proof,'expected'>,hints?:string[]):Draft {
  return {kind:'number',stage:'Практика',title,body,question,answer,solution,graph:g,proof:proof?{...proof,expected:answer}:undefined,hints:hints??numericalHints(proof,g)}
}
export function select(title:string,body:string,question:string,labels:string[],answer:string[],solution:string,g?:GraphSpec):Draft {
  return {kind:'select',stage:'Практика',title,body,question,labels,answer,solution,graph:g,hints:['Проверяй каждый вариант отдельно. Можно выбрать несколько.','Для каждого утверждения сверь величину, условие и знак. Не выбирай вариант только потому, что в нём встречается знакомое число.']}
}
export function order(title:string,body:string,labels:string[],solution:string):Draft {
  return {kind:'order',stage:'Проверка',title,body,question:'Выбери действия в правильном порядке.',labels,answer:labels,solution,hints:['Начни с чтения условия.','Вычисления идут после выбора нужного правила, проверка — в конце.']}
}
export function trap(draft:Draft):Draft { return {...draft,stage:'Типичные ошибки'} }
export function opening(draft:Draft):Draft { return {...draft,stage:'Введение'} }
export function exam(draft:Draft):Draft { return {...draft,stage:'Проверка',exam:true,graph:draft.graph?{...draft.graph,controls:undefined,goals:undefined,showReadout:false,triangle:false}:undefined} }
export function lesson(number:number,title:string,description:string,unit:number,skills:string[],core:Draft[],practice:Draft[]):Lesson {
  const id=`L${String(number).padStart(2,'0')}`
  const steps=[...core,...practice].map((s,index)=>{
    let draft=s
    if(number<=4 && s.kind==='number' && (s.proof?.kind==='slope'||s.proof?.kind==='derivative')) {
      draft={...draft,hints:['Выбери на прямой две точки с известными координатами.','Вычти начальные координаты из конечных в одном порядке: отдельно по y, отдельно по x. Затем раздели изменение y на изменение x.','Проверь цену делений обеих осей и знак. При движении вправо подъём даёт плюс, спуск — минус, горизонталь — ноль.']}
    }
    if(s.kind==='choice' && s.choices) {
      const correct=s.choices[Number(s.answer)]
      let seed=(number*1009+index*9176+42)>>>0
      const choices=[...s.choices]
      for(let i=choices.length-1;i>0;i--){seed=(seed*1664525+1013904223)>>>0;const j=seed%(i+1);[choices[i],choices[j]]=[choices[j],choices[i]]}
      draft={...s,choices,answer:choices.indexOf(correct)}
    }
    return {...draft,id:`${id}-S${String(index+1).padStart(2,'0')}`,skill:s.skill??skills[0]} as Step
  })
  if(steps.length<32) throw new Error(`${id}: только ${steps.length} шагов, нужно минимум 32`)
  return {id,number,title,description,unit,skills,prerequisites:number>1?[`L${String(number-1).padStart(2,'0')}`]:[],steps}
}
export function valueTask(model:Model,x:number,orderN=0,options:Partial<GraphSpec>={},label='f'):Draft {
  const exact=exactValue(model,x,orderN)
  const answer=value(model,x,orderN)
  const target=`${label}${orderN?"'":''}(${x})`
  const linked=options.mode==='linked'
  return num(orderN?'Найди значение производной':'Прочитай значение функции',`Используй ${linked?'связанные графики':'график'} $y=${label}${!linked&&orderN?"'":''}(x)$.`,`Чему равно $${target}$?`,answer,`При $x=${x}$ ордината ${linked&&orderN?'нижнего':'изображённого'} графика равна $${exact?texQ(exact):answer}$. Это и есть $${target}$.`,graph(model,{order:(linked?0:orderN) as 0|1,label:`${label}${!linked&&orderN?"'":''}(x)`,at:x,...options}),{kind:orderN?'derivative':'value',model,x,order:orderN},['Найди заданное x на горизонтальной оси.','Поднимись или опустись до нужного графика; прочитай y.'])
}
export function tangentTask(model:Model,a:number,rangeX:[number,number]=[-3,3],rangeY:[number,number]=[-6,8]):Draft {
  const {k}=tangent(model,a), exact=exactValue(model,a,1)
  return num('Производная по касательной',`Показаны $y=f(x)$ и касательная в точке $x_0=${a}$.`,'Найди $f\'(x_0)$.',k,`Находим наклон именно прямой. Здесь $f′(x_0)=${exact?texQ(exact):k}$. Значение $f(x_0)$ — другая величина.`,graph(model,{mode:'tangent',at:a,triangle:true,rangeX,rangeY}),{kind:'derivative',model,x:a},['Выбери на прямой две точки с удобными координатами.','Посчитай $\\Delta y/\\Delta x$. Сохрани знак подъёма или спуска.'])
}
export function secantTask(model:Model,a:number,b:number):Draft {
  const answer=slopeBetween(model,a,b)
  const fa=exactValue(model,a),fb=exactValue(model,b)
  return num('Среднее изменение',`График $f(x)=${polynomialTex(model)}$, точки с абсциссами $${a}$ и $${b}$.`,'Найди среднюю скорость изменения.',answer,`$\\frac{f(${b})-f(${a})}{${b}-(${a})}=\\frac{${fb?texQ(fb):value(model,b)}-(${fa?texQ(fa):value(model,a)})}{${b-a}}=${answer}$.`,graph(model,{mode:'secant',at:a,secondAt:b,triangle:true,rangeX:[Math.min(a,b)-1,Math.max(a,b)+1],rangeY:[Math.min(value(model,a),value(model,b),0)-2,Math.max(value(model,a),value(model,b),0)+2]}),{kind:'secant',model,a,b},['Среднее изменение связано с двумя концами промежутка.','Раздели разность значений функции на разность абсцисс.'])
}
export function areaTask(model:Model,a:number,b:number,initial=0):Draft {
  const result=initial+integral(model,a,b)
  return num('Накопление со знаком',`$F′=f$, $F(${a})=${initial}$. На рисунке $f(x)=${polynomialTex(model)}$.`,`Найди $F(${b})$.`,result,`$F(${b})=F(${a})+\\int_{${a}}^{${b}}f(x)\\,dx=${initial}+(${result-initial})=${result}$. Участки ниже оси входят со знаком минус.`,graph(model,{mode:'area',from:a,to:b,rangeX:[Math.min(a,b,0)-1,Math.max(a,b,0)+1],rangeY:[Math.min(value(model,a),value(model,b),0)-1,Math.max(value(model,a),value(model,b),0)+1]}),{kind:'integral',model,a,b,target:initial},['Нужно приращение функции, а не только площадь без знака.','Начальное значение добавляется к интегралу.'])
}
export { q, numberOf, texQ, poly, MODELS, value, exactValue, tangent, integral, polynomialTex }
