import { useEffect, useMemo } from "react";
import { startBed, stopBed } from "../audio/sfx";
import { motion } from "framer-motion";
import { Avatar } from "../components/Avatar";
import { Eyebrow, Pill } from "../components/Chrome";
import { Bicycle, Camera, DeviceMobile, Lamp, Lightning, SquaresFour, Sun } from "@phosphor-icons/react";
import { KIND_META, LEVELS } from "../game/levels";
import { heroById } from "../story/characters";
import { IDLE_QUIPS, randomLine } from "../story/script";
import type { SaveState } from "../state/store";

export function MapScreen({
  save,
  onPlay,
  onInstall,
  onPolaroids,
  onReselect,
}: {
  save: SaveState;
  onPlay: (id: number) => void;
  onInstall: () => void;
  onPolaroids: () => void;
  onReselect: () => void;
}) {
  const hero = save.hero ? heroById(save.hero) : null;
  const nextId = Math.min(save.completed + 1, LEVELS.length);
  const idle = useMemo(
    () => (hero ? randomLine(IDLE_QUIPS[hero.id], `idle-${hero.id}`) : ""),
    [hero],
  );

  useEffect(() => {
    startBed();
    return () => stopBed();
  }, []);

  return (
    <div className="aw-screen aw-map">
      <header className="aw-map-head">
        <button className="aw-map-hero" onClick={onReselect}>
          {hero && <Avatar hero={hero} size={52} active float={false} />}
          <div>
            <span className="aw-map-hero-name">{hero?.name ?? "Герой"}</span>
            <span className="aw-muted aw-small">сменить героя</span>
          </div>
        </button>
        <div className="aw-map-stats">
          <span className="aw-stat">
            <Sun weight="fill" /> {save.stars}
          </span>
          <span className="aw-stat" style={{ ["--acc" as string]: hero?.accentHex }}>
            <Lightning weight="fill" /> {hero ? save.boosters[hero.id] : 0}
          </span>
        </div>
      </header>

      <div className="aw-map-actions">
        <Pill onClick={onPolaroids}>
          <Camera weight="fill" /> Полароиды
        </Pill>
        <Pill onClick={onInstall}>
          <DeviceMobile weight="fill" /> На телефон
        </Pill>
      </div>

      {hero && (
        <p className="aw-map-quip">
          <b>{hero.name}:</b> {idle}
        </p>
      )}

      <Eyebrow>маршрут сезона</Eyebrow>

      <div className="aw-path">
        {LEVELS.map((lvl, i) => {
          const done = save.completed >= lvl.id;
          const isNext = lvl.id === nextId;
          const locked = lvl.id > nextId;
          const kind = KIND_META[lvl.kind];
          const KindIcon =
            lvl.kind === "ride"
              ? Bicycle
              : lvl.kind === "wall"
                ? SquaresFour
                : lvl.kind === "cue"
                  ? Lamp
                  : Lightning;
          return (
            <motion.button
              key={lvl.id}
              initial={{ opacity: 0, x: i % 2 ? 30 : -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileTap={{ scale: locked ? 1 : 0.95 }}
              onClick={() => !locked && onPlay(lvl.id)}
              className={`aw-node ${done ? "is-done" : ""} ${isNext ? "is-next" : ""} ${locked ? "is-locked" : ""}`}
              style={{
                alignSelf: i % 2 ? "flex-end" : "flex-start",
                ["--acc" as string]: kind.accent,
              }}
            >
              <span className="aw-node-num">
                <KindIcon weight="fill" />
                <b>{lvl.id}</b>
              </span>
              <span className="aw-node-body">
                <span className="aw-node-title">{lvl.title}</span>
                <span className="aw-muted aw-small">
                  {kind.label}
                  {" · "}
                  {locked ? "закрыто" : done ? "пройдено" : isNext ? "играть" : "открыто"}
                </span>
              </span>
              {isNext && (
                <motion.span
                  className="aw-node-pulse"
                  style={{ background: kind.accent }}
                  animate={{ scale: [1, 1.4, 1], opacity: [0.7, 0, 0.7] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
