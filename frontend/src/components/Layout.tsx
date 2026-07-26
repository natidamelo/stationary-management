import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useNotifications } from '../context/NotificationsContext';
import SettingsDialog from './SettingsDialog';
import GlobalSearch from './GlobalSearch';
import { api } from '../api/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LayoutDashboard,
  Tags,
  Building2,
  Truck,
  Package,
  Users,
  ClipboardList,
  ShoppingCart,
  PackageCheck,
  PackageMinus,
  ArrowLeftRight,
  Receipt,
  MessageSquare,
  BarChart3,
  KeyRound,
  Settings,
  LogOut,
  Menu,
  Sun,
  Moon,
  Bell,
  Sparkles,
  ArrowUp,
  X,
} from 'lucide-react';

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
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function Layout() {
  const { user, logout, license } = useAuth();
  const { settings, themeMode, toggleTheme } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const role = user?.role ?? '';
  const pathname = location.pathname;
  const pageTitle =
    pathname === '/purchase-requests' && location.search.includes('pending')
      ? 'Approvals'
      : PAGE_TITLES[pathname] ?? 'Dashboard';

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showScroll, setShowScroll] = useState(false);
  const [stores, setStores] = useState<any[]>([]);

  const { notifications, unreadCount, markRead, markAllRead, clearAll } =
    useNotifications();

  useEffect(() => {
    const handleScroll = () => setShowScroll(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (user && user.role !== 'dealer') {
      api
        .get('/stores')
        .then((r) => setStores(r.data))
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
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const masterRegistriesGroup = [
    { to: '/categories', label: 'Categories', icon: <Tags className="h-4 w-4" /> },
    ...(role === 'admin' || role === 'manager' || role === 'dealer'
      ? [{ to: '/stores', label: 'Stores', icon: <Building2 className="h-4 w-4" /> }]
      : []),
    { to: '/suppliers', label: 'Suppliers', icon: <Truck className="h-4 w-4" /> },
    { to: '/items', label: 'Products', icon: <Package className="h-4 w-4" /> },
    { to: '/customers', label: 'Customers', icon: <Users className="h-4 w-4" /> },
  ];

  const transactionsGroup = [
    { to: '/purchase-requests', label: 'Requisitions', icon: <ClipboardList className="h-4 w-4" /> },
    { to: '/purchase-orders', label: 'Orders', icon: <ShoppingCart className="h-4 w-4" /> },
    { to: '/goods-receiving', label: 'Goods Receiving', icon: <PackageCheck className="h-4 w-4" /> },
    { to: '/item-issues', label: 'Item Issues', icon: <PackageMinus className="h-4 w-4" /> },
    { to: '/store-transfers', label: 'Store Transfers', icon: <ArrowLeftRight className="h-4 w-4" /> },
    ...(role === 'reception' || role === 'admin' || role === 'manager' || role === 'dealer'
      ? [{ to: '/reception', label: 'Sales', icon: <Receipt className="h-4 w-4" /> }]
      : []),
  ];

  const adminGroup = [
    ...(role === 'admin' || role === 'manager' || role === 'dealer'
      ? [{ to: '/users', label: 'Users', icon: <Users className="h-4 w-4" /> }]
      : []),
    { to: '/messages', label: 'Messages', icon: <MessageSquare className="h-4 w-4" /> },
    ...(role === 'admin' || role === 'manager' || role === 'dealer'
      ? [{ to: '/reports', label: 'Reports', icon: <BarChart3 className="h-4 w-4" /> }]
      : []),
  ];

  const dealerGroup = [
    ...(role === 'dealer'
      ? [
          { to: '/registered-tenants', label: 'Registered Tenants', icon: <Building2 className="h-4 w-4" /> },
          { to: '/licenses', label: 'Licenses', icon: <KeyRound className="h-4 w-4" /> },
        ]
      : []),
  ];

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center gap-2 px-3 mt-5 mb-1.5">
      <span className="text-[10px] font-extrabold tracking-widest text-muted-foreground/60 uppercase whitespace-nowrap">
        {children}
      </span>
      <div className="flex-1 h-px bg-border/40" />
    </div>
  );

  const renderLink = (link: { to: string; label: string; icon: React.ReactNode }) => (
    <NavLink
      key={link.to + link.label}
      to={link.to}
      end={link.to === '/'}
      onClick={() => setMobileOpen(false)}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 mx-2 rounded-xl text-sm font-medium transition-all duration-150 relative ${
          isActive
            ? 'bg-primary/15 text-primary font-semibold border-l-2 border-primary shadow-sm'
            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
        }`
      }
    >
      {link.icon}
      <span>{link.label}</span>
    </NavLink>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Brand Header */}
      <div className="p-4 pb-3 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground shadow-md shadow-primary/20 shrink-0">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="font-extrabold text-sm leading-tight gradient-text truncate">
            {settings.stationeryName || 'WOUBREX PLC'}
          </h1>
          <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
            Stock Management
          </p>
        </div>
      </div>

      {/* User Card */}
      <div className="mx-3 mb-2 p-2.5 rounded-xl bg-muted/40 border border-border/50 flex items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="text-xs">
            {(user?.fullName ?? 'U').charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold truncate leading-tight text-foreground">
            {user?.fullName}
          </p>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize mt-0.5 border-primary/30 text-primary">
            {user?.role}
          </Badge>
        </div>
        <div className="h-2 w-2 rounded-full bg-success shadow-[0_0_6px_var(--color-success)]" />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-1 space-y-0.5">
        {renderLink({ to: '/', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> })}

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

        <div className="px-2 pt-3">
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>
        </div>
      </nav>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
        <p className="text-[10px] text-center text-muted-foreground mt-2 font-medium">
          v1.0.0 • Ready
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 w-64 max-w-[80vw] h-full shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 shrink-0 fixed inset-y-0 z-30">
        {sidebarContent}
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-h-screen md:pl-64">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 h-16 border-b border-border/60 bg-background/80 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="font-bold text-base tracking-tight text-foreground">
                {pageTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <GlobalSearch />

            {/* Store Switcher */}
            {stores.length > 0 && (
              <Select value={user?.storeId || ''} onValueChange={handleStoreChange}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue placeholder="Select Store" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((s) => (
                    <SelectItem key={s.id} value={s.id} disabled={!s.isActive}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* License chip */}
            {license?.expiryDate && (
              <Badge variant="success" className="hidden sm:inline-flex text-[10px]">
                Licensed: {new Date(license.expiryDate).toLocaleDateString()}
              </Badge>
            )}

            {/* Date display */}
            <span className="text-xs text-muted-foreground hidden lg:inline-block font-medium">
              {formatDate()}
            </span>

            <Separator orientation="vertical" className="h-6 hidden sm:block" />

            {/* Theme Toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9">
              {themeMode === 'light' ? (
                <Moon className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Sun className="h-4 w-4 text-warning" />
              )}
            </Button>

            {/* Notifications Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive animate-pulse" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between p-3 border-b border-border">
                  <span className="font-semibold text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="text-[10px]">
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <DropdownMenuItem
                      key={n._id}
                      onClick={() => {
                        if (!n.isRead) markRead(n._id);
                        if (n.link) navigate(n.link);
                      }}
                      className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-xs font-bold ${!n.isRead ? 'text-primary' : ''}`}>
                          {n.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {n.message}
                      </p>
                    </DropdownMenuItem>
                  ))
                )}
                {notifications.length > 0 && (
                  <div className="p-2 border-t border-border flex justify-between">
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}>
                      Mark all read
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs h-7 text-destructive" onClick={clearAll}>
                      Clear
                    </Button>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Settings Trigger */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSettingsOpen(true)}
              className="h-9 w-9"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 bg-background">
          <Outlet />
        </main>
      </div>

      {/* Scroll To Top Button */}
      {showScroll && (
        <Button
          onClick={scrollToTop}
          size="icon"
          className="fixed bottom-6 right-6 rounded-full shadow-xl shadow-primary/30 z-40"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      )}

      {/* Settings Dialog */}
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
