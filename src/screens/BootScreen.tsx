import { motion } from "framer-motion";
import { Avatar } from "../components/Avatar";
import { BigButton, Eyebrow } from "../components/Chrome";
import { HEROES } from "../story/characters";
import { CubeFace } from "../components/Cube";
import { type Color } from "../game/types";

const floatColors: Color[] = ["red", "amber", "teal", "violet", "lime", "amber"];

export function BootScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="aw-screen aw-boot">
      <div className="aw-boot-bg">
        {floatColors.map((c, i) => (
          <motion.span
            key={i}
            className="aw-floatcube"
            style={{
              left: `${8 + i * 15}%`,
              top: `${12 + ((i * 37) % 60)}%`,
            }}
            animate={{ y: [0, -18, 0], rotate: [0, 20, -10, 0] }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
          >
            <CubeFace color={c} power={null} size={34 + (i % 3) * 12} />
          </motion.span>
        ))}
      </div>

      <div className="aw-boot-top">
        <Eyebrow>прокатная компания · шоу под ключ</Eyebrow>
        <motion.h1
          className="aw-logo"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 14 }}
        >
          ARTWAVE
        </motion.h1>
        <p className="aw-boot-sub">
          Три в ряд как у PixiJS: меняй соседей, лови каскад.
          Плюс велик, свет и LED. Кабель всё ещё короче на три метра.
        </p>
      </div>

      <div className="aw-boot-heroes">
        {HEROES.map((h, i) => (
          <motion.div
            key={h.id}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 + i * 0.12, type: "spring", stiffness: 200 }}
            className="aw-boot-hero"
          >
            <Avatar hero={h} size={72} active />
            <span className="aw-boot-hero-name">{h.name}</span>
          </motion.div>
        ))}
      </div>

      <div className="aw-boot-cta">
        <BigButton onClick={onStart} color="#FFC531">
          Войти на склад
        </BigButton>
      </div>
    </div>
  );
}
