'use client';

import React, { useEffect, useRef } from 'react';
import { User, Bot, Loader2 } from 'lucide-react';
import { parseToolCallBlocks } from '../lib/tool-call-injection';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  showStillThinking?: boolean;
}

export function MessageList({ messages, isLoading, showStillThinking = false }: MessageListProps) {
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
      
      {/* Loading indicator for when AI is thinking - only show if last message is from user */}
      {/* If last message is assistant, use streaming dots inside that bubble instead */}
      {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
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

      {/* "Still thinking" message after 5 seconds */}
      {showStillThinking && (
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center shadow-sm">
            <Bot className="w-5 h-5 text-gray-600" />
          </div>
          <div className="flex-1 max-w-md sm:max-w-lg">
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-3 shadow-sm mr-6 sm:mr-8">
              <span className="text-yellow-800 text-sm font-medium">Math Tutor is still thinking...</span>
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
          {/* Show content or thinking indicator */}
          {!isUser && isLastMessage && isLoading && !message.content ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Thinking...</span>
            </div>
          ) : (
            <>
              <MessageContent content={message.content} />
              {/* Streaming indicator for last message when content exists */}
              {!isUser && isLastMessage && isLoading && message.content && (
                <div className="mt-2 flex items-center gap-1">
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" />
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                </div>
              )}
            </>
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

/**
 * Parse text with **bold** markdown formatting and return React elements
 * Converts **text** to <strong>text</strong>
 */
function parseBoldMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const pattern = /\*\*([^*]+)\*\*/g;
  let match;
  
  while ((match = pattern.exec(text)) !== null) {
    // Add text before the bold section
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    // Add the bold text
    parts.push(
      <strong key={match.index}>{match[1]}</strong>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text after last match
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  // If no matches found, return original text
  if (parts.length === 0) {
    return [text];
  }
  
  return parts;
}

function MessageContent({ content }: MessageContentProps) {
  // Parse tool call blocks and regular content
  const parts = parseToolCallBlocks(content);
  
  return (
    <div className="space-y-2">
      {parts.map((part, index) => {
        if (part.type === 'tool-call') {
          return (
            <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs font-mono">
              <div className="text-blue-700 font-semibold mb-1">{part.header}</div>
              <div className="text-blue-600 whitespace-pre-wrap">{part.content}</div>
            </div>
          );
        } else if (part.type === 'tool-result') {
          return (
            <div key={index} className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs font-mono">
              <div className="text-green-700 font-semibold mb-1">{part.header}</div>
              <div className="text-green-600 whitespace-pre-wrap">{part.content}</div>
            </div>
          );
        } else {
          // Parse bold markdown in text content
          const boldContent = parseBoldMarkdown(part.content);
          return (
            <div key={index} className="whitespace-pre-wrap">
              {boldContent}
            </div>
          );
        }
      })}
    </div>
  );
}

