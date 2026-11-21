import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Bookmark,
  BookmarkPlus,
  Share2,
  Search,
  RotateCcw,
  SlidersHorizontal,
  Compass,
  ArrowRight,
  Activity,
  Weight,
  Scale,
  Wallet,
  TriangleAlert,
  ChevronRight,
  Box,
} from "lucide-react";
import { decode, encode, empty, money, starter, type Build } from "./catalog";
import { analyze, sides, titles } from "./model";
import { Parts, Picker, Dialog, type Slot } from "./Equipment";
import { Viewer } from "./Viewer";
import { Radar } from "./Radar";
import { SearchLab } from "./SearchLab";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/barlow-condensed/latin-600.css";
import "./style.css";
function TableTennisPaddle({ size = 23 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M8 16C3 8 11 2 17 4c7 2 8 10 2 14-3 2-6 2-9 0l-5 7-3-2z" />
      <path d="m7 12 13 5" />
      <circle cx="23" cy="5" r="3" fill="#f47b49" stroke="none" />
    </svg>
  );
}
type Saved = { name: string; raw: string };
const key = "ttlab:library:v1";
function initial() {
  const param = new URLSearchParams(location.search).get("r");
  try {
    return { build: param === null ? starter : decode(param), message: "" };
  } catch {
    return {
      build: empty,
      message:
        "Link inválido. Selecione os componentes ou abra uma montagem salva.",
    };
  }
}
function library(): Saved[] {
  const value = JSON.parse(localStorage.getItem(key) ?? "[]");
  if (
    !Array.isArray(value) ||
    value.some((x) => typeof x?.name !== "string" || typeof x.raw !== "string")
  )
    throw Error();
  return value;
}
function App() {
  const [start] = useState(initial),
    [build, setBuild] = useState<Build>(start.build),
    [message, msg] = useState(start.message),
    [mode, modeTo] = useState<"build" | "discover" | "improve">("build"),
    [picker, pick] = useState<Slot | "all" | null>(null);
  const [dialog, show] = useState<
      "save" | "library" | "reset" | "share" | null
    >(null),
    [saved, saveList] = useState<Saved[]>([]),
    [name, setName] = useState(""),
    [link, setLink] = useState(""),
    [problem, fail] = useState("");
  const stats = analyze(build),
    count = Object.values(build).filter(Boolean).length;
  const change = (b: Build) => {
    setBuild(b);
    msg("");
    const url = new URL(location.href);
    if (url.searchParams.has("r")) {
      url.searchParams.delete("r");
      history.replaceState({}, "", url);
    }
  };
  function openLibrary() {
    fail("");
    try {
      saveList(library());
    } catch {
      saveList([]);
      fail("Não foi possível ler a biblioteca neste navegador.");
    }
    show("library");
  }
  function save() {
    try {
      const all = [{ name: name.trim(), raw: encode(build) }, ...library()];
      localStorage.setItem(key, JSON.stringify(all));
      show(null);
      msg("Montagem salva na biblioteca.");
    } catch {
      fail("Falha ao salvar. Verifique o espaço e as permissões do navegador.");
    }
  }
  function share() {
    const u = new URL(location.href);
    u.searchParams.set("r", encode(build));
    setLink(u.href);
    fail("");
    show("share");
  }
  const nav = (m: typeof mode) => {
    modeTo(m);
    msg("");
    window.scrollTo(0, 0);
  };
  return (
    <>
      <a className="skip" href="#main">
        Pular para o conteúdo
      </a>
      <header>
        <div className="shell head">
          <div className="brand">
            <TableTennisPaddle />
            <b>
              TT<span>Lab</span>
            </b>
          </div>
          <div className="divider" />
          <nav aria-label="Ferramentas">
            <button
              aria-pressed={mode === "build"}
              onClick={() => nav("build")}
            >
              <SlidersHorizontal />
              Construtor
            </button>
            <button
              aria-pressed={mode !== "build"}
              onClick={() => nav("discover")}
            >
              <Compass />
              Explorar
            </button>
          </nav>
          <button className="library" onClick={openLibrary}>
            <Bookmark /> Biblioteca
          </button>
        </div>
      </header>
      <main id="main" className="shell">
        <div className="crumb">
          Laboratório <ChevronRight size={12} />{" "}
          {mode === "build"
            ? "Construtor"
            : mode === "discover"
              ? "Explorar"
              : "Melhorar montagem"}
        </div>
        <div className="hero">
          <div>
            <h1>
              {mode === "build"
                ? "Construtor de raquetes"
                : mode === "improve"
                  ? "Melhorar montagem"
                  : "Explorar combinações"}
            </h1>
            <p>
              {mode === "build"
                ? "Monte sua combinação e compare o desempenho de cada face."
                : mode === "improve"
                  ? "Escolha o que melhorar e compare as mudanças com sua raquete."
                  : "Defina seu estilo e encontre uma montagem para a sua forma de jogar."}
            </p>
          </div>
          {mode === "build" && (
            <div className="actions">
              <button onClick={share}>
                <Share2 />
                Compartilhar
              </button>
              <button
                className="primary"
                onClick={() => {
                  setName("");
                  fail("");
                  show("save");
                }}
              >
                <BookmarkPlus />
                Salvar montagem
              </button>
            </div>
          )}
        </div>
        {message && (
          <p className="notice" role="status">
            {message}
          </p>
        )}
        {mode === "build" ? (
          <>
            <div className="workbench">
              <div className="visual">
                <div className="sectionTitle">
                  <Box />
                  <h2>Bancada 3D</h2>
                  <small className="demo">Catálogo demo</small>
                </div>
                <Viewer build={build} />
              </div>
              <div className="selection">
                <button className="quick" onClick={() => pick("all")}>
                  <Search size={17} />
                  Busca rápida de equipamentos
                </button>
                <Parts {...{ build, change, pick }} />
                <button
                  className="reset"
                  onClick={() => show("reset")}
                  disabled={!count}
                >
                  <RotateCcw size={14} /> Reiniciar montagem
                </button>
              </div>
            </div>
            <section className="analysis">
              <div className="row">
                <div className="sectionTitle">
                  <Activity />
                  <h2>Análise da montagem</h2>
                </div>
                <button disabled={!stats} onClick={() => nav("improve")}>
                  Melhorar montagem <ArrowRight size={15} />
                </button>
              </div>
              {stats ? (
                <>
                  <div className="metrics">
                    {[
                      [Weight, "Peso estimado", stats.grams + " g"],
                      [Scale, "Ponto de equilíbrio", stats.balance + " cm"],
                      [Wallet, "Custo estimado", money(stats.price)],
                    ].map(([Icon, label, value]) => {
                      const I = Icon as typeof Weight;
                      return (
                        <div key={String(label)}>
                          <I />
                          <span>
                            {String(label)}
                            <b>{String(value)}</b>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="character">
                    {sides
                      .map((k) => {
                        const score = stats[k],
                          top = [0, 1, 4].reduce((a, b) =>
                            score[a] >= score[b] ? a : b,
                          );
                        return (
                          titles[k] +
                          " com destaque para " +
                          ["velocidade", "efeito", "", "", "controle"][top]
                        );
                      })
                      .join(" · ")}
                    .
                  </p>
                  <div className="radars">
                    {sides.map((s) => (
                      <Radar key={s} values={stats[s]} label={titles[s]} />
                    ))}
                  </div>
                </>
              ) : (
                <p className="notice">
                  <TriangleAlert size={17} /> Selecione as três peças para
                  calcular os indicadores. Faltam {3 - count}.
                </p>
              )}
            </section>
          </>
        ) : (
          <SearchLab
            key={mode}
            origin={build}
            improve={mode === "improve"}
            apply={(b) => {
              change(b);
              nav("build");
              msg("Recomendação aplicada à bancada.");
            }}
          />
        )}
        <footer>
          <TableTennisPaddle size={17} />
          <b>TTLab</b>
          <span>
            Catálogo demonstrativo · Preços, dimensões e desempenho são
            estimativas.
          </span>
        </footer>
      </main>
      {picker && (
        <Picker
          initial={picker}
          {...{ build, change }}
          close={() => pick(null)}
        />
      )}
      {dialog && (
        <Dialog
          title={
            {
              save: "Salvar montagem",
              library: "Biblioteca de montagens",
              reset: "Reiniciar montagem?",
              share: "Compartilhar montagem",
            }[dialog]
          }
          close={() => show(null)}
        >
          {dialog === "save" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (name.trim()) save();
              }}
            >
              <label>
                Nome da montagem
                <input
                  required
                  maxLength={80}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex. Treino de sábado"
                />
              </label>
              <button className="primary" disabled={!name.trim()}>
                Salvar neste navegador
              </button>
            </form>
          ) : dialog === "library" ? (
            <>
              {!saved.length && (
                <p>
                  Sua biblioteca está vazia. Use “Salvar montagem” na bancada.
                </p>
              )}
              {saved.map((s, i) => (
                <button
                  key={i}
                  className="result"
                  onClick={() => {
                    try {
                      change(decode(s.raw));
                      nav("build");
                      show(null);
                    } catch {
                      fail(
                        "Esta montagem contém equipamentos ou opções inválidas.",
                      );
                    }
                  }}
                >
                  {s.name}
                  <ArrowRight size={16} />
                </button>
              ))}
            </>
          ) : dialog === "reset" ? (
            <>
              <p>As três peças serão removidas da bancada.</p>
              <button
                className="primary"
                onClick={() => {
                  change(empty);
                  show(null);
                }}
              >
                Remover todas as peças
              </button>
            </>
          ) : (
            <>
              <label>
                Link para esta configuração
                <input
                  readOnly
                  value={link}
                  onFocus={(e) => e.target.select()}
                />
              </label>
              <button
                className="primary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(link);
                    msg("Link copiado.");
                    show(null);
                  } catch {
                    fail("Selecione e copie o link acima.");
                  }
                }}
              >
                Copiar link
              </button>
            </>
          )}
          {problem && <p role="alert">{problem}</p>}
        </Dialog>
      )}
    </>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
