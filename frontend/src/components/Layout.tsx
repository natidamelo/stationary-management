import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { typography } from '../theme/typography';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  AppBar,
  Toolbar,
  Avatar,
  IconButton,
  Tooltip,
  Chip,
  Badge,
  Popover,
  useTheme,
  Fab,
  Fade,
  FormControl,
  Select,
  MenuItem,
  alpha,
} from '@mui/material';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import PointOfSaleRoundedIcon from '@mui/icons-material/PointOfSaleRounded';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import VpnKeyRoundedIcon from '@mui/icons-material/VpnKeyRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import LocalAtmRoundedIcon from '@mui/icons-material/LocalAtmRounded';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import InboxRoundedIcon from '@mui/icons-material/InboxRounded';
import CallMadeRoundedIcon from '@mui/icons-material/CallMadeRounded';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import FiberManualRecordRoundedIcon from '@mui/icons-material/FiberManualRecordRounded';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useNotifications } from '../context/NotificationsContext';
import SettingsDialog from './SettingsDialog';
import GlobalSearch from './GlobalSearch';
import { api } from '../api/client';

const DRAWER_WIDTH = 268;

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/items': 'Products',
  '/categories': 'Categories',
  '/suppliers': 'Suppliers',
  '/purchase-orders': 'Purchase Orders',
  '/purchase-requests': 'Purchase Requisitions',
  '/stock-management': 'Stock Management',
  '/inventory': 'Inventory',
  '/distribution': 'Distribution',
  '/users': 'Users',
  '/customers': 'Customers',
  '/registered-tenants': 'Registered Tenants',
  '/licenses': 'Licenses',
  '/reports': 'Reports',
  '/reception': 'Sales Reception',
  '/invoices': 'Invoices',
  '/services': 'Services',
  '/audit-logs': 'Audit Logs',
  '/stores': 'Store Management',
  '/store-transfers': 'Store Transfers',
  '/goods-receiving': 'Goods Receiving',
  '/item-issues': 'Item Issues',
  '/financial-reports': 'Financial Reports',
  '/messages': 'Messages',
};

function formatDate() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export default function Layout() {
  const { user, logout, license } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const role = user?.role ?? '';
  const pathname = location.pathname;
  const pageTitle = pathname === '/purchase-requests' && location.search.includes('pending') ? 'Approvals' : (PAGE_TITLES[pathname] ?? 'Dashboard');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);
  const [showScroll, setShowScroll] = useState(false);
  const [stores, setStores] = useState<any[]>([]);

  const theme = useTheme();
  const { themeMode, toggleTheme } = useSettings();
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications();

  useEffect(() => {
    const handleScroll = () => setShowScroll(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (user && user.role !== 'dealer') {
      api.get('/stores')
        .then((r) => { setStores(r.data); })
        .catch((err) => console.error('Error fetching stores for select', err));
    }
  }, [user]);

  const handleStoreChange = async (storeId: string) => {
    try {
      await api.post(`/stores/switch/${storeId}`);
      if (user) {
        const updated = { ...user, storeId };
        localStorage.setItem('user', JSON.stringify(updated));
      }
      window.location.reload();
    } catch (err) {
      console.error('Failed to switch store', err);
    }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleLogout = () => { logout(); navigate('/login'); };

  const masterRegistriesGroup = [
    { to: '/categories', label: 'Categories', icon: <CategoryRoundedIcon fontSize="small" /> },
    ...(role === 'admin' || role === 'manager' || role === 'dealer' ? [{ to: '/stores', label: 'Stores', icon: <BusinessRoundedIcon fontSize="small" /> }] : []),
    { to: '/suppliers', label: 'Suppliers', icon: <LocalShippingRoundedIcon fontSize="small" /> },
    { to: '/items', label: 'Products', icon: <InventoryRoundedIcon fontSize="small" /> },
    { to: '/customers', label: 'Customers', icon: <GroupRoundedIcon fontSize="small" /> },
  ];

  const transactionsGroup = [
    { to: '/purchase-requests', label: 'Requisitions', icon: <AssignmentRoundedIcon fontSize="small" /> },
    { to: '/purchase-orders', label: 'Orders', icon: <ShoppingCartRoundedIcon fontSize="small" /> },
    { to: '/goods-receiving', label: 'Goods Receiving', icon: <InboxRoundedIcon fontSize="small" /> },
    { to: '/item-issues', label: 'Item Issues', icon: <CallMadeRoundedIcon fontSize="small" /> },
    { to: '/store-transfers', label: 'Store Transfers', icon: <SwapHorizRoundedIcon fontSize="small" /> },
    ...(role === 'reception' || role === 'admin' || role === 'manager' || role === 'dealer' ? [{ to: '/reception', label: 'Sales', icon: <PointOfSaleRoundedIcon fontSize="small" /> }] : []),
  ];

  const adminGroup = [
    ...(role === 'admin' || role === 'manager' || role === 'dealer' ? [{ to: '/users', label: 'Users', icon: <PeopleRoundedIcon fontSize="small" /> }] : []),
    { to: '/messages', label: 'Messages', icon: <ForumRoundedIcon fontSize="small" /> },
    ...(role === 'admin' || role === 'manager' || role === 'dealer' ? [{ to: '/reports', label: 'Reports', icon: <AssessmentRoundedIcon fontSize="small" /> }] : []),
  ];

  const dealerGroup = [
    ...(role === 'dealer' ? [
      { to: '/registered-tenants', label: 'Registered Tenants', icon: <BusinessRoundedIcon fontSize="small" /> },
      { to: '/licenses', label: 'Licenses', icon: <VpnKeyRoundedIcon fontSize="small" /> }
    ] : []),
  ];

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, mt: 2.5, mb: 0.75 }}>
      <Typography
        sx={{
          color: 'rgba(255,255,255,0.25)',
          fontSize: '0.62rem',
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {children}
      </Typography>
      <Box sx={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
    </Box>
  );

  const renderLink = (link: { to: string; label: string; icon: React.ReactNode }) => (
    <NavLink key={link.to + link.label} to={link.to} end={link.to === '/'} style={{ textDecoration: 'none', color: 'inherit' }}>
      {({ isActive }) => (
        <ListItemButton
          selected={isActive}
          sx={{
            borderRadius: '12px',
            mb: 0.25,
            py: 0.85,
            px: 1.5,
            minHeight: 42,
            mx: 0.75,
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
            ...(isActive ? {
              background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.15) 100%)',
              '&::before': {
                content: '""',
                position: 'absolute',
                left: 0, top: '20%', bottom: '20%',
                width: '3px',
                background: 'linear-gradient(180deg, #818cf8, #c084fc)',
                borderRadius: '0 3px 3px 0',
                boxShadow: '0 0 8px rgba(129,140,248,0.6)',
              },
              '& .MuiListItemIcon-root': { color: '#818cf8' },
              '& .MuiListItemText-primary': {
                color: '#e0e7ff',
                fontWeight: typography.fontWeightSemiBold,
              },
              '&:hover': {
                background: 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(139,92,246,0.2) 100%)',
              },
            } : {
              '&:hover': {
                background: 'rgba(255,255,255,0.05)',
                '& .MuiListItemIcon-root': { color: '#94a3b8' },
                '& .MuiListItemText-primary': { color: '#cbd5e1' },
              },
            }),
          }}
        >
          <ListItemIcon sx={{ minWidth: 34, color: isActive ? '#818cf8' : '#475569', transition: 'color 0.2s ease' }}>
            {link.icon}
          </ListItemIcon>
          <ListItemText
            primary={link.label}
            primaryTypographyProps={{
              fontSize: '0.865rem',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#e0e7ff' : '#64748b',
              sx: { transition: 'color 0.15s ease' },
            }}
          />
        </ListItemButton>
      )}
    </NavLink>
  );

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'linear-gradient(180deg, #080c18 0%, #0d1224 100%)' }}>

      {/* ── Brand / Logo ── */}
      <Box sx={{ p: 2.5, pb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: '13px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 16px rgba(99,102,241,0.45)',
            flexShrink: 0,
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: -1,
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.5), rgba(139,92,246,0.5))',
              zIndex: -1,
              filter: 'blur(6px)',
            },
          }}
        >
          <AutoAwesomeRoundedIcon sx={{ fontSize: '1.3rem' }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            noWrap
            sx={{
              fontWeight: 800,
              fontSize: '0.95rem',
              letterSpacing: '-0.01em',
              lineHeight: 1.15,
              background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {settings.stationeryName || 'WOUBREX PLC'}
          </Typography>
          <Typography
            sx={{
              fontSize: '0.6rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: 'rgba(255,255,255,0.28)',
              textTransform: 'uppercase',
            }}
          >
            STOCK MANAGEMENT
          </Typography>
        </Box>
      </Box>

      {/* ── User Card ── */}
      <Box
        sx={{
          mx: 1.5,
          mb: 1,
          p: 1.4,
          borderRadius: '14px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%)',
          border: '1px solid rgba(99,102,241,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          backdropFilter: 'blur(8px)',
        }}
      >
        <Avatar
          sx={{
            width: 36,
            height: 36,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            fontSize: '0.875rem',
            fontWeight: 800,
            boxShadow: '0 2px 10px rgba(99,102,241,0.35)',
            flexShrink: 0,
          }}
        >
          {(user?.fullName ?? 'U').charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            noWrap
            sx={{ color: '#e2e8f0', fontSize: '0.845rem', fontWeight: 600, lineHeight: 1.3 }}
          >
            {user?.fullName}
          </Typography>
          <Chip
            label={user?.role}
            size="small"
            sx={{
              height: 18,
              fontSize: '0.62rem',
              fontWeight: 700,
              textTransform: 'capitalize',
              background: 'rgba(99,102,241,0.25)',
              color: '#818cf8',
              border: '1px solid rgba(99,102,241,0.35)',
              '& .MuiChip-label': { px: 0.75 },
            }}
          />
        </Box>
        {/* Online indicator */}
        <Box sx={{ ml: 'auto', flexShrink: 0 }}>
          <FiberManualRecordRoundedIcon sx={{ fontSize: '0.65rem', color: '#34d399', filter: 'drop-shadow(0 0 4px #34d399)' }} />
        </Box>
      </Box>

      {/* ── Navigation ── */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          py: 0.5,
          '&::-webkit-scrollbar': { width: 3 },
          '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: 2 },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
        }}
      >
        <List sx={{ py: 0 }}>
          {/* Dashboard */}
          {renderLink({ to: '/', label: 'Dashboard', icon: <DashboardRoundedIcon fontSize="small" /> })}

          <SectionLabel>Master Registries</SectionLabel>
          {masterRegistriesGroup.map(renderLink)}

          <SectionLabel>Transactions & Sales</SectionLabel>
          {transactionsGroup.map(renderLink)}

          <SectionLabel>Admin & Reports</SectionLabel>
          {adminGroup.map(renderLink)}

          {dealerGroup.length > 0 && (
            <>
              <SectionLabel>Dealer Actions</SectionLabel>
              {dealerGroup.map(renderLink)}
            </>
          )}

          {/* Settings */}
          <Box sx={{ px: 0.75, mt: 1.5 }}>
            <ListItemButton
              onClick={() => setSettingsOpen(true)}
              sx={{
                borderRadius: '12px',
                py: 0.85,
                px: 1.5,
                minHeight: 42,
                transition: 'all 0.18s ease',
                '&:hover': {
                  background: 'rgba(255,255,255,0.05)',
                  '& .MuiListItemIcon-root': { color: '#94a3b8' },
                  '& .MuiListItemText-primary': { color: '#cbd5e1' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 34, color: '#475569' }}>
                <SettingsRoundedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Settings"
                primaryTypographyProps={{ fontSize: '0.865rem', fontWeight: 500, color: '#64748b' }}
              />
            </ListItemButton>
          </Box>
        </List>
      </Box>

      {/* ── Logout ── */}
      <Box sx={{ p: 1.5, pt: 1, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: '12px',
            py: 0.85,
            px: 1.5,
            transition: 'all 0.18s ease',
            '&:hover': {
              background: 'rgba(248,113,113,0.1)',
              '& .MuiListItemIcon-root': { color: '#f87171' },
              '& .MuiListItemText-primary': { color: '#f87171' },
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 34, color: '#475569' }}>
            <LogoutRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Logout"
            primaryTypographyProps={{ fontSize: '0.865rem', fontWeight: 500, color: '#64748b' }}
          />
        </ListItemButton>
        <Box sx={{ textAlign: 'center', mt: 1 }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.18)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.06em' }}>
            v1.0.0 • Ready
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#080c18' }}>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            background: '#080c18',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            overflow: 'hidden',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Permanent Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            background: '#080c18',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            overflow: 'hidden',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Main Area */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', width: { md: `calc(100% - ${DRAWER_WIDTH}px)` } }}>

        {/* ── AppBar ── */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            background: 'rgba(8,12,24,0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            color: 'text.primary',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.35)',
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 }, py: 1, minHeight: '62px !important' }}>

            {/* Left side */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{
                  display: { md: 'none' },
                  color: '#94a3b8',
                  '&:hover': { background: 'rgba(255,255,255,0.07)', color: '#e2e8f0' },
                }}
              >
                <MenuRoundedIcon />
              </IconButton>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ display: { xs: 'none', lg: 'flex' }, flexDirection: 'column' }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      fontSize: '1rem',
                      letterSpacing: '-0.01em',
                      color: '#f1f5f9',
                      lineHeight: 1.2,
                    }}
                  >
                    {pageTitle}
                  </Typography>
                </Box>
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ display: { xs: 'none', lg: 'block' }, borderColor: 'rgba(255,255,255,0.08)', mx: 0.5 }}
                />
                <Typography
                  sx={{
                    color: 'rgba(255,255,255,0.28)',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    fontSize: '0.62rem',
                    textTransform: 'uppercase',
                    display: { xs: 'none', md: 'block' },
                  }}
                >
                  {`${settings.stationeryName || 'WOUBREX'} STOCK MANAGEMENT SYSTEM`.toUpperCase()}
                </Typography>
              </Box>
            </Box>

            {/* Right side */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1.25 } }}>
              <GlobalSearch />
              <Divider orientation="vertical" flexItem sx={{ mx: 0.25, borderColor: 'rgba(255,255,255,0.07)', display: { xs: 'none', md: 'block' } }} />

              {/* Store Switcher */}
              {stores.length > 0 && (
                <FormControl size="small" sx={{ minWidth: 140, mr: 0.25 }}>
                  <Select
                    value={user?.storeId || ''}
                    onChange={(e) => handleStoreChange(e.target.value as string)}
                    displayEmpty
                    sx={{
                      borderRadius: '10px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#e2e8f0',
                      '& .MuiSelect-select': { py: '6px', px: 1.5, fontSize: '0.8rem', fontWeight: 600 },
                      '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    }}
                  >
                    {stores.map((s) => (
                      <MenuItem key={s.id} value={s.id} disabled={!s.isActive}>{s.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* License chip */}
              {license?.expiryDate && (
                <Chip
                  size="small"
                  label={`Licensed until ${new Date(license.expiryDate).toLocaleDateString()}`}
                  sx={{
                    background: 'rgba(52,211,153,0.12)',
                    color: '#34d399',
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    height: 24,
                    border: '1px solid rgba(52,211,153,0.25)',
                    display: { xs: 'none', sm: 'flex' },
                  }}
                />
              )}

              {/* Date */}
              <Typography
                sx={{
                  color: 'rgba(255,255,255,0.35)',
                  display: { xs: 'none', md: 'block' },
                  fontSize: '0.78rem',
                  fontWeight: 500,
                }}
              >
                {formatDate()}
              </Typography>

              <Divider orientation="vertical" flexItem sx={{ mx: 0.25, borderColor: 'rgba(255,255,255,0.07)', display: { xs: 'none', md: 'block' } }} />

              {/* User avatar + info */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar
                  sx={{
                    width: 34,
                    height: 34,
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    fontSize: '0.845rem',
                    fontWeight: 800,
                    boxShadow: '0 2px 10px rgba(99,102,241,0.4)',
                  }}
                >
                  {(user?.fullName ?? 'U').charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
                  <Typography sx={{ fontWeight: 600, lineHeight: 1.3, fontSize: '0.845rem', color: '#e2e8f0' }}>
                    {user?.fullName}
                  </Typography>
                  <Typography sx={{ textTransform: 'capitalize', fontSize: '0.7rem', color: '#64748b' }}>
                    {user?.role}
                  </Typography>
                </Box>
              </Box>

              {/* Theme toggle */}
              <Tooltip title={themeMode === 'light' ? 'Dark mode' : 'Light mode'}>
                <IconButton
                  size="small"
                  onClick={toggleTheme}
                  sx={{
                    color: '#64748b',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    width: 34,
                    height: 34,
                    transition: 'all 0.2s ease',
                    '&:hover': { color: '#e2e8f0', background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)' },
                  }}
                >
                  {themeMode === 'light' ? <DarkModeRoundedIcon fontSize="small" /> : <LightModeRoundedIcon fontSize="small" />}
                </IconButton>
              </Tooltip>

              {/* Notifications */}
              <Tooltip title="Notifications">
                <IconButton
                  size="small"
                  onClick={(e) => setNotifAnchorEl(e.currentTarget)}
                  sx={{
                    color: '#64748b',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    width: 34,
                    height: 34,
                    transition: 'all 0.2s ease',
                    '&:hover': { color: '#e2e8f0', background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)' },
                  }}
                >
                  <Badge badgeContent={unreadCount} color="error" overlap="circular">
                    <NotificationsNoneRoundedIcon fontSize="small" />
                  </Badge>
                </IconButton>
              </Tooltip>

              {/* Settings */}
              <Tooltip title="Settings">
                <IconButton
                  size="small"
                  onClick={() => setSettingsOpen(true)}
                  sx={{
                    color: '#64748b',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    width: 34,
                    height: 34,
                    transition: 'all 0.2s ease',
                    '&:hover': { color: '#e2e8f0', background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)' },
                  }}
                >
                  <SettingsRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, bgcolor: '#080c18' }}>
          <Outlet />
        </Box>
      </Box>

      {/* ── Notifications Popover ── */}
      <Popover
        open={Boolean(notifAnchorEl)}
        anchorEl={notifAnchorEl}
        onClose={() => setNotifAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            width: 340,
            maxHeight: 480,
            mt: 1.25,
            borderRadius: '18px',
            background: '#141d2e',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.65)',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#f1f5f9' }}>Notifications</Typography>
            {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} new`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  background: 'rgba(99,102,241,0.2)',
                  color: '#818cf8',
                  border: '1px solid rgba(99,102,241,0.3)',
                }}
              />
            )}
          </Box>
          {notifications.length > 0 && (
            <Typography
              sx={{ cursor: 'pointer', color: '#818cf8', fontWeight: 600, fontSize: '0.78rem', '&:hover': { color: '#c084fc' } }}
              onClick={markAllRead}
            >
              Mark all read
            </Typography>
          )}
        </Box>
        <List sx={{ p: 0, flex: 1, overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography sx={{ color: '#475569', fontSize: '0.875rem' }}>No notifications</Typography>
            </Box>
          ) : (
            notifications.map((n) => (
              <ListItemButton
                key={n._id}
                onClick={() => {
                  if (!n.isRead) markRead(n._id);
                  if (n.link) navigate(n.link);
                  setNotifAnchorEl(null);
                }}
                sx={{
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  bgcolor: n.isRead ? 'transparent' : 'rgba(99,102,241,0.07)',
                  alignItems: 'flex-start',
                  py: 1.5,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
                }}
              >
                <ListItemText
                  primary={
                    <Typography sx={{ fontWeight: n.isRead ? 500 : 700, color: '#e2e8f0', fontSize: '0.845rem', mb: 0.4 }}>
                      {n.title}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography component="span" sx={{ display: 'block', color: '#64748b', fontSize: '0.78rem', lineHeight: 1.4, mb: 0.4 }}>
                        {n.message}
                      </Typography>
                      <Typography component="span" sx={{ color: '#334155', fontSize: '0.7rem' }}>
                        {new Date(n.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                      </Typography>
                    </>
                  }
                />
              </ListItemButton>
            ))
          )}
        </List>
        {notifications.length > 0 && (
          <Box sx={{ p: 1.25, borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
            <Typography
              sx={{ cursor: 'pointer', color: '#f87171', fontSize: '0.78rem', fontWeight: 600, '&:hover': { color: '#fca5a5' } }}
              onClick={clearAll}
            >
              Clear all
            </Typography>
          </Box>
        )}
      </Popover>

      {/* ── Scroll to top ── */}
      <Fade in={showScroll}>
        <Fab
          size="small"
          onClick={scrollToTop}
          sx={{
            position: 'fixed',
            bottom: 28,
            right: 28,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            boxShadow: '0 8px 20px rgba(99,102,241,0.45)',
            '&:hover': {
              background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
              boxShadow: '0 12px 28px rgba(99,102,241,0.6)',
              transform: 'translateY(-2px)',
            },
          }}
        >
          <KeyboardArrowUpRoundedIcon />
        </Fab>
      </Fade>

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </Box>
  );
}
