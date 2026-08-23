import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="mono aw-eyebrow">{children}</span>
  );
}

export function Pill({
  children,
  onClick,
  tone = "ghost",
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: "ghost" | "solid";
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={`aw-pill ${tone === "solid" ? "aw-pill-solid" : ""}`}
    >
      {children}
    </motion.button>
  );
}

export function BigButton({
  children,
  onClick,
  color = "#FFC531",
}: {
  children: ReactNode;
  onClick?: () => void;
  color?: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="aw-big"
      style={{ ["--btn" as string]: color }}
    >
      {children}
    </motion.button>
  );
}
