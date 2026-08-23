import { useEffect, useMemo, useRef, useState } from "react";
import { ResultOverlay } from "../components/ResultOverlay";
import { COLOR_META, type Color } from "../game/types";
import type { LevelDef } from "../game/types";
import { heroById } from "../story/characters";
import { LOSE_LINES, WIN_LINES, randomLine } from "../story/script";
import type { SaveState } from "../state/store";

const PALETTE: Color[] = ["teal", "violet", "amber", "red"];

const emptyGrid = (rows: number, cols: number): (Color | null)[][] =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));

export function WallGame({
  level,
  save,
  onWin,
  onExit,
}: {
  level: LevelDef;
  save: SaveState;
  onWin: (stars: number) => void;
  onExit: () => void;
}) {
  const cfg = level.wall!;
  const hero = heroById(save.hero ?? "artem");
  const [grid, setGrid] = useState(() => emptyGrid(cfg.rows, cfg.cols));
  const [next, setNext] = useState<Color>(() => PALETTE[0]);
  const [locked, setLocked] = useState(0);
  const [status, setStatus] = useState<"play" | "win" | "lose">("play");
  const [heat, setHeat] = useState(1);
  const timer = useRef<number | null>(null);

  const pickNext = () => PALETTE[Math.floor(Math.random() * PALETTE.length)];

  const drop = (col: number) => {
    if (status !== "play") return;
    setGrid((prev) => {
      const copy = prev.map((row) => row.slice());
      let row = -1;
      for (let r = copy.length - 1; r >= 0; r--) {
        if (copy[r][col] === null) {
          row = r;
          break;
        }
      }
      if (row < 0) {
        setStatus("lose");
        return prev;
      }
      copy[row][col] = next;
      let rowsDone = 0;
      for (const line of copy) {
        if (line.every((cell) => cell !== null)) rowsDone += 1;
      }
      setLocked(rowsDone);
      return copy;
    });
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
    const wait = Math.max(900, cfg.dropMs - heat * 40);
    timer.current = window.setTimeout(() => {
      const heights = grid[0].map((_, c) =>
        grid.reduce((acc, row) => acc + (row[c] ? 1 : 0), 0),
      );
      const shortest = heights.indexOf(Math.min(...heights));
      drop(shortest);
    }, wait);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heat, status]);

  const reset = () => {
    setGrid(emptyGrid(cfg.rows, cfg.cols));
    setNext(pickNext());
    setLocked(0);
    setStatus("play");
    setHeat(1);
  };

  const stars = locked > cfg.needRows ? 3 : heat < cfg.needRows * 6 ? 3 : heat < cfg.needRows * 8 ? 2 : 1;
  const preview = useMemo(() => COLOR_META[next], [next]);

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
          <span className="aw-muted aw-small">следующий кабинет</span>
        </div>
      </div>

      <div className="aw-wall-board" style={{ ["--cols" as string]: cfg.cols }}>
        {grid.map((row, r) => (
          <div key={r} className={`aw-wall-row ${row.every(Boolean) ? "is-full" : ""}`}>
            {row.map((cell, c) => {
              const meta = cell ? COLOR_META[cell] : null;
              return (
                <button
                  key={`${r}-${c}`}
                  className="aw-wall-cell"
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
        ))}
      </div>
      <p className="aw-ride-hint">Тапни колонку — кабинет падает вниз. Заполни ряды.</p>

      {status !== "play" && (
        <ResultOverlay
          win={status === "win"}
          stars={stars}
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
