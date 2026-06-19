import { useState } from 'react';
import { Activity, FamilyMember, ActivityCategory } from '@/types/family';
import { Clock, MapPin, Pencil, Users, FileText, Info, MessagesSquare, User } from 'lucide-react';
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
  chores: { bg: 'category-chores-soft', text: 'text-category-chores', label: 'Chores', emoji: '🧹' },
  events: { bg: 'category-events-soft', text: 'text-category-events', label: 'Events', emoji: '🎉' },
  travel: { bg: 'category-travel-soft', text: 'text-category-travel', label: 'Travel', emoji: '✈️' },
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
          {/* Mini calendar badge showing the day number */}
          <button
            onClick={() => setDetailOpen(true)}
            className={cn("flex flex-col items-center justify-center w-10 h-10 rounded-xl shrink-0 transition-all hover:scale-105", style.bg)}
            title="View details"
          >
            <span className={cn("text-[9px] font-bold uppercase leading-none", style.text)}>
              {activity.startTime.toLocaleDateString('en-US', { month: 'short' })}
            </span>
            <span className={cn("text-base font-black leading-tight", style.text)}>
              {activity.startTime.getDate()}
            </span>
          </button>

          <div className={cn("w-1 h-10 rounded-full", style.bg.replace('-soft', ''))} />

          <div
            className={cn("flex-1 min-w-0", onEdit && "cursor-pointer")}
            onClick={() => onEdit?.(activity)}
          >
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

          {/* Show children if assigned, otherwise show parents */}
          <div className="flex items-center gap-1.5">
            {(() => {
              const displayMembers = children.length > 0 ? children : assignedMembers;
              const isChildren = children.length > 0;
              return (
                <div className="flex -space-x-2">
                  {displayMembers.slice(0, 3).map(member => (
                    <div
                      key={member.id}
                      title={`${member.name}${isChildren ? ' (child)' : ''}`}
                      className="relative w-7 h-7 rounded-full bg-muted border-2 border-card flex items-center justify-center shrink-0 overflow-hidden"
                      style={{ borderColor: member.color || undefined }}
                    >
                      {member.image_url ? (
                        <img src={member.image_url} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  ))}
                  {displayMembers.length > 3 && (
                    <div className="w-7 h-7 rounded-full bg-muted border-2 border-card flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-bold text-muted-foreground">+{displayMembers.length - 3}</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
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

        {/* Activity Detail Popup — Premium redesign */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="sm:max-w-sm border-none p-0 overflow-hidden rounded-3xl bg-card shadow-2xl gap-0">

            {/* ── Hero Header ── */}
            <div className={cn(
              "relative p-6 pb-8 overflow-hidden",
              `bg-${style.bg.replace('-soft', '')}`
            )}
              style={{ background: `hsl(var(--${style.bg.replace('-soft', '').replace('bg-', '')}))` }}
            >
              {/* Blurred circle decoration */}
              <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-20 blur-2xl bg-white" />
              <div className="absolute -bottom-6 -left-4 w-24 h-24 rounded-full opacity-10 blur-xl bg-white" />

              {/* Category pill + Priority */}
              <div className="relative flex items-center gap-2 mb-5">
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-[11px] font-bold uppercase tracking-wider">
                  {style.emoji} {style.label}
                </span>
                {activity.priority === 'high' && (
                  <span className="px-2 py-1 rounded-full bg-red-500/80 text-white text-[10px] font-bold uppercase tracking-wider">
                    🔥 High Priority
                  </span>
                )}
              </div>

              {/* Title */}
              <DialogTitle className="relative font-display font-bold text-2xl text-white leading-tight mb-1">
                {activity.title}
              </DialogTitle>
              <DialogDescription className="relative text-white/70 text-sm">
                {formatDate(activity.startTime)}
              </DialogDescription>

              {/* Large date block — bottom right */}
              <div className="absolute bottom-4 right-5 flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20">
                <span className="text-[10px] font-bold text-white/80 uppercase leading-none">
                  {activity.startTime.toLocaleDateString('en-US', { month: 'short' })}
                </span>
                <span className="text-2xl font-black text-white leading-tight">
                  {activity.startTime.getDate()}
                </span>
              </div>
            </div>

            {/* ── Body ── */}
            <div className="p-5 space-y-4">

              {/* Time + Location pills row */}
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted/60 text-sm font-medium">
                  <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>
                    {formatTime(activity.startTime)}
                    {activity.endTime && ` › ${formatTime(activity.endTime)}`}
                  </span>
                </div>
                {activity.location && (
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted/60 text-sm font-medium">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate max-w-[140px]">{activity.location}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {activity.description && (
                <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 px-4 py-3 rounded-2xl border border-border/30">
                  {activity.description}
                </p>
              )}

              {/* Notes */}
              {activity.notes && (
                <div className="flex gap-2.5 px-4 py-3 rounded-2xl bg-primary/5 border border-dashed border-primary/20">
                  <MessagesSquare className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground italic">"{activity.notes}"</p>
                </div>
              )}

              {/* People */}
              {(assignedMembers.length > 0 || children.length > 0) && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <Users className="h-3 w-3" /> People
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[...assignedMembers, ...children].map(member => (
                      <div key={member.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 border border-border/30">
                        <div className="w-5 h-5 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
                          {member.image_url ? (
                            <img src={member.image_url} alt={member.name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                        <span className="text-xs font-semibold">{member.name}</span>
                      </div>
                    ))}
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
              <div key={member.id} className="flex items-center gap-1.5 bg-muted/50 rounded-full pl-0.5 pr-2 py-0.5">
                <div className="w-5 h-5 rounded-full bg-background flex items-center justify-center overflow-hidden">
                  {member.image_url ? (
                    <img src={member.image_url} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
                <span className="text-xs font-medium">{member.name}</span>
              </div>
            ))}
          </div>

          {children.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">For:</span>
              {children.map(child => (
                <div key={child.id} className="flex items-center gap-1.5 bg-muted/50 rounded-full pl-0.5 pr-2 py-0.5">
                  <div className="w-5 h-5 rounded-full bg-background flex items-center justify-center overflow-hidden">
                    {child.image_url ? (
                      <img src={child.image_url} alt={child.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
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
