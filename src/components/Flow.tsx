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
import { Box, Paper, Typography } from '@mui/material';
import { APIKeyContext } from './APIKeyConfig';
import { InputPanel } from './InputPanel';
import { ResultsPanel } from './ResultsPanel';
import { NodeData } from '../types/flow';

interface FlowProps {
  nodeTypes: NodeTypes;
}

interface FlowOutput {
  nodeId: string;
  result: string;
  error?: string | boolean;
  metadata?: Record<string, any>;
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

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node<NodeData> = {
        id: `${type}-${nodes.length + 1}`,
        type,
        position,
        data: { 
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
          } : undefined
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [nodes, setNodes, screenToFlowPosition]
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

        while (currentNode) {
          if (currentNode.type === 'agent' && currentNode.data?.config) {
            const credentials = {
              openai_api_key: apiKeys.openai,
              anthropic_api_key: apiKeys.anthropic,
              google_api_key: apiKeys['google-gla'],
            };

            const transformedConfig = {
              label: currentNode.data.config.label,
              model_provider: currentNode.data.config.modelProvider,
              model_name: currentNode.data.config.modelName,
              temperature: currentNode.data.config.temperature,
              max_tokens: currentNode.data.config.maxTokens,
              system_prompts: currentNode.data.config.systemPrompts.map((p: SystemPrompt) => p.content).filter(Boolean),
              response_tokens_limit: currentNode.data.config.responseTokensLimit,
              request_limit: currentNode.data.config.requestLimit,
              total_tokens_limit: currentNode.data.config.totalTokensLimit,
            };

            console.log('Starting processInput function');
            console.log('Input:', currentInput);
            console.log('Node config:', transformedConfig);
            console.log('Credentials:', credentials);

            console.log('Sending request with config:', transformedConfig);

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
            console.log('Response headers:', response.headers);

            const data = await response.json();
            console.log('Response data:', data);

            if (!response.ok) {
              console.error('Server error:', data);
              const output: FlowOutput = {
                nodeId: currentNode.id,
                result: `Error: ${data.detail || 'Unknown error'}`,
                error: true
              };
              setOutputs(prev => [...prev, output]);
              break;
            }

            const output: FlowOutput = {
              nodeId: currentNode.id,
              result: data.result,
              error: data.error,
              metadata: data.usage
            };
            setOutputs(prev => [...prev, output]);

            if (!data.error) {
              currentInput = data.result;
            } else {
              break;
            }
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
      
      <ResultsPanel outputs={outputs} isProcessing={isProcessing} />
      <InputPanel onSubmit={processInput} isProcessing={isProcessing} />
    </Box>
  );
};

export default Flow; 