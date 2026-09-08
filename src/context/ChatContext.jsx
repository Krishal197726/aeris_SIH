import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const ChatContext = createContext(null);

// Helper: get the current Supabase access token, or null if not signed in
async function getAccessToken() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch {
    return null;
  }
}

export function ChatProvider({ children }) {
  const { currentUser, isAuthenticated } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [isLoadingChats, setIsLoadingChats] = useState(false);

  const userKey = currentUser?.email ? currentUser.email.toLowerCase() : 'guest';

  // Load chats from backend (authenticated) with localStorage fallback
  const fetchChats = useCallback(async () => {
    setIsLoadingChats(true);
    try {
      const token = await getAccessToken();
      if (token) {
        const res = await fetch('/api/chats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.chats)) {
            setChats(data.chats);
            localStorage.setItem(`aeris_chats_${userKey}`, JSON.stringify(data.chats));
            return;
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch chats from backend, checking local storage:', err);
    } finally {
      setIsLoadingChats(false);
    }

    // Fallback to localStorage (guest or unauthenticated)
    try {
      const local = localStorage.getItem(`aeris_chats_${userKey}`);
      if (local) {
        setChats(JSON.parse(local));
      } else {
        setChats([]);
      }
    } catch (e) {
      setChats([]);
    }
  }, [userKey]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Current active chat object
  const activeChat = chats.find(c => c.id === activeChatId) || null;

  // Create new blank chat
  const createNewChat = useCallback(() => {
    setActiveChatId(null);
  }, []);

  // Select existing chat from history
  const selectChat = useCallback((chatId) => {
    setActiveChatId(chatId);
  }, []);

  // Add a message (User or Bot) to the conversation and persist
  const addMessageToChat = useCallback(async (message) => {
    setChats((prevChats) => {
      let currentId = activeChatId;
      let targetChat = prevChats.find(c => c.id === currentId);

      const now = new Date().toISOString();

      if (!targetChat) {
        // Generate a new chat with title from the first prompt
        const rawTitle = message.text || 'Weather Query';
        const chatTitle = rawTitle.length > 42 ? rawTitle.substring(0, 42).trim() + '...' : rawTitle;
        currentId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

        targetChat = {
          id: currentId,
          title: chatTitle,
          userEmail: userKey,
          messages: [message],
          createdAt: now,
          updatedAt: now
        };

        const updated = [targetChat, ...prevChats];
        setActiveChatId(currentId);
        persistChat(targetChat);
        localStorage.setItem(`aeris_chats_${userKey}`, JSON.stringify(updated));
        return updated;
      } else {
        const updatedChat = {
          ...targetChat,
          messages: [...(targetChat.messages || []), message],
          updatedAt: now
        };

        const updated = prevChats.map(c => c.id === targetChat.id ? updatedChat : c);
        persistChat(updatedChat);
        localStorage.setItem(`aeris_chats_${userKey}`, JSON.stringify(updated));
        return updated;
      }
    });
  }, [activeChatId, userKey]);

  // Save chat to backend (authenticated) with silent local-only fallback
  const persistChat = async (chat) => {
    try {
      const token = await getAccessToken();
      if (!token) return; // unauthenticated — local storage only
      await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(chat)
      });
    } catch (e) {
      console.warn('Failed to sync chat to backend:', e);
    }
  };

  // Delete a chat session
  const deleteChat = useCallback(async (chatId, e) => {
    if (e) {
      e.stopPropagation();
    }

    setChats((prev) => {
      const filtered = prev.filter(c => c.id !== chatId);
      localStorage.setItem(`aeris_chats_${userKey}`, JSON.stringify(filtered));
      return filtered;
    });

    if (activeChatId === chatId) {
      setActiveChatId(null);
    }

    try {
      const token = await getAccessToken();
      if (!token) return; // unauthenticated — skip backend delete
      await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.warn('Failed to delete chat on backend:', err);
    }
  }, [activeChatId, userKey]);

  return (
    <ChatContext.Provider
      value={{
        chats,
        activeChat,
        activeChatId,
        isLoadingChats,
        createNewChat,
        selectChat,
        addMessageToChat,
        deleteChat,
        refreshChats: fetchChats
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
