'use client';

import { Send, Loader2 } from 'lucide-react';
import { KeyboardEvent, useState, DragEvent } from 'react';
import { ImageUploadButton, ProcessedImage } from './image-upload';
import { VoiceControls } from './voice-controls';

interface MessageInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  placeholder?: string;
  onImageUpload?: (processedImage: ProcessedImage) => void;
  showImageUpload?: boolean;
}

export function MessageInput({ 
  input, 
  handleInputChange, 
  handleSubmit, 
  isLoading, 
  placeholder = "Type your message...",
  onImageUpload,
  showImageUpload = false
}: MessageInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [voiceInput, setVoiceInput] = useState('');

  // Handle Enter key to submit (without Shift)
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        // Create a synthetic form event
        const form = e.currentTarget.closest('form');
        if (form) {
          const syntheticEvent = new Event('submit', { bubbles: true, cancelable: true }) as unknown as React.FormEvent<HTMLFormElement>;
          Object.defineProperty(syntheticEvent, 'preventDefault', {
            value: () => {},
            writable: false,
          });
          handleSubmit(syntheticEvent);
        }
      }
    }
  };
  
  const handleSpeechResult = (text: string) => {
    setVoiceInput(text);
    const syntheticEvent = {
      target: { value: text }
    } as React.ChangeEvent<HTMLTextAreaElement>;
    handleInputChange(syntheticEvent);
  };

  const handleDragEnter = (e: DragEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading && onImageUpload) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: DragEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isLoading || !onImageUpload) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        try {
          const { processImage } = await import('../lib/image-processing');
          const processed = await processImage(file);
          onImageUpload(processed);
        } catch (err) {
          console.error('Failed to process dropped image:', err);
        }
      }
    }
  };
  
  return (
    <div className="space-y-2">
      <VoiceControls
        onSpeechResult={handleSpeechResult}
        autoSpeak={false}
      />
      <form 
        onSubmit={handleSubmit} 
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`flex gap-3 sm:gap-4 items-start ${isDragging ? 'opacity-75' : ''}`}
      >
        {showImageUpload && onImageUpload && (
          <div className="relative flex-shrink-0">
            <ImageUploadButton 
              onImageProcessed={onImageUpload}
              disabled={isLoading}
            />
          </div>
        )}
        <div className="flex-1 relative">
        <textarea
          value={input || voiceInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={isDragging && onImageUpload ? "Drop image here..." : placeholder}
          disabled={isLoading}
          className={`w-full resize-none rounded-xl border-2 p-4 pr-12 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors ${
            isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
          }`}
          style={{
            height: '48px',
            maxHeight: '120px',
            lineHeight: '1.25',
          }}
          onInput={(e) => {
            // Auto-resize textarea based on content
            const target = e.target as HTMLTextAreaElement;
            target.style.height = '48px';
            const scrollHeight = target.scrollHeight;
            target.style.height = Math.min(scrollHeight, 120) + 'px';
          }}
        />
        
        {/* Character count for long inputs */}
        {input.length > 500 && (
          <div className="absolute bottom-1 right-12 text-xs text-gray-400">
            {input.length}/1000
          </div>
        )}
      </div>
      
      <button
        type="submit"
        disabled={!input.trim() || isLoading}
        className="flex-shrink-0 bg-blue-500 text-white p-4 rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-500 transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
        title={isLoading ? "Sending..." : "Send message (Enter)"}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Send className="w-5 h-5" />
        )}
      </button>
    </form>
    </div>
  );
}

// Quick problem suggestions component (for future enhancement)
export function ProblemSuggestions({ onSelectProblem }: { onSelectProblem: (problem: string) => void }) {
  const suggestions = [
    "2x + 5 = 13",
    "3(x - 4) = 15", 
    "Find the area of a rectangle with length 8cm and width 5cm",
    "3/4 + 1/2",
    "Sarah has 3 times as many apples as John. Together they have 24. How many does John have?"
  ];

  return (
    <div className="mb-4">
      <p className="text-sm text-gray-600 mb-2">Try one of these problems:</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((problem, index) => (
          <button
            key={index}
            onClick={() => onSelectProblem(problem)}
            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
          >
            {problem}
          </button>
        ))}
      </div>
    </div>
  );
}
