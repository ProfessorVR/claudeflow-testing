/**
 * LLM Client Adapters for Autonomous Retrieval
 *
 * Provides adapters for different LLM providers:
 * - ClaudeClient: Anthropic Claude (Sonnet/Opus)
 * - OpenAIClient: OpenAI and vLLM-compatible endpoints
 *
 * Each adapter implements the common LLMClient interface,
 * converting provider-specific responses to our standard format.
 *
 * @module llm-clients
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import {
  type LLMClient,
  type LLMResponse,
  type GenerateOptions,
} from './retrieval-orchestrator.js';
import { type ToolCall } from './tool-definitions.js';

/**
 * Claude client adapter for Anthropic API
 */
export class ClaudeClient implements LLMClient {
  private client: Anthropic;
  private defaultModel: string;

  constructor(apiKey?: string, defaultModel?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
    this.defaultModel = defaultModel || 'claude-sonnet-4-5-20250929';
  }

  async generate(
    prompt: string,
    options: GenerateOptions = {}
  ): Promise<LLMResponse> {
    try {
      const response = await this.client.messages.create({
        model: options.model || this.defaultModel,
        max_tokens: options.maxTokens || 4000,
        temperature: options.temperature ?? 0.7,
        messages: [{ role: 'user', content: prompt }],
        tools: options.tools
          ? this.convertToClaudeTools(options.tools)
          : undefined,
      });

      // Extract tool calls
      const toolCalls: ToolCall[] = response.content
        .filter((block) => block.type === 'tool_use')
        .map((block) => ({
          id: block.id,
          name: block.name,
          arguments: block.input as Record<string, unknown>,
        }));

      // Extract text content
      const textContent = response.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('\n');

      return {
        content: textContent,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        stopReason: this.mapClaudeStopReason(response.stop_reason),
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      };
    } catch (error) {
      throw new Error(
        `Claude API error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Convert generic tools to Claude format
   */
  private convertToClaudeTools(tools: unknown[]): Anthropic.Tool[] {
    return (tools as any[]).map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.input_schema || tool.parameters,
    }));
  }

  /**
   * Map Claude stop reason to our standard format
   */
  private mapClaudeStopReason(
    reason: string
  ): 'end_turn' | 'tool_calls' | 'max_tokens' | 'stop_sequence' {
    switch (reason) {
      case 'end_turn':
        return 'end_turn';
      case 'tool_use':
        return 'tool_calls';
      case 'max_tokens':
        return 'max_tokens';
      case 'stop_sequence':
        return 'stop_sequence';
      default:
        return 'end_turn';
    }
  }
}

/**
 * OpenAI client adapter (works with OpenAI API and vLLM)
 */
export class OpenAIClient implements LLMClient {
  private client: OpenAI;
  private defaultModel: string;

  constructor(baseURL?: string, apiKey?: string, defaultModel?: string) {
    this.client = new OpenAI({
      baseURL: baseURL || process.env.OPENAI_BASE_URL,
      apiKey: apiKey || process.env.OPENAI_API_KEY || 'dummy-key',
    });
    this.defaultModel = defaultModel || 'gpt-4';
  }

  async generate(
    prompt: string,
    options: GenerateOptions = {}
  ): Promise<LLMResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: options.model || this.defaultModel,
        max_tokens: options.maxTokens || 4000,
        temperature: options.temperature ?? 0.7,
        messages: [{ role: 'user', content: prompt }],
        tools: options.tools
          ? this.convertToOpenAITools(options.tools)
          : undefined,
      });

      const message = response.choices[0].message;

      // Extract tool calls - support both native and custom parsing
      let toolCalls: ToolCall[] | undefined = message.tool_calls?.map((tc) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments),
      }));

      // Custom parser for models like Qwen that output tool calls in content
      // Check for empty array or undefined
      if ((!toolCalls || toolCalls.length === 0) && message.content) {
        toolCalls = this.parseToolCallsFromContent(message.content);
      }

      return {
        content: message.content || '',
        toolCalls,
        stopReason: this.mapOpenAIStopReason(response.choices[0].finish_reason),
        usage: {
          inputTokens: response.usage?.prompt_tokens || 0,
          outputTokens: response.usage?.completion_tokens || 0,
        },
      };
    } catch (error) {
      throw new Error(
        `OpenAI API error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Parse tool calls from content field (for models like Qwen)
   * Supports multiple formats:
   * 1. <tools>{"name":"x","arguments":{...}}</tools>
   * 2. <tools>[{...}, {...}]</tools>
   * 3. {"name":"x","arguments":{...}} (pure JSON)
   * 4. [{"name":"x","arguments":{...}}] (JSON array)
   */
  private parseToolCallsFromContent(content: string): ToolCall[] | undefined {
    const toolCalls: ToolCall[] = [];

    // Format 1: Try to extract JSON from <tools> tags
    const toolsMatch = content.match(/<tools>\s*({.*?})\s*(?:<\/tools>)?/s);
    if (toolsMatch) {
      try {
        const toolCall = JSON.parse(toolsMatch[1]);
        if (toolCall.name && toolCall.arguments) {
          toolCalls.push({
            id: 'call_' + Math.random().toString(36).substr(2, 9),
            name: toolCall.name,
            arguments: toolCall.arguments,
          });
        }
      } catch (e) {
        // Invalid JSON, skip
      }
    }

    // Format 2: Try array format with <tools> tags
    const arrayMatch = content.match(/<tools>\s*(\[.*?\])\s*(?:<\/tools>)?/s);
    if (arrayMatch && toolCalls.length === 0) {
      try {
        const toolCallArray = JSON.parse(arrayMatch[1]);
        for (const toolCall of toolCallArray) {
          if (toolCall.name && toolCall.arguments) {
            toolCalls.push({
              id: 'call_' + Math.random().toString(36).substr(2, 9),
              name: toolCall.name,
              arguments: toolCall.arguments,
            });
          }
        }
      } catch (e) {
        // Invalid JSON, skip
      }
    }

    // Format 3 & 4: Try pure JSON (common for Qwen)
    if (toolCalls.length === 0) {
      const trimmed = content.trim();

      // Try parsing as single object
      if (trimmed.startsWith('{')) {
        try {
          const toolCall = JSON.parse(trimmed);
          if (toolCall.name && toolCall.arguments) {
            toolCalls.push({
              id: 'call_' + Math.random().toString(36).substr(2, 9),
              name: toolCall.name,
              arguments: toolCall.arguments,
            });
          }
        } catch (e) {
          // Not valid JSON or wrong structure
        }
      }

      // Try parsing as array
      if (trimmed.startsWith('[') && toolCalls.length === 0) {
        try {
          const toolCallArray = JSON.parse(trimmed);
          for (const toolCall of toolCallArray) {
            if (toolCall.name && toolCall.arguments) {
              toolCalls.push({
                id: 'call_' + Math.random().toString(36).substr(2, 9),
                name: toolCall.name,
                arguments: toolCall.arguments,
              });
            }
          }
        } catch (e) {
          // Not valid JSON array
        }
      }
    }

    return toolCalls.length > 0 ? toolCalls : undefined;
  }

  /**
   * Convert generic tools to OpenAI format
   */
  private convertToOpenAITools(tools: unknown[]): OpenAI.Chat.ChatCompletionTool[] {
    return (tools as any[]).map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters || tool.input_schema,
      },
    }));
  }

  /**
   * Map OpenAI finish reason to our standard format
   */
  private mapOpenAIStopReason(
    reason: string | null
  ): 'end_turn' | 'tool_calls' | 'max_tokens' | 'stop_sequence' {
    switch (reason) {
      case 'stop':
        return 'end_turn';
      case 'tool_calls':
      case 'function_call':
        return 'tool_calls';
      case 'length':
        return 'max_tokens';
      default:
        return 'end_turn';
    }
  }
}

/**
 * Create Claude client with optional API key
 */
export function createClaudeClient(
  apiKey?: string,
  model?: string
): ClaudeClient {
  return new ClaudeClient(apiKey, model);
}

/**
 * Create OpenAI client with optional base URL and API key
 */
export function createOpenAIClient(
  baseURL?: string,
  apiKey?: string,
  model?: string
): OpenAIClient {
  return new OpenAIClient(baseURL, apiKey, model);
}

/**
 * Create vLLM client (OpenAI-compatible)
 */
export function createVLLMClient(
  baseURL: string = 'http://localhost:8002',
  model: string = 'Qwen/Qwen2.5-Coder-32B-Instruct-AWQ'
): OpenAIClient {
  // Ensure baseURL includes /v1 for vLLM compatibility
  const fullBaseURL = baseURL.endsWith('/v1') ? baseURL : `${baseURL}/v1`;
  return new OpenAIClient(fullBaseURL, 'dummy-key', model);
}

/**
 * Auto-detect and create appropriate client based on environment
 */
export function createAutoClient(): LLMClient {
  // Check for Anthropic API key
  if (process.env.ANTHROPIC_API_KEY) {
    console.log('[LLMClient] Using Claude (Anthropic API key found)');
    return new ClaudeClient();
  }

  // Check for OpenAI API key
  if (process.env.OPENAI_API_KEY) {
    console.log('[LLMClient] Using OpenAI (API key found)');
    return new OpenAIClient();
  }

  // Check for vLLM base URL
  if (process.env.VLLM_BASE_URL || process.env.OPENAI_BASE_URL) {
    const baseURL = process.env.VLLM_BASE_URL || process.env.OPENAI_BASE_URL;
    console.log(`[LLMClient] Using vLLM at ${baseURL}`);
    return createVLLMClient(baseURL);
  }

  // Default to local vLLM
  console.log('[LLMClient] No API key found, using local vLLM (http://localhost:8002)');
  return createVLLMClient();
}
