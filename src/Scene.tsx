import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Shape,
  CanvasTexture,
  RepeatWrapping,
  DoubleSide,
  SRGBColorSpace,
  Spherical,
  Vector3,
  PerspectiveCamera,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { wood, rubber, type Build } from "./catalog";
export type View = "Frente" | "Verso" | "Camadas";
type Props = { build: Build; view: View; reset: number; zoom: number };

const face = new Shape();
face.moveTo(-0.22, -0.59);
face.bezierCurveTo(-0.53, -0.55, -0.97, -0.14, -0.97, 0.55);
face.bezierCurveTo(-0.99, 1.88, 0.99, 1.88, 0.97, 0.55);
face.bezierCurveTo(0.96, -0.14, 0.52, -0.55, 0.22, -0.59);
face.closePath();
const handle = new Shape();
handle.moveTo(-0.2, -0.54);
handle.quadraticCurveTo(0, -0.39, 0.2, -0.54);
handle.quadraticCurveTo(0.13, -1.18, 0.22, -1.78);
handle.quadraticCurveTo(0, -1.86, -0.22, -1.78);
handle.quadraticCurveTo(-0.13, -1.18, -0.2, -0.54);
function grain() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#efd0a4";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 140; i++) {
    g.strokeStyle = "rgba(117,72,29," + (0.08 + 0.06 * Math.cos(i)) + ")";
    g.beginPath();
    g.moveTo(i * 2, 0);
    g.bezierCurveTo(i * 2 + 4, 80, i * 2 - 4, 160, i * 2, 256);
    g.stroke();
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping;
  return t;
}
function rubberFinish(name: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d")!;
  const pixels = g.createImageData(512, 512);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const grain = 220 + Math.floor(30 * Math.random());
    pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = grain;
    pixels.data[i + 3] = 255;
  }
  g.putImageData(pixels, 0, 0);
  g.fillStyle = "#bfbab6";
  g.font = "bold 23px sans-serif";
  g.fillText("TT / LAB", 164, 418);
  g.font = "12px sans-serif";
  g.fillText(name.toUpperCase(), 165, 437);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.offset.set(0.5, 0.31);
  t.repeat.set(0.47, 0.44);
  return t;
}
function Model({ build, view }: Props) {
  const b = wood(build),
    grainMap = useMemo(grain, []);
  useEffect(() => () => grainMap.dispose(), [grainMap]);
  const frontName = rubber(build.fh)?.name ?? "",
    backName = rubber(build.bh)?.name ?? "";
  const finishes = useMemo(
    () => [rubberFinish(frontName), rubberFinish(backName)],
    [frontName, backName],
  );
  useEffect(() => () => finishes.forEach((t) => t.dispose()), [finishes]);
  const layer = (
    shape: Shape,
    z: number,
    d: number,
    color: string,
    wooden = false,
    key?: number | string,
    finish?: CanvasTexture,
  ) => (
    <mesh key={key} position-z={z}>
      <extrudeGeometry
        args={[
          shape,
          {
            depth: d,
            bevelEnabled: true,
            bevelSegments: 2,
            steps: 1,
            bevelSize: 0.005,
            bevelThickness: 0.004,
            curveSegments: 38,
          },
        ]}
      />
      <meshStandardMaterial
        color={color}
        map={wooden ? grainMap : (finish ?? null)}
        bumpMap={finish}
        bumpScale={0.002}
        roughness={wooden ? 0.49 : 0.76}
      />
    </mesh>
  );
  const count = b?.plies ?? 5,
    gap = view === "Camadas" ? 0.085 : 0;
  return (
    <group rotation={[0.08, 0, -0.48]} position-y={0.09}>
      {Array.from({ length: count }, (_, i) =>
        layer(
          face,
          (i - count / 2) * (0.012 + gap),
          0.012,
          i % 2 ? "#765138" : (b?.color ?? "#cfac7c"),
          true,
          i,
        ),
      )}
      {(["fh", "bh"] as const).map((k, i) => {
        const f = build[k],
          r = rubber(f);
        if (!r || !f) return null;
        const depth = f.mm * 0.013,
          sign = i ? -1 : 1,
          base = sign * ((count * (0.012 + gap)) / 2 + gap * 3);
        return (
          <group key={k}>
            {layer(face, base - (i ? depth : 0), depth, "#f0aa67")}
            {layer(
              face,
              base + sign * depth - (i ? 0.013 : 0),
              0.013,
              i
                ? ["tempo", "brisa"].includes(r.id)
                  ? "#283132"
                  : "#231f28"
                : r.color,
              false,
              undefined,
              finishes[i],
            )}
          </group>
        );
      })}
      {layer(handle, -0.115, 0.23, b?.color ?? "#d4ad78", true)}
      {[-1, 1].map((n) => (
        <group key={n} position={[0, -1.19, n * 0.124]}>
          <mesh>
            <boxGeometry args={[0.082, 1.16, 0.012]} />
            <meshStandardMaterial color="#253e36" />
          </mesh>
          <mesh position-x={0.064}>
            <boxGeometry args={[0.019, 1.14, 0.013]} />
            <meshStandardMaterial color="#f6dfa6" />
          </mesh>
          <mesh position={[0, -0.39, n * 0.012]}>
            <circleGeometry args={[0.056, 24]} />
            <meshStandardMaterial color="#ebc16a" side={DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
function Camera({ view, reset, zoom }: Props) {
  const { camera, gl, invalidate } = useThree(),
    ctrl = useRef<OrbitControls | null>(null),
    target = useRef<Spherical | null>(null);
  useEffect(() => {
    const c = new OrbitControls(camera, gl.domElement);
    ctrl.current = c;
    c.enablePan = false;
    c.minDistance = 3.4;
    c.maxDistance = 8;
    c.addEventListener("change", () => invalidate());
    c.addEventListener("start", () => {
      target.current = null;
    });
    return () => c.dispose();
  }, [camera, gl, invalidate]);
  useEffect(() => {
    const phi = view === "Camadas" ? 1.22 : 1.37,
      theta =
        view === "Verso" ? Math.PI + 0.25 : view === "Camadas" ? 1.08 : 0.54;
    target.current = new Spherical(5.85, phi, theta);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      camera.position.setFromSpherical(target.current);
      ctrl.current?.update();
      target.current = null;
    }
    invalidate();
  }, [view, reset, camera, invalidate]);
  useEffect(() => {
    (camera as PerspectiveCamera).zoom = zoom;
    (camera as PerspectiveCamera).updateProjectionMatrix();
    invalidate();
  }, [camera, zoom, invalidate]);
  useFrame((_, dt) => {
    const t = target.current;
    if (!t) return;
    const p = new Spherical().setFromVector3(camera.position),
      k = 1 - Math.exp(-12 * Math.min(dt, 0.1));
    p.theta +=
      Math.atan2(Math.sin(t.theta - p.theta), Math.cos(t.theta - p.theta)) * k;
    p.phi += (t.phi - p.phi) * k;
    p.radius += (t.radius - p.radius) * k;
    camera.position.setFromSpherical(p);
    ctrl.current?.update();
    if (camera.position.distanceTo(new Vector3().setFromSpherical(t)) > 0.004)
      invalidate();
    else target.current = null;
  });
  return null;
}
export default function Scene(props: Props) {
  return (
    <Canvas
      frameloop="demand"
      camera={{ position: [1.4, 1, 5.5], fov: 37 }}
      dpr={[1, 1.75]}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={1.7} />
      <directionalLight position={[-3, 6, 5]} intensity={3} />
      <directionalLight position={[2, 2, -4]} intensity={2} />
      <Model {...props} />
      <Camera {...props} />
    </Canvas>
  );
}
