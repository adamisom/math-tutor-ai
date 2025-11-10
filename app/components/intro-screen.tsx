'use client';

import { useState, useEffect } from 'react';
import { Sparkles, BookOpen, Mic, TrendingUp, ArrowRight, X } from 'lucide-react';
import { getTotalXP } from '../lib/xp-system';
import { loadConversationHistory } from '../lib/conversation-history';

interface IntroScreenProps {
  onGetStarted: () => void;
  onSkip: () => void;
}

export function IntroScreen({ onGetStarted, onSkip }: IntroScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [animationStage, setAnimationStage] = useState<'entering' | 'visible' | 'exiting'>('entering');
  const [hasHistory, setHasHistory] = useState(false);
  const [totalXP, setTotalXP] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  
  useEffect(() => {
    // Load client-only data after mount to avoid hydration mismatch
    // This is necessary to prevent server/client HTML mismatch
    const history = loadConversationHistory();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasHistory(history.sessions.length > 0);
    setTotalXP(getTotalXP());
    setSessionCount(history.sessions.length);
    
    setTimeout(() => {
      setAnimationStage('visible');
    }, 100);
  }, []);
  
  const handleGetStarted = () => {
    setAnimationStage('exiting');
    setTimeout(() => {
      setIsVisible(false);
      onGetStarted();
    }, 500);
  };
  
  const handleSkip = () => {
    setAnimationStage('exiting');
    setTimeout(() => {
      setIsVisible(false);
      onSkip();
    }, 300);
  };
  
  if (!isVisible) return null;
  
  return (
    <div
      className={`fixed inset-0 z-50 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center transition-opacity duration-500 ${
        animationStage === 'entering' ? 'opacity-0' : 
        animationStage === 'exiting' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <FloatingMathSymbols />
      </div>
      
      <div className="relative z-10 max-w-4xl w-full px-6 py-8">
        <div
          className={`bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 md:p-12 transition-all duration-700 ${
            animationStage === 'entering' ? 'translate-y-8 opacity-0' : 
            animationStage === 'exiting' ? 'translate-y-8 opacity-0' : 'translate-y-0 opacity-100'
          }`}
        >
          {hasHistory && (
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Skip intro"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-lg animate-bounce">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Math Tutor
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Learn math through Socratic questioning. I&apos;ll guide you to discover solutions yourself.
            </p>
          </div>
          
          {hasHistory && totalXP > 0 && (
            <div className="flex justify-center gap-6 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalXP}</div>
                <div className="text-sm text-gray-600">Total XP</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{sessionCount}</div>
                <div className="text-sm text-gray-600">Problems Solved</div>
              </div>
            </div>
          )}
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <FeatureCard
              icon={<BookOpen className="w-6 h-6" />}
              title="Socratic Learning"
              description="I guide you through questions, never giving direct answers. Discover solutions yourself!"
              delay={200}
            />
            <FeatureCard
              icon={<Sparkles className="w-6 h-6" />}
              title="AI-Generated Problems"
              description="Get personalized problems across algebra, geometry, calculus, and more."
              delay={300}
            />
            <FeatureCard
              icon={<Mic className="w-6 h-6" />}
              title="Voice Interface"
              description="Speak your problems and hear responses. Perfect for hands-free learning."
              delay={400}
            />
            <FeatureCard
              icon={<TrendingUp className="w-6 h-6" />}
              title="Track Progress"
              description="Earn XP, level up, and see your improvement over time."
              delay={500}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
            >
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            {hasHistory && (
              <button
                onClick={handleSkip}
                className="px-8 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold text-lg hover:bg-gray-200 transition-colors"
              >
                Continue Learning
              </button>
            )}
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              💡 Tip: You can type problems, upload images, or use voice input to get started
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  
  return (
    <div
      className={`p-6 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-100 rounded-lg text-blue-600 flex-shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );
}

function FloatingMathSymbols() {
  const symbols = ['+', '−', '×', '÷', '=', 'x', 'y', 'π', '√'];
  
  return (
    <>
      {symbols.map((symbol, index) => (
        <div
          key={index}
          className="absolute text-6xl md:text-8xl text-blue-200/30 font-bold select-none pointer-events-none"
          style={{
            left: `${(index * 137.5) % 100}%`,
            top: `${(index * 73.7) % 100}%`,
            animation: `float ${5 + (index % 3)}s ease-in-out infinite`,
            animationDelay: `${index * 0.3}s`,
          }}
        >
          {symbol}
        </div>
      ))}
    </>
  );
}

