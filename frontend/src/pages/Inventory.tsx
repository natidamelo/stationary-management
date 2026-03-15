import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

type LowStock = { id: string; sku: string; name: string; currentStock: number; reorderLevel: number; unit: string };
type Movement = { id: string; type: string; quantity: number; balanceAfter: number; createdAt: string; item?: { name: string; sku: string }; notes?: string };

const canAdjust = (role: string) => ['admin', 'manager', 'inventory_clerk'].includes(role);

export default function Inventory() {
  const { user } = useAuth();
  const [lowStock, setLowStock] = useState<LowStock[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [items, setItems] = useState<Array<{ id: string; name: string; sku: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [adjustModal, setAdjustModal] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ itemId: '', quantity: 0, notes: '' });

  useEffect(() => {
    Promise.all([
      api.get<LowStock[]>('/inventory/low-stock').then((r) => setLowStock(r.data)),
      api.get<Movement[]>('/inventory/movements?limit=100').then((r) => setMovements(r.data)),
      api.get<Array<{ id: string; name: string; sku: string }>>('/items').then((r) => setItems(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const runAdjustment = async () => {
    if (!adjustForm.itemId || adjustForm.quantity === 0) return;
    await api.post('/inventory/adjustment', adjustForm);
    setAdjustModal(false);
    setAdjustForm({ itemId: '', quantity: 0, notes: '' });
    api.get<Movement[]>('/inventory/movements?limit=100').then((r) => setMovements(r.data));
    api.get<LowStock[]>('/inventory/low-stock').then((r) => setLowStock(r.data));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        <Typography variant="h5" fontWeight={600}>Inventory</Typography>
        {canAdjust(user?.role ?? '') && (
          <Button variant="contained" onClick={() => setAdjustModal(true)}>Stock adjustment</Button>
        )}
      </Box>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 6, sm: 6, md: 6 }} sx={{ display: 'flex' }}>
          <Card
            sx={{
              width: '100%',
              minHeight: 82,
              background: lowStock.length > 0
                ? 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)'
                : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
              color: lowStock.length > 0 ? '#9a3412' : '#475569',
              border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
            }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', p: 1.25 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 600, mb: 0.25, color: 'inherit' }}>Low stock items</Typography>
                <Typography variant="h4" fontWeight={700} sx={{ fontSize: '1.35rem', mb: 0.25, color: 'inherit' }}>{lowStock.length}</Typography>
                <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 500, color: 'inherit', opacity: 0.9 }}>Need reorder</Typography>
              </Box>
              <Box sx={{ width: 28, height: 28, borderRadius: '8px', background: 'rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>
                ⚠️
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 6 }} sx={{ display: 'flex' }}>
          <Card
            sx={{
              width: '100%',
              minHeight: 82,
              background: 'linear-gradient(135deg, #e9d5ff 0%, #ddd6fe 100%)',
              color: '#5b21b6',
              border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
            }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', p: 1.25 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 600, mb: 0.25, color: 'inherit' }}>Recent movements</Typography>
                <Typography variant="h4" fontWeight={700} sx={{ fontSize: '1.35rem', mb: 0.25, color: 'inherit' }}>{movements.length}</Typography>
                <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 500, color: 'inherit', opacity: 0.9 }}>Last 100</Typography>
              </Box>
              <Box sx={{ width: 28, height: 28, borderRadius: '8px', background: 'rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>
                📥
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Low stock ({lowStock.length})</Typography>
          {lowStock.length === 0 ? (
            <Typography color="text.secondary">No low-stock items.</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>SKU</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell align="right">Current</TableCell>
                    <TableCell align="right">Reorder level</TableCell>
                    <TableCell>Unit</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lowStock.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell>{i.sku}</TableCell>
                      <TableCell>{i.name}</TableCell>
                      <TableCell align="right">{i.currentStock}</TableCell>
                      <TableCell align="right">{i.reorderLevel}</TableCell>
                      <TableCell>{i.unit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>Recent movements</Typography>
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Item</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Balance after</TableCell>
                  <TableCell>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{new Date(m.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{m.item ? `${m.item.sku} – ${m.item.name}` : '—'}</TableCell>
                    <TableCell>{m.type}</TableCell>
                    <TableCell align="right">{m.quantity}</TableCell>
                    <TableCell align="right">{m.balanceAfter}</TableCell>
                    <TableCell>{m.notes ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={adjustModal} onClose={() => setAdjustModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Stock adjustment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Positive = add stock, negative = remove.</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Item</InputLabel>
              <Select value={adjustForm.itemId} label="Item" onChange={(e) => setAdjustForm((f) => ({ ...f, itemId: e.target.value }))}>
                <MenuItem value="">Select</MenuItem>
                {items.map((i) => <MenuItem key={i.id} value={i.id}>{i.sku} – {i.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField type="number" label="Quantity (signed)" value={adjustForm.quantity || ''} onChange={(e) => setAdjustForm((f) => ({ ...f, quantity: Number(e.target.value) }))} fullWidth />
            <TextField label="Notes" value={adjustForm.notes} onChange={(e) => setAdjustForm((f) => ({ ...f, notes: e.target.value }))} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdjustModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={runAdjustment}>Apply</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
