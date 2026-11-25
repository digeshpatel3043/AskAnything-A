import { useEffect, useRef } from "react";
import { FiSend, FiSquare } from "react-icons/fi";

const MAX_CHARS = 8000;

export default function ChatInput({ value, onChange, onSend, onStop, sending, disabled }) {
  const ref = useRef(null);

  // Auto-expand up to ~200px, then scroll inside the box.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [value]);

  const submit = () => {
    if (!sending && value.trim() && !disabled) onSend();
  };

  const onKeyDown = (e) => {
    // Enter sends, Shift+Enter inserts a new line (ignore IME composition).
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="composer">
      <div className="composer-box">
        <textarea
          ref={ref}
          rows={1}
          value={value}
          maxLength={MAX_CHARS}
          placeholder="Ask anything..."
          aria-label="Message"
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled}
        />
        {sending ? (
          <button type="button" className="send-btn stop" onClick={onStop} aria-label="Stop generating" title="Stop generating">
            <FiSquare />
          </button>
        ) : (
          <button
            type="button"
            className="send-btn"
            onClick={submit}
            disabled={!value.trim() || disabled}
            aria-label="Send message"
            title="Send"
          >
            <FiSend />
          </button>
        )}
      </div>
      <p className="composer-hint">
        Enter to send, Shift + Enter for a new line. AI can make mistakes - verify important info.
      </p>
    </div>
  );
}
