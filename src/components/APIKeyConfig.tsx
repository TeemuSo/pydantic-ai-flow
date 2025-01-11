import React, { createContext, useContext, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  IconButton,
  Box,
  Typography,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';

interface APIKeys {
  openai: string;
  anthropic: string;
  'google-gla': string;
}

interface APIKeyContextType {
  apiKeys: APIKeys;
  setAPIKey: (provider: keyof APIKeys, key: string) => void;
}

export const APIKeyContext = createContext<APIKeyContextType>({
  apiKeys: { openai: '', anthropic: '', 'google-gla': '' },
  setAPIKey: () => {},
});

export const APIKeyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiKeys, setAPIKeys] = useState<APIKeys>(() => {
    const savedKeys = localStorage.getItem('apiKeys');
    return savedKeys ? JSON.parse(savedKeys) : {
      openai: '',
      anthropic: '',
      'google-gla': '',
    };
  });

  const setAPIKey = (provider: keyof APIKeys, key: string) => {
    setAPIKeys(prev => {
      const newKeys = { ...prev, [provider]: key };
      localStorage.setItem('apiKeys', JSON.stringify(newKeys));
      return newKeys;
    });
  };

  return (
    <APIKeyContext.Provider value={{ apiKeys, setAPIKey }}>
      {children}
    </APIKeyContext.Provider>
  );
};

export const APIKeyConfig: React.FC = () => {
  const { apiKeys, setAPIKey } = useContext(APIKeyContext);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 1000 }}>
        <IconButton 
          onClick={() => setOpen(true)}
          sx={{ 
            backgroundColor: 'white',
            boxShadow: 2,
            '&:hover': { backgroundColor: '#f5f5f5' }
          }}
        >
          <SettingsIcon />
        </IconButton>
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>API Key Configuration</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="OpenAI API Key"
              value={apiKeys.openai}
              onChange={(e) => setAPIKey('openai', e.target.value)}
              type="password"
            />
            <TextField
              fullWidth
              label="Anthropic API Key"
              value={apiKeys.anthropic}
              onChange={(e) => setAPIKey('anthropic', e.target.value)}
              type="password"
            />
            <TextField
              fullWidth
              label="Google (Gemini) API Key"
              value={apiKeys['google-gla']}
              onChange={(e) => setAPIKey('google-gla', e.target.value)}
              type="password"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}; 