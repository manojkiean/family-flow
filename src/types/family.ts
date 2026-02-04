export type UserRole = 'parent' | 'child' | 'caregiver';

export type ActivityCategory = 'school' | 'sports' | 'health' | 'home' | 'personal';

export type RecurrenceType = 'once' | 'daily' | 'weekly' | 'monthly';

export type Priority = 'low' | 'medium' | 'high';

export interface FamilyMember {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  color: string;
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
