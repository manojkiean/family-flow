import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FamilyMember, Activity, ActivityCategory, RecurrenceType, Priority, UserRole } from '@/types/family';
import { useAuth } from '@/hooks/useAuth';

// DB row types
interface FamilyMemberRow {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  created_at: string;
}

interface ActivityRow {
  id: string;
  title: string;
  description: string | null;
  category: string;
  start_time: string;
  end_time: string | null;
  recurrence: string;
  assigned_to: string[];
  assigned_children: string[];
  location: string | null;
  notes: string | null;
  priority: string;
  completed: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

function toFamilyMember(row: FamilyMemberRow): FamilyMember {
  return {
    id: row.id,
    name: row.name,
    role: row.role as UserRole,
    avatar: row.avatar,
    color: row.color,
  };
}

function toActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    category: row.category as ActivityCategory,
    startTime: new Date(row.start_time),
    endTime: row.end_time ? new Date(row.end_time) : undefined,
    recurrence: row.recurrence as RecurrenceType,
    assignedTo: row.assigned_to ?? [],
    assignedChildren: row.assigned_children ?? [],
    location: row.location ?? undefined,
    notes: row.notes ?? undefined,
    priority: row.priority as Priority,
    completed: row.completed,
    createdBy: row.created_by ?? '',
  };
}

export function useFamilyMembers() {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('family_members')
        .select('*')
        .order('created_at');
      if (err) throw err;
      setFamilyMembers((data as unknown as FamilyMemberRow[]).map(toFamilyMember));
    } catch (err) {
      console.error('Error fetching family members:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch family members');
    } finally {
      setLoading(false);
    }
  }, []);

  const addMember = useCallback(async (member: Omit<FamilyMember, 'id'>) => {
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('family_members')
      .insert({ name: member.name, role: member.role, avatar: member.avatar, color: member.color, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    const newMember = toFamilyMember(data as unknown as FamilyMemberRow);
    setFamilyMembers(prev => [...prev, newMember]);
    return newMember;
  }, [user]);

  const updateMember = useCallback(async (id: string, updates: Partial<FamilyMember>) => {
    const { data, error } = await supabase
      .from('family_members')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    const updated = toFamilyMember(data as unknown as FamilyMemberRow);
    setFamilyMembers(prev => prev.map(m => m.id === id ? updated : m));
    return updated;
  }, []);

  const deleteMember = useCallback(async (id: string) => {
    const { error } = await supabase.from('family_members').delete().eq('id', id);
    if (error) throw error;
    setFamilyMembers(prev => prev.filter(m => m.id !== id));
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  return { familyMembers, loading, error, refetch: fetchMembers, addMember, updateMember, deleteMember };
}

export function useActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('activities')
        .select('*')
        .order('start_time');
      if (err) throw err;
      setActivities((data as unknown as ActivityRow[]).map(toActivity));
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  }, []);

  const { user } = useAuth();

  const addActivity = useCallback(async (activity: Omit<Activity, 'id'>) => {
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('activities')
      .insert({
        title: activity.title,
        description: activity.description,
        category: activity.category,
        start_time: activity.startTime.toISOString(),
        end_time: activity.endTime?.toISOString(),
        recurrence: activity.recurrence,
        assigned_to: activity.assignedTo,
        assigned_children: activity.assignedChildren,
        location: activity.location,
        notes: activity.notes,
        priority: activity.priority,
        completed: activity.completed,
        created_by: activity.createdBy,
        user_id: user.id,
      })
      .select()
      .single();
    if (error) throw error;
    const newActivity = toActivity(data as unknown as ActivityRow);
    setActivities(prev => [...prev, newActivity]);
    return newActivity;
  }, [user]);

  const updateActivity = useCallback(async (id: string, updates: Partial<Activity>) => {
    const fields: Record<string, unknown> = {};
    if (updates.title !== undefined) fields.title = updates.title;
    if (updates.description !== undefined) fields.description = updates.description;
    if (updates.category !== undefined) fields.category = updates.category;
    if (updates.startTime !== undefined) fields.start_time = updates.startTime.toISOString();
    if (updates.endTime !== undefined) fields.end_time = updates.endTime?.toISOString();
    if (updates.recurrence !== undefined) fields.recurrence = updates.recurrence;
    if (updates.assignedTo !== undefined) fields.assigned_to = updates.assignedTo;
    if (updates.assignedChildren !== undefined) fields.assigned_children = updates.assignedChildren;
    if (updates.location !== undefined) fields.location = updates.location;
    if (updates.notes !== undefined) fields.notes = updates.notes;
    if (updates.priority !== undefined) fields.priority = updates.priority;
    if (updates.completed !== undefined) fields.completed = updates.completed;

    const { data, error } = await supabase
      .from('activities')
      .update(fields)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    const updated = toActivity(data as unknown as ActivityRow);
    setActivities(prev => prev.map(a => a.id === id ? updated : a));
    return updated;
  }, []);

  const deleteActivity = useCallback(async (id: string) => {
    const { error } = await supabase.from('activities').delete().eq('id', id);
    if (error) throw error;
    setActivities(prev => prev.filter(a => a.id !== id));
  }, []);

  const toggleComplete = useCallback(async (id: string) => {
    const activity = activities.find(a => a.id === id);
    if (activity) {
      return updateActivity(id, { completed: !activity.completed });
    }
  }, [activities, updateActivity]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  return { activities, loading, error, refetch: fetchActivities, addActivity, updateActivity, deleteActivity, toggleComplete };
}
