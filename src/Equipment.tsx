import { useEffect, useRef, useState, type ReactNode } from "react";
import { X, Search, ArrowUpRight, Trash2, Layers, Plus } from "lucide-react";
import {
  blades,
  rubbers,
  rubber,
  wood,
  firstFace,
  money,
  type Build,
  type Face,
} from "./catalog";
import { titles } from "./model";
export type Slot = keyof Build;
export function Dialog({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current!;
    d.showModal();
    return () => d.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={close}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      <div className="dialogBody">
        <div className="row">
          <h2>{title}</h2>
          <button className="icon" aria-label="Fechar" onClick={close}>
            <X />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export function Picker({
  initial,
  build,
  change,
  close,
}: {
  initial: Slot | "all";
  build: Build;
  change: (b: Build) => void;
  close: () => void;
}) {
  const [slot, setSlot] = useState(initial),
    [search, setSearch] = useState("");
  const items = (
    slot === "all"
      ? [...blades, ...rubbers]
      : slot === "blade"
        ? blades
        : rubbers
  ).filter((x) =>
    normalize(
      x.name + " " + x.brand + " " + ("profile" in x ? x.profile : ""),
    ).includes(normalize(search.trim())),
  );
  return (
    <Dialog title="Buscar equipamento" close={close}>
      <label className="search">
        <Search size={17} />
        <input
          aria-label="Nome ou fabricante"
          placeholder="Nome do modelo ou fabricante…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      <div className="seg">
        {(["all", "blade", "fh", "bh"] as const).map((k) => (
          <button key={k} aria-pressed={slot === k} onClick={() => setSlot(k)}>
            {k === "all" ? "Todos" : titles[k]}
          </button>
        ))}
      </div>
      <h3>{search ? "Resultados" : "Equipamentos disponíveis"}</h3>
      {items.length === 0 && (
        <p>
          Nenhum equipamento encontrado. Experimente outro nome ou fabricante.
        </p>
      )}
      {items.map((x) =>
        slot === "all" && !("plies" in x) ? (
          <div key={x.id} className="result rubberChoice">
            <span>
              <b>{x.name}</b>
              <small>
                {x.brand} · {money(x.price)}
              </small>
            </span>
            {(["fh", "bh"] as const).map((k) => (
              <button
                key={k}
                aria-label={"Usar " + x.name + " em " + titles[k]}
                onClick={() => {
                  change({ ...build, [k]: firstFace(x) });
                  close();
                }}
              >
                {k.toUpperCase()}
              </button>
            ))}
          </div>
        ) : (
          <button
            className="result"
            key={x.id}
            onClick={() => {
              change({
                ...build,
                [slot === "all" ? "blade" : slot]:
                  "plies" in x ? x.id : firstFace(x),
              });
              close();
            }}
          >
            <div className={"swatch " + slot} />
            <span>
              <b>{x.name}</b>
              <small>
                {x.brand} ·{" "}
                {"plies" in x
                  ? x.profile + " · " + x.plies + " lâminas"
                  : x.thickness.join(" / ") + " mm"}
              </small>
            </span>
            <span>{money(x.price)}</span>
            <Plus size={16} />
          </button>
        ),
      )}
    </Dialog>
  );
}
export function Parts({
  build,
  change,
  pick,
}: {
  build: Build;
  change: (b: Build) => void;
  pick: (k: Slot) => void;
}) {
  return (
    <section className="parts">
      <div className="row">
        <h2>Componentes</h2>
        <span className="counter">
          {Object.values(build).filter(Boolean).length} de 3
        </span>
      </div>
      {(["blade", "fh", "bh"] as const).map((k) => {
        const item = k === "blade" ? wood(build) : rubber(build[k]),
          face = k === "blade" ? null : build[k];
        const setFace = (delta: Partial<Face>) =>
          change({ ...build, [k]: { ...face, ...delta } });
        return (
          <article className="part" key={k}>
            <div className="partLine">
              <div className={"swatch " + k}>
                <Layers size={25} />
              </div>
              <div className="partInfo">
                <small>{titles[k]}</small>
                <h3>{item?.name ?? "Selecionar " + titles[k].toLowerCase()}</h3>
                {item && (
                  <small>
                    {item.brand} · {item.grams} g estimados
                  </small>
                )}
              </div>
              <button
                className="icon"
                aria-label={"Escolher " + titles[k]}
                onClick={() => pick(k)}
              >
                {item ? <ArrowUpRight size={18} /> : <Plus size={18} />}
              </button>
              {item && (
                <button
                  className="icon remove"
                  aria-label={"Remover " + titles[k]}
                  onClick={() => change({ ...build, [k]: null })}
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
            {item && (
              <div className="spec">
                {"plies" in item ? (
                  <>
                    <span>{item.profile}</span>
                    <span>{item.plies} lâminas</span>
                  </>
                ) : (
                  face && (
                    <>
                      <select
                        aria-label={"Espessura " + titles[k]}
                        value={face.mm}
                        onChange={(e) => setFace({ mm: +e.target.value })}
                      >
                        {item.thickness.map((x) => (
                          <option key={x} value={x}>
                            {x} mm
                          </option>
                        ))}
                      </select>
                      <select
                        aria-label={"Dureza " + titles[k]}
                        value={face.hard}
                        onChange={(e) => setFace({ hard: +e.target.value })}
                      >
                        {item.hardness.map((x) => (
                          <option key={x} value={x}>
                            {x}° {item.brand}
                          </option>
                        ))}
                      </select>
                    </>
                  )
                )}
                <strong>{money(item.price)}</strong>
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}
