import raw from './products.json'
import type {Blade,Rubber} from './catalog'

export type Quote={amount:number;currency:string;date:string;shop:string;url:string}
export type ProductRecord={name:string;brand:string;url:string;checked:string;kind:string;declared:Record<string,string>;quote?:Quote}
const rows=raw as unknown as ProductRecord[]
export const plain=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
const base=(r:ProductRecord)=>({id:plain(r.brand+' '+r.name).replace(/[^a-z0-9]+/g,'-').replace(/-$/,''),brand:r.brand,name:r.name,price:r.quote?.amount??null,record:r})
export function numbers(s?:string){return (s?.match(/\d+(?:\.\d+)?/g)??[]).map(Number)}
// Ordinal position inside one brand and equipment type; never equate raw scales.
function ordinal(row:ProductRecord,key:string,neutral:number){
 const value=numbers(row.declared[key])[0]
 const peers=[...new Set(rows.filter(x=>x.brand===row.brand&&x.kind===row.kind).flatMap(x=>numbers(x.declared[key]).slice(0,1)))].sort((a,b)=>a-b)
 if(value===undefined||peers.length<3)return neutral
 return Math.round(40+45*peers.indexOf(value)/(peers.length-1))
}
export const realBlades:Blade[]=rows.filter(r=>r.kind==='blade').map(r=>{
 const f=r.declared,composition=f['Composição']??f.Camadas??'',style=f.Tipo??f.Estilo??'Allround'
 const profile=/defen/i.test(style)?'DEF':/offen/i.test(style)?'OFF':'ALL'
 const plies=(composition.match(/^\d+/)?Number.parseInt(composition):5)+(Number(composition.match(/\+\s*(\d+)/)?.[1])||0)
 const mass=numbers(f['Peso (g)'])
 const composite=/\+|carbon|fiber/i.test(composition)
 const baseline=profile==='DEF'?38:profile==='ALL'?50:composite?79:68
 return {...base(r),profile,plies,rigidity:Math.round(.65*baseline+.35*ordinal(r,f['Reação']?'Reação':'Velocidade',baseline)),grams:mass.length?Math.round(mass.reduce((a,b)=>a+b)/mass.length):profile==='DEF'?80:composite?88:84,color:composite?'#b78c60':'#d5a76d'}
})
export const realRubbers:Rubber[]=rows.filter(r=>r.kind==='rubber').map(r=>({...base(r),pace:ordinal(r,'Velocidade',65),grip:ordinal(r,'Efeito',70),grams:44,thickness:numbers(r.declared.Espessuras).sort((a,b)=>a-b),hardness:numbers(r.declared.Dureza).slice(0,1),color:/tack|sticky/i.test(Object.values(r.declared).join(' '))?'#9f262e':'#c83d38'}))
export const compliance=(r:Rubber)=>r.record?100-ordinal(r.record,'Dureza',50):100-(r.hardness[0]-30)*3
