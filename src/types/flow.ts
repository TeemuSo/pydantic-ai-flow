interface SystemPrompt {
  id: string;
  content: string;
}

interface AgentConfig {
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
}

interface NodeData {
  config?: AgentConfig;
  label?: string;
  type?: string;
}

export type { SystemPrompt, AgentConfig, NodeData }; 