import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamilyMembers } from '@/hooks/useDatabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Users, ArrowRight, Plus, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const avatarOptions = ['👨', '👩', '👦', '👧', '👶', '🧑', '👴', '👵'];
const roleOptions = [
  { value: 'parent', label: 'Parent', emoji: '👨‍👩‍👧' },
  { value: 'child', label: 'Child', emoji: '🧒' },
] as const;

interface MemberDraft {
  name: string;
  avatar: string;
  role: 'parent' | 'child';
}

const Onboarding = ({ onComplete }: { onComplete: () => void }) => {
  const { addMember } = useFamilyMembers();
  const [step, setStep] = useState<'welcome' | 'members'>('welcome');
  const [familyName, setFamilyName] = useState('');
  const [members, setMembers] = useState<MemberDraft[]>([
    { name: '', avatar: '👨', role: 'parent' },
  ]);
  const [saving, setSaving] = useState(false);

  const addMemberDraft = () => {
    setMembers(prev => [...prev, { name: '', avatar: '👩', role: 'parent' }]);
  };

  const removeMemberDraft = (index: number) => {
    if (members.length <= 1) return;
    setMembers(prev => prev.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, updates: Partial<MemberDraft>) => {
    setMembers(prev => prev.map((m, i) => i === index ? { ...m, ...updates } : m));
  };

  const hasParent = members.some(m => m.role === 'parent' && m.name.trim());
  const allNamed = members.every(m => m.name.trim());

  const handleFinish = async () => {
    if (!allNamed || !hasParent) {
      toast({ title: 'Missing info', description: 'Add at least one parent with a name.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      for (const member of members) {
        await addMember({
          name: member.name.trim(),
          avatar: member.avatar,
          role: member.role,
          color: member.role === 'parent' ? 'hsl(210 60% 50%)' : 'hsl(340 70% 60%)',
        });
      }
      localStorage.removeItem('activeMemberId');
      toast({ title: 'Welcome!', description: `${familyName || 'Your'} family is all set up! 🎉` });
      onComplete();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to save family members.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {step === 'welcome' && (
          <div className="text-center space-y-8 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Users className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="font-display font-bold text-3xl mb-2">Welcome to FamilyHub</h1>
              <p className="text-muted-foreground text-lg">Let's set up your family to get started.</p>
            </div>

            <div className="space-y-4 text-left bg-card rounded-2xl border border-border/50 p-6">
              <Label htmlFor="familyName" className="text-sm font-medium">What's your family name?</Label>
              <Input
                id="familyName"
                placeholder="e.g. The Johnsons"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                className="text-lg"
              />
            </div>

            <Button
              size="lg"
              className="gradient-warm shadow-soft w-full"
              onClick={() => setStep('members')}
              disabled={!familyName.trim()}
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {step === 'members' && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h1 className="font-display font-bold text-2xl mb-1">Add Family Members</h1>
              <p className="text-muted-foreground">Add at least one parent to manage the family.</p>
            </div>

            <div className="space-y-4">
              {members.map((member, index) => (
                <div key={index} className="bg-card rounded-2xl border border-border/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Member {index + 1}</span>
                    {members.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeMemberDraft(index)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>

                  <Input
                    placeholder="Name"
                    value={member.name}
                    onChange={(e) => updateMember(index, { name: e.target.value })}
                  />

                  {/* Avatar picker */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Avatar</Label>
                    <div className="flex gap-2 flex-wrap">
                      {avatarOptions.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => updateMember(index, { avatar: emoji })}
                          className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all",
                            member.avatar === emoji
                              ? "bg-primary/20 ring-2 ring-primary"
                              : "bg-muted hover:bg-muted/80"
                          )}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Role picker */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Role</Label>
                    <div className="flex gap-2">
                      {roleOptions.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateMember(index, { role: opt.value })}
                          className={cn(
                            "flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2",
                            member.role === opt.value
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80 text-foreground"
                          )}
                        >
                          <span>{opt.emoji}</span>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="outline" className="w-full" onClick={addMemberDraft}>
              <Plus className="h-4 w-4 mr-2" />
              Add Another Member
            </Button>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('welcome')} className="flex-1">
                Back
              </Button>
              <Button
                className="flex-1 gradient-warm shadow-soft"
                onClick={handleFinish}
                disabled={saving || !hasParent || !allNamed}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Get Started
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
