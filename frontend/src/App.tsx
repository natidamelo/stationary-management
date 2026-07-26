import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
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
import { Loader2 } from 'lucide-react';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function DealerRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'dealer') return <Navigate to="/" replace />;
  return <>{children}</>;
}

function App() {
  const { user } = useAuth();

  return (
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
  );
}

export default App;
