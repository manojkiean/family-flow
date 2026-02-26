-- Add settings columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_time TEXT DEFAULT '1 hour',
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Eastern Time (ET)',
ADD COLUMN IF NOT EXISTS week_starts_on TEXT DEFAULT 'Sunday',
ADD COLUMN IF NOT EXISTS require_pin_for_children BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS activity_history_retention TEXT DEFAULT 'Forever';
