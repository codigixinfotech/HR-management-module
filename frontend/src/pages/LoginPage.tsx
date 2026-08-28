import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { login, register, fetchMe, changePassword } from '@/api/auth';
import { useAuthStore } from '@/stores/auth-store';
import {
  Building2,
  ShieldCheck,
  ArrowRight,
  Eye,
  EyeOff,
  Users,
  Wallet,
  CalendarCheck,
  Briefcase,
  Loader2,
  Sparkles,
  CheckCircle2,
  Lock,
  Mail,
  User,
  Layers,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const DEPARTMENTS = [
  'Human Resources',
  'IT & Engineering',
  'Finance & Payroll',
  'Operations & Logistics',
  'Sales & Marketing',
  'Executive Management',
];

const ROLES = [
  { value: 'SUPER_ADMIN', label: 'Super Admin (Full Access)' },
  { value: 'HR_MANAGER', label: 'HR Manager (HR Module)' },
  { value: 'HR_EXECUTIVE', label: 'HR Executive (HR Operations)' },
  { value: 'DEPARTMENT_MANAGER', label: 'Department Manager (Team Lead)' },
  { value: 'FINANCE_MANAGER', label: 'Finance Manager (Payroll & F&F)' },
  { value: 'IT_ADMIN', label: 'IT Admin (Assets & Access)' },
  { value: 'EMPLOYEE', label: 'Employee (Self Service)' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);

  // Tab State: 'signin' | 'signup'
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [isSuccessTransitioning, setIsSuccessTransitioning] = useState(false);

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Forgot password dialog
  const [forgotDialogOpen, setForgotDialogOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isResetSending, setIsResetSending] = useState(false);

  // First login password reset modal
  const [firstLoginModalOpen, setFirstLoginModalOpen] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmNewPasswordInput, setConfirmNewPasswordInput] = useState('');

  // Sign In form fields
  const [signInEmail, setSignInEmail] = useState('admin@ehcm.local');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up form fields
  const [signUpFullName, setSignUpFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpDepartment, setSignUpDepartment] = useState('Human Resources');
  const [signUpRole, setSignUpRole] = useState('EMPLOYEE');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');

  // First login password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (newPasswordInput !== confirmNewPasswordInput) {
        throw new Error('New passwords do not match');
      }
      if (newPasswordInput.length < 6) {
        throw new Error('New password must be at least 6 characters');
      }
      return changePassword(newPasswordInput);
    },
    onSuccess: () => {
      const user = useAuthStore.getState().user;
      if (user) {
        setUser({ ...user, mustResetPassword: false });
      }
      setFirstLoginModalOpen(false);
      setIsSuccessTransitioning(true);
      toast.success('Password updated successfully! Redirecting to Dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 600);
    },
    onError: (err: any) => {
      toast.error(err?.message || err?.response?.data?.message || 'Password update failed');
    },
  });

  // Sign In Mutation
  const signInMutation = useMutation({
    mutationFn: async () => {
      const tokens = await login(signInEmail, signInPassword);
      setTokens(tokens.accessToken, tokens.refreshToken);
      const me = await fetchMe(tokens.accessToken);
      setUser(me);
      return { me, mustResetPassword: tokens.mustResetPassword || me.mustResetPassword };
    },
    onSuccess: (res) => {
      if (res.mustResetPassword) {
        setFirstLoginModalOpen(true);
        toast.info('First-time login detected. Please update your temporary password.');
        return;
      }
      setIsSuccessTransitioning(true);
      toast.success(`Welcome back, ${res.me.email.split('@')[0]}! Redirecting...`);
      setTimeout(() => {
        navigate('/dashboard');
      }, 600);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Invalid credentials. Please try again.');
    },
  });

  // Sign Up Mutation
  const signUpMutation = useMutation({
    mutationFn: async () => {
      if (signUpPassword !== signUpConfirmPassword) {
        throw new Error('Passwords do not match');
      }
      if (signUpPassword.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const tokens = await register({
        fullName: signUpFullName,
        email: signUpEmail,
        password: signUpPassword,
        department: signUpDepartment,
        role: signUpRole,
      });

      setTokens(tokens.accessToken, tokens.refreshToken);
      const me = await fetchMe(tokens.accessToken);
      setUser(me);
      return me;
    },
    onSuccess: () => {
      setIsSuccessTransitioning(true);
      toast.success('Account created successfully! Welcome to EHCM.');
      setTimeout(() => {
        navigate('/dashboard');
      }, 600);
    },
    onError: (err: any) => {
      toast.error(err?.message || err?.response?.data?.message || 'Registration failed. Please check inputs.');
    },
  });

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setIsResetSending(true);
    setTimeout(() => {
      setIsResetSending(false);
      setForgotDialogOpen(false);
      toast.success(`Password reset instructions sent to ${forgotEmail}`);
      setForgotEmail('');
    }, 1000);
  };

  return (
    <div className={`relative min-h-screen w-full overflow-hidden bg-slate-50 transition-opacity duration-700 dark:bg-slate-950 ${isSuccessTransitioning ? 'opacity-0 scale-98 pointer-events-none' : 'opacity-100 scale-100'
      }`}>
      {/* ── Background Mesh & Glowing Orbs ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Animated Primary Mesh Orb Top Left */}
        <div className="absolute -left-20 -top-20 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-indigo-500/20 via-purple-500/15 to-transparent blur-3xl animate-gradient-bg" />

        {/* Secondary Orb Bottom Right */}
        <div className="absolute -bottom-32 -right-32 h-[550px] w-[550px] rounded-full bg-gradient-to-bl from-violet-600/20 via-indigo-400/10 to-transparent blur-3xl animate-particle-drift" />

        {/* Ambient Center Glow */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[700px] rounded-full bg-primary/5 blur-[140px]" />

        {/* Animated Particles */}
        <div className="absolute left-1/6 top-1/4 h-3 w-3 rounded-full bg-indigo-400/40 animate-particle-drift" style={{ animationDelay: '0s' }} />
        <div className="absolute left-1/3 top-3/4 h-2 w-2 rounded-full bg-purple-400/40 animate-particle-drift" style={{ animationDelay: '2s' }} />
        <div className="absolute right-1/4 top-1/3 h-4 w-4 rounded-full bg-violet-400/30 animate-particle-drift" style={{ animationDelay: '4s' }} />
        <div className="absolute right-1/3 bottom-1/4 h-2.5 w-2.5 rounded-full bg-primary/40 animate-particle-drift" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* ── Main Centered Container ── */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="flex w-full max-w-md flex-col items-center gap-6">

          {/* Top EHCM Brand Badge Header */}
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-indigo-600 to-violet-700 text-white shadow-xl shadow-primary/30 ring-4 ring-primary/10 animate-bounce-slow">
              <Building2 className="h-6 w-6" />
            </div>
            <span className="text-sm font-extrabold tracking-widest text-slate-800 dark:text-slate-100 uppercase">
              EHCM SUITE
            </span>
          </div>

          {/* Premium Glass Card */}
          <div className="glass-card-premium w-full rounded-3xl p-6 sm:p-8 transition-all duration-300">

            {/* Card Header & Tab Switcher */}
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {activeTab === 'signin' ? 'Welcome back' : 'Create Enterprise Account'}
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 bg-red-500">
                  {activeTab === 'signin'
                    ? 'Sign in to access your EHCM workspace'
                    : 'Join your organization workspace with assigned RBAC'}
                </p>
              </div>

              {/* ── Segmented Sliding Tab Bar ── */}
              <div className="relative flex rounded-2xl bg-slate-100 dark:bg-slate-900/80 p-1 border border-slate-200/60 dark:border-slate-800">
                {/* Sliding Pill Indicator */}
                <div
                  className="absolute top-1 bottom-1 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200/50 dark:border-slate-700 transition-all duration-300 ease-out"
                  style={{
                    left: activeTab === 'signin' ? '4px' : 'calc(50% + 2px)',
                    width: 'calc(50% - 6px)',
                  }}
                />

                {/* Sign In Tab */}
                <button
                  type="button"
                  onClick={() => setActiveTab('signin')}
                  className={`relative z-10 flex-1 py-2 text-xs font-semibold transition-colors cursor-pointer ${activeTab === 'signin'
                      ? 'text-primary dark:text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                    }`}
                >
                  Sign In
                </button>

                {/* Sign Up Tab */}
                <button
                  type="button"
                  onClick={() => setActiveTab('signup')}
                  className={`relative z-10 flex-1 py-2 text-xs font-semibold transition-colors cursor-pointer ${activeTab === 'signup'
                      ? 'text-primary dark:text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                    }`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            {/* ── Form Container with Transition ── */}
            <div className="mt-6">

              {/* ════════════════════════════════════════════════════════ */}
              {/* SIGN IN FORM */}
              {/* ════════════════════════════════════════════════════════ */}
              {activeTab === 'signin' && (
                <form
                  className="space-y-4 animate-in fade-in-50 duration-300"
                  onSubmit={(e) => {
                    e.preventDefault();
                    signInMutation.mutate();
                  }}
                >
                  {/* Email Input */}
                  <div className="space-y-1.5">
                    <Label htmlFor="signin-email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Work Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="admin@ehcm.local"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        className="h-10 pl-9 text-xs font-medium bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="signin-password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Password
                      </Label>
                      <button
                        type="button"
                        onClick={() => setForgotDialogOpen(true)}
                        className="text-[11px] font-semibold text-primary hover:underline hover:text-primary/80 transition-colors cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        id="signin-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        className="h-10 pl-9 pr-10 text-xs font-medium bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-10 mt-2 text-xs font-bold gap-2 rounded-xl bg-gradient-to-r from-primary via-indigo-600 to-violet-600 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer"
                    disabled={signInMutation.isPending}
                  >
                    {signInMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                        <span>Signing in to Workspace...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              )}

              {/* ════════════════════════════════════════════════════════ */}
              {/* SIGN UP FORM */}
              {/* ════════════════════════════════════════════════════════ */}
              {activeTab === 'signup' && (
                <form
                  className="space-y-3 animate-in fade-in-50 slide-in-from-right-4 duration-300"
                  onSubmit={(e) => {
                    e.preventDefault();
                    signUpMutation.mutate();
                  }}
                >
                  {/* Full Name */}
                  <div className="space-y-1">
                    <Label htmlFor="signup-fullname" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        id="signup-fullname"
                        type="text"
                        placeholder="Alex Morgan"
                        value={signUpFullName}
                        onChange={(e) => setSignUpFullName(e.target.value)}
                        className="h-9.5 pl-9 text-xs font-medium bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <Label htmlFor="signup-email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Work Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="alex.morgan@ehcm.local"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        className="h-9.5 pl-9 text-xs font-medium bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  {/* Department & Role Dropdowns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Department */}
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Layers className="h-3 w-3 text-primary" /> Department
                      </Label>
                      <Select value={signUpDepartment} onValueChange={setSignUpDepartment}>
                        <SelectTrigger className="h-9.5 text-xs bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 rounded-xl">
                          <SelectValue placeholder="Select dept" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                          {DEPARTMENTS.map((dept) => (
                            <SelectItem key={dept} value={dept} className="text-xs">
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Role (RBAC) */}
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Shield className="h-3 w-3 text-primary" /> Assigned Role
                      </Label>
                      <Select value={signUpRole} onValueChange={setSignUpRole}>
                        <SelectTrigger className="h-9.5 text-xs bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 rounded-xl">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                          {ROLES.map((role) => (
                            <SelectItem key={role.value} value={role.value} className="text-xs">
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <Label htmlFor="signup-password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="At least 6 characters"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        className="h-9.5 pl-9 pr-10 text-xs font-medium bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1">
                    <Label htmlFor="signup-confirm" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        id="signup-confirm"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Re-enter password"
                        value={signUpConfirmPassword}
                        onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                        className="h-9.5 pl-9 pr-10 text-xs font-medium bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-10 mt-3 text-xs font-bold gap-2 rounded-xl bg-gradient-to-r from-primary via-indigo-600 to-violet-600 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer"
                    disabled={signUpMutation.isPending}
                  >
                    {signUpMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>

            {/* Bottom Enterprise Security Note */}
            <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Protected by end-to-end enterprise encryption</span>
            </div>

          </div>
        </div>
      </div>

      {/* ── Forgot Password Dialog ── */}
      <Dialog open={forgotDialogOpen} onOpenChange={setForgotDialogOpen}>
        <DialogContent className="max-w-sm rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" /> Reset Password
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Enter your work email address and we will send you instructions to reset your password.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="forgot-email" className="text-xs font-semibold">
                Work Email Address
              </Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="name@ehcm.local"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="h-9 text-xs rounded-xl"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setForgotDialogOpen(false)}
                className="h-9 text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isResetSending}
                className="h-9 text-xs font-semibold rounded-xl bg-primary text-primary-foreground gap-1.5 cursor-pointer"
              >
                {isResetSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {isResetSending ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── First-Time Login Password Change Dialog ── */}
      <Dialog open={firstLoginModalOpen} onOpenChange={setFirstLoginModalOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <ShieldCheck className="h-5 w-5 text-primary" /> First-Time Login Security Setup
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Welcome! As this is your first login, please update your temporary password to a secure personal password.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              changePasswordMutation.mutate();
            }}
            className="space-y-4 pt-2"
          >
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">New Password</Label>
              <Input
                type="password"
                placeholder="At least 6 characters"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                className="h-9.5 text-xs rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Confirm New Password</Label>
              <Input
                type="password"
                placeholder="Re-enter new password"
                value={confirmNewPasswordInput}
                onChange={(e) => setConfirmNewPasswordInput(e.target.value)}
                className="h-9.5 text-xs rounded-xl"
                required
              />
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">
              ⚠️ <strong>Password Security:</strong> Choose a strong password. This will update your temporary login credentials permanently.
            </div>

            <Button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="w-full h-10 text-xs font-bold gap-2 rounded-xl bg-gradient-to-r from-primary via-indigo-600 to-violet-600 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all cursor-pointer"
            >
              {changePasswordMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <ShieldCheck className="h-4 w-4" />}
              {changePasswordMutation.isPending ? 'Updating Password...' : 'Save New Password & Continue'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
