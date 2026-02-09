import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ActivityCard } from '@/components/dashboard/ActivityCard';
import { FamilyMemberCard } from '@/components/dashboard/FamilyMemberCard';
import { UpcomingSection } from '@/components/dashboard/UpcomingSection';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { DashboardCalendar } from '@/components/dashboard/DashboardCalendar';
import { ActivityForm } from '@/components/activities/ActivityForm';
import { useFamilyMembers, useActivities } from '@/hooks/useDatabase';
import { Activity, ActivityCategory } from '@/types/family';
import { toast } from '@/hooks/use-toast';
import { 
  CheckCircle2, 
  Clock, 
  Users, 
  TrendingUp,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const navigate = useNavigate();
  const { familyMembers, loading: membersLoading } = useFamilyMembers();
  const { activities, loading: activitiesLoading, toggleComplete, addActivity, updateActivity } = useActivities();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | undefined>();
  const [editingActivity, setEditingActivity] = useState<Activity | undefined>();

  const loading = membersLoading || activitiesLoading;

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

  const handleToggleComplete = async (id: string) => {
    try {
      await toggleComplete(id);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update activity status",
        variant: "destructive",
      });
    }
  };

  const handleOpenForm = (category?: ActivityCategory) => {
    setEditingActivity(undefined);
    setSelectedCategory(category);
    setFormOpen(true);
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setSelectedCategory(undefined);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    const startDateTime = new Date(data.date);
    const [startHours, startMinutes] = data.startTime.split(':').map(Number);
    startDateTime.setHours(startHours, startMinutes, 0, 0);

    let endDateTime: Date | undefined;
    if (data.endTime) {
      endDateTime = new Date(data.date);
      const [endHours, endMinutes] = data.endTime.split(':').map(Number);
      endDateTime.setHours(endHours, endMinutes, 0, 0);
    }

    try {
      if (editingActivity) {
        await updateActivity(editingActivity.id, {
          title: data.title,
          description: data.description,
          category: data.category,
          startTime: startDateTime,
          endTime: endDateTime,
          recurrence: data.recurrence,
          assignedTo: data.assignedTo,
          assignedChildren: data.assignedChildren,
          location: data.location,
          priority: data.priority,
          notes: data.notes,
        });
        toast({
          title: "Activity Updated",
          description: `"${data.title}" has been updated successfully.`,
        });
      } else {
        await addActivity({
          title: data.title,
          description: data.description,
          category: selectedCategory || data.category,
          startTime: startDateTime,
          endTime: endDateTime,
          recurrence: data.recurrence,
          assignedTo: data.assignedTo,
          assignedChildren: data.assignedChildren,
          location: data.location,
          priority: data.priority,
          notes: data.notes,
          completed: false,
          createdBy: familyMembers[0]?.id || '',
        });
        toast({
          title: "Activity Created",
          description: `"${data.title}" has been added to your schedule.`,
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save activity",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

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

        {/* Calendar Widget */}
        <DashboardCalendar activities={activities} />

        {/* Quick Actions */}
        <QuickActions onAddActivity={handleOpenForm} />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Today's Activities - 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-xl">Today's Schedule</h2>
              <Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate('/calendar')}>
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
                    onEdit={handleEditActivity}
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
                <Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate('/family')}>
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

      {/* Activity Form Dialog */}
      <ActivityForm
        open={formOpen}
        onOpenChange={setFormOpen}
        familyMembers={familyMembers}
        activity={editingActivity}
        onSubmit={handleFormSubmit}
      />
    </AppLayout>
  );
};

export default Index;
