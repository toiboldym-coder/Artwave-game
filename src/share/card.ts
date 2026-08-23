import type { Hero } from "../story/characters";

const W = 1080;
const H = 1920;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  on: boolean,
) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (Math.PI / 180) * (i * 72 - 90);
    const b = (Math.PI / 180) * (i * 72 - 54);
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    const qx = x + Math.cos(b) * (r * 0.42);
    const qy = y + Math.sin(b) * (r * 0.42);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
    ctx.lineTo(qx, qy);
  }
  ctx.closePath();
  ctx.fillStyle = on ? "#ffc531" : "rgba(255,248,238,0.18)";
  ctx.fill();
}

function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  max: number,
  lineH: number,
) {
  const words = text.split(" ");
  let line = "";
  let yy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > max && line) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lineH;
    } else line = test;
  }
  if (line) ctx.fillText(line, x, yy);
}

export async function makeStoryCard(opts: {
  hero: Hero;
  levelTitle: string;
  line: string;
  stars: number;
}) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");

  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#1c0d38");
  g.addColorStop(0.55, "#140b2e");
  g.addColorStop(1, "#2a1030");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = opts.hero.accentHex;
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.arc(W * 0.82, 220, 340, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "600 28px Nunito, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ПРОКАТ · ШОУ ПОД КЛЮЧ", W / 2, 150);

  ctx.font = "800 92px Fredoka, Nunito, sans-serif";
  const logo = ctx.createLinearGradient(220, 180, 860, 280);
  logo.addColorStop(0, "#ff4e6a");
  logo.addColorStop(0.4, "#ffc531");
  logo.addColorStop(1, "#24d0c4");
  ctx.fillStyle = logo;
  ctx.fillText("ARTWAVE", W / 2, 250);

  const photo = await loadImage(opts.hero.photo);
  const size = 420;
  const py = 320;
  ctx.save();
  ctx.beginPath();
  ctx.arc(W / 2, py + size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  const [ox, oy] = opts.hero.objectPos.split(" ").map((v) => parseFloat(v) / 100);
  const scale = Math.max(size / photo.width, size / photo.height) * 1.15;
  const dw = photo.width * scale;
  const dh = photo.height * scale;
  ctx.drawImage(photo, W / 2 - dw * ox, py + size / 2 - dh * oy, dw, dh);
  ctx.restore();
  ctx.strokeStyle = opts.hero.accentHex;
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(W / 2, py + size / 2, size / 2 + 6, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#fff8ee";
  ctx.font = "800 64px Fredoka, Nunito, sans-serif";
  ctx.fillText(`Я ${opts.hero.name}`, W / 2, 860);

  ctx.fillStyle = opts.hero.accentHex;
  ctx.font = "700 34px Nunito, sans-serif";
  ctx.fillText(opts.levelTitle.toUpperCase(), W / 2, 920);

  for (let i = 0; i < 3; i++) {
    drawStar(ctx, W / 2 - 88 + i * 88, 980, 28, i < opts.stars);
  }

  roundRect(ctx, 90, 1080, W - 180, 420, 36);
  ctx.fillStyle = "#fff8ee";
  ctx.fill();
  ctx.fillStyle = "#2a1848";
  ctx.font = "600 40px Nunito, sans-serif";
  ctx.textAlign = "center";
  wrap(ctx, opts.line, W / 2, 1180, W - 260, 54);

  ctx.fillStyle = "rgba(255,248,238,0.55)";
  ctx.font = "600 28px Nunito, sans-serif";
  ctx.fillText("artwavegame.kz", W / 2, 1800);

  return canvas;
}

export async function shareStory(opts: {
  hero: Hero;
  levelTitle: string;
  line: string;
  stars: number;
}): Promise<"shared" | "copied" | "saved"> {
  const canvas = await makeStoryCard(opts);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), "image/jpeg", 0.92);
  });
  const file = new File([blob], "artwave.jpg", { type: "image/jpeg" });
  const text = `Я ${opts.hero.name}. ${opts.line} artwavegame.kz`;

  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
  };
  if (navigator.share && (!nav.canShare || nav.canShare({ files: [file] }))) {
    try {
      await navigator.share({
        files: [file],
        title: "Artwave",
        text,
      });
      return "shared";
    } catch (err) {
      if ((err as Error).name === "AbortError") return "shared";
    }
  }

  if (navigator.clipboard && "write" in navigator.clipboard) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/jpeg": blob, "text/plain": new Blob([text], { type: "text/plain" }) }),
      ]);
      return "copied";
    } catch {
      /* fall through */
    }
  }

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "artwave.jpg";
  a.click();
  URL.revokeObjectURL(a.href);
  return "saved";
}
