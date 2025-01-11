import React, { useState, useCallback, useContext, DragEvent, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Connection,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  NodeTypes,
  getIncomers,
  getOutgoers,
  useReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box, Paper, Typography, Button } from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import { APIKeyContext } from './APIKeyConfig';
import { InputPanel } from './InputPanel';
import { ResultsPanel } from './ResultsPanel';
import { NodeData, AgentConfig, StructuredOutput } from '../types/flow';

interface FlowProps {
  nodeTypes: NodeTypes;
}

interface FlowOutput {
  nodeId: string;
  result: string;
  error?: string | boolean;
  metadata?: {
    structured_output?: StructuredOutput;
    [key: string]: any;
  };
}

interface SystemPrompt {
  content: string;
}

const Flow: React.FC<{ nodeTypes: any }> = ({ nodeTypes }) => {
  // Load initial state from localStorage
  const initialNodes = (() => {
    const savedNodes = localStorage.getItem('flowNodes');
    return savedNodes ? (JSON.parse(savedNodes) as Node<NodeData, string | undefined>[]) : [];
  })();

  const initialEdges = (() => {
    const savedEdges = localStorage.getItem('flowEdges');
    return savedEdges ? (JSON.parse(savedEdges) as Edge<any>[]) : [];
  })();

  const [nodes, setNodes] = useNodesState<NodeData>(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);

  const [isProcessing, setIsProcessing] = useState(false);
  const [outputs, setOutputs] = useState<FlowOutput[]>([]);
  const { apiKeys } = useContext(APIKeyContext);
  const { screenToFlowPosition } = useReactFlow();

  // Save nodes and edges whenever they change
  useEffect(() => {
    localStorage.setItem('flowNodes', JSON.stringify(nodes));
  }, [nodes]);

  useEffect(() => {
    localStorage.setItem('flowEdges', JSON.stringify(edges));
  }, [edges]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => {
        const updatedNodes = applyNodeChanges(changes, nds);
        // If all nodes are deleted, clear localStorage
        if (updatedNodes.length === 0) {
          localStorage.removeItem('flowNodes');
          localStorage.removeItem('flowEdges');
        }
        return updatedNodes;
      });
    },
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [setEdges]
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleAgentConfigChange = useCallback((nodeId: string, newConfig: AgentConfig) => {
    setNodes(nds => 
      nds.map(node => {
        if (node.id === nodeId) {
          const updatedData: NodeData = {
            type: node.data.type,
            config: newConfig,
            onConfigChange: (config: AgentConfig) => handleAgentConfigChange(node.id, config)
          };
          return {
            ...node,
            data: updatedData
          };
        }
        return node;
      })
    );
  }, []);

  // Update initial nodes to include onConfigChange
  useEffect(() => {
    setNodes(nds =>
      nds.map(node => {
        const updatedData: NodeData = {
          ...node.data,
          onConfigChange: node.type === 'agent' 
            ? (config: AgentConfig) => handleAgentConfigChange(node.id, config)
            : undefined
        };
        return {
          ...node,
          data: updatedData
        };
      })
    );
  }, [handleAgentConfigChange]);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const nodeData: NodeData = {
        type,
        config: type === 'agent' ? {
          label: `Agent ${nodes.length + 1}`,
          modelProvider: 'openai',
          modelName: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2048,
          systemPrompts: [{ id: '1', content: '' }],
          responseTokensLimit: 2048,
          requestLimit: 10,
          totalTokensLimit: 4096,
        } : undefined,
        onConfigChange: type === 'agent' 
          ? (config: AgentConfig) => handleAgentConfigChange(`${type}-${nodes.length + 1}`, config)
          : undefined
      };

      const newNode: Node<NodeData> = {
        id: `${type}-${nodes.length + 1}`,
        type,
        position,
        data: nodeData,
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [nodes, setNodes, screenToFlowPosition, handleAgentConfigChange]
  );

  const processInput = async (input: string) => {
    setIsProcessing(true);
    setOutputs([]);

    try {
      const startNodes = nodes.filter(node => !getIncomers(node, nodes, edges).length);
      
      if (startNodes.length === 0) {
        const output: FlowOutput = {
          nodeId: 'error',
          result: 'Error: Please add at least one agent node to the flow before sending a message.',
          error: true
        };
        setOutputs([output]);
        return;
      }

      const hasAgentNode = nodes.some(node => node.type === 'agent' && node.data?.config);
      if (!hasAgentNode) {
        const output: FlowOutput = {
          nodeId: 'error',
          result: 'Error: No configured agent nodes found. Please add and configure an agent node.',
          error: true
        };
        setOutputs([output]);
        return;
      }

      await Promise.all(startNodes.map(async (node) => {
        let currentNode = node;
        let currentInput = input;
        let previousOutput: StructuredOutput | null = null;

        while (currentNode) {
          if (currentNode.type === 'agent' && currentNode.data?.config) {
            const credentials = {
              openai_api_key: apiKeys.openai,
              anthropic_api_key: apiKeys.anthropic,
              google_api_key: apiKeys['google-gla'],
            };

            // If we have previous output and selected fields, add them to the input
            if (previousOutput && currentNode.data.config.selectedOutputFields?.length) {
              const selectedData = currentNode.data.config.selectedOutputFields
                .map(field => {
                  // Use non-null assertion since we've checked it in the if condition
                  const value = previousOutput![field];
                  return `${field}: ${value !== undefined ? value : 'N/A'}`;
                })
                .join('\n');
              currentInput = `${currentInput}\n\nContext from previous agent:\n${selectedData}`;
            }

            const transformedConfig = {
              label: currentNode.data.config.label,
              model_provider: currentNode.data.config.modelProvider,
              model_name: currentNode.data.config.modelName,
              temperature: currentNode.data.config.temperature,
              max_tokens: currentNode.data.config.maxTokens,
              system_prompts: currentNode.data.config.systemPrompts.map(p => p.content).filter(Boolean),
              response_tokens_limit: currentNode.data.config.responseTokensLimit,
              request_limit: currentNode.data.config.requestLimit,
              total_tokens_limit: currentNode.data.config.totalTokensLimit,
              output_structure: currentNode.data.config.outputStructure,
              selected_output_fields: currentNode.data.config.selectedOutputFields
            };

            console.log('Starting processInput function');
            console.log('Input:', currentInput);
            console.log('Node config:', transformedConfig);
            console.log('Credentials:', credentials);

            const response = await fetch('http://localhost:8000/api/run-agent', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                config: transformedConfig,
                credentials,
                prompt: currentInput,
              }),
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
              const errorData = await response.json().catch(() => null);
              console.error('Server error:', errorData);
              const output: FlowOutput = {
                nodeId: currentNode.id,
                result: `Error: ${errorData?.detail || 'Unknown error'}`,
                error: true
              };
              setOutputs(prev => [...prev, output]);
              break;
            }

            const data = await response.json();
            console.log('Response data:', data);

            const output: FlowOutput = {
              nodeId: currentNode.id,
              result: data.result,
              error: data.error,
              metadata: {
                ...data.usage,
                structured_output: data.structured_output
              }
            };
            setOutputs(prev => [...prev, output]);

            // Store structured output for next agent
            previousOutput = data.structured_output || null;
          }

          const outgoers = getOutgoers(currentNode, nodes, edges);
          currentNode = outgoers[0];
        }
      }));
    } catch (error: unknown) {
      console.error('Error processing flow:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const output: FlowOutput = {
        nodeId: 'error',
        result: `Error: ${errorMessage}`,
        error: true
      };
      setOutputs([output]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateCode = async () => {
    try {
      // First, filter valid agent nodes and extract their configs
      const agentNodes = nodes.filter((node): node is Node<NodeData> & { data: { config: AgentConfig } } => 
        node.type === 'agent' && 
        node.data?.config !== undefined
      );

      // Transform the filtered nodes
      const transformedNodes = agentNodes.map(node => ({
        id: node.id,
        type: node.type,
        position: {
          x: node.position.x,
          y: node.position.y
        },
        config: {
          label: node.data.config.label,
          model_provider: node.data.config.modelProvider,
          model_name: node.data.config.modelName,
          temperature: node.data.config.temperature,
          max_tokens: node.data.config.maxTokens,
          system_prompts: node.data.config.systemPrompts.map(p => p.content),
          response_tokens_limit: node.data.config.responseTokensLimit,
          request_limit: node.data.config.requestLimit,
          total_tokens_limit: node.data.config.totalTokensLimit,
          output_structure: node.data.config.outputStructure,
          selected_output_fields: node.data.config.selectedOutputFields
        }
      }));

      const response = await fetch('http://localhost:8000/api/generate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodes: transformedNodes,
          edges,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate code');
      }

      const { code } = await response.json();

      // Create and download file
      const blob = new Blob([code], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'generated_flow.py';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error generating code:', error);
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100vh',
        position: 'relative'
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
      
      <Box
        sx={{
          position: 'absolute',
          top: 20,
          right: 20,
          zIndex: 1000,
        }}
      >
        <Button
          variant="contained"
          color="primary"
          startIcon={<CodeIcon />}
          onClick={handleGenerateCode}
          disabled={nodes.length === 0}
        >
          Generate Python Code
        </Button>
      </Box>
      
      <ResultsPanel outputs={outputs} isProcessing={isProcessing} />
      <InputPanel onSubmit={processInput} isProcessing={isProcessing} />
    </Box>
  );
};

export default Flow; 