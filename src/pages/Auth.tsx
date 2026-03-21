import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Users, Loader2, Mail, Lock, Eye, EyeOff, Star, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

type AuthMode = 'login' | 'signup' | 'reset' | 'child';

const Auth = ({ initialMode = 'login' }: { initialMode?: AuthMode }) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Child login state
  const [childEmail, setChildEmail] = useState('');
  const [childPin, setChildPin] = useState(['', '', '', '']);
  const pinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Detect if we are in a password recovery flow from the URL
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && (hash.includes('type=recovery') || hash.includes('type=invite'))) {
      setMode('reset');
    }
  }, []);

  // Handle PIN digit input
  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // only digits
    const single = value.slice(-1); // take last char if paste
    const updated = [...childPin];
    updated[index] = single;
    setChildPin(updated);
    if (single && index < 3) {
      pinRefs[index + 1].current?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !childPin[index] && index > 0) {
      pinRefs[index - 1].current?.focus();
    }
  };

  const handlePinPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (text.length === 4) {
      setChildPin(text.split(''));
      pinRefs[3].current?.focus();
    }
    e.preventDefault();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'reset') {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        toast({ title: 'Password Updated!', description: 'Welcome home!' });
        window.location.href = window.location.origin;

      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Clear any leftover child session flags from a previous child PIN login
        localStorage.removeItem('isChildLogin');
        localStorage.removeItem('activeMemberId');
        localStorage.removeItem('childLoginEmail');

      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        // Clear any leftover child session flags
        localStorage.removeItem('isChildLogin');
        localStorage.removeItem('activeMemberId');
        localStorage.removeItem('childLoginEmail');
        if (data.session) {
          toast({ title: 'Welcome!', description: 'Your account has been created.' });
        } else {
          toast({
            title: 'Verify your email',
            description: 'We sent a link to your inbox. Please click it to continue.',
            duration: 10000
          });
        }

      } else if (mode === 'child') {
        const pinString = childPin.join('');
        if (pinString.length < 4) {
          toast({ title: 'PIN required', description: 'Please enter all 4 digits of your PIN.', variant: 'destructive' });
          setLoading(false);
          return;
        }
        if (!childEmail.trim()) {
          toast({ title: 'Email required', description: 'Please enter your email address.', variant: 'destructive' });
          setLoading(false);
          return;
        }
        // Call the DB function to look up auth credentials from email + PIN
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any).rpc('verify_child_login', {
          p_member_email: childEmail.trim(),
          p_pin: pinString,
        });

        if (error) throw error;

        const rows = data as Array<{ auth_email: string; auth_password: string }> | null;
        if (!rows || rows.length === 0) {
          throw new Error('Incorrect email or PIN. Please check with your parent.');
        }

        const { auth_email, auth_password } = rows[0];
        // Store child email so the app auto-selects this child's profile on load
        localStorage.setItem('childLoginEmail', childEmail.trim());
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: auth_email,
          password: auth_password,
        });
        if (signInError) throw signInError;
        toast({ title: 'Welcome back! 👋', description: 'You are now logged in.' });
      }
    } catch (err: any) {
      toast({
        title: 'Login failed',
        description: err.message || 'Something went wrong.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast({ title: 'Email required', description: 'Please enter your email to reset your password.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      toast({ title: 'Email sent!', description: 'Check your inbox for the password reset link.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const pinComplete = childPin.every(d => d !== '');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">

        {/* Logo */}
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-4 bg-muted shadow-soft">
            <img src="/favicon.png" alt="Family Board" className="w-full h-full object-cover" />
          </div>
          <h1 className="font-display font-bold text-3xl">Family Board</h1>
          <p className="text-muted-foreground mt-1">
            {mode === 'reset'  ? 'Set your new secure password' :
             mode === 'child'  ? 'Child login — enter your PIN' :
             mode === 'login'  ? 'Sign in to access your family hub' :
                                 'Create an account for your family'}
          </p>
        </div>

        {/* Tab switcher: Login vs Child */}
        {mode !== 'reset' && (
          <div className="flex gap-1 bg-muted/60 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={cn(
                'flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                mode === 'login' || mode === 'signup'
                  ? 'bg-card shadow-soft text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Parent / Adult
            </button>
            <button
              type="button"
              onClick={() => setMode('child')}
              className={cn(
                'flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5',
                mode === 'child'
                  ? 'bg-card shadow-soft text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Star className="h-3.5 w-3.5" />
              Child Login
            </button>
          </div>
        )}

        {/* ─── CHILD PIN FORM ─── */}
        {mode === 'child' && (
          <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border/50 p-6 space-y-5">
            <div className="text-center space-y-1 pb-1">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Star className="h-7 w-7 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Enter your email and the PIN your parent gave you.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="child-email">Your Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="child-email"
                  type="email"
                  placeholder="name@example.com"
                  value={childEmail}
                  onChange={(e) => setChildEmail(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Your 4-Digit PIN</Label>
              <div className="flex gap-3 justify-center" onPaste={handlePinPaste}>
                {childPin.map((digit, i) => (
                  <input
                    key={i}
                    ref={pinRefs[i]}
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(i, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(i, e)}
                    className={cn(
                      'w-14 h-14 text-center text-2xl font-bold rounded-xl border-2 bg-muted/50 outline-none transition-all duration-200',
                      digit
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border focus:border-primary'
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Don't know your PIN? Ask a parent to check{' '}
                <span className="font-medium text-foreground">Family → Member card</span>.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full gradient-warm shadow-soft"
              disabled={loading || !pinComplete || !childEmail.trim()}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Enter Family Hub
            </Button>
          </form>
        )}

        {/* ─── PARENT / ADULT FORM ─── */}
        {mode !== 'child' && (
          <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border/50 p-6 space-y-4">
            {mode !== 'reset' && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{mode === 'reset' ? 'New Password' : 'Password'}</Label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-10"
                  minLength={6}
                  required={!loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full gradient-warm shadow-soft" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {mode === 'reset'  ? 'Update Password' :
               mode === 'login'  ? 'Sign In' : 'Sign Up'}
            </Button>
          </form>
        )}

        {/* Toggle sign in / sign up */}
        {(mode === 'login' || mode === 'signup') && (
          <p className="text-center text-sm text-muted-foreground">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-primary font-medium hover:underline"
            >
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default Auth;
