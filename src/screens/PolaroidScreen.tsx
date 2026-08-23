import { motion } from "framer-motion";
import { Lock } from "@phosphor-icons/react";
import { BigButton, Eyebrow } from "../components/Chrome";
import { POLAROIDS } from "../story/script";

export function PolaroidScreen({
  unlocked,
  highlight,
  onBack,
}: {
  unlocked: string[];
  highlight: string | null;
  onBack: () => void;
}) {
  return (
    <div className="aw-screen aw-polaroids">
      <div className="aw-poly-head">
        <Eyebrow>трофеи сезона</Eyebrow>
        <h2 className="aw-h2">Полароиды Artwave</h2>
        <p className="aw-muted">
          Живые кадры, не ссылки. Айдар — после 3 и 5, Адиль — после 6 и 10, Артём — после 13 и 15.
        </p>
      </div>

      <div className="aw-poly-grid">
        {POLAROIDS.map((p, i) => {
          const open = unlocked.includes(p.id);
          const isNew = highlight === p.id;
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 24, rotate: i % 2 ? 3 : -3 }}
              animate={{
                opacity: 1,
                y: 0,
                rotate: isNew ? [0, -4, 4, -2, 0] : i % 2 ? 2 : -2,
                scale: isNew ? [1, 1.06, 1] : 1,
              }}
              transition={{ delay: 0.1 + i * 0.1, duration: isNew ? 0.9 : 0.4 }}
              className={`aw-polaroid ${open ? "" : "is-locked"} ${isNew ? "is-new" : ""}`}
            >
              <div className="aw-polaroid-photo">
                {open ? (
                  <img src={p.src} alt={p.title} style={{ objectPosition: p.objectPos }} />
                ) : (
                  <div className="aw-polaroid-lock">
                    <Lock weight="fill" />
                  </div>
                )}
              </div>
              <div className="aw-polaroid-cap">
                <b>{open ? p.title : "Ещё не открыто"}</b>
                <small>{open ? p.caption : `Пройди уровень ${p.afterLevel}`}</small>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="aw-poly-cta">
        <BigButton onClick={onBack} color="#24D0C4">
          На склад
        </BigButton>
      </div>
    </div>
  );
}
