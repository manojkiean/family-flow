import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamilyMembers, useActivities } from '@/hooks/useDatabase';
import { supabase } from '@/integrations/supabase/client';
import { useActiveMember } from '@/contexts/ActiveMemberContext';
import { FamilyMember } from '@/types/family';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Settings, ChevronRight, Crown, Baby, Loader2, Save, X, Upload, User, Trash2, Image as ImageIcon, KeyRound, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const roleIcon = {
  parent: Crown,
  child: Baby,
};

const FamilyPage = () => {
  const navigate = useNavigate();
  const { familyMembers, loading: membersLoading, updateMember, addMember, deleteMember } = useFamilyMembers();
  const { activities, loading: activitiesLoading } = useActivities();
  const { permissions, activeMember } = useActiveMember();
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [editName, setEditName] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editPin, setEditPin] = useState('');
  const [showPinMap, setShowPinMap] = useState<Record<string, boolean>>({});

  const [newName, setNewName] = useState('');
  const [newImage, setNewImage] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'parent' | 'child'>('child');
  const [newPin, setNewPin] = useState('');
  const [adding, setAdding] = useState(false);

  const loading = membersLoading || activitiesLoading;

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

  const openEditDialog = (member: FamilyMember) => {
    setEditingMember(member);
    setEditName(member.name);
    setEditImage(member.image_url || '');
    setEditEmail(member.email || '');
    setEditPin(member.pin || '');
  };

  const regeneratePin = () => {
    setEditPin(Math.floor(1000 + Math.random() * 9000).toString());
  };

  const togglePinVisibility = (memberId: string) => {
    setShowPinMap(prev => ({ ...prev, [memberId]: !prev[memberId] }));
  };

  const handleSaveEdit = async () => {
    if (!editingMember) return;
    setSaving(true);
    const emailChanged = editEmail !== editingMember.email;

    try {
      await updateMember(editingMember.id, {
        name: editName,
        image_url: editImage,
        email: editEmail,
        pin: editPin || editingMember.pin,
      });

      if (emailChanged && editEmail) {
        await supabase.auth.signInWithOtp({
          email: editEmail,
          options: { emailRedirectTo: window.location.origin }
        });
        toast({ title: "New Invite Sent", description: `A login link has been sent to: ${editEmail}` });
      } else {
        toast({ title: "Updated", description: `${editName} has been updated.` });
      }
      setEditingMember(null);
    } catch {
      toast({ title: "Error", description: "Failed to update member", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!editingMember) return;

    // Safety check: Don't let parent delete themselves from here.
    if (editingMember.id === activeMember?.id) {
      toast({ title: "Safety Alert", description: "You cannot delete your own profile from here.", variant: "destructive" });
      return;
    }

    if (!window.confirm(`Are you sure you want to remove ${editingMember.name} from the family? This will not delete their account, but they will lose access to this hub.`)) {
      return;
    }

    setDeleting(true);
    try {
      await deleteMember(editingMember.id);
      toast({ title: "Member Removed", description: `${editingMember.name} has been removed from the family.` });
      setEditingMember(null);
    } catch (err) {
      toast({ title: "Error", description: "Failed to remove member", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const handleAddMember = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const generatedPin = newPin.trim() || Math.floor(1000 + Math.random() * 9000).toString();
      const newMember = await addMember({
        name: newName,
        role: newRole,
        image_url: newImage,
        email: newEmail,
        pin: generatedPin,
        color: `hsl(${Math.floor(Math.random() * 360)} 60% 50%)`
      });

      if (newEmail) {
        await supabase.auth.signInWithOtp({
          email: newEmail,
          options: { emailRedirectTo: window.location.origin }
        });
        toast({ title: "Invite Sent", description: `A login link has been sent to ${newEmail}. Their PIN is: ${generatedPin}` });
      } else {
        toast({ title: "Member Added", description: `${newName} added. Their PIN is: ${generatedPin}` });
      }
      setAddDialogOpen(false);
      setNewImage('');
      setNewEmail('');
      setNewRole('child');
      setNewPin('');
    } catch (err: any) {
      console.error('Add member error:', err);
      toast({ title: "Error", description: err.message || "Failed to add member", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, isEditingForm: boolean) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('family-app')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('family-app')
        .getPublicUrl(filePath);

      if (isEditingForm) {
        setEditImage(publicUrl);
      } else {
        setNewImage(publicUrl);
      }

      toast({ title: "Success", description: "Image uploaded successfully." });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: "Upload failed", description: "Could not upload image. Make sure the 'family-app' bucket exists.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleViewActivities = (memberId: string) => {
    navigate(`/activities?member=${memberId}`);
  };

  const parents = familyMembers.filter(m => m.role === 'parent');
  const children = familyMembers.filter(m => m.role === 'child');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        </div>
            <p className="text-muted-foreground">
              {familyMembers.length} members · {parents.length} parents · {children.length} children
            </p>
          </div>

          {permissions.canManageMembers && (
            <Button className="gradient-warm shadow-soft" onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          )}
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
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-soft overflow-hidden"
                      style={{ backgroundColor: `${member.color}20` }}
                    >
                      {member.image_url ? (
                        <img src={member.image_url} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        (() => {
                          const Icon = roleIcon[member.role] ?? User;
                          return <Icon className="h-8 w-8 text-muted-foreground" />;
                        })()
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-display font-bold text-xl">{member.name}</h3>
                        <Badge variant="secondary" className="capitalize">
                          {member.role}
                        </Badge>
                      </div>

                      {member.email && (
                        <p className="text-xs text-muted-foreground mb-1 mt-[-2px]">{member.email}</p>
                      )}

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

                    {permissions.canManageMembers && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => openEditDialog(member)}
                      >
                        <Settings className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Children Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Baby className="h-5 w-5 text-category-home" />
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
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl overflow-hidden"
                        style={{ backgroundColor: `${member.color}20` }}
                      >
                        {member.image_url ? (
                          <img src={member.image_url} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <Baby className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display font-bold text-lg leading-tight truncate">{member.name}</h3>
                        <div className="flex flex-col gap-1 items-start mt-1">
                          {member.email && (
                            <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{member.email}</p>
                          )}
                          <Badge variant="outline" className="capitalize text-[10px] px-1.5 h-4">
                            {member.role}
                          </Badge>
                        </div>
                      </div>
                      {permissions.canManageMembers && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => openEditDialog(member)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* PIN badge — visible to parents only */}
                    {permissions.canManageMembers && member.pin && (
                      <div className="flex items-center gap-2 mb-3 px-1">
                        <KeyRound className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground">PIN:</span>
                        <span className="font-mono font-bold text-sm tracking-widest">
                          {showPinMap[member.id] ? member.pin : '••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePinVisibility(member.id)}
                          className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
                          title={showPinMap[member.id] ? 'Hide PIN' : 'Show PIN'}
                        >
                          {showPinMap[member.id]
                            ? <EyeOff className="h-3.5 w-3.5" />
                            : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    )}

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

                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-between"
                      onClick={() => handleViewActivities(member.id)}
                    >
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

      {/* Edit Member Dialog */}
      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Edit Family Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/30">
                  {editImage ? (
                    <img src={editImage} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-10 w-10 text-muted-foreground" />
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full cursor-pointer shadow-soft hover:scale-110 transition-transform">
                  <Upload className="h-4 w-4" />
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, true)} disabled={uploading} />
                </label>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Upload Profile Photo</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Name</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-muted/50 border-0"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email Address</label>
              <Input
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="email@example.com"
                className="bg-muted/50 border-0"
              />
            </div>
            {editingMember?.role === 'child' && (
              <div>
                <label className="text-sm font-medium mb-1.5 block flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5" /> Login PIN
                </label>
                <div className="flex gap-2">
                  <Input
                    value={editPin}
                    onChange={(e) => setEditPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="4-digit PIN"
                    inputMode="numeric"
                    maxLength={4}
                    className="bg-muted/50 border-0 font-mono tracking-widest text-center text-lg"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={regeneratePin}
                    title="Generate new PIN"
                    className="shrink-0"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Share this PIN with {editingMember.name} — they use it with their email to log in.
                </p>
              </div>
            )}
            <div className="flex gap-3 justify-between pt-2">
              <Button
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={handleDeleteMember}
                disabled={deleting}
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Delete
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setEditingMember(null)}>
                  Cancel
                </Button>
                <Button className="gradient-warm" onClick={handleSaveEdit} disabled={saving || !editName.trim()}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Add Family Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/30">
                  {newImage ? (
                    <img src={newImage} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-10 w-10 text-muted-foreground" />
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full cursor-pointer shadow-soft hover:scale-110 transition-transform">
                  <Upload className="h-4 w-4" />
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, false)} disabled={uploading} />
                </label>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Upload Profile Photo</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Name</label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-muted/50 border-0"
                placeholder="Enter name"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email Address</label>
              <Input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="email@example.com"
                className="bg-muted/50 border-0"
              />
              <p className="text-[10px] text-muted-foreground mt-1">They will receive a magic link to verify their email.</p>
            </div>
            {newRole === 'child' && (
              <div>
                <label className="text-sm font-medium mb-1.5 block flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5" /> Login PIN
                </label>
                <div className="flex gap-2">
                  <Input
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="Leave blank to auto-generate"
                    inputMode="numeric"
                    maxLength={4}
                    className="bg-muted/50 border-0 font-mono tracking-widest text-center text-lg"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  The child uses their email + this PIN to log in. A random PIN is generated if left blank.
                </p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Role</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={newRole === 'parent' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewRole('parent')}
                  className={cn(newRole === 'parent' && 'gradient-warm border-0')}
                >
                  <Crown className="h-4 w-4 mr-1" /> Parent
                </Button>
                <Button
                  type="button"
                  variant={newRole === 'child' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewRole('child')}
                  className={cn(newRole === 'child' && 'gradient-warm border-0')}
                >
                  <Baby className="h-4 w-4 mr-1" /> Child
                </Button>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="gradient-warm" onClick={handleAddMember} disabled={adding || !newName.trim()}>
                {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Add Member
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
  );
};

export default FamilyPage;
