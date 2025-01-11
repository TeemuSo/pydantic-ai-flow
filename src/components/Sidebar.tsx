import React from 'react';
import { Paper, Typography, Box, Tooltip } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import BuildIcon from '@mui/icons-material/Build';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const nodeTypes = [
  { 
    type: 'agent', 
    label: 'Agent', 
    icon: SmartToyIcon,
    description: 'Add an AI agent to process inputs and generate outputs',
    color: '#90caf9'
  },
  { 
    type: 'tool', 
    label: 'Tool', 
    icon: BuildIcon,
    description: 'Add a tool to perform specific tasks',
    color: '#ffb74d'
  },
  { 
    type: 'result', 
    label: 'Result', 
    icon: CheckCircleIcon,
    description: 'Add a result node to display final outputs',
    color: '#aed581'
  },
];

const Sidebar = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Paper 
      sx={{ 
        width: 80,
        p: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        backgroundColor: '#fafafa',
        borderRight: '1px solid #e0e0e0',
        borderRadius: 0
      }}
    >
      <Typography variant="caption" sx={{ mb: 1, color: 'text.secondary' }}>
        Nodes
      </Typography>
      
      {nodeTypes.map(({ type, label, icon: Icon, description, color }) => (
        <Tooltip 
          key={type} 
          title={description}
          placement="right"
        >
          <Box
            draggable
            onDragStart={(event) => onDragStart(event, type)}
            sx={{
              width: 50,
              height: 50,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'white',
              border: `2px solid ${color}`,
              borderRadius: 2,
              cursor: 'grab',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: 2,
              },
            }}
          >
            <Icon sx={{ color: color }} />
            <Typography 
              variant="caption" 
              sx={{ 
                fontSize: '0.6rem',
                mt: 0.5,
                color: 'text.secondary'
              }}
            >
              {label}
            </Typography>
          </Box>
        </Tooltip>
      ))}
    </Paper>
  );
};

export default Sidebar; 