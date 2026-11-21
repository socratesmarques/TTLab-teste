export type Blade = {
  id: string;
  name: string;
  brand: string;
  profile: string;
  rigidity: number;
  grams: number;
  price: number;
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
  price: number;
  thickness: number[];
  hardness: number[];
  color: string;
};
export const blades: Blade[] = [
  {
    id: "atlas",
    name: "Atlas Five",
    brand: "Orla",
    profile: "ALL+",
    rigidity: 58,
    grams: 84,
    price: 190,
    plies: 5,
    color: "#bb8958",
  },
  {
    id: "cedro",
    name: "Cedro Flex",
    brand: "Orla",
    profile: "DEF",
    rigidity: 32,
    grams: 76,
    price: 125,
    plies: 5,
    color: "#bc925e",
  },
  {
    id: "vetor",
    name: "Vetor Carbon",
    brand: "Pulso",
    profile: "OFF+",
    rigidity: 91,
    grams: 92,
    price: 340,
    plies: 7,
    color: "#93623e",
  },
  {
    id: "linha",
    name: "Linha Sete",
    brand: "Dobra",
    profile: "OFF−",
    rigidity: 72,
    grams: 87,
    price: 225,
    plies: 7,
    color: "#c58e56",
  },
  ...["DEF", "ALL", "OFF"].map((profile, i) => ({
    id: "generic" + i,
    name: "Madeira genérica " + profile,
    brand: "Genérica",
    profile,
    rigidity: 35 + 23 * i,
    grams: 78 + 5 * i,
    price: 145 + 42 * i,
    plies: 5,
    color: "#bf9566",
    generic: true,
  })),
];
export const rubbers: Rubber[] = [
  {
    id: "flux",
    name: "Flux 45",
    brand: "Orla",
    pace: 73,
    grip: 83,
    grams: 46,
    price: 115,
    thickness: [1.8, 2, 2.2],
    hardness: [42, 45],
    color: "#ad302c",
  },
  {
    id: "tempo",
    name: "Tempo Touch",
    brand: "Dobra",
    pace: 48,
    grip: 72,
    grams: 39,
    price: 75,
    thickness: [1.5, 1.8, 2],
    hardness: [37, 40],
    color: "#cc4434",
  },
  {
    id: "orbita",
    name: "Órbita Pro",
    brand: "Pulso",
    pace: 92,
    grip: 90,
    grams: 50,
    price: 175,
    thickness: [2, 2.2],
    hardness: [47, 50],
    color: "#862224",
  },
  {
    id: "brisa",
    name: "Brisa Soft",
    brand: "Orla",
    pace: 42,
    grip: 64,
    grams: 36,
    price: 65,
    thickness: [1.5, 1.8],
    hardness: [35],
    color: "#d24c39",
  },
  {
    id: "giro",
    name: "Giro S",
    brand: "Dobra",
    pace: 63,
    grip: 95,
    grams: 45,
    price: 135,
    thickness: [1.8, 2],
    hardness: [44, 47],
    color: "#b73735",
  },
  {
    id: "pulso",
    name: "Impulso X",
    brand: "Pulso",
    pace: 83,
    grip: 76,
    grams: 44,
    price: 105,
    thickness: [1.8, 2.1],
    hardness: [43, 46],
    color: "#c33a24",
  },
];
export type Face = { id: string; mm: number; hard: number };
export type Build = { blade: string | null; fh: Face | null; bh: Face | null };
export const empty: Build = { blade: null, fh: null, bh: null };
export const starter: Build = {
  blade: "atlas",
  fh: { id: "flux", mm: 2, hard: 45 },
  bh: { id: "tempo", mm: 1.8, hard: 40 },
};
export const wood = (b: Build) => blades.find((x) => x.id === b.blade);
export const rubber = (f: Face | null) => rubbers.find((x) => x.id === f?.id);
export const firstFace = (r: Rubber): Face => ({
  id: r.id,
  mm: r.thickness[0],
  hard: r.hardness[0],
});
export const money = (n: number) =>
  n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
export function decode(raw: string): Build {
  const v = JSON.parse(raw);
  if (v?.v !== 1 || !v.build) throw Error("Formato de montagem desconhecido.");
  const { blade, fh, bh } = v.build;
  if (blade !== null && !blades.some((b) => b.id === blade))
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
