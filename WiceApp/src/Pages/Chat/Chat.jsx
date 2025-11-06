import React, { useEffect, useMemo, useRef, useState } from "react";
import "./Chat.css";
import { Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useChat } from "../../context/ChatContext.jsx";

function getChatLabel(chat, currentUid) {
  if (!chat) return "";
  if (chat.type === "direct") {
    const partner =
      chat.participants?.find((participant) => participant.uid !== currentUid) || {};
    return partner.fullName || partner.email || chat.name || "Conversation";
  }
  return chat.name || "Project Chat";
}

function formatTimestamp(date) {
  if (!date) return "";
  try {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function Chat() {
  const { user, profile } = useAuth();
  const { chats, messages, loading, sendMessage, markChatAsRead, unreadChatIds, hideChat } =
    useChat();
  const [activeChatId, setActiveChatId] = useState(null);
  const [draft, setDraft] = useState("");
  const [chatPendingHide, setChatPendingHide] = useState(null);
  const [isHiding, setIsHiding] = useState(false);
  const messagesEndRef = useRef(null);

  const role = profile?.accountType;
  const hiddenChatsMap = useMemo(
    () => profile?.hiddenChats || {},
    [profile?.hiddenChats]
  );
  const directChats = useMemo(
    () => chats.filter((chat) => chat.type === "direct"),
    [chats]
  );
  const visibleDirectChats = useMemo(() => {
    return directChats.filter((chat) => {
      const hiddenAt = hiddenChatsMap[chat.id];
      if (!hiddenAt) return true;
      const thread = messages[chat.id];
      if (!thread || thread.length === 0) return false;
      const latest = thread[thread.length - 1];
      if (!latest?.createdAt) return false;
      return latest.createdAt.getTime() > hiddenAt;
    });
  }, [directChats, hiddenChatsMap, messages]);

  useEffect(() => {
    if (visibleDirectChats.length === 0) {
      if (activeChatId !== null) setActiveChatId(null);
      return;
    }
    const stillExists = visibleDirectChats.some((chat) => chat.id === activeChatId);
    if (!stillExists) {
      setActiveChatId(visibleDirectChats[0].id);
    }
  }, [visibleDirectChats, activeChatId]);

  const activeChat = visibleDirectChats.find((chat) => chat.id === activeChatId) || null;
  const messageList = activeChat ? messages[activeChat.id] || [] : [];
  const latestMessage =
    messageList.length > 0 ? messageList[messageList.length - 1] : null;

  useEffect(() => {
    if (!activeChat || !latestMessage) return;
    markChatAsRead(activeChat.id, latestMessage.createdAt);
  }, [activeChat, latestMessage, markChatAsRead]);

  useEffect(() => {
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({ block: "end" });
  }, [activeChatId, messageList.length]);

  const sendCurrentMessage = async () => {
    if (!activeChat || !draft.trim()) return;
    await sendMessage(activeChat.id, draft);
    setDraft("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await sendCurrentMessage();
  };

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
    setDraft("");
  };

  const requestHideChat = (chat, event) => {
    event.stopPropagation();
    setChatPendingHide(chat);
  };

  const confirmHideChat = async () => {
    if (!chatPendingHide) return;
    setIsHiding(true);
    try {
      await hideChat(chatPendingHide.id);
      if (activeChatId === chatPendingHide.id) {
        setActiveChatId(null);
      }
    } finally {
      setIsHiding(false);
      setChatPendingHide(null);
    }
  };

  const cancelHideChat = () => {
    if (isHiding) return;
    setChatPendingHide(null);
  };

  const activeChatLabel = useMemo(
    () => getChatLabel(activeChat, user?.uid),
    [activeChat, user?.uid]
  );

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Messages</h1>
        <p className="dashboard-subtitle">
          Start conversations and collaborate in real time.
        </p>
      </header>

      <div className="chat-shell">
        <aside className="chat-sidebar" aria-label="Direct messages">
          <header className="chat-sidebar-header">
            <h3>Chats</h3>
            <span className="chat-role-badge">{(role || "user").toUpperCase()}</span>
          </header>

          <section>
            <h4 className="chat-section-title">Direct Messages</h4>
            <ul className="chat-thread-list">
              {visibleDirectChats.length > 0 ? (
                visibleDirectChats.map((thread) => {
                  const isActive = thread.id === activeChatId;
                  const isUnread = unreadChatIds.includes(thread.id);
                  const lastTime = formatTimestamp(thread.lastMessage?.createdAt);
                  return (
                    <li
                      key={thread.id}
                      className={`chat-thread ${isActive ? "active" : ""} ${
                        isUnread ? "unread" : ""
                      }`}
                      onClick={() => handleSelectChat(thread.id)}
                    >
                      <div className="thread-line">
                        <div className="thread-title">
                          <h4>{getChatLabel(thread, user?.uid)}</h4>
                          {isUnread ? <span className="thread-dot" aria-hidden="true" /> : null}
                        </div>
                        <div className="thread-meta">
                          {lastTime ? <span className="thread-time">{lastTime}</span> : null}
                          <button
                            type="button"
                            className="thread-delete"
                            aria-label="Hide chat"
                            onClick={(event) => requestHideChat(thread, event)}
                            title="Hide chat"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <p>{thread.lastMessage?.text || "No messages yet"}</p>
                    </li>
                  );
                })
              ) : (
                <p className="empty-chat-note">
                  No direct messages yet. Visit the marketplace and click “Message” on a consultant to start.
                </p>
              )}
            </ul>
          </section>
        </aside>

        <section className="chat-window" aria-live="polite">
          <header className="chat-window-header">
            {activeChat ? (
              <div>
                <h3>{activeChatLabel}</h3>
                <p>Direct Chat</p>
              </div>
            ) : (
              <div>
                <h3>No chat selected</h3>
                <p>Select a conversation to view messages.</p>
              </div>
            )}
          </header>
          <div className="chat-window-content">
            {activeChat ? (
              <div className="chat-messages">
                {loading && messageList.length === 0 ? (
                  <p className="empty-chat-note">Loading conversation…</p>
                ) : messageList.length === 0 ? (
                  <p className="empty-chat-note">No messages yet. Say hello!</p>
                ) : (
                  messageList.map((message) => (
                    <article
                      key={message.id}
                      className={`chat-bubble ${
                        message.senderId === user?.uid ? "outgoing" : "incoming"
                      }`}
                    >
                      <p>{message.text}</p>
                      <span className="chat-meta">
                        {message.senderName} · {formatTimestamp(message.createdAt)}
                      </span>
                    </article>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="chat-empty">
                <h3>Select a conversation</h3>
                <p>Choose a chat from the list or start one from the marketplace.</p>
              </div>
            )}
          </div>
          <form className="chat-composer" onSubmit={handleSubmit}>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendCurrentMessage();
                }
              }}
              placeholder={
                activeChat ? "Type your message…" : "Select a chat to start typing…"
              }
              rows={2}
              disabled={!activeChat}
            />
            <button type="submit" disabled={!activeChat || !draft.trim()}>
              Send
            </button>
          </form>
        </section>
      </div>
      {chatPendingHide ? (
        <div
          className="chat-confirm-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="chat-confirm-title"
          aria-describedby="chat-confirm-description"
          onClick={cancelHideChat}
        >
          <div
            className="chat-confirm-dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <h4 id="chat-confirm-title">Hide this chat?</h4>
            <p id="chat-confirm-description">
              {`You won't see messages from ${getChatLabel(chatPendingHide, user?.uid)} until a new message arrives.`}
            </p>
            <div className="chat-confirm-actions">
              <button
                type="button"
                className="chat-confirm-cancel"
                onClick={cancelHideChat}
                disabled={isHiding}
              >
                Cancel
              </button>
              <button
                type="button"
                className="chat-confirm-delete"
                onClick={confirmHideChat}
                disabled={isHiding}
              >
                {isHiding ? "Hiding…" : "Delete Chat"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
