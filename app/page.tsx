'use client';

import { useState, useEffect } from 'react';
import { ChatInterface } from './components/chat-interface';
import { ErrorBoundary } from './components/error-boundary';
import { IntroScreen } from './components/intro-screen';
import { shouldShowIntro, markIntroAsShown } from './lib/intro-screen';

export default function Home() {
  const [showIntro, setShowIntro] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // Necessary for hydration safety - must check localStorage after mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setShowIntro(shouldShowIntro());
  }, []);
  
  const handleGetStarted = () => {
    markIntroAsShown();
    setShowIntro(false);
  };
  
  const handleSkipIntro = () => {
    markIntroAsShown();
    setShowIntro(false);
  };
  
  // Don't render intro screen until after hydration to avoid mismatch
  if (!mounted) {
    return (
      <ErrorBoundary>
        <ChatInterface />
      </ErrorBoundary>
    );
  }
  
  return (
    <>
      {showIntro && (
        <IntroScreen
          onGetStarted={handleGetStarted}
          onSkip={handleSkipIntro}
        />
      )}
      <ErrorBoundary>
        <ChatInterface />
      </ErrorBoundary>
    </>
  );
}
