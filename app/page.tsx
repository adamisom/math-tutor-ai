'use client';

import { useState } from 'react';
import { ChatInterface } from './components/chat-interface';
import { ErrorBoundary } from './components/error-boundary';
import { IntroScreen } from './components/intro-screen';
import { shouldShowIntro, markIntroAsShown } from './lib/intro-screen';

export default function Home() {
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window === 'undefined') return false;
    return shouldShowIntro();
  });
  
  const handleGetStarted = () => {
    markIntroAsShown();
    setShowIntro(false);
  };
  
  const handleSkipIntro = () => {
    markIntroAsShown();
    setShowIntro(false);
  };
  
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
