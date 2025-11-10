/**
 * Problem Completion Detection
 * 
 * Detects when a student has successfully solved a problem
 */

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function detectProblemCompletion(
  messages: Message[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _currentProblem: string
): {
  isComplete: boolean;
  confidence: number;
  completionMessage?: string;
} {
  const lastAssistantMessage = [...messages]
    .reverse()
    .find(msg => msg.role === 'assistant');
  
  if (!lastAssistantMessage) {
    return { isComplete: false, confidence: 0 };
  }
  
  const content = lastAssistantMessage.content.toLowerCase();
  
  // Check if the user's last message looks like a final answer (not just a step)
  const lastUserMessage = [...messages]
    .reverse()
    .find(msg => msg.role === 'user');
  
  const userProvidedAnswer = lastUserMessage && (
    lastUserMessage.content.length < 100 && // Short answer, not a long explanation
    (lastUserMessage.content.includes('=') || 
     /^[x=0-9\s+\-*/()]+$/.test(lastUserMessage.content.trim())) // Looks like math answer
  );
  
  // Strong indicators that require user to have provided an answer
  const strongIndicators = [
    'you successfully solved',
    'problem solved',
    'you solved it',
    'that\'s the correct answer',
    'that is correct',
    'your answer is correct',
  ];
  
  // Weaker indicators that still require confirmation
  const weakIndicators = [
    'excellent work',
    'great job',
    'correct!',
    'that\'s correct',
    '🎉',
    'perfect!',
    'well done',
  ];
  
  const hasStrongIndicator = strongIndicators.some(indicator => 
    content.includes(indicator)
  );
  
  const hasWeakIndicator = weakIndicators.some(indicator => 
    content.includes(indicator)
  );
  
  const confirmsCorrectness = 
    content.includes('correct') && 
    (content.includes('yes') || content.includes('exactly') || content.includes('right')) &&
    (content.includes('answer') || content.includes('solution'));
  
  // Only mark as complete if:
  // 1. Strong indicator (explicit completion phrases), OR
  // 2. Weak indicator + user provided an answer + confirms correctness
  if (hasStrongIndicator || (hasWeakIndicator && userProvidedAnswer && confirmsCorrectness)) {
    return {
      isComplete: true,
      confidence: hasStrongIndicator ? 0.9 : 0.7,
      completionMessage: lastAssistantMessage.content,
    };
  }
  
  return { isComplete: false, confidence: 0 };
}

export function determineDifficulty(problemText: string): 'beginner' | 'intermediate' | 'advanced' {
  const text = problemText.toLowerCase();
  
  // Advanced indicators
  if (
    text.includes('derivative') ||
    text.includes('integral') ||
    text.includes('calculus') ||
    text.includes('absolute value') ||
    text.includes('|') ||
    text.includes('quadratic') ||
    text.includes('complex') ||
    text.includes('logarithm') ||
    text.includes('log(') ||
    text.includes('exponential') ||
    text.includes('trigonometry') ||
    text.includes('sin') ||
    text.includes('cos') ||
    text.includes('tan') ||
    text.includes('limit') ||
    text.includes('matrix') ||
    text.includes('vector')
  ) {
    return 'advanced';
  }
  
  // Intermediate indicators
  if (
    text.includes('distributive') ||
    text.includes('both sides') ||
    text.includes('fraction') ||
    text.includes('ratio') ||
    text.includes('percent') ||
    text.includes('pythagorean') ||
    text.includes('system of') ||
    text.includes('inequality') ||
    text.includes('>') ||
    text.includes('<') ||
    text.includes('square root') ||
    text.includes('√') ||
    (text.includes('x^') && !text.includes('x^2')) || // Powers other than squared
    text.includes('polynomial')
  ) {
    return 'intermediate';
  }
  
  // Default to beginner
  return 'beginner';
}

