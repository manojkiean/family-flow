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
  isChildLogin: boolean; // true when logged in via child PIN (locks the profile switcher)
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
  isChildLogin: false,
});

export function ActiveMemberProvider({ children, familyMembers }: { children: React.ReactNode; familyMembers: FamilyMember[] }) {
  const [activeMember, setActiveMemberState] = useState<FamilyMember | null>(null);
  const [isChildLogin, setIsChildLogin] = useState(false);
  const { user } = useAuth();

  // Load saved member from localStorage, or auto-select child after PIN login
  useEffect(() => {
    if (familyMembers.length === 0) return;

    // Priority 1: child PIN login — auto-select and lock to that child
    const childLoginEmail = localStorage.getItem('childLoginEmail');
    if (childLoginEmail) {
      const childMember = familyMembers.find(
        m => m.email?.toLowerCase() === childLoginEmail.toLowerCase() && m.role === 'child'
      );
      if (childMember) {
        setActiveMemberState(childMember);
        localStorage.setItem('activeMemberId', childMember.id);
        localStorage.setItem('isChildLogin', 'true');
        localStorage.removeItem('childLoginEmail'); // consume it
        setIsChildLogin(true);
        return;
      }
      localStorage.removeItem('childLoginEmail');
    }

    // Restore isChildLogin flag across refreshes
    if (localStorage.getItem('isChildLogin') === 'true') {
      setIsChildLogin(true);
    }

    // Priority 2: restore previously saved member id
    const savedId = localStorage.getItem('activeMemberId');
    let found = savedId ? familyMembers.find(m => m.id === savedId) : null;

    // Priority 3: match by current user email
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
    setIsChildLogin(false);
    localStorage.removeItem('activeMemberId');
    localStorage.removeItem('isChildLogin');
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
    <ActiveMemberContext.Provider value={{ activeMember, setActiveMember, logoutProfile, permissions, isParent, isChild, isChildLogin }}>
      {children}
    </ActiveMemberContext.Provider>
  );
}

export function useActiveMember() {
  return useContext(ActiveMemberContext);
}
