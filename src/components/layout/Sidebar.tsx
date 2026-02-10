import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  ClipboardList, 
  Settings,
  Plus,
  X,
  Loader2
} from 'lucide-react';
import { useFamilyMembers } from '@/hooks/useDatabase';
import { useActiveMember } from '@/contexts/ActiveMemberContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Calendar, label: 'Calendar', path: '/calendar' },
  { icon: ClipboardList, label: 'Activities', path: '/activities' },
  { icon: Users, label: 'Family', path: '/family' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { familyMembers, loading: membersLoading } = useFamilyMembers();
  const { permissions } = useActiveMember();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-50 transition-transform duration-300 ease-in-out",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-warm flex items-center justify-center shadow-soft">
                <span className="text-xl">👨‍👩‍👧‍👦</span>
              </div>
              <div>
                <h1 className="font-display font-bold text-lg text-foreground">FamilyHub</h1>
                <p className="text-xs text-muted-foreground">Activity Tracker</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Add Activity Button */}
          {permissions.canCreateActivity && (
            <div className="p-4">
              <Button 
                className="w-full gradient-warm hover:opacity-90 transition-opacity shadow-soft"
                onClick={() => {
                  navigate('/activities');
                  onClose();
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Activity
              </Button>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-2">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                        "hover:bg-muted",
                        isActive && "bg-primary/10 text-primary font-medium"
                      )}
                    >
                      <item.icon className={cn(
                        "h-5 w-5",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Family Members Quick Access */}
          <div className="p-4 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground mb-3">FAMILY MEMBERS</p>
            <div className="flex gap-2">
              {membersLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                familyMembers.map((member) => (
                  <div 
                    key={member.id}
                    className="w-9 h-9 rounded-full bg-muted flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                    title={member.name}
                    onClick={() => {
                      navigate(`/activities?member=${member.id}`);
                      onClose();
                    }}
                  >
                    <span className="text-lg">{member.avatar}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
