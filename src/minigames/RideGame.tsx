import { useEffect, useRef, useState } from "react";
import { duckBed, sfx } from "../audio/sfx";
import { Avatar } from "../components/Avatar";
import { BoosterBar } from "../components/BoosterBar";
import { ResultOverlay } from "../components/ResultOverlay";
import type { HeroId, LevelDef } from "../game/types";
import { boosterHintFor, heroById } from "../story/characters";
import { LOSE_LINES, WIN_LINES, randomLine } from "../story/script";
import type { SaveState } from "../state/store";
import { useShiftTalk } from "./useShiftTalk";

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
  onSpendBooster,
}: {
  level: LevelDef;
  save: SaveState;
  onWin: (stars: number) => void;
  onExit: () => void;
  onSpendBooster: (id: HeroId) => void;
}) {
  const cfg = level.ride!;
  const hero = heroById(save.hero ?? "aidar");
  const [lane, setLane] = useState(1);
  const [items, setItems] = useState<Item[]>([]);
  const [got, setGot] = useState(0);
  const [hits, setHits] = useState(0);
  const [left, setLeft] = useState(cfg.seconds);
  const [scout, setScout] = useState(false);
  const [status, setStatus] = useState<"play" | "win" | "lose">("play");
  const [run, setRun] = useState(0);
  const { line, say } = useShiftTalk(hero.id);

  const laneRef = useRef(1);
  const statusRef = useRef(status);
  const itemsRef = useRef<Item[]>([]);
  const gotRef = useRef(0);
  const hitsRef = useRef(0);
  const extraRef = useRef(0);
  const idRef = useRef(1);

  laneRef.current = lane;
  statusRef.current = status;

  useEffect(() => {
    duckBed();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") setLane((l) => Math.max(0, l - 1));
      if (e.key === "ArrowRight" || e.key === "d") setLane((l) => Math.min(2, l + 1));
      if (e.key === "1") setLane(0);
      if (e.key === "2") setLane(1);
      if (e.key === "3") setLane(2);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const start = performance.now();
    let last = start;
    let spawnAt = start + 3000;
    let raf = 0;
    itemsRef.current = [];
    gotRef.current = 0;
    hitsRef.current = 0;
    extraRef.current = 0;
    idRef.current = 1;

    const pickSpawn = (): { kind: ItemKind; lane: number } => {
      const recent = itemsRef.current.filter((it) => it.y < 0.42);
      const hazard = new Set(recent.filter((it) => it.kind !== "cable").map((it) => it.lane));
      const roll = Math.random();
      let kind: ItemKind = roll < 0.5 ? "cable" : roll < 0.78 ? "hole" : "car";
      if (kind !== "cable") {
        const options = [0, 1, 2].filter((l) => {
          const next = new Set(hazard);
          next.add(l);
          return next.size < 3;
        });
        if (!options.length) return { kind: "cable", lane: Math.floor(Math.random() * 3) };
        return { kind, lane: options[Math.floor(Math.random() * options.length)] };
      }
      return { kind, lane: Math.floor(Math.random() * 3) };
    };

    const tick = (now: number) => {
      const dt = Math.min(32, now - last);
      last = now;
      if (statusRef.current !== "play") return;

      const elapsed = (now - start) / 1000;
      const remain = Math.max(0, cfg.seconds + extraRef.current - elapsed);
      setLeft(remain);
      if (remain <= 0) {
        setStatus(gotRef.current >= cfg.collect ? "win" : "lose");
        return;
      }

      const speed = 0.00042 * cfg.speed * (1 + elapsed * 0.012);
      if (now >= spawnAt) {
        const spawn = pickSpawn();
        itemsRef.current.push({
          id: idRef.current++,
          kind: spawn.kind,
          lane: spawn.lane,
          y: -0.12,
        });
        spawnAt = now + (720 - cfg.speed * 70) + Math.random() * 260;
      }

      const next: Item[] = [];
      for (const it of itemsRef.current) {
        const y = it.y + speed * dt;
        const hitZone = y > 0.76 && y < 0.84 && it.lane === laneRef.current;
        if (hitZone) {
          if (it.kind === "cable") {
            gotRef.current += 1;
            setGot(gotRef.current);
            sfx.collect();
            say();
          } else {
            hitsRef.current += 1;
            setHits(hitsRef.current);
            sfx.hit();
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
    setScout(false);
    setStatus("play");
    setRun((n) => n + 1);
  };

  const useBooster = () => {
    if (status !== "play" || !save.hero) return;
    if (save.boosters[save.hero] <= 0) return;
    if (hero.id === "adil") {
      extraRef.current += 7;
      setLeft((n) => n + 7);
    } else if (hero.id === "aidar") {
      setScout(true);
      window.setTimeout(() => setScout(false), 3000);
    } else {
      const cables = itemsRef.current.filter((it) => it.kind === "cable");
      if (!cables.length) return;
      gotRef.current += cables.length;
      setGot(gotRef.current);
      itemsRef.current = itemsRef.current.filter((it) => it.kind !== "cable");
      setItems(itemsRef.current);
      sfx.cascade(2);
      say(true);
    }
    sfx.booster();
    onSpendBooster(save.hero);
  };

  const stars = left > cfg.seconds * 0.4 ? 3 : left > cfg.seconds * 0.18 ? 2 : 1;
  const remainLives = Math.max(0, cfg.hits - hits);

  return (
    <div className={`aw-screen aw-mini aw-ride theme-${cfg.theme} ${hero.id === "aidar" ? "is-aidar" : ""} ${scout ? "is-scout" : ""}`}>
      <header className="aw-lvl-head">
        <button className="aw-back" onClick={onExit}>
          ←
        </button>
        <div className="aw-lvl-title">
          <span className="mono aw-eyebrow">выезд · уровень {level.id}</span>
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
          setLane(Math.min(2, Math.max(0, Math.floor((x / rect.width) * 3))));
        }}
      >
        <div className="aw-ride-sky" />
        <div className="aw-ride-road">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`aw-ride-lane ${lane === i ? "is-current" : ""}`} />
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
            <span className="aw-van-body" />
          </div>
        </div>
        <p className="aw-ride-hint">Тапни полосу — забери кабель, объедь яму</p>
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
        hint={boosterHintFor(hero.id, "ride")}
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
