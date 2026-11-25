import { useEffect, useState } from "react";

const KEY = "askanything.settings";

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
    return {
      name: saved.name || "Guest",
      theme:
        saved.theme ||
        (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light"),
    };
  } catch {
    return { name: "Guest", theme: "light" };
  }
}

/** Profile name + theme, persisted in localStorage. */
export function useSettings() {
  const [settings, setSettings] = useState(load);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {
      /* storage unavailable */
    }
  }, [settings]);

  return [settings, (patch) => setSettings((s) => ({ ...s, ...patch }))];
}
