import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ActivityCard } from '@/components/dashboard/ActivityCard';
import { FamilyMemberCard } from '@/components/dashboard/FamilyMemberCard';
import { UpcomingSection } from '@/components/dashboard/UpcomingSection';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { familyMembers, activities as initialActivities } from '@/data/mockData';
import { Activity } from '@/types/family';
import { 
  CheckCircle2, 
  Clock, 
  Users, 
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Today's activities
  const todayActivities = activities.filter(a => {
    const activityDate = new Date(a.startTime);
    activityDate.setHours(0, 0, 0, 0);
    return activityDate.getTime() === today.getTime();
  });

  const completedToday = todayActivities.filter(a => a.completed).length;
  const pendingToday = todayActivities.filter(a => !a.completed).length;

  const handleToggleComplete = (id: string) => {
    setActivities(prev => 
      prev.map(a => a.id === id ? { ...a, completed: !a.completed } : a)
    );
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Today's Tasks"
            value={todayActivities.length}
            subtitle={`${pendingToday} pending`}
            icon={Clock}
            gradient
          />
          <StatsCard
            title="Completed"
            value={completedToday}
            subtitle="Today"
            icon={CheckCircle2}
            trend={{ value: 12, positive: true }}
          />
          <StatsCard
            title="Family Members"
            value={familyMembers.length}
            subtitle="Active"
            icon={Users}
          />
          <StatsCard
            title="Completion Rate"
            value={`${todayActivities.length > 0 ? Math.round((completedToday / todayActivities.length) * 100) : 0}%`}
            subtitle="This week"
            icon={TrendingUp}
            trend={{ value: 5, positive: true }}
          />
        </div>

        {/* Quick Actions */}
        <QuickActions />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Today's Activities - 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-xl">Today's Schedule</h2>
              <Button variant="ghost" size="sm" className="text-primary">
                View Calendar
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {todayActivities.length > 0 ? (
                todayActivities.map(activity => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    familyMembers={familyMembers}
                    onToggleComplete={handleToggleComplete}
                  />
                ))
              ) : (
                <div className="sm:col-span-2 text-center py-12 bg-card rounded-2xl border border-border/50">
                  <div className="text-4xl mb-3">🎉</div>
                  <h3 className="font-display font-semibold text-lg">All Clear!</h3>
                  <p className="text-muted-foreground">No activities scheduled for today</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Upcoming */}
            <UpcomingSection 
              activities={activities}
              familyMembers={familyMembers}
              onToggleComplete={handleToggleComplete}
            />

            {/* Family Members */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-lg">Family</h3>
                <Button variant="ghost" size="sm" className="text-primary">
                  Manage
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {familyMembers.map(member => (
                  <FamilyMemberCard
                    key={member.id}
                    member={member}
                    activities={activities}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
