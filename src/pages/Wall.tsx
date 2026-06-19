import { useState, useRef } from 'react';
import { useFamilyData } from '@/contexts/FamilyDataContext';
import { useActiveMember } from '@/contexts/ActiveMemberContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { Image as ImageIcon, Send, Trash2, Edit2, X, Loader2, MessageSquare, Heart, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Post } from '@/types/family';

const Wall = () => {
    const { activeMember, permissions } = useActiveMember();
    const { posts, postsLoading: loading, addPost, updatePost, deletePost } = useFamilyData();
    const [content, setContent] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [editContent, setEditContent] = useState('');

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast({ title: "Invalid file", description: "Please upload an image.", variant: "destructive" });
            return;
        }

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `posts/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('family-app')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('family-app')
                .getPublicUrl(filePath);

            setImage(publicUrl);
            toast({ title: "Success", description: "Image uploaded!" });
        } catch (error) {
            console.error('Error uploading post image:', error);
            toast({ title: "Upload failed", description: "Could not upload image.", variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };

    const handleAddPost = async () => {
        if (!content.trim() && !image) return;
        if (!activeMember) return;

        setSubmitting(true);
        try {
            await addPost({
                content,
                image_url: image || undefined,
                author_id: activeMember.id
            });
            setContent('');
            setImage(null);
            toast({ title: "Posted!", description: "Your message is on the wall." });
        } catch (err: any) {
            console.error('Post error:', err);
            toast({ title: "Error", description: err.message || "Failed to post message.", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdatePost = async () => {
        if (!editingPost || !editContent.trim()) return;
        setSubmitting(true);
        try {
            await updatePost(editingPost.id, editContent);
            setEditingPost(null);
            setEditContent('');
            toast({ title: "Updated!", description: "Post has been modified." });
        } catch (err) {
            toast({ title: "Error", description: "Failed to update post.", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeletePost = async (id: string) => {
        if (!window.confirm("Remove this post from the wall?")) return;
        try {
            await deletePost(id);
            toast({ title: "Deleted", description: "Post removed." });
        } catch (err) {
            toast({ title: "Error", description: "Failed to delete post.", variant: "destructive" });
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl">
                        <MessageSquare className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="font-display font-bold text-2xl">Family Wall</h1>
                        <p className="text-muted-foreground text-sm">Share moments with your family</p>
                    </div>
                </div>

                {/* Create Post */}
                <Card className="border-border/50 shadow-soft overflow-hidden">
                    <CardContent className="p-4 space-y-4">
                        <div className="flex gap-3">
                            <Avatar className="h-10 w-10 shrink-0">
                                <AvatarImage src={activeMember?.image_url} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                    {activeMember?.name?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <Textarea
                                placeholder="What's on your mind?"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="min-h-[100px] border-0 focus-visible:ring-0 bg-muted/30 resize-none p-3 rounded-xl"
                            />
                        </div>

                        {image && (
                            <div className="relative rounded-xl overflow-hidden aspect-video border bg-muted/20 group">
                                <img src={image} alt="Upload preview" className="w-full h-full object-contain" />
                                <button
                                    onClick={() => setImage(null)}
                                    className="absolute top-2 right-2 p-1.5 bg-background/80 hover:bg-background rounded-full shadow-soft transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept="image/*"
                                className="hidden"
                            />
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-primary"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                            >
                                {uploading ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <ImageIcon className="h-4 w-4 mr-2" />
                                )}
                                Photo
                            </Button>

                            <Button
                                className="gradient-warm shadow-soft"
                                disabled={submitting || (!content.trim() && !image)}
                                onClick={handleAddPost}
                            >
                                {submitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Send className="h-4 w-4 mr-2" />
                                )}
                                Post
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Posts List */}
                <div className="space-y-6">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-12 bg-muted/20 rounded-2xl border-2 border-dashed border-border/50">
                            <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                            <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
                        </div>
                    ) : (
                        posts.map((post) => {
                            const postAuthor = post.author;
                            const isAuthor = activeMember?.id === post.author_id;
                            const canDelete = isAuthor || permissions.canManageMembers;

                            return (
                                <Card key={post.id} className="border-border/50 shadow-soft group">
                                    <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 ring-2 ring-primary/5">
                                                <AvatarImage src={postAuthor?.image_url} />
                                                <AvatarFallback style={{ backgroundColor: `${postAuthor?.color}20`, color: postAuthor?.color }}>
                                                    {postAuthor?.name?.[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-display font-medium leading-none">{postAuthor?.name}</p>
                                                    <Badge variant="secondary" className="text-[10px] h-4 px-1 capitalize">
                                                        {postAuthor?.role}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                                                </div>
                                            </div>
                                        </div>

                                        {(isAuthor || canDelete) && (
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {isAuthor && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                        onClick={() => {
                                                            setEditingPost(post);
                                                            setEditContent(post.content);
                                                        }}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    onClick={() => handleDeletePost(post.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </CardHeader>

                                    <CardContent className="p-4 pt-0 space-y-4">
                                        {editingPost?.id === post.id ? (
                                            <div className="space-y-3">
                                                <Textarea
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    className="min-h-[80px] bg-muted/30 border-0 focus-visible:ring-1 focus-visible:ring-primary rounded-xl"
                                                />
                                                <div className="flex gap-2 justify-end">
                                                    <Button variant="ghost" size="sm" onClick={() => setEditingPost(null)}>
                                                        Cancel
                                                    </Button>
                                                    <Button size="sm" className="gradient-warm" onClick={handleUpdatePost} disabled={submitting}>
                                                        Save
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{post.content}</p>
                                        )}

                                        {post.image_url && (
                                            <div className="rounded-xl overflow-hidden border bg-muted/10">
                                                <img src={post.image_url} alt="Post content" className="w-full max-h-[500px] object-contain" />
                                            </div>
                                        )}
                                    </CardContent>

                                    <CardFooter className="p-4 pt-0 border-t border-border/30 mt-2 flex items-center gap-6">
                                        <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
                                            <Heart className="h-4 w-4" />
                                            Like
                                        </button>
                                        <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
                                            <MessageSquare className="h-4 w-4" />
                                            Comment
                                        </button>
                                    </CardFooter>
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>
    );
};

export default Wall;
