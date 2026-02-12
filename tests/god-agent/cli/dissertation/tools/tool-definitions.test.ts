/**
 * Tests for Tool Definitions
 */

import { describe, it, expect } from 'vitest';
import {
  DISSERTATION_TOOLS,
  getToolDefinition,
  validateToolCall,
  toClaudeFormat,
  toOpenAIFormat,
  getToolNames,
  type ToolCall,
} from '../../../../../src/god-agent/cli/dissertation/tools/tool-definitions.js';

describe('Tool Definitions', () => {
  describe('DISSERTATION_TOOLS', () => {
    it('should define exactly 4 tools', () => {
      expect(DISSERTATION_TOOLS).toHaveLength(4);
    });

    it('should include searchDissertation tool', () => {
      const tool = DISSERTATION_TOOLS.find((t) => t.name === 'searchDissertation');
      expect(tool).toBeDefined();
      expect(tool?.parameters.required).toContain('query');
    });

    it('should include getCitation tool', () => {
      const tool = DISSERTATION_TOOLS.find((t) => t.name === 'getCitation');
      expect(tool).toBeDefined();
      expect(tool?.parameters.required).toContain('sourceId');
    });

    it('should include getFullSection tool', () => {
      const tool = DISSERTATION_TOOLS.find((t) => t.name === 'getFullSection');
      expect(tool).toBeDefined();
      expect(tool?.parameters.required).toContain('chapter');
      expect(tool?.parameters.required).toContain('sectionName');
    });

    it('should include listAvailableSources tool', () => {
      const tool = DISSERTATION_TOOLS.find((t) => t.name === 'listAvailableSources');
      expect(tool).toBeDefined();
      expect(tool?.parameters.required).toEqual([]);
    });

    it('should have descriptions for all tools', () => {
      DISSERTATION_TOOLS.forEach((tool) => {
        expect(tool.description).toBeTruthy();
        expect(tool.description.length).toBeGreaterThan(50);
      });
    });

    it('should have valid parameter schemas', () => {
      DISSERTATION_TOOLS.forEach((tool) => {
        expect(tool.parameters.type).toBe('object');
        expect(tool.parameters.properties).toBeDefined();
        expect(Array.isArray(tool.parameters.required)).toBe(true);
      });
    });
  });

  describe('getToolDefinition', () => {
    it('should return tool definition by name', () => {
      const tool = getToolDefinition('searchDissertation');
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('searchDissertation');
    });

    it('should return undefined for unknown tool', () => {
      const tool = getToolDefinition('unknownTool');
      expect(tool).toBeUndefined();
    });
  });

  describe('validateToolCall', () => {
    it('should validate a valid searchDissertation call', () => {
      const toolCall: ToolCall = {
        id: 'test_1',
        name: 'searchDissertation',
        arguments: { query: 'phantasia temporal synthesis' },
      };

      const result = validateToolCall(toolCall);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate a valid getCitation call', () => {
      const toolCall: ToolCall = {
        id: 'test_2',
        name: 'getCitation',
        arguments: { sourceId: 'heidegger-being-time-1962' },
      };

      const result = validateToolCall(toolCall);
      expect(result.valid).toBe(true);
    });

    it('should validate a valid getFullSection call', () => {
      const toolCall: ToolCall = {
        id: 'test_3',
        name: 'getFullSection',
        arguments: { chapter: 3, sectionName: 'Introduction' },
      };

      const result = validateToolCall(toolCall);
      expect(result.valid).toBe(true);
    });

    it('should validate a valid listAvailableSources call (no required params)', () => {
      const toolCall: ToolCall = {
        id: 'test_4',
        name: 'listAvailableSources',
        arguments: {},
      };

      const result = validateToolCall(toolCall);
      expect(result.valid).toBe(true);
    });

    it('should reject unknown tool', () => {
      const toolCall: ToolCall = {
        id: 'test_5',
        name: 'unknownTool',
        arguments: {},
      };

      const result = validateToolCall(toolCall);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Unknown tool: unknownTool');
    });

    it('should reject missing required parameter', () => {
      const toolCall: ToolCall = {
        id: 'test_6',
        name: 'searchDissertation',
        arguments: {},
      };

      const result = validateToolCall(toolCall);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required parameter: query');
    });

    it('should reject wrong parameter type', () => {
      const toolCall: ToolCall = {
        id: 'test_7',
        name: 'searchDissertation',
        arguments: { query: 'test', topK: 'five' },
      };

      const result = validateToolCall(toolCall);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('topK'))).toBe(true);
    });

    it('should reject invalid enum value', () => {
      const toolCall: ToolCall = {
        id: 'test_8',
        name: 'listAvailableSources',
        arguments: { type: 'tertiary' },
      };

      const result = validateToolCall(toolCall);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('type'))).toBe(true);
    });

    it('should accept optional parameters', () => {
      const toolCall: ToolCall = {
        id: 'test_9',
        name: 'searchDissertation',
        arguments: {
          query: 'test',
          topK: 10,
          chapters: [1, 2],
          minRelevance: 0.8,
        },
      };

      const result = validateToolCall(toolCall);
      expect(result.valid).toBe(true);
    });
  });

  describe('toClaudeFormat', () => {
    it('should convert tools to Claude format', () => {
      const claudeTools = toClaudeFormat();

      expect(claudeTools).toHaveLength(4);
      claudeTools.forEach((tool) => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('input_schema');
      });
    });

    it('should have valid input_schema for each tool', () => {
      const claudeTools = toClaudeFormat();

      claudeTools.forEach((tool) => {
        expect(tool.input_schema).toHaveProperty('type', 'object');
        expect(tool.input_schema).toHaveProperty('properties');
        expect(tool.input_schema).toHaveProperty('required');
      });
    });
  });

  describe('toOpenAIFormat', () => {
    it('should convert tools to OpenAI format', () => {
      const openAITools = toOpenAIFormat();

      expect(openAITools).toHaveLength(4);
      openAITools.forEach((tool) => {
        expect(tool.type).toBe('function');
        expect(tool.function).toHaveProperty('name');
        expect(tool.function).toHaveProperty('description');
        expect(tool.function).toHaveProperty('parameters');
      });
    });
  });

  describe('getToolNames', () => {
    it('should return array of tool names', () => {
      const names = getToolNames();

      expect(names).toHaveLength(4);
      expect(names).toContain('searchDissertation');
      expect(names).toContain('getCitation');
      expect(names).toContain('getFullSection');
      expect(names).toContain('listAvailableSources');
    });
  });
});
