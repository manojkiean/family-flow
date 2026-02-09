import { Activity, ActivityCategory } from '@/types/family';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface DashboardCalendarProps {
  activities: Activity[];
}

const categoryColors: Record<ActivityCategory, string> = {
  school: 'bg-category-school',
  sports: 'bg-category-sports',
  health: 'bg-category-health',
  home: 'bg-category-home',
  personal: 'bg-category-personal',
};

export function DashboardCalendar({ activities }: DashboardCalendarProps) {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

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

  const getActivitiesForDay = (date: Date): Activity[] => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    return activities.filter(a => {
      const ad = new Date(a.startTime);
      return ad >= dayStart && ad <= dayEnd;
    });
  };

  const navigateWeek = (dir: 'prev' | 'next') => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + (dir === 'next' ? 7 : -7));
    setCurrentDate(d);
  };

  const formatMonthYear = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <h3 className="font-display font-semibold text-lg">{formatMonthYear(currentDate)}</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateWeek('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateWeek('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border/50">
        {weekDays.map((day, idx) => {
          const isToday = day.toDateString() === today.toDateString();
          return (
            <div key={idx} className={cn("py-2 text-center", isToday && "bg-primary/5")}>
              <p className="text-[10px] text-muted-foreground uppercase">
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </p>
              <p className={cn("text-sm font-bold", isToday && "text-primary")}>
                {day.getDate()}
              </p>
            </div>
          );
        })}
      </div>

      {/* Day content */}
      <div className="grid grid-cols-7 min-h-[140px]">
        {weekDays.map((day, idx) => {
          const dayActivities = getActivitiesForDay(day);
          const isToday = day.toDateString() === today.toDateString();
          return (
            <div key={idx} className={cn("p-1 border-r last:border-r-0 border-border/50", isToday && "bg-primary/5")}>
              <div className="space-y-1">
                {dayActivities.slice(0, 3).map(activity => (
                  <div
                    key={activity.id}
                    className={cn(
                      "px-1.5 py-1 rounded text-[10px] truncate",
                      activity.completed ? "opacity-50" : "",
                      categoryColors[activity.category],
                      "text-white"
                    )}
                  >
                    {activity.title}
                  </div>
                ))}
                {dayActivities.length > 3 && (
                  <p className="text-[10px] text-center text-muted-foreground">+{dayActivities.length - 3}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border/50 flex justify-end">
        <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => navigate('/calendar')}>
          Full Calendar
          <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
      </div>
    </div>
  );
}
