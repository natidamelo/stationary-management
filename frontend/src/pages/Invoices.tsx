import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import PrintRoundedIcon from '@mui/icons-material/PrintRounded';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

type Invoice = {
  id: string;
  invoiceNumber: string;
  saleId?: string;
  saleNumber?: string;
  issueDate: string;
  customerName?: string;
  customerEmail?: string;
  customerAddress?: string;
  lines: Array<{ description: string; sku?: string; quantity: number; unitPrice: number; total: number }>;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  status: string;
  notes?: string;
};

type Sale = {
  id: string;
  saleNumber: string;
  soldAt: string;
  totalAmount: number;
  balanceDue?: number;
  customerName?: string;
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  draft: { bg: '#f3f4f6', color: '#6b7280' },
  sent: { bg: '#eef2ff', color: '#4f46e5' },
  paid: { bg: '#ecfdf5', color: '#059669' },
};

export default function Invoices() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [list, setList] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedSaleId, setSelectedSaleId] = useState('');
  const [creating, setCreating] = useState(false);

  const load = () => api.get<Invoice[]>('/invoices').then((r) => setList(r.data));

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setCreateModal(true);
    setSelectedSaleId('');
    api.get<Sale[]>('/reception/sales/today').then((r) => setSales(r.data)).catch(() => setSales([]));
  };

  const createFromSale = async () => {
    if (!selectedSaleId) return;
    setCreating(true);
    try {
      await api.post('/invoices/from-sale', { saleId: selectedSaleId });
      setCreateModal(false);
      load();
    } finally {
      setCreating(false);
    }
  };

  const printInvoice = () => {
    window.print();
  };

  const downloadPdf = () => {
    if (!viewInvoice) return;
    try {
      const doc = new jsPDF();
      const inv = viewInvoice;

      // Standard RGB color definitions
      const indigo = [79, 70, 229];
      const gray = [100, 116, 139];
      const success = [16, 185, 129];
      const warning = [249, 115, 22];
      const slate = [226, 232, 240];

      // Add Logo or Header Title
      if (settings.logoUrl) {
        try {
          doc.addImage(settings.logoUrl, 'PNG', 20, 15, 30, 15);
        } catch (e) {
          doc.setFontSize(22);
          doc.setTextColor(indigo[0], indigo[1], indigo[2]);
          doc.text(settings.stationeryName.toUpperCase(), 20, 25);
        }
      } else {
        doc.setFontSize(22);
        doc.setTextColor(indigo[0], indigo[1], indigo[2]);
        doc.text(settings.stationeryName.toUpperCase(), 20, 25);
      }

      doc.setFontSize(30);
      doc.setTextColor(slate[0], slate[1], slate[2]);
      doc.text('INVOICE', 190, 25, { align: 'right' });

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.text(`Invoice #: ${inv.invoiceNumber}`, 190, 35, { align: 'right' });
      doc.text(`Date: ${new Date(inv.issueDate).toLocaleDateString()}`, 190, 41, { align: 'right' });
      if (inv.saleNumber) doc.text(`Sale ID: ${inv.saleNumber}`, 190, 47, { align: 'right' });

      // Bill To
      doc.setFillColor(248, 250, 252); // Fills still support RGB components? Some docs say doc.setFillColor(r, g, b)
      doc.rect(20, 55, 80, 25, 'F');
      doc.setFontSize(9);
      doc.setTextColor(indigo[0], indigo[1], indigo[2]);
      doc.text('BILL TO', 25, 62);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.text(inv.customerName || 'Walk-in Customer', 25, 68);
      doc.setFontSize(9);
      doc.setTextColor(gray[0], gray[1], gray[2]);
      if (inv.customerEmail) doc.text(inv.customerEmail, 25, 73);

      // Status
      doc.setTextColor(indigo[0], indigo[1], indigo[2]);
      doc.text('PAYMENT STATUS', 190, 62, { align: 'right' });
      const statusColor = inv.status === 'paid' ? success : warning;
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.setFontSize(14);
      doc.text(inv.status.toUpperCase(), 190, 71, { align: 'right' });

      // Table
      autoTable(doc, {
        startY: 90,
        head: [['Description', 'SKU', 'Qty', 'Unit Price', 'Total']],
        body: inv.lines.map(line => [
          line.description,
          line.sku || '-',
          line.quantity,
          `$${Number(line.unitPrice).toFixed(2)}`,
          `$${Number(line.total).toFixed(2)}`
        ]),
        styles: { fontSize: 9, cellPadding: 5 },
        headStyles: { fillColor: indigo, textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: {
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' }
        }
      });

      const finalY = (doc as any).lastAutoTable.finalY + 10;

      // Totals
      doc.setFontSize(10);
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.text('Total Amount:', 150, finalY);
      doc.setTextColor(0, 0, 0);
      doc.text(`$${Number(inv.totalAmount).toFixed(2)}`, 190, finalY, { align: 'right' });

      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.text('Amount Paid:', 150, finalY + 7);
      doc.setTextColor(success[0], success[1], success[2]);
      doc.text(`$${Number(inv.amountPaid).toFixed(2)}`, 190, finalY + 7, { align: 'right' });

      doc.setDrawColor(indigo[0], indigo[1], indigo[2]);
      doc.setLineWidth(0.5);
      doc.line(140, finalY + 11, 190, finalY + 11);

      doc.setFontSize(12);
      doc.setTextColor(indigo[0], indigo[1], indigo[2]);
      doc.text('Balance Due:', 150, finalY + 18);
      doc.text(`$${Number(inv.balanceDue).toFixed(2)}`, 190, finalY + 18, { align: 'right' });

      // Paid Watermark
      if (inv.status === 'paid') {
        doc.setTextColor(240, 253, 244); // Very light success green
        doc.setFontSize(60);
        doc.text('PAID', 105, 150, { align: 'center' });
      }

      doc.save(`Invoice_${inv.invoiceNumber}.pdf`);
    } catch (err: any) {
      console.error('PDF Generation Error:', err);
      alert('Failed to generate PDF: ' + err.message);
    }
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={700}>
          Invoices
        </Typography>
        <Button
          variant="contained"
          startIcon={<ReceiptLongRoundedIcon />}
          onClick={openCreate}
          sx={{
            bgcolor: '#4f46e5',
            '&:hover': { bgcolor: '#4338ca' },
          }}
        >
          Create from Sale
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              <TableCell sx={{ fontWeight: 600 }}>Invoice #</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Total</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No invoices yet. Create one from a sale in Reception.
                </TableCell>
              </TableRow>
            ) : (
              list.map((inv) => (
                <TableRow key={inv.id} hover>
                  <TableCell>{inv.invoiceNumber}</TableCell>
                  <TableCell>{new Date(inv.issueDate).toLocaleDateString()}</TableCell>
                  <TableCell>{inv.customerName || '—'}</TableCell>
                  <TableCell align="right">{Number(inv.totalAmount).toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={inv.status}
                      sx={{
                        bgcolor: STATUS_STYLES[inv.status]?.bg ?? '#f3f4f6',
                        color: STATUS_STYLES[inv.status]?.color ?? '#6b7280',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      onClick={() => setViewInvoice(inv)}
                      startIcon={<ReceiptLongRoundedIcon />}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      View Invoice
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* View / Print dialog */}
      <Dialog
        open={!!viewInvoice}
        onClose={() => setViewInvoice(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        <DialogContent sx={{ p: 0, bgcolor: '#f1f5f9' }}>
          {viewInvoice && (
            <Box id="invoice-print" sx={{ p: 4, minHeight: '100%', display: 'flex', justifyContent: 'center' }}>
              <Paper
                elevation={3}
                sx={{
                  width: '100%',
                  maxWidth: '210mm',
                  minHeight: '290mm',
                  p: '15mm',
                  bgcolor: '#fff',
                  borderRadius: 1,
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Indigo Top Bar */}
                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8, bgcolor: '#4f46e5' }} />

                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 6, alignItems: 'flex-start' }}>
                  <Box>
                    {settings.logoUrl ? (
                      <Box component="img" src={settings.logoUrl} sx={{ height: 60, mb: 1, maxWidth: 200, objectFit: 'contain' }} />
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: '#4f46e5' }}>
                        <BusinessRoundedIcon sx={{ fontSize: 32 }} />
                        <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em">{settings.stationeryName}</Typography>
                      </Box>
                    )}
                    <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.8, maxWidth: 250 }}>
                      Official Invoice for stationary services and items provided.
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h3" fontWeight={900} color="#4f46e5" sx={{ mb: 1, opacity: 0.1, position: 'absolute', right: '15mm', top: '15mm', fontSize: '4rem' }}>
                      INVOICE
                    </Typography>
                    <Typography variant="h6" fontWeight={700} sx={{ mt: 2 }}>{viewInvoice.invoiceNumber}</Typography>
                    <Typography variant="body2" color="text.secondary">Date: {new Date(viewInvoice.issueDate).toLocaleDateString()}</Typography>
                    {viewInvoice.saleNumber && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>Sale: {viewInvoice.saleNumber}</Typography>
                    )}
                  </Box>
                </Box>

                {/* Billing Info */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 6, gap: 4 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ color: '#4f46e5', fontWeight: 700, mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Bill To
                    </Typography>
                    <Box sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
                      <Typography fontWeight={700} sx={{ mb: 0.5 }}>{viewInvoice.customerName || 'Walk-in Customer'}</Typography>
                      {viewInvoice.customerEmail && <Typography variant="body2" color="text.secondary">{viewInvoice.customerEmail}</Typography>}
                      {viewInvoice.customerAddress && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{viewInvoice.customerAddress}</Typography>}
                    </Box>
                  </Box>
                  <Box sx={{ flex: 1, textAlign: 'right' }}>
                    <Typography variant="subtitle2" sx={{ color: '#4f46e5', fontWeight: 700, mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Status
                    </Typography>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 1, borderRadius: 10, bgcolor: viewInvoice.status === 'paid' ? '#ecfdf5' : '#fff7ed' }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: viewInvoice.status === 'paid' ? '#10b981' : '#f97316' }} />
                      <Typography variant="body2" fontWeight={700} color={viewInvoice.status === 'paid' ? '#065f46' : '#9a3412'} sx={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>
                        {viewInvoice.status}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Items Table */}
                <Box sx={{ flex: 1 }}>
                  <TableContainer component={Box} sx={{ mb: 4 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ borderTop: '2px solid #4f46e5', borderBottom: '1px solid #e2e8f0' }}>
                          <TableCell sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem', color: 'text.secondary', letterSpacing: '0.1em' }}>Description</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem', color: 'text.secondary', letterSpacing: '0.1em' }}>SKU</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem', color: 'text.secondary', letterSpacing: '0.1em' }}>Qty</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem', color: 'text.secondary', letterSpacing: '0.1em' }}>Price</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem', color: 'text.secondary', letterSpacing: '0.1em' }}>Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {viewInvoice.lines.map((line, i) => (
                          <TableRow key={i} sx={{ '&:last-child td': { border: 0 } }}>
                            <TableCell sx={{ py: 2 }}>
                              <Typography variant="body2" fontWeight={600}>{line.description}</Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>{line.sku || 'N/A'}</TableCell>
                            <TableCell align="right">{line.quantity}</TableCell>
                            <TableCell align="right">{Number(line.unitPrice).toFixed(2)}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>{Number(line.total).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                {/* Totals */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 'auto', pt: 4 }}>
                  <Box sx={{ width: 250 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Total Amount</Typography>
                      <Typography variant="body2" fontWeight={700}>${Number(viewInvoice.totalAmount).toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Amount Paid</Typography>
                      <Typography variant="body2" color="success.main" fontWeight={700}>-${Number(viewInvoice.amountPaid).toFixed(2)}</Typography>
                    </Box>
                    <Divider sx={{ my: 1.5 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight={800} color="#4f46e5">Balance Due</Typography>
                      <Typography variant="subtitle1" fontWeight={900} color="#4f46e5">${Number(viewInvoice.balanceDue).toFixed(2)}</Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Footer */}
                <Box sx={{ mt: 8, pt: 4, borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Thank you for your business! Please come again to {settings.stationeryName}.
                  </Typography>
                  {viewInvoice.notes && (
                    <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary', display: 'block' }}>
                      Notes: {viewInvoice.notes}
                    </Typography>
                  )}
                </Box>

                {/* Paid Watermark */}
                {viewInvoice.status === 'paid' && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%) rotate(-30deg)',
                      border: '6px solid #10b981',
                      borderRadius: 4,
                      px: 4,
                      py: 2,
                      opacity: 0.1,
                      pointerEvents: 'none',
                      zIndex: 0
                    }}
                  >
                    <Typography variant="h1" fontWeight={900} color="#10b981">PAID</Typography>
                  </Box>
                )}
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 4, py: 3, borderTop: '1px solid #e2e8f0', bgcolor: '#fff' }}>
          <Button onClick={() => setViewInvoice(null)} color="inherit" sx={{ fontWeight: 600 }}>Close</Button>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="outlined"
            startIcon={<PictureAsPdfRoundedIcon />}
            onClick={downloadPdf}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Download Professional PDF
          </Button>
          <Button
            variant="contained"
            startIcon={<PrintRoundedIcon />}
            onClick={printInvoice}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, bgcolor: '#4f46e5' }}
          >
            Print
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create from sale dialog */}
      <Dialog open={createModal} onClose={() => setCreateModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Create invoice from sale</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select sale</InputLabel>
            <Select
              value={selectedSaleId}
              label="Select sale"
              onChange={(e) => setSelectedSaleId(e.target.value)}
            >
              <MenuItem value="">—</MenuItem>
              {sales.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.saleNumber} — {new Date(s.soldAt).toLocaleString()} — {Number(s.totalAmount).toFixed(2)}
                  {s.customerName ? ` (${s.customerName})` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {sales.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              No sales from today. Make a sale in Reception first.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={createFromSale}
            disabled={!selectedSaleId || creating}
          >
            {creating ? 'Creating…' : 'Create invoice'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Print-only styles: hide everything except invoice content */}
      <style>{`
        @media print {
          /* Hide everything in the main app and all portals by default */
          #root, .MuiDialog-root > .MuiBackdrop-root { display: none !important; }
          
          /* Show the dialog that contains our invoice */
          .MuiDialog-root { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important; 
            display: block !important; 
          }
          .MuiDialog-container { display: block !important; }
          
          /* Make the paper container full-page */
          .MuiDialog-paper { 
            box-shadow: none !important; 
            margin: 0 !important; 
            padding: 0 !important; 
            width: 100vw !important; 
            max-width: none !important; 
            height: auto !important; 
            max-height: none !important; 
            position: static !important;
            overflow: visible !important;
          }
          
          .MuiDialogContent-root { padding: 0 !important; overflow: visible !important; }
          .MuiDialogActions-root { display: none !important; }
          
          /* Ensure our specific invoice div is properly visible */
          #invoice-print { 
            display: block !important; 
            padding: 0 !important; 
            margin: 0 !important;
            width: 100% !important;
            background: white !important;
          }
          
          /* Hide standard browser headers/footers if possible */
          header, footer { display: none !important; }
        }
      `}</style>
    </Box>
  );
}
