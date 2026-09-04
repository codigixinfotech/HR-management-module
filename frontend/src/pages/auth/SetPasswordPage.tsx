import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { validateInvitation, setPasswordWithToken, type ValidateInvitationResponse } from '@/api/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ShieldCheck,
  Building,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Loader2,
  Check,
} from 'lucide-react';

export default function SetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [isLoading, setIsLoading] = useState(true);
  const [validationData, setValidationData] = useState<ValidateInvitationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setErrorMessage('Missing invitation token in the link.');
      return;
    }

    let isMounted = true;
    validateInvitation(token)
      .then((res) => {
        if (!isMounted) return;
        setValidationData(res);
        if (!res.valid) {
          setErrorMessage(res.message || 'Invalid or expired invitation link.');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setErrorMessage(
          err?.response?.data?.message || 'Invalid invitation link or network error.'
        );
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Password requirements calculation
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isFormValid = hasMinLength && hasUpper && hasLower && hasNumber && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      toast.error('Please meet all password requirements before proceeding.');
      return;
    }

    setIsSubmitting(true);
    try {
      await setPasswordWithToken({
        token,
        newPassword: password,
      });

      setIsSuccess(true);
      toast.success('Password created successfully! Your company account is now active.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to set password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md shadow-2xl border-white/10 bg-card/95 backdrop-blur-md relative z-10 overflow-hidden">
        {/* Brand header banner */}
        <div className="p-6 pb-4 text-center border-b bg-muted/30">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3 shadow-inner">
            <Building className="h-6 w-6" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm font-bold tracking-wider uppercase text-primary">
              EHCM SUITE
            </span>
            <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
              Enterprise
            </Badge>
          </div>
          <h2 className="text-xl font-bold text-foreground mt-2">
            Set Your Password
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Complete your account setup and activate your ERP portal
          </p>
        </div>

        <CardContent className="p-6">
          {/* STATE 1: LOADING */}
          {isLoading && (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
              <p className="text-xs text-muted-foreground">Validating your invitation token...</p>
            </div>
          )}

          {/* STATE 2: SUCCESS ACTIVATION */}
          {!isLoading && isSuccess && (
            <div className="py-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-500/20">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Password Created Successfully
                </h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                  Your corporate account for <strong className="text-foreground">{validationData?.company || 'your organization'}</strong> is now fully active.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-left text-xs text-emerald-800 dark:text-emerald-300">
                <p className="font-semibold">Account Details:</p>
                <p className="mt-1 font-mono text-[11px]">Email: {validationData?.email || emailParam}</p>
                <p className="font-mono text-[11px]">Role: {validationData?.role || 'COMPANY_ADMIN'}</p>
              </div>

              <Button
                onClick={() => navigate('/login')}
                className="w-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-10"
              >
                Go to ERP Login <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* STATE 3: ERROR / EXPIRED / ALREADY USED */}
          {!isLoading && !isSuccess && errorMessage && (
            <div className="py-6 text-center space-y-4 animate-in fade-in duration-200">
              <div className="h-12 w-12 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto border border-rose-500/20">
                {validationData?.status === 'USED' ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-rose-600" />
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-foreground">
                  {validationData?.status === 'USED'
                    ? 'Invitation Already Used'
                    : validationData?.status === 'EXPIRED'
                    ? 'Invitation Link Expired'
                    : 'Invalid Invitation Link'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed max-w-xs mx-auto">
                  {validationData?.status === 'USED'
                    ? 'This password setup link has already been used. You can proceed directly to sign in with your credentials.'
                    : errorMessage}
                </p>
              </div>

              <Button
                onClick={() => navigate('/login')}
                className="w-full text-xs font-semibold h-9"
              >
                Go to Login
              </Button>
            </div>
          )}

          {/* STATE 4: ACTIVE SET PASSWORD FORM */}
          {!isLoading && !isSuccess && !errorMessage && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Organization chip */}
              {validationData?.company && (
                <div className="p-3 rounded-lg border bg-muted/40 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                      Organization
                    </span>
                    <span className="font-semibold text-foreground">
                      {validationData.company}{' '}
                      {validationData.companyCode && `(${validationData.companyCode})`}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                    {validationData.role || 'COMPANY_ADMIN'}
                  </Badge>
                </div>
              )}

              {/* Email (Read-only) */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Login Email</Label>
                <Input
                  readOnly
                  value={validationData?.email || emailParam}
                  className="h-9 text-xs font-mono bg-muted/50 cursor-not-allowed text-muted-foreground"
                />
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold">New Password *</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your new password"
                    className="h-9 text-xs pr-9 font-mono"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Confirm Password *</Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="h-9 text-xs pr-9 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Requirements checklist */}
              <div className="p-3 rounded-lg border bg-muted/20 space-y-1.5 text-[11px]">
                <span className="font-semibold text-muted-foreground block text-[10px] uppercase tracking-wider">
                  Password Requirements:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <div
                    className={`flex items-center gap-1.5 ${
                      hasMinLength ? 'text-emerald-600 font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    <div
                      className={`h-3.5 w-3.5 rounded-full flex items-center justify-center ${
                        hasMinLength ? 'bg-emerald-500/20 text-emerald-600' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </div>
                    <span>8+ characters</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 ${
                      hasUpper ? 'text-emerald-600 font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    <div
                      className={`h-3.5 w-3.5 rounded-full flex items-center justify-center ${
                        hasUpper ? 'bg-emerald-500/20 text-emerald-600' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </div>
                    <span>Uppercase (A-Z)</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 ${
                      hasLower ? 'text-emerald-600 font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    <div
                      className={`h-3.5 w-3.5 rounded-full flex items-center justify-center ${
                        hasLower ? 'bg-emerald-500/20 text-emerald-600' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </div>
                    <span>Lowercase (a-z)</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 ${
                      hasNumber ? 'text-emerald-600 font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    <div
                      className={`h-3.5 w-3.5 rounded-full flex items-center justify-center ${
                        hasNumber ? 'bg-emerald-500/20 text-emerald-600' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </div>
                    <span>Number (0-9)</span>
                  </div>

                  <div
                    className={`col-span-2 flex items-center gap-1.5 pt-0.5 ${
                      passwordsMatch ? 'text-emerald-600 font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    <div
                      className={`h-3.5 w-3.5 rounded-full flex items-center justify-center ${
                        passwordsMatch ? 'bg-emerald-500/20 text-emerald-600' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </div>
                    <span>Passwords match</span>
                  </div>
                </div>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="w-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white h-10 gap-2 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Activating Account...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    Set Password & Activate
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
