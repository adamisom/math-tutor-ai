'use client';

import { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { ttsService } from '../lib/tts';
import { sttService } from '../lib/stt';

interface VoiceControlsProps {
  onSpeechResult?: (text: string) => void;
  autoSpeak?: boolean;
  assistantMessage?: string;
}

export function VoiceControls({
  onSpeechResult,
  autoSpeak = false,
  assistantMessage,
}: VoiceControlsProps) {
  const [ttsEnabled, setTtsEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    const ttsStored = localStorage.getItem('math-tutor-tts-settings');
    if (ttsStored) {
      try {
        const settings = JSON.parse(ttsStored);
        if (settings.enabled) {
          ttsService.enable();
          return true;
        }
      } catch {
        // Ignore parse errors
      }
    }
    return false;
  });
  const [sttEnabled, setSttEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    const sttStored = localStorage.getItem('math-tutor-stt-settings');
    if (sttStored) {
      try {
        const settings = JSON.parse(sttStored);
        if (settings.enabled) {
          sttService.enable();
          return true;
        }
      } catch {
        // Ignore parse errors
      }
    }
    return false;
  });
  const [isListening, setIsListening] = useState(false);
  const [ttsAvailable] = useState(() => ttsService.isAvailable());
  const [sttAvailable] = useState(() => sttService.isAvailable());
  
  useEffect(() => {
    if (autoSpeak && ttsEnabled && assistantMessage) {
      ttsService.speak(assistantMessage);
    }
  }, [assistantMessage, autoSpeak, ttsEnabled]);
  
  const toggleTTS = () => {
    if (ttsEnabled) {
      ttsService.disable();
      setTtsEnabled(false);
    } else {
      ttsService.enable();
      setTtsEnabled(true);
    }
  };
  
  const toggleSTT = () => {
    if (sttEnabled) {
      sttService.disable();
      setSttEnabled(false);
    } else {
      sttService.enable();
      setSttEnabled(true);
    }
  };
  
  const startListening = () => {
    if (!sttEnabled || isListening) return;
    
    setIsListening(true);
    sttService.start(
      (text) => {
        onSpeechResult?.(text);
        setIsListening(false);
      },
      (error) => {
        console.error('Speech recognition error:', error);
        setIsListening(false);
      }
    );
  };
  
  const stopListening = () => {
    sttService.stop();
    setIsListening(false);
  };
  
  if (!ttsAvailable && !sttAvailable) {
    return null;
  }
  
  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
      {ttsAvailable && (
        <button
          onClick={toggleTTS}
          className={`p-2 rounded-lg transition-colors ${
            ttsEnabled
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
          title={ttsEnabled ? 'Disable text-to-speech' : 'Enable text-to-speech'}
        >
          {ttsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      )}
      
      {sttAvailable && (
        <>
          <button
            onClick={toggleSTT}
            className={`p-2 rounded-lg transition-colors ${
              sttEnabled
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
            title={sttEnabled ? 'Disable speech-to-text' : 'Enable speech-to-text'}
          >
            {sttEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
          
          {sttEnabled && (
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={!sttEnabled}
              className={`p-2 rounded-lg transition-colors ${
                isListening
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              } disabled:opacity-50`}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}

