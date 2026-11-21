import {
  blades,
  rubbers,
  wood,
  rubber,
  type Build,
  type Face,
  type Blade,
  type Rubber,
} from "./catalog";
import {compliance,numbers} from "./records";
export const axes = [
  "Velocidade",
  "Efeito",
  "Arco",
  "Tempo de contato",
  "Controle",
  "Tolerância",
  "Elasticidade",
  "Catapulta",
  "Nitidez",
];
export const sides = ["fh", "bh"] as const;
export const titles = { blade: "Madeira", fh: "Forehand", bh: "Backhand" };
const bounded = (v: number) => Math.round(Math.min(100, Math.max(0, v)));
function side(b: Blade, r: Rubber, f: Face) {
  const flex = 100 - b.rigidity,
    soft = r.record ? compliance(r) : 100 - (f.hard - 30) * 3,
    sponge = bounded((f.mm - 1.2) * 75);
  const speed = 0.35 * b.rigidity + 0.48 * r.pace + 0.17 * sponge;
  const control = 102 - 0.45 * speed + 0.16 * soft - 0.08 * sponge;
  return [
    speed,
    0.7 * r.grip + 0.18 * soft + 0.12 * sponge,
    0.52 * r.grip + 0.28 * flex + 0.2 * sponge,
    0.48 * flex + 0.42 * soft + 0.1 * sponge,
    control,
    0.6 * control + 0.4 * soft,
    0.35 * flex + 0.35 * sponge + 0.3 * soft,
    0.5 * r.pace + 0.3 * sponge + 0.2 * soft,
    0.55 * b.rigidity + 0.45 * (100 - soft),
  ].map(bounded);
}
export function analyze(build: Build) {
  const b = wood(build),
    f = rubber(build.fh),
    h = rubber(build.bh);
  if (!b || !f || !h || !build.fh || !build.bh) return null;
  return combine(b,faceData(b,f,build.fh),faceData(b,h,build.bh))
}
function faceData(b:Blade,r:Rubber,f:Face){
 const [length=157,width=150]=numbers(b.record?.declared.Cabeça)
 const areaFactor=(length*width)/(157*150)
 return {values:side(b,r,f),grams:(r.grams+6*(f.mm-2))*areaFactor,price:r.price}
}
function combine(b:Blade,f:ReturnType<typeof faceData>,h:ReturnType<typeof faceData>){
 const sheets=f.grams+h.grams,grams=b.grams+sheets
 return {fh:f.values,bh:h.values,grams:Math.round(grams),price:b.price!==null&&f.price!==null&&h.price!==null?b.price+f.price+h.price:null,balance:Math.round((b.grams*11+sheets*17.5)/grams*10)/10}
}
export type Stats = NonNullable<ReturnType<typeof analyze>>;
export const profiles = [
  "DEF−",
  "DEF",
  "DEF+",
  "ALL−",
  "ALL",
  "ALL+",
  "OFF−",
  "OFF",
  "OFF+",
];
export function targets(profile: string) {
  const attack = Math.max(0, profiles.indexOf(profile)) / 8;
  return [
    32 + 55 * attack,
    66 + 18 * attack,
    65,
    78 - 40 * attack,
    91 - 33 * attack,
    87 - 40 * attack,
    57,
    31 + 47 * attack,
    28 + 53 * attack,
  ].map(Math.round);
}
export type Goal =
  | "Velocidade"
  | "Efeito"
  | "Controle"
  | "Equilíbrio"
  | "Peso"
  | "Custo-benefício";
export type Criteria = {
  fh: number[];
  bh: number[];
  budget: number | null;
  brand: string;
  sheets: string;
  mm: number;
  hard: number;
  value: boolean;
  keep: boolean;
  goal?: Goal;
};
export const defaults = (): Criteria => ({
  fh: targets("ALL"),
  bh: targets("ALL"),
  budget: null,
  brand: "",
  sheets: "livre",
  mm: 0,
  hard: 0,
  value: false,
  keep: false,
});
export function utility(s: Stats, goal: Goal) {
  if (goal === "Peso") return -s.grams;
  if (goal === "Equilíbrio") return -Math.abs(s.balance - 14) * 10;
  if (goal === "Custo-benefício")
    return (100 * (s.fh[4] + s.bh[4] + s.fh[1] + s.bh[1])) / (4 * (s.price??Infinity));
  const axis = axes.indexOf(goal);
  return (s.fh[axis] + s.bh[axis]) / 2;
}
export type Match = { build: Build; stats: Stats; score: number; rank: number };
export function optimize(origin: Build, c: Criteria) {
  const original=analyze(origin), results:Match[]=[]
  const priceRequired=c.budget!==null || c.goal==='Custo-benefício' || c.value
  const candidates=rubbers.filter(r=>(!c.brand||r.brand===c.brand)&&(!priceRequired||r.price!==null)).flatMap(r=>
    r.thickness.filter(mm=>!c.mm||mm===c.mm).flatMap(mm=>r.hardness.filter(h=>!c.hard||h===c.hard).map(hard=>({r,face:{id:r.id,mm,hard}}))))
  const weights=[2,2,1,1,2,1,1,1,1]
  const distance=(values:number[],target:number[])=>values.reduce((sum,n,i)=>sum+weights[i]*Math.abs(n-target[i]),0)/24
  const order=(a:Match,b:Match)=>b.rank-a.rank||(a.stats.price??Infinity)-(b.stats.price??Infinity)
  let evaluated=0
  if(c.goal==='Custo-benefício' && original?.price==null)return {evaluated,results}
  const woods=c.keep?[wood(origin)].filter((b):b is Blade=>!!b):blades.filter(b=>!b.generic)
  for(const b of woods){
   if((priceRequired&&b.price===null))continue
   const variants=candidates.map(({r,face})=>{const data=faceData(b,r,face);return {face,data,fhError:distance(data.values,c.fh),bhError:distance(data.values,c.bh)}})
   for(const fh of variants)for(const bh of variants){
    if(c.sheets==='iguais'&&fh.face.id!==bh.face.id||c.sheets==='diferentes'&&fh.face.id===bh.face.id)continue
    if(c.budget!==null&&(b.price!+fh.data.price!+bh.data.price!)>c.budget)continue
    evaluated++
    const stats=combine(b,fh.data,bh.data)
    const gain=c.goal&&original?utility(stats,c.goal)-utility(original,c.goal):0
    if(c.goal&&gain<=0)continue
    const fit=100-fh.fhError-bh.bhError
    const rank=fit+(c.value&&stats.price?Math.max(0,20-stats.price/175):0)+2*gain
    const match={build:{blade:b.id,fh:fh.face,bh:bh.face},stats,score:Math.round(fit),rank}
    if(results.length===5&&order(match,results[4])>=0)continue
    const idx=results.findIndex(m=>m.build.blade===b.id&&m.build.fh?.id===fh.face.id&&m.build.bh?.id===bh.face.id)
    if(idx!==-1){if(order(match,results[idx])>=0)continue;results.splice(idx,1)}
    results.push(match);results.sort(order);if(results.length>5)results.pop()
   }
  }
  return {evaluated,results}
}
