import { FamilyMember, Activity } from '@/types/family';
import { cn } from '@/lib/utils';

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

  return (
    <div 
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl bg-card p-4 cursor-pointer transition-all duration-300",
        "hover:shadow-elevated hover:-translate-y-1 border border-border/50 hover:border-border"
      )}
    >
      {/* Background gradient based on member color */}
      <div 
        className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2"
        style={{ background: member.color }}
      />

      <div className="relative">
        <div className="flex items-center gap-3 mb-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${member.color}20` }}
          >
            {member.avatar}
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg">{member.name}</h3>
            <p className="text-sm text-muted-foreground capitalize">{member.role}</p>
          </div>
        </div>

        <div className="flex gap-4">
          <div>
            <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-accent">{completedCount}</p>
            <p className="text-xs text-muted-foreground">Done</p>
          </div>
        </div>
      </div>
    </div>
  );
}
