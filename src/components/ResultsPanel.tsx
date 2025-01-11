import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';

interface FlowOutput {
  nodeId: string;
  result: string;
  error?: string | boolean;
  metadata?: Record<string, any>;
}

interface ResultsPanelProps {
  outputs: FlowOutput[];
  isProcessing: boolean;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ outputs, isProcessing }) => {
  if (outputs.length === 0 && !isProcessing) {
    return null;
  }

  return (
    <Paper
      sx={{
        position: 'fixed',
        right: 16,
        top: 80,
        width: 400,
        maxHeight: 'calc(100vh - 200px)',
        overflowY: 'auto',
        p: 2,
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        boxShadow: 3,
      }}
    >
      <Typography variant="h6" gutterBottom>
        Results
        {isProcessing && (
          <Chip
            label="Processing..."
            color="primary"
            size="small"
            sx={{ ml: 1 }}
          />
        )}
      </Typography>

      <Stack spacing={2}>
        {outputs.map((output, index) => (
          <Accordion key={index} defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" spacing={1} alignItems="center">
                {output.error ? (
                  <ErrorIcon color="error" />
                ) : (
                  <CheckCircleIcon color="success" />
                )}
                <Typography>
                  {output.nodeId === 'error' ? 'Error' : `Node: ${output.nodeId}`}
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace',
                    backgroundColor: output.error ? '#fff5f5' : '#f5f9ff',
                    p: 1,
                    borderRadius: 1,
                  }}
                >
                  {output.result}
                </Typography>

                {output.metadata && Object.keys(output.metadata).length > 0 && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <InfoIcon fontSize="small" sx={{ mr: 0.5 }} />
                        Usage Statistics
                      </Typography>
                      <Stack spacing={1}>
                        {Object.entries(output.metadata).map(([key, value]) => (
                          <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">
                              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                            </Typography>
                            <Typography variant="body2">{value}</Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  </>
                )}
              </Stack>
            </AccordionDetails>
          </Accordion>
        ))}
      </Stack>
    </Paper>
  );
}; 