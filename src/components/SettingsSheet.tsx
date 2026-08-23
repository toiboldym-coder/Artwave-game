import { GearSix, SpeakerHigh, MusicNotes } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import {
  getAudioPrefs,
  setMusicVolume,
  setSfxVolume,
  sfx,
  unlockAudio,
} from "../audio/sfx";

export function SettingsButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button className="aw-gear" onClick={onOpen} aria-label="Настройки">
      <GearSix weight="fill" />
    </button>
  );
}

export function SettingsSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [music, setMusic] = useState(() => getAudioPrefs().music);
  const [game, setGame] = useState(() => getAudioPrefs().sfx);

  useEffect(() => {
    if (!open) return;
    const prefs = getAudioPrefs();
    setMusic(prefs.music);
    setGame(prefs.sfx);
  }, [open]);

  if (!open) return null;

  return (
    <div className="aw-settings" onClick={onClose}>
      <div className="aw-settings-card" onClick={(e) => e.stopPropagation()}>
        <p className="aw-eyebrow">крутилки</p>
        <h2 className="aw-h2">Громкость</h2>
        <p className="aw-muted">Песня сама, удары сами. Как на площадке.</p>

        <label className="aw-slider">
          <span>
            <MusicNotes weight="fill" /> Песня
          </span>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={Math.round(music * 100)}
            onPointerDown={unlockAudio}
            onInput={(e) => {
              const next = Number((e.target as HTMLInputElement).value) / 100;
              setMusic(next);
              setMusicVolume(next);
            }}
          />
        </label>

        <label className="aw-slider">
          <span>
            <SpeakerHigh weight="fill" /> Игра
          </span>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={Math.round(game * 100)}
            onPointerDown={unlockAudio}
            onInput={(e) => {
              const next = Number((e.target as HTMLInputElement).value) / 100;
              setGame(next);
              setSfxVolume(next);
              sfx.tap();
            }}
          />
        </label>

        <button className="aw-big" onClick={onClose}>
          Готово
        </button>
      </div>
    </div>
  );
}
