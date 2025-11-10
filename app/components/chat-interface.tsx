'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { ProblemSelector, Problem, ExtractionConfirmation } from './problem-selector';
import { ProcessedImage } from './image-upload';
import { 
  manageAttemptTracking, 
  generateProblemSignature, 
  incrementAttemptCount,
  getCurrentProblemFromMessages,
  getAttemptCount
} from '../lib/attempt-tracking';
import { extractionHandlers, ExtractionHandlerContext } from '../lib/extraction-handlers';
import { ConversationHistory } from './conversation-history';
import { XPDisplay } from './xp-display';
import { XPAnimation, useXPAnimation } from './xp-animation';
import { addXP, calculateAttemptXP, calculateSolveXP } from '../lib/xp-system';
import { detectProblemCompletion, determineDifficulty } from '../lib/problem-completion';
import { createSessionFromMessages } from '../lib/conversation-history';
import { saveConversationSessionHybrid, updateConversationSessionHybrid, loadConversationHistoryHybrid, syncLocalStorageToServer } from '../lib/conversation-history-api';
import { saveXPStateHybrid } from '../lib/xp-system-api';
import { VoiceControls } from './voice-controls';
import { ProblemGenerator } from './problem-generator';
import { AuthButton } from './auth-button';
import { useSession } from 'next-auth/react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

type ConversationState = 'CHATTING' | 'PROBLEM_SELECTION' | 'EXTRACTION_CONFIRMATION' | 'IMAGE_UPLOAD_CONFIRMATION';

interface ChatInterfaceProps {
  selectedProblem?: { id: string; problem: string } | null;
}

export function ChatInterface({ selectedProblem }: ChatInterfaceProps = {} as ChatInterfaceProps) {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
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
  const [pendingImage, setPendingImage] = useState<ProcessedImage | null>(null);
  const [lastFailedRequest, setLastFailedRequest] = useState<{ problemText: string; messages: Message[] } | null>(null);
  
  // Phase 6 features
  const [showHistory, setShowHistory] = useState(false);
  const [showProblemGenerator, setShowProblemGenerator] = useState(false);
  const [showTryAnotherPrompt, setShowTryAnotherPrompt] = useState(false);
  const [problemSolved, setProblemSolved] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const { animations, showXP, removeAnimation } = useXPAnimation();

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

  // Sync localStorage to server on login
  useEffect(() => {
    if (isAuthenticated) {
      syncLocalStorageToServer().catch(err => {
        console.warn('Failed to sync localStorage to server:', err);
      });
    }
  }, [isAuthenticated]);

  // Save conversation changes (both old and new systems - hybrid storage)
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(async () => {
        // Save to old format for backward compatibility
        const conversationMessages: ConversationMessage[] = messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        }));
        saveConversation(conversationMessages);
        
        // Save to new conversation history system (hybrid: localStorage + database)
        const currentProblem = getCurrentProblemFromMessages(messages);
        if (currentProblem) {
          if (currentSessionId) {
            const history = await loadConversationHistoryHybrid(isAuthenticated);
            const session = history.sessions.find(s => s.id === currentSessionId);
            if (session) {
              session.messages = messages.map(msg => ({
                role: msg.role as 'user' | 'assistant',
                content: msg.content,
                timestamp: Date.now(),
              }));
              session.updatedAt = Date.now();
              await updateConversationSessionHybrid(session, isAuthenticated);
            }
          } else if (messages.length > 0 && messages[0].role === 'user') {
            const newSession = createSessionFromMessages(
              messages.map(m => ({ role: m.role, content: m.content })),
              currentProblem
            );
            setCurrentSessionId(newSession.id);
            await saveConversationSessionHybrid(newSession, isAuthenticated);
          }
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [messages, currentSessionId, isAuthenticated]);
  
  // Check for problem completion and award XP
  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      const currentProblem = getCurrentProblemFromMessages(messages);
      
      if (currentProblem) {
        const completion = detectProblemCompletion(messages, currentProblem);
        
        if (completion.isComplete && !problemSolved) {
          setProblemSolved(true);
          
          const difficulty = determineDifficulty(currentProblem);
          const problemSig = generateProblemSignature(currentProblem);
          const attemptCount = getAttemptCount(problemSig);
          
          const solveXP = calculateSolveXP(difficulty, attemptCount);
          addXP(solveXP, 'solve', currentProblem);
          showXP(solveXP, 'solve');
          
          // Save XP to database if authenticated
          import('../lib/xp-system').then(({ getXPState }) => {
            const xpState = getXPState();
            if (xpState) {
              saveXPStateHybrid(xpState, isAuthenticated).catch(err => {
                console.warn('Failed to save XP to database:', err);
              });
            }
          });
          
          // Update session (hybrid storage)
          if (currentSessionId) {
            loadConversationHistoryHybrid(isAuthenticated).then(history => {
              const session = history.sessions.find(s => s.id === currentSessionId);
              if (session) {
                session.completed = true;
                session.xpEarned = solveXP;
                updateConversationSessionHybrid(session, isAuthenticated).catch(err => {
                  console.warn('Failed to update session:', err);
                });
              }
            });
          }
          
          setTimeout(() => {
            setShowTryAnotherPrompt(true);
          }, 2000);
        }
      }
    }
  }, [messages, isLoading, problemSolved, currentSessionId, showXP, isAuthenticated]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };



  // Handle new problem - clear conversation
  const handleNewProblem = () => {
    setMessages([]);
    setPreviousProblem(null);
    clearConversation();
    setError(null);
    setShowStillThinking(false);
    setConversationState('CHATTING');
    setPendingProblems([]);
    setExtractionText('');
    setProblemSolved(false);
    setShowTryAnotherPrompt(false);
    setCurrentSessionId(null);
    if (thinkingTimerRef.current) {
      clearTimeout(thinkingTimerRef.current);
      thinkingTimerRef.current = null;
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };
  
  const handleGenerateProblem = () => {
    setShowProblemGenerator(true);
    setShowTryAnotherPrompt(false);
  };
  
  const handleProblemGenerated = (problem: string) => {
    setShowProblemGenerator(false);
    handleNewProblem();
    submitProblem(problem);
  };
  
  const handleSelectFromTest = () => {
    setShowTryAnotherPrompt(false);
    // Navigate to test page or show test problem selector
    window.location.href = '/test';
  };

  // Handle image upload
  const handleImageUpload = async (processedImage: ProcessedImage) => {
    // If there's an existing conversation, ask for confirmation
    if (messages.length > 0) {
      setPendingImage(processedImage);
      setConversationState('IMAGE_UPLOAD_CONFIRMATION');
      return;
    }

    // No existing conversation, process immediately
    await processImageUpload(processedImage);
  };

  // Process image upload (called after confirmation or if no conversation exists)
  const processImageUpload = async (processedImage: ProcessedImage) => {
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

  // Handle confirmation to start new problem with image
  const handleConfirmImageUpload = async () => {
    if (pendingImage) {
      handleNewProblem();
      setConversationState('CHATTING');
      await processImageUpload(pendingImage);
      setPendingImage(null);
    }
  };

  // Handle cancellation of image upload
  const handleCancelImageUpload = () => {
    setPendingImage(null);
    setConversationState('CHATTING');
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
      
      // If this looks like an answer (not a new problem), increment attempt count and award XP
      const looksLikeAnswer = problemText.trim().length < 50 && (problemText.includes('=') || /\d+/.test(problemText));
      if (looksLikeAnswer && !attemptTracking.isNewProblem && currentProblem) {
        const problemSig = generateProblemSignature(currentProblem);
        const newAttemptCount = incrementAttemptCount(problemSig);
        // Award attempt XP
        const attemptXP = calculateAttemptXP(newAttemptCount);
        addXP(attemptXP, 'attempt', currentProblem);
        showXP(attemptXP, 'attempt');
        
        // Save XP to database if authenticated
        import('../lib/xp-system').then(({ getXPState }) => {
          const xpState = getXPState();
          if (xpState) {
            saveXPStateHybrid(xpState, isAuthenticated).catch(err => {
              console.warn('Failed to save XP to database:', err);
            });
          }
        });
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
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      // Store the failed request for retry
      setLastFailedRequest({ problemText, messages: newMessages });
    } finally {
      setIsLoading(false);
    }
  };

  // Retry last failed request
  const handleRetry = async () => {
    if (!lastFailedRequest) return;
    setError(null);
    await submitProblem(lastFailedRequest.problemText);
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
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={handleClearStorage}
              className="px-3 py-2 text-xs text-gray-700 hover:text-gray-900 border border-amber-400 rounded bg-amber-50 hover:bg-amber-100 transition-colors flex flex-col items-center"
              title="Clear all localStorage data (developer mode only)"
            >
              <span>Clear Storage</span>
              <span className="text-[10px] text-amber-800">⚠️ developer mode only</span>
            </button>
          )}
          <XPDisplay />
          <AuthButton />
          <button
            onClick={() => setShowHistory(true)}
            className="px-3 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="View conversation history"
          >
            💬 Chat History
          </button>
          <button
            onClick={handleNewProblem}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            ✨ New Problem
          </button>
        </div>
      </div>
      
      {/* XP Animations */}
      {animations.map(anim => (
        <XPAnimation
          key={anim.id}
          amount={anim.amount}
          reason={anim.reason}
          onComplete={() => removeAnimation(anim.id)}
        />
      ))}
      
      {/* Conversation History Modal */}
      {showHistory && (
        <ConversationHistory
          onSelectSession={(session) => {
            setMessages(session.messages.map((msg, idx) => ({
              id: `session-${session.id}-${idx}`,
              role: msg.role,
              content: msg.content,
            })));
            setCurrentSessionId(session.id);
            setShowHistory(false);
          }}
          onClose={() => setShowHistory(false)}
        />
      )}
      
      {/* Problem Generator Modal */}
      {showProblemGenerator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <ProblemGenerator
            onProblemGenerated={handleProblemGenerated}
            onClose={() => setShowProblemGenerator(false)}
          />
        </div>
      )}
      
      {/* Try Another Problem Prompt */}
      {showTryAnotherPrompt && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-40 bg-white border-2 border-blue-500 rounded-lg shadow-xl p-6 max-w-md">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            🎉 Great job solving that problem!
          </h3>
          <p className="text-gray-700 mb-4">
            Would you like to try another problem? We can create one with AI!
          </p>
          <div className="space-y-2">
            <button
              onClick={handleGenerateProblem}
              className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Generate AI Problem
            </button>
            <button
              onClick={handleSelectFromTest}
              className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Choose from Test Problems
            </button>
            <button
              onClick={() => {
                setShowTryAnotherPrompt(false);
                handleNewProblem();
              }}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Type Your Own Problem
            </button>
          </div>
        </div>
      )}

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

        {/* Image Upload Confirmation UI */}
        {conversationState === 'IMAGE_UPLOAD_CONFIRMATION' && pendingImage && (
          <div className="border-t border-gray-200 bg-white shadow-lg p-4 sm:p-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 font-medium mb-2">
                Start a new problem?
              </p>
              <p className="text-yellow-700 text-sm">
                You&apos;re currently working on a problem. Uploading an image will start a new problem and clear your current conversation. Are you sure you want to continue?
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleConfirmImageUpload}
                className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Yes, start new problem
              </button>
              <button
                onClick={handleCancelImageUpload}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {/* Chat Input (only show when chatting) */}
        {conversationState === 'CHATTING' && (
        <div className="border-t border-gray-200 bg-white shadow-lg p-4 sm:p-6">
          {/* Error display with retry */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="font-medium mb-1">Oops! Something went wrong:</p>
              <p className="text-sm mb-3">{error.message}</p>
              <div className="flex gap-2 flex-wrap">
                {lastFailedRequest && (
                  <button 
                    onClick={handleRetry}
                    disabled={isLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    Retry
                  </button>
                )}
                <button 
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          )}

            {/* Processing image indicator with progress */}
            {isProcessingImage && (
              <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Processing image and extracting problem...</p>
                    <div className="mt-2 w-full bg-blue-200 rounded-full h-1.5">
                      <div className="bg-blue-600 h-1.5 rounded-full animate-pulse" style={{ width: '60%' }} />
                    </div>
                  </div>
                </div>
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
          
          {/* Voice Controls for TTS */}
          {messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && (
            <div className="mt-2">
              <VoiceControls
                autoSpeak={true}
                assistantMessage={messages[messages.length - 1]?.content}
              />
            </div>
          )}
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
