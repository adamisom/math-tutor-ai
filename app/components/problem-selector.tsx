'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

export interface Problem {
  id: string;
  problem: string;
}

interface ProblemSelectorProps {
  problems: Problem[];
  onSelect: (problem: Problem) => void;
  onCancel?: () => void;
}

export function ProblemSelector({ problems, onSelect, onCancel }: ProblemSelectorProps) {
  return (
    <div className="mb-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-blue-800 font-medium mb-2">
          I found {problems.length} problem{problems.length > 1 ? 's' : ''} in this image. Which would you like to work on?
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {problems.map((problem, index) => (
          <button
            key={problem.id}
            onClick={() => onSelect(problem)}
            className="text-left p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Problem {index + 1}
                </p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">
                  {problem.problem}
                </p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </div>
          </button>
        ))}
      </div>
      
      {onCancel && (
        <div className="mt-4 text-center">
          <button
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Confirmation dialog for uncertain extractions
 */
interface ExtractionConfirmationProps {
  extractedText: string;
  onConfirm: (text: string) => void;
  onCancel: () => void;
}

export function ExtractionConfirmation({ 
  extractedText, 
  onConfirm, 
  onCancel 
}: ExtractionConfirmationProps) {
  const [editedText, setEditedText] = useState(extractedText);

  return (
    <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <p className="text-yellow-800 font-medium mb-2">
        I think this is the problem, but please double-check:
      </p>
      <textarea
        value={editedText}
        onChange={(e) => setEditedText(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-lg mb-3 text-sm font-mono"
        rows={4}
        placeholder="Edit the problem text if needed..."
      />
      <div className="flex gap-2">
        <button
          onClick={() => onConfirm(editedText)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
        >
          Confirm & Start
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

