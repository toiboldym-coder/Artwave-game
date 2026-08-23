import { motion } from "framer-motion";
import type { Hero } from "../story/characters";

export function Avatar({
  hero,
  size = 96,
  active = false,
  float = true,
  mood = "idle",
}: {
  hero: Hero;
  size?: number;
  active?: boolean;
  float?: boolean;
  mood?: "idle" | "talk" | "win" | "lose";
}) {
  const ring = size + 10;
  const frames = hero.frames?.length ? hero.frames : [hero.photo];
  const talking = active || mood === "talk";
  const win = mood === "win";

  return (
    <motion.div
      style={{ width: ring, height: ring }}
      className={`aw-avatar ${talking ? "is-talk" : ""} ${win ? "is-win" : ""}`}
      animate={
        win
          ? { y: [0, -10, 0], rotate: [0, -6, 6, 0], scale: [1, 1.08, 1] }
          : float
            ? { y: [0, -7, 0], rotate: [-2, 2, -2] }
            : { y: 0, rotate: 0 }
      }
      transition={{
        duration: win ? 0.7 : 3.2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <motion.div
        className="aw-avatar-ring"
        style={{
          background: `conic-gradient(from 0deg, ${hero.accentHex}, #fff8, ${hero.accentHex}, #fff8, ${hero.accentHex})`,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
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
        {frames.map((src, i) => (
          <motion.img
            key={src}
            src={src}
            alt={hero.name}
            style={{ objectPosition: hero.objectPos }}
            animate={{ opacity: frames.length > 1 ? [i === 0 ? 1 : 0, i === 0 ? 0 : 1, i === 0 ? 1 : 0] : 1 }}
            transition={{ duration: 5.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
          />
        ))}
        <div
          className="aw-avatar-shine"
          style={{ background: `radial-gradient(60% 40% at 30% 20%, #ffffff55, transparent 70%)` }}
        />
      </div>

      {active && (
        <>
          <motion.span
            className="aw-spark"
            style={{ background: hero.accentHex, top: 2, right: 8 }}
            animate={{ scale: [0, 1.2, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }}
          />
          <motion.span
            className="aw-spark"
            style={{ background: "#fff", bottom: 6, left: 4 }}
            animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: 0.8 }}
          />
        </>
      )}
    </motion.div>
  );
}
