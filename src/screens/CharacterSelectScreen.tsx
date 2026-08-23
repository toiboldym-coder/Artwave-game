import { motion } from "framer-motion";
import { Avatar } from "../components/Avatar";
import { BigButton, Eyebrow } from "../components/Chrome";
import type { HeroId } from "../game/types";
import { HEROES } from "../story/characters";
import { useState } from "react";

export function CharacterSelectScreen({
  current,
  onPick,
}: {
  current: HeroId | null;
  onPick: (id: HeroId) => void;
}) {
  const [sel, setSel] = useState<HeroId>(current ?? "aidar");
  const hero = HEROES.find((h) => h.id === sel)!;

  return (
    <div className="aw-screen aw-select">
      <div className="aw-select-head">
        <Eyebrow>выбери, за кого играть</Eyebrow>
        <h2 className="aw-h2">Твой герой в Artwave</h2>
        <p className="aw-muted">История пойдёт от его лица. Со всеми шутками.</p>
      </div>

      <motion.div
        key={hero.id}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="aw-select-hero"
        style={{ ["--acc" as string]: hero.accentHex }}
      >
        <Avatar hero={hero} size={128} active />
        <div className="aw-select-info">
          <h3 className="aw-select-name">
            {hero.name} <span className="mono aw-select-latin">{hero.latin}</span>
          </h3>
          <span className="aw-select-role">{hero.role}</span>
          <p className="aw-select-tag">{hero.tagline}</p>
          <div className="aw-select-booster">
            <span className="aw-chip" style={{ ["--acc" as string]: hero.accentHex }}>
              {hero.booster}
            </span>
            <span className="aw-muted aw-small">{hero.boosterHint}</span>
          </div>
        </div>
      </motion.div>

      <div className="aw-select-row">
        {HEROES.map((h) => (
          <motion.button
            key={h.id}
            whileTap={{ scale: 0.92 }}
            onClick={() => setSel(h.id)}
            className={`aw-select-thumb ${sel === h.id ? "is-active" : ""}`}
            style={{ ["--acc" as string]: h.accentHex }}
          >
            <img src={h.photo} alt={h.name} style={{ objectPosition: h.objectPos }} />
            <span>{h.name}</span>
          </motion.button>
        ))}
      </div>

      <div className="aw-select-cta">
        <BigButton onClick={() => onPick(sel)} color={hero.accentHex}>
          Играть за {hero.name}
        </BigButton>
      </div>
    </div>
  );
}
