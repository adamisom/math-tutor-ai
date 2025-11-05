/**
 * Attempt Tracking for Math Problems
 * 
 * Tracks wrong answer attempts per problem using localStorage
 * Detects new problems and resets attempt counts
 */

/**
 * Generate a signature/hash for a problem to identify it uniquely
 */
export function generateProblemSignature(problemText: string): string {
  // Simple signature based on problem structure
  // Normalize: remove whitespace, lowercase, extract key patterns
  const normalized = problemText
    .toLowerCase()
    .replace(/\s+/g, '')
    .trim();
  
  // Extract key identifiers: variables, numbers, operations
  const variables = normalized.match(/[xyz]\s*[=<>]/g) || [];
  const numbers = normalized.match(/\d+/g) || [];
  const operations = normalized.match(/[+\-*/=<>]/g) || [];
  
  // Create signature from key elements
  const signature = `${variables.join('|')}_${numbers.slice(0, 5).join('|')}_${operations.slice(0, 5).join('|')}`;
  
  // Use a simple hash if signature is too long
  if (signature.length > 100) {
    return btoa(normalized).slice(0, 50);
  }
  
  return signature;
}

/**
 * Check if a problem is significantly different (new problem)
 */
export function isNewProblem(
  currentProblem: string,
  previousProblem?: string
): boolean {
  if (!previousProblem) return true;
  
  const currentSig = generateProblemSignature(currentProblem);
  const previousSig = generateProblemSignature(previousProblem);
  
  // If signatures are very different, it's a new problem
  // Simple check: if less than 50% similarity, consider it new
  const similarity = calculateSimilarity(currentSig, previousSig);
  return similarity < 0.5;
}

/**
 * Simple similarity calculation (0-1)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Levenshtein distance for string similarity
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + cost
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Get attempt count for a problem
 */
export function getAttemptCount(problemSignature: string): number {
  // Only access localStorage in browser environment
  if (typeof window === 'undefined') {
    return 0;
  }
  try {
    const stored = localStorage.getItem(`attempts_${problemSignature}`);
    return stored ? parseInt(stored, 10) : 0;
  } catch (error) {
    console.error('Error reading attempt count:', error);
    return 0;
  }
}

/**
 * Increment attempt count for a problem
 */
export function incrementAttemptCount(problemSignature: string): number {
  // Only access localStorage in browser environment
  if (typeof window === 'undefined') {
    return 0;
  }
  try {
    const current = getAttemptCount(problemSignature);
    const newCount = current + 1;
    localStorage.setItem(`attempts_${problemSignature}`, newCount.toString());
    return newCount;
  } catch (error) {
    console.error('Error saving attempt count:', error);
    return 0;
  }
}

/**
 * Reset attempt count for a problem (when starting new problem)
 */
export function resetAttemptCount(problemSignature: string): void {
  // Only access localStorage in browser environment
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.removeItem(`attempts_${problemSignature}`);
  } catch (error) {
    console.error('Error resetting attempt count:', error);
  }
}

/**
 * Get current problem from conversation
 */
interface Message {
  role: string;
  content: string;
}
export function getCurrentProblemFromMessages(messages: Message[]): string | null {
  // Look for the most recent problem statement in user messages
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === 'user') {
      const content = msg.content || '';
      // Check if it looks like a math problem
      if (
        content.includes('=') ||
        content.includes('solve') ||
        content.includes('find') ||
        /\d+[x-z]/.test(content) ||
        content.length > 10 // Likely a problem statement
      ) {
        return content;
      }
    }
  }
  return null;
}

/**
 * Track and manage attempt counts for the current problem
 */
export function manageAttemptTracking(
  messages: Message[],
  previousProblem?: string
): {
  attemptCount: number;
  isNewProblem: boolean;
  problemSignature: string;
  currentProblem: string | null;
} {
  const currentProblem = getCurrentProblemFromMessages(messages) || '';
  
  if (!currentProblem) {
    return {
      attemptCount: 0,
      isNewProblem: false,
      problemSignature: '',
      currentProblem: null,
    };
  }
  
  const problemSignature = generateProblemSignature(currentProblem);
  const isNew = isNewProblem(currentProblem, previousProblem);
  
  if (isNew) {
    // Reset attempt count for new problem
    resetAttemptCount(problemSignature);
    return {
      attemptCount: 0,
      isNewProblem: true,
      problemSignature,
      currentProblem,
    };
  }
  
  // Get current attempt count for existing problem
  const attemptCount = getAttemptCount(problemSignature);
  
  return {
    attemptCount,
    isNewProblem: false,
    problemSignature,
    currentProblem,
  };
}

