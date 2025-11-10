'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface LoginGreetingProps {
  name: string;
  onComplete: () => void;
}

export function LoginGreeting({ name, onComplete }: LoginGreetingProps) {
  const [isVisible, setIsVisible] = useState(true);
  const truncatedName = name.length > 12 ? name.substring(0, 12) : name;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onComplete(), 300);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
    >
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-2xl p-4 flex items-center gap-3">
        <Sparkles className="w-6 h-6 text-white animate-pulse" />
        <div>
          <div className="text-white font-bold text-lg">
            Hi {truncatedName}!
          </div>
        </div>
      </div>
    </div>
  );
}

