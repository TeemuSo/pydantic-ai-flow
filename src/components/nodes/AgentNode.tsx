import React, { memo, useState, useEffect, useContext } from 'react';
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
  FormGroup,
  FormControlLabel,
  Checkbox,
  Collapse,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SettingsIcon from '@mui/icons-material/Settings';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { OutputStructure, OutputField, AgentConfig, NodeData, SystemPrompt } from '../../types/flow';
import { APIKeyContext } from '../APIKeyConfig';

interface ModelOption {
  value: string;
  label: string;
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
  label: 'Agent',
  modelProvider: 'openai',
  modelName: 'gpt-4',
  temperature: 0.7,
  maxTokens: 2048,
  systemPrompts: [],
  responseTokensLimit: 2048,
  totalTokensLimit: 4096,
  outputStructure: {
    name: 'CustomOutput',
    fields: [{
      name: 'text',
      type: 'str',
      description: 'The response text'
    }]
  },
  selectedOutputFields: []
};

interface RunDialogProps {
  open: boolean;
  onClose: () => void;
  onRun: (prompt: string) => Promise<void>;
  modelProvider: string;
}

const RunDialog: React.FC<RunDialogProps> = ({ open, onClose, onRun, modelProvider }) => {
  const [prompt, setPrompt] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    setIsRunning(true);
    setError(null);
    try {
      await onRun(prompt);
      onClose();
    } catch (error) {
      console.error('Error running agent:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
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
            label="Prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            multiline
            rows={4}
            error={!!error}
          />
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isRunning}>Cancel</Button>
        <Button 
          onClick={handleRun} 
          variant="contained" 
          disabled={!prompt || isRunning}
          startIcon={isRunning ? <CircularProgress size={20} /> : <PlayArrowIcon />}
        >
          {isRunning ? 'Running...' : 'Run'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const STORAGE_KEY_PREFIX = 'agent_input_';

const AgentNode = ({ data, id }: NodeProps<NodeData>) => {
  const { apiKeys } = useContext(APIKeyContext);
  const [config, setConfig] = useState<AgentConfig>(() => {
    const initialConfig = {
      ...defaultConfig,
      ...data.config
    };
    
    if (!initialConfig.outputStructure?.fields?.length) {
      initialConfig.outputStructure = defaultConfig.outputStructure;
    }
    
    return initialConfig;
  });
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [structuredOutput, setStructuredOutput] = useState<any>(null);
  const [receivedInput, setReceivedInput] = useState<{data: any, visible: boolean}>(() => {
    const savedInput = localStorage.getItem(`${STORAGE_KEY_PREFIX}${id}`);
    return savedInput ? JSON.parse(savedInput) : {
      data: null,
      visible: false
    };
  });
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    if (data.previousAgentOutput) {
      const newInput = {
        data: data.previousAgentOutput,
        visible: true
      };
      setReceivedInput(newInput);
      // Save to localStorage
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${id}`, JSON.stringify(newInput));
    }
  }, [data.previousAgentOutput, id]);

  // Clean up localStorage when node is removed
  useEffect(() => {
    return () => {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${id}`);
    };
  }, [id]);

  useEffect(() => {
    const validModels = MODEL_OPTIONS[config.modelProvider];
    if (!validModels.some(model => model.value === config.modelName)) {
      handleConfigChange('modelName', validModels[0].value);
    }
  }, [config.modelProvider]);

  useEffect(() => {
    if (data.onConfigChange) {
      const updatedConfig = {
        ...config,
        outputStructure: config.outputStructure?.fields?.length ? 
          config.outputStructure : 
          defaultConfig.outputStructure,
        receivedInput: receivedInput.data
      };
      data.onConfigChange(updatedConfig);
    }
  }, [config, receivedInput, data.onConfigChange]);

  const handleConfigChange = (field: keyof AgentConfig, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [field]: field === 'selectedOutputFields' ? (value || []) : value,
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

  const addOutputField = () => {
    const newField: OutputField = {
      name: '',
      type: 'str',
      description: ''
    };

    setConfig(prev => ({
      ...prev,
      outputStructure: {
        name: prev.outputStructure?.name || 'CustomOutput',
        fields: [...(prev.outputStructure?.fields || []), newField]
      }
    }));
  };

  const updateOutputField = (index: number, field: Partial<OutputField>) => {
    setConfig(prev => ({
      ...prev,
      outputStructure: {
        name: prev.outputStructure?.name || 'CustomOutput',
        fields: prev.outputStructure?.fields.map((f, i) => 
          i === index ? { ...f, ...field } : f
        ) || []
      }
    }));
  };

  const removeOutputField = (index: number) => {
    setConfig(prev => ({
      ...prev,
      outputStructure: {
        name: prev.outputStructure?.name || 'CustomOutput',
        fields: prev.outputStructure?.fields.filter((_, i) => i !== index) || []
      }
    }));
  };

  const handleRunAgent = async (prompt: string) => {
    try {
      const apiKey = apiKeys[config.modelProvider];
      if (!apiKey) {
        throw new Error(`No API key found for ${config.modelProvider}. Please configure it in settings.`);
      }

      const credentials = {
        openai_api_key: config.modelProvider === 'openai' ? apiKey : null,
        anthropic_api_key: config.modelProvider === 'anthropic' ? apiKey : null,
        google_api_key: config.modelProvider === 'google-gla' ? apiKey : null,
      };

      // If we have previous output and selected fields, add them to the input
      if (data.previousAgentOutput && config.selectedOutputFields?.length) {
        const selectedData = config.selectedOutputFields
          .map(field => {
            const value = data.previousAgentOutput![field];
            return `${field}: ${value !== undefined ? value : 'N/A'}`;
          })
          .join('\n');
        prompt = `${prompt}\n\nContext from previous agent:\n${selectedData}`;
      }

      const transformedConfig = {
        label: config.label,
        model_provider: config.modelProvider,
        model_name: config.modelName,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        system_prompts: config.systemPrompts.map(p => p.content).filter(Boolean),
        response_tokens_limit: config.responseTokensLimit,
        total_tokens_limit: config.totalTokensLimit,
        output_structure: config.outputStructure,
        selected_output_fields: config.selectedOutputFields,
      };

      console.log('Running single agent with config:', transformedConfig);
      console.log('Input:', prompt);

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

      const responseData = await response.json();
      setResult(responseData.result);
      setStructuredOutput(responseData.structured_output);
      
      // Update node data to persist the configuration
      if (responseData.structured_output) {
        handleConfigChange('selectedOutputFields', Object.keys(responseData.structured_output));
      }
    } catch (error) {
      console.error('Error running agent:', error);
      throw error;
    }
  };

  const renderInputVisualization = () => {
    if (!receivedInput.visible || !receivedInput.data) return null;
    
    return (
      <Box
        sx={{
          position: 'absolute',
          top: -8,
          left: 0,
          right: 0,
          height: '4px',
          backgroundColor: 'success.main',
          zIndex: 1,
          '&:hover': {
            height: 'auto',
            padding: '8px',
            backgroundColor: 'success.light',
            borderRadius: '4px',
            boxShadow: 1,
            '& .content': {
              display: 'block'
            }
          }
        }}
      >
        <Box className="content" sx={{ display: 'none' }}>
          <Typography variant="caption" sx={{ display: 'block', color: 'white' }}>
            Received Input:
          </Typography>
          {Object.entries(receivedInput.data).map(([key, value]) => (
            <Typography key={key} variant="caption" sx={{ display: 'block', color: 'white' }}>
              {key}: {String(value)}
            </Typography>
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <Paper
      sx={{
        minWidth: 300,
        maxWidth: 400,
        backgroundColor: '#ffffff',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative',
        cursor: 'default'
      }}
    >
      <Handle type="target" position={Position.Top} />
      
      {/* Input Data Display - Always Visible */}
      {(data.previousAgentOutput || receivedInput.data) && (
        <Box 
          className="nodrag"
          sx={{ 
            backgroundColor: '#e3f2fd',
            borderBottom: '1px solid #90caf9',
            p: 1.5
          }}
        >
          <Typography variant="subtitle2" sx={{ color: '#1976d2', mb: 1, display: 'flex', alignItems: 'center' }}>
            <Box component="span" sx={{ mr: 1 }}>↓</Box>
            Input Data
          </Typography>
          {Object.entries(data.previousAgentOutput || receivedInput.data).map(([key, value]) => (
            <Box 
              key={key}
              sx={{ 
                display: 'flex',
                alignItems: 'flex-start',
                mb: 0.5,
                '&:last-child': { mb: 0 }
              }}
            >
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#1976d2',
                  fontWeight: 'medium',
                  minWidth: '80px',
                  mr: 1
                }}
              >
                {key}:
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'text.secondary',
                  wordBreak: 'break-all'
                }}
              >
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
      
      {/* Header Bar - Make this draggable */}
      <AppBar 
        position="static" 
        sx={{ 
          backgroundColor: '#90caf9',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          padding: '8px 12px',
          cursor: 'move',
          userSelect: 'none'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <DragIndicatorIcon sx={{ mr: 1 }} />
          <Typography variant="subtitle2">{config.label || 'Agent'}</Typography>
        </Box>
        <Stack direction="row" spacing={1} className="nodrag">
          <Tooltip title="Configure Agent">
            <IconButton 
              size="small"
              onClick={() => setShowConfig(!showConfig)}
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.1)',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
              }}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Run Agent">
            <IconButton 
              size="small" 
              onClick={() => setRunDialogOpen(true)}
              sx={{ 
                backgroundColor: 'primary.main',
                '&:hover': { backgroundColor: 'primary.dark' },
                color: 'white'
              }}
            >
              <PlayArrowIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </AppBar>

      {/* Configuration Panel */}
      <Collapse in={showConfig}>
        <Box sx={{ p: 2 }} className="nodrag">
          <Stack spacing={2}>
            {/* Basic Settings */}
            <Stack spacing={2}>
              <TextField
                className="nodrag"
                fullWidth
                label="Agent Name"
                value={config.label}
                onChange={(e) => handleConfigChange('label', e.target.value)}
                size="small"
              />

              <FormControl fullWidth size="small" className="nodrag">
                <InputLabel>Model</InputLabel>
                <Select
                  value={`${config.modelProvider}/${config.modelName}`}
                  label="Model"
                  onChange={(e) => {
                    const [provider, name] = (e.target.value as string).split('/');
                    handleConfigChange('modelProvider', provider as AgentConfig['modelProvider']);
                    handleConfigChange('modelName', name);
                  }}
                >
                  {Object.entries(MODEL_OPTIONS).map(([provider, models]) => (
                    models.map(model => (
                      <MenuItem key={`${provider}/${model.value}`} value={`${provider}/${model.value}`}>
                        {`${provider.charAt(0).toUpperCase() + provider.slice(1)} - ${model.label}`}
                      </MenuItem>
                    ))
                  ))}
                </Select>
              </FormControl>
            </Stack>

            {/* System Prompts */}
            <Box className="nodrag">
              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                    <IconButton size="small" onClick={() => removeSystemPrompt(prompt.id)}>
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              ))}
            </Box>

            {/* Advanced Settings Toggle */}
            <Button
              size="small"
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              endIcon={<ExpandMoreIcon sx={{ transform: showAdvancedSettings ? 'rotate(180deg)' : 'none' }} />}
            >
              {showAdvancedSettings ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
            </Button>

            {/* Advanced Settings */}
            <Collapse in={showAdvancedSettings}>
              <Stack spacing={2}>
                <Box className="nodrag">
                  <Typography variant="caption">Temperature: {config.temperature}</Typography>
                  <Slider
                    value={config.temperature}
                    min={0}
                    max={2}
                    step={0.1}
                    onChange={(_, value) => handleConfigChange('temperature', value)}
                    size="small"
                  />
                </Box>

                <Box className="nodrag">
                  <Typography variant="caption">Max Tokens: {config.maxTokens}</Typography>
                  <Slider
                    value={config.maxTokens}
                    min={1}
                    max={8192}
                    step={1}
                    onChange={(_, value) => handleConfigChange('maxTokens', value)}
                    size="small"
                  />
                </Box>

                {/* Output Structure Configuration */}
                <Box className="nodrag">
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    Output Structure
                    <IconButton size="small" onClick={addOutputField}>
                      <AddIcon />
                    </IconButton>
                  </Typography>
                  
                  <TextField
                    fullWidth
                    size="small"
                    label="Structure Name"
                    value={config.outputStructure?.name || 'CustomOutput'}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      outputStructure: {
                        name: e.target.value,
                        fields: prev.outputStructure?.fields || []
                      }
                    }))}
                    sx={{ mb: 1 }}
                  />

                  {config.outputStructure?.fields?.map((field, index) => (
                    <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <TextField
                        size="small"
                        label="Field"
                        value={field.name}
                        onChange={(e) => updateOutputField(index, { name: e.target.value })}
                      />
                      <Select
                        size="small"
                        value={field.type}
                        onChange={(e) => updateOutputField(index, { type: e.target.value })}
                      >
                        <MenuItem value="str">String</MenuItem>
                        <MenuItem value="int">Integer</MenuItem>
                        <MenuItem value="float">Float</MenuItem>
                        <MenuItem value="bool">Boolean</MenuItem>
                        <MenuItem value="list[str]">String List</MenuItem>
                        <MenuItem value="dict">Dictionary</MenuItem>
                      </Select>
                      <IconButton size="small" onClick={() => removeOutputField(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ))}
                </Box>

                {/* Output Field Selection */}
                <Box className="nodrag">
                  <Typography variant="subtitle2" gutterBottom>
                    Data to Pass to Next Agent
                  </Typography>
                  {structuredOutput && (
                    <FormGroup>
                      {Object.keys(structuredOutput).map((field) => (
                        <FormControlLabel
                          key={field}
                          control={
                            <Checkbox
                              checked={config.selectedOutputFields?.includes(field) || false}
                              onChange={(e) => {
                                const currentFields = config.selectedOutputFields || [];
                                const newFields = e.target.checked
                                  ? [...currentFields, field]
                                  : currentFields.filter(f => f !== field);
                                handleConfigChange('selectedOutputFields', newFields);
                              }}
                              size="small"
                            />
                          }
                          label={
                            <Typography variant="body2">
                              {field}
                            </Typography>
                          }
                        />
                      ))}
                    </FormGroup>
                  )}
                  {!structuredOutput && (
                    <Typography variant="caption" color="text.secondary">
                      Run the agent first to see available output fields
                    </Typography>
                  )}
                </Box>

                {/* Default Fields to Pass */}
                {(config.outputStructure?.fields?.length ?? 0) > 0 && (
                  <Box className="nodrag">
                    <Typography variant="subtitle2" gutterBottom>
                      Default Fields to Pass
                    </Typography>
                    <FormGroup>
                      {config.outputStructure?.fields?.map((field) => (
                        <FormControlLabel
                          key={field.name}
                          control={
                            <Checkbox
                              checked={config.selectedOutputFields?.includes(field.name) || false}
                              onChange={(e) => {
                                const currentFields = config.selectedOutputFields || [];
                                const newFields = e.target.checked
                                  ? [...currentFields, field.name]
                                  : currentFields.filter(f => f !== field.name);
                                handleConfigChange('selectedOutputFields', newFields);
                              }}
                              size="small"
                            />
                          }
                          label={
                            <Typography variant="body2">
                              {field.name} ({field.type})
                            </Typography>
                          }
                        />
                      ))}
                    </FormGroup>
                  </Box>
                )}
              </Stack>
            </Collapse>
          </Stack>
        </Box>
      </Collapse>

      {/* Result Display */}
      {(result || structuredOutput) && (
        <Box 
          className="nodrag"
          sx={{ 
            p: 2, 
            backgroundColor: '#fafafa', 
            borderTop: '1px solid rgba(0,0,0,0.1)'
          }}
        >
          <Typography variant="subtitle2" sx={{ color: '#2e7d32', mb: 1, display: 'flex', alignItems: 'center' }}>
            <Box component="span" sx={{ mr: 1 }}>↓</Box>
            Output
          </Typography>
          {result && (
            <Typography variant="body2" sx={{ mb: 1 }}>{result}</Typography>
          )}
          {structuredOutput && (
            <Box component="pre" sx={{ 
              p: 1, 
              backgroundColor: 'white', 
              borderRadius: 1,
              border: '1px solid #e0e0e0',
              overflow: 'auto',
              maxHeight: '100px',
              fontSize: '0.75rem'
            }}>
              {JSON.stringify(structuredOutput, null, 2)}
            </Box>
          )}
        </Box>
      )}

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