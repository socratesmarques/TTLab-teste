import type {ProductRecord} from "./records";
import {realBlades,realRubbers} from "./records";
import {legacyBlades,legacyRubbers} from "./legacy";
export type Blade = {
  id: string;
  name: string;
  brand: string;
  profile: string;
  rigidity: number;
  grams: number;
  price: number | null;
  record?: ProductRecord;
  plies: number;
  color: string;
  generic?: boolean;
};
export type Rubber = {
  id: string;
  name: string;
  brand: string;
  pace: number;
  grip: number;
  grams: number;
  price: number | null;
  record?: ProductRecord;
  thickness: number[];
  hardness: number[];
  color: string;
};
export type Face = { id: string; mm: number; hard: number };
export type Build = { blade: string | null; fh: Face | null; bh: Face | null };
export const blades:Blade[]=[...realBlades,...legacyBlades.filter(x=>x.generic).map(x=>({...x,price:null}))]
export const rubbers:Rubber[]=realRubbers
const bladeIds=new Map([...legacyBlades.map(x=>({...x,price:null})),...blades].map(x=>[x.id,x]))
const rubberIds=new Map([...legacyRubbers.map(x=>({...x,price:null})),...rubbers].map(x=>[x.id,x]))
export const empty: Build = { blade: null, fh: null, bh: null };
export const starter: Build = {
  blade:"butterfly-viscaria",
  fh: { id:"butterfly-tenergy-05",mm:1.9,hard:36 },
  bh: { id:"butterfly-rozena",mm:1.9,hard:35 },
};
export const wood = (b: Build) => bladeIds.get(b.blade??"");
export const rubber = (f: Face | null) => rubberIds.get(f?.id??"");
export const firstFace = (r: Rubber): Face => ({
  id: r.id,
  mm: r.thickness[0],
  hard: r.hardness[0],
});
export const money = (n: number|null) => n===null?"Preço indisponível":
  n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
export function decode(raw: string): Build {
  const v = JSON.parse(raw);
  if (v?.v !== 1 || !v.build) throw Error("Formato de montagem desconhecido.");
  const { blade, fh, bh } = v.build;
  if (blade !== null && !bladeIds.has(blade))
    throw Error("Madeira desconhecida.");
  for (const face of [fh, bh]) {
    if (face === null) continue;
    const r = rubber(face);
    if (!r || !r.thickness.includes(face.mm) || !r.hardness.includes(face.hard))
      throw Error("Variação de borracha inválida.");
  }
  return { blade, fh, bh };
}
export const encode = (build: Build) => JSON.stringify({ v: 1, build });
