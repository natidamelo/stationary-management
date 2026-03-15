import { useEffect, useState } from 'react';
import { Box, Typography, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Chip } from '@mui/material';
import { api } from '../api/client';

type AuditLog = {
    _id: string;
    action: string;
    entity: string;
    entityId?: string;
    performedByName?: string;
    createdAt: string;
};

export default function AuditLogs() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<{ logs: AuditLog[]; total: number }>('/audit-log')
            .then((r) => setLogs(r.data.logs ?? []))
            .catch(() => setLogs([]))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                System Audit Logs
            </Typography>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'background.default' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Entity Type</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Entity ID</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                    No audit logs found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log) => (
                                <TableRow key={log._id} hover>
                                    <TableCell>
                                        <Typography variant="body2">{new Date(log.createdAt).toLocaleString()}</Typography>
                                    </TableCell>
                                    <TableCell>{log.performedByName || 'System'}</TableCell>
                                    <TableCell>
                                        <Chip size="small" label={log.action} sx={{ bgcolor: 'action.hover', fontWeight: 600 }} />
                                    </TableCell>
                                    <TableCell>{log.entity}</TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'text.secondary' }}>
                                        {log.entityId || '—'}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
