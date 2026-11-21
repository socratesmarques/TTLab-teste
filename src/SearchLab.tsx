import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal, ArrowRight, Printer } from "lucide-react";
import {
  analyze,
  axes,
  defaults,
  optimize,
  profiles,
  sides,
  targets,
  titles,
  utility,
  type Criteria,
  type Goal,
} from "./model";
import { blades, money, rubber, wood, type Build } from "./catalog";
import { Radar } from "./Radar";
const goals: Goal[] = [
  "Velocidade",
  "Efeito",
  "Controle",
  "Equilíbrio",
  "Peso",
  "Custo-benefício",
];
const summary = (b: Build) =>
  [wood(b)?.name, rubber(b.fh)?.name, rubber(b.bh)?.name]
    .map((x) => x ?? "Em aberto")
    .join(" / ");
const description = (b: Build) =>
  sides
    .map(
      (k) =>
        titles[k] +
        " " +
        (rubber(b[k])?.name ?? "—") +
        " · " +
        (b[k]?.mm ?? "—") +
        " mm · " +
        (b[k]?.hard ?? "—") +
        "°",
    )
    .join(" | ");
export function SearchLab({
  origin,
  improve,
  apply,
}: {
  origin: Build;
  improve: boolean;
  apply: (b: Build) => void;
}) {
  const original = analyze(origin);
  const [c, setC] = useState<Criteria>(() => ({
      ...defaults(),
      ...(improve && original
        ? {
            keep: true,
            fh: original.fh,
            bh: original.bh,
            goal: "Controle" as Goal,
          }
        : {}),
    })),
    [profile, setProfile] = useState("ALL"),
    [side, setSide] = useState<"fh" | "bh">("fh");
  const [report, setReport] = useState<ReturnType<typeof optimize> | null>(
      null,
    ),
    [active, setActive] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const worker = useRef<Worker | null>(null),
    resultRef = useRef<HTMLElement>(null);
  useEffect(() => () => worker.current?.terminate(), []);
  const update = (delta: Partial<Criteria>) => {
    worker.current?.terminate();
    setBusy(false);
    setReport(null);
    setError("");
    setC({ ...c, ...delta });
  };
  const run = () => {
    setBusy(true);
    setReport(null);
    setError("");
    try {
      const w = new Worker(new URL("./optimizer.worker.ts", import.meta.url), {
        type: "module",
      });
      worker.current = w;
      w.onmessage = (e) => {
        setReport(e.data);
        setActive(0);
        setBusy(false);
        w.terminate();
        requestAnimationFrame(() =>
          resultRef.current?.scrollIntoView({ block: "start" }),
        );
      };
      w.onerror = () => {
        setError("Falha na busca. Tente novamente.");
        setBusy(false);
        w.terminate();
      };
      w.postMessage({ origin, criteria: c });
    } catch {
      setError("O navegador não conseguiu iniciar a busca.");
      setBusy(false);
    }
  };
  const m = report?.results[active];
  return (
    <>
      <div className="explore">
        <section className="panel">
          <h2>{improve ? "Objetivo da melhoria" : "Perfil de jogo"}</h2>
          {improve ? (
            <label>
              Prioridade
              <select
                value={c.goal}
                onChange={(e) => update({ goal: e.target.value as Goal })}
              >
                {goals.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          ) : (
            <label>
              Estilo
              <select
                aria-label="Estilo"
                value={profile}
                onChange={(e) => {
                  setProfile(e.target.value);
                  update({
                    fh: targets(e.target.value),
                    bh: targets(e.target.value),
                  });
                }}
              >
                {profiles.map((x) => (
                  <option key={x} value={x}>
                    {x} ·{" "}
                    {x.startsWith("DEF")
                      ? "Defensivo"
                      : x.startsWith("ALL")
                        ? "Versátil"
                        : "Ofensivo"}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="formgrid">
            <label>
              Orçamento máximo (R$)
              <input
                type="number"
                min="0"
                placeholder="Sem limite"
                value={c.budget ?? ""}
                onChange={(e) =>
                  update({
                    budget:
                      e.target.value === ""
                        ? null
                        : Math.max(0, +e.target.value),
                  })
                }
              />
            </label>
            <label>
              Fabricante
              <select
                value={c.brand}
                onChange={(e) => update({ brand: e.target.value })}
              >
                <option value="">Todos</option>
                {[
                  ...new Set(
                    blades.filter((b) => !b.generic).map((b) => b.brand),
                  ),
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Modelos de borracha
              <select
                value={c.sheets}
                onChange={(e) => update({ sheets: e.target.value })}
              >
                {["livre", "iguais", "diferentes"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            {(["mm", "hard"] as const).map((k) => (
              <label key={k}>
                {k === "mm" ? "Espessura (mm)" : "Dureza (° demo)"}
                <select
                  value={c[k]}
                  onChange={(e) => update({ [k]: +e.target.value })}
                >
                  <option value={0}>Qualquer</option>
                  {(k === "mm"
                    ? [1.5, 1.8, 2, 2.1, 2.2]
                    : [35, 37, 40, 42, 43, 44, 45, 46, 47, 50]
                  ).map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <label className="check">
            <input
              type="checkbox"
              checked={c.keep}
              disabled={!origin.blade}
              onChange={(e) => update({ keep: e.target.checked })}
            />{" "}
            Manter a madeira atual
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={c.value}
              onChange={(e) => update({ value: e.target.checked })}
            />{" "}
            Priorizar custo-benefício
          </label>
          <button className="primary" disabled={busy} onClick={run}>
            <SlidersHorizontal size={16} />
            {busy ? "Comparando combinações…" : "Buscar recomendações"}
          </button>
          <p role="status">{error}</p>
        </section>
        <section className="panel">
          <div className="row">
            <h2>Metas por face</h2>
            <div className="seg">
              {sides.map((k) => (
                <button
                  key={k}
                  aria-pressed={side === k}
                  onClick={() => setSide(k)}
                >
                  {k.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <Radar label={titles[side]} values={c[side]} />
          <div className="sliders">
            {axes.map((a, i) => (
              <label key={a}>
                {a}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={c[side][i]}
                  onChange={(e) =>
                    update({
                      [side]: c[side].map((v, j) =>
                        j === i ? +e.target.value : v,
                      ),
                    })
                  }
                />
                <output>{c[side][i]}</output>
              </label>
            ))}
          </div>
        </section>
      </div>
      {report && (
        <section ref={resultRef} className="panel report" aria-live="polite">
          <div className="row">
            <h2>Relatório da busca</h2>
            <button onClick={() => window.print()}>
              <Printer size={15} /> Imprimir / PDF
            </button>
          </div>
          <p>
            {report.evaluated.toLocaleString("pt-BR")} combinações avaliadas ·{" "}
            {report.results.length} alternativas
          </p>
          <p>
            <b>Montagem original</b> · {summary(origin)}
            <br />
            {description(origin)}
            {original && (
              <>
                <br />
                {original.grams} g · {money(original.price)} · equilíbrio a{" "}
                {original.balance} cm
              </>
            )}
          </p>
          {!m ? (
            <p>
              Nenhuma alternativa atende aos critérios. Ajuste o orçamento, as
              variações ou a madeira fixa.
            </p>
          ) : (
            <>
              <div className="ranklist">
                {report.results.map((r, i) => (
                  <button
                    key={i}
                    aria-pressed={i === active}
                    onClick={() => setActive(i)}
                  >
                    <b>
                      {i + 1}. {summary(r.build)}
                    </b>
                    <span>
                      {r.score}% compatível · {money(r.stats.price)}
                    </span>
                  </button>
                ))}
              </div>
              <h3>{summary(m.build)}</h3>
              <p>{description(m.build)}</p>
              {original && (
                <ul aria-label="Alterações propostas">
                  {origin.blade !== m.build.blade && (
                    <li>
                      Madeira · {wood(origin)?.name} → {wood(m.build)?.name}
                    </li>
                  )}
                  {sides
                    .filter(
                      (k) =>
                        JSON.stringify(origin[k]) !==
                        JSON.stringify(m.build[k]),
                    )
                    .map((k) => (
                      <li key={k}>
                        {titles[k]} · {rubber(origin[k])?.name} ({origin[k]?.mm}{" "}
                        mm, {origin[k]?.hard}°) → {rubber(m.build[k])?.name} (
                        {m.build[k]?.mm} mm, {m.build[k]?.hard}°)
                      </li>
                    ))}
                </ul>
              )}
              <p>
                {m.stats.grams} g estimados · {money(m.stats.price)} ·
                equilíbrio a {m.stats.balance} cm do cabo.
              </p>
              <p>
                Compatibilidade de {m.score}% com as metas das duas faces.{" "}
                {c.value && "O preço também favoreceu esta posição."}{" "}
                {c.goal &&
                  original &&
                  "Ganho na função de " +
                    c.goal.toLowerCase() +
                    ": " +
                    (
                      utility(m.stats, c.goal) - utility(original, c.goal)
                    ).toFixed(1) +
                    " pontos."}
              </p>
              {original && (
                <p>
                  Variação sobre a original · {m.stats.grams - original.grams} g
                  · {money(m.stats.price - original.price)} ·{" "}
                  {(m.stats.balance - original.balance).toFixed(1)} cm.
                </p>
              )}
              <details className="comparison">
                <summary>Comparar os nove indicadores</summary>
                <table>
                  <caption>Estimativas de 0 a 100 · base e proposta</caption>
                  <thead>
                    <tr>
                      <th>Indicador</th>
                      {sides.map((k) => (
                        <th key={k}>{titles[k]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {axes.map((axis, i) => (
                      <tr key={axis}>
                        <th>{axis}</th>
                        {sides.map((k) => (
                          <td key={k}>
                            {(original?.[k] ?? c[k])[i]} → {m.stats[k][i]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
              <div className="radars">
                {sides.map((k) => (
                  <Radar
                    key={k}
                    label={
                      titles[k] +
                      " · proposta / " +
                      (original ? "original" : "meta")
                    }
                    values={m.stats[k]}
                    compare={original?.[k] ?? c[k]}
                  />
                ))}
              </div>
              {sides.map((k) => {
                const dif = m.stats[k].map((v, i) => v - c[k][i]),
                  best = dif
                    .map(Math.abs)
                    .indexOf(Math.min(...dif.map(Math.abs))),
                  worst = dif
                    .map(Math.abs)
                    .indexOf(Math.max(...dif.map(Math.abs)));
                return (
                  <p key={k}>
                    <b>{titles[k]}</b> · Maior aderência em{" "}
                    {axes[best].toLowerCase()} ({m.stats[k][best]}/100). Maior
                    distância em {axes[worst].toLowerCase()} (
                    {dif[worst] > 0 ? "+" : ""}
                    {dif[worst]} frente à meta).
                  </p>
                );
              })}
              <button className="primary" onClick={() => apply(m.build)}>
                Aplicar ao construtor <ArrowRight size={16} />
              </button>
            </>
          )}
        </section>
      )}
    </>
  );
}
