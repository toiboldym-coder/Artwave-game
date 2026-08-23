import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
}: {
  grid: Grid;
  onTap: (r: number, c: number) => void;
  effect: BoardEffect | null;
  disabled?: boolean;
  selected?: { r: number; c: number } | null;
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
  const [beams, setBeams] = useState<{ nonce: number; blasts: Blast[] }>({
    nonce: 0,
    blasts: [],
  });
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (!effect || cell === 0) return;
    const sample = effect.cleared.slice(0, 44);
    const next: Particle[] = [];
    sample.forEach((cc, idx) => {
      const cx = cc.c * cell + cell / 2;
      const cy = cc.r * cell + cell / 2;
      const bits = 2;
      for (let i = 0; i < bits; i++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = cell * (0.5 + Math.random());
        next.push({
          id: `${effect.nonce}-${idx}-${i}`,
          x: cx,
          y: cy,
          dx: Math.cos(ang) * dist,
          dy: Math.sin(ang) * dist - cell * 0.3,
          color: COLOR_META[cc.color].glow,
        });
      }
    });
    setParticles(next);
    setBeams({ nonce: effect.nonce, blasts: effect.blasts });
    if (effect.blasts.length) {
      setShake(true);
      const t = setTimeout(() => setShake(false), 260);
      const t2 = setTimeout(() => setBeams({ nonce: effect.nonce, blasts: [] }), 420);
      return () => {
        clearTimeout(t);
        clearTimeout(t2);
      };
    }
    const t = setTimeout(() => setParticles([]), 600);
    return () => clearTimeout(t);
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
      className={`aw-board ${shake ? "aw-shake" : ""}`}
      style={{ ["--n" as string]: n }}
    >
      {box > 0 && (
        <>
          <AnimatePresence>
            {cells.map(({ r, c, cube }) => (
              <motion.button
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
                className={`aw-slot ${selected?.r === r && selected?.c === c ? "is-picked" : ""}`}
                style={{ width: cell, height: cell }}
                initial={{ opacity: 0, scale: 0.4, x: c * cell, y: r * cell - cell * 4 }}
                animate={{ opacity: 1, scale: 1, x: c * cell, y: r * cell }}
                exit={{ opacity: 0, scale: 0, transition: { duration: 0.16 } }}
                transition={{
                  type: "spring",
                  stiffness: 640,
                  damping: 30,
                  mass: 0.7,
                }}
                whileTap={{ scale: 0.86 }}
              >
                <CubeFace
                  color={cube.color}
                  power={cube.power}
                  crate={cube.crate}
                  size={cell * 0.9}
                />
              </motion.button>
            ))}
          </AnimatePresence>

          <div className="aw-fx">
            {beams.blasts.map((b, i) => (
              <BlastBeam key={`${beams.nonce}-${i}`} blast={b} cell={cell} n={n} />
            ))}
            <AnimatePresence>
              {particles.map((p) => (
                <motion.span
                  key={p.id}
                  className="aw-particle"
                  style={{ background: p.color }}
                  initial={{ x: p.x, y: p.y, opacity: 1, scale: 1 }}
                  animate={{ x: p.x + p.dx, y: p.y + p.dy, opacity: 0, scale: 0.3 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              ))}
            </AnimatePresence>
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
      <motion.span
        className="aw-beam"
        style={{ top: blast.r * cell + cell * 0.2, left: 0, height: cell * 0.6, width: n * cell }}
        initial={{ opacity: 0.9, scaleX: 0 }}
        animate={{ opacity: 0, scaleX: 1 }}
        transition={{ duration: 0.4 }}
      />
    );
  }
  if (blast.type === "rocketV") {
    return (
      <motion.span
        className="aw-beam"
        style={{ left: blast.c * cell + cell * 0.2, top: 0, width: cell * 0.6, height: n * cell }}
        initial={{ opacity: 0.9, scaleY: 0 }}
        animate={{ opacity: 0, scaleY: 1 }}
        transition={{ duration: 0.4 }}
      />
    );
  }
  if (blast.type === "bomb") {
    const d = cell * 5;
    return (
      <motion.span
        className="aw-boom"
        style={{
          left: blast.c * cell + cell / 2 - d / 2,
          top: blast.r * cell + cell / 2 - d / 2,
          width: d,
          height: d,
        }}
        initial={{ opacity: 0.85, scale: 0.2 }}
        animate={{ opacity: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
      />
    );
  }
  return (
    <motion.span
      className="aw-disco-flash"
      initial={{ opacity: 0.7 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
    />
  );
}
