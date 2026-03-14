import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FamilyMember, Activity, ActivityCategory, RecurrenceType, Priority, UserRole, Post, Family } from '@/types/family';
import { useAuth } from '@/hooks/useAuth';

// DB row types
interface FamilyMemberRow {
  id: string;
  name: string;
  role: string;
  image_url?: string;
  email?: string;
  color: string;
  pin?: string;
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

interface PostRow {
  id: string;
  content: string;
  image_url: string | null;
  author_id: string;
  family_id: string;
  created_at: string;
  updated_at: string;
  family_members?: FamilyMemberRow;
}

function toFamilyMember(row: FamilyMemberRow): FamilyMember {
  return {
    id: row.id,
    name: row.name,
    role: row.role as UserRole,
    image_url: row.image_url,
    email: row.email,
    color: row.color,
    pin: row.pin,
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
    createdBy: row.created_by || '',
  };
}

function toPost(row: PostRow): Post {
  return {
    id: row.id,
    content: row.content,
    image_url: row.image_url ?? undefined,
    author_id: row.author_id,
    family_id: row.family_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author: row.family_members ? toFamilyMember(row.family_members) : undefined,
  };
}

export function useFamilyId() {
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('family_id')
        .eq('user_id', user.id)
        .maybeSingle() // Use maybeSingle to avoid errors if profile is still being created
        .then(({ data, error }) => {
          if (error) {
            console.error("Error fetching familyId:", error);
            setFamilyId(null); // Set familyId to null on error
          } else if (data?.family_id) {
            setFamilyId(data.family_id);
          } else {
            // Profile might not exist yet, or family_id is null
            setFamilyId(null);
          }
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [user]);

  return { familyId, loading };
}

export function useFamilyMembers() {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const { familyId, loading: familyLoading } = useFamilyId();

  const fetchMembers = useCallback(async () => {
    if (!familyId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at');
      if (err) throw err;
      setFamilyMembers((data as unknown as FamilyMemberRow[]).map(toFamilyMember));
    } catch (err) {
      console.error('Error fetching family members:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch family members');
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  const addMember = useCallback(async (member: Omit<FamilyMember, 'id'>) => {
    if (!familyId) throw new Error('Family not found');
    const { data, error } = await supabase
      .from('family_members')
      .insert({
        name: member.name,
        role: member.role,
        image_url: member.image_url || null,
        email: member.email || null,
        color: member.color,
        pin: member.pin || Math.floor(1000 + Math.random() * 9000).toString(),
        // user_id is null for new members — they get linked when they first log in
        user_id: null,
        family_id: familyId
      })
      .select()
      .single();
    if (error) throw error;
    const newMember = toFamilyMember(data as unknown as FamilyMemberRow);
    setFamilyMembers(prev => [...prev, newMember]);
    return newMember;
  }, [familyId]);

  const updateMember = useCallback(async (id: string, updates: Partial<FamilyMember>) => {
    const { data, error } = await supabase
      .from('family_members')
      .update({
        name: updates.name,
        role: updates.role,
        image_url: updates.image_url,
        email: updates.email,
        color: updates.color,
        pin: updates.pin,
      })
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

  const { familyId } = useFamilyId();

  const fetchActivities = useCallback(async () => {
    if (!familyId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('activities')
        .select('*')
        .eq('family_id', familyId)
        .order('start_time');
      if (err) throw err;
      setActivities((data as unknown as ActivityRow[]).map(toActivity));
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  const { user } = useAuth();

  const addActivity = useCallback(async (activity: Omit<Activity, 'id'>) => {
    if (!familyId) throw new Error('No family found – complete onboarding first');
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
        family_id: familyId
      })
      .select()
      .single();
    if (error) throw error;
    const newActivity = toActivity(data as unknown as ActivityRow);
    setActivities(prev => [...prev, newActivity]);
    return newActivity;
  }, [familyId, user]);

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

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { familyId } = useFamilyId();

  const fetchPosts = useCallback(async () => {
    if (!familyId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('posts')
        .select('*, family_members(*)')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false });
      if (err) throw err;
      setPosts((data as unknown as PostRow[]).map(toPost));
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  const addPost = useCallback(async (post: { content: string, image_url?: string, author_id: string }) => {
    if (!familyId) throw new Error('Family not found');
    const { data, error } = await supabase
      .from('posts')
      .insert({
        content: post.content,
        image_url: post.image_url,
        author_id: post.author_id,
        family_id: familyId
      })
      .select('*, family_members(*)')
      .single();
    if (error) throw error;
    const newPost = toPost(data as unknown as PostRow);
    setPosts(prev => [newPost, ...prev]);
    return newPost;
  }, [familyId]);

  const updatePost = useCallback(async (id: string, content: string) => {
    const { data, error } = await supabase
      .from('posts')
      .update({ content })
      .eq('id', id)
      .select('*, family_members(*)')
      .single();
    if (error) throw error;
    const updated = toPost(data as unknown as PostRow);
    setPosts(prev => prev.map(p => p.id === id ? updated : p));
    return updated;
  }, []);

  const deletePost = useCallback(async (id: string) => {
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) throw error;
    setPosts(prev => prev.filter(p => p.id !== id));
  }, []);

  useEffect(() => {
    fetchPosts();

    // Real-time subscription
    const channel = supabase
      .channel('public:posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPosts]);

  return { posts, loading, error, refetch: fetchPosts, addPost, updatePost, deletePost };
}

export function useFamilies() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchFamilies = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // 1. Fetch families owned by the user
      const { data: owned, error: ownedError } = await supabase
        .from('families')
        .select('*')
        .eq('owner_id', user.id);

      if (ownedError) throw ownedError;

      // 2. Get family_ids where user is a member (flat query — no relationship join)
      const { data: memberRows, error: memberError } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('user_id', user.id)
        .not('family_id', 'is', null);

      if (memberError) throw memberError;

      // 3. Fetch those families directly
      const memberFamilyIds = (memberRows || [])
        .map(r => r.family_id)
        .filter(Boolean) as string[];

      let memberFamilies: any[] = [];
      if (memberFamilyIds.length > 0) {
        const { data: mf, error: mfError } = await supabase
          .from('families')
          .select('*')
          .in('id', memberFamilyIds);

        if (mfError) throw mfError;
        memberFamilies = mf || [];
      }

      // 4. Combine and deduplicate
      const all = [...(owned || []), ...memberFamilies];
      const unique = all.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

      setFamilies(unique.map(f => ({
        id: f.id,
        name: f.name,
        owner_id: f.owner_id
      })));
    } catch (err) {
      console.error('Error fetching families:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const switchFamily = async (familyId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ family_id: familyId })
        .eq('user_id', user.id);

      if (error) throw error;

      // Reload the page to refresh all contexts and data
      window.location.reload();
    } catch (err) {
      console.error('Error switching family:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchFamilies();
  }, [fetchFamilies]);

  return { families, loading, refetch: fetchFamilies, switchFamily };
}
