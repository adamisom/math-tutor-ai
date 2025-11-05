/**
 * Math Verification Library
 * 
 * Uses nerdamer for symbolic math verification (K-12 + calculus)
 * All functions return structured results for tool responses
 */

import nerdamer from 'nerdamer';
// Import required modules for calculus
require('nerdamer/Calculus');
require('nerdamer/Algebra');
require('nerdamer/Solve');

/**
 * Verify if a student's solution to an equation is correct
 */
export function verifyEquationSolution(
  equation: string,
  claimedSolution: string
): {
  is_correct: boolean;
  verification_steps: string;
  all_solutions?: string[];
  error?: string;
} {
  try {
    // Clean and parse the equation
    const cleanedEquation = equation.trim();
    const cleanedSolution = claimedSolution.trim();
    
    // Extract variable from solution (e.g., "x = 4" -> "x" and "4")
    const solutionMatch = cleanedSolution.match(/(\w+)\s*=\s*([\d\.\-\+]+)/);
    if (!solutionMatch) {
      return {
        is_correct: false,
        verification_steps: `Could not parse solution format: ${cleanedSolution}. Expected format: "x = value"`,
        error: 'INVALID_FORMAT'
      };
    }
    
    const [, variable, value] = solutionMatch;
    const numericValue = parseFloat(value);
    
    if (isNaN(numericValue)) {
      return {
        is_correct: false,
        verification_steps: `Could not parse numeric value: ${value}`,
        error: 'INVALID_VALUE'
      };
    }
    
    // Verify solution by substitution (primary method)
    // Replace variable with value in the equation and check if it holds
    const substituted = cleanedEquation.replace(new RegExp(`\\b${variable}\\b`, 'g'), value);
    try {
      // Evaluate both sides of the equation
      // For equations like "2x + 5 = 13", we need to check if left equals right
      if (cleanedEquation.includes('=')) {
        const [leftSide, rightSide] = cleanedEquation.split('=');
        const leftWithValue = leftSide.replace(new RegExp(`\\b${variable}\\b`, 'g'), value);
        const rightWithValue = rightSide.replace(new RegExp(`\\b${variable}\\b`, 'g'), value);
        
        const leftEval = nerdamer(leftWithValue).evaluate();
        const rightEval = nerdamer(rightWithValue).evaluate();
        
        const leftValue = parseFloat(leftEval.toString());
        const rightValue = parseFloat(rightEval.toString());
        
        const isCorrect = !isNaN(leftValue) && !isNaN(rightValue) && 
                         Math.abs(leftValue - rightValue) < 0.0001;
        
        return {
          is_correct: isCorrect,
          verification_steps: isCorrect
            ? `Substituting ${variable} = ${value} into ${cleanedEquation}: ${leftValue} = ${rightValue} ✓`
            : `Substituting ${variable} = ${value} into ${cleanedEquation}: ${leftValue} ≠ ${rightValue}`,
        };
      } else {
        // Not an equation, just evaluate the expression
        const evaluated = nerdamer(substituted).evaluate();
        const isTrue = evaluated.toString() === 'true' || 
                      Math.abs(parseFloat(evaluated.toString())) < 0.0001;
        
        return {
          is_correct: isTrue,
          verification_steps: isTrue 
            ? `Substituting ${variable} = ${value} into ${cleanedEquation} gives a true statement.`
            : `Substituting ${variable} = ${value} into ${cleanedEquation} does not satisfy the equation.`,
        };
      }
    } catch (evalError) {
      return {
        is_correct: false,
        verification_steps: `Could not verify solution: ${evalError instanceof Error ? evalError.message : String(evalError)}`,
        error: 'VERIFICATION_FAILED'
      };
    }
  } catch (error) {
    return {
      is_correct: false,
      verification_steps: `Error verifying solution: ${error instanceof Error ? error.message : String(error)}`,
      error: 'VERIFICATION_ERROR'
    };
  }
}

/**
 * Verify if an algebraic manipulation step is mathematically valid
 */
export function verifyAlgebraicStep(
  originalExpression: string,
  resultingExpression: string,
  operationDescribed?: string
): {
  is_valid: boolean;
  explanation: string;
  corrected_expression?: string;
  error?: string;
} {
  try {
    const original = nerdamer(originalExpression.trim());
    const resulting = nerdamer(resultingExpression.trim());
    
    // Try to determine if the transformation is valid
    // This is tricky - we'll simplify both and see if they're equivalent
    const originalSimplified = nerdamer(originalExpression.trim()).toString();
    const resultingSimplified = nerdamer(resultingExpression.trim()).toString();
    
    // Check if they're mathematically equivalent by comparing the difference
    try {
      const difference = nerdamer(`(${originalSimplified}) - (${resultingSimplified})`);
      const diffValue = difference.evaluate();
      const isEquivalent = diffValue.toString() === '0' || 
                          Math.abs(parseFloat(diffValue.toString())) < 0.0001;
      
      if (isEquivalent) {
        return {
          is_valid: true,
          explanation: `The algebraic step from "${originalExpression}" to "${resultingExpression}" is mathematically valid.`,
        };
      }
      
      // Try to suggest what the correct next step might be
      let correctedExpression: string | undefined;
      try {
        // For equations, try solving or simplifying
        if (originalExpression.includes('=')) {
          const [left, right] = originalExpression.split('=');
          const simplified = nerdamer(`(${left}) - (${right})`).toString();
          correctedExpression = `${simplified} = 0`;
        }
      } catch (e) {
        // Can't suggest correction
      }
      
      return {
        is_valid: false,
        explanation: `The algebraic step from "${originalExpression}" to "${resultingExpression}" is not mathematically valid. The expressions are not equivalent.`,
        corrected_expression: correctedExpression,
      };
    } catch (innerError) {
      // Evaluation failed, return false
      return {
        is_valid: false,
        explanation: `Error verifying algebraic step: ${innerError instanceof Error ? innerError.message : String(innerError)}`,
        error: 'VERIFICATION_ERROR'
      };
    }
  } catch (error) {
    return {
      is_valid: false,
      explanation: `Error verifying algebraic step: ${error instanceof Error ? error.message : String(error)}`,
      error: 'VERIFICATION_ERROR'
    };
  }
}

/**
 * Verify if a numerical calculation is correct
 */
export function verifyCalculation(
  expression: string,
  claimedResult: string
): {
  is_correct: boolean;
  correct_result: string;
  explanation: string;
  error?: string;
} {
  try {
    // Clean the expression (handle common math operators)
    const cleanedExpression = expression
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/\s+/g, '')
      .trim();
    
    const claimed = parseFloat(claimedResult.trim());
    
    if (isNaN(claimed)) {
      return {
        is_correct: false,
        correct_result: '',
        explanation: `Could not parse claimed result: ${claimedResult}`,
        error: 'INVALID_FORMAT'
      };
    }
    
    // Evaluate the expression
    const result = nerdamer(cleanedExpression).evaluate();
    const correctValue = parseFloat(result.toString());
    
    if (isNaN(correctValue)) {
      return {
        is_correct: false,
        correct_result: result.toString(),
        explanation: `Could not evaluate expression: ${expression}`,
        error: 'EVALUATION_ERROR'
      };
    }
    
    const isCorrect = Math.abs(correctValue - claimed) < 0.0001;
    
    return {
      is_correct: isCorrect,
      correct_result: correctValue.toString(),
      explanation: isCorrect
        ? `The calculation ${expression} = ${correctValue} is correct.`
        : `The calculation ${expression} = ${claimed} is incorrect. The correct answer is ${correctValue}.`,
    };
  } catch (error) {
    return {
      is_correct: false,
      correct_result: '',
      explanation: `Error verifying calculation: ${error instanceof Error ? error.message : String(error)}`,
      error: 'VERIFICATION_ERROR'
    };
  }
}

/**
 * Verify if a student's derivative calculation is correct
 */
export function verifyDerivative(
  function_: string,
  claimedDerivative: string
): {
  is_correct: boolean;
  correct_derivative: string;
  verification_steps: string;
  error?: string;
} {
  try {
    const cleanedFunction = function_.trim();
    const cleanedClaimed = claimedDerivative.trim();
    
    // Calculate the correct derivative (with respect to x by default)
    // Extract variable from function if present, otherwise use 'x'
    const variableMatch = cleanedFunction.match(/[a-z]/i);
    const variable = variableMatch ? variableMatch[0] : 'x';
    const derivative = nerdamer.diff(cleanedFunction, variable);
    const derivativeSimplified = derivative.toString();
    
    // Check if claimed derivative matches (allowing for equivalent forms)
    const claimedSimplified = nerdamer(cleanedClaimed).toString();
    const derivativeSimplified2 = derivative.toString();
    
    // Check if they're equivalent by evaluating the difference
    try {
      const difference = nerdamer(`(${claimedSimplified}) - (${derivativeSimplified2})`);
      const diffValue = difference.evaluate();
      const isEquivalent = diffValue.toString() === '0' || 
                          Math.abs(parseFloat(diffValue.toString())) < 0.0001;
      
      return {
        is_correct: isEquivalent,
        correct_derivative: derivativeSimplified,
        verification_steps: isEquivalent
          ? `The derivative of ${cleanedFunction} is indeed ${derivativeSimplified}, which matches the claimed derivative.`
          : `The derivative of ${cleanedFunction} is ${derivativeSimplified}, which differs from the claimed derivative ${cleanedClaimed}.`,
      };
      } catch (innerError) {
        // Comparison failed, assume incorrect
        return {
          is_correct: false,
          correct_derivative: derivativeSimplified,
          verification_steps: `The derivative of ${cleanedFunction} is ${derivativeSimplified}, which differs from the claimed derivative ${cleanedClaimed}.`,
        };
      }
  } catch (error) {
    return {
      is_correct: false,
      correct_derivative: '',
      verification_steps: `Error verifying derivative: ${error instanceof Error ? error.message : String(error)}`,
      error: 'VERIFICATION_ERROR'
    };
  }
}

/**
 * Verify if a student's integral calculation is correct
 */
export function verifyIntegral(
  function_: string,
  claimedIntegral: string
): {
  is_correct: boolean;
  correct_integral: string;
  verification_steps: string;
  error?: string;
} {
  try {
    const cleanedFunction = function_.trim();
    const cleanedClaimed = claimedIntegral.trim();
    
    // Calculate the correct integral (with respect to x by default)
    // Extract variable from function if present, otherwise use 'x'
    const variableMatch = cleanedFunction.match(/[a-z]/i);
    const variable = variableMatch ? variableMatch[0] : 'x';
    const integral = nerdamer.integrate(cleanedFunction, variable);
    const integralSimplified = integral.toString();
    
    // Handle constant of integration - remove +C or +C1, etc. for comparison
    const claimedWithoutC = cleanedClaimed.replace(/\s*\+\s*[Cc]\d*/g, '').replace(/\s*\+\s*[Cc]/g, '');
    const integralWithoutC = integralSimplified.replace(/\s*\+\s*[Cc]\d*/g, '').replace(/\s*\+\s*[Cc]/g, '');
    
    // Check if they're equivalent (ignoring constant) by checking derivative
    // If derivative of claimed integral equals original function, it's correct
    try {
      // Extract variable from function if present
      const variableMatch = cleanedFunction.match(/[a-z]/i);
      const variable = variableMatch ? variableMatch[0] : 'x';
      const derivativeOfClaimed = nerdamer.diff(claimedWithoutC, variable);
      const derivativeSimplified = derivativeOfClaimed.toString();
      const originalSimplified = nerdamer(cleanedFunction).toString();
      
      // Check if derivatives match
      const derivativeCheck = nerdamer(`(${derivativeSimplified}) - (${originalSimplified})`);
      const diffValue = derivativeCheck.evaluate();
      const derivativeMatches = diffValue.toString() === '0' || 
                                Math.abs(parseFloat(diffValue.toString())) < 0.0001;
      
      if (derivativeMatches) {
        return {
          is_correct: true,
          correct_integral: integralSimplified,
          verification_steps: `The integral of ${cleanedFunction} is ${integralSimplified}. The claimed integral ${cleanedClaimed} is correct (verified by taking derivative).`,
        };
      }
    } catch (e) {
      // Derivative check failed, try direct comparison
    }
    
    // Fallback: direct comparison (may not work for all forms)
    const claimedSimplified = nerdamer(claimedWithoutC).toString();
    const integralSimplified2 = nerdamer(integralWithoutC).toString();
    
    try {
      const difference = nerdamer(`(${claimedSimplified}) - (${integralSimplified2})`);
      const diffValue = difference.evaluate();
      const isEquivalent = diffValue.toString() === '0' || 
                          Math.abs(parseFloat(diffValue.toString())) < 0.0001;
      
      return {
        is_correct: isEquivalent,
        correct_integral: integralSimplified,
        verification_steps: isEquivalent
          ? `The integral of ${cleanedFunction} is ${integralSimplified}, which matches the claimed integral (ignoring constant of integration).`
          : `The integral of ${cleanedFunction} is ${integralSimplified}, which differs from the claimed integral ${cleanedClaimed}.`,
      };
      } catch (innerError) {
        // Direct comparison failed, assume incorrect
        return {
          is_correct: false,
          correct_integral: integralSimplified,
          verification_steps: `The integral of ${cleanedFunction} is ${integralSimplified}, which differs from the claimed integral ${cleanedClaimed}.`,
        };
      }
  } catch (error) {
    return {
      is_correct: false,
      correct_integral: '',
      verification_steps: `Error verifying integral: ${error instanceof Error ? error.message : String(error)}`,
      error: 'VERIFICATION_ERROR'
    };
  }
}

/**
 * Evaluate a mathematical expression numerically or symbolically
 */
export function evaluateExpression(
  expression: string,
  substitutions?: Record<string, number>
): {
  result: string;
  explanation: string;
  error?: string;
} {
  try {
    let exprString = expression.trim();
    
    // Apply substitutions if provided
    if (substitutions) {
      Object.entries(substitutions).forEach(([varName, value]) => {
        // Replace variable with value in the expression string
        exprString = exprString.replace(new RegExp(`\\b${varName}\\b`, 'g'), value.toString());
      });
    }
    
    const expr = nerdamer(exprString);
    
    // Try to evaluate numerically first
    try {
      const numericResult = expr.evaluate();
      const numericValue = parseFloat(numericResult.toString());
      
      if (!isNaN(numericValue)) {
        return {
          result: numericValue.toString(),
          explanation: `Evaluating ${expression}${substitutions ? ` with ${JSON.stringify(substitutions)}` : ''} gives ${numericValue}.`,
        };
      }
    } catch (e) {
      // Not a numeric expression, try symbolic
    }
    
    // Simplify symbolically
    const simplified = expr.toString();
    
    return {
      result: simplified,
      explanation: `The expression ${expression}${substitutions ? ` with ${JSON.stringify(substitutions)}` : ''} simplifies to ${simplified}.`,
    };
  } catch (error) {
    return {
      result: '',
      explanation: `Error evaluating expression: ${error instanceof Error ? error.message : String(error)}`,
      error: 'EVALUATION_ERROR'
    };
  }
}

