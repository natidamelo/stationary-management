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
  Paper,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RemoveRedEyeRoundedIcon from '@mui/icons-material/RemoveRedEyeRounded';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import { api } from '../api/client';

type IssueLine = {
  itemId: string;
  quantity: number;
  item?: { name: string; sku: string };
};

type Distribution = {
  id: string;
  distributionNumber: string;
  issuedToUserId?: string;
  issuedToUser?: { id: string; fullName: string };
  department?: string;
  notes?: string;
  lines: IssueLine[];
  createdAt: string;
};

export default function ItemIssues() {
  const [issues, setIssues] = useState<Distribution[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Distribution | null>(null);

  const [issuedToUserId, setIssuedToUserId] = useState('');
  const [department, setDepartment] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Array<{ itemId: string; quantity: number }>>([
    { itemId: '', quantity: 1 },
  ]);
  
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get<Distribution[]>('/distribution').then((r) => setIssues(r.data)),
      api.get<any[]>('/users').then((r) => setUsers(r.data)),
      api.get<any[]>('/items').then((r) => setItems(r.data)),
    ])
      .catch((err) => console.error('Error loading item issues data', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAdd = () => {
    setIssuedToUserId('');
    setDepartment('');
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

  const saveIssue = async () => {
    if (!issuedToUserId && !department) {
      setError('Please provide either a user or department to issue to');
      return;
    }
    const invalidLine = lines.some((l) => !l.itemId || l.quantity < 1);
    if (invalidLine) {
      setError('All lines must have a valid item and quantity greater than 0');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await api.post('/distribution', {
        issuedToUserId: issuedToUserId || undefined,
        department: department || undefined,
        notes,
        lines,
      });
      setModal(false);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to issue items');
    } finally {
      setSubmitting(false);
    }
  };

  const openView = (d: Distribution) => {
    setSelectedIssue(d);
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
          <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>Item Issues</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Issue stationary products to departments or specific team members
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openAdd}>
          New Issue
        </Button>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Issue Number</TableCell>
                <TableCell>Issued To</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Total Products</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {issues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <AssignmentTurnedInRoundedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1, opacity: 0.5 }} />
                    <Typography color="text.secondary" variant="body2">No items issued yet.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                issues.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell sx={{ fontWeight: 600 }}>{d.distributionNumber}</TableCell>
                    <TableCell>{d.issuedToUser?.fullName || '-'}</TableCell>
                    <TableCell>{d.department || '-'}</TableCell>
                    <TableCell>{new Date(d.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{d.lines.reduce((acc, l) => acc + l.quantity, 0)} items</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => openView(d)} color="primary">
                          <RemoveRedEyeRoundedIcon fontSize="small" />
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

      {/* Add Issue Dialog */}
      <Dialog open={modal} onClose={() => setModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Issue Stationary Products</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1, mb: 3 }}>
            <TextField
              select
              label="Issue To User"
              fullWidth
              value={issuedToUserId}
              onChange={(e) => setIssuedToUserId(e.target.value)}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {users.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.fullName} ({u.email})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Department"
              fullWidth
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </Box>

          <TextField
            label="Notes / Purpose"
            fullWidth
            margin="normal"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            sx={{ mb: 3 }}
          />

          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Issue Items</Typography>
          {lines.map((line, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
              <Autocomplete
                options={items}
                getOptionLabel={(option) => `${option.name} (${option.sku})`}
                renderInput={(params) => <TextField {...params} label="Select Stationary" required size="small" />}
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
          <Button startIcon={<AddRoundedIcon />} onClick={handleAddLine} sx={{ mt: 1 }}>Add Stationary</Button>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setModal(false)}>Cancel</Button>
          <Button onClick={saveIssue} variant="contained" disabled={submitting}>
            Record Item Issue
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Issue Details Dialog */}
      <Dialog open={viewModal} onClose={() => setViewModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Issue Details: {selectedIssue?.distributionNumber}</DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          {selectedIssue && (
            <>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Issued To</Typography>
                  <Typography variant="body1" fontWeight={600}>{selectedIssue.issuedToUser?.fullName || '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Department</Typography>
                  <Typography variant="body1" fontWeight={600}>{selectedIssue.department || '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Date Issued</Typography>
                  <Typography variant="body2">{new Date(selectedIssue.createdAt).toLocaleString()}</Typography>
                </Box>
              </Box>

              {selectedIssue.notes && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" color="text.secondary">Notes / Purpose</Typography>
                  <Typography variant="body2" sx={{ bgcolor: 'action.hover', p: 1.5, borderRadius: 1 }}>
                    {selectedIssue.notes}
                  </Typography>
                </Box>
              )}

              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Issued Items List</Typography>
              <TableContainer component={Paper} outlined elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item Name</TableCell>
                      <TableCell align="right">Qty Issued</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedIssue.lines.map((l, index) => (
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
        </DialogActions>
      </Dialog>
    </Box>
  );
}
