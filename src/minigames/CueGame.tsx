import { useEffect, useRef, useState } from "react";
import { ResultOverlay } from "../components/ResultOverlay";
import type { LevelDef } from "../game/types";
import { heroById } from "../story/characters";
import { COMBO_QUIPS, LOSE_LINES, WIN_LINES, randomLine } from "../story/script";
import type { SaveState } from "../state/store";

interface Note {
  id: number;
  col: number;
  y: number;
}

const COLS = ["#FF4E6A", "#FFC531", "#24D0C4"] as const;
const LABELS = ["Лазер", "Свет", "LED"];

export function CueGame({
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
  const cfg = level.cue!;
  const hero = heroById(save.hero ?? "aidar");
  const [notes, setNotes] = useState<Note[]>([]);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [flash, setFlash] = useState<number | null>(null);
  const [quip, setQuip] = useState<string | null>(null);
  const [status, setStatus] = useState<"play" | "win" | "lose">("play");
  const notesRef = useRef<Note[]>([]);
  const statusRef = useRef(status);
  const idRef = useRef(1);
  const lastCol = useRef(1);
  const hideQuip = useRef(0);

  statusRef.current = status;

  const strike = (col: number) => {
    if (statusRef.current !== "play") return;
    const zone = notesRef.current.find((n) => n.col === col && n.y > 0.7 && n.y < 0.92);
    setFlash(col);
    window.setTimeout(() => setFlash(null), 140);
    if (zone) {
      notesRef.current = notesRef.current.filter((n) => n.id !== zone.id);
      setNotes(notesRef.current);
      setHits((h) => h + 1);
      if (Math.random() < 0.35) {
        const joke = randomLine(COMBO_QUIPS[hero.id], `quip-${hero.id}`);
        setQuip(joke);
        window.clearTimeout(hideQuip.current);
        hideQuip.current = window.setTimeout(
          () => setQuip(null),
          Math.min(8000, Math.max(5200, 2600 + joke.length * 50)),
        );
      }
    } else {
      setMisses((m) => m + 1);
    }
  };

  useEffect(() => {
    let last = performance.now();
    let spawnAt = last + 500;
    let raf = 0;
    const speed = 0.00038 * cfg.tempo;

    const tick = (now: number) => {
      const dt = Math.min(32, now - last);
      last = now;
      if (statusRef.current !== "play") return;

      if (now >= spawnAt) {
        let col = Math.floor(Math.random() * 3);
        if (col === lastCol.current) col = (col + 1) % 3;
        lastCol.current = col;
        const note = { id: idRef.current++, col, y: -0.08 };
        notesRef.current = [...notesRef.current, note];
        spawnAt = now + 680 / cfg.tempo + Math.random() * 220;
      }

      const next: Note[] = [];
      let missed = 0;
      for (const n of notesRef.current) {
        const y = n.y + speed * dt;
        if (y > 1.02) missed += 1;
        else next.push({ ...n, y });
      }
      notesRef.current = next;
      setNotes(next);
      if (missed) setMisses((m) => m + missed);

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cfg.tempo]);

  useEffect(() => {
    if (status !== "play") return;
    if (hits >= cfg.need) setStatus("win");
    else if (misses >= cfg.misses) setStatus("lose");
  }, [hits, misses, cfg.need, cfg.misses, status]);

  const reset = () => {
    notesRef.current = [];
    setNotes([]);
    setHits(0);
    setMisses(0);
    setStatus("play");
    idRef.current = 1;
  };

  const stars = misses === 0 ? 3 : misses === 1 ? 2 : 1;

  return (
    <div className="aw-screen aw-mini aw-cue">
      <header className="aw-lvl-head">
        <button className="aw-back" onClick={onExit}>
          ←
        </button>
        <div className="aw-lvl-title">
          <span className="mono aw-eyebrow">свет · уровень {level.id}</span>
          <span className="aw-lvl-name">{level.title}</span>
        </div>
        <div className="aw-moves">
          <span className="aw-moves-num">{Math.max(0, cfg.need - hits)}</span>
          <span className="aw-moves-label">лучей</span>
        </div>
      </header>

      <div className="aw-goals">
        <div className="aw-goal">
          <span className="aw-muted aw-small">промах {misses}/{cfg.misses}</span>
        </div>
      </div>

      <div className="aw-cue-stage">
        {quip && <p className="aw-combo">{quip}</p>}
        <div className="aw-cue-cols">
          {COLS.map((color, i) => (
            <button
              key={color}
              className={`aw-cue-col ${flash === i ? "is-flash" : ""}`}
              style={{ ["--acc" as string]: color }}
              onPointerDown={() => strike(i)}
            >
              {notes
                .filter((n) => n.col === i)
                .map((n) => (
                  <span
                    key={n.id}
                    className="aw-cue-note"
                    style={{ top: `${n.y * 100}%`, background: color }}
                  />
                ))}
              <span className="aw-cue-zone" />
              <span className="aw-cue-label">{LABELS[i]}</span>
            </button>
          ))}
        </div>
      </div>

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
