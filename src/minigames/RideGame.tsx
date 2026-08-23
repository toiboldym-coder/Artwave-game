import { useEffect, useRef, useState } from "react";
import { Avatar } from "../components/Avatar";
import { ResultOverlay } from "../components/ResultOverlay";
import type { LevelDef } from "../game/types";
import { heroById } from "../story/characters";
import { LOSE_LINES, WIN_LINES, randomLine } from "../story/script";
import type { SaveState } from "../state/store";

type ItemKind = "cable" | "hole" | "car";

interface Item {
  id: number;
  kind: ItemKind;
  lane: number;
  y: number;
}

export function RideGame({
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
  const cfg = level.ride!;
  const hero = heroById(save.hero ?? "aidar");
  const [lane, setLane] = useState(1);
  const [items, setItems] = useState<Item[]>([]);
  const [got, setGot] = useState(0);
  const [hits, setHits] = useState(0);
  const [left, setLeft] = useState(cfg.seconds);
  const [status, setStatus] = useState<"play" | "win" | "lose">("play");
  const [run, setRun] = useState(0);

  const laneRef = useRef(1);
  const statusRef = useRef(status);
  const itemsRef = useRef<Item[]>([]);
  const gotRef = useRef(0);
  const hitsRef = useRef(0);
  const idRef = useRef(1);

  laneRef.current = lane;
  statusRef.current = status;

  const shift = (dir: -1 | 1) => {
    setLane((l) => Math.max(0, Math.min(2, l + dir)));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") shift(-1);
      if (e.key === "ArrowRight" || e.key === "d") shift(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const start = performance.now();
    let last = start;
    let spawnAt = start + 360;
    let raf = 0;
    itemsRef.current = [];
    gotRef.current = 0;
    hitsRef.current = 0;
    idRef.current = 1;

    const tick = (now: number) => {
      const dt = Math.min(32, now - last);
      last = now;
      if (statusRef.current !== "play") return;

      const elapsed = (now - start) / 1000;
      const remain = Math.max(0, cfg.seconds - elapsed);
      setLeft(remain);
      if (remain <= 0) {
        setStatus(gotRef.current >= cfg.collect ? "win" : "lose");
        return;
      }

      const speed = 0.00042 * cfg.speed * (1 + elapsed * 0.012);
      if (now >= spawnAt) {
        const kindRoll = Math.random();
        const kind: ItemKind =
          kindRoll < 0.48 ? "cable" : kindRoll < 0.78 ? "hole" : "car";
        itemsRef.current.push({
          id: idRef.current++,
          kind,
          lane: Math.floor(Math.random() * 3),
          y: -0.12,
        });
        spawnAt = now + (700 - cfg.speed * 70) + Math.random() * 280;
      }

      const next: Item[] = [];
      for (const it of itemsRef.current) {
        const y = it.y + speed * dt;
        const hitZone = y > 0.76 && y < 0.84 && it.lane === laneRef.current;
        if (hitZone) {
          if (it.kind === "cable") {
            gotRef.current += 1;
            setGot(gotRef.current);
          } else {
            hitsRef.current += 1;
            setHits(hitsRef.current);
          }
          continue;
        }
        if (y < 1.12) next.push({ ...it, y });
      }
      itemsRef.current = next;
      setItems(next);

      if (gotRef.current >= cfg.collect) {
        setStatus("win");
        return;
      }
      if (hitsRef.current >= cfg.hits) {
        setStatus("lose");
        return;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cfg.collect, cfg.hits, cfg.seconds, cfg.speed, run]);

  const reset = () => {
    setLane(1);
    setItems([]);
    setGot(0);
    setHits(0);
    setLeft(cfg.seconds);
    setStatus("play");
    setRun((n) => n + 1);
  };

  const stars = left > cfg.seconds * 0.4 ? 3 : left > cfg.seconds * 0.18 ? 2 : 1;
  const remainLives = Math.max(0, cfg.hits - hits);

  return (
    <div className={`aw-screen aw-mini aw-ride theme-${cfg.theme}`}>
      <header className="aw-lvl-head">
        <button className="aw-back" onClick={onExit}>
          ←
        </button>
        <div className="aw-lvl-title">
          <span className="mono aw-eyebrow">велик · уровень {level.id}</span>
          <span className="aw-lvl-name">{level.title}</span>
        </div>
        <div className="aw-moves">
          <span className="aw-moves-num">{Math.ceil(left)}</span>
          <span className="aw-moves-label">сек</span>
        </div>
      </header>

      <div className="aw-goals">
        <div className="aw-goal">
          <span className="aw-goal-cube aw-goal-cable" />
          <span className="aw-goal-num">{Math.max(0, cfg.collect - got)}</span>
        </div>
        <div className="aw-goal">
          <span className="aw-muted aw-small">жизни {remainLives}</span>
        </div>
      </div>

      <div
        className="aw-ride-track"
        onPointerDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          if (x < rect.width / 2) shift(-1);
          else shift(1);
        }}
      >
        <div className="aw-ride-sky" />
        <div className="aw-ride-road">
          {[0, 1, 2].map((i) => (
            <div key={i} className="aw-ride-lane" />
          ))}
          {items.map((it) => (
            <div
              key={it.id}
              className={`aw-ride-item is-${it.kind}`}
              style={{
                left: `${16.6 + it.lane * 33.4}%`,
                top: `${it.y * 100}%`,
              }}
            />
          ))}
          <div className="aw-rider" style={{ left: `${16.6 + lane * 33.4}%` }}>
            <Avatar hero={hero} size={56} active float={false} />
            <span className="aw-bike-body" />
          </div>
        </div>
        <p className="aw-ride-hint">Тапни левую или правую половину дороги</p>
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
