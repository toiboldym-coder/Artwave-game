import type { CSSProperties } from "react";
import type { Color, Power } from "../game/types";
import { COLOR_META } from "../game/types";

export function CubeFace({
  color,
  power,
  size,
  crate = 0,
}: {
  color: Color;
  power: Power | null;
  size: number;
  crate?: number;
}) {
  const meta = COLOR_META[color];
  const vars = {
    width: size,
    height: size,
    "--gem-fill": meta.fill,
    "--gem-glow": meta.glow,
    "--gem-deep": meta.deep,
    "--gem-light": meta.light,
    "--gem-r": `${Math.round(size * 0.22)}px`,
  } as CSSProperties;

  if (crate) {
    return (
      <div
        className="aw-gem aw-crate"
        style={{
          width: size,
          height: size,
          "--gem-r": `${Math.round(size * 0.18)}px`,
        } as CSSProperties}
      >
        <span className="aw-gem-shadow" />
        <span className="aw-crate-body">
          <span className="aw-crate-slat" />
          <span className="aw-crate-slat" />
          <span className="aw-crate-slat" />
        </span>
      </div>
    );
  }

  return (
    <div className={`aw-gem${power ? ` is-${power}` : ""}`} style={vars}>
      <span className="aw-gem-shadow" />
      <span className="aw-gem-extrude" />
      <span className="aw-gem-body">
        <span className="aw-gem-side" />
        <span className="aw-gem-jelly" />
        <span className="aw-gem-top" />
        <span className="aw-gem-shine" />
        <span className="aw-gem-spark" />
      </span>
      {power ? (
        <PowerGlyph power={power} color={color} size={size} />
      ) : (
        <ItemGlyph color={color} size={size} />
      )}
    </div>
  );
}

function ItemGlyph({ color, size }: { color: Color; size: number }) {
  const s = Math.max(16, size * 0.58);
  return (
    <svg
      className="aw-item"
      width={s}
      height={s}
      viewBox="0 0 24 24"
      aria-hidden
    >
      {color === "red" && <MicIcon />}
      {color === "amber" && <GuitarIcon />}
      {color === "teal" && <KeysIcon />}
      {color === "violet" && <CabIcon />}
      {color === "lime" && <CableIcon />}
    </svg>
  );
}

function MicIcon() {
  return (
    <>
      <rect x="9.2" y="2.2" width="5.6" height="9.2" rx="2.8" fill="#fff" />
      <path
        d="M7.6 8.6v1.4c0 2.4 1.95 4.3 4.4 4.3s4.4-1.9 4.4-4.3V8.6"
        fill="none"
        stroke="#fff"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path d="M12 14.3v4.2" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.6 20.2h6.8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="6.4" r="1.1" fill="#241033" opacity="0.35" />
    </>
  );
}

function GuitarIcon() {
  return (
    <>
      <path
        d="M8.2 14.2c-2.4 1.1-3.6 3.6-2.4 5.1 1.3 1.6 4 1.2 5.8-.6l7.6-8.1c.7-.75 1.9-2.1 1.4-3.15-.5-1.05-2.15-.85-3.1-.15L8.2 14.2Z"
        fill="#fff"
      />
      <path d="M15.6 6.1 L19.4 3.4" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M17.7 4.2 L20.2 6.2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10.6" cy="16.2" r="1.35" fill="#241033" opacity="0.38" />
    </>
  );
}

function KeysIcon() {
  return (
    <>
      <rect x="3.2" y="6.4" width="17.6" height="11.2" rx="1.8" fill="#fff" />
      <path d="M7.6 6.4v7.2M12 6.4v7.2M16.4 6.4v7.2" stroke="#241033" strokeWidth="1.5" opacity="0.38" />
      <rect x="6.5" y="6.4" width="2.2" height="6.4" rx="0.3" fill="#241033" opacity="0.55" />
      <rect x="10.9" y="6.4" width="2.2" height="6.4" rx="0.3" fill="#241033" opacity="0.55" />
      <rect x="15.3" y="6.4" width="2.2" height="6.4" rx="0.3" fill="#241033" opacity="0.55" />
    </>
  );
}

function CabIcon() {
  return (
    <>
      <rect x="4.4" y="3.2" width="15.2" height="17.6" rx="2.2" fill="#fff" />
      <circle cx="12" cy="8.6" r="3.05" fill="#241033" opacity="0.42" />
      <circle cx="12" cy="8.6" r="1.15" fill="#fff" />
      <circle cx="12" cy="15.6" r="2.35" fill="#241033" opacity="0.42" />
      <circle cx="12" cy="15.6" r="0.9" fill="#fff" />
    </>
  );
}

function CableIcon() {
  return (
    <>
      <path
        d="M5.2 7.4c2.8-3.2 7.4-3 9.6-.2 1.8 2.3.4 5.1-2.1 5.4-1.8.2-3-1.3-2.2-2.8.6-1.1 2.2-1.3 3.2-.4 1.8 1.6.8 4.6-1.7 5.8-3.2 1.5-7.1-.2-8.2-3.4"
        fill="none"
        stroke="#fff"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <rect x="15.4" y="14.6" width="5.2" height="3.4" rx="0.8" fill="#fff" />
      <path d="M15.4 16.3h-2.2" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
    </>
  );
}

function PowerGlyph({
  power,
  color,
  size,
}: {
  power: Power;
  color: Color;
  size: number;
}) {
  const s = size * 0.56;
  if (power === "disco") {
    return (
      <span className="aw-power aw-disco" style={{ width: s, height: s }}>
        <span className="aw-disco-core" />
      </span>
    );
  }
  if (power === "bomb") {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" className="aw-power">
        <circle cx="11" cy="14" r="7" fill="#1b1b22" />
        <circle cx="8.5" cy="11.5" r="2" fill="#ffffffaa" />
        <path
          d="M15 7 L18 4 M18 4 L21 5 M18 4 L17 1"
          stroke="#FFD34D"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    );
  }
  const vertical = power === "rocketV";
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      className="aw-power"
      style={{ transform: vertical ? "rotate(90deg)" : "none" }}
    >
      <path
        d="M3 12 L15 12"
        stroke={COLOR_META[color].deep}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path d="M13 7 L20 12 L13 17 Z" fill="#1b1b22" />
      <path d="M4 9 L4 15" stroke="#1b1b22" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
