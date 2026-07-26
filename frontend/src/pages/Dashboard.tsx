import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  CheckCheck,
  Plus,
  Tags,
  Package,
  BarChart2,
  ArrowRight,
  TrendingUp,
  Flag,
  Zap,
  Loader2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

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

const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border/80 rounded-xl p-3 shadow-xl">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <p className="text-base font-extrabold text-primary">
          ${typeof payload[0].value === 'number'
            ? payload[0].value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
            : payload[0].value}
        </p>
      </div>
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
    api
      .get<Summary>('/dashboard/summary')
      .then((r) => {
        setSummary(r.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    setSalesChartLoading(true);
    api
      .get<SalesChartPoint[]>(`/dashboard/sales-chart?period=${salesChartPeriod}`)
      .then((r) => setSalesChartData(r.data ?? []))
      .catch(() => setSalesChartData([]))
      .finally(() => setSalesChartLoading(false));
  }, [salesChartPeriod]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Loading dashboard...</p>
      </div>
    );
  }

  if (!summary) {
    return <p className="text-muted-foreground">Failed to load dashboard.</p>;
  }

  const firstName = (user?.fullName ?? 'User').split(' ')[0];
  const role = user?.role ?? '';

  const kpiCards = [
    {
      label: 'Pending Approvals',
      value: summary.pendingApprovals,
      sub: 'Awaiting approval',
      icon: <CheckCircle2 className="h-5 w-5 text-primary" />,
      colorClass: 'border-primary/30 shadow-primary/10',
    },
    {
      label: 'Completed',
      value: summary.todayCompletedSales ?? 0,
      sub: 'Sales today',
      icon: <CheckCheck className="h-5 w-5 text-success" />,
      colorClass: 'border-success/30 shadow-success/10',
    },
    {
      label: 'Low Stock Items',
      value: summary.lowStockCount,
      sub: 'Need reorder',
      icon: <AlertTriangle className="h-5 w-5 text-warning" />,
      colorClass: 'border-warning/30 shadow-warning/10',
    },
    {
      label: 'Revenue',
      value: `$${(summary.todayRevenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: 'Today',
      icon: <DollarSign className="h-5 w-5 text-accent-foreground" />,
      colorClass: 'border-accent/30 shadow-accent/10',
    },
  ];

  const quickActions = [
    { label: 'Add New Item', path: '/items', icon: <Plus className="h-5 w-5" /> },
    { label: 'Categories', path: '/categories', icon: <Tags className="h-5 w-5" /> },
    { label: 'Inventory', path: '/inventory', icon: <Package className="h-5 w-5" /> },
    ...(isAdminOrManager(role)
      ? [{ label: 'View Reports', path: '/reports', icon: <BarChart2 className="h-5 w-5" /> }]
      : []),
  ];

  const activityItems = [
    summary.pendingApprovals > 0 && {
      text: `${summary.pendingApprovals} pending approval(s) need attention`,
      dotClass: 'bg-primary shadow-[0_0_8px_var(--color-primary)]',
      time: '1 day ago',
    },
    summary.draftPurchaseOrders > 0 && {
      text: `${summary.draftPurchaseOrders} draft purchase order(s)`,
      dotClass: 'bg-warning shadow-[0_0_8px_var(--color-warning)]',
      time: 'Today',
    },
    summary.lowStockCount > 0 && {
      text: `${summary.lowStockCount} low stock item(s) — reorder soon`,
      dotClass: 'bg-destructive shadow-[0_0_8px_var(--color-destructive)]',
      time: 'Today',
    },
  ].filter(Boolean) as { text: string; dotClass: string; time: string }[];

  if (activityItems.length === 0) {
    activityItems.push({
      text: 'All systems healthy & up to date',
      dotClass: 'bg-success shadow-[0_0_8px_var(--color-success)]',
      time: 'Today',
    });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-transparent border border-primary/20 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="h-5 w-5 text-warning fill-warning/20 animate-pulse" />
          <h1 className="text-2xl font-extrabold tracking-tight gradient-text">
            Welcome back, {firstName}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground font-medium">
          Here&apos;s what&apos;s happening at your stationery today.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <Card
            key={kpi.label}
            className={`transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${kpi.colorClass}`}
          >
            <CardContent className="p-5 flex items-start justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1">
                  {kpi.label}
                </p>
                <p className="text-2xl font-black text-foreground tracking-tight">
                  {kpi.value}
                </p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">{kpi.sub}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/60 border border-border">
                {kpi.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sales Overview Chart */}
      <Card className="border-border/80 shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/15 border border-primary/25 text-primary">
                <BarChart2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">Sales Overview</h3>
                <p className="text-xs text-muted-foreground">Revenue by period</p>
              </div>
            </div>

            {/* Chart Period Selector */}
            <div className="flex rounded-lg bg-muted p-1 gap-1">
              {(['day', 'week', 'month', 'year'] as SalesChartPeriod[]).map((period) => (
                <button
                  key={period}
                  onClick={() => setSalesChartPeriod(period)}
                  className={`px-3 py-1 text-xs font-bold rounded-md capitalize transition-all ${
                    salesChartPeriod === period
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full h-64">
            {salesChartLoading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : salesChartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <BarChart2 className="h-10 w-10 opacity-30" />
                <p className="text-xs">No sales data for this period</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesChartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={3} fill="url(#salesGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grid: Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="space-y-3">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground block">
            Quick Actions
          </span>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="p-4 rounded-xl border border-border bg-card hover:bg-accent/10 hover:border-primary/40 transition-all duration-200 flex flex-col items-center gap-2.5 text-center group shadow-sm"
              >
                <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                  {action.icon}
                </div>
                <span className="text-xs font-semibold text-foreground">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-3">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground block">
            Recent Activity
          </span>
          <Card className="h-[calc(100%-24px)]">
            <CardContent className="p-4 space-y-3">
              {activityItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className={`h-2.5 w-2.5 rounded-full mt-1.5 shrink-0 ${item.dotClass}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground leading-snug">
                      {item.text}
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      {item.time}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Low Stock Table Section */}
      {summary.lowStockItems.length > 0 && (
        <Card className="border-warning/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <div>
                  <h3 className="font-bold text-base text-foreground">Low Stock Items</h3>
                  <p className="text-xs text-muted-foreground">Items requiring reorder</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => navigate('/inventory')}
              >
                View all
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Current</TableHead>
                  <TableHead className="text-right">Reorder Level</TableHead>
                  <TableHead className="w-36">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.lowStockItems.map((item) => {
                  const pct = Math.min((item.currentStock / item.reorderLevel) * 100, 100);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{item.sku}</TableCell>
                      <TableCell className="font-semibold text-foreground">{item.name}</TableCell>
                      <TableCell className="text-right font-bold text-warning">{item.currentStock}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{item.reorderLevel}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={pct} className="h-2 flex-1" />
                          <span className="text-[10px] font-bold text-muted-foreground">{Math.round(pct)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
