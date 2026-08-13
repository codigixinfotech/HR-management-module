import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { login, fetchMe, fetchDemoAccounts, type DemoAccountInfo } from '@/api/auth';
import { useAuthStore } from '@/stores/auth-store';
import { Building2, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const COMPACT_ROLES = [
  {
    roleName: 'SUPER_ADMIN',
    displayName: 'Admin',
    accessLabel: 'Full Access',
    email: 'admin@ehcm.local',
    password: 'Admin@123',
  },
  {
    roleName: 'HR_MANAGER',
    displayName: 'HR Manager',
    accessLabel: 'HR Module',
    email: 'hr.manager@ehcm.local',
    password: 'Hr@123',
  },
  {
    roleName: 'HR_EXECUTIVE',
    displayName: 'HR Executive',
    accessLabel: 'HR Operations',
    email: 'hr.executive@ehcm.local',
    password: 'HrExec@123',
  },
  {
    roleName: 'DEPARTMENT_MANAGER',
    displayName: 'Dept Manager',
    accessLabel: 'Team Management',
    email: 'manager@ehcm.local',
    password: 'Manager@123',
  },
  {
    roleName: 'FINANCE_MANAGER',
    displayName: 'Finance Manager',
    accessLabel: 'Payroll & F&F',
    email: 'finance@ehcm.local',
    password: 'Finance@123',
  },
  {
    roleName: 'IT_ADMIN',
    displayName: 'IT Admin',
    accessLabel: 'IT & Assets',
    email: 'it.admin@ehcm.local',
    password: 'ITAdmin@123',
  },
  {
    roleName: 'EMPLOYEE',
    displayName: 'Employee',
    accessLabel: 'Self Service',
    email: 'employee@ehcm.local',
    password: 'Employee@123',
  },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);

  const [email, setEmail] = useState('admin@ehcm.local');
  const [password, setPassword] = useState('');
  const [activeRoleName, setActiveRoleName] = useState<string | null>(null);

  // Fetch demo accounts from backend API if available
  useQuery({
    queryKey: ['demo-accounts'],
    queryFn: fetchDemoAccounts,
  });

  const mutation = useMutation({
    mutationFn: async (credentials?: { emailStr: string; passStr: string; roleLabel?: string }) => {
      const loginEmail = credentials?.emailStr || email;
      const loginPassword = credentials?.passStr || password;

      const tokens = await login(loginEmail, loginPassword);
      setTokens(tokens.accessToken, tokens.refreshToken);

      const me = await fetchMe(tokens.accessToken);
      setUser(me);
      return credentials?.roleLabel || 'User';
    },
    onSuccess: (roleLabel) => {
      toast.success(`Authenticated successfully as ${roleLabel}!`);
      navigate('/dashboard');
    },
    onError: () => toast.error('Invalid credentials. Please verify your demo credentials.'),
  });

  const handleDemoQuickLogin = (acc: { email: string; password: string; displayName: string }) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setActiveRoleName(acc.displayName);

    mutation.mutate({
      emailStr: acc.email,
      passStr: acc.password,
      roleLabel: acc.displayName,
    });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4 py-8">
      {/* Background Orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-info/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-xl flex-col items-center gap-6">
        {/* Workspace Brand Header */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/25">
            <Building2 className="h-6 w-6" />
          </div>
          <span className="text-sm font-semibold tracking-wider text-foreground uppercase">EHCM SUITE</span>
        </div>

        {/* Center Login Form Card */}
        <Card className="w-full max-w-sm border-border/60 shadow-xl shadow-black/[0.04]">
          <CardHeader className="space-y-1.5 text-center">
            <CardTitle className="text-xl font-bold">Welcome back</CardTitle>
            <CardDescription className="text-xs">Sign in to your Enterprise HCM workspace</CardDescription>
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
                <Label htmlFor="email" className="text-xs font-semibold">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@ehcm.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-9 text-xs font-mono"
                  required
                />
              </div>

              <Button type="submit" className="w-full h-9 text-xs font-semibold gap-1.5" disabled={mutation.isPending}>
                {mutation.isPending ? 'Signing in...' : 'Sign in'}
                {!mutation.isPending && <ArrowRight className="h-3.5 w-3.5" />}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ── Ultra-Compact Role Quick Access Section ── */}
        <div className="w-full space-y-3 pt-1">
          <div className="flex flex-col items-center justify-center text-center space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" /> Demo Quick Access
            </div>
            <p className="text-[11px] text-muted-foreground">
              Select any role below to test backend RBAC permissions
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {COMPACT_ROLES.map((acc) => {
              const isSelected = activeRoleName === acc.displayName;

              return (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleDemoQuickLogin(acc)}
                  disabled={mutation.isPending}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border bg-card transition-all text-center group shadow-2xs ${
                    isSelected
                      ? 'border-primary ring-1 ring-primary/30 bg-primary/5'
                      : 'border-border/80 hover:bg-muted/40 hover:border-primary/50'
                  }`}
                >
                  <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                    {acc.displayName}
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                    {acc.accessLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Security Footer */}
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Protected by enterprise-grade security
        </p>
      </div>
    </div>
  );
}
