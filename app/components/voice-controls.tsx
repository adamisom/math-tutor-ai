'use client';

import { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { ttsService } from '../lib/tts';
import { sttService } from '../lib/stt';

interface VoiceControlsProps {
  onSpeechResult?: (text: string) => void;
  assistantMessage?: string;
}

export function VoiceControls({
  onSpeechResult,
  assistantMessage,
}: VoiceControlsProps) {
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [sttEnabled, setSttEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [ttsAvailable, setTtsAvailable] = useState(false);
  const [sttAvailable, setSttAvailable] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [lastSpokenMessage, setLastSpokenMessage] = useState<string>('');
  const [showHelp, setShowHelp] = useState(true);
  
  useEffect(() => {
    // Load client-only data after mount to avoid hydration mismatch
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setTtsAvailable(ttsService.isAvailable());
    setSttAvailable(sttService.isAvailable());
    
    // Load settings from localStorage
    const ttsStored = localStorage.getItem('math-tutor-tts-settings');
    if (ttsStored) {
      try {
        const settings = JSON.parse(ttsStored);
        if (settings.enabled) {
          ttsService.enable();
          setTtsEnabled(true);
        }
      } catch {
        // Ignore parse errors
      }
    }
    
    const sttStored = localStorage.getItem('math-tutor-stt-settings');
    if (sttStored) {
      try {
        const settings = JSON.parse(sttStored);
        if (settings.enabled) {
          sttService.enable();
          setSttEnabled(true);
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, []);
  
  useEffect(() => {
    // Speak assistant messages automatically when TTS is enabled
    // Only speak if message is complete (not empty, not the same as last spoken)
    if (ttsEnabled && assistantMessage && assistantMessage.trim() && assistantMessage !== lastSpokenMessage) {
      // Small delay to ensure the message is fully rendered and streaming is complete
      const timeoutId = setTimeout(() => {
        ttsService.speak(assistantMessage);
        setLastSpokenMessage(assistantMessage);
      }, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [assistantMessage, ttsEnabled, lastSpokenMessage]);
  
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
        // Only log non-permission errors to console
        // Permission errors are handled gracefully by the service
        if (error !== 'Permission denied. Please allow microphone access and try again.') {
          console.warn('Speech recognition error:', error);
        }
        setIsListening(false);
      }
    );
  };
  
  const stopListening = () => {
    sttService.stop();
    setIsListening(false);
  };
  
  // Don't render until after mount to avoid hydration mismatch
  if (!mounted) {
    return null;
  }
  
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
          title={ttsEnabled ? 'Disable text-to-speech (AI responses will stop being read aloud)' : 'Enable text-to-speech (AI responses will be read aloud automatically)'}
        >
          {ttsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      )}
      
      {sttAvailable && (
        <>
          <button
            onClick={() => {
              if (!sttEnabled) {
                // Enable STT and start listening in one action
                toggleSTT();
                // Use setTimeout to ensure STT is enabled before starting
                setTimeout(() => {
                  startListening();
                }, 0);
              } else if (isListening) {
                stopListening();
              } else {
                startListening();
              }
            }}
            className={`p-2 rounded-lg transition-colors ${
              isListening
                ? 'bg-red-500 text-white hover:bg-red-600'
                : sttEnabled
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
            title={
              isListening
                ? 'Stop listening (click to stop voice input)'
                : sttEnabled
                ? 'Start voice input (click to speak your math problem)'
                : 'Click to enable speech-to-text and start listening (browser will ask for microphone permission)'
            }
          >
            {isListening ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>
          {sttEnabled && (
            <button
              onClick={toggleSTT}
              className="p-1.5 rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
              title="Disable speech-to-text"
            >
              <MicOff className="w-4 h-4" />
            </button>
          )}
        </>
      )}
      
      {(ttsAvailable || sttAvailable) && (
        <div className="flex items-center gap-1 ml-1">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="text-gray-500 hover:text-gray-700 transition-colors p-0.5"
            title={showHelp ? 'Hide voice help' : 'Show voice help'}
          >
            💡
          </button>
          {showHelp && (
            <>
              <button
                onClick={() => setShowHelp(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors text-xs p-0.5"
                title="Hide voice help"
              >
                ×
              </button>
              <p className="text-xs text-gray-500">
                {ttsAvailable && sttAvailable && (
                  <>
                    <span className="font-medium">Voice Help:</span> Click <span className="font-medium">🔊</span> to hear AI responses aloud. Click <span className="font-medium">🎤</span> to speak your problem (allow mic access when prompted).
                  </>
                )}
                {ttsAvailable && !sttAvailable && (
                  <>
                    <span className="font-medium">Voice Help:</span> Click <span className="font-medium">🔊</span> to hear AI responses read aloud automatically.
                  </>
                )}
                {!ttsAvailable && sttAvailable && (
                  <>
                    <span className="font-medium">Voice Help:</span> Click <span className="font-medium">🎤</span> to speak your math problem (allow microphone access when prompted).
                  </>
                )}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

