import { 
  GraduationCap, 
  Dumbbell, 
  Heart, 
  Home, 
  User,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActivityCategory } from '@/types/family';

interface QuickActionsProps {
  onAddActivity?: (category: ActivityCategory) => void;
}

const quickActions = [
  { category: 'school' as ActivityCategory, icon: GraduationCap, label: 'School', color: 'category-school' },
  { category: 'sports' as ActivityCategory, icon: Dumbbell, label: 'Sports', color: 'category-sports' },
  { category: 'health' as ActivityCategory, icon: Heart, label: 'Health', color: 'category-health' },
  { category: 'home' as ActivityCategory, icon: Home, label: 'Home', color: 'category-home' },
  { category: 'personal' as ActivityCategory, icon: User, label: 'Personal', color: 'category-personal' },
];

export function QuickActions({ onAddActivity }: QuickActionsProps) {
  return (
    <div className="bg-card rounded-2xl border border-border/50 p-5">
      <h3 className="font-display font-semibold text-lg mb-4">Quick Add</h3>
      
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {quickActions.map(action => (
          <button
            key={action.category}
            onClick={() => onAddActivity?.(action.category)}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200",
              "hover:scale-105 active:scale-95",
              `${action.color}-soft`
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              action.color
            )}>
              <action.icon className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
