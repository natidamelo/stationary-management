import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { typography } from '../theme/typography';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Button,
  Chip,
  LinearProgress,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';
import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import ElectricBoltRoundedIcon from '@mui/icons-material/ElectricBoltRounded';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

type Summary = {
  pendingApprovals: number;
  draftPurchaseOrders: number;
  lowStockCount: number;
  lowStockItems: Array<{ id: string; name: string; sku: string; currentStock: number; reorderLevel: number }>;
  todayRevenue?: number;
  todayCompletedSales?: number;
  todaySalesCount?: number;
};

type SalesChartPoint = { label: string; revenue: number; date: string };
type SalesChartPeriod = 'day' | 'week' | 'month' | 'year';

const isAdminOrManager = (role: string) => role === 'admin' || role === 'manager';

// Custom tooltip for chart
const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: '12px',
          p: 1.5,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}
      >
        <Typography sx={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: '#818cf8' }}>
          {typeof payload[0].value === 'number'
            ? payload[0].value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
            : payload[0].value}
        </Typography>
      </Box>
    );
  }
  return null;
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [salesChartPeriod, setSalesChartPeriod] = useState<SalesChartPeriod>('week');
  const [salesChartData, setSalesChartData] = useState<SalesChartPoint[]>([]);
  const [salesChartLoading, setSalesChartLoading] = useState(true);

  useEffect(() => {
    api.get<Summary>('/dashboard/summary').then((r) => {
      setSummary(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    setSalesChartLoading(true);
    api.get<SalesChartPoint[]>(`/dashboard/sales-chart?period=${salesChartPeriod}`)
      .then((r) => setSalesChartData(r.data ?? []))
      .catch(() => setSalesChartData([]))
      .finally(() => setSalesChartLoading(false));
  }, [salesChartPeriod]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 12 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
            <CircularProgress size={48} thickness={3} sx={{ color: '#6366f1' }} />
            <Box sx={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ElectricBoltRoundedIcon sx={{ fontSize: '1.2rem', color: '#818cf8' }} />
            </Box>
          </Box>
          <Typography sx={{ color: '#475569', fontSize: '0.875rem', fontWeight: 500 }}>
            Loading dashboard...
          </Typography>
        </Box>
      </Box>
    );
  }
  if (!summary) {
    return <Typography sx={{ color: '#64748b' }}>Failed to load dashboard.</Typography>;
  }

  const firstName = (user?.fullName ?? 'User').split(' ')[0];
  const role = user?.role ?? '';

  const kpiCards = [
    {
      label: 'Pending Approvals',
      value: summary.pendingApprovals,
      sub: 'Awaiting approval',
      icon: <CheckCircleOutlineRoundedIcon sx={{ fontSize: '1.4rem' }} />,
      gradient: 'linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)',
      glowColor: 'rgba(99,102,241,0.4)',
      iconBg: 'rgba(99,102,241,0.2)',
      iconColor: '#818cf8',
      borderColor: 'rgba(99,102,241,0.25)',
    },
    {
      label: 'Completed',
      value: summary.todayCompletedSales ?? 0,
      sub: 'Sales today',
      icon: <DoneAllRoundedIcon sx={{ fontSize: '1.4rem' }} />,
      gradient: 'linear-gradient(135deg, #059669 0%, #34d399 100%)',
      glowColor: 'rgba(52,211,153,0.35)',
      iconBg: 'rgba(52,211,153,0.15)',
      iconColor: '#34d399',
      borderColor: 'rgba(52,211,153,0.25)',
    },
    {
      label: 'Low Stock Items',
      value: summary.lowStockCount,
      sub: 'Need reorder',
      icon: <WarningAmberRoundedIcon sx={{ fontSize: '1.4rem' }} />,
      gradient: 'linear-gradient(135deg, #d97706 0%, #fbbf24 100%)',
      glowColor: 'rgba(251,191,36,0.35)',
      iconBg: 'rgba(251,191,36,0.15)',
      iconColor: '#fbbf24',
      borderColor: 'rgba(251,191,36,0.25)',
    },
    {
      label: 'Revenue',
      value: `$${(summary.todayRevenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: 'Today',
      icon: <AttachMoneyRoundedIcon sx={{ fontSize: '1.4rem' }} />,
      gradient: 'linear-gradient(135deg, #7c3aed 0%, #c084fc 100%)',
      glowColor: 'rgba(192,132,252,0.35)',
      iconBg: 'rgba(139,92,246,0.15)',
      iconColor: '#c084fc',
      borderColor: 'rgba(139,92,246,0.25)',
    },
  ];

  const quickActions = [
    { label: 'Add New Item', path: '/items', icon: <AddRoundedIcon />, gradient: 'linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)', glow: 'rgba(99,102,241,0.35)' },
    { label: 'Categories', path: '/categories', icon: <CategoryRoundedIcon />, gradient: 'linear-gradient(135deg, #059669 0%, #34d399 100%)', glow: 'rgba(52,211,153,0.35)' },
    { label: 'Inventory', path: '/inventory', icon: <InventoryRoundedIcon />, gradient: 'linear-gradient(135deg, #d97706 0%, #fbbf24 100%)', glow: 'rgba(251,191,36,0.35)' },
    ...(isAdminOrManager(role) ? [{ label: 'View Reports', path: '/reports', icon: <AssessmentRoundedIcon />, gradient: 'linear-gradient(135deg, #7c3aed 0%, #c084fc 100%)', glow: 'rgba(192,132,252,0.35)' }] : []),
  ];

  const activityItems = [
    summary.pendingApprovals > 0 && { text: `${summary.pendingApprovals} pending approval(s) need attention`, dot: '#818cf8', dotGlow: 'rgba(129,140,248,0.4)', time: '1 day ago' },
    summary.draftPurchaseOrders > 0 && { text: `${summary.draftPurchaseOrders} draft purchase order(s)`, dot: '#fbbf24', dotGlow: 'rgba(251,191,36,0.4)', time: 'Today' },
    summary.lowStockCount > 0 && { text: `${summary.lowStockCount} low stock item(s) — reorder soon`, dot: '#f87171', dotGlow: 'rgba(248,113,113,0.4)', time: 'Today' },
  ].filter(Boolean) as { text: string; dot: string; dotGlow: string; time: string }[];

  if (activityItems.length === 0) {
    activityItems.push({ text: 'All systems up to date', dot: '#34d399', dotGlow: 'rgba(52,211,153,0.4)', time: 'Today' });
  }

  return (
    <Box sx={{ animation: 'fadeIn 0.35s ease-out' }}>

      {/* ── Welcome Header ── */}
      <Box
        sx={{
          mb: 4,
          p: 3,
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.06) 50%, rgba(8,12,24,0) 100%)',
          border: '1px solid rgba(99,102,241,0.15)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -40,
            right: -40,
            width: 200,
            height: 200,
            background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 65%)',
            borderRadius: '50%',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <ElectricBoltRoundedIcon sx={{ color: '#fbbf24', fontSize: '1.3rem', filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.6))' }} />
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: '1.5rem',
              letterSpacing: '-0.025em',
              background: 'linear-gradient(135deg, #f1f5f9 0%, #818cf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Welcome back, {firstName}
          </Typography>
        </Box>
        <Typography sx={{ color: '#475569', fontSize: '0.875rem', fontWeight: 500, position: 'relative' }}>
          Here&apos;s what&apos;s happening at your stationery today.
        </Typography>
      </Box>

      {/* ── KPI Cards ── */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {kpiCards.map((kpi, idx) => (
          <Grid size={{ xs: 6, sm: 3 }} key={kpi.label} sx={{ display: 'flex' }}>
            <Box
              sx={{
                width: '100%',
                borderRadius: '20px',
                p: '1px',
                background: kpi.gradient,
                boxShadow: `0 8px 32px ${kpi.glowColor}`,
                transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                animation: `fadeInUp 0.4s ease-out ${idx * 0.08}s both`,
                '&:hover': {
                  transform: 'translateY(-5px) scale(1.01)',
                  boxShadow: `0 16px 40px ${kpi.glowColor}`,
                },
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '19px',
                  background: 'linear-gradient(135deg, #111827 0%, #0d1224 100%)',
                  p: 2.5,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#475569',
                      mb: 1,
                    }}
                  >
                    {kpi.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '2rem',
                      fontWeight: 900,
                      letterSpacing: '-0.035em',
                      color: '#f1f5f9',
                      lineHeight: 1,
                      mb: 0.75,
                    }}
                  >
                    {kpi.value}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                    {kpi.sub}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: '14px',
                    background: kpi.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: kpi.iconColor,
                    flexShrink: 0,
                    border: `1px solid ${kpi.borderColor}`,
                    boxShadow: `0 4px 12px ${kpi.glowColor}`,
                  }}
                >
                  {kpi.icon}
                </Box>
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* ── Sales Chart ── */}
      <Card
        sx={{
          mb: 4,
          background: 'linear-gradient(135deg, #111827 0%, #0d1224 100%)',
          border: '1px solid rgba(99,102,241,0.15)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          overflow: 'hidden',
          position: 'relative',
          animation: 'fadeInUp 0.4s ease-out 0.2s both',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #c084fc 100%)',
            boxShadow: '0 0 12px rgba(99,102,241,0.6)',
          },
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '13px',
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.15) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#818cf8',
                  border: '1px solid rgba(99,102,241,0.25)',
                }}
              >
                <BarChartRoundedIcon sx={{ fontSize: '1.4rem' }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#f1f5f9', letterSpacing: '-0.01em' }}>
                  Sales Overview
                </Typography>
                <Typography sx={{ fontSize: '0.78rem', color: '#475569', fontWeight: 500 }}>
                  Revenue by period
                </Typography>
              </Box>
            </Box>
            <ToggleButtonGroup
              value={salesChartPeriod}
              exclusive
              onChange={(_, v) => v != null && setSalesChartPeriod(v)}
              size="small"
            >
              <ToggleButton value="day">Day</ToggleButton>
              <ToggleButton value="week">Week</ToggleButton>
              <ToggleButton value="month">Month</ToggleButton>
              <ToggleButton value="year">Year</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box sx={{ width: '100%', minWidth: 0 }}>
            {salesChartLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 280 }}>
                <CircularProgress size={36} thickness={3} sx={{ color: '#6366f1' }} />
              </Box>
            ) : salesChartData.length === 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 280, gap: 1 }}>
                <BarChartRoundedIcon sx={{ fontSize: '2.5rem', color: 'rgba(255,255,255,0.1)' }} />
                <Typography sx={{ color: '#334155', fontSize: '0.875rem' }}>No sales data for this period</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={280} minHeight={1}>
                <AreaChart data={salesChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" stopOpacity={0.4} />
                      <stop offset="60%" stopColor="#6366f1" stopOpacity={0.1} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#334155', fontWeight: 500 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#334155', fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#818cf8"
                    strokeWidth={3}
                    fill="url(#salesGradient)"
                    dot={{ fill: '#6366f1', strokeWidth: 2, r: 4, stroke: '#818cf8' }}
                    activeDot={{ r: 6, fill: '#c084fc', stroke: '#818cf8', strokeWidth: 2, filter: 'url(#glow)' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Box>

          {!salesChartLoading && salesChartData.length > 0 && (
            <Box
              sx={{
                mt: 2,
                pt: 2,
                borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpRoundedIcon sx={{ fontSize: '1rem', color: '#34d399' }} />
                <Typography sx={{ fontSize: '0.845rem', color: '#94a3b8', fontWeight: 600 }}>
                  Total revenue:{' '}
                  <Box component="strong" sx={{ color: '#e2e8f0' }}>
                    {salesChartData.reduce((s, d) => s + d.revenue, 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </Box>
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '0.78rem', color: '#334155' }}>
                {salesChartData.length}{' '}
                {salesChartPeriod === 'day' ? 'days' : salesChartPeriod === 'week' ? 'weeks' : salesChartPeriod === 'month' ? 'months' : 'years'}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ── Today's Overview + Alerts ── */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography
            sx={{
              display: 'block', mb: 2,
              fontSize: '0.62rem', letterSpacing: '0.1em', fontWeight: 800,
              color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase',
            }}
          >
            Today&apos;s Overview
          </Typography>
          <Grid container spacing={2}>
            {/* Completed card */}
            <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex' }}>
              <Box sx={{ width: '100%', borderRadius: '18px', p: '1px', background: 'linear-gradient(135deg, #059669, #34d399)', boxShadow: '0 6px 20px rgba(52,211,153,0.25)', transition: 'all 0.25s ease', '&:hover': { transform: 'translateY(-3px)' } }}>
                <Box sx={{ width: '100%', height: '100%', borderRadius: '17px', background: '#111827', p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
                    <TrendingUpRoundedIcon sx={{ fontSize: '1rem', color: '#34d399' }} />
                    <Typography sx={{ fontWeight: 800, color: '#34d399', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Completed
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.035em', color: '#f1f5f9', lineHeight: 1 }}>
                    {summary.todayCompletedSales ?? 0}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: '#475569', mt: 0.5 }}>Sales today</Typography>
                </Box>
              </Box>
            </Grid>
            {/* Pending card */}
            <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex' }}>
              <Box sx={{ width: '100%', borderRadius: '18px', p: '1px', background: 'linear-gradient(135deg, #6366f1, #818cf8)', boxShadow: '0 6px 20px rgba(99,102,241,0.3)', transition: 'all 0.25s ease', '&:hover': { transform: 'translateY(-3px)' } }}>
                <Box sx={{ width: '100%', height: '100%', borderRadius: '17px', background: '#111827', p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
                    <FlagRoundedIcon sx={{ fontSize: '1rem', color: '#818cf8' }} />
                    <Typography sx={{ fontWeight: 800, color: '#818cf8', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Pending
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.035em', color: '#f1f5f9', lineHeight: 1 }}>
                    {summary.pendingApprovals + summary.draftPurchaseOrders}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: '#475569', mt: 0.5 }}>Approvals & drafts</Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Grid>

        {/* Alerts */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography
            sx={{
              display: 'block', mb: 2,
              fontSize: '0.62rem', letterSpacing: '0.1em', fontWeight: 800,
              color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase',
            }}
          >
            Alerts
          </Typography>
          <Box
            sx={{
              borderRadius: '18px',
              p: '1px',
              background: summary.lowStockCount > 0
                ? 'linear-gradient(135deg, #dc2626, #f87171)'
                : 'linear-gradient(135deg, #334155, #475569)',
              boxShadow: summary.lowStockCount > 0 ? '0 6px 20px rgba(248,113,113,0.25)' : 'none',
              transition: 'all 0.25s ease',
              '&:hover': { transform: 'translateY(-2px)' },
            }}
          >
            <Box
              sx={{
                borderRadius: '17px',
                background: '#111827',
                p: 2.25,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: '14px',
                  background: summary.lowStockCount > 0 ? 'rgba(248,113,113,0.12)' : 'rgba(100,116,139,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  border: `1px solid ${summary.lowStockCount > 0 ? 'rgba(248,113,113,0.25)' : 'rgba(100,116,139,0.15)'}`,
                }}
              >
                <WarningAmberRoundedIcon sx={{ color: summary.lowStockCount > 0 ? '#f87171' : '#475569', fontSize: '1.5rem' }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 700, color: summary.lowStockCount > 0 ? '#f87171' : '#475569', fontSize: '0.9rem', mb: 0.25 }}>
                  {summary.lowStockCount > 0 ? `${summary.lowStockCount} Low Stock Item${summary.lowStockCount !== 1 ? 's' : ''}` : 'No upcoming alerts'}
                </Typography>
                <Typography sx={{ fontSize: '0.78rem', color: '#475569' }}>
                  {summary.lowStockCount > 0 ? 'Reorder supplies needed urgently.' : 'All stock levels are healthy.'}
                </Typography>
              </Box>
              {summary.lowStockCount > 0 && (
                <Chip
                  label="Urgent"
                  size="small"
                  sx={{
                    background: 'rgba(248,113,113,0.15)',
                    color: '#f87171',
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    height: 22,
                    border: '1px solid rgba(248,113,113,0.3)',
                    flexShrink: 0,
                  }}
                />
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* ── Quick Actions + Recent Activity ── */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography
            sx={{
              display: 'block', mb: 2,
              fontSize: '0.62rem', letterSpacing: '0.1em', fontWeight: 800,
              color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase',
            }}
          >
            Quick Actions
          </Typography>
          <Grid container spacing={1.5}>
            {quickActions.map((action, idx) => (
              <Grid size={{ xs: 6 }} key={action.path} sx={{ display: 'flex' }}>
                <Box
                  onClick={() => navigate(action.path)}
                  sx={{
                    width: '100%',
                    borderRadius: '16px',
                    p: '1px',
                    background: action.gradient,
                    boxShadow: `0 4px 16px ${action.glow}`,
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                    animation: `fadeInUp 0.4s ease-out ${0.25 + idx * 0.07}s both`,
                    '&:hover': {
                      transform: 'translateY(-4px) scale(1.02)',
                      boxShadow: `0 10px 28px ${action.glow}`,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '15px',
                      background: '#111827',
                      p: 2.25,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1.25,
                      textAlign: 'center',
                    }}
                  >
                    <Box
                      sx={{
                        width: 46,
                        height: 46,
                        borderRadius: '13px',
                        background: action.gradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        boxShadow: `0 4px 12px ${action.glow}`,
                      }}
                    >
                      {action.icon}
                    </Box>
                    <Typography sx={{ color: '#cbd5e1', fontSize: '0.845rem', fontWeight: 600, lineHeight: 1.3 }}>
                      {action.label}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Recent Activity */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography
            sx={{
              display: 'block', mb: 2,
              fontSize: '0.62rem', letterSpacing: '0.1em', fontWeight: 800,
              color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase',
            }}
          >
            Recent Activity
          </Typography>
          <Card sx={{ minHeight: 200 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
                {activityItems.map((item, i) => (
                  <Box
                    key={i}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1.5,
                      py: 1.5,
                      borderBottom: i < activityItems.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                      transition: 'all 0.15s ease',
                      borderRadius: '10px',
                      px: 1,
                      mx: -1,
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: item.dot,
                        mt: 0.85,
                        flexShrink: 0,
                        boxShadow: `0 0 0 3px ${item.dotGlow}`,
                        filter: `drop-shadow(0 0 4px ${item.dot})`,
                      }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 500, color: '#cbd5e1', fontSize: '0.845rem', lineHeight: 1.5 }}>
                        {item.text}
                      </Typography>
                      <Typography sx={{ fontSize: '0.72rem', color: '#334155' }}>
                        {item.time}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Low Stock Table ── */}
      {summary.lowStockItems.length > 0 && (
        <Card sx={{ mt: 4, animation: 'fadeInUp 0.4s ease-out 0.3s both' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                  <WarningAmberRoundedIcon sx={{ color: '#fbbf24', fontSize: '1.1rem' }} />
                  <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#f1f5f9', letterSpacing: '-0.01em' }}>
                    Low Stock Items
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '0.78rem', color: '#475569' }}>Items that need reordering soon</Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: '1rem !important' }} />}
                onClick={() => navigate('/inventory')}
              >
                View all
              </Button>
            </Box>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', background: 'transparent' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>SKU</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell align="right">Current</TableCell>
                    <TableCell align="right">Reorder Level</TableCell>
                    <TableCell sx={{ width: 150 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summary.lowStockItems.map((item) => {
                    const pct = Math.min((item.currentStock / item.reorderLevel) * 100, 100);
                    const color = pct < 30 ? '#f87171' : pct < 60 ? '#fbbf24' : '#34d399';
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#475569' }}>{item.sku}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.845rem', color: '#e2e8f0' }}>{item.name}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography sx={{ fontWeight: 700, color, fontSize: '0.875rem' }}>{item.currentStock}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography sx={{ color: '#475569', fontSize: '0.845rem' }}>{item.reorderLevel}</Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={pct}
                              sx={{
                                flex: 1,
                                height: 6,
                                borderRadius: 3,
                                background: 'rgba(255,255,255,0.07)',
                                '& .MuiLinearProgress-bar': {
                                  background: `linear-gradient(90deg, ${color}, ${color}aa)`,
                                  borderRadius: 3,
                                  boxShadow: `0 0 8px ${color}60`,
                                },
                              }}
                            />
                            <Typography sx={{ color, fontWeight: 700, fontSize: '0.72rem', minWidth: 32 }}>
                              {Math.round(pct)}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
