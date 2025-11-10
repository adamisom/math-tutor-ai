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
    
    // Remove markdown formatting first (before processing math symbols)
    clean = clean.replace(/\*\*([^*]+)\*\*/g, '$1');
    clean = clean.replace(/\*([^*]+)\*/g, '$1');
    
    // Letter-to-phonetic mapping (shared for coefficients and standalone variables)
    const letterWords: { [key: string]: string } = {
      'x': 'ex', 'y': 'why', 'z': 'zee', 'a': 'ay', 'b': 'bee',
      'c': 'see', 'd': 'dee', 'e': 'ee', 'f': 'ef', 'g': 'jee',
      'h': 'aitch', 'i': 'eye', 'j': 'jay', 'k': 'kay', 'l': 'el',
      'm': 'em', 'n': 'en', 'o': 'oh', 'p': 'pee', 'q': 'cue',
      'r': 'ar', 's': 'ess', 't': 'tee', 'u': 'you', 'v': 'vee',
      'w': 'double you'
    };
    
    // Handle variable expressions with coefficients (e.g., "2x" -> "two ex", "3y" -> "three why")
    // Match patterns like "2x", "3y", "5a", "-2x", etc.
    clean = clean.replace(/(-?\d+)([a-z])/gi, (match, num, letter) => {
      const numberWords: { [key: string]: string } = {
        '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
        '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine',
        '10': 'ten', '11': 'eleven', '12': 'twelve', '13': 'thirteen',
        '14': 'fourteen', '15': 'fifteen', '16': 'sixteen', '17': 'seventeen',
        '18': 'eighteen', '19': 'nineteen', '20': 'twenty'
      };
      
      const numStr = num.replace('-', '');
      let numWord = '';
      if (numStr in numberWords) {
        numWord = numberWords[numStr];
      } else if (numStr.length === 2) {
        // Handle two-digit numbers
        const tens = numStr[0] + '0';
        const ones = numStr[1];
        const tensWords: { [key: string]: string } = {
          '2': 'twenty', '3': 'thirty', '4': 'forty', '5': 'fifty',
          '6': 'sixty', '7': 'seventy', '8': 'eighty', '9': 'ninety'
        };
        numWord = tensWords[tens[0]] + (ones !== '0' ? ' ' + numberWords[ones] : '');
      } else {
        // Fallback: spell out digit by digit
        numWord = numStr.split('').map(d => numberWords[d] || d).join(' ');
      }
      
      if (num.startsWith('-')) {
        numWord = 'negative ' + numWord;
      }
      
      const letterWord = letterWords[letter.toLowerCase()] || letter;
      return `${numWord} ${letterWord}`;
    });
    
    // Handle standalone variables in math contexts (e.g., "x" -> "ex", "y" -> "why")
    // Only match single letters surrounded by math operators or at word boundaries
    clean = clean.replace(/(?:^|[\s\+\-\*\/=\(\)])([a-z])(?=[\s\+\-\*\/=\)]|$)/gi, (match, letter) => {
      return match.replace(letter, letterWords[letter.toLowerCase()] || letter);
    });
    
    // Handle common math expressions
    clean = clean.replace(/x\^2/g, 'x squared');
    clean = clean.replace(/x\^3/g, 'x cubed');
    clean = clean.replace(/x\^(\d+)/g, 'x to the power of $1');
    
    // Handle operators (but be careful with * since we already removed markdown)
    clean = clean.replace(/=/g, ' equals ');
    clean = clean.replace(/\+/g, ' plus ');
    // Handle minus operator (but not negative numbers like "-5")
    clean = clean.replace(/([^\d])\s*-\s*([^\d])/g, '$1 minus $2');
    clean = clean.replace(/\s*\*\s*/g, ' times '); // Only standalone * symbols
    clean = clean.replace(/\//g, ' divided by ');
    clean = clean.replace(/\^/g, ' to the power of ');
    
    // Clean up extra spaces
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

