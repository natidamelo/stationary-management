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

type Dist = {
  id: string;
  distributionNumber: string;
  department?: string;
  createdAt: string;
  issuedToUser?: { fullName: string };
  lines: Array<{ quantity: number; item: { name: string; sku: string } }>;
};

const canIssue = (role: string) => ['admin', 'manager', 'inventory_clerk'].includes(role);

export default function Distribution() {
  const { user } = useAuth();
  const [list, setList] = useState<Dist[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; fullName: string }>>([]);
  const [items, setItems] = useState<Array<{ id: string; name: string; sku: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ issuedToUserId: '', department: '', notes: '', lines: [{ itemId: '', quantity: 1 }] });

  const load = () => api.get<Dist[]>('/distribution').then((r) => setList(r.data));

  useEffect(() => {
    Promise.all([
      load(),
      api.get<Array<{ id: string; fullName: string }>>('/users').then((r) => setUsers(r.data)).catch(() => setUsers([])),
      api.get<Array<{ id: string; name: string; sku: string }>>('/items').then((r) => setItems(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const issue = async () => {
    const lines = form.lines.filter((l) => l.itemId && l.quantity > 0);
    if (!lines.length) return;
    await api.post('/distribution/issue', {
      issuedToUserId: form.issuedToUserId || undefined,
      department: form.department || undefined,
      notes: form.notes || undefined,
      lines,
    });
    setModal(false);
    setForm({ issuedToUserId: '', department: '', notes: '', lines: [{ itemId: '', quantity: 1 }] });
    load();
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
        <Typography variant="h5" fontWeight={600}>Distribution</Typography>
        {canIssue(user?.role ?? '') && (
          <Button variant="contained" onClick={() => setModal(true)}>Issue items</Button>
        )}
      </Box>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Distribution #</TableCell>
              <TableCell>Issued to</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Lines</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {list.map((d) => (
              <TableRow key={d.id}>
                <TableCell>{d.distributionNumber}</TableCell>
                <TableCell>{d.issuedToUser?.fullName ?? '—'}</TableCell>
                <TableCell>{d.department ?? '—'}</TableCell>
                <TableCell>{new Date(d.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>{d.lines?.length ?? 0} line(s)</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={modal} onClose={() => setModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Issue items</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Issued to user</InputLabel>
              <Select value={form.issuedToUserId} label="Issued to user" onChange={(e) => setForm((f) => ({ ...f, issuedToUserId: e.target.value }))}>
                <MenuItem value="">—</MenuItem>
                {users.map((u) => <MenuItem key={u.id} value={u.id}>{u.fullName}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Department" value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} fullWidth />
            <Typography variant="subtitle2">Lines</Typography>
            {form.lines.map((line, idx) => (
              <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Select
                  size="small"
                  value={line.itemId}
                  onChange={(e) => setForm((f) => ({ ...f, lines: f.lines.map((l, i) => i === idx ? { ...l, itemId: e.target.value } : l) }))}
                  displayEmpty
                  sx={{ minWidth: 220, flex: 2 }}
                >
                  <MenuItem value="">Item</MenuItem>
                  {items.map((i) => <MenuItem key={i.id} value={i.id}>{i.sku} – {i.name}</MenuItem>)}
                </Select>
                <TextField type="number" size="small" value={line.quantity} onChange={(e) => setForm((f) => ({ ...f, lines: f.lines.map((l, i) => i === idx ? { ...l, quantity: Number(e.target.value) } : l) }))} inputProps={{ min: 1 }} sx={{ width: 80 }} />
              </Box>
            ))}
            <Button size="small" onClick={() => setForm((f) => ({ ...f, lines: [...f.lines, { itemId: '', quantity: 1 }] }))}>+ Line</Button>
            <TextField label="Notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={issue}>Issue</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
