import { axes } from "./model";
import { useState } from "react";
export function Radar({
  values,
  compare,
  label,
}: {
  values: number[];
  compare?: number[];
  label: string;
}) {
  const [axis, setAxis] = useState(0);
  const point = (i: number, r: number) => [
    160 + Math.cos((i * Math.PI * 2) / 9 - Math.PI / 2) * r,
    116 + Math.sin((i * Math.PI * 2) / 9 - Math.PI / 2) * r,
  ];
  const polygon = (a: number[]) =>
    a.map((v, i) => point(i, v * 0.79).join(",")).join(" ");
  return (
    <figure>
      <figcaption>{label}</figcaption>
      <svg
        viewBox="0 0 320 226"
        role="img"
        aria-label={label + " em nove dimensões"}
      >
        {[25, 50, 75, 100].map((v) => (
          <polygon
            key={v}
            points={polygon(axes.map(() => v))}
            fill="none"
            stroke="#dae3dd"
          />
        ))}
        {axes.map((x, i) => {
          const [px, py] = point(i, 79),
            [tx, ty] = point(i, 99);
          return (
            <g key={x}>
              <line x1={160} y1={116} x2={px} y2={py} stroke="#dae3dd" />
              <text
                x={tx}
                y={ty}
                textAnchor="middle"
                fontSize={10}
                fill="#415c52"
              >
                {
                  [
                    "Velocidade",
                    "Efeito",
                    "Arco",
                    "Contato",
                    "Controle",
                    "Tolerância",
                    "Elasticidade",
                    "Catapulta",
                    "Nitidez",
                  ][i]
                }
              </text>
            </g>
          );
        })}
        {compare && (
          <polygon
            points={polygon(compare)}
            fill="#e87b391a"
            stroke="#b95823"
            strokeDasharray="4 3"
          />
        )}
        <polygon
          points={polygon(values)}
          fill="#25876e33"
          stroke="#15715d"
          strokeWidth="2"
        />
        {values.map((x, i) => {
          const [cx, cy] = point(i, x * 0.79);
          return (
            <circle
              key={i}
              r={4}
              {...{ cx, cy }}
              fill="#126852"
              onMouseEnter={() => setAxis(i)}
            >
              <title>
                {axes[i]} · {x}
              </title>
            </circle>
          );
        })}
      </svg>
      <label className="axisRead">
        <select
          aria-label={"Indicador " + label}
          value={axis}
          onChange={(e) => setAxis(+e.target.value)}
        >
          {axes.map((x, i) => (
            <option key={x} value={i}>
              {x}
            </option>
          ))}
        </select>
        <b>{values[axis]} / 100</b>
        {compare && <small>Base {compare[axis]}</small>}
      </label>
    </figure>
  );
}
