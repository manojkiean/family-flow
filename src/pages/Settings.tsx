import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  Clock,
  Globe,
  Palette,
  Shield,
  Smartphone,
  Mail,
  Save
} from 'lucide-react';

const SettingsPage = () => {
  const { user } = useAuth();
  const [familyName, setFamilyName] = useState('FamilyHub');
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [reminderTime, setReminderTime] = useState('1 hour');
  const [timezone, setTimezone] = useState('Eastern Time (ET)');
  const [weekStartsOn, setWeekStartsOn] = useState('Sunday');
  const [requirePin, setRequirePin] = useState(false);
  const [retention, setRetention] = useState('Forever');
  const [familyPassword, setFamilyPassword] = useState('family123');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data, error }: { data: any, error: any }) => {
          if (!error && data) {
            setFamilyName(data.name || data.family_name || 'FamilyHub');
            setPushNotifications(data.push_notifications ?? true);
            setEmailNotifications(data.email_notifications ?? false);
            setReminderTime(data.reminder_time ?? '1 hour');
            setTimezone(data.timezone ?? 'Eastern Time (ET)');
            setWeekStartsOn(data.week_starts_on ?? 'Sunday');
            setRequirePin(data.require_pin_for_children ?? false);
            setRetention(data.activity_history_retention ?? 'Forever');
            setFamilyPassword(data.family_password || 'family123');
          }
          setLoading(false);
        });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          family_name: familyName,
          name: familyName,
          push_notifications: pushNotifications,
          email_notifications: emailNotifications,
          reminder_time: reminderTime,
          timezone: timezone,
          week_starts_on: weekStartsOn,
          require_pin_for_children: requirePin,
          activity_history_retention: retention,
          family_password: familyPassword,
          updated_at: new Date().toISOString()
        } as any, { onConflict: 'user_id' });

      if (error) throw error;
      toast({ title: 'Settings saved', description: 'Your family preferences have been updated.' });
    } catch (err: any) {
      console.error('Save error:', err);
      toast({
        title: 'Save Error',
        description: err.message || 'Make sure you have run the latest database migration in Supabase.',
        variant: 'destructive'
      });
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="font-display font-bold text-2xl">Settings</h1>
          <p className="text-muted-foreground">Manage your family hub preferences</p>
        </div>

        {/* Notifications */}
        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg">Notifications</h2>
              <p className="text-sm text-muted-foreground">Choose how you want to be notified</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive alerts on your device</p>
                </div>
              </div>
              <Switch
                checked={pushNotifications}
                onCheckedChange={setPushNotifications}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Daily summary of activities</p>
                </div>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Reminder Time</p>
                  <p className="text-sm text-muted-foreground">Default time before activities</p>
                </div>
              </div>
              <select
                className="bg-muted border-0 rounded-lg px-3 py-2 text-sm"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
              >
                <option>10 minutes</option>
                <option>30 minutes</option>
                <option>1 hour</option>
                <option>1 day</option>
              </select>
            </div>
          </div>
        </div>

        {/* General Settings */}
        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-accent/10">
              <Globe className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg">General</h2>
              <p className="text-sm text-muted-foreground">Basic application settings</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Family Name</Label>
              <Input
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                className="bg-muted/50 border-0"
              />
            </div>
            {/* ... rest of the section ... */}

            <div className="grid gap-2">
              <Label>Time Zone</Label>
              <select
                className="w-full bg-muted/50 border-0 rounded-lg px-3 py-2"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                <option>Eastern Time (ET)</option>
                <option>Central Time (CT)</option>
                <option>Mountain Time (MT)</option>
                <option>Pacific Time (PT)</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label>Week Starts On</Label>
              <select
                className="w-full bg-muted/50 border-0 rounded-lg px-3 py-2"
                value={weekStartsOn}
                onChange={(e) => setWeekStartsOn(e.target.value)}
              >
                <option>Sunday</option>
                <option>Monday</option>
              </select>
            </div>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-destructive/10">
              <Shield className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg">Privacy & Security</h2>
              <p className="text-sm text-muted-foreground">Protect your family data</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Require PIN for children</p>
                <p className="text-sm text-muted-foreground">Children need PIN to mark tasks complete</p>
              </div>
              <Switch
                checked={requirePin}
                onCheckedChange={setRequirePin}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Activity History</p>
                <p className="text-sm text-muted-foreground">Keep completed activities for</p>
              </div>
              <select
                className="bg-muted border-0 rounded-lg px-3 py-2 text-sm"
                value={retention}
                onChange={(e) => setRetention(e.target.value)}
              >
                <option>30 days</option>
                <option>90 days</option>
                <option>1 year</option>
                <option>Forever</option>
              </select>
            </div>

            <Separator />

            <div className="space-y-4 pt-2">
              <div>
                <p className="font-medium">Family Entry Code</p>
                <p className="text-sm text-muted-foreground mb-3">The shared password your children use at the login screen</p>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={familyPassword}
                    onChange={(e) => setFamilyPassword(e.target.value)}
                    className="bg-muted/50 border-0 flex-1"
                    placeholder="e.g. family123"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button className="gradient-warm shadow-soft" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
