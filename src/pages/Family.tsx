import { AppLayout } from '@/components/layout/AppLayout';
import { familyMembers, activities } from '@/data/mockData';
import { FamilyMember, Activity } from '@/types/family';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Settings, ChevronRight, Crown, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const FamilyPage = () => {
  const getMemberStats = (member: FamilyMember) => {
    const memberActivities = activities.filter(
      a => a.assignedTo.includes(member.id) || a.assignedChildren.includes(member.id)
    );
    return {
      total: memberActivities.length,
      completed: memberActivities.filter(a => a.completed).length,
      pending: memberActivities.filter(a => !a.completed).length,
    };
  };

  const parents = familyMembers.filter(m => m.role === 'parent');
  const children = familyMembers.filter(m => m.role === 'child');

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-2xl">Family Members</h1>
            <p className="text-muted-foreground">
              {familyMembers.length} members · {parents.length} parents · {children.length} children
            </p>
          </div>

          <Button className="gradient-warm shadow-soft">
            <Plus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </div>

        {/* Parents Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Crown className="h-5 w-5 text-primary" />
            <h2 className="font-display font-semibold text-lg">Parents</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {parents.map(member => {
              const stats = getMemberStats(member);
              return (
                <div
                  key={member.id}
                  className="group relative overflow-hidden bg-card rounded-2xl border border-border/50 p-6 transition-all duration-300 hover:shadow-elevated hover:-translate-y-1"
                >
                  <div 
                    className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2"
                    style={{ background: member.color }}
                  />

                  <div className="relative flex items-start gap-4">
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-soft"
                      style={{ backgroundColor: `${member.color}20` }}
                    >
                      {member.avatar}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-display font-bold text-xl">{member.name}</h3>
                        <Badge variant="secondary" className="capitalize">
                          {member.role}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-4">Full access to manage activities</p>

                      <div className="flex gap-6">
                        <div>
                          <p className="text-2xl font-bold">{stats.pending}</p>
                          <p className="text-xs text-muted-foreground">Pending Tasks</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-accent">{stats.completed}</p>
                          <p className="text-xs text-muted-foreground">Completed</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-primary">
                            {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                          </p>
                          <p className="text-xs text-muted-foreground">Completion</p>
                        </div>
                      </div>
                    </div>

                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Settings className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Children Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-category-home" />
            <h2 className="font-display font-semibold text-lg">Children</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map(member => {
              const stats = getMemberStats(member);
              return (
                <div
                  key={member.id}
                  className="group relative overflow-hidden bg-card rounded-2xl border border-border/50 p-5 transition-all duration-300 hover:shadow-elevated hover:-translate-y-1"
                >
                  <div 
                    className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2"
                    style={{ background: member.color }}
                  />

                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div 
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                        style={{ backgroundColor: `${member.color}20` }}
                      >
                        {member.avatar}
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-lg">{member.name}</h3>
                        <Badge variant="outline" className="capitalize text-xs">
                          {member.role}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex gap-4 mb-4">
                      <div className="flex-1 bg-muted/50 rounded-xl p-3 text-center">
                        <p className="text-xl font-bold">{stats.pending}</p>
                        <p className="text-xs text-muted-foreground">To Do</p>
                      </div>
                      <div className="flex-1 bg-accent/10 rounded-xl p-3 text-center">
                        <p className="text-xl font-bold text-accent">{stats.completed}</p>
                        <p className="text-xs text-muted-foreground">Done</p>
                      </div>
                    </div>

                    <Button variant="ghost" size="sm" className="w-full justify-between">
                      View Activities
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Permissions Info */}
        <div className="bg-secondary/50 rounded-2xl p-6">
          <h3 className="font-display font-semibold text-lg mb-2">Role Permissions</h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-foreground mb-1">Parents</p>
              <ul className="text-muted-foreground space-y-1">
                <li>✓ Create, edit, and delete activities</li>
                <li>✓ Manage family members</li>
                <li>✓ Assign tasks to anyone</li>
                <li>✓ View all family activities</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Children</p>
              <ul className="text-muted-foreground space-y-1">
                <li>✓ View assigned activities</li>
                <li>✓ Mark tasks as complete</li>
                <li>○ Cannot modify others' tasks</li>
                <li>○ Cannot manage family members</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default FamilyPage;
