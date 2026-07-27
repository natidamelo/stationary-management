import { useState, useRef, useEffect } from 'react';
import { typography } from '../theme/typography';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Avatar,
  IconButton,
  Alert,
  Tabs,
  Tab,
  FormControlLabel,
  Checkbox,
  Chip,
  Paper,
  Divider,
} from '@mui/material';
import PhotoCameraRoundedIcon from '@mui/icons-material/PhotoCameraRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import { useSettings, ALL_MENU_MODULES, DEFAULT_ROLE_PERMISSIONS, RolePermissionsMap } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';

type SettingsDialogProps = {
  open: boolean;
  onClose: () => void;
};

const MANAGABLE_ROLES = [
  { id: 'reception', label: 'Reception / Cashier', description: 'Counter staff issuing sales and receipts' },
  { id: 'user', label: 'Staff / Inventory Clerk', description: 'Store clerks managing stock, requisitions & issues' },
  { id: 'manager', label: 'Store Manager', description: 'Department managers approving requests and reports' },
];

export default function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const { user } = useAuth();
  const { settings, updateSettings, uploadLogo } = useSettings();
  
  const [activeTab, setActiveTab] = useState<number>(0);
  const [stationeryName, setStationeryName] = useState(settings.stationeryName);
  const [logoPreview, setLogoPreview] = useState<string | null>(settings.logoUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Role Permissions state
  const [selectedRole, setSelectedRole] = useState<string>('reception');
  const [rolePermissions, setRolePermissions] = useState<RolePermissionsMap>(settings.rolePermissions);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAdmin = user?.role === 'admin' || user?.role === 'dealer';

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setStationeryName(settings.stationeryName);
      setLogoPreview(settings.logoUrl);
      setRolePermissions(settings.rolePermissions || DEFAULT_ROLE_PERMISSIONS);
      setSelectedFile(null);
      setError(null);
    }
  }, [open, settings]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setError(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleToggleModule = (modulePath: string) => {
    const currentPaths = rolePermissions[selectedRole] || [];
    const exists = currentPaths.includes(modulePath);
    
    let updatedPaths: string[];
    if (exists) {
      updatedPaths = currentPaths.filter((p) => p !== modulePath);
    } else {
      updatedPaths = [...currentPaths, modulePath];
    }

    setRolePermissions((prev) => ({
      ...prev,
      [selectedRole]: updatedPaths,
    }));
  };

  const handleSelectAll = (selectAll: boolean) => {
    setRolePermissions((prev) => ({
      ...prev,
      [selectedRole]: selectAll ? ALL_MENU_MODULES.map((m) => m.path) : [],
    }));
  };

  const handleResetRoleDefaults = () => {
    setRolePermissions((prev) => ({
      ...prev,
      [selectedRole]: DEFAULT_ROLE_PERMISSIONS[selectedRole] || [],
    }));
  };

  const handleSave = async () => {
    setError(null);
    setUploading(true);

    try {
      updateSettings({
        stationeryName,
        rolePermissions,
      });

      if (selectedFile) {
        await uploadLogo(selectedFile);
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setSelectedFile(null);
    setLogoPreview(null);
    updateSettings({ logoUrl: null });
  };

  const activeRolePaths = rolePermissions[selectedRole] || [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <SettingsRoundedIcon color="primary" />
          <Typography variant="h6" component="div" fontWeight={typography.fontWeightBold}>
            System Settings & Access Control
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 1 }}>
        <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
          <Tab icon={<SettingsRoundedIcon fontSize="small" />} iconPosition="start" label="General Branding" sx={{ textTransform: 'none', fontWeight: 700 }} />
          {isAdmin && (
            <Tab icon={<AdminPanelSettingsRoundedIcon fontSize="small" />} iconPosition="start" label="Role Menu Visibility (Admin Control)" sx={{ textTransform: 'none', fontWeight: 700 }} />
          )}
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Tab 0: General Settings */}
        {activeTab === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Stationery Name */}
            <Box>
              <Typography variant="subtitle2" fontWeight={typography.fontWeightSemiBold} sx={{ mb: 1 }}>
                Stationery & Enterprise Name
              </Typography>
              <TextField
                fullWidth
                value={stationeryName}
                onChange={(e) => setStationeryName(e.target.value)}
                placeholder="Enter stationery name"
                variant="outlined"
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                This name will appear in the top sidebar header, printed receipts, and invoices.
              </Typography>
            </Box>

            {/* Logo Upload */}
            <Box>
              <Typography variant="subtitle2" fontWeight={typography.fontWeightSemiBold} sx={{ mb: 1 }}>
                Logo / Organization Emblem
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={logoPreview || undefined}
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: 2.5,
                    bgcolor: logoPreview ? 'transparent' : 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                    border: '2px solid #e5e7eb',
                  }}
                >
                  {!logoPreview && <PhotoCameraRoundedIcon sx={{ fontSize: '2rem', color: '#fff' }} />}
                </Avatar>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<PhotoCameraRoundedIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                  >
                    Upload Logo
                  </Button>
                  {logoPreview && (
                    <Button
                      variant="text"
                      color="error"
                      size="small"
                      onClick={handleRemoveLogo}
                      sx={{ textTransform: 'none' }}
                    >
                      Remove Logo
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {/* Tab 1: Role Menu Visibility Control Panel */}
        {activeTab === 1 && isAdmin && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ bgcolor: 'rgba(79, 70, 229, 0.05)', p: 2, borderRadius: 2.5, border: '1px solid rgba(79, 70, 229, 0.15)' }}>
              <Typography variant="subtitle2" fontWeight={700} color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SecurityRoundedIcon fontSize="small" />
                Admin Menu Visibility & Role Access Control
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Select a user role below and check or uncheck which side navigation modules will be visible to users assigned to that role.
              </Typography>
            </Box>

            {/* Select Role to Configure */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {MANAGABLE_ROLES.map((r) => (
                <Chip
                  key={r.id}
                  label={r.label}
                  clickable
                  color={selectedRole === r.id ? 'primary' : 'default'}
                  variant={selectedRole === r.id ? 'filled' : 'outlined'}
                  onClick={() => setSelectedRole(r.id)}
                  sx={{ fontWeight: 700, borderRadius: 2, py: 2 }}
                />
              ))}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                Configuring Modules for: <strong>{MANAGABLE_ROLES.find(r => r.id === selectedRole)?.label}</strong> ({activeRolePaths.length}/{ALL_MENU_MODULES.length} enabled)
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" variant="text" onClick={() => handleSelectAll(true)}>
                  Select All
                </Button>
                <Button size="small" variant="text" color="secondary" onClick={() => handleSelectAll(false)}>
                  Clear All
                </Button>
                <Button size="small" variant="text" color="info" startIcon={<RestartAltRoundedIcon fontSize="small" />} onClick={handleResetRoleDefaults}>
                  Reset Defaults
                </Button>
              </Box>
            </Box>

            <Divider />

            {/* Checkbox Grid for All Modules */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
              {ALL_MENU_MODULES.map((mod) => {
                const isChecked = activeRolePaths.includes(mod.path);
                return (
                  <Paper
                    key={mod.path}
                    variant="outlined"
                    onClick={() => handleToggleModule(mod.path)}
                    sx={{
                      p: 1.25,
                      px: 2,
                      borderRadius: 2.5,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      bgcolor: isChecked ? 'rgba(79, 70, 229, 0.04)' : 'transparent',
                      borderColor: isChecked ? 'primary.light' : 'rgba(0,0,0,0.1)',
                      transition: 'all 0.15s ease',
                      '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(79, 70, 229, 0.08)' },
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isChecked}
                          onChange={() => handleToggleModule(mod.path)}
                          color="primary"
                          size="small"
                        />
                      }
                      label={<Typography variant="body2" fontWeight={isChecked ? 700 : 500}>{mod.label}</Typography>}
                      sx={{ m: 0, pointerEvents: 'none' }}
                    />
                    {isChecked ? (
                      <Chip label="VISIBLE" size="small" color="primary" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700 }} />
                    ) : (
                      <Chip label="HIDDEN" size="small" variant="outlined" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 600, color: 'text.disabled' }} />
                    )}
                  </Paper>
                );
              })}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'space-between' }}>
        <Button onClick={onClose} disabled={uploading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={uploading || !stationeryName.trim()}
          startIcon={<CheckCircleRoundedIcon />}
          sx={{
            px: 3,
            py: 1,
            borderRadius: 2.5,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          }}
        >
          {uploading ? 'Saving Changes...' : 'Save Settings'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
