/**
 * Speech-to-Text Service
 * 
 * Handles voice input using browser SpeechRecognition API
 */

import { getStorageItem, setStorageItem } from './local-storage';

export interface STTOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
}

class STTService {
  private recognition: SpeechRecognition | null = null;
  private isEnabled: boolean = false;
  private isListening: boolean = false;
  
  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionClass = 
        (window as Window & { SpeechRecognition?: { new(): SpeechRecognition } }).SpeechRecognition || 
        (window as Window & { webkitSpeechRecognition?: { new(): SpeechRecognition } }).webkitSpeechRecognition;
      
      if (SpeechRecognitionClass) {
        this.recognition = new SpeechRecognitionClass();
        this.setupRecognition();
        this.loadSettings();
      }
    }
  }
  
  isAvailable(): boolean {
    return this.recognition !== null;
  }
  
  enable() {
    this.isEnabled = true;
    this.saveSettings();
  }
  
  disable() {
    this.isEnabled = false;
    this.stop();
    this.saveSettings();
  }
  
  private setupRecognition() {
    if (!this.recognition) return;
    
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
  }
  
  start(
    onResult: (text: string) => void,
    onError?: (error: string) => void
  ): void {
    if (!this.recognition || !this.isEnabled || this.isListening) return;
    
    this.isListening = true;
    
    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      this.isListening = false;
    };
    
    this.recognition.onerror = (event: Event) => {
      const errorEvent = event as SpeechRecognitionErrorEvent;
      const error = errorEvent.error;
      
      // Handle permission errors gracefully (not-allowed is expected when user denies access)
      if (error === 'not-allowed') {
        // Silently handle permission denial - user can try again after granting permission
        this.isListening = false;
        onError?.('Permission denied. Please allow microphone access and try again.');
        return;
      }
      
      // For other errors, pass through to handler
      onError?.(error);
      this.isListening = false;
    };
    
    this.recognition.onend = () => {
      this.isListening = false;
    };
    
    try {
      this.recognition.start();
    } catch (error) {
      console.warn('Failed to start speech recognition:', error);
      this.isListening = false;
    }
  }
  
  stop(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore errors when stopping
      }
      this.isListening = false;
    }
  }
  
  private loadSettings() {
    if (typeof window === 'undefined') return;
    
    const settings = getStorageItem<{ enabled?: boolean }>(
      'math-tutor-stt-settings',
      {}
    );
    
    this.isEnabled = settings.enabled || false;
  }
  
  private saveSettings() {
    setStorageItem('math-tutor-stt-settings', {
      enabled: this.isEnabled,
    });
  }
}

export const sttService = new STTService();

