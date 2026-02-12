/**
 * Tool Definition Schema for LLM Autonomous Retrieval
 *
 * Defines the function calling tools that LLMs can use to autonomously
 * retrieve content from Tier 3 cold storage during generation.
 *
 * These tools follow the JSON Schema format compatible with both
 * Claude (Anthropic) and OpenAI function calling APIs.
 *
 * @module tool-definitions
 */

/**
 * JSON Schema parameter definition for tool inputs
 */
export interface ToolParameter {
  /** Parameter type */
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  /** Human-readable description for LLM */
  description: string;
  /** Allowed values (for enum types) */
  enum?: string[];
  /** Array item type (for array types) */
  items?: ToolParameter;
  /** Default value if not provided */
  default?: unknown;
}

/**
 * Tool definition schema compatible with LLM function calling
 */
export interface ToolDefinition {
  /** Unique tool name (snake_case) */
  name: string;
  /** Detailed description for LLM to understand when to use */
  description: string;
  /** Input parameters schema */
  parameters: {
    type: 'object';
    properties: Record<string, ToolParameter>;
    required: string[];
  };
}

/**
 * Tool call request from LLM
 */
export interface ToolCall {
  /** Unique ID for this tool call (from LLM) */
  id: string;
  /** Tool name to execute */
  name: string;
  /** Arguments provided by LLM */
  arguments: Record<string, unknown>;
}

/**
 * Core dissertation tools for autonomous retrieval
 *
 * These 4 tools provide comprehensive access to Tier 3 cold storage:
 * 1. searchDissertation - Semantic search across full corpus
 * 2. getCitation - Retrieve specific citation with full details
 * 3. getFullSection - Retrieve complete section text
 * 4. listAvailableSources - Browse available sources
 */
export const DISSERTATION_TOOLS: ToolDefinition[] = [
  {
    name: 'searchDissertation',
    description: `Search the complete dissertation for relevant passages using semantic search.
Use this tool when you need to:
- Find prior discussions of a concept
- Locate evidence or arguments from earlier chapters
- Discover connections across chapters
- Verify what has already been established

The search returns passages ranked by relevance with source information.
You can optionally restrict the search to specific chapters.`,
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'Natural language search query. Be specific about the concept, term, or argument you are looking for. Examples: "phantasia and temporal synthesis", "Heidegger ecstatic temporality", "Aristotle De Anima III.3"',
        },
        topK: {
          type: 'number',
          description:
            'Number of results to retrieve (default: 5, max: 10). Use fewer results for specific queries, more for exploratory searches.',
          default: 5,
        },
        chapters: {
          type: 'array',
          description:
            'Optional: Restrict search to specific chapters. Provide chapter numbers as an array, e.g., [1, 2] to search only chapters 1 and 2.',
          items: { type: 'number', description: 'Chapter number' },
        },
        minRelevance: {
          type: 'number',
          description:
            'Minimum relevance score threshold (0-1, default: 0.7). Higher values return more precise but fewer results.',
          default: 0.7,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'getCitation',
    description: `Retrieve a specific citation with complete bibliographic details and page numbers.
Use this tool when you need to:
- Get exact page numbers for a citation
- Verify a source exists in the corpus
- Get the full APA citation format
- Access abstract or relevant excerpt

Provide the source identifier (e.g., "heidegger-being-time-1962" or "aristotle-de-anima").
If you're unsure of the exact sourceId, use listAvailableSources first.`,
    parameters: {
      type: 'object',
      properties: {
        sourceId: {
          type: 'string',
          description:
            'Citation identifier. Format: "author-title-year" or similar unique identifier. Examples: "heidegger-being-time-1962", "aristotle-de-anima", "husserl-time-consciousness-1991"',
        },
        includeAbstract: {
          type: 'boolean',
          description:
            'Whether to include abstract or key excerpt (default: true)',
          default: true,
        },
      },
      required: ['sourceId'],
    },
  },
  {
    name: 'getFullSection',
    description: `Retrieve the complete text of a prior section for detailed reference.
Use this tool when you need to:
- Review exactly what was written in a previous section
- Ensure consistency with prior arguments
- Quote or paraphrase from earlier chapters
- Verify cross-references are accurate

This returns the full section text, which may be long.
Use sparingly and only when you need the complete text.
For finding specific passages, use searchDissertation instead.`,
    parameters: {
      type: 'object',
      properties: {
        chapter: {
          type: 'number',
          description: 'Chapter number (e.g., 1, 2, 3)',
        },
        sectionName: {
          type: 'string',
          description:
            'Name of the section to retrieve. Examples: "Introduction", "Phantasia Definition", "Temporal Synthesis"',
        },
        maxLength: {
          type: 'number',
          description:
            'Maximum characters to return (default: 5000). Use to limit very long sections.',
          default: 5000,
        },
      },
      required: ['chapter', 'sectionName'],
    },
  },
  {
    name: 'listAvailableSources',
    description: `List all sources available in the dissertation corpus.
Use this tool when you need to:
- Find the correct sourceId for getCitation
- Discover what sources are available
- Check if a specific author/work is in the corpus
- Browse primary vs secondary sources

You can optionally filter by author, title, or year.`,
    parameters: {
      type: 'object',
      properties: {
        filter: {
          type: 'string',
          description:
            'Optional filter by author name, title keyword, or year. Examples: "Heidegger", "Being and Time", "1962"',
        },
        type: {
          type: 'string',
          description: 'Filter by source type',
          enum: ['primary', 'secondary', 'all'],
          default: 'all',
        },
        limit: {
          type: 'number',
          description: 'Maximum sources to return (default: 20)',
          default: 20,
        },
      },
      required: [],
    },
  },
];

/**
 * Get tool definition by name
 */
export function getToolDefinition(name: string): ToolDefinition | undefined {
  return DISSERTATION_TOOLS.find((t) => t.name === name);
}

/**
 * Validate tool call arguments against schema
 */
export function validateToolCall(toolCall: ToolCall): {
  valid: boolean;
  errors: string[];
} {
  const toolDef = getToolDefinition(toolCall.name);
  const errors: string[] = [];

  if (!toolDef) {
    return { valid: false, errors: [`Unknown tool: ${toolCall.name}`] };
  }

  // Check required parameters
  for (const required of toolDef.parameters.required) {
    if (!(required in toolCall.arguments)) {
      errors.push(`Missing required parameter: ${required}`);
    }
  }

  // Check parameter types
  for (const [key, value] of Object.entries(toolCall.arguments)) {
    const paramDef = toolDef.parameters.properties[key];
    if (!paramDef) {
      errors.push(`Unknown parameter: ${key}`);
      continue;
    }

    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (paramDef.type !== actualType && value !== undefined) {
      errors.push(
        `Parameter ${key} should be ${paramDef.type}, got ${actualType}`
      );
    }

    // Check enum values
    if (paramDef.enum && !paramDef.enum.includes(value as string)) {
      errors.push(
        `Parameter ${key} must be one of: ${paramDef.enum.join(', ')}`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Convert tool definitions to Claude format
 */
export function toClaudeFormat(): Array<{
  name: string;
  description: string;
  input_schema: object;
}> {
  return DISSERTATION_TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters,
  }));
}

/**
 * Convert tool definitions to OpenAI format
 */
export function toOpenAIFormat(): Array<{
  type: 'function';
  function: { name: string; description: string; parameters: object };
}> {
  return DISSERTATION_TOOLS.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}

/**
 * Get tool names as a list
 */
export function getToolNames(): string[] {
  return DISSERTATION_TOOLS.map((t) => t.name);
}
