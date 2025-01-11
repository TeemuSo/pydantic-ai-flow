import React from 'react';
import { Box } from '@mui/material';
import { ReactFlowProvider } from 'reactflow';
import Sidebar from './components/Sidebar';
import Flow from './components/Flow';
import AgentNode from './components/nodes/AgentNode';
import ToolNode from './components/nodes/ToolNode';
import ResultNode from './components/nodes/ResultNode';

const nodeTypes = {
  agent: AgentNode,
  tool: ToolNode,
  result: ResultNode,
};

const App = () => {
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <ReactFlowProvider>
        <Sidebar />
        <Box sx={{ flexGrow: 1, height: '100%' }}>
          <Flow nodeTypes={nodeTypes} />
        </Box>
      </ReactFlowProvider>
    </Box>
  );
};

export default App; 