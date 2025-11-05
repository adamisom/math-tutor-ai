/**
 * Test Problem Dataset
 * 
 * Based on MATH 300 Problems and common K-12 math problems
 * Used for integration testing of tool calling
 */

export interface TestProblem {
  id: string;
  type: 'algebra' | 'geometry' | 'fractions' | 'word_problem' | 'calculus';
  problem: string;
  correctAnswer?: string; // For verification testing only
  expectedTool?: string; // Which tool should be called
  expectedPatterns: string[]; // What to look for in responses
  redFlags: string[]; // What should NOT appear
}

export const TEST_PROBLEMS: TestProblem[] = [
  // Algebra - Simple Linear Equations
  {
    id: 'algebra-1',
    type: 'algebra',
    problem: '2x + 5 = 13',
    correctAnswer: 'x = 4',
    expectedTool: 'verify_equation_solution',
    expectedPatterns: [
      'What are we trying to find?',
      'What operation',
      'How do we undo',
      'subtract 5'
    ],
    redFlags: ['x = 4', 'x equals 4', 'The answer is', 'Therefore x = 4']
  },
  
  // Algebra - Multi-step
  {
    id: 'algebra-2',
    type: 'algebra',
    problem: '3(x - 4) = 15',
    correctAnswer: 'x = 9',
    expectedTool: 'verify_equation_solution',
    expectedPatterns: [
      'distributive',
      'parentheses',
      'What should we do first',
      'expand'
    ],
    redFlags: ['x = 9', 'Step 1:', 'The solution']
  },
  
  // Algebra - Two-step
  {
    id: 'algebra-3',
    type: 'algebra',
    problem: '5x - 7 = 18',
    correctAnswer: 'x = 5',
    expectedTool: 'verify_equation_solution',
    expectedPatterns: [
      'undo',
      'add 7',
      'divide by 5'
    ],
    redFlags: ['x = 5', 'answer is 5']
  },
  
  // Geometry - Area
  {
    id: 'geometry-1',
    type: 'geometry',
    problem: 'Find the area of a rectangle with length 8cm and width 5cm',
    correctAnswer: '40 cm²',
    expectedTool: 'verify_calculation',
    expectedPatterns: [
      'formula',
      'length times width',
      'What formula',
      'area formula'
    ],
    redFlags: ['40 cm²', '8 × 5 = 40', 'The area is 40']
  },
  
  // Fractions
  {
    id: 'fractions-1',
    type: 'fractions',
    problem: '3/4 + 1/2',
    correctAnswer: '5/4',
    expectedTool: 'verify_calculation',
    expectedPatterns: [
      'common denominator',
      'same denominator',
      'What do we need',
      'equivalent fractions'
    ],
    redFlags: ['5/4', '1¼', 'equals 5/4']
  },
  
  // Word Problems
  {
    id: 'word-1',
    type: 'word_problem',
    problem: 'Sarah has 3 times as many apples as John. Together they have 24 apples. How many does John have?',
    correctAnswer: 'John has 6',
    expectedTool: 'verify_equation_solution',
    expectedPatterns: [
      'What do we know',
      'variable',
      'let x represent',
      'equation'
    ],
    redFlags: ['John has 6', '6 apples', 'The answer is 6']
  },
  
  // Calculus - Derivatives
  {
    id: 'calculus-1',
    type: 'calculus',
    problem: 'Find the derivative of x^2 + 3x',
    correctAnswer: '2x + 3',
    expectedTool: 'verify_derivative',
    expectedPatterns: [
      'derivative',
      'power rule',
      'What rule',
      'How do we find'
    ],
    redFlags: ['2x + 3', 'The derivative is', 'answer is']
  },
  
  // Calculus - Integrals
  {
    id: 'calculus-2',
    type: 'calculus',
    problem: 'Find the integral of 2x + 3',
    correctAnswer: 'x^2 + 3x + C',
    expectedTool: 'verify_integral',
    expectedPatterns: [
      'integral',
      'antiderivative',
      'What do we need',
      'reverse'
    ],
    redFlags: ['x^2 + 3x + C', 'The integral is']
  },
  
  // TRICKIER PROBLEMS - More likely to cause mistakes
  
  // Algebra - Negative numbers
  {
    id: 'algebra-tricky-1',
    type: 'algebra',
    problem: '-3x + 7 = 22',
    correctAnswer: 'x = -5',
    expectedTool: 'verify_equation_solution',
    expectedPatterns: [
      'negative',
      'subtract 7',
      'divide by -3',
      'sign'
    ],
    redFlags: ['x = -5', 'answer is -5']
  },
  
  // Algebra - Fractions in equation
  {
    id: 'algebra-tricky-2',
    type: 'algebra',
    problem: 'x/3 + 2 = 5',
    correctAnswer: 'x = 9',
    expectedTool: 'verify_equation_solution',
    expectedPatterns: [
      'fraction',
      'multiply by 3',
      'denominator',
      'clear'
    ],
    redFlags: ['x = 9', 'x equals 9']
  },
  
  // Algebra - Variables on both sides
  {
    id: 'algebra-tricky-3',
    type: 'algebra',
    problem: '3x + 4 = 2x + 10',
    correctAnswer: 'x = 6',
    expectedTool: 'verify_equation_solution',
    expectedPatterns: [
      'both sides',
      'subtract 2x',
      'collect like terms',
      'combine'
    ],
    redFlags: ['x = 6', 'solution is 6']
  },
  
  // Algebra - Quadratic-like (but linear)
  {
    id: 'algebra-tricky-4',
    type: 'algebra',
    problem: 'x^2 - 4x = x^2 - 8',
    correctAnswer: 'x = 2',
    expectedTool: 'verify_equation_solution',
    expectedPatterns: [
      'x^2',
      'cancel',
      'subtract',
      'simplify'
    ],
    redFlags: ['x = 2', 'answer is 2']
  },
  
  // Word Problem - Percentages
  {
    id: 'word-tricky-1',
    type: 'word_problem',
    problem: 'A shirt costs $40. If it\'s on sale for 25% off, what is the sale price?',
    correctAnswer: '$30',
    expectedTool: 'verify_calculation',
    expectedPatterns: [
      'percent',
      '25%',
      'discount',
      'What do we calculate',
      'multiply'
    ],
    redFlags: ['$30', '30 dollars', 'The price is 30']
  },
  
  // Word Problem - Multi-step
  {
    id: 'word-tricky-2',
    type: 'word_problem',
    problem: 'Tom is 3 years older than twice Jane\'s age. If Tom is 15, how old is Jane?',
    correctAnswer: 'Jane is 6',
    expectedTool: 'verify_equation_solution',
    expectedPatterns: [
      'twice',
      '3 years older',
      'variable',
      'equation'
    ],
    redFlags: ['Jane is 6', '6 years old', 'answer is 6']
  },
  
  // Fractions - Mixed numbers
  {
    id: 'fractions-tricky-1',
    type: 'fractions',
    problem: '2 1/3 + 1 1/2',
    correctAnswer: '3 5/6',
    expectedTool: 'verify_calculation',
    expectedPatterns: [
      'mixed number',
      'convert',
      'improper fraction',
      'common denominator'
    ],
    redFlags: ['3 5/6', '23/6', 'equals 3 5/6']
  },
  
  // Fractions - Division
  {
    id: 'fractions-tricky-2',
    type: 'fractions',
    problem: '3/4 ÷ 1/2',
    correctAnswer: '3/2',
    expectedTool: 'verify_calculation',
    expectedPatterns: [
      'divide',
      'multiply by reciprocal',
      'flip',
      'invert'
    ],
    redFlags: ['3/2', '1.5', 'equals 3/2']
  },
  
  // Geometry - Circle
  {
    id: 'geometry-tricky-1',
    type: 'geometry',
    problem: 'Find the area of a circle with radius 5cm',
    correctAnswer: '25π cm² or 78.54 cm²',
    expectedTool: 'verify_calculation',
    expectedPatterns: [
      'circle',
      'π',
      'pi',
      'r^2',
      'radius squared'
    ],
    redFlags: ['25π', '78.54', 'The area is']
  },
  
  // Geometry - Triangle
  {
    id: 'geometry-tricky-2',
    type: 'geometry',
    problem: 'Find the area of a triangle with base 6cm and height 8cm',
    correctAnswer: '24 cm²',
    expectedTool: 'verify_calculation',
    expectedPatterns: [
      'triangle',
      'base times height',
      'divide by 2',
      '1/2'
    ],
    redFlags: ['24 cm²', '24', 'The area is 24']
  },
  
  // Calculus - Chain rule
  {
    id: 'calculus-tricky-1',
    type: 'calculus',
    problem: 'Find the derivative of (x^2 + 1)^3',
    correctAnswer: '6x(x^2 + 1)^2',
    expectedTool: 'verify_derivative',
    expectedPatterns: [
      'chain rule',
      'outer function',
      'inner function',
      'power rule'
    ],
    redFlags: ['6x(x^2 + 1)^2', 'The derivative is']
  },
  
  // Calculus - Product rule
  {
    id: 'calculus-tricky-2',
    type: 'calculus',
    problem: 'Find the derivative of x * e^x',
    correctAnswer: 'e^x + x*e^x',
    expectedTool: 'verify_derivative',
    expectedPatterns: [
      'product rule',
      'first times derivative of second',
      'plus second times derivative of first'
    ],
    redFlags: ['e^x + x*e^x', 'The derivative is']
  },
];

/**
 * Get test problems by type
 */
export function getTestProblemsByType(type: TestProblem['type']): TestProblem[] {
  return TEST_PROBLEMS.filter(p => p.type === type);
}

/**
 * Get a specific test problem by ID
 */
export function getTestProblem(id: string): TestProblem | undefined {
  return TEST_PROBLEMS.find(p => p.id === id);
}

