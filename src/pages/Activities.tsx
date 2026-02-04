import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ActivityCard } from '@/components/dashboard/ActivityCard';
import { familyMembers, activities as initialActivities } from '@/data/mockData';
import { Activity, ActivityCategory } from '@/types/family';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Plus, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const categories: { value: ActivityCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'school', label: 'School' },
  { value: 'sports', label: 'Sports' },
  { value: 'health', label: 'Health' },
  { value: 'home', label: 'Home' },
  { value: 'personal', label: 'Personal' },
];

const ActivitiesPage = () => {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | 'all'>('all');
  const [showCompleted, setShowCompleted] = useState(true);

  const handleToggleComplete = (id: string) => {
    setActivities(prev => 
      prev.map(a => a.id === id ? { ...a, completed: !a.completed } : a)
    );
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         activity.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || activity.category === selectedCategory;
    const matchesCompleted = showCompleted || !activity.completed;
    
    return matchesSearch && matchesCategory && matchesCompleted;
  });

  const pendingCount = activities.filter(a => !a.completed).length;
  const completedCount = activities.filter(a => a.completed).length;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-2xl">Activities</h1>
            <p className="text-muted-foreground">
              {pendingCount} pending · {completedCount} completed
            </p>
          </div>

          <Button className="gradient-warm shadow-soft">
            <Plus className="h-4 w-4 mr-2" />
            New Activity
          </Button>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCompleted(!showCompleted)}
              className={cn(showCompleted && "bg-accent/10 border-accent text-accent")}
            >
              {showCompleted ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <Circle className="h-4 w-4 mr-2" />}
              Show Completed
            </Button>
          </div>
        </div>

        {/* Activities Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredActivities.length > 0 ? (
            filteredActivities.map(activity => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                familyMembers={familyMembers}
                onToggleComplete={handleToggleComplete}
              />
            ))
          ) : (
            <div className="sm:col-span-2 lg:col-span-3 text-center py-16 bg-card rounded-2xl border border-border/50">
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
    </AppLayout>
  );
};

export default ActivitiesPage;
