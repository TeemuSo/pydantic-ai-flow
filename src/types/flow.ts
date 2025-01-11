export interface OutputField {
  name: string;
  type: string;
  description?: string;
}

export interface OutputStructure {
  name: string;
  fields: OutputField[];
}

export interface SystemPrompt {
  id: string;
  content: string;
}

export interface AgentConfig {
  label: string;
  modelProvider: 'openai' | 'anthropic' | 'google-gla';
  modelName: string;
  temperature: number;
  maxTokens: number;
  systemPrompts: SystemPrompt[];
  responseTokensLimit: number;
  totalTokensLimit: number;
  outputStructure?: OutputStructure;
  selectedOutputFields?: string[];
  receivedInput?: StructuredOutput;
}

export interface NodeData {
  id?: string;
  type: string;
  config?: AgentConfig;
  onConfigChange?: (config: AgentConfig) => void;
  previousAgentOutput?: StructuredOutput;
}

// Record type for structured output where values can be any primitive type
export type StructuredOutput = Record<string, string | number | boolean | string[] | Record<string, any>>; 