import { useState, useEffect, useRef } from 'react';
import { Box, TextField, Popover, List, ListItemButton, ListItemText, Typography, InputAdornment, IconButton, CircularProgress } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

type SearchResult = {
    id: string;
    type: string;
    title: string;
    subtitle: string;
    link: string;
};

export default function GlobalSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setAnchorEl(null);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await api.get<SearchResult[]>(`/search?q=${encodeURIComponent(query)}`);
                setResults(res.data ?? []);
                setAnchorEl(inputRef.current);
            } catch {
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [query]);

    return (
        <Box sx={{ position: 'relative', width: { xs: 140, sm: 220, md: 300 } }}>
            <TextField
                inputRef={inputRef}
                placeholder="Global search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                size="small"
                fullWidth
                sx={{
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 8,
                        pl: 1,
                        pr: 1,
                        bgcolor: 'action.hover',
                        fieldset: { border: 'none' },
                        '&.Mui-focused fieldset': { border: '1px solid', borderColor: 'primary.main' },
                    },
                }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchRoundedIcon fontSize="small" color="action" />
                        </InputAdornment>
                    ),
                    endAdornment: (
                        <InputAdornment position="end">
                            {loading ? (
                                <CircularProgress size={16} color="inherit" />
                            ) : query && (
                                <IconButton size="small" onClick={() => { setQuery(''); setAnchorEl(null); }}>
                                    <ClearRoundedIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            )}
                        </InputAdornment>
                    ),
                }}
            />

            <Popover
                open={Boolean(anchorEl) && (results.length > 0 || !loading)}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                disableAutoFocus
                disableEnforceFocus
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                PaperProps={{ sx: { width: { xs: 260, sm: 320, md: 400 }, maxHeight: 400, mt: 1, borderRadius: 2, p: 0 } }}
            >
                <List sx={{ p: 0 }}>
                    {results.length === 0 ? (
                        <Box sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">No results found for &quot;{query}&quot;</Typography>
                        </Box>
                    ) : (
                        results.map((r) => (
                            <ListItemButton
                                key={r.id}
                                onClick={() => {
                                    navigate(r.link);
                                    setQuery('');
                                    setAnchorEl(null);
                                }}
                                sx={{ borderBottom: '1px solid', borderColor: 'divider', py: 1.5 }}
                            >
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                            <Typography variant="body2" fontWeight={600} color="text.primary">{r.title}</Typography>
                                            <Typography variant="caption" sx={{ textTransform: 'capitalize', color: 'primary.main', bgcolor: 'primary.light', px: 1, py: 0.25, borderRadius: 1, opacity: 0.8 }}>
                                                {r.type.replace('_', ' ')}
                                            </Typography>
                                        </Box>
                                    }
                                    secondary={
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                            {r.subtitle}
                                        </Typography>
                                    }
                                />
                            </ListItemButton>
                        ))
                    )}
                </List>
            </Popover>
        </Box>
    );
}
