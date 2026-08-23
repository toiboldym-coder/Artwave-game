type BeforeInstall = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

let deferred: BeforeInstall | null = null;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((fn) => fn());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event as BeforeInstall;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    notify();
  });
}

export const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));

export const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

export const isAndroid = () => /android/i.test(navigator.userAgent);

export function canPromptInstall() {
  return Boolean(deferred) && !isStandalone();
}

export function subscribeInstall(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export async function promptInstall() {
  if (!deferred) return "none" as const;
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  notify();
  return outcome;
}
