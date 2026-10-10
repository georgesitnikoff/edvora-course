import type { Step } from '../curriculum/schema'
export function formulaMatches(step:Step,sequence:string[]):boolean{
  return [step.answer as string[],...step.formula?.alternatives??[]].some(answer=>sequence.length===answer.length&&sequence.every((token,i)=>token===answer[i]))
}
