import { useState } from 'react';
import { Activity, FamilyMember, ActivityCategory } from '@/types/family';
import { Clock, MapPin, Pencil, Paperclip, Users, FileText, Info, MessagesSquare, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface ActivityCardProps {
  activity: Activity;
  familyMembers: FamilyMember[];
  onToggleComplete?: (id: string) => void;
  onEdit?: (activity: Activity) => void;
  compact?: boolean;
}

const categoryStyles: Record<ActivityCategory, { bg: string; text: string; label: string; emoji: string }> = {
  school: { bg: 'category-school-soft', text: 'text-category-school', label: 'School', emoji: '🎓' },
  sports: { bg: 'category-sports-soft', text: 'text-category-sports', label: 'Sports', emoji: '⚽' },
  health: { bg: 'category-health-soft', text: 'text-category-health', label: 'Health', emoji: '🏥' },
  home: { bg: 'category-home-soft', text: 'text-category-home', label: 'Home', emoji: '🏠' },
  personal: { bg: 'category-personal-soft', text: 'text-category-personal', label: 'Personal', emoji: '👤' },
};

export function ActivityCard({ activity, familyMembers, onToggleComplete, onEdit, compact }: ActivityCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const style = categoryStyles[activity.category];
  const assignedMembers = familyMembers.filter(m => activity.assignedTo.includes(m.id));
  const children = familyMembers.filter(m => activity.assignedChildren.includes(m.id));

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  if (compact) {
    return (
      <>
        <div className={cn(
          "flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 transition-all duration-200",
          "hover:shadow-card hover:border-border",
          activity.completed && "opacity-60"
        )}>
          <button
            onClick={() => setDetailOpen(true)}
            className={cn("p-1.5 rounded-lg transition-colors shrink-0", `hover:${style.bg}`)}
            title="View details"
          >
            <Paperclip className={cn("h-4 w-4", style.text)} />
          </button>

          <div className={cn("w-1 h-10 rounded-full", style.bg.replace('-soft', ''))} />

          <div className="flex-1 min-w-0">
            <p className={cn(
              "font-medium truncate",
              activity.completed && "line-through text-muted-foreground"
            )}>
              {activity.title}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatDate(activity.startTime)} · {formatTime(activity.startTime)}
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

        {/* Activity Detail Popup */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="sm:max-w-md border-none p-0 overflow-hidden rounded-[2rem] bg-card shadow-2xl">
            <div className={cn("h-36 relative flex items-end p-6", style.bg.replace('-soft', ''))}>
              <div className="absolute top-4 right-4 animate-pulse pointer-events-none opacity-20">
                <Paperclip className="h-28 w-28 text-white -rotate-12" />
              </div>
              <div className="relative z-10 w-full">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-md text-[10px] font-bold uppercase tracking-wider">
                    {style.label} {style.emoji}
                  </span>
                  {activity.priority === 'high' && (
                    <Badge className="bg-destructive text-white border-none text-[10px] h-5">HIGH PRIORITY</Badge>
                  )}
                </div>
                <DialogTitle className="font-display font-bold text-2xl text-white">{activity.title}</DialogTitle>
                <DialogDescription className="text-white/80 text-xs font-medium mt-1">
                  {formatDate(activity.startTime)}
                </DialogDescription>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Description Section */}
              {activity.description && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    <span>Description</span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed bg-muted/30 p-4 rounded-2xl border border-border/20">
                    {activity.description}
                  </p>
                </div>
              )}

              {/* Time and Location */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span>Schedule</span>
                  </div>
                  <div className="text-sm font-medium p-4 rounded-2xl bg-muted/30 border border-border/20 h-full">
                    {formatTime(activity.startTime)}
                    {activity.endTime && ` - ${formatTime(activity.endTime)}`}
                  </div>
                </div>

                {activity.location && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      <span>Where</span>
                    </div>
                    <div className="text-sm font-medium p-4 rounded-2xl bg-muted/30 border border-border/20 h-full flex items-center">
                      <span className="truncate">{activity.location}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Personnel Section - Side by Side */}
              {(assignedMembers.length > 0 || children.length > 0) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    <span>People Involved</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={cn(
                      "p-4 rounded-2xl border border-border/20 space-y-3 bg-muted/20",
                      assignedMembers.length === 0 && "opacity-40 grayscale"
                    )}>
                      <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block border-b border-border/20 pb-2">Assigned To</span>
                      <div className="space-y-2">
                        {assignedMembers.length > 0 ? assignedMembers.map(member => (
                          <div key={member.id} className="flex items-center gap-2.5">
                            <span className="text-xl leading-none">{member.avatar}</span>
                            <span className="text-xs font-semibold">{member.name}</span>
                          </div>
                        )) : <span className="text-[10px] text-muted-foreground italic">None</span>}
                      </div>
                    </div>

                    <div className={cn(
                      "p-4 rounded-2xl border border-border/20 space-y-3 bg-muted/20",
                      children.length === 0 && "opacity-40 grayscale"
                    )}>
                      <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block border-b border-border/20 pb-2">Assigning For</span>
                      <div className="space-y-2">
                        {children.length > 0 ? children.map(child => (
                          <div key={child.id} className="flex items-center gap-2.5">
                            <span className="text-xl leading-none">{child.avatar}</span>
                            <span className="text-xs font-semibold">{child.name}</span>
                          </div>
                        )) : <span className="text-[10px] text-muted-foreground italic">None</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {activity.notes && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">
                    <MessagesSquare className="h-3.5 w-3.5 text-primary" />
                    <span>Notes</span>
                  </div>
                  <div className="text-sm italic text-muted-foreground bg-primary/5 p-4 rounded-2xl border border-dashed border-primary/20 relative overflow-hidden group">
                    <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:scale-110 transition-transform">
                      <MessagesSquare className="h-12 w-12" />
                    </div>
                    <span className="relative z-10">"{activity.notes}"</span>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
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

      <div className="pl-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("flex items-center gap-1.5 text-sm font-medium", style.text)}>
                <span>{style.emoji}</span>
                <span>{style.label}</span>
              </span>
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

          <div className="flex items-center gap-2 shrink-0 ml-2">
            <Checkbox
              checked={activity.completed}
              onCheckedChange={() => onToggleComplete?.(activity.id)}
              onClick={(e) => e.stopPropagation()}
              className="h-6 w-6"
            />
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(activity);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {activity.description && (
          <p className="text-sm text-muted-foreground mb-3">{activity.description}</p>
        )}

        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>
              {formatDate(activity.startTime)} · {formatTime(activity.startTime)}
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
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Assigned:</span>
            {assignedMembers.map(member => (
              <div key={member.id} className="flex items-center gap-1.5 bg-muted/50 rounded-full px-2 py-0.5">
                <span className="text-sm">{member.avatar}</span>
                <span className="text-xs font-medium">{member.name}</span>
              </div>
            ))}
          </div>

          {children.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">For:</span>
              {children.map(child => (
                <div key={child.id} className="flex items-center gap-1.5 bg-muted/50 rounded-full px-2 py-0.5">
                  <span className="text-sm">{child.avatar}</span>
                  <span className="text-xs font-medium">{child.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
