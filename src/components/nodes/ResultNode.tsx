import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Paper, Typography } from '@mui/material';

const ResultNode = ({ data }: NodeProps) => {
  return (
    <Paper
      sx={{
        padding: 2,
        minWidth: 150,
        backgroundColor: '#f1f8e9',
        border: '2px solid #aed581',
      }}
    >
      <Handle type="target" position={Position.Top} />
      <Typography variant="subtitle1" align="center">
        {data.label}
      </Typography>
    </Paper>
  );
};

export default memo(ResultNode); 