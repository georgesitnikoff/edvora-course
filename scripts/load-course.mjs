import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import ts from 'typescript'
import {existsSync} from 'node:fs'
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
const output=path.join(root,'.validation-runtime')
export async function loadCourse() {
  for(const dir of ['math','curriculum','v2']) {
    await fs.mkdir(path.join(output,dir),{recursive:true})
    for(const file of await fs.readdir(path.join(root,'src',dir))) {
      if(!/\.tsx?$/.test(file)) continue
      const source=await fs.readFile(path.join(root,'src',dir,file),'utf8')
      const result=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2023,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}})
      const js=result.outputText.replace(/(from\s*['"])(\.[^'"]+)(['"])/g,(_,a,b,c)=>{
        const sourcePath=path.resolve(root,'src',dir,b)
        return a+b.replace(/\.ts$/,'')+(existsSync(sourcePath+'/index.ts')?'/index.mjs':'.mjs')+c
      })
      await fs.writeFile(path.join(output,dir,file.replace(/\.tsx?$/,'.mjs')),js)
    }
  }
  const course=await import(pathToFileURL(path.join(output,'curriculum/index.mjs')))
  const models=await import(pathToFileURL(path.join(output,'math/models.mjs')))
  const analysis=await import(pathToFileURL(path.join(output,'math/analysis.mjs')))
  return {course,models,analysis}
}
