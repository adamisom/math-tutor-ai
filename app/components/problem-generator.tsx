'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface ProblemGeneratorProps {
  onProblemGenerated: (problem: string) => void;
  onClose?: () => void;
}

export function ProblemGenerator({ onProblemGenerated, onClose }: ProblemGeneratorProps) {
  const [type, setType] = useState<string>('Algebra');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/chat/generate-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, difficulty }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate problem');
      }
      
      const data = await response.json();
      onProblemGenerated(data.problem);
      onClose?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate problem');
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="bg-white border rounded-lg shadow-lg p-6 max-w-md">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-bold">Generate AI Problem</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Math Field
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            disabled={isGenerating}
          >
            <option value="Algebra">Algebra</option>
            <option value="Geometry">Geometry</option>
            <option value="Word Problem">Word Problem</option>
            <option value="Fractions">Fractions</option>
            <option value="Calculus">Calculus</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Difficulty
          </label>
          <div className="flex gap-2">
            {(['beginner', 'intermediate', 'advanced'] as const).map(level => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                disabled={isGenerating}
                className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                  difficulty === level
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <div className="flex gap-3">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Problem
              </>
            )}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

