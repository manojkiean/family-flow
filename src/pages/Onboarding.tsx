import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Users, ArrowRight, Loader2, Home } from 'lucide-react';

const Onboarding = ({ onComplete }: { onComplete: () => void }) => {
  const { user } = useAuth();
  const [familyName, setFamilyName] = useState('');
  const [yourName, setYourName] = useState('');
  const [saving, setSaving] = useState(false);

  // Derive a display name from email as fallback
  const emailName = user?.email?.split('@')[0] ?? '';

  const handleGetStarted = async () => {
    if (!familyName.trim()) {
      toast({ title: 'Family name required', description: 'Please enter your family name.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      if (!user) throw new Error('Not authenticated');

      const parentName = yourName.trim() || emailName;
      const pendingAuthPassword = sessionStorage.getItem('pendingAuthPassword') || '';

      // 1. Create the family hub
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .insert({
          name: familyName.trim(),
          owner_id: user.id,
        })
        .select()
        .single();

      if (familyError) throw new Error(`Family creation failed: ${familyError.message}`);

      // 2. Create the parent member record using the signed-in user's data
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          family_id: familyData.id,
          name: parentName,
          role: 'parent',
          user_id: user.id,
          color: 'hsl(210 60% 50%)',
          pin: Math.floor(1000 + Math.random() * 9000).toString(),
          // email excluded here — the Family page handles email-based invites
        });

      if (memberError) throw new Error(`Member setup failed: ${memberError.message}`);

      // 3. Create/update the profile linked to that family (include signup email)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          name: parentName,
          family_name: familyName.trim(),
          family_id: familyData.id,
          email: user.email,  // reuse signup email
          auth_password: pendingAuthPassword,
          family_password: 'family123',
        });

      if (profileError) throw new Error(`Profile setup failed: ${profileError.message}`);

      sessionStorage.removeItem('pendingAuthPassword');

      localStorage.removeItem('activeMemberId');
      toast({ title: `Welcome, ${parentName}! 🎉`, description: `${familyName} Family Hub is ready.` });
      onComplete();
    } catch (err: any) {
      console.error('Onboarding error:', err);
      toast({
        title: 'Setup Error',
        description: err.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">

        {/* Logo / Icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-4 bg-primary/10 flex items-center justify-center shadow-soft">
            <img src="/favicon.png" alt="Family Board" className="w-full h-full object-cover" />
          </div>
          <h1 className="font-display font-bold text-3xl">Create Your Family Hub</h1>
          <p className="text-muted-foreground mt-2">
            You're signing in as <span className="text-primary font-medium">{user?.email}</span>
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            You'll be set up as the <span className="font-medium text-foreground">Parent</span> of this family.
          </p>
        </div>

        {/* Form */}
        <div className="bg-card rounded-2xl border border-border/50 p-6 space-y-5">

          {/* Your Name */}
          <div className="space-y-2">
            <Label htmlFor="yourName">Your Name</Label>
            <Input
              id="yourName"
              placeholder={emailName || 'e.g. Sarah'}
              value={yourName}
              onChange={(e) => setYourName(e.target.value)}
              className="text-base"
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to use <span className="font-medium">{emailName}</span>
            </p>
          </div>

          {/* Family Name */}
          <div className="space-y-2">
            <Label htmlFor="familyName">Family Name</Label>
            <div className="relative">
              <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="familyName"
                placeholder="e.g. The Johnsons"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                className="pl-9 text-base"
                onKeyDown={(e) => e.key === 'Enter' && handleGetStarted()}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              You can add more family members later from the dashboard.
            </p>
          </div>

          {/* Submit */}
          <Button
            className="w-full gradient-warm shadow-soft h-12 text-base"
            onClick={handleGetStarted}
            disabled={saving || !familyName.trim()}
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <ArrowRight className="h-5 w-5 mr-2" />
            )}
            {saving ? 'Setting up…' : 'Go to Dashboard'}
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          You can invite other family members from the <span className="font-medium">Family</span> page.
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
