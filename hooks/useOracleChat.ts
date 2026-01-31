import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { generateTarotFollowUp, addFollowUpQuestion } from '../services/api';

/**
 * Message in the chat history
 */
export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

/**
 * Parameters for initializing the Oracle chat
 */
export interface OracleChatParams {
  readingText: string;
  backendReadingId: string | null;
  language: 'en' | 'fr';
  canAfford: (cost: number) => boolean; // Validates only - backend does actual deduction
}

/**
 * Return type for the useOracleChat hook
 */
export interface UseOracleChatReturn {
  messages: ChatMessage[];
  sendMessage: (message: string) => Promise<boolean>;
  isSending: boolean;
  error: string | null;
  clearError: () => void;
  chatInput: string;
  setChatInput: (value: string) => void;
  questionCost: number;
}

/**
 * Hook for managing follow-up chat with the Oracle after a tarot reading.
 *
 * Handles:
 * - Chat message history management
 * - Getting Clerk session token
 * - Calling the follow-up generation API
 * - Saving follow-ups to backend
 * - Credit cost calculation (2 questions per credit)
 * - Loading state management
 * - Error handling
 *
 * @example
 * ```tsx
 * const {
 *   messages,
 *   sendMessage,
 *   isSending,
 *   error,
 *   chatInput,
 *   setChatInput,
 *   questionCost
 * } = useOracleChat({
 *   readingText,
 *   backendReadingId,
 *   language,
 *   canAfford
 * });
 *
 * const handleSubmit = async (e: React.FormEvent) => {
 *   e.preventDefault();
 *   if (chatInput.trim()) {
 *     await sendMessage(chatInput);
 *   }
 * };
 * ```
 */
export function useOracleChat(params: OracleChatParams): UseOracleChatReturn {
  const { readingText, backendReadingId, language, canAfford } = params;
  const { getToken } = useAuth();

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionQuestionCount, setSessionQuestionCount] = useState(0);

  // Track mounted state to avoid setting state on unmounted component
  const mountedRef = useRef(true);

  // Ref to access current messages without causing callback recreation
  const messagesRef = useRef<ChatMessage[]>(messages);

  // Keep messagesRef in sync with messages state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Calculate the cost for the next question.
   * Pricing: 2 questions for 1 credit
   * Charge on even counts (0, 2, 4...), free on odd counts (1, 3, 5...)
   */
  const questionCost = sessionQuestionCount % 2 === 0 ? 1 : 0;

  /**
   * Send a message to the Oracle and get a response.
   * Returns true if successful, false otherwise.
   */
  const sendMessage = useCallback(async (message: string): Promise<boolean> => {
    if (!message.trim() || isSending) {
      return false;
    }

    // Check if user can afford (actual deduction happens on backend)
    if (questionCost > 0 && !canAfford(questionCost)) {
      if (mountedRef.current) {
        setError('Insufficient credits');
      }
      return false;
    }

    // Clear input, add user message, and increment question count atomically
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setSessionQuestionCount(prev => prev + 1);
    setIsSending(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        if (mountedRef.current) {
          setError('Not authenticated');
          setMessages(prev => [
            ...prev,
            { role: 'model', content: 'Sorry, you need to be logged in to ask questions.' }
          ]);
        }
        return false;
      }

      // Convert chat history to backend format (use ref to avoid stale closure)
      const historyForBackend = messagesRef.current.map(h => ({
        role: h.role === 'model' ? 'assistant' as const : h.role,
        content: h.content
      }));

      const result = await generateTarotFollowUp(token, {
        reading: readingText,
        history: historyForBackend,
        question: message,
        language
      });

      if (mountedRef.current) {
        setMessages(prev => [...prev, { role: 'model', content: result.answer }]);
      }

      // Save follow-up question to backend (non-blocking)
      if (backendReadingId) {
        try {
          await addFollowUpQuestion(token, backendReadingId, message, result.answer);
        } catch (saveError) {
          // Non-blocking - follow-up just won't be saved to history if save fails
          console.error('Failed to save follow-up to backend:', saveError);
        }
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process question';
      if (mountedRef.current) {
        setError(errorMessage);
        setMessages(prev => [
          ...prev,
          { role: 'model', content: 'Sorry, I could not process your question. Please try again.' }
        ]);
      }
      return false;
    } finally {
      if (mountedRef.current) {
        setIsSending(false);
      }
    }
  }, [isSending, questionCost, canAfford, getToken, readingText, language, backendReadingId]);

  return {
    messages,
    sendMessage,
    isSending,
    error,
    clearError,
    chatInput,
    setChatInput,
    questionCost
  };
}

export default useOracleChat;
