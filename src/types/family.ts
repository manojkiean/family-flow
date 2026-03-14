export type UserRole = 'parent' | 'child' | 'caregiver';

export type ActivityCategory = 'school' | 'sports' | 'health' | 'home' | 'personal';

export type RecurrenceType = 'once' | 'daily' | 'weekly' | 'monthly';

export type Priority = 'low' | 'medium' | 'high';

export interface FamilyMember {
  id: string;
  name: string;
  role: UserRole;
  image_url?: string;
  email?: string;
  color: string;
  pin?: string;
}

export interface Activity {
  id: string;
  title: string;
  description?: string;
  category: ActivityCategory;
  startTime: Date;
  endTime?: Date;
  recurrence: RecurrenceType;
  assignedTo: string[]; // FamilyMember IDs
  assignedChildren: string[]; // FamilyMember IDs of children
  location?: string;
  notes?: string;
  priority: Priority;
  completed: boolean;
  createdBy: string;
}

export interface DaySchedule {
  date: Date;
  activities: Activity[];
}

export interface Post {
  id: string;
  content: string;
  image_url?: string;
  author_id: string;
  family_id: string;
  created_at: string;
  updated_at: string;
  author?: FamilyMember;
}

export interface Family {
  id: string;
  name: string;
  owner_id?: string;
}
