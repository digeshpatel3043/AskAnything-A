import { useState } from "react";
import { FiCheck, FiCopy, FiRefreshCw, FiCpu } from "react-icons/fi";
import Markdown from "./Markdown";
import { copyText, formatTime } from "../services/format";

export default function MessageBubble({ message, isLast, canRegenerate, onRegenerate }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const onCopy = async () => {
    if (await copyText(message.content)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  if (isUser) {
    return (
      <div className="msg msg-user">
        <div className="bubble-user">{message.content}</div>
        <div className="meta">
          {message.failed ? <span className="failed">Not sent</span> : formatTime(message.created_at)}
        </div>
      </div>
    );
  }

  return (
    <div className="msg msg-ai">
      <div className="avatar-ai" aria-hidden="true">
        <FiCpu />
      </div>
      <div className="ai-body">
        <Markdown>{message.content}</Markdown>
        <div className="actions">
          <button type="button" onClick={onCopy} title="Copy answer">
            {copied ? <FiCheck /> : <FiCopy />}
            <span>{copied ? "Copied" : "Copy answer"}</span>
          </button>
          {isLast && canRegenerate && (
            <button type="button" onClick={onRegenerate} title="Regenerate answer">
              <FiRefreshCw />
              <span>Regenerate</span>
            </button>
          )}
          <span className="time">{formatTime(message.created_at)}</span>
        </div>
      </div>
    </div>
  );
}

export function ThinkingBubble() {
  return (
    <div className="msg msg-ai" role="status" aria-live="polite">
      <div className="avatar-ai" aria-hidden="true">
        <FiCpu />
      </div>
      <div className="ai-body">
        <div className="thinking">
          <span className="dots">
            <i />
            <i />
            <i />
          </span>
          AI is thinking...
        </div>
      </div>
    </div>
  );
}
