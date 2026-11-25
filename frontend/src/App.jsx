import { useEffect, useState } from "react";
import { FiMenu, FiPlus } from "react-icons/fi";
import Sidebar from "./components/Sidebar";
import ChatPage from "./pages/ChatPage";
import ToolsPage from "./pages/ToolsPage";
import SettingsPage from "./pages/SettingsPage";
import { useChat } from "./hooks/useChat";
import { useSettings } from "./hooks/useSettings";

const TITLES = { chat: "AskAnything AI", tools: "AI Tools", settings: "Settings" };

export default function App() {
  const chat = useChat();
  const [settings, updateSettings] = useSettings();
  const [view, setView] = useState("chat");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    chat.refreshConversations();
  }, [chat.refreshConversations]);

  const go = (v) => {
    setView(v);
    setSidebarOpen(false);
  };

  const newChat = () => {
    chat.newChat();
    go("chat");
  };

  const select = async (id) => {
    go("chat");
    await chat.openConversation(id);
  };

  const clearAll = async () => {
    for (const c of [...chat.conversations]) {
      try {
        await chat.remove(c.id);
      } catch {
        /* keep going */
      }
    }
    chat.refreshConversations();
  };

  return (
    <div className="app">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        view={view}
        onNavigate={go}
        onNewChat={newChat}
        conversations={chat.conversations}
        activeId={chat.activeId}
        onSelect={select}
        onRename={chat.rename}
        onDelete={chat.remove}
        user={settings}
      />
      <main className="main">
        <header className="topbar">
          <button type="button" className="icon-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <FiMenu />
          </button>
          <span className="topbar-title">{TITLES[view]}</span>
          <button type="button" className="icon-btn" onClick={newChat} aria-label="New chat">
            <FiPlus />
          </button>
        </header>
        {view === "chat" && <ChatPage chat={chat} user={settings} />}
        {view === "tools" && (
          <ToolsPage
            onOpenConversation={async (id) => {
              await chat.refreshConversations();
              select(id);
            }}
          />
        )}
        {view === "settings" && (
          <SettingsPage
            settings={settings}
            update={updateSettings}
            conversations={chat.conversations}
            onClearAll={clearAll}
          />
        )}
      </main>
    </div>
  );
}
