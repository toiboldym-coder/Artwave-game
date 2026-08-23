import type { Hero } from "../story/characters";

export function Avatar({
  hero,
  size = 96,
  active = false,
  float = false,
  mood = "idle",
}: {
  hero: Hero;
  size?: number;
  active?: boolean;
  float?: boolean;
  mood?: "idle" | "talk" | "win" | "lose";
}) {
  const ring = size + 10;
  return (
    <div
      style={{ width: ring, height: ring }}
      className={`aw-avatar ${float ? "is-float" : ""} ${active || mood === "talk" ? "is-talk" : ""} ${mood === "win" ? "is-win" : ""}`}
    >
      <div
        className="aw-avatar-ring"
        style={{
          background: `conic-gradient(from 0deg, ${hero.accentHex}, #fff8, ${hero.accentHex})`,
        }}
      />
      <div
        className="aw-avatar-photo"
        style={{
          width: size,
          height: size,
          left: (ring - size) / 2,
          top: (ring - size) / 2,
        }}
      >
        <img src={hero.photo} alt={hero.name} style={{ objectPosition: hero.objectPos }} />
      </div>
    </div>
  );
}
