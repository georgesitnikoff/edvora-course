"""Audit answers to scene selections independently of the browser/game engine."""
import json
from pathlib import Path
import sympy as S
x=S.Symbol('x', real=True)
lessons=json.loads(Path('.validation-runtime/course.json').read_text())
steps={s['id']:s for lesson in lessons for s in lesson['steps']}

def function(m):
    if m['kind']=='poly':
        return sum(S.Rational(v['n'],v['d'])*x**i for i,v in enumerate(m['c']))
    if m['kind']=='piecewiseLinear':
        return S.Piecewise(*[(S.Rational(str(y))+(S.Rational(str(z))-S.Rational(str(y)))/(b-a)*(x-a),S.And(x>=a,x<=b)) for (a,y),(b,z) in zip(m['knots'],m['knots'][1:])],(S.nan,True))
    raise ValueError(m['kind'])

def cuts(models,a,b):
    return sorted(set([S.Rational(str(a)),S.Rational(str(b))]+[S.Rational(str(t)) for m in models if m['kind']=='piecewiseLinear' for t,_ in m['knots'] if a<t<b]))

def condition_on_interval(g,a,b,kind,sign=1,invert=False):
    primary=g['model']; models=[primary]
    f=function(primary)
    if kind in ('faster','gap'):
        other=g['context']['comparison']['model'];models.append(other);h=function(other)
    values=[]
    for l,r in zip(cuts(models,a,b),cuts(models,a,b)[1:]):
        t=(l+r)/2
        p=f.subs(x,t) if primary['kind']=='piecewiseLinear' else f
        if primary['kind']=='piecewiseLinear':
            for (u,y),(v,z) in zip(primary['knots'],primary['knots'][1:]):
                if u<t<v:p=S.Rational(str(y))+S.Rational(str(z-y))/(v-u)*(x-u);break
        if kind in ('faster','gap'):
            q=h
            if other['kind']=='piecewiseLinear':
                for (u,y),(v,z) in zip(other['knots'],other['knots'][1:]):
                    if u<t<v:q=S.Rational(str(y))+S.Rational(str(z-y))/(v-u)*(x-u);break
        if kind=='stopped':v=S.diff(p,x)
        elif kind=='sign':v=S.diff(p,x)
        elif kind=='faster':v=S.diff(p-q,x)*(-1 if invert else 1)
        elif kind=='gap':v=(p-q)*S.diff(p-q,x)
        else:raise ValueError(kind)
        interior=[l,r]+[root for root in S.solve(v,x) if root.is_real and l<root<r]
        interior=sorted(set(interior))
        for u,w in zip(interior,interior[1:]):
            test=S.simplify(v.subs(x,(u+w)/2))
            values.append(test==0 if kind=='stopped' else sign*test>0)
    return bool(values) and all(bool(v) for v in values)

cases=[
 ('L01-C05','stopped',1,False),('L01-C07','faster',1,False),('L01-C09','faster',1,True),('L01-C10','gap',1,False),('L01-C14','gap',1,False),
 ('L09-C03','sign',1,False),('L12-C02','sign',1,False),('L21-C03','sign',-1,False),
]
checked=0
for id,kind,sign,invert in cases:
    s=steps[id];g=s['graph'];expected=[]
    for region in g['regions']:
        if condition_on_interval(g,region['from'],region['to'],kind,sign,invert):expected.append(region['id'])
    assert set(s['answer'])==set(expected),(id,s['answer'],expected)
    checked+=1
for id,kind,sign in [('L01-C12','gap',-1),('L01-C15','gap',-1),('L12-C04','sign',-1)]:
    s=steps[id];a,b=map(float,s['answer']);assert condition_on_interval(s['graph'],a,b,kind,sign),id
    # Neither end can be extended to the adjacent offered boundary.
    labels=sorted(map(float,s['labels']))
    if a>labels[0]:assert not condition_on_interval(s['graph'],labels[labels.index(a)-1],b,kind,sign),id
    if b<labels[-1]:assert not condition_on_interval(s['graph'],a,labels[labels.index(b)+1],kind,sign),id
    checked+=1
s=steps['L13-C03'];f=function(s['graph']['model']);expected=[p['id'] for p in s['graph']['pickPoints'] if S.diff(f,x).subs(x,p['x'])>0]
assert set(s['answer'])==set(expected);checked+=1
s=steps['L14-C02'];f=S.diff(function(s['graph']['model']),x);expected=[p['id'] for p in s['graph']['pickPoints'] if f.subs(x,p['x']-S.Rational(1,1000))>0 and f.subs(x,p['x']+S.Rational(1,1000))<0]
assert set(s['answer'])==set(expected);checked+=1
formula_checked=0
for s in steps.values():
    if s['kind']!='formula':continue
    spec=s['formula'];f=function(s['graph']['model'])
    answers=[s['answer']]+spec.get('alternatives',[])
    if spec['layout']=='linear':
        for tokens in answers:assert S.expand(S.Rational(tokens[0])*x+S.Rational(tokens[1])-f)==0,s['id']
    elif spec.get('symbolic'):
        a,b,fa,fb=S.symbols('a b fa fb');mapping={'a':a,'b':b,'f(a)':fa,'f(b)':fb}
        for tokens in answers:
            u,v,w,z=[mapping[t] for t in tokens]
            assert S.simplify((u-v)/(w-z)-(fb-fa)/(b-a))==0,s['id']
    else:
        a=s['graph']['at'];b=s['graph']['secondAt'];expected=(f.subs(x,b)-f.subs(x,a))/(b-a)
        for tokens in answers:
            u,v,w,z=map(S.Rational,tokens)
            assert w!=z and S.simplify((u-v)/(w-z)-expected)==0,s['id']
    formula_checked+=1
report={'independent_scene_answers':checked,'independent_formula_answers':formula_checked,'failures':[]}
Path('.validation-runtime/scene-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(f'SymPy: {checked} ответов о сценах и {formula_checked} сборок формул проверено независимо')
