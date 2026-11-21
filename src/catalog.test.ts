import {describe,expect,it} from 'vitest'
import {blades,rubbers,decode,encode,starter,empty,firstFace,rubber,wood,money} from './catalog'
import {defaults,optimize,analyze} from './model'
describe('Edição do catálogo',()=>{
 it('mantém IDs únicos, fichas verificadas e opções numéricas',()=>{
 const real=[...blades.filter(x=>!x.generic),...rubbers]
 expect(real.length).toBeGreaterThanOrEqual(65)
 expect(new Set(real.map(x=>x.id)).size).toBe(real.length)
 for(const x of real){expect(x.record?.url).toMatch(/^https:/);expect(x.record?.checked).toMatch(/^\d{4}-\d{2}-\d{2}$/);expect(Object.keys(x.record!.declared).length).toBeGreaterThan(0);if('thickness'in x){expect(x.hardness.length*x.thickness.length).toBeGreaterThan(0);expect(x.thickness.every(n=>n>0&&n<4)).toBe(true)}}
 })
 it('recupera IDs da edição demo sem ofertá-los como produtos reais',()=>{const b=decode('{"v":1,"build":{"blade":"atlas","fh":{"id":"flux","mm":2,"hard":45},"bh":null}}');expect(wood(b)?.name).toBe('Atlas Five');expect(rubber(b.fh)?.name).toBe('Flux 45');expect(blades.some(x=>x.id==='atlas')).toBe(false);expect(decode(encode(b))).toEqual(b)})
 it('propaga preço ausente e exclui combinações sem cotação de buscas financeiras',()=>{const b={...starter,fh:firstFace(rubbers.find(r=>r.price===null)!)};expect(analyze(b)?.price).toBe(null);expect(money(null)).toBe('Preço indisponível');const q=optimize(empty,{...defaults(),budget:2000});expect(q.results.length).toBeGreaterThan(0);expect(q.results.every(x=>x.stats.price!==null&&x.stats.price<=2000)).toBe(true)})
})
