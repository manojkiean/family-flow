import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Clock, MapPin, X, User } from 'lucide-react';
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
  category: z.enum(['school', 'sports', 'health', 'home', 'personal', 'chores', 'events', 'travel']),
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
  initialCategory?: ActivityCategory;
  onSubmit: (data: ActivityFormData) => void;
}

const categories: { value: ActivityCategory; label: string; emoji: string }[] = [
  { value: 'school', label: 'School', emoji: '🎓' },
  { value: 'sports', label: 'Sports', emoji: '⚽' },
  { value: 'health', label: 'Health', emoji: '🏥' },
  { value: 'home', label: 'Home', emoji: '🏠' },
  { value: 'personal', label: 'Personal', emoji: '👤' },
  { value: 'chores', label: 'Chores', emoji: '🧹' },
  { value: 'events', label: 'Events', emoji: '🎉' },
  { value: 'travel', label: 'Travel', emoji: '✈️' },
];

const recurrenceOptions: { value: RecurrenceType; label: string }[] = [
  { value: 'once', label: 'One-time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const timeOptions = [
  '00:00', '00:30',
  '01:00', '01:30',
  '02:00', '02:30',
  '03:00', '03:30',
  '04:00', '04:30',
  '05:00', '05:30',
  '06:00', '06:30',
  '07:00', '07:30',
  '08:00', '08:30',
  '09:00', '09:30',
  '10:00', '10:30',
  '11:00', '11:30',
  '12:00', '12:30',
  '13:00', '13:30',
  '14:00', '14:30',
  '15:00', '15:30',
  '16:00', '16:30',
  '17:00', '17:30',
  '18:00', '18:30',
  '19:00', '19:30',
  '20:00', '20:30',
  '21:00', '21:30',
  '22:00', '22:30',
  '23:00', '23:30',
];

const NO_END_TIME = '__none__';

const formatTimeLabel = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
};

const priorityOptions: { value: Priority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'bg-muted text-muted-foreground' },
  { value: 'medium', label: 'Medium', color: 'bg-category-home/20 text-category-home' },
  { value: 'high', label: 'High', color: 'bg-destructive/20 text-destructive' },
];

export function ActivityForm({ open, onOpenChange, familyMembers, activity, initialCategory, onSubmit }: ActivityFormProps) {
  const isEditing = !!activity;

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
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

  // No need for redundant state initialization - handled by useEffect below

  // biome-ignore lint: reset form when activity or open state changes
  React.useEffect(() => {
    if (open && activity) {
      form.reset({
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
      });
    } else if (open && !activity) {
      form.reset({
        title: '',
        description: '',
        category: initialCategory || 'home',
        date: new Date(),
        startTime: '09:00',
        endTime: '',
        recurrence: 'once',
        assignedTo: [],
        assignedChildren: [],
        location: '',
        priority: 'medium',
        notes: '',
      });
    }
  }, [open, activity, initialCategory]);

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
          <form onSubmit={form.handleSubmit(handleSubmit)} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="lg:col-span-2">
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
            <div className="grid gap-4 lg:grid-cols-2 lg:col-span-2">
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
            <div className="grid gap-4 lg:grid-cols-2 lg:col-span-2">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="mb-0.5">Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "bg-muted/50 border-0 justify-start text-left font-normal h-10 w-full",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                            <span className="truncate">
                              {field.value ? format(field.value, "PPP") : "Pick a date"}
                            </span>
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            if (date) field.onChange(date);
                          }}
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
                    <FormLabel className="mb-0.5">Start Time *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-muted/50 border-0 h-10">
                          <div className="flex items-center gap-2 min-w-0">
                            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                            <SelectValue placeholder="Select start time" />
                          </div>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeOptions.map(time => (
                          <SelectItem key={time} value={time}>
                            {formatTimeLabel(time)}
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
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-0.5">End Time</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === NO_END_TIME ? '' : value)}
                      defaultValue={field.value || NO_END_TIME}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-muted/50 border-0 h-10">
                          <div className="flex items-center gap-2 min-w-0">
                            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                            <SelectValue placeholder="Select end time" />
                          </div>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NO_END_TIME}>No end time</SelectItem>
                        {timeOptions.map(time => (
                          <SelectItem key={time} value={time}>
                            {formatTimeLabel(time)}
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
            </div>

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
                          <div className="w-6 h-6 rounded-full bg-background flex items-center justify-center overflow-hidden shrink-0">
                            {member.image_url ? (
                              <img src={member.image_url} alt={member.name} className="w-full h-full object-cover" />
                            ) : (
                              <User className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <span className="font-medium">{member.name}</span>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0">
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
                          <div className="w-6 h-6 rounded-full bg-background flex items-center justify-center overflow-hidden shrink-0">
                            {member.image_url ? (
                              <img src={member.image_url} alt={member.name} className="w-full h-full object-cover" />
                            ) : (
                              <User className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <span className="font-medium">{member.name}</span>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-accent flex items-center justify-center shrink-0">
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

            {/* Location & Description Row */}
            <div className="grid gap-4 lg:grid-cols-2 lg:col-span-2">
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
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="lg:col-span-2">
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
            <div className="flex gap-3 pt-4 lg:col-span-2">
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
