import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
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
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  FormControl,
  InputLabel,
  Alert,
  Card,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Fragment } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

type PR = {
  id: string;
  requestNumber: string;
  status: string;
  createdAt: string;
  storeId?: string;
  store?: { name: string };
  requestedBy: { fullName: string; email: string; role?: string };
  lines: Array<{ quantity: number; reason?: string; item: { name: string; sku: string; price?: number } }>;
  approvedBy?: { fullName: string };
  rejectionReason?: string;
  estimatedTotal: number;
};

const canApprove = (role: string) => ['admin', 'manager'].includes(role);

export default function PurchaseRequests() {
  const [searchParams] = useSearchParams();
  const pendingOnly = searchParams.get('pending') === '1';
  const { user } = useAuth();
  const [list, setList] = useState<PR[]>([]);
  const [items, setItems] = useState<Array<{ id: string; name: string; sku: string; price?: number }>>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [formLines, setFormLines] = useState([{ itemId: '', quantity: 1, reason: '' }]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Table filters
  const [statusFilter, setStatusFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');

  const load = (status = statusFilter, store = storeFilter) => {
    let url = '/purchase-requests';
    const params = new URLSearchParams();
    
    // Non-privileged users only see their own requests
    if (!['admin', 'manager', 'dealer'].includes(user?.role ?? '')) {
      url = '/purchase-requests/my';
    }
    
    if (status) params.append('status', status);
    if (store) params.append('storeId', store);
    
    if (pendingOnly) {
      params.set('status', 'pending');
    }
    
    const query = params.toString();
    return api.get<PR[]>(`${url}${query ? '?' + query : ''}`).then((r) => setList(r.data));
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      load(),
      api.get<Array<{ id: string; name: string; sku: string; price?: number }>>('/items').then((r) => setItems(r.data)),
      api.get<any[]>('/stores').then((r) => setStores(r.data)),
    ])
      .catch((err) => console.error('Error loading requisitions data', err))
      .finally(() => setLoading(false));
  }, [pendingOnly, user?.role]);

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    load(status, storeFilter);
  };

  const handleStoreFilterChange = (store: string) => {
    setStoreFilter(store);
    load(statusFilter, store);
  };

  const openCreateModal = () => {
    // Default to user's assigned store
    setSelectedStoreId(user?.storeId || '');
    setFormLines([{ itemId: '', quantity: 1, reason: '' }]);
    setCreateError(null);
    setModal(true);
  };

  const submitRequest = async () => {
    const lines = formLines
      .filter((l) => l.itemId)
      .map((l) => ({ itemId: l.itemId, quantity: Math.max(1, Number(l.quantity) || 1), reason: l.reason ?? '' }));
    if (!lines.length) {
      setCreateError('Please add at least one item');
      return;
    }
    if (!selectedStoreId) {
      setCreateError('Please select a store');
      return;
    }

    setCreateError(null);
    setSubmitting(true);
    try {
      await api.post<PR>('/purchase-requests', {
        storeId: selectedStoreId,
        lines,
      });
      setModal(false);
      load();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setCreateError(Array.isArray(message) ? message.join(', ') : message ?? 'Failed to create request');
    } finally {
      setSubmitting(false);
    }
  };

  const approve = async (id: string) => {
    if (!confirm('Are you sure you want to approve this requisition?')) return;
    try {
      await api.post(`/purchase-requests/${id}/approve`);
      load();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve');
    }
  };

  const reject = async (id: string) => {
    const reason = prompt('Please enter a rejection reason:');
    if (reason === null) return; // cancelled
    try {
      await api.post(`/purchase-requests/${id}/reject`, { reason: reason || 'Rejected' });
      load();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject');
    }
  };

  const submitForApproval = async (id: string) => {
    try {
      await api.post(`/purchase-requests/${id}/submit`);
      load();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit request');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress size={36} thickness={4} sx={{ color: '#4f46e5' }} />
      </Box>
    );
  }

  const title = pendingOnly && canApprove(user?.role ?? '') ? 'Pending approvals' : 'Purchase Requisitions';

  return (
    <Box sx={{ animation: 'fadeIn 0.3s ease-out', '@keyframes fadeIn': { from: { opacity: 0 }, to: { opacity: 1 } } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>{title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Request products and manage internal inventory procurements.
          </Typography>
        </Box>
        {!pendingOnly && (
          <Button variant="contained" onClick={openCreateModal}>New Requisition</Button>
        )}
      </Box>

      {/* Filters Toolbar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <Select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            displayEmpty
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <Select
            value={storeFilter}
            onChange={(e) => handleStoreFilterChange(e.target.value)}
            displayEmpty
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="">All Stores</MenuItem>
            {stores.map((s) => (
              <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" sx={{ width: 48 }} />
                <TableCell>REQUISITION NUMBER</TableCell>
                <TableCell>STORE</TableCell>
                <TableCell>REQUESTED BY</TableCell>
                <TableCell>EST. TOTAL</TableCell>
                <TableCell>STATUS</TableCell>
                <TableCell>DATE</TableCell>
                <TableCell align="right">ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary" variant="body2">No requisitions found.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                list.map((pr) => (
                  <Fragment key={pr.id}>
                    <TableRow hover>
                      <TableCell padding="checkbox">
                        <IconButton
                          size="small"
                          onClick={() => setExpandedId(expandedId === pr.id ? null : pr.id)}
                        >
                          {expandedId === pr.id ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        </IconButton>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{pr.requestNumber}</TableCell>
                      <TableCell>{pr.store?.name || '—'}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight={500}>{pr.requestedBy?.fullName}</Typography>
                          {pr.requestedBy?.role && (
                            <Chip label={pr.requestedBy.role} size="small" sx={{ height: 18, fontSize: '0.6rem', textTransform: 'capitalize' }} />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                        ETB {(pr.estimatedTotal ?? 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={pr.status.toUpperCase()}
                          size="small"
                          color={
                            pr.status === 'pending'
                              ? 'warning'
                              : pr.status === 'approved'
                              ? 'success'
                              : pr.status === 'rejected'
                              ? 'error'
                              : 'default'
                          }
                          sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                        />
                      </TableCell>
                      <TableCell>{new Date(pr.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => setExpandedId(expandedId === pr.id ? null : pr.id)} color="primary">
                              <InfoOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {canApprove(user?.role ?? '') && pr.status === 'pending' && (
                            <>
                              <Button size="small" variant="contained" color="success" onClick={() => approve(pr.id)}>Approve</Button>
                              <Button size="small" color="error" onClick={() => reject(pr.id)}>Reject</Button>
                            </>
                          )}
                          {!pendingOnly && pr.status === 'draft' && pr.requestedBy?.email === user?.email && (
                            <Button size="small" variant="contained" onClick={() => submitForApproval(pr.id)}>Submit</Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                    
                    {/* Collapsible Details Row */}
                    <TableRow>
                      <TableCell colSpan={8} sx={{ py: 0, borderBottom: expandedId === pr.id ? undefined : 0 }}>
                        <Collapse in={expandedId === pr.id} timeout="auto" unmountOnExit>
                          <Box sx={{ py: 2.5, px: 3, bgcolor: 'action.hover' }}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Requested Items Details</Typography>
                            <Table size="small" sx={{ maxWidth: 720, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                              <TableHead>
                                <TableRow>
                                  <TableCell>Item Name</TableCell>
                                  <TableCell>SKU</TableCell>
                                  <TableCell align="right">Qty</TableCell>
                                  <TableCell align="right">Est. Unit Price</TableCell>
                                  <TableCell align="right">Est. Total</TableCell>
                                  <TableCell>Reason</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {pr.lines.map((line, idx) => {
                                  const unitPrice = line.item?.price ?? 0;
                                  const lineTotal = unitPrice * line.quantity;
                                  return (
                                    <TableRow key={idx}>
                                      <TableCell sx={{ fontWeight: 500 }}>{line.item?.name ?? '—'}</TableCell>
                                      <TableCell>{line.item?.sku ?? '—'}</TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 600 }}>{line.quantity}</TableCell>
                                      <TableCell align="right">ETB {unitPrice.toFixed(2)}</TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 600 }}>ETB {lineTotal.toFixed(2)}</TableCell>
                                      <TableCell>{line.reason || '—'}</TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                            {pr.rejectionReason && (
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="caption" color="error.main" fontWeight={700}>Rejection Reason:</Typography>
                                <Typography variant="body2" color="error.main">{pr.rejectionReason}</Typography>
                              </Box>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* New Requisition Dialog */}
      <Dialog open={modal} onClose={() => { if (!submitting) { setModal(false); setCreateError(null); } }} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>New Purchase Requisition</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {createError && <Alert severity="error" sx={{ mb: 2 }}>{createError}</Alert>}
          
          {/* Store Selection */}
          <FormControl fullWidth margin="normal" sx={{ mb: 3 }}>
            <InputLabel id="req-store-select">Target Store / Location</InputLabel>
            <Select
              labelId="req-store-select"
              label="Target Store / Location"
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              required
            >
              {stores.map((s) => (
                <MenuItem key={s.id} value={s.id} disabled={!s.isActive}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Requested Items</Typography>
          {formLines.map((line, idx) => (
            <Box key={idx} sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
              <Select
                size="small"
                value={line.itemId}
                onChange={(e) => setFormLines((f) => f.map((l, i) => i === idx ? { ...l, itemId: e.target.value } : l))}
                displayEmpty
                sx={{ flex: 2 }}
              >
                <MenuItem value="">Select Product</MenuItem>
                {items.map((i) => <MenuItem key={i.id} value={i.id}>{i.name} ({i.sku})</MenuItem>)}
              </Select>
              <TextField
                type="number"
                label="Qty"
                size="small"
                value={line.quantity}
                onChange={(e) => setFormLines((f) => f.map((l, i) => i === idx ? { ...l, quantity: Math.max(1, parseInt(e.target.value, 10) || 1) } : l))}
                inputProps={{ min: 1 }}
                sx={{ width: 90 }}
              />
              <TextField
                label="Reason"
                size="small"
                placeholder="Reason / Purpose"
                value={line.reason}
                onChange={(e) => setFormLines((f) => f.map((l, i) => i === idx ? { ...l, reason: e.target.value } : l))}
                sx={{ flex: 2 }}
              />
              <IconButton
                color="error"
                disabled={formLines.length === 1}
                onClick={() => setFormLines(formLines.filter((_, i) => i !== idx))}
              >
                <InfoOutlinedIcon sx={{ transform: 'rotate(45deg)', color: 'error.main' }} />
              </IconButton>
            </Box>
          ))}
          <Button onClick={() => setFormLines((f) => [...f, { itemId: '', quantity: 1, reason: '' }])}>+ Add Line Item</Button>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setModal(false)} disabled={submitting}>Cancel</Button>
          <Button variant="contained" onClick={submitRequest} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Draft Requisition'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
