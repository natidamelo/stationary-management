import { Box, Typography, Card, CardContent, Grid, Alert, LinearProgress } from '@mui/material';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import MonetizationOnRoundedIcon from '@mui/icons-material/MonetizationOnRounded';
import SummarizeRoundedIcon from '@mui/icons-material/SummarizeRounded';

export default function FinancialReports() {
  // Mock data representing stationery financial state
  const metrics = [
    { title: 'Total Revenue', value: 'ETB 145,280.00', change: '+12.5% vs last month', icon: <TrendingUpRoundedIcon color="primary" sx={{ fontSize: 30 }} /> },
    { title: 'Cost of Goods Sold (COGS)', value: 'ETB 82,450.00', change: '56.7% of revenue', icon: <AccountBalanceWalletRoundedIcon color="warning" sx={{ fontSize: 30 }} /> },
    { title: 'Gross Profit', value: 'ETB 62,830.00', change: 'Margin: 43.3%', icon: <MonetizationOnRoundedIcon color="success" sx={{ fontSize: 30 }} /> },
    { title: 'Operating Expenses', value: 'ETB 14,200.00', change: 'Rent & Logistics', icon: <SummarizeRoundedIcon color="error" sx={{ fontSize: 30 }} /> },
  ];

  return (
    <Box sx={{ animation: 'fadeIn 0.3s ease-out', '@keyframes fadeIn': { from: { opacity: 0 }, to: { opacity: 1 } } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>Financial Reports</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          Overview of stationery sales revenue, COGS, profits, and expense reports
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 4, borderRadius: 2 }}>
        This is a live financial overview dashboard showing metrics aggregated across all active store locations.
      </Alert>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metrics.map((m, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>{m.title}</Typography>
                  <Typography variant="h5" fontWeight={700} sx={{ mt: 1, mb: 0.5 }}>{m.value}</Typography>
                  <Typography variant="caption" color="text.secondary" display="block">{m.change}</Typography>
                </Box>
                {m.icon}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Profitability Summary</Typography>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" fontWeight={600}>Net Margin Progress Goal</Typography>
            <Typography variant="body2" fontWeight={600}>72% Achieved</Typography>
          </Box>
          <LinearProgress variant="determinate" value={72} sx={{ height: 8, borderRadius: 4, bgcolor: 'action.hover' }} />
        </Box>
        <Typography variant="body2" color="text.secondary">
          Estimated Net Profit: <strong>ETB 48,630.00</strong> (after subtracting operating expenses from gross profit).
        </Typography>
      </Card>
    </Box>
  );
}
