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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

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

interface RunDialogProps {
  open: boolean;
  onClose: () => void;
  onRun: (prompt: string, apiKey: string) => Promise<void>;
  modelProvider: string;
}

const RunDialog: React.FC<RunDialogProps> = ({ open, onClose, onRun, modelProvider }) => {
  const [prompt, setPrompt] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = async () => {
    setIsRunning(true);
    try {
      await onRun(prompt, apiKey);
      onClose();
    } catch (error) {
      console.error('Error running agent:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Run Agent</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            fullWidth
            label={`${modelProvider} API Key`}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            type="password"
          />
          <TextField
            fullWidth
            label="Prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            multiline
            rows={4}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isRunning}>Cancel</Button>
        <Button 
          onClick={handleRun} 
          variant="contained" 
          disabled={!prompt || !apiKey || isRunning}
          startIcon={isRunning ? <CircularProgress size={20} /> : <PlayArrowIcon />}
        >
          {isRunning ? 'Running...' : 'Run'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const AgentNode = ({ data }: NodeProps) => {
  const [config, setConfig] = useState<AgentConfig>(data.config || defaultConfig);
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [result, setResult] = useState<string | null>(null);

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

  const handleRunAgent = async (prompt: string, apiKey: string) => {
    try {
      const credentials = {
        openai_api_key: config.modelProvider === 'openai' ? apiKey : null,
        anthropic_api_key: config.modelProvider === 'anthropic' ? apiKey : null,
        google_api_key: config.modelProvider === 'google-gla' ? apiKey : null,
      };

      const transformedConfig = {
        label: config.label,
        model_provider: config.modelProvider,
        model_name: config.modelName,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        system_prompts: config.systemPrompts.map(p => p.content),
        response_tokens_limit: config.responseTokensLimit,
        request_limit: config.requestLimit,
        total_tokens_limit: config.totalTokensLimit,
      };

      const response = await fetch('http://localhost:8000/api/run-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: transformedConfig,
          credentials,
          prompt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || 'Failed to run agent');
      }

      const data = await response.json();
      setResult(data.result);
    } catch (error) {
      console.error('Error running agent:', error);
      throw error;
    }
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
        <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>{config.label || 'Agent'}</Typography>
        <IconButton 
          size="small" 
          onClick={() => setRunDialogOpen(true)}
          sx={{ backgroundColor: 'primary.main', '&:hover': { backgroundColor: 'primary.dark' } }}
        >
          <PlayArrowIcon />
        </IconButton>
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

        {result && (
          <Box sx={{ p: 2, mt: 2, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>Last Result:</Typography>
            <Typography variant="body2">{result}</Typography>
          </Box>
        )}
      </Box>

      <RunDialog
        open={runDialogOpen}
        onClose={() => setRunDialogOpen(false)}
        onRun={handleRunAgent}
        modelProvider={config.modelProvider}
      />

      <Handle type="source" position={Position.Bottom} />
    </Paper>
  );
};

export default memo(AgentNode); 