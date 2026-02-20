import { Box, Paper, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../api/client';

// Admin-only reports dashboard with aggregated activity metrics.
const AdminReportsPage = () => {
  const [report, setReport] = useState({ actionSummary: [], dailyActivity: [] });

  useEffect(() => {
    const loadReport = async () => {
      const { data } = await api.get('/admin/reports');
      setReport(data);
    };

    loadReport();
  }, []);

  const activityByDay = useMemo(() => {
    const dayMap = new Map();

    report.dailyActivity.forEach((row) => {
      const current = dayMap.get(row.day) || { day: row.day, CREATE_ACCOUNT: 0, LOGIN: 0, LOGOUT: 0, PURCHASE: 0 };
      current[row.action] = row.count;
      dayMap.set(row.day, current);
    });

    return [...dayMap.values()].sort((a, b) => a.day.localeCompare(b.day)).slice(-14);
  }, [report.dailyActivity]);

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Typography variant="h4">Admin Reports</Typography>

      <Paper sx={{ p: 2, height: 320 }}>
        <Typography sx={{ mb: 1 }}>Action Summary</Typography>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={report.actionSummary}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="action" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#0d9488" />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      <Paper sx={{ p: 2, height: 340 }}>
        <Typography sx={{ mb: 1 }}>Daily Activity (Last 14 Days)</Typography>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={activityByDay}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="CREATE_ACCOUNT" stroke="#ea580c" />
            <Line type="monotone" dataKey="LOGIN" stroke="#0d9488" />
            <Line type="monotone" dataKey="LOGOUT" stroke="#334155" />
            <Line type="monotone" dataKey="PURCHASE" stroke="#16a34a" />
          </LineChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
};

export default AdminReportsPage;
