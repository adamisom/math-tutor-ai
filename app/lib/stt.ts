/**
 * Speech-to-Text Service
 * 
 * Handles voice input using browser SpeechRecognition API
 */

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
      const SpeechRecognition = 
        (window as any).SpeechRecognition || 
        (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
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
    
    this.recognition.onerror = (event) => {
      const error = (event as any).error;
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
      } catch (error) {
        // Ignore errors when stopping
      }
      this.isListening = false;
    }
  }
  
  private loadSettings() {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('math-tutor-stt-settings');
      if (stored) {
        const settings = JSON.parse(stored);
        this.isEnabled = settings.enabled || false;
      }
    } catch (error) {
      console.warn('Failed to load STT settings:', error);
    }
  }
  
  private saveSettings() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('math-tutor-stt-settings', JSON.stringify({
        enabled: this.isEnabled,
      }));
    } catch (error) {
      console.warn('Failed to save STT settings:', error);
    }
  }
}

export const sttService = new STTService();

