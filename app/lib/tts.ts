/**
 * Text-to-Speech Service
 * 
 * Handles speaking assistant responses using browser SpeechSynthesis API
 */

import { getStorageItem, setStorageItem } from './local-storage';

export interface TTSOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice;
}

class TTSService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isEnabled: boolean = false;
  private options: TTSOptions = {
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
  };
  
  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadSettings();
    }
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
  
  isAvailable(): boolean {
    return this.synth !== null;
  }
  
  speak(text: string, options?: Partial<TTSOptions>) {
    if (!this.synth || !this.isEnabled) return;
    
    this.stop();
    
    const cleanText = this.cleanTextForSpeech(text);
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    const finalOptions = { ...this.options, ...options };
    utterance.rate = finalOptions.rate || 1.0;
    utterance.pitch = finalOptions.pitch || 1.0;
    utterance.volume = finalOptions.volume || 1.0;
    
    if (finalOptions.voice) {
      utterance.voice = finalOptions.voice;
    }
    
    this.currentUtterance = utterance;
    this.synth.speak(utterance);
    
    return utterance;
  }
  
  stop() {
    if (this.synth && this.synth.speaking) {
      this.synth.cancel();
    }
    this.currentUtterance = null;
  }
  
  pause() {
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
  }
  
  resume() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }
  
  private cleanTextForSpeech(text: string): string {
    let clean = text.replace(/\$[^$]+\$/g, '');
    clean = clean.replace(/\$\$[^$]+\$\$/g, '');
    
    clean = clean.replace(/=/g, ' equals ');
    clean = clean.replace(/\+/g, ' plus ');
    clean = clean.replace(/-/g, ' minus ');
    clean = clean.replace(/\*/g, ' times ');
    clean = clean.replace(/\//g, ' divided by ');
    clean = clean.replace(/\^/g, ' to the power of ');
    clean = clean.replace(/x\^2/g, 'x squared');
    clean = clean.replace(/x\^3/g, 'x cubed');
    
    clean = clean.replace(/\*\*([^*]+)\*\*/g, '$1');
    clean = clean.replace(/\*([^*]+)\*/g, '$1');
    
    clean = clean.replace(/\s+/g, ' ').trim();
    
    return clean;
  }
  
  getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }
  
  private loadSettings() {
    if (typeof window === 'undefined') return;
    
    const settings = getStorageItem<{ enabled?: boolean; options?: Partial<TTSOptions> }>(
      'math-tutor-tts-settings',
      {}
    );
    
    this.isEnabled = settings.enabled || false;
    if (settings.options) {
      this.options = { ...this.options, ...settings.options };
    }
  }
  
  private saveSettings() {
    setStorageItem('math-tutor-tts-settings', {
      enabled: this.isEnabled,
      options: this.options,
    });
  }
}

export const ttsService = new TTSService();

