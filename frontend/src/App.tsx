import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress, ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { useMemo } from 'react';
import { useAuth } from './context/AuthContext';
import { useSettings } from './context/SettingsContext';
import Layout from './components/Layout';
import { typography } from './theme/typography';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Items from './pages/Items';
import Categories from './pages/Categories';
import Suppliers from './pages/Suppliers';
import PurchaseOrders from './pages/PurchaseOrders';
import PurchaseRequests from './pages/PurchaseRequests';
import Inventory from './pages/Inventory';
import Distribution from './pages/Distribution';
import StockManagement from './pages/StockManagement';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Reception from './pages/Reception';
import Services from './pages/Services';
import Customers from './pages/Customers';
import Licenses from './pages/Licenses';
import Invoices from './pages/Invoices';
import AuditLogs from './pages/AuditLogs';
import RegisteredTenants from './pages/RegisteredTenants';
import Stores from './pages/Stores';
import StoreTransfers from './pages/StoreTransfers';
import GoodsReceiving from './pages/GoodsReceiving';
import ItemIssues from './pages/ItemIssues';
import FinancialReports from './pages/FinancialReports';
import Messages from './pages/Messages';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function DealerRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'dealer') return <Navigate to="/" replace />;
  return <>{children}</>;
}

function App() {
  const { user } = useAuth();
  const { themeMode } = useSettings();



  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: 'dark',
          primary:   { main: '#6366f1', light: '#818cf8', dark: '#4f46e5' },
          secondary: { main: '#8b5cf6', light: '#c084fc', dark: '#7c3aed' },
          success:   { main: '#34d399', light: '#6ee7b7', dark: '#059669' },
          error:     { main: '#f87171', light: '#fca5a5', dark: '#dc2626' },
          warning:   { main: '#fbbf24', light: '#fde68a', dark: '#d97706' },
          info:      { main: '#22d3ee', light: '#67e8f9', dark: '#0891b2' },
          background: {
            default: '#080c18',
            paper:   '#111827',
          },
          text: {
            primary:   '#f1f5f9',
            secondary: '#94a3b8',
            disabled:  '#475569',
          },
          divider: 'rgba(255,255,255,0.08)',
          action: {
            hover:    'rgba(255,255,255,0.05)',
            selected: 'rgba(99,102,241,0.12)',
          },
        },
        typography: {
          fontFamily: '"Plus Jakarta Sans", "Inter", "SF Pro Display", system-ui, sans-serif',
          h4: { ...typography.display, fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em' },
          h5: { ...typography.pageTitle, fontWeight: 700, letterSpacing: '-0.02em' },
          h6: { ...typography.sectionHeader, fontWeight: 700 },
          subtitle1: typography.bodyBold,
          subtitle2: { ...typography.bodyBold, fontSize: '0.8rem', letterSpacing: '0.02em' },
          body1: typography.body,
          body2: { ...typography.body, fontSize: '0.85rem' },
          button: { ...typography.button, fontWeight: 700, letterSpacing: '0.02em' },
          caption: typography.caption,
          overline: { ...typography.label, letterSpacing: '0.1em' },
        },
        shape: { borderRadius: 14 },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.12) transparent',
                '&::-webkit-scrollbar': { width: '6px', height: '6px' },
                '&::-webkit-scrollbar-thumb': { borderRadius: '3px', background: 'rgba(255,255,255,0.14)' },
                '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(255,255,255,0.22)' },
                '&::-webkit-scrollbar-track': { background: 'transparent' },
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 18,
                background: 'linear-gradient(135deg, #111827 0%, #141d2e 100%)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.07)',
                backgroundImage: 'none',
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                padding: '9px 22px',
                fontWeight: 700,
                boxShadow: 'none',
                textTransform: 'none',
                letterSpacing: '0.01em',
                '&:hover': { boxShadow: 'none' },
                transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
              },
              contained: {
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
                  boxShadow: '0 6px 20px rgba(99,102,241,0.55)',
                  transform: 'translateY(-1px)',
                },
              },
              outlined: {
                borderColor: 'rgba(255,255,255,0.14)',
                color: '#e2e8f0',
                backdropFilter: 'blur(8px)',
                background: 'rgba(255,255,255,0.04)',
                '&:hover': {
                  borderColor: 'rgba(99,102,241,0.6)',
                  background: 'rgba(99,102,241,0.1)',
                  transform: 'translateY(-1px)',
                },
              },
              text: {
                color: '#94a3b8',
                '&:hover': {
                  background: 'rgba(255,255,255,0.05)',
                  color: '#e2e8f0',
                },
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: 18,
                backgroundImage: 'none',
                background: '#111827',
              },
              outlined: { borderColor: 'rgba(255,255,255,0.08)' },
            },
          },
          MuiDialog: {
            styleOverrides: {
              paper: {
                borderRadius: 22,
                background: '#141d2e',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
              },
            },
          },
          MuiDialogTitle: {
            styleOverrides: {
              root: {
                fontWeight: 700,
                fontSize: '1.1rem',
                letterSpacing: '-0.01em',
                color: '#f1f5f9',
              },
            },
          },
          MuiTableHead: {
            styleOverrides: {
              root: {
                '& .MuiTableCell-head': {
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.09em',
                  color: '#64748b',
                  background: '#0d1224',
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                },
              },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              root: {
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                padding: '13px 16px',
                color: '#cbd5e1',
              },
            },
          },
          MuiTableRow: {
            styleOverrides: {
              root: {
                transition: 'background 0.15s ease',
                '&:hover': { background: 'rgba(255,255,255,0.03)' },
              },
            },
          },
          MuiTableContainer: {
            styleOverrides: {
              root: { background: 'transparent' },
            },
          },
          MuiInputBase: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,255,255,0.12)',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.22)' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#6366f1',
                  boxShadow: '0 0 0 3px rgba(99,102,241,0.18)',
                },
              },
            },
          },
          MuiSelect: {
            styleOverrides: {
              root: { background: 'rgba(255,255,255,0.04)' },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                fontWeight: 600,
                fontSize: '0.72rem',
                letterSpacing: '0.02em',
              },
            },
          },
          MuiTooltip: {
            styleOverrides: {
              tooltip: {
                background: '#1e293b',
                color: '#e2e8f0',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                fontSize: '0.78rem',
                fontWeight: 500,
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              },
              arrow: { color: '#1e293b' },
            },
          },
          MuiPopover: {
            styleOverrides: {
              paper: {
                background: '#141d2e',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 18,
                boxShadow: '0 16px 48px rgba(0,0,0,0.65)',
              },
            },
          },
          MuiListItemButton: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
              },
            },
          },
          MuiLinearProgress: {
            styleOverrides: {
              root: {
                borderRadius: 4,
                background: 'rgba(255,255,255,0.07)',
              },
              bar: {
                borderRadius: 4,
                background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
              },
            },
          },
          MuiToggleButton: {
            styleOverrides: {
              root: {
                borderRadius: '10px !important',
                border: '1px solid rgba(255,255,255,0.1) !important',
                color: '#64748b',
                fontWeight: 600,
                fontSize: '0.8rem',
                textTransform: 'none',
                transition: 'all 0.18s ease',
                '&.Mui-selected': {
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important',
                  color: '#fff !important',
                  borderColor: 'transparent !important',
                  boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
                },
                '&:hover': {
                  background: 'rgba(99,102,241,0.12)',
                  color: '#e2e8f0',
                },
              },
            },
          },
          MuiFab: {
            styleOverrides: {
              root: {
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                boxShadow: '0 8px 20px rgba(99,102,241,0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
                  boxShadow: '0 12px 28px rgba(99,102,241,0.55)',
                },
              },
            },
          },
          MuiBadge: {
            styleOverrides: {
              badge: {
                fontWeight: 700,
                fontSize: '0.65rem',
                background: '#f87171',
                boxShadow: '0 0 8px rgba(248,113,113,0.5)',
              },
            },
          },
        },
      }),
    [themeMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {!user ? (
          <Route path="/" element={<Landing />} />
        ) : (
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="items" element={<Items />} />
            <Route path="categories" element={<Categories />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="purchase-orders" element={<PurchaseOrders />} />
            <Route path="purchase-requests" element={<PurchaseRequests />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="distribution" element={<Distribution />} />
            <Route path="stock-management" element={<StockManagement />} />
            <Route path="users" element={<Users />} />
            <Route path="stores" element={<Stores />} />
            <Route path="store-transfers" element={<StoreTransfers />} />
            <Route path="goods-receiving" element={<GoodsReceiving />} />
            <Route path="item-issues" element={<ItemIssues />} />
            <Route path="financial-reports" element={<FinancialReports />} />
            <Route path="messages" element={<Messages />} />
            <Route path="customers" element={<Customers />} />
            <Route path="registered-tenants" element={<DealerRoute><RegisteredTenants /></DealerRoute>} />
            <Route path="licenses" element={<DealerRoute><Licenses /></DealerRoute>} />
            <Route path="reports" element={<Reports />} />
            <Route path="reception" element={<Reception />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="services" element={<Services />} />
            <Route path="audit-logs" element={<AuditLogs />} />
          </Route>
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
