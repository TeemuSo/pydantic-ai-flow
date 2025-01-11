import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Paper, Typography } from '@mui/material';

const AgentNode = ({ data }: NodeProps) => {
  return (
    <Paper
      sx={{
        padding: 2,
        minWidth: 150,
        backgroundColor: '#e3f2fd',
        border: '2px solid #90caf9',
      }}
    >
      <Handle type="target" position={Position.Top} />
      <Typography variant="subtitle1" align="center">
        {data.label}
      </Typography>
      <Handle type="source" position={Position.Bottom} />
    </Paper>
  );
};

export default memo(AgentNode); 