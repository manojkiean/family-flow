import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ActivityCard } from '@/components/dashboard/ActivityCard';
import { ActivityForm } from '@/components/activities/ActivityForm';
import { useFamilyData } from '@/contexts/FamilyDataContext';
import { useActiveMember } from '@/contexts/ActiveMemberContext';
import { Activity, ActivityCategory } from '@/types/family';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Search, Plus, CheckCircle2, Circle, Loader2, LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const categories: { value: ActivityCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'school', label: 'School' },
  { value: 'sports', label: 'Sports' },
  { value: 'health', label: 'Health' },
  { value: 'home', label: 'Home' },
  { value: 'personal', label: 'Personal' },
  { value: 'chores', label: 'Chores' },
  { value: 'events', label: 'Events' },
  { value: 'travel', label: 'Travel' },
];

const ActivitiesPage = () => {
  const [searchParams] = useSearchParams();
  const memberFilter = searchParams.get('member');
  const { familyMembers, activities, membersLoading, activitiesLoading, toggleComplete, addActivity, updateActivity } = useFamilyData();
  const { activeMember, permissions } = useActiveMember();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | 'all'>('all');
  const [showCompleted, setShowCompleted] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | undefined>();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const loading = membersLoading || activitiesLoading;

  const handleToggleComplete = async (id: string) => {
    // Children can only complete their own tasks
    if (!permissions.canEditActivity) {
      const activity = activities.find(a => a.id === id);
      if (!activity || !(activity.assignedTo.includes(activeMember?.id || '') || activity.assignedChildren.includes(activeMember?.id || ''))) {
        toast({ title: "Permission Denied", description: "You can only complete tasks assigned to you.", variant: "destructive" });
        return;
      }
    }
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

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
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
          category: data.category,
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
      setEditingActivity(undefined);
    } catch (err: any) {
      console.error('Activity save error:', err);
      toast({
        title: "Error",
        description: err?.message || "Failed to save activity",
        variant: "destructive",
      });
    }
  };

  // Children only see activities assigned to them
  const visibleActivities = permissions.canViewAllActivities
    ? activities
    : activities.filter(a =>
      a.assignedTo.includes(activeMember?.id || '') ||
      a.assignedChildren.includes(activeMember?.id || '')
    );

  const filteredActivities = visibleActivities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || activity.category === selectedCategory;
    const matchesCompleted = showCompleted || !activity.completed;
    const matchesMember = !memberFilter || activity.assignedTo.includes(memberFilter) || activity.assignedChildren.includes(memberFilter);

    return matchesSearch && matchesCategory && matchesCompleted && matchesMember;
  });

  const pendingCount = activities.filter(a => !a.completed).length;
  const completedCount = activities.filter(a => a.completed).length;


  return (
    <>
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Activities</h1>
            <p className="text-muted-foreground">
              {pendingCount} pending · {completedCount} completed
            </p>
          </div>

          {permissions.canCreateActivity && (
            <Button
              className="gradient-warm shadow-soft"
              onClick={() => {
                setEditingActivity(undefined);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Activity
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-card rounded-2xl border border-border/50 p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-muted/50 border-0"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <Button
                  key={cat.value}
                  variant={selectedCategory === cat.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.value)}
                  className={cn(
                    selectedCategory === cat.value && "gradient-warm border-0"
                  )}
                >
                  {cat.label}
                </Button>
              ))}
            </div>

            {/* Show Completed Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCompleted(!showCompleted)}
                className={cn(showCompleted && "bg-accent/10 border-accent text-accent")}
              >
                {showCompleted ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <Circle className="h-4 w-4 mr-2" />}
                Show Completed
              </Button>

              <div className="h-8 w-px bg-border/50 mx-1 hidden sm:block" />

              <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as 'grid' | 'list')} size="sm">
                <ToggleGroupItem value="grid" aria-label="Grid view">
                  <LayoutGrid className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="List view">
                  <List className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </div>

        {/* Activities List/Grid */}
        <div className={cn(
          viewMode === 'grid'
            ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
            : "flex flex-col gap-3"
        )}>
          {filteredActivities.length > 0 ? (
            filteredActivities.map(activity => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                familyMembers={familyMembers}
                onToggleComplete={handleToggleComplete}
                onEdit={permissions.canEditActivity ? handleEditActivity : undefined}
                compact={viewMode === 'list'}
              />
            ))
          ) : (
            <div className={cn(
              "text-center py-16 bg-card rounded-2xl border border-border/50",
              viewMode === 'grid' && "sm:col-span-2 lg:col-span-3"
            )}>
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="font-display font-semibold text-lg">No activities found</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your filters</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setShowCompleted(true);
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
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
    </>
  );
};

export default ActivitiesPage;
