import { useEffect, useMemo, useRef, useState } from "react";
import { duckBed, sfx } from "../audio/sfx";
import { Avatar } from "../components/Avatar";
import { BoosterBar } from "../components/BoosterBar";
import { ResultOverlay } from "../components/ResultOverlay";
import { COLOR_META, type Color, type HeroId } from "../game/types";
import type { LevelDef } from "../game/types";
import { boosterHintFor, heroById } from "../story/characters";
import { LOSE_LINES, WIN_LINES, randomLine } from "../story/script";
import type { SaveState } from "../state/store";
import { useShiftTalk } from "./useShiftTalk";

const PALETTE: Color[] = ["teal", "violet", "amber", "red"];

const emptyGrid = (rows: number, cols: number): (Color | null)[][] =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));

const lockedCount = (grid: (Color | null)[][]) =>
  grid.filter((row) => row[0] && row.every((cell) => cell === row[0])).length;

const lowestEmpty = (grid: (Color | null)[][], col: number) => {
  for (let r = grid.length - 1; r >= 0; r--) {
    if (grid[r][col] === null) return r;
  }
  return -1;
};

const bestColumn = (grid: (Color | null)[][], color: Color) => {
  let best = 0;
  let score = -999;
  const cols = grid[0]?.length ?? 0;
  for (let c = 0; c < cols; c++) {
    const row = lowestEmpty(grid, c);
    if (row < 0) continue;
    let s = 0;
    if (grid[row][c - 1] === color) s += 4;
    if (grid[row][c + 1] === color) s += 4;
    const projected = grid[row].map((cell, i) => (i === c ? color : cell));
    if (projected.every((cell) => cell === color)) s += 24;
    s += projected.filter((cell) => cell === color).length;
    if (s > score) {
      score = s;
      best = c;
    }
  }
  return best;
};

export function WallGame({
  level,
  save,
  onWin,
  onExit,
  onSpendBooster,
}: {
  level: LevelDef;
  save: SaveState;
  onWin: (stars: number) => void;
  onExit: () => void;
  onSpendBooster: (id: HeroId) => void;
}) {
  const cfg = level.wall!;
  const hero = heroById(save.hero ?? "artem");
  const [grid, setGrid] = useState(() => emptyGrid(cfg.rows, cfg.cols));
  const [next, setNext] = useState<Color>(() => PALETTE[0]);
  const [locked, setLocked] = useState(0);
  const [status, setStatus] = useState<"play" | "win" | "lose">("play");
  const [heat, setHeat] = useState(1);
  const [hold, setHold] = useState(0);
  const timer = useRef<number | null>(null);
  const gridRef = useRef(grid);
  const nextRef = useRef(next);
  const statusRef = useRef(status);
  const { line, say } = useShiftTalk(hero.id);

  gridRef.current = grid;
  nextRef.current = next;
  statusRef.current = status;

  const pickNext = () => PALETTE[Math.floor(Math.random() * PALETTE.length)];

  useEffect(() => {
    duckBed();
  }, []);

  const applyDrop = (col: number, color: Color) => {
    if (statusRef.current !== "play") return false;
    const copy = gridRef.current.map((row) => row.slice());
    const row = lowestEmpty(copy, col);
    if (row < 0) {
      setStatus("lose");
      return false;
    }
    copy[row][col] = color;
    const rowsDone = lockedCount(copy);
    gridRef.current = copy;
    setGrid(copy);
    if (rowsDone > locked) {
      sfx.row();
      say(true);
    } else {
      sfx.tap();
    }
    setLocked(rowsDone);
    return true;
  };

  const drop = (col: number) => {
    if (status !== "play") return;
    if (!applyDrop(col, nextRef.current)) return;
    setNext(pickNext());
    setHeat((h) => h + 1);
  };

  useEffect(() => {
    if (status !== "play") return;
    if (locked >= cfg.needRows) setStatus("win");
  }, [locked, cfg.needRows, status]);

  useEffect(() => {
    if (status !== "play") return;
    if (timer.current) window.clearTimeout(timer.current);
    const wait = Math.max(900, cfg.dropMs - heat * 40) + hold;
    timer.current = window.setTimeout(() => {
      const g = gridRef.current;
      const open = g[0]
        .map((_, c) => c)
        .filter((c) => lowestEmpty(g, c) >= 0);
      if (!open.length) {
        setStatus("lose");
        return;
      }
      const col = open[Math.floor(Math.random() * open.length)];
      applyDrop(col, nextRef.current);
      setNext(pickNext());
      setHeat((h) => h + 1);
      setHold(0);
    }, wait);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [heat, status, hold, cfg.dropMs]);

  const reset = () => {
    const fresh = emptyGrid(cfg.rows, cfg.cols);
    gridRef.current = fresh;
    setGrid(fresh);
    setNext(pickNext());
    setLocked(0);
    setStatus("play");
    setHeat(1);
    setHold(0);
  };

  const useBooster = () => {
    if (status !== "play" || !save.hero) return;
    if (save.boosters[save.hero] <= 0) return;
    if (hero.id === "adil") {
      setHold(8000);
    } else if (hero.id === "aidar") {
      const g = gridRef.current.map((row) => row.slice());
      const row = [...g].reverse().findIndex((line) => !line[0] || line.some((cell) => cell !== line[0]));
      const idx = row < 0 ? -1 : g.length - 1 - row;
      if (idx < 0) return;
      const color = g[idx].find((cell) => cell) ?? nextRef.current;
      for (let c = 0; c < cfg.cols; c++) g[idx][c] = color;
      gridRef.current = g;
      setGrid(g);
      const rowsDone = lockedCount(g);
      setLocked(rowsDone);
      sfx.row();
      say(true);
    } else {
      drop(bestColumn(gridRef.current, nextRef.current));
    }
    sfx.booster();
    onSpendBooster(save.hero);
  };

  const minDrops = cfg.needRows * cfg.cols;
  const stars =
    locked > cfg.needRows ? 3 : heat <= minDrops + 3 ? 3 : heat <= minDrops + 8 ? 2 : 1;
  const preview = useMemo(() => COLOR_META[next], [next]);
  const hintCol = hero.id === "artem" ? bestColumn(grid, next) : -1;

  return (
    <div className="aw-screen aw-mini aw-wall">
      <header className="aw-lvl-head">
        <button className="aw-back" onClick={onExit}>
          ←
        </button>
        <div className="aw-lvl-title">
          <span className="mono aw-eyebrow">led · уровень {level.id}</span>
          <span className="aw-lvl-name">{level.title}</span>
        </div>
        <div className="aw-moves">
          <span className="aw-moves-num">{Math.max(0, cfg.needRows - locked)}</span>
          <span className="aw-moves-label">рядов</span>
        </div>
      </header>

      <div className="aw-goals">
        <div className="aw-goal">
          <span
            className="aw-goal-cube"
            style={{
              background: `linear-gradient(150deg, ${preview.glow}, ${preview.fill}, ${preview.deep})`,
            }}
          />
          <span className="aw-muted aw-small">кабинет в ряд своего цвета</span>
        </div>
      </div>

      <div className="aw-wall-board" style={{ ["--cols" as string]: cfg.cols }}>
        {grid.map((row, r) => {
          const mono = !!row[0] && row.every((cell) => cell === row[0]);
          return (
            <div key={r} className={`aw-wall-row ${mono ? "is-full" : ""}`}>
              {row.map((cell, c) => {
                const meta = cell ? COLOR_META[cell] : null;
                return (
                  <button
                    key={`${r}-${c}`}
                    className={`aw-wall-cell ${hintCol === c && !cell ? "is-hint" : ""}`}
                    onClick={() => drop(c)}
                    style={
                      meta
                        ? {
                            background: `linear-gradient(150deg, ${meta.glow}, ${meta.fill}, ${meta.deep})`,
                          }
                        : undefined
                    }
                  />
                );
              })}
            </div>
          );
        })}
      </div>
      <p className="aw-mini-hint">Тапни колонку. Засчитается только ряд одного цвета.</p>

      <div className="aw-table-talk">
        {line && (
          <div className="aw-quip">
            <Avatar hero={line.speaker} size={40} float={false} />
            <p>
              <b>{line.speaker.name}</b>
              {line.text}
            </p>
          </div>
        )}
      </div>

      <BoosterBar
        hero={hero}
        hint={boosterHintFor(hero.id, "wall")}
        count={save.hero ? save.boosters[save.hero] : 0}
        onUse={useBooster}
      />

      {status !== "play" && (
        <ResultOverlay
          win={status === "win"}
          stars={stars}
          hero={hero}
          levelTitle={level.title}
          heroLine={
            status === "win"
              ? randomLine(WIN_LINES[hero.id], `win-${hero.id}`)
              : randomLine(LOSE_LINES[hero.id], `lose-${hero.id}`)
          }
          accent={hero.accentHex}
          onNext={() => onWin(stars)}
          onRetry={reset}
          onExit={onExit}
        />
      )}
    </div>
  );
}
