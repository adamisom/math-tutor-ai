'use client';

import { useState, useEffect } from 'react';
import { ChatInterface } from '../components/chat-interface';
import { CheckCircle, XCircle, AlertTriangle, RotateCcw } from 'lucide-react';

interface TestProblem {
  id: string;
  type: string;
  problem: string;
  expectedPatterns: string[];
  redFlags: string[];
  notes: string;
}

const TEST_PROBLEMS: TestProblem[] = [
  {
    id: 'algebra-simple',
    type: 'Algebra (Simple)',
    problem: '2x + 5 = 13',
    expectedPatterns: [
      'What are we trying to find?',
      'What operation',
      'How do we undo',
      'subtract 5'
    ],
    redFlags: [
      'x = 4',
      'x equals 4',
      'The answer is',
      'Therefore x = 4'
    ],
    notes: 'Basic linear equation - should guide through inverse operations'
  },
  {
    id: 'algebra-distributive',
    type: 'Algebra (Distributive)',
    problem: '3(x - 4) = 15',
    expectedPatterns: [
      'distributive',
      'parentheses',
      'What should we do first',
      'expand'
    ],
    redFlags: [
      'x = 9',
      'Step 1:',
      'The solution'
    ],
    notes: 'Tests understanding of order of operations and distribution'
  },
  {
    id: 'word-problem',
    type: 'Word Problem',
    problem: 'Sarah has 3 times as many apples as John. Together they have 24 apples. How many does John have?',
    expectedPatterns: [
      'What do we know',
      'variable',
      'let x represent',
      'equation'
    ],
    redFlags: [
      'John has 6',
      '6 apples',
      'The answer is 6'
    ],
    notes: 'Tests ability to guide variable assignment and equation setup'
  },
  {
    id: 'geometry-area',
    type: 'Geometry',
    problem: 'Find the area of a rectangle with length 8cm and width 5cm',
    expectedPatterns: [
      'formula',
      'length times width',
      'What formula',
      'area formula'
    ],
    redFlags: [
      '40 cm²',
      '8 × 5 = 40',
      'The area is 40'
    ],
    notes: 'Tests formula identification and application guidance'
  },
  {
    id: 'fractions',
    type: 'Fractions',
    problem: '3/4 + 1/2',
    expectedPatterns: [
      'common denominator',
      'same denominator',
      'What do we need',
      'equivalent fractions'
    ],
    redFlags: [
      '5/4',
      '1¼',
      'equals 5/4'
    ],
    notes: 'Tests understanding of fraction addition process'
  }
];

const STORAGE_KEY = 'math-tutor-test-results';

export default function TestPage() {
  const [selectedProblem, setSelectedProblem] = useState<TestProblem | null>(null);
  const [testResults, setTestResults] = useState<Record<string, 'pass' | 'fail' | 'pending'>>({});
  const [savingResult, setSavingResult] = useState<string | null>(null);

  // Load test results from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setTestResults(parsed);
      }
    } catch (error) {
      console.warn('Failed to load test results from localStorage:', error);
    }
  }, []);

  // Save test results to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(testResults));
    } catch (error) {
      console.warn('Failed to save test results to localStorage:', error);
    }
  }, [testResults]);

  const handleProblemSelect = (problem: TestProblem) => {
    setSelectedProblem(problem);
  };

  const handleTestResult = (problemId: string, result: 'pass' | 'fail') => {
    setTestResults(prev => ({
      ...prev,
      [problemId]: result
    }));
    setSavingResult(result);
    // Automatically go back to test list after 1 second (brief delay for visual feedback)
    setTimeout(() => {
      setSelectedProblem(null);
      setSavingResult(null);
    }, 1000);
  };

  const resetTest = () => {
    setSelectedProblem(null);
    setTestResults({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear test results from localStorage:', error);
    }
  };

  if (selectedProblem) {
    return (
      <div className="h-screen flex">
        {/* Test Panel */}
        <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
          <div className="mb-4">
            <button
              onClick={() => setSelectedProblem(null)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to Test List
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Testing: {selectedProblem.type}
            </h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-900 font-medium">Problem:</p>
              <p className="text-blue-800">{selectedProblem.problem}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-green-700 mb-2">✅ Look for these patterns:</h3>
              <ul className="space-y-1">
                {selectedProblem.expectedPatterns.map((pattern, index) => (
                  <li key={index} className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                    {pattern}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-red-700 mb-2">❌ Red flags (should NOT appear):</h3>
              <ul className="space-y-1">
                {selectedProblem.redFlags.map((flag, index) => (
                  <li key={index} className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
                    {flag}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-1">Notes:</h4>
              <p className="text-sm text-gray-600">{selectedProblem.notes}</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">Test Result:</h3>
              {savingResult ? (
                <div className={`flex-1 py-2 rounded-lg text-center text-white font-medium ${
                  savingResult === 'pass' ? 'bg-green-600' : 'bg-red-600'
                }`}>
                  {savingResult === 'pass' ? '✅ Saved as Pass!' : '❌ Saved as Fail!'}
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTestResult(selectedProblem.id, 'pass')}
                    className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors font-medium"
                  >
                    ✅ Pass
                  </button>
                  <button
                    onClick={() => handleTestResult(selectedProblem.id, 'fail')}
                    className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors font-medium"
                  >
                    ❌ Fail
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1">
          <ChatInterface />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">AI Math Tutor - Testing Interface</h1>
            <button
              onClick={resetTest}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Tests
            </button>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-blue-900 mb-2">🧪 Socratic Dialogue Quality Testing</h2>
            <p className="text-blue-800 text-sm">
              This interface helps you systematically test the AI tutor's Socratic methodology. 
              Select a problem below to open the chat interface with testing guidelines.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">📋 Evaluation Checklist:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {[
                'Opens with clarifying questions (not direct solving)',
                'Asks "What do we know?" or "What are we finding?"',
                'Guides to method selection without giving method',
                'Validates each student step before proceeding',
                'Provides hints (not answers) when student stuck >2 turns',
                'Uses encouraging language consistently',
                'NEVER gives direct numerical answers',
                'Maintains Socratic method throughout'
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-4 h-4 border border-gray-300 rounded"></div>
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEST_PROBLEMS.map((problem) => {
            const result = testResults[problem.id];
            
            return (
              <div
                key={problem.id}
                className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
                  result === 'pass' 
                    ? 'border-green-200 bg-green-50' 
                    : result === 'fail'
                    ? 'border-red-200 bg-red-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => handleProblemSelect(problem)}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-900">{problem.type}</h3>
                  {result && (
                    <div className="flex-shrink-0">
                      {result === 'pass' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                
                <div className="bg-gray-50 rounded p-3 mb-3">
                  <p className="text-sm text-gray-700 font-mono">{problem.problem}</p>
                </div>
                
                <p className="text-xs text-gray-600 mb-3">{problem.notes}</p>
                
                <button className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">
                  Test This Problem
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold text-yellow-800">Testing Instructions:</h3>
          </div>
          <ul className="text-yellow-700 text-sm space-y-1">
            <li>1. Select a problem to open the testing interface</li>
            <li>2. Copy the problem text into the chat</li>
            <li>3. Evaluate the AI's response against the patterns shown</li>
            <li>4. Continue the conversation to test multi-turn behavior</li>
            <li>5. Mark the test as Pass or Fail based on Socratic methodology</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

