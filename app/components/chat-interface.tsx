'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { ProblemSelector, Problem, ExtractionConfirmation } from './problem-selector';
import { ProcessedImage } from './image-upload';
import { 
  manageAttemptTracking, 
  generateProblemSignature, 
  incrementAttemptCount,
  getCurrentProblemFromMessages 
} from '../lib/attempt-tracking';
import { extractionHandlers, ExtractionHandlerContext } from '../lib/extraction-handlers';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

type ConversationState = 'CHATTING' | 'PROBLEM_SELECTION' | 'EXTRACTION_CONFIRMATION';

interface ChatInterfaceProps {
  selectedProblem?: { id: string; problem: string } | null;
}

export function ChatInterface({ selectedProblem }: ChatInterfaceProps = {} as ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [previousProblem, setPreviousProblem] = useState<string | null>(null);
  const [showStillThinking, setShowStillThinking] = useState(false);
  const thinkingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stillThinkingStartTimeRef = useRef<number | null>(null);
  
  // Image upload state
  const [conversationState, setConversationState] = useState<ConversationState>('CHATTING');
  const [pendingProblems, setPendingProblems] = useState<Problem[]>([]);
  const [extractionText, setExtractionText] = useState<string>('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);

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

  // Clear screen when problem is selected on test page
  useEffect(() => {
    if (selectedProblem) {
      handleNewProblem();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProblem?.id]);

  // Show "still thinking" message after 7 seconds of loading
  useEffect(() => {
    if (isLoading) {
      // Clear any existing timers first
      if (thinkingTimerRef.current) {
        clearTimeout(thinkingTimerRef.current);
        thinkingTimerRef.current = null;
      }
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }

      // Set timer to show "still thinking" after 7 seconds
      thinkingTimerRef.current = setTimeout(() => {
        setShowStillThinking(true);
        stillThinkingStartTimeRef.current = Date.now();
        // Hide after 3 seconds (but will respect 1 second minimum when loading stops)
        hideTimerRef.current = setTimeout(() => {
          setShowStillThinking(false);
          stillThinkingStartTimeRef.current = null;
          hideTimerRef.current = null;
        }, 3000);
        thinkingTimerRef.current = null;
      }, 7000);

      return () => {
        if (thinkingTimerRef.current) {
          clearTimeout(thinkingTimerRef.current);
          thinkingTimerRef.current = null;
        }
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
          hideTimerRef.current = null;
        }
        setShowStillThinking(false);
      };
    } else {
      // Clear any existing timers when loading stops
      if (thinkingTimerRef.current) {
        clearTimeout(thinkingTimerRef.current);
        thinkingTimerRef.current = null;
      }
      
      // If "still thinking" is showing, ensure it persists for at least 1 second
      if (showStillThinking && stillThinkingStartTimeRef.current !== null) {
        const elapsed = Date.now() - stillThinkingStartTimeRef.current;
        const minDisplayTime = 1000; // 1 second minimum
        
        if (elapsed < minDisplayTime) {
          // Not enough time has passed, wait for remaining time
          const remainingTime = minDisplayTime - elapsed;
          if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
          }
          hideTimerRef.current = setTimeout(() => {
            setShowStillThinking(false);
            stillThinkingStartTimeRef.current = null;
            hideTimerRef.current = null;
          }, remainingTime);
        } else {
          // Already shown for at least 1 second, hide immediately
          if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
          }
          setShowStillThinking(false);
          stillThinkingStartTimeRef.current = null;
          hideTimerRef.current = null;
        }
      } else {
        // Not showing, just clear timers
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
          hideTimerRef.current = null;
        }
        setShowStillThinking(false);
      }
    }
  }, [isLoading, showStillThinking]);


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



  // Handle new problem - clear conversation
  const handleNewProblem = () => {
    setMessages([]);
    setPreviousProblem(null);
    clearConversation();
    setHasUnsavedChanges(false);
    setError(null);
    setShowStillThinking(false);
    setConversationState('CHATTING');
    setPendingProblems([]);
    setExtractionText('');
    if (thinkingTimerRef.current) {
      clearTimeout(thinkingTimerRef.current);
      thinkingTimerRef.current = null;
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  // Handle image upload
  const handleImageUpload = async (processedImage: ProcessedImage) => {
    // Only allow uploads when conversation is empty (starting new problem)
    if (messages.length > 0) {
      setError(new Error('Please start a new problem to upload an image.'));
      return;
    }

    setIsProcessingImage(true);
    setError(null);

    try {
      // Call image extraction API
      const response = await fetch('/api/chat/image-extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: processedImage.base64,
          mimeType: processedImage.mimeType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract problem from image');
      }

      const extractionResult = await response.json();

      // Handle different extraction types using handler map
      const handler = extractionHandlers[extractionResult.type as keyof typeof extractionHandlers];
      if (handler) {
        const context: ExtractionHandlerContext = {
          setMessages,
          setPendingProblems,
          setConversationState,
          setExtractionText,
          submitProblem,
        };
        await handler(extractionResult, context);
      }
    } catch (err) {
      console.error('Image extraction error:', err);
      setError(err instanceof Error ? err : new Error('Failed to process image'));
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I'm having trouble processing this image. Please try uploading a clearer photo or type the problem below.",
      };
      setMessages([assistantMessage]);
    } finally {
      setIsProcessingImage(false);
    }
  };

  // Core problem submission logic (extracted from handleFormSubmit)
  const submitProblem = async (problemText: string) => {
    if (!problemText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: problemText.trim(),
    };

    // Add user message
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);
    setError(null);

    try {
      // Track attempt metadata for this problem
      const currentProblem = getCurrentProblemFromMessages(newMessages);
      const attemptTracking = manageAttemptTracking(newMessages, previousProblem || undefined);
      
      // If this looks like an answer (not a new problem), increment attempt count
      const looksLikeAnswer = problemText.trim().length < 50 && (problemText.includes('=') || /\d+/.test(problemText));
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

      // Handle streaming response (text stream format)
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

  // Handle problem selection
  const handleProblemSelect = async (problem: Problem) => {
    setConversationState('CHATTING');
    setPendingProblems([]);
    
    // Add user message with selected problem
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: problem.problem,
    };
    setMessages([userMessage]);
    
    // Start conversation with selected problem
    await submitProblem(problem.problem);
  };

  // Handle extraction confirmation
  const handleExtractionConfirm = async (confirmedText: string) => {
    setConversationState('CHATTING');
    setExtractionText('');
    
    // Add user message with confirmed problem
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: confirmedText,
    };
    setMessages([userMessage]);
    
    // Start conversation with confirmed problem
    await submitProblem(confirmedText);
  };

  // Handle extraction cancel
  const handleExtractionCancel = () => {
    setConversationState('CHATTING');
    setExtractionText('');
    setMessages([]);
  };

  // Form submit handler
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const textToSubmit = input.trim();
    setInput('');
    await submitProblem(textToSubmit);
  };

  // Clear all localStorage data (developer mode only)
  const handleClearStorage = () => {
    if (typeof window === 'undefined') return;
    
    if (confirm('Clear all localStorage data? This will remove conversation history, attempt tracking, and test results.')) {
      try {
        // Clear conversation history
        localStorage.removeItem('math-tutor-conversation');
        
        // Clear all attempt tracking keys
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('attempts_')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Clear test results
        localStorage.removeItem('math-tutor-test-results');
        
        // Reset state
        setMessages([]);
        setPreviousProblem(null);
        setHasUnsavedChanges(false);
        setError(null);
        
        console.log('[Dev] localStorage cleared');
      } catch (error) {
        console.error('[Dev] Failed to clear localStorage:', error);
        alert('Failed to clear localStorage. Check console for details.');
      }
    }
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
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={handleClearStorage}
              className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              title="Clear all localStorage data (developer mode only)"
            >
              Clear Storage
            </button>
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
          showStillThinking={showStillThinking}
        />
        
        {/* Problem Selection UI */}
        {conversationState === 'PROBLEM_SELECTION' && (
          <div className="border-t border-gray-200 bg-white shadow-lg p-4 sm:p-6">
            <ProblemSelector
              problems={pendingProblems}
              onSelect={handleProblemSelect}
              onCancel={() => {
                setConversationState('CHATTING');
                setPendingProblems([]);
                setMessages([]);
              }}
            />
          </div>
        )}

        {/* Extraction Confirmation UI */}
        {conversationState === 'EXTRACTION_CONFIRMATION' && (
          <div className="border-t border-gray-200 bg-white shadow-lg p-4 sm:p-6">
            <ExtractionConfirmation
              extractedText={extractionText}
              onConfirm={handleExtractionConfirm}
              onCancel={handleExtractionCancel}
            />
          </div>
        )}
        
        {/* Chat Input (only show when chatting) */}
        {conversationState === 'CHATTING' && (
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

            {/* Processing image indicator */}
            {isProcessingImage && (
              <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
                <p className="text-sm">Processing image and extracting problem...</p>
              </div>
            )}

          {/* Welcome message for empty conversation */}
            {messages.length === 0 && !isLoading && !isProcessingImage && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 font-medium">Welcome to your AI Math Tutor! 👋</p>
              <p className="text-blue-700 text-sm mt-1">
                I&apos;ll guide you through math problems using questions to help you discover solutions yourself. 
                  Try typing a problem like &quot;2x + 5 = 13&quot; or upload an image to get started!
              </p>
            </div>
          )}

          <MessageInput
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleFormSubmit}
              isLoading={isLoading || isProcessingImage}
            placeholder="Type your math problem here (e.g., 2x + 5 = 13)..."
              onImageUpload={handleImageUpload}
              showImageUpload={true}
          />
        </div>
        )}
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
