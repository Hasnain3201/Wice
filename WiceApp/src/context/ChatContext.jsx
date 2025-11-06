/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  addMessage,
  ensureProjectChat,
  getOrCreateDirectChat,
  hideChatForUser,
  listenToMessages,
  subscribeToUserChats,
  unhideChatForUser,
} from "../services/chat.js";
import { useAuth } from "./AuthContext.jsx";

const ChatContext = createContext(null);
const LAST_READ_PREFIX = "wice-chat-lastread";

function convertTimestamp(field) {
  if (!field) return null;
  if (typeof field.toDate === "function") return field.toDate();
  if (field instanceof Date) return field;
  return null;
}

function extractChat(doc) {
  const raw = doc.data();
  return {
    id: doc.id,
    ...raw,
    createdAt: convertTimestamp(raw.createdAt),
    updatedAt: convertTimestamp(raw.updatedAt),
    lastMessage: raw.lastMessage
      ? {
          ...raw.lastMessage,
          createdAt: convertTimestamp(raw.lastMessage.createdAt),
        }
      : null,
  };
}

function convertMessage(doc) {
  const raw = doc.data();
  return {
    id: doc.id,
    ...raw,
    createdAt: convertTimestamp(raw.createdAt),
  };
}

function loadLastRead(uid) {
  if (typeof window === "undefined" || !uid) return {};
  try {
    const raw = window.sessionStorage.getItem(`${LAST_READ_PREFIX}:${uid}`);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("Failed to parse chat lastRead cache:", error);
    }
    return {};
  }
}

function persistLastRead(uid, data) {
  if (typeof window === "undefined" || !uid) return;
  window.sessionStorage.setItem(
    `${LAST_READ_PREFIX}:${uid}`,
    JSON.stringify(data)
  );
}

export function ChatProvider({ children }) {
  const { user, profile, refreshProfile } = useAuth();
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastRead, setLastRead] = useState({});
  const messageUnsubscribers = useRef({});
  const pendingUnhideRef = useRef(new Set());

  // Reset helpers when user changes
  useEffect(() => {
    Object.values(messageUnsubscribers.current).forEach((fn) => fn());
    messageUnsubscribers.current = {};
    setChats([]);
    setMessages({});
    setLastRead({});

    if (!user?.uid) {
      setLoading(false);
      return () => {};
    }

    setLastRead(loadLastRead(user.uid));
    setLoading(true);
    const unsubscribe = subscribeToUserChats(user.uid, (snapshot) => {
      const chatList = snapshot.docs.map(extractChat);
      chatList.sort((a, b) => {
        const aTime = a.updatedAt?.getTime?.() || 0;
        const bTime = b.updatedAt?.getTime?.() || 0;
        return bTime - aTime;
      });

      setChats(chatList);
      const activeIds = new Set(chatList.map((chat) => chat.id));

      // Ensure message listeners are attached for active chats
      chatList.forEach((chat) => {
        if (!messageUnsubscribers.current[chat.id]) {
          messageUnsubscribers.current[chat.id] = listenToMessages(
            chat.id,
            (messagesSnapshot) => {
              const entries = messagesSnapshot.docs.map(convertMessage);
              setMessages((prev) => ({ ...prev, [chat.id]: entries }));
            }
          );
        }
      });

      // Clean up listeners for chats no longer present
      Object.keys(messageUnsubscribers.current).forEach((chatId) => {
        if (!activeIds.has(chatId)) {
          messageUnsubscribers.current[chatId]();
          delete messageUnsubscribers.current[chatId];
          setMessages((prev) => {
            const next = { ...prev };
            delete next[chatId];
            return next;
          });
        }
      });

      setLoading(false);
    });

    return () => {
      unsubscribe();
      Object.values(messageUnsubscribers.current).forEach((fn) => fn());
      messageUnsubscribers.current = {};
      setLastRead({});
    };
  }, [user?.uid]);

  const currentUserMeta = useMemo(() => {
    if (!user) return null;
    return {
      uid: user.uid,
      email: user.email || null,
      role: profile?.accountType || null,
      fullName: profile?.fullName || user.displayName || user.email || "User",
    };
  }, [user, profile?.accountType, profile?.fullName]);

  const hiddenChatsMap = useMemo(
    () => (profile?.hiddenChats ? { ...profile.hiddenChats } : {}),
    [profile?.hiddenChats]
  );

  const startDirectChat = useCallback(
    async (targetUser) => {
      if (!currentUserMeta) throw new Error("User must be signed in to start chats.");
      if (!targetUser?.uid) throw new Error("Target user is missing a UID.");
      const chat = await getOrCreateDirectChat(currentUserMeta, targetUser);
      if (hiddenChatsMap[chat.id]) {
        await unhideChatForUser(currentUserMeta.uid, chat.id);
        refreshProfile?.();
      }
      return chat;
    },
    [currentUserMeta, hiddenChatsMap, refreshProfile]
  );

  const createProjectChat = useCallback(
    async (projectId, projectName, participantList = []) => {
      if (!currentUserMeta) throw new Error("User must be signed in to create chats.");
      const participants = [
        currentUserMeta,
        ...participantList.filter((p) => p?.uid && p.uid !== currentUserMeta.uid),
      ];
      const chat = await ensureProjectChat(projectId, {
        name: projectName,
        participants,
      });
      return chat;
    },
    [currentUserMeta]
  );

  const sendMessage = useCallback(
    async (chatId, text) => {
      if (!currentUserMeta) throw new Error("User must be signed in to send messages.");
      if (!chatId) throw new Error("Missing chatId for message send.");

      const trimmed = text.trim();
      if (!trimmed) return;

      await addMessage(chatId, {
        text: trimmed,
        senderId: currentUserMeta.uid,
        senderRole: currentUserMeta.role,
        senderName: currentUserMeta.fullName,
      });
      setLastRead((prev) => {
        const next = { ...prev, [chatId]: Date.now() };
        persistLastRead(currentUserMeta.uid, next);
        return next;
      });
    },
    [currentUserMeta]
  );

  const markChatAsRead = useCallback(
    (chatId, date) => {
      if (!currentUserMeta?.uid || !chatId) return;
      const timestamp =
        date instanceof Date ? date.getTime() : convertTimestamp(date)?.getTime?.() || Date.now();
      setLastRead((prev) => {
        const prevValue = prev[chatId] || 0;
        if (timestamp <= prevValue) return prev;
        const next = { ...prev, [chatId]: timestamp };
        persistLastRead(currentUserMeta.uid, next);
        return next;
      });
    },
    [currentUserMeta?.uid]
  );

  const unreadChatIds = useMemo(() => {
    if (!currentUserMeta?.uid) return [];
    return chats
      .filter((chat) => {
        if (hiddenChatsMap[chat.id]) {
          const hiddenAt = hiddenChatsMap[chat.id];
          const threadMessages = messages[chat.id];
          if (!threadMessages || threadMessages.length === 0) return false;
          const latest = threadMessages[threadMessages.length - 1];
          if (!latest?.createdAt) return false;
          if (latest.createdAt.getTime() <= hiddenAt) return false;
        }
        const threadMessages = messages[chat.id];
        if (!threadMessages || threadMessages.length === 0) return false;
        const latest = threadMessages[threadMessages.length - 1];
        if (!latest?.createdAt) return false;
        if (latest.senderId === currentUserMeta.uid) return false;
        const latestTime = latest.createdAt.getTime();
        const seenTime = lastRead[chat.id] || 0;
        return latestTime > seenTime;
      })
      .map((chat) => chat.id);
  }, [chats, messages, lastRead, currentUserMeta?.uid, hiddenChatsMap]);

  useEffect(() => {
    if (!currentUserMeta?.uid) return;
    Object.entries(hiddenChatsMap).forEach(([chatId, hiddenAt]) => {
      if (pendingUnhideRef.current.has(chatId)) return;
      const threadMessages = messages[chatId];
      if (!threadMessages || threadMessages.length === 0) return;
      const latest = threadMessages[threadMessages.length - 1];
      if (!latest?.createdAt) return;
      if (latest.createdAt.getTime() > hiddenAt) {
        pendingUnhideRef.current.add(chatId);
        unhideChatForUser(currentUserMeta.uid, chatId)
          .then(() => refreshProfile?.())
          .catch((error) => {
            if (import.meta.env.DEV) {
              console.warn("Failed to auto-unhide chat", chatId, error);
            }
          })
          .finally(() => {
            pendingUnhideRef.current.delete(chatId);
          });
      }
    });
  }, [hiddenChatsMap, messages, currentUserMeta?.uid, refreshProfile]);

  useEffect(() => {
    const activeIds = new Set(chats.map((chat) => chat.id));
    setLastRead((prev) => {
      const entries = Object.entries(prev).filter(([chatId]) => activeIds.has(chatId));
      const next = Object.fromEntries(entries);
      if (entries.length === Object.keys(prev).length) return prev;
      return next;
    });
  }, [chats]);

  useEffect(() => {
    if (!currentUserMeta?.uid) return;
    persistLastRead(currentUserMeta.uid, lastRead);
  }, [lastRead, currentUserMeta?.uid]);

  const hideChat = useCallback(
    async (chatId) => {
      if (!currentUserMeta?.uid) return;
      try {
        const hiddenAt = Date.now();
        pendingUnhideRef.current.delete(chatId);
        await hideChatForUser(currentUserMeta.uid, chatId, hiddenAt);
        setLastRead((prev) => {
          const next = { ...prev, [chatId]: hiddenAt };
          persistLastRead(currentUserMeta.uid, next);
          return next;
        });
        await refreshProfile?.();
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Failed to hide chat", chatId, error);
        }
      }
    },
    [currentUserMeta?.uid, refreshProfile]
  );

  const value = useMemo(
    () => ({
      chats,
      messages,
      loading,
      startDirectChat,
      createProjectChat,
      sendMessage,
      markChatAsRead,
      unreadChatIds,
      hideChat,
    }),
    [
      chats,
      messages,
      loading,
      startDirectChat,
      createProjectChat,
      sendMessage,
      markChatAsRead,
      unreadChatIds,
      hideChat,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
