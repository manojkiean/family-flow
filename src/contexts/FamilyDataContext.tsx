/**
 * FamilyDataContext — fetches core data ONCE at app-level.
 * All pages read from this shared store — zero per-page refetch, zero flicker.
 */
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
    FamilyMember, Activity, ActivityCategory, RecurrenceType,
    Priority, UserRole, Post, Family
} from '@/types/family';

// ── Row types ────────────────────────────────────────────────────────────────

interface FamilyMemberRow {
    id: string; name: string; role: string;
    image_url?: string; email?: string; color: string;
    pin?: string; created_at: string;
}

interface ActivityRow {
    id: string; title: string; description: string | null;
    category: string; start_time: string; end_time: string | null;
    recurrence: string; assigned_to: string[]; assigned_children: string[];
    location: string | null; notes: string | null; priority: string;
    completed: boolean; created_by: string | null;
    created_at: string; updated_at: string;
}

interface PostRow {
    id: string; content: string; image_url: string | null;
    author_id: string; family_id: string;
    created_at: string; updated_at: string;
    family_members?: FamilyMemberRow;
}

// ── Mappers ──────────────────────────────────────────────────────────────────

function toFamilyMember(r: FamilyMemberRow): FamilyMember {
    return { id: r.id, name: r.name, role: r.role as UserRole, image_url: r.image_url, email: r.email, color: r.color, pin: r.pin };
}

function toActivity(r: ActivityRow): Activity {
    return {
        id: r.id, title: r.title, description: r.description ?? undefined,
        category: r.category as ActivityCategory,
        startTime: new Date(r.start_time),
        endTime: r.end_time ? new Date(r.end_time) : undefined,
        recurrence: r.recurrence as RecurrenceType,
        assignedTo: r.assigned_to ?? [], assignedChildren: r.assigned_children ?? [],
        location: r.location ?? undefined, notes: r.notes ?? undefined,
        priority: r.priority as Priority, completed: r.completed, createdBy: r.created_by || '',
    };
}

function toPost(r: PostRow): Post {
    return {
        id: r.id, content: r.content, image_url: r.image_url ?? undefined,
        author_id: r.author_id, family_id: r.family_id,
        created_at: r.created_at, updated_at: r.updated_at,
        author: r.family_members ? toFamilyMember(r.family_members) : undefined,
    };
}

// ── Context type ─────────────────────────────────────────────────────────────

interface FamilyDataContextValue {
    familyId: string | null;
    // Data
    familyMembers: FamilyMember[];
    activities: Activity[];
    posts: Post[];
    // Loading (only true on FIRST load — prevents flicker on navigation)
    membersLoading: boolean;
    activitiesLoading: boolean;
    postsLoading: boolean;
    // Refetch
    refetchMembers: () => void;
    refetchActivities: () => void;
    refetchPosts: () => void;
    // Direct setters (for optimistic updates)
    setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
    setFamilyMembers: React.Dispatch<React.SetStateAction<FamilyMember[]>>;
    setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
    // Activity mutations
    addActivity: (a: Omit<Activity, 'id'>) => Promise<Activity>;
    updateActivity: (id: string, updates: Partial<Activity>) => Promise<Activity>;
    toggleComplete: (id: string) => Promise<void>;
    deleteActivity: (id: string) => Promise<void>;
    // Member mutations
    addMember: (m: Omit<FamilyMember, 'id'>) => Promise<FamilyMember>;
    updateMember: (id: string, updates: Partial<FamilyMember>) => Promise<FamilyMember>;
    deleteMember: (id: string) => Promise<void>;
    // Post mutations
    addPost: (p: { content: string; image_url?: string; author_id: string }) => Promise<Post>;
    updatePost: (id: string, content: string) => Promise<Post>;
    deletePost: (id: string) => Promise<void>;
}

const FamilyDataContext = createContext<FamilyDataContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function FamilyDataProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();

    // ── Family ID ──────────────────────────────────────────────────────────────
    const [familyId, setFamilyId] = useState<string | null>(null);
    const [familyIdLoaded, setFamilyIdLoaded] = useState(false);

    useEffect(() => {
        if (!user) { setFamilyId(null); setFamilyIdLoaded(true); return; }
        supabase.from('profiles').select('family_id').eq('user_id', user.id).maybeSingle()
            .then(({ data }) => { setFamilyId(data?.family_id ?? null); setFamilyIdLoaded(true); });
    }, [user]);

    // ── Family Members ─────────────────────────────────────────────────────────
    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
    const [membersLoading, setMembersLoading] = useState(true);

    const fetchMembers = useCallback(async () => {
        if (!familyId) { setMembersLoading(false); return; }
        try {
            const { data, error } = await supabase.from('family_members').select('*').eq('family_id', familyId).order('created_at');
            if (!error && data) setFamilyMembers((data as FamilyMemberRow[]).map(toFamilyMember));
        } finally { setMembersLoading(false); }
    }, [familyId]);

    const addMember = useCallback(async (member: Omit<FamilyMember, 'id'>): Promise<FamilyMember> => {
        if (!familyId) throw new Error('No family found');
        const { data, error } = await supabase.from('family_members')
            .insert({ name: member.name, role: member.role, image_url: member.image_url || null, email: member.email || null, color: member.color, pin: member.pin || Math.floor(1000 + Math.random() * 9000).toString(), user_id: null, family_id: familyId })
            .select().single();
        if (error) throw error;
        const m = toFamilyMember(data as FamilyMemberRow);
        setFamilyMembers(prev => [...prev, m]);
        return m;
    }, [familyId]);

    const updateMember = useCallback(async (id: string, updates: Partial<FamilyMember>): Promise<FamilyMember> => {
        const { data, error } = await supabase.from('family_members')
            .update({ name: updates.name, role: updates.role, image_url: updates.image_url, email: updates.email, color: updates.color, pin: updates.pin })
            .eq('id', id).select().single();
        if (error) throw error;
        const m = toFamilyMember(data as FamilyMemberRow);
        setFamilyMembers(prev => prev.map(x => x.id === id ? m : x));
        return m;
    }, []);

    const deleteMember = useCallback(async (id: string) => {
        const { error } = await supabase.from('family_members').delete().eq('id', id);
        if (error) throw error;
        setFamilyMembers(prev => prev.filter(m => m.id !== id));
    }, []);

    // ── Activities ─────────────────────────────────────────────────────────────
    const [activities, setActivities] = useState<Activity[]>([]);
    const [activitiesLoading, setActivitiesLoading] = useState(true);

    const fetchActivities = useCallback(async () => {
        if (!familyId) { setActivitiesLoading(false); return; }
        try {
            const { data, error } = await supabase.from('activities').select('*').eq('family_id', familyId).order('start_time');
            if (!error && data) setActivities((data as ActivityRow[]).map(toActivity));
        } finally { setActivitiesLoading(false); }
    }, [familyId]);

    const addActivity = useCallback(async (activity: Omit<Activity, 'id'>): Promise<Activity> => {
        if (!familyId) throw new Error('No family found – complete onboarding first');
        if (!user) throw new Error('Not authenticated');
        const { data, error } = await supabase.from('activities')
            .insert({
                title: activity.title, description: activity.description,
                category: activity.category, start_time: activity.startTime.toISOString(),
                end_time: activity.endTime?.toISOString(), recurrence: activity.recurrence,
                assigned_to: activity.assignedTo, assigned_children: activity.assignedChildren,
                location: activity.location, notes: activity.notes, priority: activity.priority,
                completed: activity.completed, created_by: activity.createdBy,
                user_id: user.id, family_id: familyId
            }).select().single();
        if (error) throw error;
        const a = toActivity(data as ActivityRow);
        setActivities(prev => [...prev, a]);
        return a;
    }, [familyId, user]);

    const updateActivity = useCallback(async (id: string, updates: Partial<Activity>): Promise<Activity> => {
        const fields: Record<string, unknown> = {};
        if (updates.title !== undefined) fields.title = updates.title;
        if (updates.description !== undefined) fields.description = updates.description;
        if (updates.category !== undefined) fields.category = updates.category;
        if (updates.startTime !== undefined) fields.start_time = updates.startTime.toISOString();
        if (updates.endTime !== undefined) fields.end_time = updates.endTime.toISOString();
        if (updates.recurrence !== undefined) fields.recurrence = updates.recurrence;
        if (updates.assignedTo !== undefined) fields.assigned_to = updates.assignedTo;
        if (updates.assignedChildren !== undefined) fields.assigned_children = updates.assignedChildren;
        if (updates.location !== undefined) fields.location = updates.location;
        if (updates.notes !== undefined) fields.notes = updates.notes;
        if (updates.priority !== undefined) fields.priority = updates.priority;
        if (updates.completed !== undefined) fields.completed = updates.completed;
        const { data, error } = await supabase.from('activities').update(fields).eq('id', id).select().single();
        if (error) throw error;
        const a = toActivity(data as ActivityRow);
        setActivities(prev => prev.map(x => x.id === id ? a : x));
        return a;
    }, []);

    const toggleComplete = useCallback(async (id: string) => {
        const existing = activities.find(a => a.id === id);
        if (!existing) return;
        await updateActivity(id, { completed: !existing.completed });
    }, [activities, updateActivity]);

    const deleteActivity = useCallback(async (id: string) => {
        const { error } = await supabase.from('activities').delete().eq('id', id);
        if (error) throw error;
        setActivities(prev => prev.filter(a => a.id !== id));
    }, []);

    // ── Posts ──────────────────────────────────────────────────────────────────
    const [posts, setPosts] = useState<Post[]>([]);
    const [postsLoading, setPostsLoading] = useState(true);

    const fetchPosts = useCallback(async () => {
        if (!familyId) { setPostsLoading(false); return; }
        try {
            const { data, error } = await supabase.from('posts')
                .select('*, family_members(id, name, role, image_url, color, email, created_at)')
                .eq('family_id', familyId).order('created_at', { ascending: false });
            if (!error && data) setPosts((data as unknown as PostRow[]).map(toPost));
        } finally { setPostsLoading(false); }
    }, [familyId]);

    const addPost = useCallback(async (post: { content: string; image_url?: string; author_id: string }): Promise<Post> => {
        if (!familyId) throw new Error('No family found');
        const { data, error } = await supabase.from('posts')
            .insert({ content: post.content, image_url: post.image_url ?? null, author_id: post.author_id, family_id: familyId })
            .select('*, family_members(id, name, role, image_url, color, email, created_at)').single();
        if (error) throw error;
        const p = toPost(data as unknown as PostRow);
        setPosts(prev => [p, ...prev]);
        return p;
    }, [familyId]);

    const updatePost = useCallback(async (id: string, content: string): Promise<Post> => {
        const { data, error } = await supabase.from('posts').update({ content }).eq('id', id)
            .select('*, family_members(id, name, role, image_url, color, email, created_at)').single();
        if (error) throw error;
        const p = toPost(data as unknown as PostRow);
        setPosts(prev => prev.map(x => x.id === id ? p : x));
        return p;
    }, []);

    const deletePost = useCallback(async (id: string): Promise<void> => {
        const { error } = await supabase.from('posts').delete().eq('id', id);
        if (error) throw error;
        setPosts(prev => prev.filter(p => p.id !== id));
    }, []);

    // ── Initial fetch ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!familyIdLoaded) return;
        fetchMembers();
        fetchActivities();
        fetchPosts();
    }, [familyIdLoaded, fetchMembers, fetchActivities, fetchPosts]);

    // ── Realtime (single channel for all tables) ───────────────────────────────
    useEffect(() => {
        if (!familyId) return;
        const ch = supabase.channel(`family-${familyId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'family_members', filter: `family_id=eq.${familyId}` }, fetchMembers)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'activities', filter: `family_id=eq.${familyId}` }, fetchActivities)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'posts', filter: `family_id=eq.${familyId}` }, fetchPosts)
            .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, [familyId, fetchMembers, fetchActivities, fetchPosts]);

    return (
        <FamilyDataContext.Provider value={{
            familyId, familyMembers, activities, posts,
            membersLoading, activitiesLoading, postsLoading,
            refetchMembers: fetchMembers, refetchActivities: fetchActivities, refetchPosts: fetchPosts,
            setActivities, setFamilyMembers, setPosts,
            addActivity, updateActivity, toggleComplete, deleteActivity,
            addMember, updateMember, deleteMember,
            addPost, updatePost, deletePost,
        }}>
            {children}
        </FamilyDataContext.Provider>
    );
}

export function useFamilyData() {
    const ctx = useContext(FamilyDataContext);
    if (!ctx) throw new Error('useFamilyData must be used within FamilyDataProvider');
    return ctx;
}
