import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { login, fetchMe } from '@/api/auth';
import { useAuthStore } from '@/stores/auth-store';
import { Building2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);

  const [email, setEmail] = useState('admin@ehcm.local');
  const [password, setPassword] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const tokens = await login(email, password);
      setTokens(tokens.accessToken, tokens.refreshToken);
      const me = await fetchMe(tokens.accessToken);
      setUser(me);
    },
    onSuccess: () => navigate('/dashboard'),
    onError: () => toast.error('Invalid credentials. Please try again.'),
  });

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-info/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/25">
            <Building2 className="h-6 w-6" />
          </div>
          <span className=" text-sm font-semibold tracking-wide text-foreground">EHCM SUITE</span>
        </div>

        <Card className="w-full border-border/60 shadow-xl shadow-black/[0.04]">
          <CardHeader className="space-y-1.5 text-center">
            <CardTitle className=" text-xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your Enterprise HCM workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                mutation.mutate();
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-success" /> Protected by enterprise-grade security
        </p>
      </div>
    </div>
  );
}
