import { useState, useEffect, useCallback } from 'react';
import { AccountabilityMessage } from '../types/mock';
import { MockMessages } from '../lib/mock-messages';
import { useMockData } from '../lib/mock-data-context';
import { useMockAuth } from './useMockAuth';

export function useMockMessages() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { state, setMessages, addMessage: addMessageToStore } = useMockData();
  const { user } = useMockAuth();
  const messages = MockMessages.getInstance();

  const fetchMessages = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      const fetchedMessages = await messages.getMessages(user.id);
      setMessages(fetchedMessages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setIsLoading(false);
    }
  }, [user, setMessages]);

  const addMessage = useCallback(async (messageData: Omit<AccountabilityMessage, 'id'>) => {
    try {
      setIsLoading(true);
      setError(null);
      const newMessage = await messages.addMessage(messageData);
      addMessageToStore(newMessage);
      return newMessage;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add message');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [addMessageToStore]);

  const getMessagesForWeek = useCallback(async (weekStart: Date) => {
    if (!user) return [];

    try {
      return await messages.getMessagesForWeek(user.id, weekStart);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weekly messages');
      return [];
    }
  }, [user]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    messages: state.messages,
    isLoading,
    error,
    fetchMessages,
    addMessage,
    getMessagesForWeek,
  };
} 