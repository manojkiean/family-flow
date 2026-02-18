import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useActivities, useFamilyMembers } from '@/hooks/useDatabase';
import { useActiveMember } from '@/contexts/ActiveMemberContext';
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
  const { activities, loading: activitiesLoading } = useActivities();
  const { familyMembers, loading: membersLoading } = useFamilyMembers();
  const { activeMember, permissions } = useActiveMember();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'week' | 'month'>('week');

  const loading = activitiesLoading || membersLoading;

  // Role-based filtering: children see only their own activities
  const visibleActivities = activities.filter(a => {
    if (permissions.canViewAllActivities) return true;
    if (!activeMember) return false;
    return a.assignedTo.includes(activeMember.id) || a.assignedChildren.includes(activeMember.id);
  });

  // ─── Week helpers ───
  const getWeekDays = (date: Date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day;
    });
  };

  // ─── Month helpers ───
  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);

    // Pad to start on Sunday
    const startDay = new Date(firstOfMonth);
    startDay.setDate(startDay.getDate() - startDay.getDay());

    // Pad to end on Saturday (6 rows × 7 = 42 cells)
    const days: Date[] = [];
    const current = new Date(startDay);
    while (days.length < 42) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const weekDays = getWeekDays(currentDate);
  const monthDays = getMonthDays(currentDate);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ─── Navigation ───
  const navigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // ─── Activity lookup ───
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

  const getMemberNames = (activity: Activity): string => {
    const members = familyMembers.filter(m => activity.assignedTo.includes(m.id));
    return members.map(m => m.name).join(', ');
  };

  const getChildNames = (activity: Activity): string => {
    const children = familyMembers.filter(m => activity.assignedChildren.includes(m.id));
    return children.map(m => m.name).join(', ');
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const isSameDay = (a: Date, b: Date) => {
    return a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
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
              <Button variant="outline" size="icon" onClick={() => navigate('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigate('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* ═══════════ WEEK VIEW ═══════════ */}
        {view === 'week' && (
          <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-border">
              {weekDays.map((day, idx) => {
                const isToday = isSameDay(day, today);
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
                const isToday = isSameDay(day, today);

                return (
                  <div
                    key={idx}
                    className={cn(
                      "p-2 border-r last:border-r-0 border-border/50",
                      isToday && "bg-primary/5"
                    )}
                  >
                    <div className="space-y-1.5">
                      {dayActivities.slice(0, 4).map(activity => {
                        const memberNames = getMemberNames(activity);
                        const childNames = getChildNames(activity);
                        return (
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
                            {memberNames && (
                              <p className="opacity-70 truncate mt-0.5 text-[10px]">
                                👤 {memberNames}
                              </p>
                            )}
                            {childNames && (
                              <p className="opacity-70 truncate text-[10px]">
                                👶 {childNames}
                              </p>
                            )}
                            {activity.location && (
                              <p className="opacity-70 truncate text-[10px]">
                                📍 {activity.location}
                              </p>
                            )}
                          </div>
                        );
                      })}
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
        )}

        {/* ═══════════ MONTH VIEW ═══════════ */}
        {view === 'month' && (
          <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 border-b border-border">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="p-3 text-center text-xs text-muted-foreground uppercase font-medium border-r last:border-r-0 border-border/50">
                  {d}
                </div>
              ))}
            </div>

            {/* Month grid — 6 rows */}
            <div className="grid grid-cols-7">
              {monthDays.map((day, idx) => {
                const dayActivities = getActivitiesForDay(day);
                const isToday = isSameDay(day, today);
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();

                return (
                  <div
                    key={idx}
                    className={cn(
                      "min-h-[100px] p-2 border-r last:border-r-0 border-b border-border/50 transition-colors",
                      isToday && "bg-primary/5",
                      !isCurrentMonth && "bg-muted/30"
                    )}
                  >
                    <p className={cn(
                      "text-sm font-medium mb-1",
                      isToday && "text-primary font-bold",
                      !isCurrentMonth && "text-muted-foreground/50"
                    )}>
                      {day.getDate()}
                    </p>

                    <div className="space-y-1">
                      {dayActivities.slice(0, 3).map(activity => {
                        const memberNames = getMemberNames(activity);
                        const childNames = getChildNames(activity);
                        return (
                          <div
                            key={activity.id}
                            className={cn(
                              "px-1.5 py-0.5 rounded text-[10px] leading-tight cursor-pointer transition-all",
                              "hover:ring-1 hover:ring-primary/30",
                              activity.completed ? "opacity-50" : "",
                              categoryColors[activity.category],
                              "text-white"
                            )}
                          >
                            <p className="font-medium truncate">{activity.title}</p>
                            {memberNames && (
                              <p className="opacity-70 truncate">👤 {memberNames}</p>
                            )}
                            {childNames && (
                              <p className="opacity-70 truncate">👶 {childNames}</p>
                            )}
                            {activity.location && (
                              <p className="opacity-70 truncate">📍 {activity.location}</p>
                            )}
                          </div>
                        );
                      })}
                      {dayActivities.length > 3 && (
                        <p className="text-[10px] text-center text-muted-foreground">
                          +{dayActivities.length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
