/**
 * Extraction result handlers for different extraction types
 * These functions handle the UI state updates for each extraction result type
 */

import { Problem } from '../components/problem-selector';
import { ImageExtractionResult } from '../api/chat/image-extract/route';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface ExtractionHandlerContext {
  setMessages: (messages: Message[]) => void;
  setPendingProblems: (problems: Problem[]) => void;
  setConversationState: (state: 'CHATTING' | 'PROBLEM_SELECTION' | 'EXTRACTION_CONFIRMATION') => void;
  setExtractionText: (text: string) => void;
  submitProblem: (problemText: string) => Promise<void>;
}

/**
 * Handle single problem extraction
 */
export async function handleSingleProblem(
  result: ImageExtractionResult,
  context: ExtractionHandlerContext
): Promise<void> {
  const problemText = result.problems[0] || '';
  if (problemText) {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: problemText,
    };
    context.setMessages([userMessage]);
    await context.submitProblem(problemText);
  }
}

/**
 * Handle two problems extraction
 */
export function handleTwoProblems(
  result: ImageExtractionResult,
  context: ExtractionHandlerContext
): void {
  const problems: Problem[] = result.problems.map((p: string, idx: number) => ({
    id: `problem-${idx}`,
    problem: p,
  }));
  context.setPendingProblems(problems);
  context.setConversationState('PROBLEM_SELECTION');
}

/**
 * Handle multiple problems extraction
 */
export function handleMultipleProblems(
  _result: ImageExtractionResult,
  context: ExtractionHandlerContext
): void {
  const assistantMessage: Message = {
    id: Date.now().toString(),
    role: 'assistant',
    content: "I see several math problems in this image. For the best learning experience, please upload an image with just one problem at a time, or type the problem you'd like to work on.",
  };
  context.setMessages([assistantMessage]);
}

/**
 * Handle solution detected
 */
export function handleSolutionDetected(
  _result: ImageExtractionResult,
  context: ExtractionHandlerContext
): void {
  const assistantMessage: Message = {
    id: Date.now().toString(),
    role: 'assistant',
    content: "It looks like you uploaded a solution or completed homework. I'm here to help you learn, not check answers. Could you upload the original problem instead, or type it below?",
  };
  context.setMessages([assistantMessage]);
}

/**
 * Handle unclear image extraction
 */
export function handleUnclearImage(
  result: ImageExtractionResult,
  context: ExtractionHandlerContext
): void {
  if (result.extracted_text && result.confidence === 'low') {
    context.setExtractionText(result.extracted_text);
    context.setConversationState('EXTRACTION_CONFIRMATION');
  } else {
    const assistantMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: "I'm having trouble reading this image. Please try uploading a clearer photo, make sure the text is visible and well-lit, or type the problem below.",
    };
    context.setMessages([assistantMessage]);
  }
}

/**
 * Handler map for extraction result types
 */
export const extractionHandlers: Record<
  ImageExtractionResult['type'],
  (result: ImageExtractionResult, context: ExtractionHandlerContext) => void | Promise<void>
> = {
  SINGLE_PROBLEM: handleSingleProblem,
  TWO_PROBLEMS: handleTwoProblems,
  MULTIPLE_PROBLEMS: handleMultipleProblems,
  SOLUTION_DETECTED: handleSolutionDetected,
  UNCLEAR_IMAGE: handleUnclearImage,
};

