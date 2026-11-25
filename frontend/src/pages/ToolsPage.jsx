import { useRef, useState } from "react";
import { FiArrowLeft, FiCheck, FiCopy, FiMessageSquare, FiAlertTriangle, FiZap } from "react-icons/fi";
import { TOOLS } from "../services/tools";
import { api } from "../services/api";
import Markdown from "../components/Markdown";
import { copyText } from "../services/format";

function ToolWorkspace({ tool, onBack, onOpenConversation }) {
  const [modeId, setModeId] = useState(tool.modes[0].id);
  const [text, setText] = useState("");
  const [option, setOption] = useState(tool.options[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { content, conversationId }
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef(null);
  const Icon = tool.icon;
  const mode = tool.modes.find((m) => m.id === modeId);

  const run = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await api.chat(
        { message: mode.build(text.trim(), option), tool: tool.id },
        controller.signal
      );
      setResult({ content: res.assistant_message.content, conversationId: res.conversation.id });
    } catch (e) {
      if (e.name !== "AbortError") setError(e);
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (result && (await copyText(result.content))) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div className="tool-workspace">
      <button type="button" className="back-btn" onClick={onBack}>
        <FiArrowLeft /> All tools
      </button>
      <div className="tool-header">
        <span className="tool-icon" style={{ "--c": tool.color }}><Icon /></span>
        <div>
          <h2>{tool.name}</h2>
          <p>{tool.description}</p>
        </div>
      </div>

      <div className="chips" role="tablist" aria-label="Tool mode">
        {tool.modes.map((m) => (
          <button key={m.id} type="button" role="tab" aria-selected={m.id === modeId}
            className={`chip ${m.id === modeId ? "active" : ""}`} onClick={() => setModeId(m.id)}>
            {m.label}
          </button>
        ))}
      </div>

      <div className="field">
        <label htmlFor="tool-input">{tool.inputLabel}</label>
        <textarea id="tool-input" rows={6} value={text} maxLength={6000}
          placeholder={tool.placeholder} onChange={(e) => setText(e.target.value)} />
      </div>
      <div className="field inline">
        <label htmlFor="tool-option">{tool.optionLabel}</label>
        <select id="tool-option" value={option} onChange={(e) => setOption(e.target.value)}>
          {tool.options.map((o) => <option key={o}>{o}</option>)}
        </select>
      </div>

      <div className="tool-actions">
        <button type="button" className="primary" onClick={run} disabled={!text.trim() || loading}>
          <FiZap /> {loading ? "Generating..." : `Generate - ${mode.label}`}
        </button>
        {loading && (
          <button type="button" className="secondary" onClick={() => abortRef.current?.abort()}>
            Cancel
          </button>
        )}
      </div>

      {loading && (
        <div className="thinking tool-thinking" role="status">
          <span className="dots"><i /><i /><i /></span> AI is thinking...
        </div>
      )}

      {error && (
        <div className="error-banner" role="alert">
          <FiAlertTriangle aria-hidden="true" />
          <div className="error-text">
            <strong>{error.code === "api_key_missing" ? "Configuration error" : "Something went wrong"}</strong>
            <span>{error.message}</span>
          </div>
          {error.code !== "api_key_missing" && (
            <div className="error-actions"><button type="button" onClick={run}>Retry</button></div>
          )}
        </div>
      )}

      {result && (
        <div className="tool-result">
          <div className="tool-result-head">
            <strong>Result</strong>
            <div>
              <button type="button" className="secondary small" onClick={copy}>
                {copied ? <FiCheck /> : <FiCopy />} {copied ? "Copied" : "Copy"}
              </button>
              <button type="button" className="secondary small" onClick={() => onOpenConversation(result.conversationId)}>
                <FiMessageSquare /> Continue in chat
              </button>
            </div>
          </div>
          <Markdown>{result.content}</Markdown>
        </div>
      )}
    </div>
  );
}

export default function ToolsPage({ onOpenConversation }) {
  const [toolId, setToolId] = useState(null);
  const tool = TOOLS.find((t) => t.id === toolId);

  if (tool) {
    return (
      <div className="page-scroll">
        <ToolWorkspace key={tool.id} tool={tool} onBack={() => setToolId(null)} onOpenConversation={onOpenConversation} />
      </div>
    );
  }

  return (
    <div className="page-scroll">
      <div className="page-inner">
        <h1 className="page-title">AI Tools</h1>
        <p className="page-sub">Specialised assistants for study, career, writing, email, coding and business.</p>
        <div className="tool-grid">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} type="button" className="tool-card" onClick={() => setToolId(t.id)}>
                <span className="tool-icon" style={{ "--c": t.color }}><Icon /></span>
                <strong>{t.name}</strong>
                <span>{t.description}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
