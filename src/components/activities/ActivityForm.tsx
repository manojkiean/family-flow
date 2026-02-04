import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Clock, MapPin, X } from 'lucide-react';
import { Activity, ActivityCategory, RecurrenceType, Priority, FamilyMember } from '@/types/family';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

const activitySchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  category: z.enum(['school', 'sports', 'health', 'home', 'personal']),
  date: z.date({ required_error: 'Date is required' }),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().optional(),
  recurrence: z.enum(['once', 'daily', 'weekly', 'monthly']),
  assignedTo: z.array(z.string()).min(1, 'Assign to at least one person'),
  assignedChildren: z.array(z.string()),
  location: z.string().max(200, 'Location must be less than 200 characters').optional(),
  priority: z.enum(['low', 'medium', 'high']),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

type ActivityFormData = z.infer<typeof activitySchema>;

interface ActivityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyMembers: FamilyMember[];
  activity?: Activity;
  onSubmit: (data: ActivityFormData) => void;
}

const categories: { value: ActivityCategory; label: string; emoji: string }[] = [
  { value: 'school', label: 'School', emoji: '🎓' },
  { value: 'sports', label: 'Sports', emoji: '⚽' },
  { value: 'health', label: 'Health', emoji: '🏥' },
  { value: 'home', label: 'Home', emoji: '🏠' },
  { value: 'personal', label: 'Personal', emoji: '👤' },
];

const recurrenceOptions: { value: RecurrenceType; label: string }[] = [
  { value: 'once', label: 'One-time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const priorityOptions: { value: Priority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'bg-muted text-muted-foreground' },
  { value: 'medium', label: 'Medium', color: 'bg-category-home/20 text-category-home' },
  { value: 'high', label: 'High', color: 'bg-destructive/20 text-destructive' },
];

export function ActivityForm({ open, onOpenChange, familyMembers, activity, onSubmit }: ActivityFormProps) {
  const isEditing = !!activity;
  
  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: activity ? {
      title: activity.title,
      description: activity.description || '',
      category: activity.category,
      date: new Date(activity.startTime),
      startTime: format(new Date(activity.startTime), 'HH:mm'),
      endTime: activity.endTime ? format(new Date(activity.endTime), 'HH:mm') : '',
      recurrence: activity.recurrence,
      assignedTo: activity.assignedTo,
      assignedChildren: activity.assignedChildren,
      location: activity.location || '',
      priority: activity.priority,
      notes: activity.notes || '',
    } : {
      title: '',
      description: '',
      category: 'home',
      date: new Date(),
      startTime: '09:00',
      endTime: '',
      recurrence: 'once',
      assignedTo: [],
      assignedChildren: [],
      location: '',
      priority: 'medium',
      notes: '',
    },
  });

  const handleSubmit = (data: ActivityFormData) => {
    onSubmit(data);
    form.reset();
    onOpenChange(false);
  };

  const parents = familyMembers.filter(m => m.role === 'parent');
  const children = familyMembers.filter(m => m.role === 'child');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {isEditing ? 'Edit Activity' : 'Create New Activity'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Soccer Practice, Doctor's Appointment" 
                      className="bg-muted/50 border-0"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category & Priority Row */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-muted/50 border-0">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            <span className="flex items-center gap-2">
                              <span>{cat.emoji}</span>
                              <span>{cat.label}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-muted/50 border-0">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {priorityOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <Badge className={cn(opt.color, 'border-0')}>
                              {opt.label}
                            </Badge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date & Time Row */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "bg-muted/50 border-0 justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : "Pick a date"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="time" 
                          className="bg-muted/50 border-0 pl-9"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="time" 
                          className="bg-muted/50 border-0 pl-9"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Recurrence */}
            <FormField
              control={form.control}
              name="recurrence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recurrence *</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {recurrenceOptions.map(opt => (
                      <Button
                        key={opt.value}
                        type="button"
                        variant={field.value === opt.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => field.onChange(opt.value)}
                        className={cn(
                          field.value === opt.value && 'gradient-warm border-0'
                        )}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Assigned To (Parents) */}
            <FormField
              control={form.control}
              name="assignedTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned To *</FormLabel>
                  <div className="flex flex-wrap gap-3">
                    {parents.map(member => {
                      const isSelected = field.value.includes(member.id);
                      return (
                        <div
                          key={member.id}
                          onClick={() => {
                            if (isSelected) {
                              field.onChange(field.value.filter(id => id !== member.id));
                            } else {
                              field.onChange([...field.value, member.id]);
                            }
                          }}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all",
                            "border-2",
                            isSelected 
                              ? "border-primary bg-primary/10" 
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <span className="text-xl">{member.avatar}</span>
                          <span className="font-medium">{member.name}</span>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                              <X className="h-3 w-3 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Assigned Children */}
            <FormField
              control={form.control}
              name="assignedChildren"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>For Children (optional)</FormLabel>
                  <div className="flex flex-wrap gap-3">
                    {children.map(member => {
                      const isSelected = field.value.includes(member.id);
                      return (
                        <div
                          key={member.id}
                          onClick={() => {
                            if (isSelected) {
                              field.onChange(field.value.filter(id => id !== member.id));
                            } else {
                              field.onChange([...field.value, member.id]);
                            }
                          }}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all",
                            "border-2",
                            isSelected 
                              ? "border-accent bg-accent/10" 
                              : "border-border hover:border-accent/50"
                          )}
                        >
                          <span className="text-xl">{member.avatar}</span>
                          <span className="font-medium">{member.name}</span>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-accent flex items-center justify-center">
                              <X className="h-3 w-3 text-accent-foreground" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="e.g., School, Sports Center, Home" 
                        className="bg-muted/50 border-0 pl-9"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any additional details..."
                      className="bg-muted/50 border-0 resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes / Instructions</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any special instructions or reminders..."
                      className="bg-muted/50 border-0 resize-none"
                      rows={2}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 gradient-warm shadow-soft"
              >
                {isEditing ? 'Save Changes' : 'Create Activity'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
