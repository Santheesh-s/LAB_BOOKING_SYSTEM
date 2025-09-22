import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, GraduationCap, Mail, ArrowLeft, Shield } from 'lucide-react';

interface LoginForm {
  email: string;
  password: string;
}

interface ForgotPasswordForm {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export default function Login() {
  const [form, setForm] = useState<LoginForm>({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [forgotForm, setForgotForm] = useState<ForgotPasswordForm>({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        navigate('/dashboard');
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!forgotForm.email) {
      setForgotError('Please enter your email address');
      return;
    }

    setForgotLoading(true);
    setForgotError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotForm.email }),
      });

      const result = await response.json();

      if (result.success) {
        setOtpSent(true);
        setForgotPasswordStep('otp');
        setForgotSuccess('OTP sent to your email. Please check your inbox.');
      } else {
        setForgotError(result.message || 'Failed to send OTP');
      }
    } catch (err) {
      setForgotError('Network error. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!forgotForm.otp) {
      setForgotError('Please enter the OTP');
      return;
    }

    setForgotLoading(true);
    setForgotError('');

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotForm.email,
          otp: forgotForm.otp
        }),
      });

      const result = await response.json();

      if (result.success) {
        setForgotPasswordStep('reset');
        setForgotSuccess('OTP verified. Please enter your new password.');
      } else {
        setForgotError(result.message || 'Invalid OTP');
      }
    } catch (err) {
      setForgotError('Network error. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!forgotForm.newPassword || !forgotForm.confirmPassword) {
      setForgotError('Please fill in all fields');
      return;
    }

    if (forgotForm.newPassword !== forgotForm.confirmPassword) {
      setForgotError('Passwords do not match');
      return;
    }

    if (forgotForm.newPassword.length < 6) {
      setForgotError('Password must be at least 6 characters long');
      return;
    }

    setForgotLoading(true);
    setForgotError('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotForm.email,
          otp: forgotForm.otp,
          newPassword: forgotForm.newPassword
        }),
      });

      const result = await response.json();

      if (result.success) {
        setForgotSuccess('Password reset successfully. You can now login with your new password.');
        setTimeout(() => {
          setShowForgotPassword(false);
          setForgotPasswordStep('email');
          setForgotForm({ email: '', otp: '', newPassword: '', confirmPassword: '' });
          setOtpSent(false);
          setForgotSuccess('');
          setForgotError('');
        }, 2000);
      } else {
        setForgotError(result.message || 'Failed to reset password');
      }
    } catch (err) {
      setForgotError('Network error. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const resetForgotPassword = () => {
    setForgotPasswordStep('email');
    setForgotForm({ email: '', otp: '', newPassword: '', confirmPassword: '' });
    setOtpSent(false);
    setForgotSuccess('');
    setForgotError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Lab Booking System</CardTitle>
            <CardDescription className="text-base">
              Sign in to manage your lab reservations
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert className="border-destructive/50 bg-destructive/10">
                <AlertDescription className="text-destructive">{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="h-11"
              />
            </div>
            
            <Button type="submit" disabled={loading} className="w-full h-11 text-base">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            <div className="text-center">
              <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
                <DialogTrigger asChild>
                  <Button variant="link" className="text-sm text-muted-foreground hover:text-primary">
                    Forgot Password?
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Reset Password
                    </DialogTitle>
                    <DialogDescription>
                      {forgotPasswordStep === 'email' && 'Enter your email to receive an OTP'}
                      {forgotPasswordStep === 'otp' && 'Enter the OTP sent to your email'}
                      {forgotPasswordStep === 'reset' && 'Create your new password'}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    {forgotError && (
                      <Alert className="border-destructive/50 bg-destructive/10">
                        <AlertDescription className="text-destructive">{forgotError}</AlertDescription>
                      </Alert>
                    )}

                    {forgotSuccess && (
                      <Alert className="border-green-500/50 bg-green-50">
                        <AlertDescription className="text-green-700">{forgotSuccess}</AlertDescription>
                      </Alert>
                    )}

                    {forgotPasswordStep === 'email' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="forgot-email">Email Address</Label>
                          <Input
                            id="forgot-email"
                            type="email"
                            placeholder="Enter your registered email"
                            value={forgotForm.email}
                            onChange={(e) => setForgotForm({ ...forgotForm, email: e.target.value })}
                            required
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={handleSendOTP}
                            disabled={forgotLoading}
                            className="flex-1"
                          >
                            {forgotLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Mail className="w-4 h-4 mr-2" />
                                Send OTP
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowForgotPassword(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </>
                    )}

                    {forgotPasswordStep === 'otp' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="otp">Enter OTP</Label>
                          <Input
                            id="otp"
                            type="text"
                            placeholder="Enter 6-digit OTP"
                            value={forgotForm.otp}
                            onChange={(e) => setForgotForm({ ...forgotForm, otp: e.target.value })}
                            maxLength={6}
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            OTP sent to {forgotForm.email}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={handleVerifyOTP}
                            disabled={forgotLoading}
                            className="flex-1"
                          >
                            {forgotLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Verifying...
                              </>
                            ) : (
                              'Verify OTP'
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={resetForgotPassword}
                          >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                          </Button>
                        </div>

                        <Button
                          variant="link"
                          onClick={handleSendOTP}
                          className="w-full text-sm"
                          disabled={forgotLoading}
                        >
                          Resend OTP
                        </Button>
                      </>
                    )}

                    {forgotPasswordStep === 'reset' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="new-password">New Password</Label>
                          <Input
                            id="new-password"
                            type="password"
                            placeholder="Enter new password"
                            value={forgotForm.newPassword}
                            onChange={(e) => setForgotForm({ ...forgotForm, newPassword: e.target.value })}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirm-password">Confirm Password</Label>
                          <Input
                            id="confirm-password"
                            type="password"
                            placeholder="Confirm new password"
                            value={forgotForm.confirmPassword}
                            onChange={(e) => setForgotForm({ ...forgotForm, confirmPassword: e.target.value })}
                            required
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={handleResetPassword}
                            disabled={forgotLoading}
                            className="flex-1"
                          >
                            {forgotLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Resetting...
                              </>
                            ) : (
                              'Reset Password'
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={resetForgotPassword}
                          >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
