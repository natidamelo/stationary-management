import { Box, Typography, Card, CardContent, List, ListItem, ListItemAvatar, Avatar, ListItemText, Divider, Chip } from '@mui/material';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';

export default function Messages() {
  const mockMessages = [
    { sender: 'System Admin', role: 'Administrator', message: 'The database connection was updated to Mongo Atlas cluster successfully.', time: '2 hours ago', unread: true },
    { sender: 'Meskel Flower Store Manager', role: 'Store Manager', message: 'We have initiated a transfer request of 50 packs of A4 paper to Main Warehouse.', time: '5 hours ago', unread: false },
    { sender: 'Finance Dept', role: 'Accountant', message: 'Requisition PR-20260618-UYJS has been approved for ETB 15,000.00.', time: 'Yesterday', unread: false },
  ];

  return (
    <Box sx={{ animation: 'fadeIn 0.3s ease-out', '@keyframes fadeIn': { from: { opacity: 0 }, to: { opacity: 1 } } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 3,
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 8px 16px rgba(79, 70, 229, 0.2)',
          }}
        >
          <ForumRoundedIcon />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>Message Center</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Communications, approvals, and system notifications
          </Typography>
        </Box>
      </Box>

      <Card>
        <List sx={{ p: 0 }}>
          {mockMessages.map((m, index) => (
            <Box key={index}>
              <ListItem alignItems="flex-start" sx={{ py: 2.5, px: 3, '&:hover': { bgcolor: 'action.hover' } }}>
                <ListItemAvatar sx={{ mt: 0.5 }}>
                  <Avatar sx={{ bgcolor: m.unread ? 'primary.main' : 'text.disabled' }}>
                    {m.sender.charAt(0)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={700}>{m.sender}</Typography>
                        <Chip label={m.role} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }} />
                      </Box>
                      <Typography variant="caption" color="text.secondary">{m.time}</Typography>
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2" color={m.unread ? 'text.primary' : 'text.secondary'} fontWeight={m.unread ? 600 : 400}>
                      {m.message}
                    </Typography>
                  }
                />
              </ListItem>
              {index < mockMessages.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      </Card>
    </Box>
  );
}
