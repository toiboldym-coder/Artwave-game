import { Lightning } from "@phosphor-icons/react";
import type { Hero } from "../story/characters";

export function BoosterBar({
  hero,
  hint,
  count,
  onUse,
}: {
  hero: Hero;
  hint: string;
  count: number;
  onUse: () => void;
}) {
  return (
    <div className="aw-booster-bar">
      <button
        className="aw-booster"
        onClick={onUse}
        disabled={count <= 0}
        style={{ ["--acc" as string]: hero.accentHex }}
      >
        <span className="aw-booster-icon">
          <Lightning weight="fill" />
        </span>
        <span className="aw-booster-text">
          <b>{hero.booster}</b>
          <small>{hint}</small>
        </span>
        <span className="aw-booster-count">{count}</span>
      </button>
    </div>
  );
}
