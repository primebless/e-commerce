import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Paper, TextField, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useEffect, useState } from 'react';
import api from '../api/client';
import { toast } from '../utils/toast';

const SupportCenterPage = () => {
  const [faq, setFaq] = useState([]);
  const [ticket, setTicket] = useState({ name: '', email: '', subject: '', message: '', orderId: '' });
  const [status, setStatus] = useState('');

  useEffect(() => {
    const run = async () => {
      try {
        const { data } = await api.get('/support/faq');
        setFaq(data || []);
      } catch {
        setFaq([]);
      }
    };
    run();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      const { data } = await api.post('/support/tickets', ticket);
      setStatus(`Ticket submitted: ${data.id}`);
      setTicket({ name: '', email: '', subject: '', message: '', orderId: '' });
      toast.success('Support ticket submitted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit ticket');
    }
  };

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Typography variant="h4">Support Center</Typography>
      {status && <Alert severity="success">{status}</Alert>}

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>FAQ</Typography>
        {faq.map((row) => (
          <Accordion key={row.id}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>{row.question}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary">{row.answer}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Contact Ticket</Typography>
        <Box component="form" onSubmit={submit}>
          <TextField fullWidth label="Name" sx={{ mb: 1 }} value={ticket.name} onChange={(e) => setTicket((p) => ({ ...p, name: e.target.value }))} />
          <TextField fullWidth label="Email" sx={{ mb: 1 }} value={ticket.email} onChange={(e) => setTicket((p) => ({ ...p, email: e.target.value }))} />
          <TextField fullWidth label="Order ID (optional)" sx={{ mb: 1 }} value={ticket.orderId} onChange={(e) => setTicket((p) => ({ ...p, orderId: e.target.value }))} />
          <TextField fullWidth label="Subject" sx={{ mb: 1 }} value={ticket.subject} onChange={(e) => setTicket((p) => ({ ...p, subject: e.target.value }))} />
          <TextField fullWidth multiline minRows={4} label="Message" sx={{ mb: 1 }} value={ticket.message} onChange={(e) => setTicket((p) => ({ ...p, message: e.target.value }))} />
          <Button type="submit" variant="contained">Submit Ticket</Button>
        </Box>
      </Paper>

    </Box>
  );
};

export default SupportCenterPage;
