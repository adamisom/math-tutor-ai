/**
 * Math Verification Library
 * 
 * Uses nerdamer for symbolic math verification (K-12 + calculus)
 * All functions return structured results for tool responses
 */

import nerdamer from 'nerdamer';
// Import required modules for calculus
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('nerdamer/Calculus');
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('nerdamer/Algebra');
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('nerdamer/Solve');

/**
 * Helper function to check if two nerdamer expressions are equivalent
 * Uses nerdamer to subtract and check if difference is zero
 * This properly handles fractions, decimals, and symbolic expressions
 * 
 * For numeric comparisons, uses relative error tolerance to handle both
 * very small and very large numbers correctly.
 */
function areExpressionsEquivalent(
  expr1: string | nerdamer.Expression,
  expr2: string | nerdamer.Expression
): boolean {
  try {
    const expr1Obj = typeof expr1 === 'string' ? nerdamer(expr1) : expr1;
    const expr2Obj = typeof expr2 === 'string' ? nerdamer(expr2) : expr2;
    
    const difference = nerdamer(`(${expr1Obj}) - (${expr2Obj})`);
    const diffValue = difference.evaluate();
    const diffStr = diffValue.toString();
    
    // Check if difference is exactly zero (string comparison handles fractions)
    if (diffStr === '0' || diffStr === '-0') {
      return true;
    }
    
    // Fallback: numeric comparison for floating point precision issues
    // Use relative error tolerance instead of absolute to handle both small and large numbers
    try {
      const diffNumeric = parseFloat(diffStr);
      if (isNaN(diffNumeric)) {
        // Not numeric, can't use relative error - they're not equivalent
        return false;
      }
      
      // If difference is exactly zero (numeric), they're equivalent
      if (Math.abs(diffNumeric) === 0) {
        return true;
      }
      
      // Calculate relative error: |diff| / max(|value1|, |value2|)
      // Use relative error for non-zero values, absolute threshold for near-zero values
      const val1Numeric = parseFloat(expr1Obj.toString());
      const val2Numeric = parseFloat(expr2Obj.toString());
      
      if (!isNaN(val1Numeric) && !isNaN(val2Numeric)) {
        const maxAbsValue = Math.max(Math.abs(val1Numeric), Math.abs(val2Numeric));
        
        // Use hybrid approach: accept if absolute difference is very small OR relative error is small
        // This handles both:
        // - Large numbers: 1000000 vs 1000001 (0.0001% error) ✓
        // - Small numbers: 0.0002 vs 0.0003 (50% error) ✗, but 0.0002 vs 0.00020001 (tiny absolute diff) ✓
        // - Very small numbers near zero: use absolute threshold only
        const absoluteThreshold = 1e-8; // Accept if absolute difference is less than 1e-8 (handles floating point precision)
        const relativeThreshold = 0.000001; // 0.0001% relative error tolerance (one in a million)
        
        if (maxAbsValue < 1e-10) {
          // Both values are extremely close to zero - use stricter absolute threshold
          if (Math.abs(diffNumeric) < 1e-10) {
            return true;
          }
        } else {
          // Calculate relative error for non-zero values
          const relativeError = Math.abs(diffNumeric) / maxAbsValue;
          
          // Accept if EITHER:
          // 1. Absolute difference is very small (< 1e-8) - handles floating point precision issues
          // 2. Relative error is very small (< 0.001%) - handles proportional errors
          if (Math.abs(diffNumeric) < absoluteThreshold || relativeError < relativeThreshold) {
            return true;
          }
        }
      } else {
        // One or both values aren't numeric - use absolute threshold as fallback
        const absoluteThreshold = 1e-10;
        if (Math.abs(diffNumeric) < absoluteThreshold) {
          return true;
        }
      }
    } catch {
      // parseFloat or calculation failed, difference is not numeric (likely symbolic)
      // If it's not zero as a string, they're not equivalent
    }
    
    return false;
  } catch {
    // Comparison failed, assume not equivalent
    return false;
  }
}

/**
 * Verify if a student's solution to an equation is correct
 * Uses nerdamer for all parsing and comparison to properly handle fractions
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
    
    // Extract variable and value from solution using nerdamer-friendly parsing
    // Handles formats like "x = 4", "x = 5/4", "x = -3/2", "x = 1.25"
    const solutionMatch = cleanedSolution.match(/(\w+)\s*=\s*(.+)/);
    if (!solutionMatch) {
      return {
        is_correct: false,
        verification_steps: `Could not parse solution format: ${cleanedSolution}. Expected format: "x = value"`,
        error: 'INVALID_FORMAT'
      };
    }
    
    const [, variable, valueStr] = solutionMatch;
    const valueStrCleaned = valueStr.trim();
    
    // Parse the value using nerdamer (handles fractions, decimals, etc.)
    let valueExpr;
    try {
      valueExpr = nerdamer(valueStrCleaned);
    } catch {
      return {
        is_correct: false,
        verification_steps: `Could not parse solution value: ${valueStrCleaned}. Expected a number or fraction.`,
        error: 'INVALID_VALUE'
      };
    }
    
    // Verify solution by substitution (primary method)
    try {
      // Evaluate both sides of the equation
      // For equations like "2x + 5 = 13", we need to check if left equals right
      if (cleanedEquation.includes('=')) {
        const [leftSide, rightSide] = cleanedEquation.split('=');
        const leftExpr = nerdamer(leftSide.trim());
        const rightExpr = nerdamer(rightSide.trim());
        
        // Use nerdamer's evaluate with substitution object
        // Pass the value as a string so nerdamer can handle fractions properly
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const leftEval = (leftExpr.evaluate as any)({ [variable]: valueExpr });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rightEval = (rightExpr.evaluate as any)({ [variable]: valueExpr });
        
        // Compare using nerdamer subtraction (handles fractions properly)
        const isCorrect = areExpressionsEquivalent(leftEval, rightEval);
        
        const leftValueStr = leftEval.toString();
        const rightValueStr = rightEval.toString();
        
        return {
          is_correct: isCorrect,
          verification_steps: isCorrect
            ? `Substituting ${variable} = ${valueStrCleaned} into ${cleanedEquation}: ${leftValueStr} = ${rightValueStr} ✓ The solution satisfies the equation.`
            : `Substituting ${variable} = ${valueStrCleaned} into ${cleanedEquation}: ${leftValueStr} ≠ ${rightValueStr}. The solution does not satisfy the equation.`,
        };
      } else {
        // Not an equation, just evaluate the expression with substitution
        const expr = nerdamer(cleanedEquation);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const evaluated = (expr.evaluate as any)({ [variable]: valueExpr });
        
        // Check if the evaluated expression equals zero (or is approximately zero)
        const isTrue = areExpressionsEquivalent(evaluated, '0');
        
        const evalStr = evaluated.toString();
        
        return {
          is_correct: isTrue,
          verification_steps: isTrue 
            ? `Substituting ${variable} = ${valueStrCleaned} into ${cleanedEquation} gives ${evalStr}, which is a true statement.`
            : `Substituting ${variable} = ${valueStrCleaned} into ${cleanedEquation} gives ${evalStr}, which does not satisfy the equation.`,
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
    const original = originalExpression.trim();
    const resulting = resultingExpression.trim();
    
    // For equations, verify the transformation more carefully
    if (original.includes('=') && resulting.includes('=')) {
      const [origLeft, origRight] = original.split('=').map(s => s.trim());
      const [resLeft, resRight] = resulting.split('=').map(s => s.trim());
      
      // Try to verify by applying the described operation
      // If operation is described, try to compute what the result should be
      if (operationDescribed) {
        try {
          // For operations like "subtract x^2 from both sides", we can verify more accurately
          // Parse the operation to extract the term being added/subtracted
          const subtractMatch = operationDescribed.match(/subtract\s+(.+?)\s+from\s+both\s+sides/i);
          const addMatch = operationDescribed.match(/add\s+(.+?)\s+to\s+both\s+sides/i);
          const multiplyMatch = operationDescribed.match(/multiply\s+both\s+sides\s+by\s+(.+)/i);
          const divideMatch = operationDescribed.match(/divide\s+both\s+sides\s+by\s+(.+)/i);
          
          let expectedLeft: nerdamer.Expression;
          let expectedRight: nerdamer.Expression;
          
          if (subtractMatch) {
            const termToSubtract = subtractMatch[1].trim();
            expectedLeft = nerdamer(`(${origLeft}) - (${termToSubtract})`);
            expectedRight = nerdamer(`(${origRight}) - (${termToSubtract})`);
          } else if (addMatch) {
            const termToAdd = addMatch[1].trim();
            expectedLeft = nerdamer(`(${origLeft}) + (${termToAdd})`);
            expectedRight = nerdamer(`(${origRight}) + (${termToAdd})`);
          } else if (multiplyMatch) {
            const factor = multiplyMatch[1].trim();
            expectedLeft = nerdamer(`(${origLeft}) * (${factor})`);
            expectedRight = nerdamer(`(${origRight}) * (${factor})`);
          } else if (divideMatch) {
            const divisor = divideMatch[1].trim();
            expectedLeft = nerdamer(`(${origLeft}) / (${divisor})`);
            expectedRight = nerdamer(`(${origRight}) / (${divisor})`);
          } else {
            // Operation not recognized, fall through to equivalence check
            throw new Error('Operation not recognized');
          }
          
          // Compare expected result with actual result
          const expectedLeftStr = expectedLeft.toString();
          const expectedRightStr = expectedRight.toString();
          
          // Check if left sides match
          const leftMatch = areExpressionsEquivalent(expectedLeftStr, resLeft);
          const rightMatch = areExpressionsEquivalent(expectedRightStr, resRight);
          
          if (leftMatch && rightMatch) {
            return {
              is_valid: true,
              explanation: `The algebraic step from "${originalExpression}" to "${resultingExpression}" is mathematically valid.`,
            };
          } else {
            // Provide the correct result
            return {
              is_valid: false,
              explanation: `The algebraic step from "${originalExpression}" to "${resultingExpression}" is not mathematically valid. When ${operationDescribed}, the correct result should be "${expectedLeftStr} = ${expectedRightStr}".`,
              corrected_expression: `${expectedLeftStr} = ${expectedRightStr}`,
            };
          }
        } catch {
          // Operation parsing failed, fall through to equivalence check
        }
      }
      
      // Fallback: Check if both sides are equivalent transformations
      // For equations, check if left side difference equals right side difference
      try {
        const origLeftDiff = nerdamer(`(${origLeft}) - (${resLeft})`);
        const origRightDiff = nerdamer(`(${origRight}) - (${resRight})`);
        
        // If the differences are equivalent, the transformation is valid
        const isEquivalent = areExpressionsEquivalent(origLeftDiff.toString(), origRightDiff.toString());
        
        if (isEquivalent) {
          return {
            is_valid: true,
            explanation: `The algebraic step from "${originalExpression}" to "${resultingExpression}" is mathematically valid.`,
          };
        }
      } catch {
        // Difference calculation failed, try simpler equivalence
      }
    }
    
    // General equivalence check for non-equations or fallback
    const originalSimplified = nerdamer(original).toString();
    const resultingSimplified = nerdamer(resulting).toString();
    
    // Check if they're mathematically equivalent using nerdamer
    try {
      const isEquivalent = areExpressionsEquivalent(originalSimplified, resultingSimplified);
      
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
        if (original.includes('=')) {
          const [left, right] = original.split('=');
          const simplified = nerdamer(`(${left}) - (${right})`).toString();
          correctedExpression = `${simplified} = 0`;
        }
      } catch {
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
    
    // Evaluate the expression using nerdamer
    const result = nerdamer(cleanedExpression).evaluate();
    const correctResultStr = result.toString();
    
    // Parse the claimed result using nerdamer (handles fractions properly)
    let claimedExpr;
    try {
      const cleanedClaimed = claimedResult.trim().replace(/\s+/g, '');
      claimedExpr = nerdamer(cleanedClaimed);
    } catch {
      return {
        is_correct: false,
        correct_result: correctResultStr,
        explanation: `Could not parse claimed result: ${claimedResult}`,
        error: 'INVALID_FORMAT'
      };
    }
    
    // Compare using nerdamer (handles fractions, decimals, and mixed numbers correctly)
    try {
      const isZero = areExpressionsEquivalent(result, claimedExpr);
      
      return {
        is_correct: isZero,
        correct_result: correctResultStr,
        explanation: isZero
          ? `The calculation ${expression} = ${correctResultStr} is correct.`
          : `The calculation ${expression} = ${claimedResult} is incorrect. The correct answer is ${correctResultStr}.`,
      };
    } catch {
      // Comparison failed, try numeric comparison as fallback
      try {
        const correctNumeric = parseFloat(result.evaluate().toString());
        const claimedNumeric = parseFloat(claimedExpr.evaluate().toString());
        
        if (isNaN(correctNumeric) || isNaN(claimedNumeric)) {
          throw new Error('Numeric comparison failed');
        }
        
        const isCorrect = Math.abs(correctNumeric - claimedNumeric) < 0.0001;
        
        return {
          is_correct: isCorrect,
          correct_result: correctResultStr,
          explanation: isCorrect
            ? `The calculation ${expression} = ${correctResultStr} is correct.`
            : `The calculation ${expression} = ${claimedResult} is incorrect. The correct answer is ${correctResultStr}.`,
        };
      } catch {
        return {
          is_correct: false,
          correct_result: correctResultStr,
          explanation: `The calculation ${expression} = ${claimedResult} is incorrect. The correct answer is ${correctResultStr}.`,
          error: 'COMPARISON_ERROR'
        };
      }
    }
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
    
    // Check if they're equivalent using nerdamer
    try {
      const isEquivalent = areExpressionsEquivalent(claimedSimplified, derivativeSimplified2);
      
      return {
        is_correct: isEquivalent,
        correct_derivative: derivativeSimplified,
        verification_steps: isEquivalent
          ? `The derivative of ${cleanedFunction} is indeed ${derivativeSimplified}, which matches the claimed derivative.`
          : `The derivative of ${cleanedFunction} is ${derivativeSimplified}, which differs from the claimed derivative ${cleanedClaimed}.`,
      };
      } catch {
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
      
      // Check if derivatives match using nerdamer
      const derivativeMatches = areExpressionsEquivalent(derivativeSimplified, originalSimplified);
      
      if (derivativeMatches) {
        return {
          is_correct: true,
          correct_integral: integralSimplified,
          verification_steps: `The integral of ${cleanedFunction} is ${integralSimplified}. The claimed integral ${cleanedClaimed} is correct (verified by taking derivative).`,
        };
      }
    } catch {
      // Derivative check failed, try direct comparison
    }
    
    // Fallback: direct comparison (may not work for all forms)
    const claimedSimplified = nerdamer(claimedWithoutC).toString();
    const integralSimplified2 = nerdamer(integralWithoutC).toString();
    
    try {
      const isEquivalent = areExpressionsEquivalent(claimedSimplified, integralSimplified2);
      
      return {
        is_correct: isEquivalent,
        correct_integral: integralSimplified,
        verification_steps: isEquivalent
          ? `The integral of ${cleanedFunction} is ${integralSimplified}, which matches the claimed integral (ignoring constant of integration).`
          : `The integral of ${cleanedFunction} is ${integralSimplified}, which differs from the claimed integral ${cleanedClaimed}.`,
      };
      } catch {
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
    const exprString = expression.trim();
    
    // Basic validation: check for obviously invalid patterns
    if (/^\s*$/.test(exprString)) {
      return {
        result: '',
        explanation: 'Empty expression provided.',
        error: 'INVALID_EXPRESSION'
      };
    }
    
    // Check for invalid operator sequences
    if (/[\+\-\*\/]\s*[\+\-\*\/]/.test(exprString) || /\+\+|\-\-/.test(exprString)) {
      return {
        result: '',
        explanation: `Invalid expression format: ${expression}. Contains invalid operator sequences.`,
        error: 'INVALID_EXPRESSION'
      };
    }
    
    let expr;
    try {
      expr = nerdamer(exprString);
    } catch (parseError) {
      return {
        result: '',
        explanation: `Error parsing expression: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
        error: 'PARSE_ERROR'
      };
    }
    
    // Try to evaluate (with substitutions if provided)
    if (substitutions) {
      try {
        // Apply substitutions using evaluate with substitution object
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = (expr.evaluate as any)(substitutions);
        const resultStr = result.toString();
        
        // Return the result as-is (preserves fractions)
        return {
          result: resultStr,
          explanation: `Evaluating ${expression} with ${JSON.stringify(substitutions)} gives ${resultStr}.`,
        };
      } catch {
        // Evaluation failed, return symbolic form
        const simplified = expr.toString();
        return {
          result: simplified,
          explanation: `The expression ${expression} with ${JSON.stringify(substitutions)} simplifies to ${simplified}.`,
        };
      }
    } else {
      // No substitutions - check if it contains variables (symbolic expression)
      const hasVariables = /[a-z]/i.test(expression);
      
      if (hasVariables) {
        // Symbolic expression - simplify it
        const simplified = expr.toString();
        return {
          result: simplified,
          explanation: `The expression ${expression} simplifies to ${simplified}.`,
        };
      } else {
        // Pure numeric expression - evaluate using nerdamer
        try {
          const result = expr.evaluate();
          const resultStr = result.toString();
          
          // Return result as-is (preserves fractions like "5/4" instead of converting to "1.25")
          return {
            result: resultStr,
            explanation: `Evaluating ${expression} gives ${resultStr}.`,
          };
        } catch {
          // Evaluation failed, return symbolic form
          const simplified = expr.toString();
          return {
            result: simplified,
            explanation: `The expression ${expression} simplifies to ${simplified}.`,
          };
        }
      }
    }
  } catch (error) {
    return {
      result: '',
      explanation: `Error evaluating expression: ${error instanceof Error ? error.message : String(error)}`,
      error: 'EVALUATION_ERROR'
    };
  }
}

