import { useLayoutEffect, useRef, useState, useEffect } from "react";
import type { Blast, ClearedCell } from "../game/blast";
import type { Grid } from "../game/types";
import { COLOR_META } from "../game/types";
import { CubeFace } from "./Cube";

export interface BoardEffect {
  nonce: number;
  cleared: ClearedCell[];
  blasts: Blast[];
}

interface Particle {
  id: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
}

export function BlastBoard({
  grid,
  onTap,
  effect,
  disabled,
  selected = null,
  impact = 0,
}: {
  grid: Grid;
  onTap: (r: number, c: number) => void;
  effect: BoardEffect | null;
  disabled?: boolean;
  selected?: { r: number; c: number } | null;
  impact?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState(0);
  const n = grid.length;
  const cell = box / (n || 1);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setBox(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const drag = useRef<{ r: number; c: number; x: number; y: number } | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [beams, setBeams] = useState<Blast[]>([]);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (!effect || cell === 0) return;
    const sample = effect.cleared.slice(0, 8);
    const next: Particle[] = sample.map((cc, idx) => {
      const ang = Math.random() * Math.PI * 2;
      const dist = cell * 0.7;
      return {
        id: `${effect.nonce}-${idx}`,
        x: cc.c * cell + cell / 2,
        y: cc.r * cell + cell / 2,
        dx: Math.cos(ang) * dist,
        dy: Math.sin(ang) * dist - cell * 0.25,
        color: COLOR_META[cc.color].glow,
      };
    });
    setParticles(next);
    setBeams(effect.blasts);
    setShake(true);
    const punch = window.setTimeout(() => setShake(false), 180);
    const clearFx = window.setTimeout(() => {
      setParticles([]);
      setBeams([]);
    }, 380);
    return () => {
      window.clearTimeout(punch);
      window.clearTimeout(clearFx);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effect?.nonce]);

  const cells: { r: number; c: number; cube: NonNullable<Grid[number][number]> }[] =
    [];
  for (let r = 0; r < n; r++)
    for (let c = 0; c < grid[r].length; c++) {
      const cube = grid[r][c];
      if (cube) cells.push({ r, c, cube });
    }

  return (
    <div
      ref={ref}
      className={`aw-board ${shake ? (impact >= 3 ? "aw-shake-hard" : "aw-shake") : ""}`}
      style={{ ["--n" as string]: n }}
    >
      {box > 0 && (
        <>
          {cells.map(({ r, c, cube }) => {
            const picked = selected?.r === r && selected?.c === c;
            return (
              <button
                key={cube.id}
                type="button"
                disabled={disabled}
                onPointerDown={(e) => {
                  if (disabled) return;
                  drag.current = { r, c, x: e.clientX, y: e.clientY };
                  e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerUp={(e) => {
                  if (disabled || !drag.current) return;
                  const dx = e.clientX - drag.current.x;
                  const dy = e.clientY - drag.current.y;
                  const start = drag.current;
                  drag.current = null;
                  if (Math.hypot(dx, dy) > cell * 0.28) {
                    const to =
                      Math.abs(dx) > Math.abs(dy)
                        ? { r: start.r, c: start.c + (dx > 0 ? 1 : -1) }
                        : { r: start.r + (dy > 0 ? 1 : -1), c: start.c };
                    onTap(start.r, start.c);
                    onTap(to.r, to.c);
                    return;
                  }
                  onTap(r, c);
                }}
                className={`aw-slot ${picked ? "is-picked" : ""}`}
                style={{
                  width: cell,
                  height: cell,
                  transform: `translate3d(${c * cell}px, ${r * cell}px, 0) scale(${picked ? 1.06 : 1})`,
                }}
              >
                <CubeFace
                  color={cube.color}
                  power={cube.power}
                  crate={cube.crate}
                  size={cell * 0.9}
                />
              </button>
            );
          })}

          <div className="aw-fx">
            {beams.map((b, i) => (
              <BlastBeam key={`${effect?.nonce}-${i}`} blast={b} cell={cell} n={n} />
            ))}
            {particles.map((p) => (
              <span
                key={p.id}
                className="aw-particle"
                style={{
                  background: p.color,
                  left: p.x,
                  top: p.y,
                  ["--dx" as string]: `${p.dx}px`,
                  ["--dy" as string]: `${p.dy}px`,
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function BlastBeam({
  blast,
  cell,
  n,
}: {
  blast: Blast;
  cell: number;
  n: number;
}) {
  if (blast.type === "rocketH") {
    return (
      <span
        className="aw-beam aw-fx-fade"
        style={{ top: blast.r * cell + cell * 0.2, left: 0, height: cell * 0.6, width: n * cell }}
      />
    );
  }
  if (blast.type === "rocketV") {
    return (
      <span
        className="aw-beam aw-fx-fade"
        style={{ left: blast.c * cell + cell * 0.2, top: 0, width: cell * 0.6, height: n * cell }}
      />
    );
  }
  if (blast.type === "bomb") {
    const d = cell * 5;
    return (
      <span
        className="aw-boom aw-fx-fade"
        style={{
          left: blast.c * cell + cell / 2 - d / 2,
          top: blast.r * cell + cell / 2 - d / 2,
          width: d,
          height: d,
        }}
      />
    );
  }
  return <span className="aw-disco-flash aw-fx-fade" />;
}
