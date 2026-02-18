import { useNavigate } from 'react-router-dom';
import { Activity, FamilyMember } from '@/types/family';
import { ActivityCard } from './ActivityCard';
import { Calendar, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UpcomingSectionProps {
  activities: Activity[];
  familyMembers: FamilyMember[];
  onToggleComplete: (id: string) => void;
}

export function UpcomingSection({ activities, familyMembers, onToggleComplete }: UpcomingSectionProps) {
  const navigate = useNavigate();
  // Get upcoming activities (future, not today)
  const now = new Date();
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const upcomingActivities = activities
    .filter(a => new Date(a.startTime) > todayEnd)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-secondary">
            <Calendar className="h-5 w-5 text-secondary-foreground" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg">Upcoming</h3>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate('/calendar')}>
          View All
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <div className="space-y-3">
        {upcomingActivities.length > 0 ? (
          upcomingActivities.slice(0, 3).map(activity => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              familyMembers={familyMembers}
              onToggleComplete={onToggleComplete}
              compact
            />
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p>No activities scheduled for tomorrow</p>
          </div>
        )}
      </div>
    </div>
  );
}
