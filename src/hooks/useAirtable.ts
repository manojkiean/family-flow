 import { useState, useEffect, useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { FamilyMember, Activity, ActivityCategory, RecurrenceType, Priority, UserRole } from '@/types/family';
 
 interface AirtableRecord {
   id: string;
   fields: Record<string, unknown>;
 }
 
 // Transform Airtable record to FamilyMember
 function transformToFamilyMember(record: AirtableRecord): FamilyMember {
   const fields = record.fields;
   return {
     id: record.id,
     name: (fields.name as string) || '',
     role: (fields.role as UserRole) || 'parent',
     avatar: (fields.avatar as string) || '👤',
     color: (fields.color as string) || 'hsl(210 60% 50%)',
   };
 }
 
 // Transform Airtable record to Activity
 function transformToActivity(record: AirtableRecord): Activity {
   const fields = record.fields;
   return {
     id: record.id,
     title: (fields.title as string) || '',
     description: fields.description as string | undefined,
     category: (fields.category as ActivityCategory) || 'personal',
     startTime: new Date(fields.startTime as string),
     endTime: fields.endTime ? new Date(fields.endTime as string) : undefined,
     recurrence: (fields.recurrence as RecurrenceType) || 'once',
     assignedTo: (fields.assignedTo as string[]) || [],
     assignedChildren: (fields.assignedChildren as string[]) || [],
     location: fields.location as string | undefined,
     notes: fields.notes as string | undefined,
     priority: (fields.priority as Priority) || 'medium',
     completed: (fields.completed as boolean) || false,
     createdBy: (fields.createdBy as string) || '',
   };
 }
 
 // Transform FamilyMember to Airtable fields
 function familyMemberToFields(member: Omit<FamilyMember, 'id'>) {
   return {
     name: member.name,
     role: member.role,
     avatar: member.avatar,
     color: member.color,
   };
 }
 
 // Transform Activity to Airtable fields
 function activityToFields(activity: Omit<Activity, 'id'>) {
   return {
     title: activity.title,
     description: activity.description,
     category: activity.category,
     startTime: activity.startTime.toISOString(),
     endTime: activity.endTime?.toISOString(),
     recurrence: activity.recurrence,
     assignedTo: activity.assignedTo,
     assignedChildren: activity.assignedChildren,
     location: activity.location,
     notes: activity.notes,
     priority: activity.priority,
     completed: activity.completed,
     createdBy: activity.createdBy,
   };
 }
 
 async function callAirtable(payload: Record<string, unknown>) {
   const { data, error } = await supabase.functions.invoke('airtable', {
     body: payload,
   });
   
   if (error) throw error;
   return data;
 }
 
 export function useFamilyMembers() {
   const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   const fetchMembers = useCallback(async () => {
     try {
       setLoading(true);
       setError(null);
       const result = await callAirtable({ action: 'list', table: 'Family Members' });
       const members = (result.records || []).map(transformToFamilyMember);
       setFamilyMembers(members);
     } catch (err) {
       console.error('Error fetching family members:', err);
       setError(err instanceof Error ? err.message : 'Failed to fetch family members');
     } finally {
       setLoading(false);
     }
   }, []);
 
   const addMember = useCallback(async (member: Omit<FamilyMember, 'id'>) => {
     try {
       const result = await callAirtable({
         action: 'create',
         table: 'Family Members',
         fields: familyMemberToFields(member),
       });
       const newMember = transformToFamilyMember(result);
       setFamilyMembers(prev => [...prev, newMember]);
       return newMember;
     } catch (err) {
       console.error('Error adding family member:', err);
       throw err;
     }
   }, []);
 
   const updateMember = useCallback(async (id: string, updates: Partial<FamilyMember>) => {
     try {
       const result = await callAirtable({
         action: 'update',
         table: 'Family Members',
         recordId: id,
         fields: updates,
       });
       const updated = transformToFamilyMember(result);
       setFamilyMembers(prev => prev.map(m => m.id === id ? updated : m));
       return updated;
     } catch (err) {
       console.error('Error updating family member:', err);
       throw err;
     }
   }, []);
 
   const deleteMember = useCallback(async (id: string) => {
     try {
       await callAirtable({
         action: 'delete',
         table: 'Family Members',
         recordId: id,
       });
       setFamilyMembers(prev => prev.filter(m => m.id !== id));
     } catch (err) {
       console.error('Error deleting family member:', err);
       throw err;
     }
   }, []);
 
   useEffect(() => {
     fetchMembers();
   }, [fetchMembers]);
 
   return {
     familyMembers,
     loading,
     error,
     refetch: fetchMembers,
     addMember,
     updateMember,
     deleteMember,
   };
 }
 
 export function useActivities() {
   const [activities, setActivities] = useState<Activity[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   const fetchActivities = useCallback(async () => {
     try {
       setLoading(true);
       setError(null);
       const result = await callAirtable({ action: 'list', table: 'Activities' });
       const items = (result.records || []).map(transformToActivity);
       setActivities(items);
     } catch (err) {
       console.error('Error fetching activities:', err);
       setError(err instanceof Error ? err.message : 'Failed to fetch activities');
     } finally {
       setLoading(false);
     }
   }, []);
 
   const addActivity = useCallback(async (activity: Omit<Activity, 'id'>) => {
     try {
       const result = await callAirtable({
         action: 'create',
         table: 'Activities',
         fields: activityToFields(activity),
       });
       const newActivity = transformToActivity(result);
       setActivities(prev => [...prev, newActivity]);
       return newActivity;
     } catch (err) {
       console.error('Error adding activity:', err);
       throw err;
     }
   }, []);
 
   const updateActivity = useCallback(async (id: string, updates: Partial<Activity>) => {
     try {
       const fields: Record<string, unknown> = {};
       if (updates.title !== undefined) fields.title = updates.title;
       if (updates.description !== undefined) fields.description = updates.description;
       if (updates.category !== undefined) fields.category = updates.category;
       if (updates.startTime !== undefined) fields.startTime = updates.startTime.toISOString();
       if (updates.endTime !== undefined) fields.endTime = updates.endTime?.toISOString();
       if (updates.recurrence !== undefined) fields.recurrence = updates.recurrence;
       if (updates.assignedTo !== undefined) fields.assignedTo = updates.assignedTo;
       if (updates.assignedChildren !== undefined) fields.assignedChildren = updates.assignedChildren;
       if (updates.location !== undefined) fields.location = updates.location;
       if (updates.notes !== undefined) fields.notes = updates.notes;
       if (updates.priority !== undefined) fields.priority = updates.priority;
       if (updates.completed !== undefined) fields.completed = updates.completed;
       
       const result = await callAirtable({
         action: 'update',
         table: 'Activities',
         recordId: id,
         fields,
       });
       const updated = transformToActivity(result);
       setActivities(prev => prev.map(a => a.id === id ? updated : a));
       return updated;
     } catch (err) {
       console.error('Error updating activity:', err);
       throw err;
     }
   }, []);
 
   const deleteActivity = useCallback(async (id: string) => {
     try {
       await callAirtable({
         action: 'delete',
         table: 'Activities',
         recordId: id,
       });
       setActivities(prev => prev.filter(a => a.id !== id));
     } catch (err) {
       console.error('Error deleting activity:', err);
       throw err;
     }
   }, []);
 
   const toggleComplete = useCallback(async (id: string) => {
     const activity = activities.find(a => a.id === id);
     if (activity) {
       return updateActivity(id, { completed: !activity.completed });
     }
   }, [activities, updateActivity]);
 
   useEffect(() => {
     fetchActivities();
   }, [fetchActivities]);
 
   return {
     activities,
     loading,
     error,
     refetch: fetchActivities,
     addActivity,
     updateActivity,
     deleteActivity,
     toggleComplete,
   };
 }