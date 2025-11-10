/**
 * Dialogue Assessment Tools
 * 
 * Automated checks for evaluating Socratic dialogue quality
 */

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface DialogueAssessment {
  // Automated checks
  containsDirectAnswer: boolean;
  asksQuestions: boolean;
  usesEncouragingWords: boolean;
  providesHints: boolean;
  usesDiscouragingWords: boolean;
  givesStepByStepSolution: boolean;
  
  // Detected patterns
  detectedPatterns: string[];
  detectedRedFlags: string[];
  
  // Metrics
  questionCount: number;
  encouragingWordCount: number;
  discouragingWordCount: number;
}

/**
 * Assess a single message for Socratic dialogue quality
 */
export function assessMessage(message: Message): Partial<DialogueAssessment> {
  if (message.role !== 'assistant') {
    return {};
  }
  
  return {
    containsDirectAnswer: detectDirectAnswer(message.content),
    asksQuestions: detectQuestions(message.content),
    usesEncouragingWords: detectEncouragingWords(message.content),
    providesHints: detectHints(message.content),
    usesDiscouragingWords: detectDiscouragingWords(message.content),
    givesStepByStepSolution: detectStepByStepSolution(message.content),
    questionCount: (message.content.match(/\?/g) || []).length,
    encouragingWordCount: countEncouragingWords(message.content),
    discouragingWordCount: countDiscouragingWords(message.content),
    detectedPatterns: detectExpectedPatterns(message.content),
    detectedRedFlags: detectRedFlags(message.content),
  };
}

/**
 * Assess entire conversation
 */
export function assessConversation(messages: Message[]): DialogueAssessment {
  const assessments = messages
    .filter(m => m.role === 'assistant')
    .map(assessMessage);
  
  return {
    containsDirectAnswer: assessments.some(a => a.containsDirectAnswer),
    asksQuestions: assessments.some(a => a.asksQuestions),
    usesEncouragingWords: assessments.some(a => a.usesEncouragingWords),
    providesHints: assessments.some(a => a.providesHints),
    usesDiscouragingWords: assessments.some(a => a.usesDiscouragingWords),
    givesStepByStepSolution: assessments.some(a => a.givesStepByStepSolution),
    detectedPatterns: [...new Set(assessments.flatMap(a => a.detectedPatterns || []))],
    detectedRedFlags: [...new Set(assessments.flatMap(a => a.detectedRedFlags || []))],
    questionCount: assessments.reduce((sum, a) => sum + (a.questionCount || 0), 0),
    encouragingWordCount: assessments.reduce((sum, a) => sum + (a.encouragingWordCount || 0), 0),
    discouragingWordCount: assessments.reduce((sum, a) => sum + (a.discouragingWordCount || 0), 0),
  };
}

/**
 * Detect if message contains direct answers
 */
function detectDirectAnswer(text: string): boolean {
  const patterns = [
    // Direct variable assignments: "x = 4", "x equals 4"
    /\b(x|y|z|answer|solution|result)\s*=\s*\d+/i,
    /\b(x|y|z|answer|solution|result)\s+(equals?|is)\s+\d+/i,
    
    // "The answer is..." patterns
    /the\s+(answer|solution|result)\s+is\s+\d+/i,
    /(answer|solution|result)\s+is\s+\d+/i,
    
    // "Therefore..." with numbers
    /therefore\s+.*\d+/i,
    /so\s+(x|y|z|answer)\s+.*\d+/i,
    
    // Direct numerical answers in quotes or emphasis
    /["']\d+["']/,
    /\*\*\d+\*\*/,
  ];
  
  return patterns.some(pattern => pattern.test(text));
}

/**
 * Detect if message asks questions
 */
function detectQuestions(text: string): boolean {
  return text.includes('?') || 
         /\b(what|how|why|when|where|which|who)\b/i.test(text);
}

/**
 * Detect encouraging words
 */
function detectEncouragingWords(text: string): boolean {
  const encouragingWords = [
    'great', 'excellent', 'exactly', 'perfect', 'nice', 'good', 'well done',
    'you\'re right', 'correct', 'that\'s right', 'precisely', 'spot on',
    'you\'re on the right track', 'good thinking', 'nice work', 'well thought',
    'exactly right', 'that\'s it', 'you got it', 'awesome', 'fantastic',
    'wonderful', 'brilliant', 'superb', 'outstanding', 'amazing', 'terrific'
  ];
  
  const lowerText = text.toLowerCase();
  return encouragingWords.some(word => lowerText.includes(word));
}

/**
 * Count encouraging words
 */
function countEncouragingWords(text: string): number {
  const encouragingWords = [
    'great', 'excellent', 'exactly', 'perfect', 'nice', 'good', 'well done',
    'you\'re right', 'correct', 'that\'s right', 'precisely', 'spot on',
    'you\'re on the right track', 'good thinking', 'nice work', 'well thought',
    'exactly right', 'that\'s it', 'you got it', 'awesome', 'fantastic',
    'wonderful', 'brilliant', 'superb', 'outstanding', 'amazing', 'terrific'
  ];
  
  const lowerText = text.toLowerCase();
  return encouragingWords.filter(word => lowerText.includes(word)).length;
}

/**
 * Detect discouraging words
 */
function detectDiscouragingWords(text: string): boolean {
  const discouragingWords = [
    'wrong', 'incorrect', 'no,', 'not right', 'that\'s wrong', 'that\'s incorrect',
    'mistake', 'error', 'you\'re wrong', 'that\'s not right', 'nope', 'nah',
    'unfortunately not', 'that\'s not it', 'try again', 'not quite'
  ];
  
  const lowerText = text.toLowerCase();
  return discouragingWords.some(word => lowerText.includes(word));
}

/**
 * Count discouraging words
 */
function countDiscouragingWords(text: string): number {
  const discouragingWords = [
    'wrong', 'incorrect', 'no,', 'not right', 'that\'s wrong', 'that\'s incorrect',
    'mistake', 'error', 'you\'re wrong', 'that\'s not right', 'nope', 'nah',
    'unfortunately not', 'that\'s not it', 'try again', 'not quite'
  ];
  
  const lowerText = text.toLowerCase();
  return discouragingWords.filter(word => lowerText.includes(word)).length;
}

/**
 * Detect hints (progressive guidance)
 */
function detectHints(text: string): boolean {
  const hintPatterns = [
    /what\s+(should|could|might|can)\s+we\s+do/i,
    /think\s+about/i,
    /consider/i,
    /what\s+if\s+we/i,
    /maybe\s+we\s+could/i,
    /hint/i,
    /try\s+(thinking\s+about|considering)/i,
  ];
  
  return hintPatterns.some(pattern => pattern.test(text));
}

/**
 * Detect step-by-step solutions
 */
function detectStepByStepSolution(text: string): boolean {
  const patterns = [
    /step\s+\d+:/i,
    /first,\s+we/i,
    /then,\s+we/i,
    /next,\s+we/i,
    /finally,\s+we/i,
    /step\s+by\s+step/i,
  ];
  
  return patterns.some(pattern => pattern.test(text));
}

/**
 * Detect expected patterns from test problems
 */
function detectExpectedPatterns(text: string): string[] {
  const expectedPatterns = [
    'what are we trying to find',
    'what do we know',
    'what operation',
    'how do we undo',
    'what should we do',
    'what formula',
    'common denominator',
    'distributive',
    'parentheses',
  ];
  
  const lowerText = text.toLowerCase();
  return expectedPatterns.filter(pattern => lowerText.includes(pattern));
}

/**
 * Detect red flags
 */
function detectRedFlags(text: string): string[] {
  const redFlags = [
    'the answer is',
    'x equals',
    'x =',
    'therefore',
    'step 1:',
    'step 2:',
    'wrong',
    'incorrect',
  ];
  
  const lowerText = text.toLowerCase();
  return redFlags.filter(flag => lowerText.includes(flag));
}

/**
 * Generate assessment summary
 */
export function generateAssessmentSummary(assessment: DialogueAssessment): string {
  const lines: string[] = [];
  
  lines.push('📊 Dialogue Assessment Summary');
  lines.push('═'.repeat(50));
  lines.push('');
  
  // Automated checks
  lines.push('✅ Automated Checks:');
  lines.push(`   ${assessment.asksQuestions ? '✅' : '❌'} Asks questions`);
  lines.push(`   ${assessment.usesEncouragingWords ? '✅' : '❌'} Uses encouraging words`);
  lines.push(`   ${assessment.providesHints ? '✅' : '❌'} Provides hints`);
  lines.push(`   ${!assessment.containsDirectAnswer ? '✅' : '❌'} No direct answers`);
  lines.push(`   ${!assessment.usesDiscouragingWords ? '✅' : '❌'} No discouraging words`);
  lines.push(`   ${!assessment.givesStepByStepSolution ? '✅' : '❌'} No step-by-step solutions`);
  lines.push('');
  
  // Metrics
  lines.push('📈 Metrics:');
  lines.push(`   Questions asked: ${assessment.questionCount}`);
  lines.push(`   Encouraging words: ${assessment.encouragingWordCount}`);
  lines.push(`   Discouraging words: ${assessment.discouragingWordCount}`);
  lines.push('');
  
  // Detected patterns
  if (assessment.detectedPatterns.length > 0) {
    lines.push('✅ Detected Expected Patterns:');
    assessment.detectedPatterns.forEach(pattern => {
      lines.push(`   • ${pattern}`);
    });
    lines.push('');
  }
  
  // Red flags
  if (assessment.detectedRedFlags.length > 0) {
    lines.push('❌ Detected Red Flags:');
    assessment.detectedRedFlags.forEach(flag => {
      lines.push(`   • ${flag}`);
    });
    lines.push('');
  }
  
  // Overall status
  const hasCriticalIssues = assessment.containsDirectAnswer || 
                            assessment.usesDiscouragingWords ||
                            assessment.givesStepByStepSolution;
  
  lines.push('🎯 Overall Status:');
  if (hasCriticalIssues) {
    lines.push('   ❌ Critical issues detected - needs prompt adjustment');
  } else if (assessment.asksQuestions && assessment.usesEncouragingWords) {
    lines.push('   ✅ Meets basic Socratic standards');
  } else {
    lines.push('   ⚠️  Some improvements needed');
  }
  
  return lines.join('\n');
}

