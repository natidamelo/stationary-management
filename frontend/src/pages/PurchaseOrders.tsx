import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import CallReceivedRoundedIcon from '@mui/icons-material/CallReceivedRounded';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

type PO = {
  id: string;
  poNumber: string;
  status: string;
  orderDate: string;
  expectedDate?: string;
  supplier: { id: string; name: string };
  lines: Array<{ id: string; quantity: number; receivedQuantity: number; item: { name: string; sku: string }; unitPrice: number }>;
};

const canManage = (role: string) => ['admin', 'manager', 'inventory_clerk'].includes(role);

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  draft: { bg: '#f3f4f6', color: '#6b7280' },
  sent: { bg: '#eef2ff', color: '#4f46e5' },
  received: { bg: '#ecfdf5', color: '#059669' },
  closed: { bg: '#f9fafb', color: '#9ca3af' },
};

export default function PurchaseOrders() {
  const { user } = useAuth();
  const [list, setList] = useState<PO[]>([]);
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string }>>([]);
  const [items, setItems] = useState<Array<{ id: string; name: string; sku: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ supplierId: '', lines: [{ itemId: '', quantity: 1, unitPrice: 0 }], notes: '' });
  const [receiveModal, setReceiveModal] = useState<PO | null>(null);
  const [receiveLines, setReceiveLines] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const load = () => {
    const q = statusFilter ? `?status=${statusFilter}` : '';
    api.get<PO[]>(`/purchase-orders${q}`).then((r) => setList(r.data));
  };

  useEffect(() => {
    Promise.all([
      api.get<PO[]>('/purchase-orders').then((r) => setList(r.data)),
      api.get<Array<{ id: string; name: string }>>('/suppliers').then((r) => setSuppliers(r.data)),
      api.get<Array<{ id: string; name: string; sku: string }>>('/items').then((r) => setItems(r.data)),
    ]).finally(() => setLoading(false));
  }, []);
  useEffect(() => { if (statusFilter !== undefined) load(); }, [statusFilter]);

  const createPo = async () => {
    // Validation
    if (!form.supplierId) {
      setCreateError('Please select a supplier');
      return;
    }
    
    const validLines = form.lines.filter((l) => l.itemId && l.quantity > 0 && l.unitPrice >= 0);
    if (validLines.length === 0) {
      setCreateError('Please add at least one line item with valid quantity and price');
      return;
    }

    setSubmitting(true);
    setCreateError(null);
    
    try {
      const payload = {
        supplierId: form.supplierId,
        lines: validLines,
        notes: form.notes || undefined,
      };
      console.log('Sending purchase order payload:', payload);
      await api.post('/purchase-orders', payload);
      setModal(false);
      setForm({ supplierId: '', lines: [{ itemId: '', quantity: 1, unitPrice: 0 }], notes: '' });
      setCreateError(null);
      load();
    } catch (error: any) {
      console.error('Error creating purchase order:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      
      // Extract validation errors from backend response
      let errorMessage = 'Failed to create purchase order';
      if (error.response?.data) {
        const data = error.response.data;
        if (data.message) {
          // If it's an array of validation errors, format them nicely
          if (Array.isArray(data.message)) {
            errorMessage = data.message.join(', ');
          } else if (typeof data.message === 'string') {
            errorMessage = data.message;
          } else {
            errorMessage = JSON.stringify(data.message);
          }
        } else if (data.error) {
          errorMessage = data.error;
        } else {
          // Try to extract error from the response object itself
          errorMessage = JSON.stringify(data);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setCreateError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const sendPo = async (id: string) => {
    await api.post(`/purchase-orders/${id}/send`);
    load();
  };
  const openReceive = (po: PO) => {
    setReceiveModal(po);
    const init: Record<string, number> = {};
    po.lines.forEach((l) => { init[l.id] = Number(l.receivedQuantity) || 0; });
    setReceiveLines(init);
  };
  const submitReceive = async () => {
    if (!receiveModal) return;
    await api.post(`/purchase-orders/${receiveModal.id}/receive`, {
      lines: Object.entries(receiveLines).map(([lineId, receivedQuantity]) => ({ lineId, receivedQuantity })),
    });
    setReceiveModal(null);
    load();
  };
  const closePo = async (id: string) => {
    await api.post(`/purchase-orders/${id}/close`);
    load();
  };
  const addLine = () => setForm((f) => ({ ...f, lines: [...f.lines, { itemId: '', quantity: 1, unitPrice: 0 }] }));

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress size={36} thickness={4} sx={{ color: '#4f46e5' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ animation: 'fadeIn 0.3s ease-out', '@keyframes fadeIn': { from: { opacity: 0 }, to: { opacity: 1 } } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>Purchase Orders</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {list.length} {list.length === 1 ? 'order' : 'orders'} total
          </Typography>
        </Box>
        {canManage(user?.role ?? '') && (
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setModal(true)}>
            Create PO
          </Button>
        )}
      </Box>

      <Box sx={{ mb: 2.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {['', 'draft', 'sent', 'received', 'closed'].map((s) => (
          <Chip
            key={s}
            label={s || 'All'}
            onClick={() => setStatusFilter(s)}
            variant={statusFilter === s ? 'filled' : 'outlined'}
            sx={{
              fontWeight: 600,
              fontSize: '0.8rem',
              textTransform: 'capitalize',
              ...(statusFilter === s
                ? { bgcolor: '#4f46e5', color: '#fff', borderColor: '#4f46e5' }
                : { borderColor: '#e5e7eb', color: 'text.secondary', '&:hover': { bgcolor: '#f9fafb' } }),
            }}
          />
        ))}
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>PO Number</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Order Date</TableCell>
                {canManage(user?.role ?? '') && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {list.map((po) => {
                const style = STATUS_STYLES[po.status] || STATUS_STYLES.draft;
                return (
                  <TableRow key={po.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} fontFamily="monospace" sx={{ fontSize: '0.84rem' }}>{po.poNumber}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{po.supplier?.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={po.status}
                        size="small"
                        sx={{
                          bgcolor: style.bg,
                          color: style.color,
                          fontWeight: 600,
                          fontSize: '0.72rem',
                          textTransform: 'capitalize',
                          border: 'none',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {po.orderDate ? new Date(po.orderDate).toLocaleDateString() : '—'}
                      </Typography>
                    </TableCell>
                    {canManage(user?.role ?? '') && (
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          {po.status === 'draft' && (
                            <Tooltip title="Send">
                              <Button size="small" variant="contained" startIcon={<SendRoundedIcon sx={{ fontSize: '0.9rem !important' }} />} onClick={() => sendPo(po.id)} sx={{ fontSize: '0.78rem' }}>
                                Send
                              </Button>
                            </Tooltip>
                          )}
                          {(po.status === 'sent' || po.status === 'received') && (
                            <Tooltip title="Receive items">
                              <Button size="small" variant="outlined" startIcon={<CallReceivedRoundedIcon sx={{ fontSize: '0.9rem !important' }} />} onClick={() => openReceive(po)} sx={{ fontSize: '0.78rem' }}>
                                Receive
                              </Button>
                            </Tooltip>
                          )}
                          {po.status !== 'closed' && po.status !== 'draft' && (
                            <Tooltip title="Close PO">
                              <Button size="small" sx={{ color: 'text.secondary', fontSize: '0.78rem' }} onClick={() => closePo(po.id)}>
                                Close
                              </Button>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {list.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="body2" color="text.secondary">No purchase orders found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Create PO Dialog */}
      <Dialog open={modal} onClose={() => { if (!submitting) { setModal(false); setCreateError(null); } }} maxWidth="sm" fullWidth>
        <DialogTitle>Create Purchase Order</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            {createError && (
              <Typography color="error" variant="body2" sx={{ bgcolor: '#fee', p: 1, borderRadius: 1 }}>
                {createError}
              </Typography>
            )}
            <FormControl fullWidth>
              <InputLabel>Supplier</InputLabel>
              <Select value={form.supplierId} label="Supplier" onChange={(e) => { setForm((f) => ({ ...f, supplierId: e.target.value })); setCreateError(null); }}>
                <MenuItem value="">Select supplier</MenuItem>
                {suppliers.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </Select>
            </FormControl>
            <Typography variant="subtitle2" fontWeight={600}>Line Items</Typography>
            {form.lines.map((line, idx) => (
              <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Select
                  size="small"
                  value={line.itemId}
                  onChange={(e) => setForm((f) => ({ ...f, lines: f.lines.map((l, i) => i === idx ? { ...l, itemId: e.target.value } : l) }))}
                  displayEmpty
                  sx={{ minWidth: 220, flex: 2 }}
                >
                  <MenuItem value="">Select item</MenuItem>
                  {items.map((i) => <MenuItem key={i.id} value={i.id}>{i.sku} – {i.name}</MenuItem>)}
                </Select>
                <TextField type="number" size="small" label="Qty" value={line.quantity} onChange={(e) => setForm((f) => ({ ...f, lines: f.lines.map((l, i) => i === idx ? { ...l, quantity: Number(e.target.value) } : l) }))} inputProps={{ min: 1 }} sx={{ width: 80 }} />
                <TextField type="number" size="small" label="Price" value={line.unitPrice || ''} onChange={(e) => setForm((f) => ({ ...f, lines: f.lines.map((l, i) => i === idx ? { ...l, unitPrice: Number(e.target.value) } : l) }))} inputProps={{ min: 0, step: 0.01 }} sx={{ width: 100 }} />
              </Box>
            ))}
            <Button size="small" onClick={addLine} sx={{ alignSelf: 'flex-start' }}>+ Add line</Button>
            <TextField label="Notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} multiline rows={2} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setModal(false); setCreateError(null); }} disabled={submitting} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" onClick={createPo} disabled={submitting}>
            {submitting ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Receive Dialog */}
      <Dialog open={!!receiveModal} onClose={() => setReceiveModal(null)} maxWidth="sm" fullWidth>
        {receiveModal && (
          <>
            <DialogTitle>Receive – {receiveModal.poNumber}</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
                {receiveModal.lines.map((line) => (
                  <Box key={line.id}>
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>{line.item?.sku} – {line.item?.name}</Typography>
                    <TextField
                      type="number"
                      size="small"
                      fullWidth
                      label="Received quantity"
                      inputProps={{ min: 0, max: line.quantity }}
                      value={receiveLines[line.id] ?? 0}
                      onChange={(e) => setReceiveLines((r) => ({ ...r, [line.id]: Number(e.target.value) }))}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>
                      {line.quantity} ordered
                    </Typography>
                  </Box>
                ))}
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setReceiveModal(null)} sx={{ color: 'text.secondary' }}>Cancel</Button>
              <Button variant="contained" onClick={submitReceive}>Save</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
