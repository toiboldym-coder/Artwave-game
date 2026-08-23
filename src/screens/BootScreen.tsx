import { Avatar } from "../components/Avatar";
import { BigButton, Eyebrow } from "../components/Chrome";
import { HEROES } from "../story/characters";
import { startBed, unlockAudio } from "../audio/sfx";

export function BootScreen({
  onStart,
  hasHero = false,
}: {
  onStart: () => void;
  hasHero?: boolean;
}) {
  return (
    <div className="aw-screen aw-boot">
      <div className="aw-boot-top">
        <Eyebrow>три человека · один склад</Eyebrow>
        <h1 className="aw-logo">ARTWAVE</h1>
        <p className="aw-boot-sub">
          Выбери себя. Остальные двое будут комментировать.
        </p>
      </div>

      <div className="aw-boot-heroes">
        {HEROES.map((h) => (
          <div key={h.id} className="aw-boot-hero">
            <Avatar hero={h} size={72} float={false} />
            <span className="aw-boot-hero-name">{h.name}</span>
          </div>
        ))}
      </div>

      <div className="aw-boot-cta">
        <BigButton
          onClick={() => {
            unlockAudio();
            startBed();
            onStart();
          }}
          color="#FFC531"
        >
          {hasHero ? "На склад" : "Выбрать себя"}
        </BigButton>
      </div>
    </div>
  );
}
