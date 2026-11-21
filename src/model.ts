import {blades,rubbers,wood,rubber,type Build,type Face,type Blade,type Rubber} from './catalog'
export const axes=['Velocidade','Efeito','Arco','Tempo de contato','Controle','Tolerância','Elasticidade','Catapulta','Nitidez']
export const sides=['fh','bh'] as const
export const titles={blade:'Madeira',fh:'Forehand',bh:'Backhand'}
const bounded=(v:number)=>Math.round(Math.min(100,Math.max(0,v)))
function side(b:Blade,r:Rubber,f:Face){
 const flex=100-b.rigidity, soft=100-(f.hard-30)*3, sponge=(f.mm-1.4)*85
 const speed=.35*b.rigidity+.48*r.pace+.17*sponge
 const control=102-.45*speed+.16*soft-.08*sponge
 return [speed,.7*r.grip+.18*soft+.12*sponge,.52*r.grip+.28*flex+.2*sponge,.48*flex+.42*soft+.1*sponge,control,.6*control+.4*soft,.35*flex+.35*sponge+.3*soft,.5*r.pace+.3*sponge+.2*soft,.55*b.rigidity+.45*(100-soft)].map(bounded)
}
export function analyze(build:Build){
 const b=wood(build), f=rubber(build.fh), h=rubber(build.bh)
 if(!b||!f||!h||!build.fh||!build.bh)return null
 const mass=(r:Rubber,v:Face)=>r.grams+6*(v.mm-2)+.15*(v.hard-r.hardness[0])
 const sheets=mass(f,build.fh)+mass(h,build.bh), grams=b.grams+sheets
 return {fh:side(b,f,build.fh),bh:side(b,h,build.bh),grams:Math.round(grams),price:b.price+f.price+h.price,balance:Math.round((b.grams*11+sheets*17.5)/grams*10)/10}
}
export type Stats=NonNullable<ReturnType<typeof analyze>>
export const profiles=['DEF−','DEF','DEF+','ALL−','ALL','ALL+','OFF−','OFF','OFF+']
export function targets(profile:string){
 const attack=Math.max(0,profiles.indexOf(profile))/8
 return [32+55*attack,66+18*attack,65,78-40*attack,91-33*attack,87-40*attack,57,31+47*attack,28+53*attack].map(Math.round)
}
export type Goal='Velocidade'|'Efeito'|'Controle'|'Equilíbrio'|'Peso'|'Custo-benefício'
export type Criteria={fh:number[];bh:number[];budget:number|null;brand:string;sheets:string;mm:number;hard:number;value:boolean;keep:boolean;goal?:Goal}
export const defaults=():Criteria=>({fh:targets('ALL'),bh:targets('ALL'),budget:null,brand:'',sheets:'livre',mm:0,hard:0,value:false,keep:false})
export function utility(s:Stats,goal:Goal){
 if(goal==='Peso')return -s.grams
 if(goal==='Equilíbrio')return -Math.abs(s.balance-14)*10
 if(goal==='Custo-benefício')return 100*(s.fh[4]+s.bh[4]+s.fh[1]+s.bh[1])/(4*s.price)
 const axis=axes.indexOf(goal);return (s.fh[axis]+s.bh[axis])/2
}
export type Match={build:Build;stats:Stats;score:number;rank:number}
export function optimize(origin:Build,c:Criteria){
 const original=analyze(origin),matches:Match[]=[]
 const variants=rubbers.filter(r=>!c.brand||r.brand===c.brand).flatMap(r=>r.thickness.filter(x=>!c.mm||x===c.mm).flatMap(mm=>r.hardness.filter(x=>!c.hard||x===c.hard).map(hard=>({id:r.id,mm,hard}))))
 let evaluated=0
 for(const b of blades.filter(b=>c.keep?b.id===origin.blade:!b.generic)){
 if(c.brand&&b.brand!==c.brand)continue
 for(const fh of variants)for(const bh of variants){
 if(c.sheets==='iguais'&&fh.id!==bh.id||c.sheets==='diferentes'&&fh.id===bh.id)continue
 const build={blade:b.id,fh,bh},stats=analyze(build)!
 if(c.budget!==null&&stats.price>c.budget)continue
 evaluated++
 const gain=c.goal&&original?utility(stats,c.goal)-utility(original,c.goal):0
 if(c.goal&&gain<=0)continue
 const weights=[2,2,1,1,2,1,1,1,1]
 const error=sides.reduce((sum,k)=>sum+stats[k].reduce((v,x,i)=>v+weights[i]*Math.abs(x-c[k][i]),0),0)/24
 const score=Math.round(100-error), rank=100-error+(c.value?Math.max(0,20-stats.price/35):0)+gain*2
 matches.push({build,stats,score,rank})
 }}
 matches.sort((a,b)=>b.rank-a.rank||a.stats.price-b.stats.price)
 const seen=new Set<string>()
 return {evaluated,results:matches.filter(m=>{const key=[m.build.blade,m.build.fh?.id,m.build.bh?.id].join('/');if(seen.has(key))return false;seen.add(key);return true}).slice(0,5)}
}
