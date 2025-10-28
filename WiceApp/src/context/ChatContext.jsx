import React, { createContext, useContext, useState } from "react";

const ChatContext = createContext();

export function ChatProvider({ children }) {
  // 🟦 Start with sample DMs
  const [chats, setChats] = useState([
    {
      id: "dm-1",
      name: "Jeremy Foster",
      type: "direct",
      messages: [
        { sender: "Jeremy", text: "Hey, are you available for a quick call?", type: "received" },
        { sender: "You", text: "Sure, give me 10 minutes.", type: "sent" },
      ],
    },
    {
      id: "dm-2",
      name: "Sara Calvert",
      type: "direct",
      messages: [
        { sender: "Sara", text: "Just uploaded the final version of the file.", type: "received" },
        { sender: "You", text: "Awesome, I’ll review it now!", type: "sent" },
      ],
    },
  ]);

  // ✅ Create new project chat only if it doesn’t exist yet
  const createProjectChat = (chatId, projectName) => {
    setChats((prev) => {
      const exists = prev.some((chat) => chat.id === chatId);
      if (exists) return prev; // prevent duplicates
      return [
        ...prev,
        {
          id: chatId,
          name: projectName,
          type: "project",
          messages: [
            {
              sender: "System",
              text: `Project group chat for ${projectName} created.`,
              type: "received",
            },
          ],
        },
      ];
    });
  };

  // ✅ Send message
  const sendMessage = (chatId, text, sender = "You") => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: [
                ...chat.messages,
                {
                  sender,
                  text,
                  type: sender === "You" ? "sent" : "received",
                },
              ],
            }
          : chat
      )
    );
  };

  return (
    <ChatContext.Provider value={{ chats, sendMessage, createProjectChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used within a ChatProvider");
  return context;
}
