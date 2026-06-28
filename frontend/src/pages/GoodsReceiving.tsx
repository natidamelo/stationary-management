import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
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
  CircularProgress,
  IconButton,
  Tooltip,
  Chip,
  Alert,
} from '@mui/material';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import AssignmentReturnedRoundedIcon from '@mui/icons-material/AssignmentReturnedRounded';
import { api } from '../api/client';

type POLine = {
  id: string;
  itemId: string;
  item?: { name: string; sku: string };
  quantity: number;
  receivedQuantity: number;
};

type PurchaseOrder = {
  id: string;
  poNumber: string;
  supplier?: { name: string };
  status: 'draft' | 'sent' | 'received' | 'closed';
  orderDate: string;
  lines: POLine[];
};

export default function GoodsReceiving() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  
  // Maps lineId -> receivedQuantity
  const [receivedQuantities, setReceivedQuantities] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadData = () => {
    setLoading(true);
    api.get<PurchaseOrder[]>('/purchase-orders')
      .then((r) => {
        // Filter: only show POs that have been sent or partially received
        const filtered = r.data.filter((po) => po.status === 'sent' || po.status === 'received');
        setOrders(filtered);
      })
      .catch((err) => console.error('Error loading POs for goods receiving', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const openReceive = (po: PurchaseOrder) => {
    setSelectedOrder(po);
    const initialQty: Record<string, number> = {};
    po.lines.forEach((l) => {
      // Default new received quantity input to the ordered quantity or current received
      initialQty[l.id] = l.receivedQuantity;
    });
    setReceivedQuantities(initialQty);
    setError('');
    setModal(true);
  };

  const handleQtyChange = (lineId: string, val: number) => {
    setReceivedQuantities({
      ...receivedQuantities,
      [lineId]: val,
    });
  };

  const saveReceiving = async () => {
    if (!selectedOrder) return;
    
    // Validate quantities
    const invalid = selectedOrder.lines.some((l) => {
      const val = receivedQuantities[l.id] ?? 0;
      return val < l.receivedQuantity || val > l.quantity;
    });

    if (invalid) {
      setError('Received quantity cannot be less than already received or exceed ordered quantity');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const payloadLines = Object.entries(receivedQuantities).map(([lineId, qty]) => ({
        lineId,
        receivedQuantity: qty,
      }));
      await api.post(`/purchase-orders/${selectedOrder.id}/receive`, {
        lines: payloadLines,
      });
      setModal(false);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record received goods');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress size={36} thickness={4} sx={{ color: '#4f46e5' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ animation: 'fadeIn 0.3s ease-out', '@keyframes fadeIn': { from: { opacity: 0 }, to: { opacity: 1 } } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>Goods Receiving</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          Log incoming inventory stock deliveries against sent Purchase Orders
        </Typography>
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
                <TableCell>Total Items</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <LocalShippingRoundedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1, opacity: 0.5 }} />
                    <Typography color="text.secondary" variant="body2">No orders pending delivery.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell sx={{ fontWeight: 600 }}>{po.poNumber}</TableCell>
                    <TableCell>{po.supplier?.name || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={po.status.toUpperCase()}
                        size="small"
                        color={po.status === 'received' ? 'info' : 'warning'}
                        sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                      />
                    </TableCell>
                    <TableCell>{new Date(po.orderDate).toLocaleDateString()}</TableCell>
                    <TableCell>{po.lines.length} products</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Receive Deliveries">
                        <IconButton size="small" onClick={() => openReceive(po)} color="primary">
                          <AssignmentReturnedRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Receive Deliveries Dialog */}
      <Dialog open={modal} onClose={() => setModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Record Received Goods: {selectedOrder?.poNumber}</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Supplier: <strong>{selectedOrder?.supplier?.name}</strong>
          </Typography>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item Name</TableCell>
                  <TableCell align="right">Ordered Qty</TableCell>
                  <TableCell align="right">Already Received</TableCell>
                  <TableCell align="right" sx={{ width: 150 }}>New Total Received</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedOrder?.lines.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell sx={{ fontWeight: 500 }}>{l.item?.name || 'Unknown'}</TableCell>
                    <TableCell align="right">{l.quantity}</TableCell>
                    <TableCell align="right">{l.receivedQuantity}</TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        value={receivedQuantities[l.id] ?? 0}
                        onChange={(e) => handleQtyChange(l.id, parseInt(e.target.value, 10) || 0)}
                        inputProps={{ min: l.receivedQuantity, max: l.quantity }}
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setModal(false)}>Cancel</Button>
          <Button onClick={saveReceiving} variant="contained" disabled={submitting} startIcon={<CheckCircleRoundedIcon />}>
            Record Goods Delivery
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
