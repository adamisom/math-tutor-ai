/**
 * Tool Call Injection for Development Mode
 * 
 * Injects tool call and result information into the conversation stream
 * for testing and debugging purposes. Only active in development mode.
 */

// Shared constants for tool call markers (used by both server and client)
export const TOOL_CALL_MARKERS = {
  START: '[TOOL_CALL_START]',
  END: '[TOOL_CALL_END]',
  RESULT_START: '[TOOL_RESULT_START]',
  RESULT_END: '[TOOL_RESULT_END]',
} as const;

/**
 * Strip tool call markers from message content
 * Prevents markers from being included in conversation history sent to Claude
 */
export function stripToolCallMarkers(content: string): string {
  let cleaned = content;
  
  // Remove tool call blocks
  const toolCallStart = TOOL_CALL_MARKERS.START;
  const toolCallEnd = TOOL_CALL_MARKERS.END;
  while (cleaned.includes(toolCallStart)) {
    const startIdx = cleaned.indexOf(toolCallStart);
    const afterStart = cleaned.substring(startIdx + toolCallStart.length);
    const endIdx = afterStart.indexOf(toolCallEnd);
    
    if (endIdx !== -1) {
      // Remove the entire block including markers
      const before = cleaned.substring(0, startIdx);
      const after = afterStart.substring(endIdx + toolCallEnd.length);
      cleaned = before + after;
    } else {
      // End marker not found, just remove start marker
      cleaned = cleaned.substring(0, startIdx) + cleaned.substring(startIdx + toolCallStart.length);
    }
  }
  
  // Remove tool result blocks
  const toolResultStart = TOOL_CALL_MARKERS.RESULT_START;
  const toolResultEnd = TOOL_CALL_MARKERS.RESULT_END;
  while (cleaned.includes(toolResultStart)) {
    const startIdx = cleaned.indexOf(toolResultStart);
    const afterStart = cleaned.substring(startIdx + toolResultStart.length);
    const endIdx = afterStart.indexOf(toolResultEnd);
    
    if (endIdx !== -1) {
      // Remove the entire block including markers
      const before = cleaned.substring(0, startIdx);
      const after = afterStart.substring(endIdx + toolResultEnd.length);
      cleaned = before + after;
    } else {
      // End marker not found, just remove start marker
      cleaned = cleaned.substring(0, startIdx) + cleaned.substring(startIdx + toolResultStart.length);
    }
  }
  
  return cleaned.trim();
}

export interface ToolCall {
  toolName: string;
  args: Record<string, unknown>;
}

export interface ContentPart {
  type: 'text' | 'tool-call' | 'tool-result';
  content: string;
  header?: string;
}

interface InjectionConfig {
  encoder: TextEncoder;
  controller: ReadableStreamDefaultController<Uint8Array>;
}

export class ToolCallInjector {
  private readonly isDevelopment: boolean;
  private readonly encoder: TextEncoder;
  private readonly controller: ReadableStreamDefaultController<Uint8Array>;
  private readonly injectedToolCalls = new Set<string>();
  private readonly injectedToolResults = new Set<string>();
  private currentToolCall: ToolCall | null = null;

  constructor(config: InjectionConfig) {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.encoder = config.encoder;
    this.controller = config.controller;
  }

  /**
   * Handle tool call chunk - store info and inject into stream if needed
   */
  handleToolCall(toolName: string, input: Record<string, unknown>, toolCallId?: string): void {
    if (!this.isDevelopment) return;

    this.currentToolCall = {
      toolName,
      args: input,
    };

    const identifier = toolCallId || this.createIdentifier(toolName, input);
    if (this.injectedToolCalls.has(identifier)) {
      console.log('[Tool Injector] Skipping duplicate tool call:', identifier);
      return;
    }

    this.injectedToolCalls.add(identifier);
    this.injectToolCall(toolName, input);
    console.log('[Tool Injector] Injected tool call:', toolName, toolCallId ? `(id: ${toolCallId})` : '');
  }

  /**
   * Handle tool result chunk - inject into stream if needed
   */
  handleToolResult(toolName: string, output: unknown, toolCallId?: string): void {
    if (!this.isDevelopment) return;

    const identifier = toolCallId || this.createIdentifier(toolName, output);
    if (this.injectedToolResults.has(identifier)) {
      console.log('[Tool Injector] Skipping duplicate tool result:', identifier);
      return;
    }

    this.injectedToolResults.add(identifier);
    this.injectToolResult(toolName, output);
    console.log('[Tool Injector] Injected tool result:', toolName, toolCallId ? `(id: ${toolCallId})` : '');
    
    // Clear current tool call after result
    this.currentToolCall = null;
  }

  /**
   * Get current tool call info (for continuation scenarios)
   */
  getCurrentToolCall(): ToolCall | null {
    return this.currentToolCall;
  }

  /**
   * Inject tool call information into stream
   * Uses special markers that will be parsed on client side for separate bubble rendering
   */
  private injectToolCall(toolName: string, args: Record<string, unknown>): void {
    const warningMessage = '⚠️ This only shows in developer mode \n';
    const toolCallHeader = `[TOOL CALL] ${toolName}\n`;
    const argsJson = JSON.stringify(args, null, 2);
    // Use special markers that client can parse
    const toolCallInfo = `\n${TOOL_CALL_MARKERS.START}\n${warningMessage}${toolCallHeader}Arguments: ${argsJson}\n${TOOL_CALL_MARKERS.END}\n`;
    
    this.controller.enqueue(this.encoder.encode(toolCallInfo));
  }

  /**
   * Inject tool result information into stream
   * Uses special markers that will be parsed on client side for separate bubble rendering
   */
  private injectToolResult(toolName: string, result: unknown): void {
    const warningMessage = '⚠️ This only shows in developer mode\n';
    const resultJson = JSON.stringify(result, null, 2);
    // Use special markers that client can parse
    const toolResultInfo = `\n${TOOL_CALL_MARKERS.RESULT_START}\n${warningMessage}[TOOL RESULT] ${toolName}\nResult: ${resultJson}\n${TOOL_CALL_MARKERS.RESULT_END}\n`;
    
    this.controller.enqueue(this.encoder.encode(toolResultInfo));
  }

  /**
   * Create unique identifier for deduplication
   */
  private createIdentifier(toolName: string, data: unknown): string {
    try {
      return `${toolName}-${JSON.stringify(data)}`;
    } catch {
      // Fallback if JSON.stringify fails
      return `${toolName}-${Date.now()}`;
    }
  }
}

/**
 * Parse tool call blocks from message content (client-side)
 * Uses simple string methods instead of regex for reliability
 */
export function parseToolCallBlocks(content: string): ContentPart[] {
  const parts: ContentPart[] = [];
  
  // Simple string-based parsing (no regex needed)
  let remaining = content;
  
  while (remaining.length > 0) {
    // Find the next tool call or result marker
    const toolCallStartIndex = remaining.indexOf(TOOL_CALL_MARKERS.START);
    const toolResultStartIndex = remaining.indexOf(TOOL_CALL_MARKERS.RESULT_START);
    
    // Determine which comes first (or if neither exists)
    let nextMatch: { type: 'tool-call' | 'tool-result'; startIndex: number } | null = null;
    
    if (toolCallStartIndex !== -1 && toolResultStartIndex !== -1) {
      // Both exist, pick the earlier one
      nextMatch = toolCallStartIndex < toolResultStartIndex
        ? { type: 'tool-call', startIndex: toolCallStartIndex }
        : { type: 'tool-result', startIndex: toolResultStartIndex };
    } else if (toolCallStartIndex !== -1) {
      nextMatch = { type: 'tool-call', startIndex: toolCallStartIndex };
    } else if (toolResultStartIndex !== -1) {
      nextMatch = { type: 'tool-result', startIndex: toolResultStartIndex };
    }
    
    if (!nextMatch) {
      // No more tool call/result blocks, add remaining as text
      if (remaining.trim()) {
        parts.push({ type: 'text', content: remaining });
      }
      break;
    }
    
    // Add text before the marker
    if (nextMatch.startIndex > 0) {
      const textBefore = remaining.substring(0, nextMatch.startIndex);
      if (textBefore.trim()) {
        parts.push({ type: 'text', content: textBefore });
      }
    }
    
    // Extract the tool call/result block
    const startMarker = nextMatch.type === 'tool-call' 
      ? TOOL_CALL_MARKERS.START 
      : TOOL_CALL_MARKERS.RESULT_START;
    const endMarker = nextMatch.type === 'tool-call'
      ? TOOL_CALL_MARKERS.END
      : TOOL_CALL_MARKERS.RESULT_END;
    
    const afterStart = remaining.substring(nextMatch.startIndex + startMarker.length);
    const endIndex = afterStart.indexOf(endMarker);
    
    if (endIndex === -1) {
      // End marker not found, treat rest as text
      if (remaining.trim()) {
        parts.push({ type: 'text', content: remaining });
      }
      break;
    }
    
    // Extract content between markers
    const blockContent = afterStart.substring(0, endIndex).trim();
    const afterEnd = afterStart.substring(endIndex + endMarker.length);
    
    // Parse the block content (first line is header, rest is body)
    const lines = blockContent.split('\n');
    const header = lines[0] || '';
    const body = lines.slice(1).join('\n').trim();
    
    parts.push({
      type: nextMatch.type,
      header,
      content: body,
    });
    
    // Continue with remaining content
    remaining = afterEnd;
  }
  
  // If no tool call blocks found, return entire content as text
  if (parts.length === 0) {
    return [{ type: 'text', content }];
  }
  
  return parts;
}

