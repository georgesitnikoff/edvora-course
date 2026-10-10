export type Q = { n: number; d: number }

const gcd = (a: number, b: number): number => b === 0 ? Math.abs(a) : gcd(b, a % b)
export function q(n: number, d = 1): Q {
  if (!Number.isSafeInteger(n) || !Number.isSafeInteger(d) || d === 0) throw new Error('Некорректная рациональная дробь')
  const sign = d < 0 ? -1 : 1
  const divisor = gcd(n, d)
  return { n: sign * n / divisor, d: sign * d / divisor }
}
export function rational(value: number | Q): Q {
  if (typeof value !== 'number') return q(value.n, value.d)
  if (!Number.isFinite(value)) throw new Error('Число должно быть конечным')
  if (Number.isInteger(value)) return q(value)
  // Inputs are author-defined decimal parameters; irrational results never use this conversion.
  const text=String(value).includes('e')?value.toFixed(7):String(value)
  const decimals=(text.split('.')[1]??'').length
  if(decimals>7||Number(text)!==value)throw new Error('Авторские десятичные параметры должны быть точными и иметь не более 7 знаков после запятой')
  return q(Math.round(value * 10 ** decimals), 10 ** decimals)
}
export const add = (a: Q, b: Q) => {const g=gcd(a.d,b.d);return q(a.n*(b.d/g)+b.n*(a.d/g),a.d*(b.d/g))}
export const neg = (a: Q) => q(-a.n, a.d)
export const sub = (a: Q, b: Q) => add(a, neg(b))
export const mul = (a: Q, b: Q) => {const g1=gcd(a.n,b.d),g2=gcd(b.n,a.d);return q((a.n/g1)*(b.n/g2),(a.d/g2)*(b.d/g1))}
export const div = (a: Q, b: Q) => {if(b.n===0)throw new Error('Деление на ноль');return mul(a,q(b.d,b.n))}
export const numberOf = (a: Q) => a.n / a.d
export function formatNumber(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return 'не определено'
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: digits, useGrouping: false }).format(Math.abs(value) < 1e-10 ? 0 : value)
}
export function texQ(a: Q): string {
  return a.d === 1 ? String(a.n) : `${a.n < 0 ? '-' : ''}\\frac{${Math.abs(a.n)}}{${a.d}}`
}
export function plainQ(a: Q): string { return a.d === 1 ? String(a.n) : `${a.n}/${a.d}` }
export function displayQ(a:Q):string{
  let denominator=a.d,twos=0,fives=0
  while(denominator%2===0){denominator/=2;twos++}
  while(denominator%5===0){denominator/=5;fives++}
  return denominator===1&&Math.max(twos,fives)<=8?formatNumber(numberOf(a),Math.max(twos,fives)):plainQ(a)
}
export function parseAnswer(raw: string): number | null {
  const cleaned = raw.trim().replace(/−/g, '-').replace(/,/g, '.').replace(/\s/g, '')
  if (/^[+-]?\d+(?:\.\d+)?(?:\/[+-]?\d+(?:\.\d+)?)?$/.test(cleaned)) {
    const [n, d = '1'] = cleaned.split('/')
    const value = Number(n) / Number(d)
    return Number.isFinite(value) ? value : null
  }
  return null
}
