import { Activity, FamilyMember, ActivityCategory } from '@/types/family';
import { Clock, MapPin, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

interface ActivityCardProps {
  activity: Activity;
  familyMembers: FamilyMember[];
  onToggleComplete?: (id: string) => void;
  onEdit?: (activity: Activity) => void;
  compact?: boolean;
}

const categoryStyles: Record<ActivityCategory, { bg: string; text: string; label: string }> = {
  school: { bg: 'category-school-soft', text: 'text-category-school', label: 'School' },
  sports: { bg: 'category-sports-soft', text: 'text-category-sports', label: 'Sports' },
  health: { bg: 'category-health-soft', text: 'text-category-health', label: 'Health' },
  home: { bg: 'category-home-soft', text: 'text-category-home', label: 'Home' },
  personal: { bg: 'category-personal-soft', text: 'text-category-personal', label: 'Personal' },
};

export function ActivityCard({ activity, familyMembers, onToggleComplete, onEdit, compact }: ActivityCardProps) {
  const style = categoryStyles[activity.category];
  const assignedMembers = familyMembers.filter(m => activity.assignedTo.includes(m.id));
  const children = familyMembers.filter(m => activity.assignedChildren.includes(m.id));

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 transition-all duration-200",
        "hover:shadow-card hover:border-border",
        activity.completed && "opacity-60"
      )}>
        <Checkbox 
          checked={activity.completed}
          onCheckedChange={() => onToggleComplete?.(activity.id)}
          className="h-5 w-5"
        />
        
        <div className={cn("w-1 h-10 rounded-full", style.bg.replace('-soft', ''))} />
        
        <div className="flex-1 min-w-0">
          <p className={cn(
            "font-medium truncate",
            activity.completed && "line-through text-muted-foreground"
          )}>
            {activity.title}
          </p>
          <p className="text-sm text-muted-foreground">
            {formatTime(activity.startTime)}
            {activity.endTime && ` - ${formatTime(activity.endTime)}`}
          </p>
        </div>

        <div className="flex -space-x-2">
          {assignedMembers.slice(0, 2).map(member => (
            <div 
              key={member.id}
              className="w-7 h-7 rounded-full bg-muted border-2 border-card flex items-center justify-center"
            >
              <span className="text-sm">{member.avatar}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-card border border-border/50 p-4 transition-all duration-300",
        "hover:shadow-elevated hover:-translate-y-0.5 hover:border-border",
        activity.completed && "opacity-70",
        onEdit && "cursor-pointer"
      )}
      onClick={() => onEdit?.(activity)}
    >
      {/* Category indicator */}
      <div className={cn("absolute top-0 left-0 w-1 h-full", style.bg.replace('-soft', ''))} />

      {/* Edit button */}
      {onEdit && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(activity);
          }}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}

      <div className="pl-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={cn(style.bg, style.text, "border-0 font-medium text-xs")}>
                {style.label}
              </Badge>
              {activity.priority === 'high' && (
                <Badge variant="destructive" className="text-xs">
                  High Priority
                </Badge>
              )}
            </div>
            <h3 className={cn(
              "font-display font-semibold text-lg",
              activity.completed && "line-through text-muted-foreground"
            )}>
              {activity.title}
            </h3>
          </div>
          
          <Checkbox 
            checked={activity.completed}
            onCheckedChange={() => onToggleComplete?.(activity.id)}
            onClick={(e) => e.stopPropagation()}
            className="h-6 w-6"
          />
        </div>

        {activity.description && (
          <p className="text-sm text-muted-foreground mb-3">{activity.description}</p>
        )}

        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>
              {formatTime(activity.startTime)}
              {activity.endTime && ` - ${formatTime(activity.endTime)}`}
            </span>
          </div>
          
          {activity.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              <span>{activity.location}</span>
            </div>
          )}
        </div>

        {/* Assigned people */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Assigned:</span>
            <div className="flex -space-x-2">
              {assignedMembers.map(member => (
                <div 
                  key={member.id}
                  className="w-7 h-7 rounded-full bg-muted border-2 border-card flex items-center justify-center"
                  title={member.name}
                >
                  <span className="text-sm">{member.avatar}</span>
                </div>
              ))}
            </div>
          </div>

          {children.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">For:</span>
              <div className="flex gap-1">
                {children.map(child => (
                  <span key={child.id} className="text-sm">{child.avatar}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
