import React from 'react';
import { Paper, List, ListItem, Typography, Box } from '@mui/material';

const nodeTypes = [
  { type: 'agent', label: 'Agent' },
  { type: 'tool', label: 'Tool' },
  { type: 'result', label: 'Result' },
];

const Sidebar = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Paper sx={{ width: 240, p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Node Types
      </Typography>
      <List>
        {nodeTypes.map(({ type, label }) => (
          <ListItem
            key={type}
            sx={{
              border: '1px solid #ccc',
              borderRadius: 1,
              mb: 1,
              cursor: 'grab',
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
            }}
            draggable
            onDragStart={(event) => onDragStart(event, type)}
          >
            <Box sx={{ p: 1 }}>
              <Typography>{label}</Typography>
            </Box>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default Sidebar; 