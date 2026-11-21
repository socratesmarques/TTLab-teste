import { Component, lazy, Suspense, useState, type ReactNode } from "react";
import { Box, RotateCcw, Plus, Minus, Move, Layers } from "lucide-react";
import type { View } from "./Scene";
import { wood, rubber, type Build } from "./catalog";
const Scene = lazy(() => import("./Scene"));
class Boundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
export function Viewer({ build }: { build: Build }) {
  const [view, setView] = useState<View>("Frente"),
    [reset, setReset] = useState(0),
    [zoom, setZoom] = useState(1);
  const [gpu] = useState(() => {
    try {
      const c = document.createElement("canvas").getContext("webgl2");
      c?.getExtension("WEBGL_lose_context")?.loseContext();
      return !!c;
    } catch {
      return false;
    }
  });
  const fallback = (
    <div className="fallback">
      <div
        className="flatBat"
        style={{
          transform: "rotate(28deg) scale(" + zoom + ")",
          background:
            view === "Verso"
              ? build.bh
                ? "#222d32"
                : "#cfaa7a"
              : (rubber(build.fh)?.color ?? "#cfaa7a"),
        }}
      />
      <small>Prévia 2D · WebGL indisponível</small>
      {view === "Camadas" && (
        <span>
          {[rubber(build.fh)?.name, wood(build)?.name, rubber(build.bh)?.name]
            .filter(Boolean)
            .join(" / ")}
        </span>
      )}
    </div>
  );
  return (
    <section className="viewer" aria-label="Visualizador da raquete">
      <div className="stage">
        <div className="court" />
        <div className="stageTop">
          <span>
            <i /> Visualizador
          </span>
          <Box size={19} />
        </div>
        <div className="scene">
          {gpu ? (
            <Boundary fallback={fallback}>
              <Suspense
                fallback={<div className="skeleton">Carregando modelo…</div>}
              >
                <Scene {...{ build, view, reset, zoom }} />
              </Suspense>
            </Boundary>
          ) : (
            fallback
          )}
        </div>
        <div className="stageBase">
          <span>{wood(build)?.profile ?? "PRÉVIA"}</span>
          <small>{wood(build)?.name ?? "Formato de referência"}</small>
        </div>
        <div className="zoom">
          {[
            [Plus, "Aproximar", 0.15],
            [Minus, "Afastar", -0.15],
            [RotateCcw, "Restaurar câmera", 0],
          ].map(([Icon, label, d]) => {
            const I = Icon as typeof Plus;
            return (
              <button
                aria-label={String(label)}
                key={String(label)}
                onClick={() => {
                  if (d)
                    setZoom(Math.min(1.5, Math.max(0.7, zoom + Number(d))));
                  else {
                    setZoom(1);
                    setView("Frente");
                    setReset(reset + 1);
                  }
                }}
              >
                <I size={16} />
              </button>
            );
          })}
        </div>
      </div>
      <div className="viewBar">
        <div className="seg">
          {(["Frente", "Verso", "Camadas"] as const).map((v) => (
            <button
              key={v}
              aria-pressed={view === v}
              onClick={() => setView(v)}
            >
              {v === "Camadas" && <Layers size={13} />} {v}
            </button>
          ))}
        </div>
        <small>
          {gpu && (
            <>
              <Move size={14} /> Arraste para girar
            </>
          )}
        </small>
      </div>
    </section>
  );
}
