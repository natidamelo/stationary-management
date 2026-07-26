import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Package, Mail, Lock, Eye, EyeOff, Copy, ChevronDown, ChevronUp, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showComputerId, setShowComputerId] = useState(false);
  const [error, setError] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const { login, computerId } = useAuth();
  const navigate = useNavigate();

  const copyComputerId = () => {
    navigator.clipboard.writeText(computerId);
    toast.success('Computer ID copied to clipboard!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoadingSubmit(true);
    try {
      await login(email, password);
      toast.success('Signed in successfully');
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.message;
      const text = Array.isArray(msg) ? msg.join(' ') : msg || err.response?.data?.error;
      if (text) {
        setError(text);
      } else if (err.response?.status === 401) {
        setError('Invalid credentials or license error.');
      } else {
        setError('Login failed. Please verify server connectivity.');
      }
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/20 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md shadow-2xl border-border/80 bg-card/90 backdrop-blur-xl relative z-10 animate-fade-in-scale">
        <CardHeader className="space-y-3 text-center pb-4">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl font-extrabold tracking-tight">Stationery Management</CardTitle>
            <CardDescription className="text-xs mt-1">Sign in to manage stock and sales</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-9 pr-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/15 text-destructive text-xs font-medium border border-destructive/30">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full h-10 font-bold" disabled={loadingSubmit}>
              {loadingSubmit ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            Don't have an account?{' '}
            <RouterLink to="/register" className="font-semibold text-primary hover:underline">
              Register here
            </RouterLink>
          </div>

          {/* Computer ID Section */}
          <div className="mt-4 pt-4 border-t border-border/50 text-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowComputerId(!showComputerId)}
            >
              {showComputerId ? 'Hide Computer ID' : 'Show Computer ID'}
              {showComputerId ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
            </Button>

            {showComputerId && (
              <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border text-left space-y-2 animate-fade-in">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Computer Hardware ID
                </span>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-foreground break-all flex-1">
                    {computerId}
                  </code>
                  <Button variant="outline" size="icon-sm" onClick={copyComputerId}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
