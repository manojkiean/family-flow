import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useActivities } from '@/hooks/useAirtable';
import { Activity, ActivityCategory } from '@/types/family';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const categoryColors: Record<ActivityCategory, string> = {
  school: 'bg-category-school',
  sports: 'bg-category-sports',
  health: 'bg-category-health',
  home: 'bg-category-home',
  personal: 'bg-category-personal',
};

const CalendarPage = () => {
  const { activities, loading } = useActivities();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'week' | 'month'>('week');

  const getWeekDays = (date: Date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day;
    });
  };

  const weekDays = getWeekDays(currentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  const getActivitiesForDay = (date: Date): Activity[] => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return activities.filter(a => {
      const activityDate = new Date(a.startTime);
      return activityDate >= dayStart && activityDate <= dayEnd;
    });
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-2xl">Calendar</h1>
            <p className="text-muted-foreground">{formatMonthYear(currentDate)}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-muted rounded-lg p-1">
              <Button
                variant={view === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('week')}
                className={view === 'week' ? 'gradient-warm' : ''}
              >
                Week
              </Button>
              <Button
                variant={view === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('month')}
                className={view === 'month' ? 'gradient-warm' : ''}
              >
                Month
              </Button>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={() => navigateWeek('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigateWeek('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Week View */}
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {weekDays.map((day, idx) => {
              const isToday = day.getTime() === today.getTime();
              return (
                <div 
                  key={idx}
                  className={cn(
                    "p-4 text-center border-r last:border-r-0 border-border/50",
                    isToday && "bg-primary/5"
                  )}
                >
                  <p className="text-xs text-muted-foreground uppercase">
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </p>
                  <p className={cn(
                    "text-xl font-display font-bold mt-1",
                    isToday && "text-primary"
                  )}>
                    {day.getDate()}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Day Content */}
          <div className="grid grid-cols-7 min-h-[400px]">
            {weekDays.map((day, idx) => {
              const dayActivities = getActivitiesForDay(day);
              const isToday = day.getTime() === today.getTime();

              return (
                <div 
                  key={idx}
                  className={cn(
                    "p-2 border-r last:border-r-0 border-border/50",
                    isToday && "bg-primary/5"
                  )}
                >
                  <div className="space-y-1.5">
                    {dayActivities.slice(0, 4).map(activity => (
                      <div
                        key={activity.id}
                        className={cn(
                          "p-2 rounded-lg text-xs cursor-pointer transition-all",
                          "hover:ring-2 hover:ring-primary/30",
                          activity.completed ? "opacity-50" : "",
                          categoryColors[activity.category],
                          "text-white"
                        )}
                      >
                        <p className="font-medium truncate">{activity.title}</p>
                        <p className="opacity-80">
                          {activity.startTime.toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    ))}
                    {dayActivities.length > 4 && (
                      <p className="text-xs text-center text-muted-foreground">
                        +{dayActivities.length - 4} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4">
          {Object.entries(categoryColors).map(([category, color]) => (
            <div key={category} className="flex items-center gap-2">
              <div className={cn("w-3 h-3 rounded-full", color)} />
              <span className="text-sm text-muted-foreground capitalize">{category}</span>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default CalendarPage;
