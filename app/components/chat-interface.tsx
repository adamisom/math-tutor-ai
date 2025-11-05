'use client';

import { useState, useEffect } from 'react';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { 
  manageAttemptTracking, 
  generateProblemSignature, 
  incrementAttemptCount,
  getCurrentProblemFromMessages 
} from '../lib/attempt-tracking';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [previousProblem, setPreviousProblem] = useState<string | null>(null);

  // Load conversation from localStorage on mount
  useEffect(() => {
    const saved = loadConversation();
    if (saved.length > 0) {
      // Convert ConversationMessage[] to Message[] by adding ids
      const messagesWithIds: Message[] = saved.map((msg, index) => ({
        id: `saved-${index}-${Date.now()}`,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));
      setMessages(messagesWithIds);
    }
  }, []);

  // Save conversation changes
  useEffect(() => {
    if (messages.length > 0) {
      setHasUnsavedChanges(true);
      // Debounced save - convert Message[] to ConversationMessage[]
      const timer = setTimeout(() => {
        const conversationMessages: ConversationMessage[] = messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        }));
        saveConversation(conversationMessages);
        setHasUnsavedChanges(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  // Handle form submission
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    // Add user message and clear input
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Track attempt metadata for this problem
      const currentProblem = getCurrentProblemFromMessages(newMessages);
      const attemptTracking = manageAttemptTracking(newMessages, previousProblem || undefined);
      
      // If this looks like an answer (not a new problem), increment attempt count
      // Simple heuristic: if it's short and contains = or numbers, might be an answer
      const looksLikeAnswer = input.trim().length < 50 && (input.includes('=') || /\d+/.test(input));
      if (looksLikeAnswer && !attemptTracking.isNewProblem && currentProblem) {
        const problemSig = generateProblemSignature(currentProblem);
        incrementAttemptCount(problemSig);
      }
      
      // Update previous problem if this is a new one
      if (attemptTracking.isNewProblem && currentProblem) {
        setPreviousProblem(currentProblem);
      }
      
      // Get current attempt count for the problem
      const problemSig = currentProblem ? generateProblemSignature(currentProblem) : '';
      const attemptCount = problemSig ? 
        (typeof window !== 'undefined' ? 
          parseInt(localStorage.getItem(`attempts_${problemSig}`) || '0', 10) : 0) : 0;

      // Call our API with attempt metadata
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          attemptMetadata: {
            previousProblem: previousProblem || undefined,
            problemSignature: problemSig || undefined,
            attemptCount: attemptCount,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Something went wrong');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Create assistant message for streaming
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
      };

      setMessages([...newMessages, assistantMessage]);

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        accumulatedContent += chunk;

        // Update the assistant message with accumulated content
        setMessages(prevMessages => {
          const updatedMessages = [...prevMessages];
          const lastMessage = updatedMessages[updatedMessages.length - 1];
          if (lastMessage.role === 'assistant') {
            lastMessage.content = accumulatedContent;
          }
          return updatedMessages;
        });
      }

    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle new problem - clear conversation
  const handleNewProblem = () => {
    setMessages([]);
    setPreviousProblem(null);
    clearConversation();
    setHasUnsavedChanges(false);
    setError(null);
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white shadow-sm p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900">AI Math Tutor</h1>
          <p className="text-sm text-gray-600">Your Socratic learning companion</p>
        </div>
        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <span className="text-xs text-gray-500">Saving...</span>
          )}
          <button
            onClick={handleNewProblem}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            New Problem
          </button>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <MessageList 
          messages={messages} 
          isLoading={isLoading}
        />
        
        <div className="border-t border-gray-200 bg-white shadow-lg p-4 sm:p-6">
          {/* Error display */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="font-medium">Oops! Something went wrong:</p>
              <p className="text-sm">{error.message}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try refreshing the page
              </button>
            </div>
          )}

          {/* Welcome message for empty conversation */}
          {messages.length === 0 && !isLoading && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 font-medium">Welcome to your AI Math Tutor! 👋</p>
              <p className="text-blue-700 text-sm mt-1">
                I&apos;ll guide you through math problems using questions to help you discover solutions yourself. 
                Try typing a problem like &quot;2x + 5 = 13&quot; to get started!
              </p>
            </div>
          )}

          <MessageInput
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleFormSubmit}
            isLoading={isLoading}
            placeholder="Type your math problem here (e.g., 2x + 5 = 13)..."
          />
        </div>
      </div>
    </div>
  );
}

// Simple localStorage utilities
interface ConversationMessage {
  role: string;
  content: string;
}
function saveConversation(messages: ConversationMessage[]) {
  try {
    localStorage.setItem('math-tutor-conversation', JSON.stringify(messages));
  } catch (error) {
    console.warn('Failed to save conversation:', error);
    // Handle quota exceeded by clearing old data
    if (error instanceof DOMException && error.code === 22) {
      localStorage.clear();
      try {
        localStorage.setItem('math-tutor-conversation', JSON.stringify(messages));
      } catch {
        // Still failing, just log and continue
        console.warn('Unable to save conversation even after clearing storage');
      }
    }
  }
}

function loadConversation(): ConversationMessage[] {
  try {
    const saved = localStorage.getItem('math-tutor-conversation');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.warn('Failed to load conversation:', error);
    // Clear corrupted data
    localStorage.removeItem('math-tutor-conversation');
    return [];
  }
}

function clearConversation() {
  try {
    localStorage.removeItem('math-tutor-conversation');
  } catch (error) {
    console.warn('Failed to clear conversation:', error);
  }
}
