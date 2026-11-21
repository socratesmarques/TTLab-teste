import { describe, it, expect } from "vitest";
import { starter, empty, decode, encode, blades, rubbers } from "./catalog";
import {
  analyze,
  optimize,
  defaults,
  targets,
  profiles,
  utility,
  type Goal,
} from "./model";
describe("Catálogo e montagem", () => {
  it("rejeita versões, identificadores e variações inválidas", () => {
    for (const raw of [
      "bad",
      "{}",
      JSON.stringify({ v: 2, build: starter }),
      encode({ ...starter, blade: "x" }),
      encode({ ...starter, fh: { id: "flux", mm: 12, hard: 45 } }),
    ])
      expect(() => decode(raw)).toThrow();
    for (const build of [empty, starter, { ...starter, fh: null }])
      expect(decode(encode(build))).toEqual(build);
  });
  it("só calcula montagens completas", () => expect(analyze(empty)).toBeNull());
  it("varia as faces independentemente e conserva peso e custo", () => {
    const base = analyze(starter)!,
      changed = analyze({ ...starter, fh: { ...starter.fh!, mm: 2.1 } })!;
    expect(changed.fh).not.toEqual(base.fh);
    expect(changed.bh).toEqual(base.bh);
    expect(changed.grams).toBeGreaterThan(base.grams);
    expect(changed.price).toBe(2582);
    expect(changed.balance).toBeGreaterThan(11);
  });
  it("mantém as nove escalas limitadas em todas as variantes", () => {
    for (const blade of blades)
      for (const r of rubbers)
        for (const mm of r.thickness)
          for (const hard of r.hardness) {
            const a = analyze({
              ...starter,
              blade: blade.id,
              fh: { id: r.id, mm, hard },
            })!;
            expect(a.fh).toHaveLength(9);
            expect(a.fh.every((v) => v >= 0 && v <= 100)).toBe(true);
          }
  });
});
describe("Otimizador", () => {
  it("preserva restrições conjuntas e ordena por utilidade", () => {
    const criteria = {
      ...defaults(),
      keep: true,
      brand: "Butterfly",
      budget: 3000,
      sheets: "iguais",
      hard: 36,
      mm: 1.9,
    };
    const result = optimize(starter, criteria);
    expect(result.results.length).toBeGreaterThan(0);
    for (const m of result.results) {
      expect(m.build.blade).toBe(starter.blade);
      expect(m.build.fh).toEqual({id:"butterfly-tenergy-05",mm:1.9,hard:36});
      expect(m.build.bh).toEqual(m.build.fh);
      expect(m.stats.price).toBeLessThanOrEqual(3000);
    }
  });
  it("retorna vazio sob orçamento impossível", () =>
    expect(optimize(empty, { ...defaults(), budget: 0 }).results).toEqual([]));
  it("altera metas e ordenação com o estilo, é determinístico", () => {
    const query = (p: string) =>
      optimize(empty, { ...defaults(), fh: targets(p), bh: targets(p) })
        .results;
    expect(query(profiles[0])[0].build).not.toEqual(query("OFF+")[0].build);
    expect(query("ALL")).toEqual(query("ALL"));
  });
  it("favorece preço sem perder as restrições", () => {
    const result = optimize(empty, {
      ...defaults(),
      value: true,
      sheets: "diferentes",
    });
    expect(result.results.every((x) => x.build.fh!.id !== x.build.bh!.id)).toBe(
      true,
    );
    expect(
      result.results.every(
        (r, i) => !i || r.rank <= result.results[i - 1].rank,
      ),
    ).toBe(true);
  });
  it.each<Goal>([
    "Velocidade",
    "Efeito",
    "Controle",
    "Equilíbrio",
    "Peso",
    "Custo-benefício",
  ])("melhora o objetivo %s em relação à original", (goal) => {
    const a = analyze(starter)!;
    const { results } = optimize(starter, {
      ...defaults(),
      goal,
      fh: a.fh,
      bh: a.bh,
    });
    expect(results.length).toBeGreaterThan(0);
    for (const r of results)
      expect(utility(r.stats, goal)).toBeGreaterThan(utility(a, goal));
  });
});
