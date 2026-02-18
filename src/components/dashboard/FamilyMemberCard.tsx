import { FamilyMember, Activity } from '@/types/family';
import { cn } from '@/lib/utils';
import { Crown, Star, CheckCircle2, Clock } from 'lucide-react';

interface FamilyMemberCardProps {
  member: FamilyMember;
  activities: Activity[];
  onClick?: () => void;
}

export function FamilyMemberCard({ member, activities, onClick }: FamilyMemberCardProps) {
  const memberActivities = activities.filter(
    a => a.assignedTo.includes(member.id) || a.assignedChildren.includes(member.id)
  );
  const completedCount = memberActivities.filter(a => a.completed).length;
  const pendingCount = memberActivities.filter(a => !a.completed).length;

  const RoleIcon = member.role === 'parent' ? Crown : Star;
  const iconColor = member.role === 'parent' ? 'text-primary' : 'text-category-home';

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-xl bg-card p-3 cursor-pointer transition-all duration-300",
        "border border-border/50 hover:border-border hover:shadow-sm group"
      )}
    >
      <div className="relative z-10 flex items-center justify-between gap-4">
        {/* Name and Role Section */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
              iconColor,
              "bg-background border border-border/50 transition-colors group-hover:bg-muted/50"
            )}
          >
            <RoleIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h4 className="font-display font-semibold text-sm leading-tight truncate">{member.name}</h4>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">{member.role}</p>
          </div>
        </div>

        {/* Stats Section in One Row */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Pending Stat */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/30 border border-border/20">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm font-bold text-foreground leading-none">{pendingCount}</span>
          </div>

          {/* Done Stat */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/5 border border-primary/10">
            <CheckCircle2 className="h-3 w-3 text-primary" />
            <span className="text-sm font-bold text-primary leading-none">{completedCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
