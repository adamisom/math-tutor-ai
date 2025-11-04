'use client';

import { useEffect, useRef } from 'react';
import { User, Bot, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-gray-50">
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id || index}
          message={message}
          isLastMessage={index === messages.length - 1}
          isLoading={isLoading}
        />
      ))}
      
      {/* Loading indicator for when AI is thinking */}
      {isLoading && messages.length > 0 && (
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center shadow-sm">
            <Bot className="w-5 h-5 text-gray-600" />
          </div>
          <div className="flex-1 max-w-md sm:max-w-lg">
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm mr-6 sm:mr-8 flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span className="text-gray-600 text-sm font-medium">Thinking...</span>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  isLastMessage: boolean;
  isLoading: boolean;
}

function MessageBubble({ message, isLastMessage, isLoading }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex items-start gap-3 sm:gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
        isUser 
          ? 'bg-blue-500 text-white' 
          : 'bg-white border-2 border-gray-200 text-gray-600'
      }`}>
        {isUser ? (
          <User className="w-5 h-5" />
        ) : (
          <Bot className="w-5 h-5" />
        )}
      </div>
      
      {/* Message content */}
      <div className={`flex-1 ${isUser ? 'max-w-sm sm:max-w-md' : 'max-w-md sm:max-w-lg'}`}>
        <div className={`rounded-2xl px-4 py-3 shadow-sm ${
          isUser
            ? 'bg-blue-500 text-white ml-6 sm:ml-8'
            : 'bg-white text-gray-900 mr-6 sm:mr-8 border border-gray-200'
        }`}>
          <MessageContent content={message.content} />
          
          {/* Streaming indicator for last message */}
          {!isUser && isLastMessage && isLoading && (
            <div className="mt-2 flex items-center gap-1">
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" />
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            </div>
          )}
        </div>
        
        {/* Timestamp */}
        <div className={`text-xs text-gray-500 mt-1 px-1 ${isUser ? 'text-right' : ''}`}>
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

interface MessageContentProps {
  content: string;
}

function MessageContent({ content }: MessageContentProps) {
  // For Phase 1, we'll just render plain text
  // In Phase 3, this will be enhanced with LaTeX rendering
  return (
    <div className="whitespace-pre-wrap">
      {content}
    </div>
  );
}
