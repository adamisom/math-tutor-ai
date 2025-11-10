'use client';

import { useEffect, useState } from 'react';
import { Sparkles, TrendingUp } from 'lucide-react';

interface XPAnimationProps {
  amount: number;
  reason: 'attempt' | 'solve' | 'bonus';
  onComplete?: () => void;
}

export function XPAnimation({ amount, reason, onComplete }: XPAnimationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [scale] = useState(1);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onComplete?.(), 300);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  if (!isVisible) return null;
  
  const isSolve = reason === 'solve';
  
  return (
    <div
      className={`fixed top-20 right-4 z-50 pointer-events-none transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        transform: `scale(${scale})`,
        transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
      }}
    >
      <div
        className={`bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg shadow-2xl p-4 flex items-center gap-3 ${
          isSolve ? 'px-6 py-4' : 'px-4 py-2'
        }`}
      >
        {isSolve && <Sparkles className="w-6 h-6 text-white animate-pulse" />}
        {!isSolve && <TrendingUp className="w-5 h-5 text-white" />}
        <div>
          <div className="text-white font-bold text-lg">
            +{amount} XP
          </div>
          {isSolve && (
            <div className="text-white text-xs opacity-90">
              Problem Solved! 🎉
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function useXPAnimation() {
  const [animations, setAnimations] = useState<Array<{
    id: string;
    amount: number;
    reason: 'attempt' | 'solve' | 'bonus';
  }>>([]);
  
  const showXP = (amount: number, reason: 'attempt' | 'solve' | 'bonus') => {
    const id = `xp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setAnimations(prev => [...prev, { id, amount, reason }]);
  };
  
  const removeAnimation = (id: string) => {
    setAnimations(prev => prev.filter(a => a.id !== id));
  };
  
  return { animations, showXP, removeAnimation };
}

