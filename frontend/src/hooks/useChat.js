import { useCallback, useRef, useState } from "react";
import { api } from "../services/api";

let tempCounter = 0;
const tempId = () => `tmp-${Date.now()}-${tempCounter++}`;

/**
 * Chat state: conversation list, active conversation, messages, sending/error state.
 * The backend stores nothing when a Gemini call fails, so "retry" simply resends.
 */
export function useChat() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [activeTool, setActiveTool] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [error, setError] = useState(null); // { message, code, retry: fn }
  const abortRef = useRef(null);
  const activeIdRef = useRef(null);
  const toolRef = useRef(null);

  const setActive = (id, tool = null) => {
    activeIdRef.current = id;
    toolRef.current = tool;
    setActiveId(id);
    setActiveTool(tool);
  };

  const refreshConversations = useCallback(async () => {
    try {
      setConversations(await api.listConversations());
    } catch {
      /* the list is non-critical; chat errors surface separately */
    }
  }, []);

  const upsertConversation = (conv) =>
    setConversations((prev) => [conv, ...prev.filter((c) => c.id !== conv.id)]);

  const newChat = useCallback(() => {
    abortRef.current?.abort();
    setActive(null, null);
    setMessages([]);
    setError(null);
    setSending(false);
  }, []);

  const openConversation = useCallback(async (id) => {
    abortRef.current?.abort();
    setError(null);
    setSending(false);
    setLoadingConversation(true);
    try {
      const data = await api.getConversation(id);
      setActive(data.id, data.tool);
      setMessages(data.messages);
    } catch (e) {
      setError({ message: e.message, code: e.code, retry: () => openConversation(id) });
    } finally {
      setLoadingConversation(false);
    }
  }, []);

  const send = useCallback(async (text, tool = null) => {
    const message = text.trim();
    if (!message) return { ok: false };
    setError(null);

    const optimistic = {
      id: tempId(),
      role: "user",
      content: message,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setSending(true);

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await api.chat(
        { message, conversationId: activeIdRef.current, tool: toolRef.current || tool },
        controller.signal
      );
      setActive(res.conversation.id, res.conversation.tool);
      setMessages((prev) =>
        prev.filter((m) => m.id !== optimistic.id).concat([res.user_message, res.assistant_message])
      );
      upsertConversation(res.conversation);
      return { ok: true, conversationId: res.conversation.id };
    } catch (e) {
      if (e.name === "AbortError") {
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        return { ok: false, aborted: true, text: message };
      }
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? { ...m, failed: true } : m)));
      setError({
        message: e.message,
        code: e.code,
        retry: () => {
          setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
          return send(message, tool);
        },
      });
      return { ok: false };
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setSending(false);
    }
  }, []);

  const regenerate = useCallback(async () => {
    const id = activeIdRef.current;
    if (!id) return;
    setError(null);
    setSending(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await api.chat({ conversationId: id, regenerate: true }, controller.signal);
      setMessages((prev) => {
        const copy = [...prev];
        if (copy.length && copy[copy.length - 1].role === "assistant") copy.pop();
        return [...copy, res.assistant_message];
      });
      upsertConversation(res.conversation);
    } catch (e) {
      if (e.name === "AbortError") return;
      setError({ message: e.message, code: e.code, retry: regenerate });
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setSending(false);
    }
  }, []);

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const rename = useCallback(async (id, title) => {
    const conv = await api.renameConversation(id, title);
    setConversations((prev) => prev.map((c) => (c.id === id ? conv : c)));
  }, []);

  const remove = useCallback(
    async (id) => {
      await api.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeIdRef.current === id) newChat();
    },
    [newChat]
  );

  return {
    conversations, activeId, activeTool, messages, sending, loadingConversation, error,
    setError, refreshConversations, newChat, openConversation, send, regenerate, stop,
    rename, remove,
  };
}
