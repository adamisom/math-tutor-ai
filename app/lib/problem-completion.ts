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
  
  const strongIndicators = [
    'excellent work',
    'great job',
    'you successfully solved',
    'correct!',
    'that\'s correct',
    'problem solved',
    'you solved it',
    '🎉',
    'perfect!',
    'well done',
  ];
  
  const hasStrongIndicator = strongIndicators.some(indicator => 
    content.includes(indicator)
  );
  
  const confirmsCorrectness = 
    content.includes('correct') && 
    (content.includes('yes') || content.includes('exactly') || content.includes('right'));
  
  if (hasStrongIndicator || confirmsCorrectness) {
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
    text.includes('complex')
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
    text.includes('pythagorean')
  ) {
    return 'intermediate';
  }
  
  // Default to beginner
  return 'beginner';
}

