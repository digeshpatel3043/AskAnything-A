import { useEffect, useState } from "react";
import { FiMoon, FiSun, FiTrash2 } from "react-icons/fi";
import { api } from "../services/api";

export default function SettingsPage({ settings, update, conversations, onClearAll }) {
  const [health, setHealth] = useState({ state: "loading" });
  const [name, setName] = useState(settings.name);

  useEffect(() => {
    api.health()
      .then((h) => setHealth({ state: "ok", ...h }))
      .catch((e) => setHealth({ state: "error", message: e.message }));
  }, []);

  return (
    <div className="page-scroll">
      <div className="page-inner narrow">
        <h1 className="page-title">Settings</h1>

        <section className="panel">
          <h3>Profile</h3>
          <div className="field">
            <label htmlFor="name">Display name</label>
            <input id="name" value={name} maxLength={40} onChange={(e) => setName(e.target.value)}
              onBlur={() => update({ name: name.trim() || "Guest" })} />
          </div>
        </section>

        <section className="panel">
          <h3>Appearance</h3>
          <div className="segmented">
            <button type="button" className={settings.theme === "light" ? "active" : ""} onClick={() => update({ theme: "light" })}><FiSun /> Light</button>
            <button type="button" className={settings.theme === "dark" ? "active" : ""} onClick={() => update({ theme: "dark" })}><FiMoon /> Dark</button>
          </div>
        </section>

        <section className="panel">
          <h3>Server status</h3>
          {health.state === "loading" && <p className="muted">Checking...</p>}
          {health.state === "error" && <p className="status bad">Backend unreachable: {health.message}</p>}
          {health.state === "ok" && (
            <ul className="status-list">
              <li><span className="dot ok" /> Backend online ({health.database})</li>
              <li>
                <span className={`dot ${health.gemini_configured ? "ok" : "bad"}`} />
                {health.gemini_configured
                  ? `Gemini API key configured (model: ${health.model})`
                  : "Gemini API key missing - set GEMINI_API_KEY in backend/.env"}
              </li>
            </ul>
          )}
        </section>

        <section className="panel">
          <h3>Data</h3>
          <p className="muted">{conversations.length} saved conversation(s).</p>
          <button type="button" className="danger-btn" disabled={!conversations.length}
            onClick={() => { if (window.confirm("Delete ALL conversations? This cannot be undone.")) onClearAll(); }}>
            <FiTrash2 /> Delete all conversations
          </button>
        </section>
      </div>
    </div>
  );
}
