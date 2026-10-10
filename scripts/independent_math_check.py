"""Independent symbolic audit: does not import or execute Edvora's math engine."""
import json
from pathlib import Path
import sympy as S
x=S.Symbol('x',real=True)
EPS=1e-10

def expr(m):
    kind=m['kind']
    if kind=='poly':return sum(S.Rational(c['n'],c['d'])*x**i for i,c in enumerate(m['c']))
    if kind=='reciprocal':return S.Rational(m['a']['n'],m['a']['d'])/(x-m['shift'])+m['offset']
    if kind=='sine':return m['a']*S.sin(m['frequency']*x)+m['offset']
    if kind=='abs':return S.Abs(x-m['shift'])+m['offset']
    if kind=='exp':return m['a']*S.exp(m['frequency']*x)+m['offset']
    if kind=='log':return m['a']*S.log(x-m['shift'])+m['offset']
    if kind=='sqrt':return m['a']*S.sqrt(x-m['shift'])+m['offset']
    if kind=='piecewiseLinear':
        parts=[]
        for (a,y),(b,z) in zip(m['knots'],m['knots'][1:]):
            f=S.Rational(str(y))+(S.Rational(str(z))-S.Rational(str(y)))/(S.Rational(str(b))-S.Rational(str(a)))*(x-S.Rational(str(a)))
            parts.append((f,S.And(x>=a,x<=b)))
        return S.Piecewise(*parts,(S.nan,True))
    acc=S.Rational(m['initial']['n'],m['initial']['d']);parts=[]
    for (a,y),(b,z) in zip(m['knots'],m['knots'][1:]):
        slope=S.Rational(z-y,b-a)
        f=acc+y*(x-a)+slope*(x-a)**2/2
        parts.append((f,S.And(x>=a,x<=b)))
        acc=f.subs(x,b)
    return S.Piecewise(*parts,(S.nan,True))

def val(m,t,order=0):
    if m['kind']=='integratedLinear':
        for (a,y),(b,z) in zip(m['knots'],m['knots'][1:]):
            if a<=t<=b and order==1:return float(y+S.Rational(z-y,b-a)*(S.Rational(str(t))-a))
    return float(S.diff(expr(m),x,order).subs(x,S.Rational(str(t))))

def roots(m,a,b,order=1,target=0):
    if m['kind']=='integratedLinear' and order==1:
        result=[]
        for (l,y),(r,z) in zip(m['knots'],m['knots'][1:]):
            if y==target:result.append(float(l))
            if (y-target)*(z-target)<0:result.append(float(l+S.Rational(target-y,z-y)*(r-l)))
        if m['knots'][-1][1]==target:result.append(float(m['knots'][-1][0]))
    else:
        f=S.diff(expr(m),x,order)-target
        if f==0:raise ValueError('Бесконечно много решений')
        result=[float(t) for t in S.solve(f,x) if t.is_real]
    return sorted(set(t for t in result if a-EPS<=t<=b+EPS))

def extremes(m,a,b,kind):
    pts=roots(m,a,b)
    if m['kind']=='integratedLinear':pts=[t for t in pts if m['knots'][0][0]<t<m['knots'][-1][0]]
    return [t for t in pts if (val(m,t-1e-4,1)<0<val(m,t+1e-4,1) if kind=='min' else val(m,t-1e-4,1)>0>val(m,t+1e-4,1))]

def result(p):
    m=p['model'];k=p['kind'];a=p.get('a',-3);b=p.get('b',3);t=p.get('x',0);order=p.get('order',1)
    if k=='value':return val(m,t,p.get('order',0))
    if k=='change':return val(m,b)-val(m,a)
    if k in ('derivative','slope'):return val(m,t,1)
    if k=='secant':return (val(m,b)-val(m,a))/(b-a)
    if k=='tangentB':return val(m,t)-t*val(m,t,1)
    if k=='coefficient':
        A=S.Symbol('A');equation=S.diff(expr(m)+A*x**p['power'],x).subs(x,t)-p['target']
        solutions=S.solve(equation,A);assert len(solutions)==1;return float(solutions[0])
    if k=='integral':return float(S.integrate(expr(m),(x,a,b)))+p.get('target',0)
    if k=='zeroCount':return len(roots(m,a,b,order))
    if k=='signCount':return sum((0 if abs(val(m,t,order))<EPS else 1 if val(m,t,order)>0 else -1)==p['sign'] for t in p['points'])
    if k=='extremaCount':return len(extremes(m,a,b,p['extremum']))
    if k=='extremePoint':
        r=extremes(m,a,b,p['extremum']);assert len(r)==1;return r[0]
    if k in ('globalPoint','globalValue'):
        pts=[a,b]+roots(m,a,b)
        if m['kind']=='abs' and a<=m['shift']<=b:pts.append(m['shift'])
        best=(min if p['extremum']=='min' else max)(val(m,t) for t in pts)
        winners=sorted(set(t for t in pts if abs(val(m,t)-best)<EPS))
        if k=='globalValue':return best
        assert len(winners)==1;return winners[0]
    if k in ('parallel','parallelPoint'):
        r=roots(m,a,b,1,p['target'])
        if k=='parallel':return len(r)
        assert len(r)==1;return r[0]
    if k=='length':
        cuts=sorted(set([a,b]+roots(m,a,b,order)))
        return sum(r-l for l,r in zip(cuts,cuts[1:]) if p['sign']*val(m,(l+r)/2,order)>0)
    if k=='integerCount':
        return sum((abs(val(m,t,order))<EPS if p['sign']==0 else p['sign']*val(m,t,order)>EPS) for t in range(int(S.ceiling(a)),int(S.floor(b))+1))
    raise ValueError(k)

lessons=json.loads(Path('.validation-runtime/course.json').read_text())
checked=0;failures=[]
for lesson in lessons:
    for step in lesson['steps']:
        if 'proof' not in step:continue
        try:
            got=result(step['proof']);expected=step['proof']['expected']
            assert abs(got-expected)<EPS, f'{got} != {expected}'
            checked+=1
        except Exception as e:failures.append(f"{step['id']} {step['title']}: {e}")
report={'independent_symbolic_answers':checked,'failures':failures}
Path('.validation-runtime/symbolic-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
if failures:raise SystemExit('\n'.join(failures))
print(f'SymPy: {checked} ответов проверено независимо, расхождений нет')
