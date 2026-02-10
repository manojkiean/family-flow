import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { FamilyMember } from '@/types/family';

interface Permissions {
  canCreateActivity: boolean;
  canEditActivity: boolean;
  canDeleteActivity: boolean;
  canManageMembers: boolean;
  canAssignTasks: boolean;
  canViewAllActivities: boolean;
  canCompleteOwnTasks: boolean;
}

interface ActiveMemberContextType {
  activeMember: FamilyMember | null;
  setActiveMember: (member: FamilyMember) => void;
  permissions: Permissions;
  isParent: boolean;
  isChild: boolean;
}

const defaultPermissions: Permissions = {
  canCreateActivity: false,
  canEditActivity: false,
  canDeleteActivity: false,
  canManageMembers: false,
  canAssignTasks: false,
  canViewAllActivities: false,
  canCompleteOwnTasks: false,
};

const ActiveMemberContext = createContext<ActiveMemberContextType>({
  activeMember: null,
  setActiveMember: () => {},
  permissions: defaultPermissions,
  isParent: false,
  isChild: false,
});

export function ActiveMemberProvider({ children, familyMembers }: { children: React.ReactNode; familyMembers: FamilyMember[] }) {
  const [activeMember, setActiveMemberState] = useState<FamilyMember | null>(null);

  // Load saved member from localStorage
  useEffect(() => {
    if (familyMembers.length === 0) return;
    const savedId = localStorage.getItem('activeMemberId');
    const found = savedId ? familyMembers.find(m => m.id === savedId) : null;
    if (found) {
      setActiveMemberState(found);
    } else {
      // Default to first parent, or first member
      const defaultMember = familyMembers.find(m => m.role === 'parent') || familyMembers[0];
      setActiveMemberState(defaultMember);
      localStorage.setItem('activeMemberId', defaultMember.id);
    }
  }, [familyMembers]);

  // Keep activeMember in sync with familyMembers data
  useEffect(() => {
    if (activeMember && familyMembers.length > 0) {
      const updated = familyMembers.find(m => m.id === activeMember.id);
      if (updated && (updated.name !== activeMember.name || updated.avatar !== activeMember.avatar)) {
        setActiveMemberState(updated);
      }
    }
  }, [familyMembers, activeMember]);

  const setActiveMember = (member: FamilyMember) => {
    setActiveMemberState(member);
    localStorage.setItem('activeMemberId', member.id);
  };

  const isParent = activeMember?.role === 'parent';
  const isChild = activeMember?.role === 'child';

  const permissions = useMemo<Permissions>(() => {
    if (!activeMember) return defaultPermissions;

    if (isParent) {
      return {
        canCreateActivity: true,
        canEditActivity: true,
        canDeleteActivity: true,
        canManageMembers: true,
        canAssignTasks: true,
        canViewAllActivities: true,
        canCompleteOwnTasks: true,
      };
    }

    // Child permissions
    return {
      canCreateActivity: false,
      canEditActivity: false,
      canDeleteActivity: false,
      canManageMembers: false,
      canAssignTasks: false,
      canViewAllActivities: false,
      canCompleteOwnTasks: true,
    };
  }, [activeMember, isParent]);

  return (
    <ActiveMemberContext.Provider value={{ activeMember, setActiveMember, permissions, isParent, isChild }}>
      {children}
    </ActiveMemberContext.Provider>
  );
}

export function useActiveMember() {
  return useContext(ActiveMemberContext);
}
