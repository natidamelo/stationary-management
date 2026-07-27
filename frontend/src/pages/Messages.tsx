import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Avatar,
  Chip,
  IconButton,
  List,
  ListItem,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,
  InputAdornment,
  Paper,
  Tooltip,
  FormHelperText,
} from '@mui/material';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import SearchIcon from '@mui/icons-material/Search';
import ReplyRoundedIcon from '@mui/icons-material/ReplyRounded';
import MarkEmailReadRoundedIcon from '@mui/icons-material/MarkEmailReadRounded';
import FlashOnRoundedIcon from '@mui/icons-material/FlashOnRounded';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

type UserRow = {
  id: string;
  fullName: string;
  email?: string;
  role?: { name: string };
};

type Message = {
  id: string;
  senderId: string;
  recipientId: string | null;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    fullName: string;
    role: string;
  } | null;
  recipient: {
    id: string;
    fullName: string;
    role: string;
  } | null;
};

const TEMPLATES = [
  { label: '📢 Announcement', text: 'Team announcement: Please review our latest inventory updates and stock guidelines.' },
  { label: '📦 Stock Alert', text: 'Low Stock Alert: Please check stock levels and submit a purchase requisition.' },
  { label: '⚠️ Urgent Request', text: 'Urgent: Please verify pending orders and complete sales processing.' },
  { label: '💬 Quick Inquiry', text: 'Hi, could you please confirm the current stock availability for this item?' },
];

export default function Messages() {
  const { user } = useAuth();
  
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [sendType, setSendType] = useState<'all' | 'individual'>('all');
  const [recipientId, setRecipientId] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTab, setFilterTab] = useState<'all' | 'broadcast' | 'direct' | 'sent'>('all');
  
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Toast Notification
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Fetch users & messages
  const fetchData = async () => {
    try {
      const [msgRes, recipientsRes] = await Promise.allSettled([
        api.get<Message[]>('/messages'),
        api.get<UserRow[]>('/messages/recipients').catch(() => api.get<UserRow[]>('/users')),
      ]);

      if (msgRes.status === 'fulfilled') {
        setMessages(msgRes.value.data || []);
      }
      
      if (recipientsRes.status === 'fulfilled') {
        const userList = (recipientsRes.value.data || []) as UserRow[];
        setUsers(userList);
      }
    } catch (err) {
      console.error('Error fetching messages data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Send message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      setFormError('Please enter a message content before sending.');
      return;
    }

    if (sendType === 'individual' && !recipientId) {
      setFormError('Please select a recipient user from the list.');
      return;
    }

    setSending(true);
    try {
      await api.post('/messages', {
        recipientId: sendType === 'individual' ? recipientId : null,
        content: trimmedContent,
      });

      setContent('');
      setFormError(null);

      setToast({
        open: true,
        message: sendType === 'individual' ? 'Direct message sent successfully!' : 'Broadcast announcement published!',
        severity: 'success',
      });

      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to send message. Please try again.';
      setFormError(msg);
      setToast({
        open: true,
        message: msg,
        severity: 'error',
      });
    } finally {
      setSending(false);
    }
  };

  // Reply shortcut
  const handleReply = (targetUser: { id: string; fullName: string }) => {
    setSendType('individual');
    setRecipientId(targetUser.id);
    setFormError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setToast({
      open: true,
      message: `Replying to ${targetUser.fullName}`,
      severity: 'info',
    });
  };

  // Delete message (Admin only)
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message log? This action is tracked to preserve evidence.')) {
      return;
    }
    try {
      await api.delete(`/messages/${id}`);
      setToast({ open: true, message: 'Message log deleted.', severity: 'success' });
      fetchData();
    } catch (err: any) {
      setToast({
        open: true,
        message: err.response?.data?.message || 'Failed to delete message log',
        severity: 'error',
      });
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffSec < 45) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mins ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
      
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Filtered message history
  const filteredMessages = useMemo(() => {
    let list = [...messages];
    
    // Sort descending (latest first)
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Tab filter
    if (filterTab === 'broadcast') {
      list = list.filter((m) => !m.recipientId);
    } else if (filterTab === 'direct') {
      list = list.filter((m) => Boolean(m.recipientId));
    } else if (filterTab === 'sent') {
      list = list.filter((m) => m.senderId === user?.id || m.sender?.id === user?.id);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.content.toLowerCase().includes(q) ||
          (m.sender?.fullName || '').toLowerCase().includes(q) ||
          (m.recipient?.fullName || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [messages, filterTab, searchQuery, user?.id]);

  const canSubmit = Boolean(content.trim()) && (sendType === 'all' || Boolean(recipientId));

  return (
    <Box sx={{ animation: 'fadeIn 0.3s ease-out', '@keyframes fadeIn': { from: { opacity: 0 }, to: { opacity: 1 } } }}>
      {/* Title Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 8px 20px rgba(79, 70, 229, 0.3)',
            }}
          >
            <ForumRoundedIcon sx={{ fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>
              Message & Communications Center
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              Broadcast company-wide announcements or send direct messages to store team members.
            </Typography>
          </Box>
        </Box>

        <Chip
          icon={<ShieldRoundedIcon sx={{ fontSize: '1rem !important' }} />}
          label="Audit Log Active (Admin Evidence Protection)"
          sx={{
            bgcolor: 'rgba(79, 70, 229, 0.08)',
            color: '#4f46e5',
            fontWeight: 700,
            fontSize: '0.78rem',
            border: '1px solid rgba(79, 70, 229, 0.2)',
            py: 1.5,
            px: 1,
            borderRadius: 2,
          }}
        />
      </Box>

      <Grid container spacing={3}>
        {/* Left Column: Compose Message */}
        <Grid item xs={12} md={5} lg={4.5}>
          <Card
            sx={{
              borderRadius: 4,
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              border: '1px solid rgba(0,0,0,0.08)',
              overflow: 'visible',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SendRoundedIcon color="primary" sx={{ fontSize: 22 }} />
                New Message
              </Typography>

              <form onSubmit={handleSend}>
                {/* Broadcast / Direct Toggle */}
                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  MESSAGE TYPE
                </Typography>
                <ToggleButtonGroup
                  value={sendType}
                  exclusive
                  onChange={(_, val) => {
                    if (val !== null) {
                      setSendType(val);
                      setFormError(null);
                    }
                  }}
                  fullWidth
                  size="small"
                  sx={{ mb: 2.5 }}
                >
                  <ToggleButton
                    value="all"
                    sx={{
                      gap: 1,
                      textTransform: 'none',
                      fontWeight: 600,
                      py: 1,
                      '&.Mui-selected': { bgcolor: 'rgba(79, 70, 229, 0.12)', color: 'primary.main' },
                    }}
                  >
                    <CampaignRoundedIcon fontSize="small" />
                    Send to All
                  </ToggleButton>
                  <ToggleButton
                    value="individual"
                    sx={{
                      gap: 1,
                      textTransform: 'none',
                      fontWeight: 600,
                      py: 1,
                      '&.Mui-selected': { bgcolor: 'rgba(79, 70, 229, 0.12)', color: 'primary.main' },
                    }}
                  >
                    <PeopleAltRoundedIcon fontSize="small" />
                    Individual User
                  </ToggleButton>
                </ToggleButtonGroup>

                {/* Recipient Dropdown (if individual) */}
                {sendType === 'individual' && (
                  <FormControl fullWidth size="small" required error={Boolean(formError && !recipientId)} sx={{ mb: 2.5 }}>
                    <InputLabel id="recipient-select-label">Recipient *</InputLabel>
                    <Select
                      labelId="recipient-select-label"
                      id="recipient-select"
                      value={recipientId}
                      label="Recipient *"
                      onChange={(e) => {
                        setRecipientId(e.target.value as string);
                        setFormError(null);
                      }}
                      sx={{ borderRadius: 2.5 }}
                    >
                      <MenuItem value="">
                        <em>Select a user...</em>
                      </MenuItem>
                      {users
                        .filter((u) => u.id !== user?.id)
                        .map((u) => {
                          const roleName = u.role?.name ? u.role.name.toUpperCase() : 'STAFF';
                          return (
                            <MenuItem key={u.id} value={u.id}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                <Typography variant="body2" fontWeight={600}>{u.fullName}</Typography>
                                <Chip label={roleName} size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, ml: 1 }} />
                              </Box>
                            </MenuItem>
                          );
                        })}
                    </Select>
                    {sendType === 'individual' && !recipientId && (
                      <FormHelperText error>Please choose who will receive this message</FormHelperText>
                    )}
                  </FormControl>
                )}

                {/* Quick Templates */}
                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <FlashOnRoundedIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
                  QUICK TEMPLATES
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2.5 }}>
                  {TEMPLATES.map((tmpl, idx) => (
                    <Chip
                      key={idx}
                      label={tmpl.label}
                      size="small"
                      clickable
                      onClick={() => {
                        setContent(tmpl.text);
                        setFormError(null);
                      }}
                      sx={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        bgcolor: 'rgba(0,0,0,0.04)',
                        '&:hover': { bgcolor: 'rgba(79, 70, 229, 0.1)', color: 'primary.main' },
                      }}
                    />
                  ))}
                </Box>

                {/* Message Content Input */}
                <TextField
                  label="Message Content *"
                  placeholder="Write your message or announcement..."
                  multiline
                  rows={5}
                  fullWidth
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    setFormError(null);
                  }}
                  required
                  error={Boolean(formError && !content.trim())}
                  helperText={formError}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                    },
                  }}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={sending || !canSubmit}
                  startIcon={sending ? <CircularProgress size={20} color="inherit" /> : <SendRoundedIcon />}
                  sx={{
                    py: 1.5,
                    borderRadius: 3,
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    background: canSubmit ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' : undefined,
                    boxShadow: canSubmit ? '0 6px 16px rgba(79, 70, 229, 0.35)' : undefined,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)',
                    },
                  }}
                >
                  {sending ? 'Sending Message...' : sendType === 'all' ? 'Broadcast to All Users' : 'Send Direct Message'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Message Feed */}
        <Grid item xs={12} md={7} lg={7.5}>
          <Card
            sx={{
              height: '100%',
              borderRadius: 4,
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              border: '1px solid rgba(0,0,0,0.08)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 480 }}>
              {/* Filter Tabs & Search Header */}
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FilterListRoundedIcon color="primary" />
                  <Typography variant="h6" fontWeight={700}>
                    Message History ({filteredMessages.length})
                  </Typography>
                </Box>

                {/* Filter Tabs */}
                <ToggleButtonGroup
                  value={filterTab}
                  exclusive
                  onChange={(_, val) => val && setFilterTab(val)}
                  size="small"
                  sx={{ bgcolor: 'rgba(0,0,0,0.03)', p: 0.5, borderRadius: 2 }}
                >
                  <ToggleButton value="all" sx={{ px: 1.5, py: 0.5, fontSize: '0.75rem', fontWeight: 700, border: 'none', borderRadius: 1.5 }}>
                    All
                  </ToggleButton>
                  <ToggleButton value="broadcast" sx={{ px: 1.5, py: 0.5, fontSize: '0.75rem', fontWeight: 700, border: 'none', borderRadius: 1.5 }}>
                    Announcements
                  </ToggleButton>
                  <ToggleButton value="direct" sx={{ px: 1.5, py: 0.5, fontSize: '0.75rem', fontWeight: 700, border: 'none', borderRadius: 1.5 }}>
                    Direct
                  </ToggleButton>
                  <ToggleButton value="sent" sx={{ px: 1.5, py: 0.5, fontSize: '0.75rem', fontWeight: 700, border: 'none', borderRadius: 1.5 }}>
                    Sent by Me
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {/* Search Bar */}
              <TextField
                placeholder="Search messages, senders, or content..."
                size="small"
                fullWidth
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ mb: 2.5 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2.5 },
                }}
              />

              {/* Messages Container */}
              <Box sx={{ flexGrow: 1, overflowY: 'auto', maxHeight: 600, pr: 0.5 }}>
                {loading ? (
                  <Box sx={{ py: 10, textAlign: 'center' }}>
                    <CircularProgress size={36} sx={{ color: 'primary.main' }} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Loading messages...</Typography>
                  </Box>
                ) : filteredMessages.length === 0 ? (
                  <Paper
                    variant="outlined"
                    sx={{
                      py: 8,
                      px: 3,
                      textAlign: 'center',
                      borderRadius: 3,
                      bgcolor: 'rgba(0,0,0,0.01)',
                      borderColor: 'rgba(0,0,0,0.06)',
                    }}
                  >
                    <MarkEmailReadRoundedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
                    <Typography variant="subtitle1" fontWeight={700} color="text.secondary">
                      No messages found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {searchQuery ? 'Try adjusting your search query or filter tab.' : 'Send a message or broadcast to get started.'}
                    </Typography>
                  </Paper>
                ) : (
                  <List disablePadding>
                    {filteredMessages.map((m, index) => {
                      const isBroadcast = !m.recipientId;
                      const isMyMessage = m.senderId === user?.id || m.sender?.id === user?.id;
                      const senderInitial = m.sender?.fullName?.charAt(0).toUpperCase() || 'U';
                      const senderRole = m.sender?.role ? m.sender.role.toUpperCase() : 'USER';
                      
                      const recipientName = m.recipient ? m.recipient.fullName : 'ALL USERS';

                      return (
                        <Box key={m.id}>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2.5,
                              mb: 1.5,
                              borderRadius: 3,
                              bgcolor: isBroadcast ? 'rgba(79, 70, 229, 0.03)' : isMyMessage ? 'rgba(59, 130, 246, 0.03)' : 'rgba(0,0,0,0.02)',
                              border: isBroadcast ? '1px solid rgba(79, 70, 229, 0.12)' : '1px solid rgba(0,0,0,0.06)',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                borderColor: 'primary.light',
                              },
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                              <Avatar
                                sx={{
                                  bgcolor: isBroadcast ? 'primary.main' : isMyMessage ? '#2563eb' : '#64748b',
                                  fontWeight: 700,
                                  fontSize: '1rem',
                                  width: 42,
                                  height: 42,
                                }}
                              >
                                {senderInitial}
                              </Avatar>

                              <Box sx={{ flexGrow: 1 }}>
                                {/* Header Row */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                    <Typography variant="subtitle2" fontWeight={700}>
                                      {m.sender?.fullName || 'System User'}
                                    </Typography>
                                    <Chip
                                      label={senderRole}
                                      size="small"
                                      sx={{
                                        height: 18,
                                        fontSize: '0.62rem',
                                        fontWeight: 700,
                                        bgcolor: 'rgba(0,0,0,0.06)',
                                        color: 'text.secondary',
                                      }}
                                    />
                                    <Typography variant="caption" color="text.secondary">
                                      • {formatRelativeTime(m.createdAt)}
                                    </Typography>
                                  </Box>

                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip
                                      icon={isBroadcast ? <CampaignRoundedIcon sx={{ fontSize: '0.9rem !important' }} /> : <PeopleAltRoundedIcon sx={{ fontSize: '0.9rem !important' }} />}
                                      label={isBroadcast ? 'ANNOUNCEMENT' : `TO: ${recipientName}`}
                                      size="small"
                                      sx={{
                                        fontSize: '0.68rem',
                                        fontWeight: 700,
                                        bgcolor: isBroadcast ? '#e0e7ff' : '#f1f5f9',
                                        color: isBroadcast ? '#4338ca' : '#334155',
                                        height: 22,
                                        borderRadius: 1.5,
                                      }}
                                    />

                                    {/* Reply Button (if not sent by me) */}
                                    {!isMyMessage && m.sender && (
                                      <Tooltip title={`Reply to ${m.sender.fullName}`}>
                                        <IconButton size="small" color="primary" onClick={() => handleReply(m.sender!)}>
                                          <ReplyRoundedIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    )}

                                    {/* Delete Button (Admin Only) */}
                                    {user?.role === 'admin' && (
                                      <Tooltip title="Delete Message Log (Admin Only)">
                                        <IconButton size="small" color="error" onClick={() => handleDelete(m.id)}>
                                          <DeleteOutlineRoundedIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                  </Box>
                                </Box>

                                {/* Message Text */}
                                <Typography
                                  variant="body2"
                                  color="text.primary"
                                  sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.9rem' }}
                                >
                                  {m.content}
                                </Typography>
                              </Box>
                            </Box>
                          </Paper>
                        </Box>
                      );
                    })}
                  </List>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Snackbar Toast Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ width: '100%', borderRadius: 2.5 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
