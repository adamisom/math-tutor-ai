/**
 * Unit Tests for Extraction Handlers
 * 
 * Tests all extraction result handler functions
 */

import { describe, it, expect, vi } from 'vitest';
import {
  handleSingleProblem,
  handleTwoProblems,
  handleMultipleProblems,
  handleSolutionDetected,
  handleUnclearImage,
  ExtractionHandlerContext,
} from '../../app/lib/extraction-handlers';
import { ImageExtractionResult } from '../../app/api/chat/image-extract/route';

describe('handleSingleProblem', () => {
  it('should set user message and submit problem', async () => {
    const mockContext: ExtractionHandlerContext = {
      setMessages: vi.fn(),
      setPendingProblems: vi.fn(),
      setConversationState: vi.fn(),
      setExtractionText: vi.fn(),
      submitProblem: vi.fn().mockResolvedValue(undefined),
    };
    
    const result: ImageExtractionResult = {
      type: 'SINGLE_PROBLEM',
      confidence: 'high',
      problems: ['2x + 5 = 13'],
    };
    
    await handleSingleProblem(result, mockContext);
    
    expect(mockContext.setMessages).toHaveBeenCalledTimes(1);
    const setMessagesCall = mockContext.setMessages.mock.calls[0][0];
    expect(setMessagesCall).toHaveLength(1);
    expect(setMessagesCall[0]).toMatchObject({
      role: 'user',
      content: '2x + 5 = 13',
    });
    expect(mockContext.submitProblem).toHaveBeenCalledWith('2x + 5 = 13');
  });

  it('should not submit if problem text is empty', async () => {
    const mockContext: ExtractionHandlerContext = {
      setMessages: vi.fn(),
      setPendingProblems: vi.fn(),
      setConversationState: vi.fn(),
      setExtractionText: vi.fn(),
      submitProblem: vi.fn(),
    };
    
    const result: ImageExtractionResult = {
      type: 'SINGLE_PROBLEM',
      confidence: 'high',
      problems: [''],
    };
    
    await handleSingleProblem(result, mockContext);
    
    expect(mockContext.submitProblem).not.toHaveBeenCalled();
  });

  it('should not submit if problems array is empty', async () => {
    const mockContext: ExtractionHandlerContext = {
      setMessages: vi.fn(),
      setPendingProblems: vi.fn(),
      setConversationState: vi.fn(),
      setExtractionText: vi.fn(),
      submitProblem: vi.fn(),
    };
    
    const result: ImageExtractionResult = {
      type: 'SINGLE_PROBLEM',
      confidence: 'high',
      problems: [],
    };
    
    await handleSingleProblem(result, mockContext);
    
    expect(mockContext.submitProblem).not.toHaveBeenCalled();
  });
});

describe('handleTwoProblems', () => {
  it('should set pending problems and change state to PROBLEM_SELECTION', () => {
    const mockContext: ExtractionHandlerContext = {
      setMessages: vi.fn(),
      setPendingProblems: vi.fn(),
      setConversationState: vi.fn(),
      setExtractionText: vi.fn(),
      submitProblem: vi.fn(),
    };
    
    const result: ImageExtractionResult = {
      type: 'TWO_PROBLEMS',
      confidence: 'high',
      problems: ['Problem 1', 'Problem 2'],
    };
    
    handleTwoProblems(result, mockContext);
    
    expect(mockContext.setPendingProblems).toHaveBeenCalledWith([
      { id: 'problem-0', problem: 'Problem 1' },
      { id: 'problem-1', problem: 'Problem 2' },
    ]);
    expect(mockContext.setConversationState).toHaveBeenCalledWith('PROBLEM_SELECTION');
  });

  it('should handle problems with special characters', () => {
    const mockContext: ExtractionHandlerContext = {
      setMessages: vi.fn(),
      setPendingProblems: vi.fn(),
      setConversationState: vi.fn(),
      setExtractionText: vi.fn(),
      submitProblem: vi.fn(),
    };
    
    const result: ImageExtractionResult = {
      type: 'TWO_PROBLEMS',
      confidence: 'high',
      problems: ['Solve: 2x + 5 = 13', 'Find area: length=8, width=5'],
    };
    
    handleTwoProblems(result, mockContext);
    
    expect(mockContext.setPendingProblems).toHaveBeenCalledWith([
      { id: 'problem-0', problem: 'Solve: 2x + 5 = 13' },
      { id: 'problem-1', problem: 'Find area: length=8, width=5' },
    ]);
  });
});

describe('handleMultipleProblems', () => {
  it('should set assistant message about multiple problems', () => {
    const mockContext: ExtractionHandlerContext = {
      setMessages: vi.fn(),
      setPendingProblems: vi.fn(),
      setConversationState: vi.fn(),
      setExtractionText: vi.fn(),
      submitProblem: vi.fn(),
    };
    
    const result: ImageExtractionResult = {
      type: 'MULTIPLE_PROBLEMS',
      confidence: 'high',
      problems: ['p1', 'p2', 'p3'],
    };
    
    handleMultipleProblems(result, mockContext);
    
    expect(mockContext.setMessages).toHaveBeenCalledTimes(1);
    const setMessagesCall = mockContext.setMessages.mock.calls[0][0];
    expect(setMessagesCall).toHaveLength(1);
    expect(setMessagesCall[0]).toMatchObject({
      role: 'assistant',
    });
    expect(setMessagesCall[0].content).toContain('several math problems');
  });

  it('should not call other context methods', () => {
    const mockContext: ExtractionHandlerContext = {
      setMessages: vi.fn(),
      setPendingProblems: vi.fn(),
      setConversationState: vi.fn(),
      setExtractionText: vi.fn(),
      submitProblem: vi.fn(),
    };
    
    const result: ImageExtractionResult = {
      type: 'MULTIPLE_PROBLEMS',
      confidence: 'high',
      problems: ['p1', 'p2', 'p3'],
    };
    
    handleMultipleProblems(result, mockContext);
    
    expect(mockContext.setPendingProblems).not.toHaveBeenCalled();
    expect(mockContext.setConversationState).not.toHaveBeenCalled();
    expect(mockContext.setExtractionText).not.toHaveBeenCalled();
    expect(mockContext.submitProblem).not.toHaveBeenCalled();
  });
});

describe('handleSolutionDetected', () => {
  it('should set assistant message about solution detected', () => {
    const mockContext: ExtractionHandlerContext = {
      setMessages: vi.fn(),
      setPendingProblems: vi.fn(),
      setConversationState: vi.fn(),
      setExtractionText: vi.fn(),
      submitProblem: vi.fn(),
    };
    
    const result: ImageExtractionResult = {
      type: 'SOLUTION_DETECTED',
      confidence: 'high',
      problems: [],
    };
    
    handleSolutionDetected(result, mockContext);
    
    expect(mockContext.setMessages).toHaveBeenCalledTimes(1);
    const setMessagesCall = mockContext.setMessages.mock.calls[0][0];
    expect(setMessagesCall).toHaveLength(1);
    expect(setMessagesCall[0]).toMatchObject({
      role: 'assistant',
    });
    expect(setMessagesCall[0].content).toContain('solution or completed homework');
  });

  it('should not call other context methods', () => {
    const mockContext: ExtractionHandlerContext = {
      setMessages: vi.fn(),
      setPendingProblems: vi.fn(),
      setConversationState: vi.fn(),
      setExtractionText: vi.fn(),
      submitProblem: vi.fn(),
    };
    
    const result: ImageExtractionResult = {
      type: 'SOLUTION_DETECTED',
      confidence: 'high',
      problems: [],
    };
    
    handleSolutionDetected(result, mockContext);
    
    expect(mockContext.setPendingProblems).not.toHaveBeenCalled();
    expect(mockContext.setConversationState).not.toHaveBeenCalled();
    expect(mockContext.setExtractionText).not.toHaveBeenCalled();
    expect(mockContext.submitProblem).not.toHaveBeenCalled();
  });
});

describe('handleUnclearImage', () => {
  it('should set extraction text and state to EXTRACTION_CONFIRMATION when low confidence', () => {
    const mockContext: ExtractionHandlerContext = {
      setMessages: vi.fn(),
      setPendingProblems: vi.fn(),
      setConversationState: vi.fn(),
      setExtractionText: vi.fn(),
      submitProblem: vi.fn(),
    };
    
    const result: ImageExtractionResult = {
      type: 'UNCLEAR_IMAGE',
      confidence: 'low',
      problems: [],
      extracted_text: 'Some extracted text',
    };
    
    handleUnclearImage(result, mockContext);
    
    expect(mockContext.setExtractionText).toHaveBeenCalledWith('Some extracted text');
    expect(mockContext.setConversationState).toHaveBeenCalledWith('EXTRACTION_CONFIRMATION');
    expect(mockContext.setMessages).not.toHaveBeenCalled();
  });

  it('should set assistant message when no extracted text', () => {
    const mockContext: ExtractionHandlerContext = {
      setMessages: vi.fn(),
      setPendingProblems: vi.fn(),
      setConversationState: vi.fn(),
      setExtractionText: vi.fn(),
      submitProblem: vi.fn(),
    };
    
    const result: ImageExtractionResult = {
      type: 'UNCLEAR_IMAGE',
      confidence: 'low',
      problems: [],
    };
    
    handleUnclearImage(result, mockContext);
    
    expect(mockContext.setMessages).toHaveBeenCalledTimes(1);
    const setMessagesCall = mockContext.setMessages.mock.calls[0][0];
    expect(setMessagesCall[0].content).toContain('having trouble reading');
    expect(mockContext.setExtractionText).not.toHaveBeenCalled();
  });

  it('should set assistant message when high confidence', () => {
    const mockContext: ExtractionHandlerContext = {
      setMessages: vi.fn(),
      setPendingProblems: vi.fn(),
      setConversationState: vi.fn(),
      setExtractionText: vi.fn(),
      submitProblem: vi.fn(),
    };
    
    const result: ImageExtractionResult = {
      type: 'UNCLEAR_IMAGE',
      confidence: 'high',
      problems: [],
      extracted_text: 'Some text',
    };
    
    handleUnclearImage(result, mockContext);
    
    expect(mockContext.setMessages).toHaveBeenCalledTimes(1);
    expect(mockContext.setExtractionText).not.toHaveBeenCalled();
    expect(mockContext.setConversationState).not.toHaveBeenCalled();
  });

  it('should set assistant message when medium confidence', () => {
    const mockContext: ExtractionHandlerContext = {
      setMessages: vi.fn(),
      setPendingProblems: vi.fn(),
      setConversationState: vi.fn(),
      setExtractionText: vi.fn(),
      submitProblem: vi.fn(),
    };
    
    const result: ImageExtractionResult = {
      type: 'UNCLEAR_IMAGE',
      confidence: 'medium',
      problems: [],
      extracted_text: 'Some text',
    };
    
    handleUnclearImage(result, mockContext);
    
    expect(mockContext.setMessages).toHaveBeenCalledTimes(1);
    expect(mockContext.setExtractionText).not.toHaveBeenCalled();
  });
});

