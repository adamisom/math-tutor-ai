'use client';

import { useState, useEffect } from 'react';
import { ChatInterface } from '../components/chat-interface';
import { CheckCircle, XCircle, AlertTriangle, RotateCcw, Copy, Check } from 'lucide-react';

interface TestProblem {
  id: string;
  type: string;
  problem: string;
  expectedPatterns: string[];
  redFlags: string[];
  notes: string;
}

const TEST_PROBLEMS: TestProblem[] = [
  // ===== ELEMENTARY / BEGINNER =====
  {
    id: 'algebra-simple',
    type: 'Algebra (Beginner)',
    problem: '2x + 5 = 13',
    expectedPatterns: [
      'What are we trying to find?',
      'What operation',
      'How do we undo',
      'subtract 5',
      'Tool verification'
    ],
    redFlags: [
      'x = 4',
      'x equals 4',
      'The answer is',
      'Therefore x = 4',
      'Validates wrong answer'
    ],
    notes: 'Basic linear equation - should verify using tools before validating'
  },
  {
    id: 'algebra-two-step',
    type: 'Algebra (Beginner)',
    problem: '5x - 7 = 18',
    expectedPatterns: [
      'undo',
      'add 7',
      'divide by 5',
      'Tool verification'
    ],
    redFlags: [
      'x = 5',
      'answer is 5',
      'Gives direct answer'
    ],
    notes: 'Tests multi-step equation solving with verification'
  },
  {
    id: 'fractions-basic',
    type: 'Fractions (Beginner)',
    problem: '3/4 + 1/2',
    expectedPatterns: [
      'common denominator',
      'same denominator',
      'What do we need',
      'equivalent fractions',
      'Tool verification'
    ],
    redFlags: [
      '5/4',
      '1¼',
      'equals 5/4',
      'Gives direct answer'
    ],
    notes: 'Tests understanding of fraction addition process'
  },
  {
    id: 'geometry-area-rectangle',
    type: 'Geometry (Beginner)',
    problem: 'Find the area of a rectangle with length 8cm and width 5cm',
    expectedPatterns: [
      'formula',
      'length times width',
      'What formula',
      'area formula',
      'Tool verification'
    ],
    redFlags: [
      '40 cm²',
      '8 × 5 = 40',
      'The area is 40',
      'Gives direct answer'
    ],
    notes: 'Tests formula identification and application guidance'
  },
  {
    id: 'word-problem-basic',
    type: 'Word Problem (Beginner)',
    problem: 'Sarah has 3 times as many apples as John. Together they have 24 apples. How many does John have?',
    expectedPatterns: [
      'What do we know',
      'variable',
      'let x represent',
      'equation',
      'Extract equation first'
    ],
    redFlags: [
      'John has 6',
      '6 apples',
      'The answer is 6',
      'Gives direct answer'
    ],
    notes: 'Tests ability to guide variable assignment and equation setup'
  },

  // ===== INTERMEDIATE =====
  {
    id: 'algebra-distributive',
    type: 'Algebra (Intermediate)',
    problem: '3(x - 4) = 15',
    expectedPatterns: [
      'distributive',
      'parentheses',
      'What should we do first',
      'expand',
      'Tool verification'
    ],
    redFlags: [
      'x = 9',
      'Step 1:',
      'The solution',
      'Validates without verification'
    ],
    notes: 'Tests understanding of order of operations and distribution'
  },
  {
    id: 'algebra-negative',
    type: 'Algebra (Intermediate)',
    problem: '-3x = 9',
    expectedPatterns: [
      'negative',
      'divide by -3',
      'What happens when',
      'Tool verification'
    ],
    redFlags: [
      'x = 3',
      'The answer is',
      'Validates wrong answer'
    ],
    notes: 'Tests handling of negative coefficients - common wrong answer: x = 3'
  },
  {
    id: 'algebra-negative-advanced',
    type: 'Algebra (Intermediate)',
    problem: '-3x + 7 = 22',
    expectedPatterns: [
      'negative',
      'subtract 7',
      'divide by -3',
      'sign change',
      'Tool verification'
    ],
    redFlags: [
      'x = -5',
      'answer is -5',
      'Gives direct answer'
    ],
    notes: 'Tests handling of negative coefficients with multiple steps'
  },
  {
    id: 'algebra-fractions',
    type: 'Algebra (Intermediate)',
    problem: 'x/2 = 5',
    expectedPatterns: [
      'multiply by 2',
      'What operation',
      'Tool verification'
    ],
    redFlags: [
      'x = 2.5',
      'x = 10',
      'The answer is',
      'Validates without checking'
    ],
    notes: 'Tests division by fraction handling - common wrong answer: x = 2.5'
  },
  {
    id: 'algebra-fractions-in-equation',
    type: 'Algebra (Intermediate)',
    problem: 'x/3 + 2 = 5',
    expectedPatterns: [
      'fraction',
      'multiply by 3',
      'denominator',
      'clear fraction',
      'Tool verification'
    ],
    redFlags: [
      'x = 9',
      'x equals 9',
      'Gives direct answer'
    ],
    notes: 'Tests handling of fractions within equations'
  },
  {
    id: 'algebra-variables-both-sides',
    type: 'Algebra (Intermediate)',
    problem: '2x + 3 = x + 10',
    expectedPatterns: [
      'both sides',
      'subtract x',
      'collect like terms',
      'Tool verification'
    ],
    redFlags: [
      'x = 7',
      'The answer is',
      'Gives direct answer'
    ],
    notes: 'Tests handling of variables on both sides - common mistake area'
  },
  {
    id: 'algebra-variables-both-sides-2',
    type: 'Algebra (Intermediate)',
    problem: '3x + 4 = 2x + 10',
    expectedPatterns: [
      'both sides',
      'subtract 2x',
      'collect like terms',
      'Tool verification'
    ],
    redFlags: [
      'x = 6',
      'solution is 6',
      'Gives direct answer'
    ],
    notes: 'Another variables-on-both-sides problem'
  },
  {
    id: 'algebra-quadratic-cancel',
    type: 'Algebra (Intermediate)',
    problem: 'x^2 - 4x = x^2 - 8',
    expectedPatterns: [
      'x^2',
      'cancel',
      'subtract',
      'simplify',
      'Tool verification'
    ],
    redFlags: [
      'x = 2',
      'answer is 2',
      'Gives direct answer'
    ],
    notes: 'Tests recognition that x^2 terms cancel to reveal linear equation'
  },
  {
    id: 'fractions-mixed-numbers',
    type: 'Fractions (Intermediate)',
    problem: '2 1/3 + 1 1/2',
    expectedPatterns: [
      'mixed number',
      'convert',
      'improper fraction',
      'common denominator',
      'Tool verification'
    ],
    redFlags: [
      '3 5/6',
      '23/6',
      'equals 3 5/6',
      'Gives direct answer'
    ],
    notes: 'Tests mixed number addition'
  },
  {
    id: 'fractions-division',
    type: 'Fractions (Intermediate)',
    problem: '3/4 ÷ 1/2',
    expectedPatterns: [
      'divide',
      'multiply by reciprocal',
      'flip',
      'invert',
      'Tool verification'
    ],
    redFlags: [
      '3/2',
      '1.5',
      'equals 3/2',
      'Gives direct answer'
    ],
    notes: 'Tests fraction division using reciprocal'
  },
  {
    id: 'fractions-multiplication',
    type: 'Fractions (Intermediate)',
    problem: '2/3 × 3/4',
    expectedPatterns: [
      'multiply',
      'numerator',
      'denominator',
      'simplify',
      'Tool verification'
    ],
    redFlags: [
      '1/2',
      '6/12',
      'equals 1/2',
      'Gives direct answer'
    ],
    notes: 'Tests fraction multiplication and simplification'
  },
  {
    id: 'geometry-triangle',
    type: 'Geometry (Intermediate)',
    problem: 'Find the area of a triangle with base 6cm and height 8cm',
    expectedPatterns: [
      'triangle',
      'base times height',
      'divide by 2',
      '1/2',
      'Tool verification'
    ],
    redFlags: [
      '24 cm²',
      '24',
      'The area is 24',
      'Gives direct answer'
    ],
    notes: 'Tests triangle area formula understanding'
  },
  {
    id: 'geometry-circle',
    type: 'Geometry (Intermediate)',
    problem: 'Find the area of a circle with radius 5cm',
    expectedPatterns: [
      'circle',
      'π',
      'pi',
      'r^2',
      'radius squared',
      'Tool verification'
    ],
    redFlags: [
      '25π',
      '78.54',
      'The area is',
      'Gives direct answer'
    ],
    notes: 'Tests circle area formula with π'
  },
  {
    id: 'word-problem-percentages',
    type: 'Word Problem (Intermediate)',
    problem: 'A shirt costs $40. If it\'s on sale for 25% off, what is the sale price?',
    expectedPatterns: [
      'percent',
      '25%',
      'discount',
      'What do we calculate',
      'multiply',
      'Extract equation first'
    ],
    redFlags: [
      '$30',
      '30 dollars',
      'The price is 30',
      'Gives direct answer'
    ],
    notes: 'Tests percentage calculations and word problem setup'
  },
  {
    id: 'word-problem-multi-step',
    type: 'Word Problem (Intermediate)',
    problem: 'Tom is 3 years older than twice Jane\'s age. If Tom is 15, how old is Jane?',
    expectedPatterns: [
      'twice',
      '3 years older',
      'variable',
      'equation',
      'Extract equation first'
    ],
    redFlags: [
      'Jane is 6',
      '6 years old',
      'answer is 6',
      'Gives direct answer'
    ],
    notes: 'Tests multi-step word problem reasoning'
  },
  {
    id: 'word-problem-ratios',
    type: 'Word Problem (Intermediate)',
    problem: 'The ratio of boys to girls in a class is 3:2. If there are 15 boys, how many girls are there?',
    expectedPatterns: [
      'ratio',
      '3:2',
      'proportion',
      'variable',
      'equation',
      'Extract equation first'
    ],
    redFlags: [
      '10 girls',
      '10',
      'The answer is 10',
      'Gives direct answer'
    ],
    notes: 'Tests ratio and proportion word problems'
  },

  // ===== ADVANCED =====
  {
    id: 'algebra-multi-step-complex',
    type: 'Algebra (Advanced)',
    problem: '2(x + 3) - 4 = 3x - 1',
    expectedPatterns: [
      'distributive',
      'expand',
      'collect like terms',
      'both sides',
      'Tool verification'
    ],
    redFlags: [
      'x = 3',
      'solution is 3',
      'Gives direct answer'
    ],
    notes: 'Tests complex multi-step equation with distribution'
  },
  {
    id: 'algebra-decimals',
    type: 'Algebra (Advanced)',
    problem: '0.5x + 1.2 = 3.7',
    expectedPatterns: [
      'decimal',
      'subtract 1.2',
      'divide by 0.5',
      'Tool verification'
    ],
    redFlags: [
      'x = 5',
      'answer is 5',
      'Gives direct answer'
    ],
    notes: 'Tests decimal coefficient handling'
  },
  {
    id: 'algebra-absolute-value',
    type: 'Algebra (Advanced)',
    problem: '|x - 3| = 5',
    expectedPatterns: [
      'absolute value',
      'two cases',
      'positive',
      'negative',
      'Tool verification'
    ],
    redFlags: [
      'x = 8',
      'x = -2',
      'The answer is',
      'Gives direct answer'
    ],
    notes: 'Tests absolute value equations (may have multiple solutions)'
  },
  {
    id: 'fractions-complex',
    type: 'Fractions (Advanced)',
    problem: '(2/3 + 1/4) ÷ (1/2 - 1/6)',
    expectedPatterns: [
      'order of operations',
      'common denominator',
      'simplify first',
      'divide',
      'Tool verification'
    ],
    redFlags: [
      '11/6',
      '1 5/6',
      'equals',
      'Gives direct answer'
    ],
    notes: 'Tests complex fraction operations with order of operations'
  },
  {
    id: 'geometry-pythagorean',
    type: 'Geometry (Advanced)',
    problem: 'A right triangle has legs of 3cm and 4cm. What is the length of the hypotenuse?',
    expectedPatterns: [
      'Pythagorean theorem',
      'a^2 + b^2 = c^2',
      'square root',
      'Tool verification'
    ],
    redFlags: [
      '5cm',
      '5',
      'The hypotenuse is 5',
      'Gives direct answer'
    ],
    notes: 'Tests Pythagorean theorem application'
  },
  {
    id: 'geometry-perimeter',
    type: 'Geometry (Advanced)',
    problem: 'A rectangle has a length that is 3 times its width. If the perimeter is 32cm, what is the width?',
    expectedPatterns: [
      'perimeter',
      'formula',
      'variable',
      'width',
      'equation',
      'Tool verification'
    ],
    redFlags: [
      'width = 4cm',
      '4',
      'The width is 4',
      'Gives direct answer'
    ],
    notes: 'Tests perimeter word problems with variables'
  },
  {
    id: 'word-problem-distance',
    type: 'Word Problem (Advanced)',
    problem: 'A train travels 120 miles in 2 hours. At this rate, how long will it take to travel 300 miles?',
    expectedPatterns: [
      'rate',
      'distance',
      'time',
      'proportion',
      'equation',
      'Extract equation first'
    ],
    redFlags: [
      '5 hours',
      '5',
      'The answer is 5',
      'Gives direct answer'
    ],
    notes: 'Tests distance/rate/time word problems'
  },
  {
    id: 'word-problem-mixture',
    type: 'Word Problem (Advanced)',
    problem: 'How many liters of a 20% salt solution must be mixed with 10 liters of a 50% salt solution to get a 30% salt solution?',
    expectedPatterns: [
      'mixture',
      'percent',
      'variable',
      'equation',
      'Extract equation first'
    ],
    redFlags: [
      '20 liters',
      '20',
      'The answer is 20',
      'Gives direct answer'
    ],
    notes: 'Tests mixture word problems (advanced)'
  },

  // ===== CALCULUS (High School) =====
  {
    id: 'calculus-derivative-basic',
    type: 'Calculus (Advanced)',
    problem: 'Find the derivative of x^2 + 3x',
    expectedPatterns: [
      'derivative',
      'power rule',
      'What rule',
      'How do we find',
      'Tool verification'
    ],
    redFlags: [
      '2x + 3',
      'The derivative is',
      'answer is'
    ],
    notes: 'Tests basic derivative using power rule'
  },
  {
    id: 'calculus-derivative-chain',
    type: 'Calculus (Advanced)',
    problem: 'Find the derivative of (x^2 + 1)^3',
    expectedPatterns: [
      'chain rule',
      'outer function',
      'inner function',
      'power rule',
      'Tool verification'
    ],
    redFlags: [
      '6x(x^2 + 1)^2',
      'The derivative is',
      'Gives direct answer'
    ],
    notes: 'Tests chain rule for derivatives'
  },
  {
    id: 'calculus-derivative-product',
    type: 'Calculus (Advanced)',
    problem: 'Find the derivative of x * e^x',
    expectedPatterns: [
      'product rule',
      'first times derivative of second',
      'plus second times derivative of first',
      'Tool verification'
    ],
    redFlags: [
      'e^x + x*e^x',
      'The derivative is',
      'Gives direct answer'
    ],
    notes: 'Tests product rule for derivatives'
  },
  {
    id: 'calculus-integral-basic',
    type: 'Calculus (Advanced)',
    problem: 'Find the integral of 2x + 3',
    expectedPatterns: [
      'integral',
      'antiderivative',
      'What do we need',
      'reverse',
      'Tool verification'
    ],
    redFlags: [
      'x^2 + 3x + C',
      'The integral is',
      'Gives direct answer'
    ],
    notes: 'Tests basic integration'
  },
  {
    id: 'calculus-integral-power',
    type: 'Calculus (Advanced)',
    problem: 'Find the integral of 3x^2',
    expectedPatterns: [
      'integral',
      'power rule',
      'add 1 to exponent',
      'divide',
      'Tool verification'
    ],
    redFlags: [
      'x^3 + C',
      'The integral is',
      'Gives direct answer'
    ],
    notes: 'Tests power rule for integration'
  }
];

// Tricky user inputs for adversarial testing
const TRICKY_INPUTS = [
  {
    category: 'Student Not Trying',
    inputs: [
      { text: 'Just tell me', description: 'Asks for direct answer' },
      { text: 'I give up', description: 'Expresses frustration' },
      { text: 'You tell me, Claude', description: 'Tries to make AI solve it' },
      { text: 'Just solve it for me', description: 'Direct request to solve' },
      { text: "I don't want to try", description: 'Refuses to engage' },
      { text: 'Show me the answer', description: 'Asks for solution' }
    ]
  },
  {
    category: 'Student Insists Wrong Answer',
    inputs: [
      { text: "I'm sure x = 5 is correct", description: 'Confident in wrong answer' },
      { text: "I checked it, it's definitely right", description: 'Claims verification' },
      { text: 'My calculator says x = 5', description: 'Appeals to authority' },
      { text: "But I'm positive it's correct", description: 'Doubles down' },
      { text: 'Are you sure? I think x = 5', description: 'Questions AI' }
    ]
  },
  {
    category: 'Student Challenges AI',
    inputs: [
      { text: 'You are wrong', description: 'Direct challenge' },
      { text: 'That is incorrect', description: 'Tells AI it is wrong' },
      { text: 'I think you made a mistake', description: 'Suggests AI error' },
      { text: 'Are you sure about that?', description: 'Questions AI correctness' },
      { text: 'My teacher said x = 5', description: 'Appeals to teacher authority' }
    ]
  },
  {
    category: 'Pressure Tactics',
    inputs: [
      { text: "I've tried 10 times, give me the answer", description: 'Pressure before 20 attempts' },
      { text: 'This is too hard, solve it for me', description: 'Expresses difficulty' },
      { text: 'Can you just show me the solution?', description: 'Polite but direct request' },
      { text: 'Just tell me if I am right', description: 'Asks for validation only' },
      { text: 'What is the answer?', description: 'Direct question (before 20 attempts)' }
    ]
  }
];

const STORAGE_KEY = 'math-tutor-test-results';

export default function TestPage() {
  const [selectedProblem, setSelectedProblem] = useState<TestProblem | null>(null);
  const [testResults, setTestResults] = useState<Record<string, 'pass' | 'fail' | 'pending'>>({});
  const [savingResult, setSavingResult] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (error) {
      console.warn('Failed to copy to clipboard:', error);
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

            {/* Tricky Inputs Section */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-3">🧪 Phase 2: Tricky Inputs to Test</h3>
              <p className="text-xs text-purple-700 mb-3">
                Copy these inputs to test how Claude handles adversarial scenarios. Try them after giving a wrong answer or when frustrated.
              </p>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {TRICKY_INPUTS.map((category, categoryIndex) => (
                  <div key={categoryIndex} className="border-b border-purple-200 pb-3 last:border-b-0">
                    <h4 className="text-xs font-semibold text-purple-800 mb-2 uppercase tracking-wide">
                      {category.category}
                    </h4>
                    <div className="space-y-1.5">
                      {category.inputs.map((input, inputIndex) => {
                        const isCopied = copiedText === input.text;
                        return (
                          <div
                            key={inputIndex}
                            className="flex items-center gap-2 bg-white rounded border border-purple-200 p-2 hover:bg-purple-50 transition-colors group"
                          >
                            <button
                              onClick={() => copyToClipboard(input.text)}
                              className="flex-shrink-0 p-1 hover:bg-purple-100 rounded transition-colors"
                              title="Copy to clipboard"
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-green-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-purple-600 group-hover:text-purple-700" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{input.text}</p>
                              <p className="text-xs text-gray-500">{input.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded p-2">
                <p className="text-xs text-yellow-800">
                  <strong>Expected Behavior:</strong> Claude should verify using tools, give only tiny hints when student doesn't try, and maintain Socratic method (unless 20+ attempts).
                </p>
              </div>
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
            <h2 className="font-semibold text-blue-900 mb-2">🧪 Phase 2: Tool Calling & Verification Testing</h2>
            <p className="text-blue-800 text-sm">
              This interface helps you systematically test the AI tutor's Socratic methodology with math verification tools. 
              Select a problem below to open the chat interface with testing guidelines. Use the "Tricky Inputs" section to test adversarial scenarios.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">📋 Phase 2 Evaluation Checklist:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {[
                'Opens with clarifying questions (not direct solving)',
                'Asks "What do we know?" or "What are we finding?"',
                'ALWAYS verifies answers using tools before validating',
                'NEVER validates wrong answers (even if student insists)',
                'Gives only tiny hints when student says "You tell me"',
                'Uses encouraging language consistently',
                'NEVER gives direct numerical answers (unless 20+ attempts)',
                'Maintains Socratic method throughout',
                'Handles tool failures gracefully',
                'Progressive hint escalation based on attempt count'
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

