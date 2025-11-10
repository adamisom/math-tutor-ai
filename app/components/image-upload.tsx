'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, X, ImagePlus } from 'lucide-react';
import { processImage, ProcessedImage } from '../lib/image-processing';

// Re-export ProcessedImage for convenience
export type { ProcessedImage } from '../lib/image-processing';

export interface ImageUploadProps {
  onImageProcessed: (processedImage: ProcessedImage) => void;
  disabled?: boolean;
}

export function ImageUpload({ onImageProcessed, disabled = false }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (disabled || isProcessing) return;
    
    setError(null);
    setIsProcessing(true);

    try {
      const processed = await processImage(file);
      
      // Create preview URL
      const previewUrl = `data:${processed.mimeType};base64,${processed.base64}`;
      setPreview(previewUrl);
      
      // Call callback with processed image
      onImageProcessed(processed);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process image';
      setError(errorMessage);
      setPreview(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isProcessing) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isProcessing) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    if (!disabled && !isProcessing) {
      fileInputRef.current?.click();
    }
  };

  if (preview) {
    return (
      <div className="relative inline-block">
        <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <button
            onClick={handleRemove}
            disabled={disabled || isProcessing}
            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-4 transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
          ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
        `}
        onClick={handleButtonClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          capture="environment"
          onChange={handleFileInput}
          disabled={disabled || isProcessing}
          className="hidden"
        />
        
        <div className="flex flex-col items-center justify-center text-center">
          {isProcessing ? (
            <>
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-sm text-gray-600">Processing image...</p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-1">
                Drag and drop an image, or click to upload
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPEG, or WebP (max 10MB)
              </p>
            </>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}
    </div>
  );
}

/**
 * Compact image upload button for MessageInput
 */
export function ImageUploadButton({ 
  onImageProcessed, 
  disabled = false 
}: ImageUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (disabled || isProcessing) return;
    
    setError(null);
    setIsProcessing(true);

    try {
      const processed = await processImage(file);
      onImageProcessed(processed);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process image';
      setError(errorMessage);
      // Show error briefly
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    if (!disabled && !isProcessing) {
      fileInputRef.current?.click();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={disabled || isProcessing}
        className="flex-shrink-0 flex items-center gap-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 rounded-xl border-2 border-blue-200 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md font-medium self-start"
        title="Upload image"
        style={{ minHeight: '48px' }}
      >
        {isProcessing ? (
          <>
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Processing...</span>
          </>
        ) : (
          <>
            <ImagePlus className="w-5 h-5" />
            <span className="text-sm">Upload image here</span>
          </>
        )}
      </button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        capture="environment"
        onChange={handleFileInput}
        disabled={disabled || isProcessing}
        className="hidden"
      />
      
      {error && (
        <div className="absolute bottom-full left-0 mb-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2 whitespace-nowrap z-10">
          {error}
        </div>
      )}
    </>
  );
}

