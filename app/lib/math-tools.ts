/**
 * Math Verification Tools for Claude
 * 
 * Defines all 6 verification tools using Vercel AI SDK tool format with Zod schemas
 */

import { tool } from 'ai';
import { z } from 'zod';
import {
  verifyEquationSolution,
  verifyAlgebraicStep,
  verifyCalculation,
  verifyDerivative,
  verifyIntegral,
  evaluateExpression,
} from './math-verification';

/**
 * Tool 1: Verify equation solution
 * Checks if a student's solution to an equation is correct
 */
export const verifyEquationSolutionTool = tool({
  description: `Verify if a student's solution to an equation is correct. Use this when a student provides a solution to an equation (e.g., "x = 4" for "2x + 5 = 13"). Returns whether the solution is correct and verification steps.`,
  inputSchema: z.object({
    equation: z.string().describe('The equation to verify (e.g., "2x + 5 = 13")'),
    claimed_solution: z.string().describe('The student\'s claimed solution (e.g., "x = 4")'),
  }),
  execute: async ({ equation, claimed_solution }) => {
    // Log tool call in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Tool Call] verify_equation_solution:', {
        equation,
        claimed_solution,
      });
    }
    const result = verifyEquationSolution(equation, claimed_solution);
    if (process.env.NODE_ENV === 'development') {
      console.log('[Tool Result] verify_equation_solution:', result);
    }
    return result;
  },
});

/**
 * Tool 2: Verify algebraic step
 * Checks if an algebraic manipulation step is mathematically valid
 */
export const verifyAlgebraicStepTool = tool({
  description: `Verify if an algebraic manipulation step is mathematically valid. Use this when a student performs an operation on an expression (e.g., "2x + 5 = 13" → "2x = 8" by subtracting 5). Returns whether the step is valid and an explanation.`,
  inputSchema: z.object({
    original_expression: z.string().describe('The original expression before the step (e.g., "2x + 5 = 13")'),
    resulting_expression: z.string().describe('The expression after the step (e.g., "2x = 8")'),
    operation_described: z.string().optional().describe('Optional: Description of what operation was performed (e.g., "subtract 5 from both sides")'),
  }),
  execute: async ({ original_expression, resulting_expression, operation_described }) => {
    // Log tool call in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Tool Call] verify_algebraic_step:', {
        original_expression,
        resulting_expression,
        operation_described,
      });
    }
    const result = verifyAlgebraicStep(original_expression, resulting_expression, operation_described);
    if (process.env.NODE_ENV === 'development') {
      console.log('[Tool Result] verify_algebraic_step:', result);
    }
    return result;
  },
});

/**
 * Tool 3: Verify calculation
 * Checks if a numerical calculation is correct
 */
export const verifyCalculationTool = tool({
  description: `Verify if a numerical calculation is correct. Use this when a student provides a numerical answer to a calculation (e.g., "8 × 5 = 40"). Returns whether the calculation is correct and the correct result.`,
  inputSchema: z.object({
    expression: z.string().describe('The calculation expression (e.g., "8 * 5" or "8 × 5")'),
    claimed_result: z.string().describe('The student\'s claimed result (e.g., "40")'),
  }),
  execute: async ({ expression, claimed_result }) => {
    // Log tool call in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Tool Call] verify_calculation:', {
        expression,
        claimed_result,
      });
    }
    const result = verifyCalculation(expression, claimed_result);
    if (process.env.NODE_ENV === 'development') {
      console.log('[Tool Result] verify_calculation:', result);
    }
    return result;
  },
});

/**
 * Tool 4: Verify derivative
 * Checks if a student's derivative calculation is correct (calculus)
 */
export const verifyDerivativeTool = tool({
  description: `Verify if a student's derivative calculation is correct. Use this for calculus problems involving derivatives (e.g., derivative of "x^2 + 3x" is "2x + 3"). Returns whether the derivative is correct and the correct derivative.`,
  inputSchema: z.object({
    function: z.string().describe('The original function (e.g., "x^2 + 3x")'),
    claimed_derivative: z.string().describe('The student\'s claimed derivative (e.g., "2x + 3")'),
  }),
  execute: async ({ function: function_, claimed_derivative }) => {
    // Log tool call in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Tool Call] verify_derivative:', {
        function: function_,
        claimed_derivative,
      });
    }
    const result = verifyDerivative(function_, claimed_derivative);
    if (process.env.NODE_ENV === 'development') {
      console.log('[Tool Result] verify_derivative:', result);
    }
    return result;
  },
});

/**
 * Tool 5: Verify integral
 * Checks if a student's integral calculation is correct (calculus)
 */
export const verifyIntegralTool = tool({
  description: `Verify if a student's integral calculation is correct. Use this for calculus problems involving integrals (e.g., integral of "2x + 3" is "x^2 + 3x + C"). Returns whether the integral is correct and the correct integral.`,
  inputSchema: z.object({
    function: z.string().describe('The function to integrate (e.g., "2x + 3")'),
    claimed_integral: z.string().describe('The student\'s claimed integral (e.g., "x^2 + 3x + C")'),
  }),
  execute: async ({ function: function_, claimed_integral }) => {
    // Log tool call in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Tool Call] verify_integral:', {
        function: function_,
        claimed_integral,
      });
    }
    const result = verifyIntegral(function_, claimed_integral);
    if (process.env.NODE_ENV === 'development') {
      console.log('[Tool Result] verify_integral:', result);
    }
    return result;
  },
});

/**
 * Tool 6: Evaluate expression
 * Evaluates a mathematical expression numerically or symbolically
 */
export const evaluateExpressionTool = tool({
  description: `Evaluate a mathematical expression numerically or symbolically. Use this to check intermediate steps or evaluate expressions with specific values (e.g., "x^2 + 5x when x=2" or "3 × 4 + 5"). Returns the result and an explanation.`,
  inputSchema: z.object({
    expression: z.string().describe('The expression to evaluate (e.g., "3 * 4 + 5" or "x^2 + 5x")'),
    substitutions: z.record(z.string(), z.number()).optional().describe('Optional: Variable substitutions (e.g., {"x": 2})'),
  }),
  execute: async ({ expression, substitutions }) => {
    // Log tool call in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Tool Call] evaluate_expression:', {
        expression,
        substitutions,
      });
    }
    const result = evaluateExpression(expression, substitutions);
    if (process.env.NODE_ENV === 'development') {
      console.log('[Tool Result] evaluate_expression:', result);
    }
    return result;
  },
});

/**
 * All math verification tools combined
 */
export const mathVerificationTools = {
  verify_equation_solution: verifyEquationSolutionTool,
  verify_algebraic_step: verifyAlgebraicStepTool,
  verify_calculation: verifyCalculationTool,
  verify_derivative: verifyDerivativeTool,
  verify_integral: verifyIntegralTool,
  evaluate_expression: evaluateExpressionTool,
};

