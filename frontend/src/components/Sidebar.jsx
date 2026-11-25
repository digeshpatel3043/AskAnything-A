import { useState } from "react";
import {
  FiPlus, FiMessageSquare, FiTool, FiSettings, FiX, FiEdit2, FiTrash2, FiCheck,
} from "react-icons/fi";

function HistoryItem({ conv, active, onSelect, onRename, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(conv.title);

  const save = async () => {
    const t = title.trim();
    setEditing(false);
    if (t && t !== conv.title) {
      try {
        await onRename(conv.id, t);
      } catch {
        setTitle(conv.title);
      }
    } else setTitle(conv.title);
  };

  if (editing) {
    return (
      <li className="history-item editing">
        <input
          autoFocus
          value={title}
          maxLength={120}
          aria-label="Conversation title"
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") {
              setEditing(false);
              setTitle(conv.title);
            }
          }}
          onBlur={save}
        />
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={save} aria-label="Save title">
          <FiCheck />
        </button>
      </li>
    );
  }

  return (
    <li className={`history-item ${active ? "active" : ""}`}>
      <button type="button" className="history-main" onClick={() => onSelect(conv.id)} title={conv.title}>
        <FiMessageSquare aria-hidden="true" />
        <span>{conv.title}</span>
      </button>
      <button type="button" className="icon-btn" onClick={() => { setTitle(conv.title); setEditing(true); }} aria-label="Rename conversation" title="Rename">
        <FiEdit2 />
      </button>
      <button
        type="button"
        className="icon-btn danger"
        onClick={() => {
          if (window.confirm(`Delete "${conv.title}"? This cannot be undone.`)) onDelete(conv.id);
        }}
        aria-label="Delete conversation"
        title="Delete"
      >
        <FiTrash2 />
      </button>
    </li>
  );
}

export default function Sidebar({
  open, onClose, view, onNavigate, onNewChat, conversations, activeId, onSelect, onRename, onDelete, user,
}) {
  return (
    <>
      <div className={`overlay ${open ? "show" : ""}`} onClick={onClose} aria-hidden="true" />
      <aside className={`sidebar ${open ? "open" : ""}`} aria-label="Sidebar">
        <div className="sidebar-top">
          <div className="logo">
            <span className="logo-mark">A</span>
            <span className="logo-text">AskAnything <b>AI</b></span>
          </div>
          <button type="button" className="icon-btn close-sidebar" onClick={onClose} aria-label="Close menu">
            <FiX />
          </button>
        </div>

        <button type="button" className="new-chat" onClick={onNewChat}>
          <FiPlus /> New Chat
        </button>

        <nav className="nav">
          <button type="button" className={view === "tools" ? "active" : ""} onClick={() => onNavigate("tools")}>
            <FiTool /> AI Tools
          </button>
        </nav>

        <div className="history-label">Chat History</div>
        <ul className="history">
          {conversations.length === 0 && <li className="history-empty">No conversations yet</li>}
          {conversations.map((c) => (
            <HistoryItem
              key={c.id}
              conv={c}
              active={view === "chat" && c.id === activeId}
              onSelect={onSelect}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))}
        </ul>

        <div className="sidebar-bottom">
          <button type="button" className={`nav-btn ${view === "settings" ? "active" : ""}`} onClick={() => onNavigate("settings")}>
            <FiSettings /> Settings
          </button>
          <button type="button" className="profile" onClick={() => onNavigate("settings")} aria-label="Profile">
            <span className="avatar">{(user.name || "G").trim().charAt(0).toUpperCase()}</span>
            <span className="profile-text">
              <strong>{user.name}</strong>
              <small>Free plan</small>
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
