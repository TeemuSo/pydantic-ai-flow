import React, { useState } from 'react';
import {
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Stack,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

interface InputPanelProps {
  onSubmit: (input: string) => void;
  isProcessing: boolean;
}

export const InputPanel: React.FC<InputPanelProps> = ({ onSubmit, isProcessing }) => {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (input.trim()) {
      onSubmit(input.trim());
      setInput('');
    }
  };

  return (
    <Paper 
      sx={{ 
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        p: 2,
        borderTop: '1px solid #e0e0e0',
        backgroundColor: 'white',
        zIndex: 1000,
      }}
    >
      <Stack direction="row" spacing={2}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter your input here..."
          disabled={isProcessing}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!input.trim() || isProcessing}
          startIcon={<SendIcon />}
        >
          {isProcessing ? 'Processing...' : 'Send'}
        </Button>
      </Stack>
    </Paper>
  );
}; 