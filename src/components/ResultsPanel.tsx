import React, { useState } from 'react';
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
  LinearProgress,
  IconButton,
  Collapse,
  Tooltip,
  Button,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import RefreshIcon from '@mui/icons-material/Refresh';

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
  const [expandedMetadata, setExpandedMetadata] = useState<Record<number, boolean>>({});
  const [retryCount, setRetryCount] = useState<Record<number, number>>({});

  if (outputs.length === 0 && !isProcessing) {
    return null;
  }

  const toggleMetadata = (index: number) => {
    setExpandedMetadata(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleRetry = (index: number) => {
    setRetryCount(prev => ({
      ...prev,
      [index]: (prev[index] || 0) + 1
    }));
    // Add your retry logic here
  };

  const getErrorMessage = (output: FlowOutput, index: number) => {
    if (typeof output.error === 'string') {
      if (output.error.includes('maximum retries')) {
        return (
          <Box>
            <Typography color="error.main" gutterBottom>
              The operation timed out. This might be due to:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
              <li>High server load</li>
              <li>Complex processing requirements</li>
              <li>Network connectivity issues</li>
            </ul>
            {(retryCount[index] || 0) < 3 && (
              <Button
                startIcon={<RefreshIcon />}
                onClick={() => handleRetry(index)}
                size="small"
                sx={{ mt: 1 }}
              >
                Retry Operation
              </Button>
            )}
          </Box>
        );
      }
      return output.error;
    }
    return 'An unknown error occurred';
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        right: 16,
        top: 80,
        width: 400,
        maxHeight: 'calc(100vh - 200px)',
        overflowY: 'auto',
        borderRadius: 2,
        backgroundColor: 'white',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      }}
    >
      <Box 
        sx={{ 
          p: 2, 
          position: 'sticky',
          top: 0,
          backgroundColor: 'white',
          borderBottom: '1px solid #e0e0e0',
          zIndex: 2,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          {isProcessing ? (
            <AccessTimeIcon sx={{ color: 'primary.main' }} />
          ) : outputs.some(o => o.error) ? (
            <ErrorIcon color="error" />
          ) : (
            <CheckCircleIcon color="success" />
          )}
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Results
          </Typography>
          {isProcessing && (
            <Chip
              label="Processing..."
              color="primary"
              size="small"
              sx={{ 
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
                color: 'primary.main',
                fontWeight: 500
              }}
            />
          )}
        </Stack>
        {isProcessing && (
          <LinearProgress 
            sx={{ 
              mt: 2,
              borderRadius: 1,
              backgroundColor: 'rgba(25, 118, 210, 0.08)',
            }} 
          />
        )}
      </Box>

      <Box sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          {outputs.map((output, index) => (
            <Accordion 
              key={index} 
              defaultExpanded
              sx={{
                boxShadow: 'none',
                border: '1px solid #e0e0e0',
                borderRadius: '8px !important',
                '&:before': { display: 'none' },
                overflow: 'hidden',
              }}
            >
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  backgroundColor: output.error ? 'error.lighter' : 'success.lighter',
                  '&:hover': {
                    backgroundColor: output.error ? 'error.light' : 'success.light',
                  }
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  {output.error ? (
                    <ErrorIcon sx={{ color: 'error.main' }} />
                  ) : (
                    <CheckCircleIcon sx={{ color: 'success.main' }} />
                  )}
                  <Typography sx={{ fontWeight: 500, color: output.error ? 'error.main' : 'success.main' }}>
                    {output.nodeId === 'error' ? 'Error' : `Node: ${output.nodeId}`}
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 2 }}>
                <Stack spacing={2}>
                  <Box
                    sx={{
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      backgroundColor: output.error ? 'error.lighter' : '#f8f9fa',
                      p: 2,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: output.error ? 'error.light' : '#e0e0e0',
                    }}
                  >
                    {output.error ? getErrorMessage(output, index) : output.result}
                  </Box>

                  {!output.error && output.metadata && Object.keys(output.metadata).length > 0 && (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <Tooltip title="Show usage statistics">
                          <IconButton 
                            size="small" 
                            onClick={() => toggleMetadata(index)}
                            sx={{ 
                              transform: expandedMetadata[index] ? 'rotate(180deg)' : 'none',
                              transition: 'transform 0.2s'
                            }}
                          >
                            <KeyboardArrowDownIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Collapse in={expandedMetadata[index]}>
                        <Box sx={{ mt: 1 }}>
                          <Typography 
                            variant="subtitle2" 
                            gutterBottom 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              color: 'text.secondary'
                            }}
                          >
                            <InfoIcon fontSize="small" sx={{ mr: 0.5 }} />
                            Usage Statistics
                          </Typography>
                          <Stack spacing={1}>
                            {Object.entries(output.metadata).map(([key, value]) => (
                              <Box 
                                key={key} 
                                sx={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between',
                                  p: 1,
                                  backgroundColor: 'rgba(0,0,0,0.02)',
                                  borderRadius: 1,
                                  '&:hover': {
                                    backgroundColor: 'rgba(0,0,0,0.04)'
                                  }
                                }}
                              >
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </Typography>
                                <Typography 
                                  variant="body2"
                                  sx={{ 
                                    color: 'primary.main',
                                    fontFamily: 'monospace'
                                  }}
                                >
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </Typography>
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                      </Collapse>
                    </>
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      </Box>
    </Paper>
  );
}; 