import { useActiveMember } from '@/contexts/ActiveMemberContext';
import { useFamilyMembers } from '@/hooks/useDatabase';
import { Crown, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

export function MemberPicker() {
  const { activeMember, setActiveMember } = useActiveMember();
  const { familyMembers } = useFamilyMembers();

  if (!activeMember) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors outline-none">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-lg">{activeMember.avatar || '👤'}</span>
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium leading-none">{activeMember.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{activeMember.role}</p>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover border border-border shadow-lg z-50">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Switch Member</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {familyMembers.map(member => (
          <DropdownMenuItem
            key={member.id}
            onClick={() => setActiveMember(member)}
            className={cn(
              "flex items-center gap-3 cursor-pointer",
              member.id === activeMember.id && "bg-primary/10"
            )}
          >
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <span className="text-lg">{member.avatar || '👤'}</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{member.name}</p>
            </div>
            <Badge variant="outline" className="text-[10px] capitalize">
              {member.role === 'parent' && <Crown className="h-3 w-3 mr-1" />}
              {member.role}
            </Badge>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
