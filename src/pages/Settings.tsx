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
              <Switch defaultChecked />
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
              <Switch />
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
              <select className="bg-muted border-0 rounded-lg px-3 py-2 text-sm">
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
              <Input defaultValue="The Johnson Family" className="bg-muted/50 border-0" />
            </div>

            <div className="grid gap-2">
              <Label>Time Zone</Label>
              <select className="w-full bg-muted/50 border-0 rounded-lg px-3 py-2">
                <option>Eastern Time (ET)</option>
                <option>Central Time (CT)</option>
                <option>Mountain Time (MT)</option>
                <option>Pacific Time (PT)</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label>Week Starts On</Label>
              <select className="w-full bg-muted/50 border-0 rounded-lg px-3 py-2">
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
              <Switch />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Activity History</p>
                <p className="text-sm text-muted-foreground">Keep completed activities for</p>
              </div>
              <select className="bg-muted border-0 rounded-lg px-3 py-2 text-sm">
                <option>30 days</option>
                <option>90 days</option>
                <option>1 year</option>
                <option>Forever</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button className="gradient-warm shadow-soft">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
