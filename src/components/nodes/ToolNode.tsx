import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Paper, Typography } from '@mui/material';

const ToolNode = ({ data }: NodeProps) => {
  return (
    <Paper
      sx={{
        padding: 2,
        minWidth: 150,
        backgroundColor: '#fff3e0',
        border: '2px solid #ffb74d',
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

export default memo(ToolNode); 