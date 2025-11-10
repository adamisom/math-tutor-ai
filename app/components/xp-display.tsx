'use client';

import { Trophy } from 'lucide-react';
import { getTotalXP, calculateLevel } from '../lib/xp-system';

export function XPDisplay() {
  const totalXP = getTotalXP();
  const level = calculateLevel(totalXP);
  const xpForNextLevel = level * 100;
  const xpProgress = totalXP % 100;
  const progressPercent = (xpProgress / 100) * 100;
  
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
      <Trophy className="w-5 h-5 text-yellow-600" />
      <div className="flex-1">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="font-semibold text-gray-900">
            Level {level}
          </span>
          <span className="text-gray-600">
            {totalXP} XP
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {xpForNextLevel - totalXP} XP to Level {level + 1}
        </div>
      </div>
    </div>
  );
}

