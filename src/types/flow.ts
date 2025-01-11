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
  requestLimit: number;
  totalTokensLimit: number;
  dependencyType?: string;
  resultType?: string;
  outputStructure?: OutputStructure;
  selectedOutputFields?: string[];
}

export interface NodeData {
  type: string;
  config?: AgentConfig;
  onConfigChange?: (config: AgentConfig) => void;
}

// Record type for structured output where values can be any primitive type
export type StructuredOutput = Record<string, string | number | boolean | string[] | Record<string, any>>; 