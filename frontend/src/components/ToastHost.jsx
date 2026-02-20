import { Alert, Snackbar } from '@mui/material';
import { useEffect, useState } from 'react';

// Global toast host for success/error/info notifications.
const ToastHost = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('info');

  useEffect(() => {
    const onToast = (event) => {
      setMessage(event.detail.message);
      setSeverity(event.detail.severity || 'info');
      setOpen(true);
    };

    window.addEventListener('app-toast', onToast);
    return () => window.removeEventListener('app-toast', onToast);
  }, []);

  return (
    <Snackbar open={open} autoHideDuration={2600} onClose={() => setOpen(false)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
      <Alert onClose={() => setOpen(false)} severity={severity} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
};

export default ToastHost;
