import { useEffect, useRef, useState } from "react";
import { duckBed, sfx } from "../audio/sfx";
import { BoosterBar } from "../components/BoosterBar";
import { ResultOverlay } from "../components/ResultOverlay";
import { Avatar } from "../components/Avatar";
import type { HeroId, LevelDef } from "../game/types";
import { boosterHintFor, heroById } from "../story/characters";
import { LOSE_LINES, WIN_LINES, randomLine } from "../story/script";
import type { SaveState } from "../state/store";
import { useShiftTalk } from "./useShiftTalk";

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
  onSpendBooster,
}: {
  level: LevelDef;
  save: SaveState;
  onWin: (stars: number) => void;
  onExit: () => void;
  onSpendBooster: (id: HeroId) => void;
}) {
  const cfg = level.cue!;
  const hero = heroById(save.hero ?? "aidar");
  const wide = hero.id === "aidar";
  const [notes, setNotes] = useState<Note[]>([]);
  const [hits, setHits] = useState(0);
  const [perfects, setPerfects] = useState(0);
  const [misses, setMisses] = useState(0);
  const [allow, setAllow] = useState(cfg.misses);
  const [flash, setFlash] = useState<number | null>(null);
  const [grade, setGrade] = useState<string | null>(null);
  const [status, setStatus] = useState<"play" | "win" | "lose">("play");
  const [run, setRun] = useState(0);
  const notesRef = useRef<Note[]>([]);
  const statusRef = useRef(status);
  const idRef = useRef(1);
  const lastCol = useRef(1);
  const { line, say } = useShiftTalk(hero.id);

  statusRef.current = status;

  useEffect(() => {
    duckBed();
  }, []);

  const inWindow = (y: number) => (wide ? y > 0.58 && y < 0.98 : y > 0.66 && y < 0.94);
  const inPerfect = (y: number) => y > 0.74 && y < 0.88;

  const hitNote = (note: Note, how: "ok" | "perfect") => {
    notesRef.current = notesRef.current.filter((n) => n.id !== note.id);
    setNotes(notesRef.current);
    if (how === "perfect") {
      sfx.perfect();
      setPerfects((n) => n + 1);
      setGrade("в долю");
    } else {
      sfx.collect();
      setGrade(note.y < 0.74 ? "рано" : "поздно");
    }
    setHits((h) => h + 1);
    say();
    window.setTimeout(() => setGrade(null), 420);
  };

  const strike = (col: number) => {
    if (statusRef.current !== "play") return;
    const zone = notesRef.current
      .filter((n) => n.col === col && inWindow(n.y))
      .sort((a, b) => Math.abs(a.y - 0.81) - Math.abs(b.y - 0.81))[0];
    setFlash(col);
    window.setTimeout(() => setFlash(null), 140);
    if (!zone) return;
    hitNote(zone, inPerfect(zone.y) ? "perfect" : "ok");
  };

  useEffect(() => {
    let last = performance.now();
    let spawnAt = last + 700;
    let raf = 0;
    notesRef.current = [];
    idRef.current = 1;
    const speed = 0.00038 * cfg.tempo;

    const tick = (now: number) => {
      const dt = Math.min(32, now - last);
      last = now;
      if (statusRef.current !== "play") return;

      if (now >= spawnAt) {
        let col = Math.floor(Math.random() * 3);
        if (col === lastCol.current) col = (col + 1) % 3;
        lastCol.current = col;
        notesRef.current = [...notesRef.current, { id: idRef.current++, col, y: -0.08 }];
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
      if (missed) {
        sfx.miss();
        setMisses((m) => m + missed);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cfg.tempo, run]);

  useEffect(() => {
    if (status !== "play") return;
    if (hits >= cfg.need) setStatus("win");
    else if (misses >= allow) setStatus("lose");
  }, [hits, misses, allow, cfg.need, status]);

  const reset = () => {
    notesRef.current = [];
    setNotes([]);
    setHits(0);
    setPerfects(0);
    setMisses(0);
    setAllow(cfg.misses);
    setGrade(null);
    setStatus("play");
    setRun((n) => n + 1);
  };

  const useBooster = () => {
    if (status !== "play" || !save.hero) return;
    const left = save.boosters[save.hero];
    if (left <= 0) return;
    if (hero.id === "adil") {
      setAllow((n) => n + 1);
    } else if (hero.id === "aidar") {
      const next = [...notesRef.current].sort((a, b) => b.y - a.y)[0];
      if (!next) return;
      hitNote(next, inPerfect(next.y) ? "perfect" : "ok");
    } else {
      const counts = [0, 0, 0];
      for (const n of notesRef.current) counts[n.col] += 1;
      const col = counts.indexOf(Math.max(...counts));
      const gone = notesRef.current.filter((n) => n.col === col);
      if (!gone.length) return;
      notesRef.current = notesRef.current.filter((n) => n.col !== col);
      setNotes(notesRef.current);
      setHits((h) => h + gone.length);
      sfx.blast();
      say(true);
    }
    sfx.booster();
    onSpendBooster(save.hero);
  };

  const stars =
    misses === 0 && perfects >= Math.max(3, Math.floor(cfg.need * 0.35))
      ? 3
      : misses <= 1
        ? 2
        : 1;

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
          <span className="aw-muted aw-small">сорвано {misses}/{allow}</span>
        </div>
        {grade && <div className="aw-combo">{grade}</div>}
      </div>

      <div className="aw-cue-stage">
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
                    className={`aw-cue-note ${inPerfect(n.y) ? "is-perfect" : ""}`}
                    style={{ top: `${n.y * 100}%`, background: color }}
                  />
                ))}
              <span className="aw-cue-zone" />
              <span className="aw-cue-label">{LABELS[i]}</span>
            </button>
          ))}
        </div>
      </div>
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
        hint={boosterHintFor(hero.id, "cue")}
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
