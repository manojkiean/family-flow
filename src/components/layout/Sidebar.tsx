import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  ClipboardList,
  Settings,
  Plus,
  X,
  Loader2,
  Crown,
  Star,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  LogOut
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useFamilyMembers } from '@/hooks/useDatabase';
import { useActiveMember } from '@/contexts/ActiveMemberContext';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Calendar, label: 'Calendar', path: '/calendar' },
  { icon: ClipboardList, label: 'Activities', path: '/activities' },
  { icon: Users, label: 'Family', path: '/family' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function Sidebar({ isOpen, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { familyMembers, loading: membersLoading } = useFamilyMembers();
  const { permissions } = useActiveMember();
  const { user, signOut } = useAuth();
  const [familyName, setFamilyName] = useState<string>('FamilyHub');

  useEffect(() => {
    if (user?.id) {
      supabase
        .from('profiles')
        .select('name, family_name')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (!error && (data?.name || data?.family_name)) {
            setFamilyName(data.name || data.family_name || 'FamilyHub');
          }
        });
    }
  }, [user]);

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
        "fixed top-0 left-0 h-full bg-card border-r border-border z-50 transition-all duration-300 ease-in-out",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        collapsed ? "lg:w-[72px]" : "lg:w-64",
        "w-64"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo + Collapse Toggle */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className={cn("flex items-center gap-2", collapsed && "lg:justify-center")}>
              <div className="w-10 h-10 rounded-xl gradient-warm flex items-center justify-center shadow-soft shrink-0">
                <span className="text-xl">👨‍👩‍👧‍👦</span>
              </div>
              <div className={cn(collapsed && "lg:hidden")}>
                <h1 className="font-display font-bold text-lg text-foreground line-clamp-1">{familyName}</h1>
              </div>
            </div>

            {/* Desktop collapse toggle — sits after FamilyHub title */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex h-7 w-7 shrink-0"
              onClick={onToggleCollapse}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>

            {/* Mobile close button */}
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
                className={cn(
                  "w-full gradient-warm hover:opacity-90 transition-opacity shadow-soft",
                  collapsed && "lg:px-0"
                )}
                onClick={() => {
                  navigate('/activities');
                  onClose();
                }}
                title="Add Activity"
              >
                <Plus className={cn("h-4 w-4", !collapsed && "mr-2")} />
                <span className={cn(collapsed && "lg:hidden")}>Add Activity</span>
              </Button>
            </div>
          )}

          {/* Navigation */}
          <nav className="px-3 py-2">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={onClose}
                      title={item.label}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                        "hover:bg-muted",
                        isActive && "bg-primary/10 text-primary font-medium",
                        collapsed && "lg:justify-center lg:px-2"
                      )}
                    >
                      <item.icon className={cn(
                        "h-5 w-5 shrink-0",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span className={cn(collapsed && "lg:hidden")}>{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Family Members — Crown for parent, Star for child */}
          <div className="px-3 py-4 border-t border-border">
            <p className={cn(
              "text-xs font-medium text-muted-foreground mb-3 px-3",
              collapsed && "lg:hidden"
            )}>FAMILY MEMBERS</p>
            <div className="space-y-1">
              {membersLoading ? (
                <div className={cn("flex items-center gap-3 px-3 py-2", collapsed && "lg:justify-center")}>
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                </div>
              ) : (
                familyMembers.map((member) => {
                  const RoleIcon = member.role === 'parent' ? Crown : Star;
                  const iconColor = member.role === 'parent' ? 'text-primary' : 'text-category-home';
                  return (
                    <button
                      key={member.id}
                      className={cn(
                        "flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-all duration-200",
                        "hover:bg-muted text-left",
                        collapsed && "lg:justify-center lg:px-2"
                      )}
                      title={member.name}
                      onClick={() => {
                        navigate(`/activities?member=${member.id}`);
                        onClose();
                      }}
                    >
                      <RoleIcon className={cn("h-4 w-4 shrink-0", iconColor)} />
                      <span className={cn(
                        "text-sm font-medium truncate",
                        collapsed && "lg:hidden"
                      )}>{member.name}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Bottom actions — FAQ & Sign Out */}
          <div className="px-3 py-3 border-t border-border">
            <div className="space-y-1">
              <button
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all duration-200",
                  "hover:bg-muted text-left",
                  collapsed && "lg:justify-center lg:px-2"
                )}
                title="FAQ"
                onClick={() => {
                  navigate('/faq');
                  onClose();
                }}
              >
                <HelpCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className={cn("text-sm", collapsed && "lg:hidden")}>FAQ</span>
              </button>
              <button
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all duration-200",
                  "hover:bg-destructive/10 text-left",
                  collapsed && "lg:justify-center lg:px-2"
                )}
                title="Sign out"
                onClick={signOut}
              >
                <LogOut className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className={cn("text-sm", collapsed && "lg:hidden")}>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
