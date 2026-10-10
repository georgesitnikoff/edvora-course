"""Independent symbolic check of diagnostic answers, without importing the course engine."""
import json
from pathlib import Path
import sympy as sp
x=sp.symbols('x',real=True)
tasks=json.loads(Path('.validation-runtime/diagnostic.json').read_text())
count=0
for task in tasks:
    v=task.get('verification')
    if not v: continue
    f=sp.sympify(v['expression'],locals={'x':x})
    expected=sp.Rational(str(task['answer']))
    kind=v['kind']
    if kind=='value': result=f.subs(x,v['at'])
    elif kind=='slope': result=sp.diff(f,x)
    elif kind=='primitive': result=sp.integrate(f,(x,*v['bounds']))+v['initial']
    elif kind=='zeroCount':
        roots=sp.solve(sp.diff(f,x),x);a,b=v['bounds'];result=sum(bool(a<=r<=b) for r in roots)
    elif kind=='intersection':
        roots=sp.solve(f-sp.sympify(v['other'],locals={'x':x}),x)
        assert sp.Rational(str(v['at'])) in roots and len(roots)==2,task['id']
        result=v['at']
    else:
        a=sp.Rational(str(v['at']));derivative=sp.diff(f,x)
        assert sp.simplify(derivative.subs(x,a))==0,(task['id'],'not stationary')
        second=sp.simplify(sp.diff(f,x,2).subs(x,a))
        assert (second<0 if kind=='maximum' else second>0),(task['id'],'wrong extremum')
        if kind=='globalMin':
            left,right=v['bounds'];result=f.subs(x,a)
            assert float(result)<float(f.subs(x,left)) and float(result)<float(f.subs(x,right)),task['id']
            critical=sp.solve(derivative,x);assert [r for r in critical if left<r<right]==[a],task['id']
        else:result=a
    assert sp.simplify(result-expected)==0,(task['id'],str(result),str(expected))
    count+=1
# The remaining four answers are graph-reading questions; demo keys were read
# from the original FIPI PDFs, and the open variant was checked from its sign changes.
graphic_keys={'D04':4,'D05':6,'D06':1,'D07':5}
assert all(t['answer']==graphic_keys[t['id']] for t in tasks if t['id'] in graphic_keys)
report={'symbolicChecks':count,'graphAnswersCheckedAgainstSources':len(graphic_keys),'errors':0}
Path('qa/reports/independent-diagnostic.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(f'Независимая проверка диагностики: {count} символических решений и 4 ответа по исходным рисункам — верно')
