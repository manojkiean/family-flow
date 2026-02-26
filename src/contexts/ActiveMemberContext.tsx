import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { FamilyMember } from '@/types/family';
import { useAuth } from '@/hooks/useAuth';

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
  logoutProfile: () => void;
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
  setActiveMember: () => { },
  logoutProfile: () => { },
  permissions: defaultPermissions,
  isParent: false,
  isChild: false,
});

export function ActiveMemberProvider({ children, familyMembers }: { children: React.ReactNode; familyMembers: FamilyMember[] }) {
  const [activeMember, setActiveMemberState] = useState<FamilyMember | null>(null);
  const { user } = useAuth();

  // Load saved member from localStorage or match by email
  useEffect(() => {
    if (familyMembers.length === 0) return;
    const savedId = localStorage.getItem('activeMemberId');
    let found = savedId ? familyMembers.find(m => m.id === savedId) : null;

    // If not found in localStorage, try matching by current user email
    if (!found && user?.email) {
      found = familyMembers.find(m => m.email?.toLowerCase() === user.email?.toLowerCase()) || null;
    }

    if (found) {
      setActiveMemberState(found);
    }
  }, [familyMembers, user]);

  // Keep activeMember in sync with familyMembers data
  useEffect(() => {
    if (activeMember && familyMembers.length > 0) {
      const updated = familyMembers.find(m => m.id === activeMember.id);
      if (updated && (updated.name !== activeMember.name || updated.image_url !== activeMember.image_url)) {
        setActiveMemberState(updated);
      }
    }
  }, [familyMembers, activeMember]);

  const setActiveMember = (member: FamilyMember) => {
    setActiveMemberState(member);
    localStorage.setItem('activeMemberId', member.id);
  };

  const logoutProfile = () => {
    setActiveMemberState(null);
    localStorage.removeItem('activeMemberId');
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
    <ActiveMemberContext.Provider value={{ activeMember, setActiveMember, logoutProfile, permissions, isParent, isChild }}>
      {children}
    </ActiveMemberContext.Provider>
  );
}

export function useActiveMember() {
  return useContext(ActiveMemberContext);
}
