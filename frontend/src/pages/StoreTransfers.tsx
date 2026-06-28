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
  MenuItem,
  Autocomplete,
  Chip,
  Alert,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import RemoveRedEyeRoundedIcon from '@mui/icons-material/RemoveRedEyeRounded';
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

type TransferLine = {
  itemId: string;
  quantity: number;
  item?: { name: string; sku: string };
};

type StoreTransfer = {
  id: string;
  transferNumber: string;
  fromStoreId: string;
  fromStore?: { name: string };
  toStoreId: string;
  toStore?: { name: string };
  status: 'pending' | 'completed';
  notes?: string;
  lines: TransferLine[];
  createdBy?: { fullName: string };
  createdAt: string;
  completedAt?: string;
};

export default function StoreTransfers() {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState<StoreTransfer[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<StoreTransfer | null>(null);

  const [fromStoreId, setFromStoreId] = useState('');
  const [toStoreId, setToStoreId] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Array<{ itemId: string; quantity: number }>>([
    { itemId: '', quantity: 1 },
  ]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get<StoreTransfer[]>('/store-transfers').then((r) => setTransfers(r.data)),
      api.get<any[]>('/stores').then((r) => setStores(r.data)),
      api.get<any[]>('/items').then((r) => setItems(r.data)),
    ])
      .catch((err) => console.error('Error loading transfers data', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAdd = () => {
    setFromStoreId('');
    setToStoreId('');
    setNotes('');
    setLines([{ itemId: '', quantity: 1 }]);
    setError('');
    setModal(true);
  };

  const handleAddLine = () => {
    setLines([...lines, { itemId: '', quantity: 1 }]);
  };

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, idx) => idx !== index));
  };

  const handleLineChange = (index: number, field: string, value: any) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  };

  const saveTransfer = async () => {
    if (!fromStoreId || !toStoreId) {
      setError('Please select both source and destination stores');
      return;
    }
    if (fromStoreId === toStoreId) {
      setError('Source and destination stores must be different');
      return;
    }
    const invalidLine = lines.some((l) => !l.itemId || l.quantity < 1);
    if (invalidLine) {
      setError('All lines must have a valid product and quantity greater than 0');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await api.post('/store-transfers', {
        fromStoreId,
        toStoreId,
        notes,
        lines,
      });
      setModal(false);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create transfer');
    } finally {
      setSubmitting(false);
    }
  };

  const completeTransfer = async (id: string) => {
    if (!confirm('Are you sure you want to approve and complete this store transfer? Stock will be updated immediately.')) return;
    try {
      await api.post(`/store-transfers/${id}/complete`);
      loadData();
      if (viewModal && selectedTransfer?.id === id) {
        setViewModal(false);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to complete transfer');
    }
  };

  const openView = (t: StoreTransfer) => {
    setSelectedTransfer(t);
    setViewModal(true);
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>Store Transfers</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Transfer inventory stock between store locations
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openAdd}>
          New Transfer
        </Button>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Transfer #</TableCell>
                <TableCell>From Store</TableCell>
                <TableCell>To Store</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Requested By</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transfers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CompareArrowsRoundedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1, opacity: 0.5 }} />
                    <Typography color="text.secondary" variant="body2">No transfers logged yet.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                transfers.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell sx={{ fontWeight: 600 }}>{t.transferNumber}</TableCell>
                    <TableCell>{t.fromStore?.name || '-'}</TableCell>
                    <TableCell>{t.toStore?.name || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={t.status.toUpperCase()}
                        size="small"
                        color={t.status === 'completed' ? 'success' : 'warning'}
                        sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                      />
                    </TableCell>
                    <TableCell>{t.createdBy?.fullName || '-'}</TableCell>
                    <TableCell>{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => openView(t)} color="primary">
                            <RemoveRedEyeRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {t.status === 'pending' && ['admin', 'manager'].includes(user?.role || '') && (
                          <Tooltip title="Approve & Complete">
                            <IconButton size="small" onClick={() => completeTransfer(t.id)} color="success">
                              <CheckCircleRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add Transfer Dialog */}
      <Dialog open={modal} onClose={() => setModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>New Stock Transfer</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1, mb: 3 }}>
            <TextField
              select
              label="From Store (Source)"
              fullWidth
              value={fromStoreId}
              onChange={(e) => setFromStoreId(e.target.value)}
            >
              {stores.map((s) => (
                <MenuItem key={s.id} value={s.id} disabled={!s.isActive}>
                  {s.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="To Store (Destination)"
              fullWidth
              value={toStoreId}
              onChange={(e) => setToStoreId(e.target.value)}
            >
              {stores.map((s) => (
                <MenuItem key={s.id} value={s.id} disabled={!s.isActive}>
                  {s.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <TextField
            label="Notes"
            fullWidth
            margin="normal"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            sx={{ mb: 3 }}
          />

          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Transfer Items</Typography>
          {lines.map((line, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
              <Autocomplete
                options={items}
                getOptionLabel={(option) => `${option.name} (${option.sku})`}
                renderInput={(params) => <TextField {...params} label="Select Product" required size="small" />}
                sx={{ flex: 1 }}
                value={items.find((i) => i.id === line.itemId) || null}
                onChange={(_, newValue) => handleLineChange(index, 'itemId', newValue?.id || '')}
              />
              <TextField
                label="Qty"
                type="number"
                required
                size="small"
                sx={{ width: 100 }}
                value={line.quantity}
                onChange={(e) => handleLineChange(index, 'quantity', parseInt(e.target.value, 10) || 1)}
              />
              <IconButton color="error" disabled={lines.length === 1} onClick={() => handleRemoveLine(index)}>
                <DeleteRoundedIcon />
              </IconButton>
            </Box>
          ))}
          <Button startIcon={<AddRoundedIcon />} onClick={handleAddLine} sx={{ mt: 1 }}>Add Product</Button>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setModal(false)}>Cancel</Button>
          <Button onClick={saveTransfer} variant="contained" disabled={submitting}>
            Create Transfer Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Transfer Details Dialog */}
      <Dialog open={viewModal} onClose={() => setViewModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Transfer Details: {selectedTransfer?.transferNumber}</DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          {selectedTransfer && (
            <>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">From Store</Typography>
                  <Typography variant="body1" fontWeight={600}>{selectedTransfer.fromStore?.name}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">To Store</Typography>
                  <Typography variant="body1" fontWeight={600}>{selectedTransfer.toStore?.name}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Box>
                    <Chip
                      label={selectedTransfer.status.toUpperCase()}
                      size="small"
                      color={selectedTransfer.status === 'completed' ? 'success' : 'warning'}
                      sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                    />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Date Created</Typography>
                  <Typography variant="body2">{new Date(selectedTransfer.createdAt).toLocaleString()}</Typography>
                </Box>
              </Box>

              {selectedTransfer.notes && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" color="text.secondary">Notes</Typography>
                  <Typography variant="body2" sx={{ bgcolor: 'action.hover', p: 1.5, borderRadius: 1 }}>
                    {selectedTransfer.notes}
                  </Typography>
                </Box>
              )}

              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Items List</Typography>
              <TableContainer component={Paper} outlined elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item Name</TableCell>
                      <TableCell align="right">Qty</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedTransfer.lines.map((l, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ fontWeight: 500 }}>{l.item?.name || 'Unknown Item'}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{l.quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setViewModal(false)}>Close</Button>
          {selectedTransfer?.status === 'pending' && ['admin', 'manager'].includes(user?.role || '') && (
            <Button onClick={() => completeTransfer(selectedTransfer.id)} variant="contained" color="success">
              Approve & Complete
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
