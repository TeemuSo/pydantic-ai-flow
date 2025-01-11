import React, { memo, useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import {
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Slider,
  IconButton,
  Stack,
  AppBar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

interface SystemPrompt {
  id: string;
  content: string;
}

interface ModelOption {
  value: string;
  label: string;
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

const MODEL_OPTIONS: Record<AgentConfig['modelProvider'], ModelOption[]> = {
  openai: [
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
  ],
  anthropic: [
    { value: 'claude-3-opus', label: 'Claude 3 Opus' },
    { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' }
  ],
  'google-gla': [
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { value: 'gemini-1.5-ultra', label: 'Gemini 1.5 Ultra' }
  ]
};

const defaultConfig: AgentConfig = {
  label: 'New Agent',
  modelProvider: 'openai',
  modelName: MODEL_OPTIONS.openai[0].value,
  temperature: 0.7,
  maxTokens: 2048,
  systemPrompts: [{ id: '1', content: '' }],
  responseTokensLimit: 2048,
  requestLimit: 10,
  totalTokensLimit: 4096,
};

const AgentNode = ({ data }: NodeProps) => {
  const [config, setConfig] = useState<AgentConfig>(data.config || defaultConfig);

  useEffect(() => {
    const validModels = MODEL_OPTIONS[config.modelProvider];
    if (!validModels.some(model => model.value === config.modelName)) {
      handleConfigChange('modelName', validModels[0].value);
    }
  }, [config.modelProvider]);

  const handleConfigChange = (field: keyof AgentConfig, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addSystemPrompt = () => {
    setConfig((prev) => ({
      ...prev,
      systemPrompts: [
        ...prev.systemPrompts,
        { id: Date.now().toString(), content: '' },
      ],
    }));
  };

  const updateSystemPrompt = (id: string, content: string) => {
    setConfig((prev) => ({
      ...prev,
      systemPrompts: prev.systemPrompts.map((prompt) =>
        prompt.id === id ? { ...prompt, content } : prompt
      ),
    }));
  };

  const removeSystemPrompt = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      systemPrompts: prev.systemPrompts.filter((prompt) => prompt.id !== id),
    }));
  };

  return (
    <Paper
      sx={{
        minWidth: 300,
        backgroundColor: '#e3f2fd',
        border: '2px solid #90caf9',
        overflow: 'hidden',
      }}
    >
      <Handle type="target" position={Position.Top} />
      
      {/* Drag Handle Bar */}
      <AppBar 
        position="static" 
        sx={{ 
          backgroundColor: '#90caf9',
          cursor: 'move',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          padding: '4px 8px',
          mb: 2
        }}
      >
        <DragIndicatorIcon sx={{ mr: 1 }} />
        <Typography variant="subtitle2">{config.label || 'Agent'}</Typography>
      </AppBar>

      <Box sx={{ padding: 2 }} className="nodrag">
        <Stack spacing={2}>
          {/* Basic Configuration */}
          <TextField
            className="nodrag"
            fullWidth
            label="Agent Name"
            value={config.label}
            onChange={(e) => handleConfigChange('label', e.target.value)}
            size="small"
          />

          {/* Model Configuration */}
          <FormControl fullWidth size="small" className="nodrag">
            <InputLabel>Model Provider</InputLabel>
            <Select
              value={config.modelProvider}
              label="Model Provider"
              onChange={(e) => handleConfigChange('modelProvider', e.target.value as AgentConfig['modelProvider'])}
            >
              <MenuItem value="openai">OpenAI</MenuItem>
              <MenuItem value="anthropic">Anthropic</MenuItem>
              <MenuItem value="google-gla">Google (Gemini)</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" className="nodrag">
            <InputLabel>Model Name</InputLabel>
            <Select
              value={config.modelName}
              label="Model Name"
              onChange={(e) => handleConfigChange('modelName', e.target.value)}
            >
              {MODEL_OPTIONS[config.modelProvider].map((model: ModelOption) => (
                <MenuItem key={model.value} value={model.value}>
                  {model.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Model Settings */}
          <Box className="nodrag">
            <Typography gutterBottom>Temperature: {config.temperature}</Typography>
            <Slider
              value={config.temperature}
              min={0}
              max={2}
              step={0.1}
              onChange={(_, value) => handleConfigChange('temperature', value)}
            />
          </Box>

          <Box className="nodrag">
            <Typography gutterBottom>Max Tokens: {config.maxTokens}</Typography>
            <Slider
              value={config.maxTokens}
              min={1}
              max={8192}
              step={1}
              onChange={(_, value) => handleConfigChange('maxTokens', value)}
            />
          </Box>

          {/* System Prompts */}
          <Box className="nodrag">
            <Typography variant="subtitle2" gutterBottom>
              System Prompts
              <IconButton size="small" onClick={addSystemPrompt}>
                <AddIcon />
              </IconButton>
            </Typography>
            {config.systemPrompts.map((prompt) => (
              <Box key={prompt.id} sx={{ display: 'flex', mb: 1 }}>
                <TextField
                  fullWidth
                  multiline
                  size="small"
                  value={prompt.content}
                  onChange={(e) => updateSystemPrompt(prompt.id, e.target.value)}
                  placeholder="Enter system prompt..."
                />
                {config.systemPrompts.length > 1 && (
                  <IconButton
                    size="small"
                    onClick={() => removeSystemPrompt(prompt.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            ))}
          </Box>

          {/* Usage Limits */}
          <Box className="nodrag">
            <Typography gutterBottom>
              Response Tokens Limit: {config.responseTokensLimit}
            </Typography>
            <Slider
              value={config.responseTokensLimit}
              min={1}
              max={8192}
              step={1}
              onChange={(_, value) => handleConfigChange('responseTokensLimit', value)}
            />
          </Box>

          <Box className="nodrag">
            <Typography gutterBottom>
              Request Limit: {config.requestLimit}
            </Typography>
            <Slider
              value={config.requestLimit}
              min={1}
              max={50}
              step={1}
              onChange={(_, value) => handleConfigChange('requestLimit', value)}
            />
          </Box>

          {/* Optional Settings */}
          <TextField
            className="nodrag"
            fullWidth
            label="Dependency Type (optional)"
            value={config.dependencyType}
            onChange={(e) => handleConfigChange('dependencyType', e.target.value)}
            size="small"
            placeholder="e.g., string, number, etc."
          />

          <TextField
            className="nodrag"
            fullWidth
            label="Result Type (optional)"
            value={config.resultType}
            onChange={(e) => handleConfigChange('resultType', e.target.value)}
            size="small"
            placeholder="e.g., string[], boolean, etc."
          />
        </Stack>
      </Box>

      <Handle type="source" position={Position.Bottom} />
    </Paper>
  );
};

export default memo(AgentNode); 