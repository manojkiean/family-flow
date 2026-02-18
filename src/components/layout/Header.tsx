import { useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MemberPicker } from './MemberPicker';
import { useAuth } from '@/hooks/useAuth';
import { useActiveMember } from '@/contexts/ActiveMemberContext';
import { useActivities } from '@/hooks/useDatabase';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { activeMember, permissions } = useActiveMember();
  const { activities } = useActivities();
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  const memberName = activeMember?.name || '';

  // Calculate today's pending activities for this member
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todayCount = activities.filter(a => {
    const isAssigned = permissions.canViewAllActivities ||
      (activeMember && (a.assignedTo.includes(activeMember.id) || a.assignedChildren.includes(activeMember.id)));

    if (!isAssigned) return false;

    const activityDate = new Date(a.startTime);
    return activityDate >= todayStart && activityDate <= todayEnd && !a.completed;
  }).length;

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div>
            <h2 className="font-display font-bold text-xl text-foreground">
              Good morning{memberName ? `, ${memberName}` : ''}! ☀️
            </h2>
            <p className="text-sm text-muted-foreground">{formattedDate}</p>
          </div>
        </div>

        {/* Centered Title */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-2xl">👨‍👩‍👧‍👦</span>
          <h1 className="font-display font-bold text-xl bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
            FamBoard
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Search - Hidden on mobile */}
          <div className="hidden md:flex relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search activities..."
              className="pl-9 w-64 bg-muted/50 border-0 focus-visible:ring-primary"
            />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('/activities')}>
            <Bell className="h-5 w-5" />
            {todayCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs gradient-warm border-0">
                {todayCount}
              </Badge>
            )}
          </Button>

          {/* Member Picker */}
          <MemberPicker />

          {/* Sign Out */}
          <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
