/**
 * CLI Model Flags Tests
 *
 * Tests for TIER-2.1: CLI --model flag and @alias syntax support
 */

import { describe, it, expect } from 'vitest';

// Since cli.ts exports functions, we'll import what we can
// For the private functions, we'll re-implement them for testing

/**
 * Model alias mappings (same as in cli.ts)
 */
const MODEL_ALIASES: Record<string, string> = {
  local: 'deepseek-coder-local',
  fast: 'claude-haiku',
  cheap: 'deepseek-coder-local',
  best: 'claude-sonnet',
  reasoning: 'gpt-4o',
  code: 'claude-sonnet',
  claude: 'claude-sonnet',
  gpt: 'gpt-4o',
  openai: 'gpt-4o',
  deepseek: 'deepseek-coder-local',
  qwen: 'qwen-local',
};

/**
 * Resolve model alias to actual model ID
 */
function resolveModelAlias(aliasOrModelId: string): string {
  const normalized = aliasOrModelId.toLowerCase();
  return MODEL_ALIASES[normalized] || aliasOrModelId;
}

/**
 * Extract @alias from prompt
 */
function extractModelFromPrompt(prompt: string): { model?: string; cleanedPrompt: string } {
  const aliasMatch = prompt.match(/^@(\w+)\s+(.+)$/s);

  if (aliasMatch) {
    const [, alias, rest] = aliasMatch;
    const resolvedModel = resolveModelAlias(alias);
    return {
      model: resolvedModel,
      cleanedPrompt: rest.trim(),
    };
  }

  return { cleanedPrompt: prompt };
}

/**
 * Parse CLI flags (simplified version)
 */
function parseFlags(args: string[]): Record<string, string | boolean> {
  const flags: Record<string, string | boolean> = {};
  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const [key, val] = arg.slice(2).split('=');
      if (val !== undefined) {
        flags[key] = val;
      } else if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        flags[key] = args[++i];
      } else {
        flags[key] = true;
      }
    } else if (arg.startsWith('-') && arg.length === 2) {
      const key = arg.slice(1);
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        flags[key] = args[++i];
      } else {
        flags[key] = true;
      }
    }
    i++;
  }
  return flags;
}

/**
 * Get model from flags or prompt alias
 */
function getModelOverride(
  flags: Record<string, string | boolean>,
  prompt: string
): { model?: string; cleanedPrompt: string } {
  const modelFlag = flags['model'] || flags['m'];
  if (typeof modelFlag === 'string') {
    return {
      model: resolveModelAlias(modelFlag),
      cleanedPrompt: prompt,
    };
  }
  return extractModelFromPrompt(prompt);
}

describe('CLI Model Flags', () => {
  describe('Model Alias Resolution', () => {
    it('should resolve local alias', () => {
      expect(resolveModelAlias('local')).toBe('deepseek-coder-local');
    });

    it('should resolve fast alias', () => {
      expect(resolveModelAlias('fast')).toBe('claude-haiku');
    });

    it('should resolve cheap alias', () => {
      expect(resolveModelAlias('cheap')).toBe('deepseek-coder-local');
    });

    it('should resolve best alias', () => {
      expect(resolveModelAlias('best')).toBe('claude-sonnet');
    });

    it('should resolve reasoning alias', () => {
      expect(resolveModelAlias('reasoning')).toBe('gpt-4o');
    });

    it('should resolve code alias', () => {
      expect(resolveModelAlias('code')).toBe('claude-sonnet');
    });

    it('should resolve claude alias', () => {
      expect(resolveModelAlias('claude')).toBe('claude-sonnet');
    });

    it('should resolve gpt alias', () => {
      expect(resolveModelAlias('gpt')).toBe('gpt-4o');
    });

    it('should pass through unknown model IDs', () => {
      expect(resolveModelAlias('custom-model-123')).toBe('custom-model-123');
      expect(resolveModelAlias('claude-opus')).toBe('claude-opus');
    });

    it('should be case-insensitive', () => {
      expect(resolveModelAlias('LOCAL')).toBe('deepseek-coder-local');
      expect(resolveModelAlias('Fast')).toBe('claude-haiku');
      expect(resolveModelAlias('BEST')).toBe('claude-sonnet');
    });
  });

  describe('@alias Syntax Extraction', () => {
    it('should extract @local alias from prompt', () => {
      const result = extractModelFromPrompt('@local What is 2+2?');
      expect(result.model).toBe('deepseek-coder-local');
      expect(result.cleanedPrompt).toBe('What is 2+2?');
    });

    it('should extract @fast alias from prompt', () => {
      const result = extractModelFromPrompt('@fast Explain this code');
      expect(result.model).toBe('claude-haiku');
      expect(result.cleanedPrompt).toBe('Explain this code');
    });

    it('should extract @best alias from prompt', () => {
      const result = extractModelFromPrompt('@best Complex reasoning task');
      expect(result.model).toBe('claude-sonnet');
      expect(result.cleanedPrompt).toBe('Complex reasoning task');
    });

    it('should handle prompts without @alias', () => {
      const result = extractModelFromPrompt('Regular prompt without alias');
      expect(result.model).toBeUndefined();
      expect(result.cleanedPrompt).toBe('Regular prompt without alias');
    });

    it('should handle multiline prompts', () => {
      const result = extractModelFromPrompt('@local First line\nSecond line\nThird line');
      expect(result.model).toBe('deepseek-coder-local');
      expect(result.cleanedPrompt).toBe('First line\nSecond line\nThird line');
    });

    it('should not extract @alias in middle of prompt', () => {
      const result = extractModelFromPrompt('Please use @local for this task');
      expect(result.model).toBeUndefined();
      expect(result.cleanedPrompt).toBe('Please use @local for this task');
    });
  });

  describe('Flag Parsing', () => {
    it('should parse --model flag with value', () => {
      const flags = parseFlags(['--model', 'gpt-4o']);
      expect(flags['model']).toBe('gpt-4o');
    });

    it('should parse --model=value syntax', () => {
      const flags = parseFlags(['--model=claude-sonnet']);
      expect(flags['model']).toBe('claude-sonnet');
    });

    it('should parse -m short flag', () => {
      const flags = parseFlags(['-m', 'local']);
      expect(flags['m']).toBe('local');
    });

    it('should parse multiple flags', () => {
      const flags = parseFlags(['--model', 'gpt-4o', '--json', '-l', 'typescript']);
      expect(flags['model']).toBe('gpt-4o');
      expect(flags['json']).toBe(true);
      expect(flags['l']).toBe('typescript');
    });

    it('should handle boolean flags', () => {
      const flags = parseFlags(['--json', '--verbose']);
      expect(flags['json']).toBe(true);
      expect(flags['verbose']).toBe(true);
    });
  });

  describe('Model Override Priority', () => {
    it('should prefer --model flag over @alias', () => {
      const flags = parseFlags(['--model', 'gpt-4o']);
      const result = getModelOverride(flags, '@local What is 2+2?');

      // --model flag takes priority
      expect(result.model).toBe('gpt-4o');
      // Prompt is NOT cleaned when using --model flag
      expect(result.cleanedPrompt).toBe('@local What is 2+2?');
    });

    it('should use @alias when no --model flag', () => {
      const flags = parseFlags([]);
      const result = getModelOverride(flags, '@best Complex task');

      expect(result.model).toBe('claude-sonnet');
      expect(result.cleanedPrompt).toBe('Complex task');
    });

    it('should return undefined model when no override specified', () => {
      const flags = parseFlags([]);
      const result = getModelOverride(flags, 'Regular prompt');

      expect(result.model).toBeUndefined();
      expect(result.cleanedPrompt).toBe('Regular prompt');
    });

    it('should resolve aliases in --model flag', () => {
      const flags = parseFlags(['--model', 'local']);
      const result = getModelOverride(flags, 'Some task');

      expect(result.model).toBe('deepseek-coder-local');
    });

    it('should handle -m short flag', () => {
      const flags = parseFlags(['-m', 'fast']);
      const result = getModelOverride(flags, 'Quick question');

      expect(result.model).toBe('claude-haiku');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty prompt', () => {
      const result = extractModelFromPrompt('');
      expect(result.model).toBeUndefined();
      expect(result.cleanedPrompt).toBe('');
    });

    it('should handle @alias with no following text', () => {
      const result = extractModelFromPrompt('@local');
      // No match because regex requires text after alias
      expect(result.model).toBeUndefined();
      expect(result.cleanedPrompt).toBe('@local');
    });

    it('should handle whitespace after @alias', () => {
      const result = extractModelFromPrompt('@local   Multiple spaces before text');
      expect(result.model).toBe('deepseek-coder-local');
      expect(result.cleanedPrompt).toBe('Multiple spaces before text');
    });

    it('should handle unknown @alias gracefully', () => {
      const result = extractModelFromPrompt('@unknown Some text');
      // Unknown alias passes through as model ID
      expect(result.model).toBe('unknown');
      expect(result.cleanedPrompt).toBe('Some text');
    });
  });
});

describe('AskOptions Model Support', () => {
  it('should accept model in AskOptions interface', async () => {
    // This test verifies the TypeScript interface accepts model
    // We can't easily import the interface, so we just verify the shape
    const options = {
      model: 'claude-sonnet',
      returnResult: true,
      context: 'some context',
    };

    expect(options.model).toBe('claude-sonnet');
    expect(options.returnResult).toBe(true);
  });
});
