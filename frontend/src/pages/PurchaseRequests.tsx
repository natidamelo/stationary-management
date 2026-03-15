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
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Fragment } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

type PR = {
  id: string;
  requestNumber: string;
  status: string;
  createdAt: string;
  requestedBy: { fullName: string; email: string };
  lines: Array<{ quantity: number; reason?: string; item: { name: string; sku: string } }>;
  approvedBy?: { fullName: string };
  rejectionReason?: string;
};

const canApprove = (role: string) => ['admin', 'manager'].includes(role);

export default function PurchaseRequests() {
  const [searchParams] = useSearchParams();
  const pendingOnly = searchParams.get('pending') === '1';
  const { user } = useAuth();
  const [list, setList] = useState<PR[]>([]);
  const [items, setItems] = useState<Array<{ id: string; name: string; sku: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [formLines, setFormLines] = useState([{ itemId: '', quantity: 1, reason: '' }]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = () => {
    if (pendingOnly && canApprove(user?.role ?? '')) {
      api.get<PR[]>('/purchase-requests?status=pending').then((r) => setList(r.data));
    } else {
      api.get<PR[]>('/purchase-requests/my').then((r) => setList(r.data));
    }
  };

  useEffect(() => {
    Promise.all([
      load(),
      api.get<Array<{ id: string; name: string; sku: string }>>('/items').then((r) => setItems(r.data)),
    ]).finally(() => setLoading(false));
  }, [pendingOnly, user?.role]);

  const submitRequest = async () => {
    const lines = formLines
      .filter((l) => l.itemId)
      .map((l) => ({ itemId: l.itemId, quantity: Math.max(1, Number(l.quantity) || 1), reason: l.reason ?? '' }));
    if (!lines.length) return;
    setCreateError(null);
    setSubmitting(true);
    try {
      await api.post<PR>('/purchase-requests', { lines });
      setModal(false);
      setFormLines([{ itemId: '', quantity: 1, reason: '' }]);
      load();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setCreateError(Array.isArray(message) ? message.join(', ') : message ?? 'Failed to create request');
    } finally {
      setSubmitting(false);
    }
  };
  const approve = async (id: string) => {
    await api.post(`/purchase-requests/${id}/approve`);
    load();
  };
  const reject = async (id: string) => {
    await api.post(`/purchase-requests/${id}/reject`, { reason: 'Rejected' });
    load();
  };
  const submitForApproval = async (id: string) => {
    await api.post(`/purchase-requests/${id}/submit`);
    load();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const title = pendingOnly && canApprove(user?.role ?? '') ? 'Pending approvals' : 'My requests';

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        <Typography variant="h5" fontWeight={600}>{title}</Typography>
        {!pendingOnly && (
          <Button variant="contained" onClick={() => { setModal(true); setCreateError(null); }}>New request</Button>
        )}
      </Box>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              {(canApprove(user?.role ?? '') && pendingOnly) ? <TableCell padding="checkbox" sx={{ width: 48 }} /> : null}
              <TableCell>Request #</TableCell>
              <TableCell>Requested by</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              {(canApprove(user?.role ?? '') && pendingOnly) || !pendingOnly ? <TableCell>Actions</TableCell> : null}
            </TableRow>
          </TableHead>
          <TableBody>
            {list.map((pr) => (
              <Fragment key={pr.id}>
                <TableRow hover>
                  {canApprove(user?.role ?? '') && pendingOnly && (
                    <TableCell padding="checkbox">
                      <IconButton
                        size="small"
                        onClick={() => setExpandedId(expandedId === pr.id ? null : pr.id)}
                        aria-label={expandedId === pr.id ? 'Hide details' : 'Show what was requested'}
                      >
                        {expandedId === pr.id ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                      </IconButton>
                    </TableCell>
                  )}
                  <TableCell>{pr.requestNumber}</TableCell>
                  <TableCell>{pr.requestedBy?.fullName}</TableCell>
                  <TableCell><Chip label={pr.status} size="small" color={pr.status === 'pending' ? 'warning' : pr.status === 'approved' ? 'success' : 'default'} /></TableCell>
                  <TableCell>{new Date(pr.createdAt).toLocaleDateString()}</TableCell>
                  {canApprove(user?.role ?? '') && pendingOnly && (
                    <TableCell>
                      <Button size="small" variant="contained" color="success" onClick={() => approve(pr.id)} sx={{ mr: 0.5 }}>Approve</Button>
                      <Button size="small" color="error" onClick={() => reject(pr.id)}>Reject</Button>
                    </TableCell>
                  )}
                  {!pendingOnly && pr.status === 'draft' && (
                    <TableCell>
                      <Button size="small" variant="contained" onClick={() => submitForApproval(pr.id)}>Submit</Button>
                    </TableCell>
                  )}
                </TableRow>
                {canApprove(user?.role ?? '') && pendingOnly && (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ py: 0, borderBottom: expandedId === pr.id ? undefined : 0, verticalAlign: 'top' }}>
                      <Collapse in={expandedId === pr.id} timeout="auto" unmountOnExit>
                        <Box sx={{ py: 1.5, px: 1 }}>
                          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Requested items</Typography>
                          <Table size="small" sx={{ maxWidth: 560 }}>
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 600 }}>Item</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>SKU</TableCell>
                                <TableCell sx={{ fontWeight: 600 }} align="right">Qty</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {(pr.lines ?? []).map((line, idx) => (
                                <TableRow key={idx}>
                                  <TableCell>{line.item?.name ?? '—'}</TableCell>
                                  <TableCell>{line.item?.sku ?? '—'}</TableCell>
                                  <TableCell align="right">{line.quantity}</TableCell>
                                  <TableCell>{line.reason || '—'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={modal} onClose={() => { if (!submitting) { setModal(false); setCreateError(null); } }} maxWidth="sm" fullWidth>
        <DialogTitle>New purchase request</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
            {createError && (
              <Typography color="error" variant="body2">{createError}</Typography>
            )}
            {formLines.map((line, idx) => (
              <Box key={idx} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Select
                  size="small"
                  value={line.itemId}
                  onChange={(e) => setFormLines((f) => f.map((l, i) => i === idx ? { ...l, itemId: e.target.value } : l))}
                  displayEmpty
                  sx={{ minWidth: 200, flex: 2 }}
                >
                  <MenuItem value="">Item</MenuItem>
                  {items.map((i) => <MenuItem key={i.id} value={i.id}>{i.sku} – {i.name}</MenuItem>)}
                </Select>
                <TextField type="number" size="small" value={line.quantity} onChange={(e) => setFormLines((f) => f.map((l, i) => i === idx ? { ...l, quantity: Number(e.target.value) } : l))} inputProps={{ min: 1 }} sx={{ width: 70 }} />
                <TextField size="small" placeholder="Reason" value={line.reason} onChange={(e) => setFormLines((f) => f.map((l, i) => i === idx ? { ...l, reason: e.target.value } : l))} sx={{ minWidth: 100, flex: 1 }} />
              </Box>
            ))}
            <Button size="small" onClick={() => setFormLines((f) => [...f, { itemId: '', quantity: 1, reason: '' }])}>+ Line</Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModal(false)} disabled={submitting}>Cancel</Button>
          <Button variant="contained" onClick={submitRequest} disabled={submitting}>
            {submitting ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
