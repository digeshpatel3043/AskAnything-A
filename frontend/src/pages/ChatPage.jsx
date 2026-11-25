import { useEffect, useRef, useState } from "react";
import { FiAlertTriangle, FiRefreshCw, FiX } from "react-icons/fi";
import Welcome from "../components/Welcome";
import MessageBubble, { ThinkingBubble } from "../components/MessageBubble";
import ChatInput from "../components/ChatInput";

export default function ChatPage({ chat, user }) {
  const { messages, sending, error, loadingConversation } = chat;
  const [draft, setDraft] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, sending, error]);

  const send = async (text) => {
    const result = await chat.send(text);
    if (result?.aborted) setDraft(result.text); // stopped: put the text back
  };

  const onSend = () => {
    const text = draft;
    setDraft("");
    send(text);
  };

  const empty = messages.length === 0 && !sending && !loadingConversation;

  return (
    <div className="chat-page">
      <div className="chat-scroll">
        <div className="chat-inner">
          {loadingConversation && <div className="loading-conv">Loading conversation...</div>}
          {empty && <Welcome name={user.name} onPick={(p) => send(p)} />}
          {messages.map((m, i) => (
            <MessageBubble
              key={m.id}
              message={m}
              isLast={i === messages.length - 1}
              canRegenerate={!sending && m.role === "assistant"}
              onRegenerate={chat.regenerate}
            />
          ))}
          {sending && <ThinkingBubble />}
          {error && (
            <div className="error-banner" role="alert">
              <FiAlertTriangle aria-hidden="true" />
              <div className="error-text">
                <strong>
                  {error.code === "api_key_missing" ? "Configuration error" : "Something went wrong"}
                </strong>
                <span>{error.message}</span>
              </div>
              <div className="error-actions">
                {error.code !== "api_key_missing" && error.retry && (
                  <button type="button" onClick={error.retry} disabled={sending}>
                    <FiRefreshCw /> Retry
                  </button>
                )}
                <button type="button" className="icon-btn" onClick={() => chat.setError(null)} aria-label="Dismiss">
                  <FiX />
                </button>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>
      <ChatInput
        value={draft}
        onChange={setDraft}
        onSend={onSend}
        onStop={chat.stop}
        sending={sending}
        disabled={loadingConversation}
      />
    </div>
  );
}
