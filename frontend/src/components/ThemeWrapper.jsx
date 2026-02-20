import { createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import { useMemo, useState } from 'react';

// Provides light/dark Material UI theme to the entire app.
const ThemeWrapper = ({ children }) => {
  const [mode, setMode] = useState(localStorage.getItem('theme') || 'light');

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: '#0d9488' },
          secondary: { main: '#ea580c' },
          background: {
            default: mode === 'light' ? '#f8fafc' : '#0f172a',
            paper: mode === 'light' ? '#ffffff' : '#1e293b',
          },
        },
        shape: { borderRadius: 14 },
      }),
    [mode]
  );

  const toggleTheme = () => {
    const next = mode === 'light' ? 'dark' : 'light';
    setMode(next);
    localStorage.setItem('theme', next);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children({ mode, toggleTheme })}
    </ThemeProvider>
  );
};

export default ThemeWrapper;
