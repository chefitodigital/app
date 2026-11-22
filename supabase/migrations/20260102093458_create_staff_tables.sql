/*
  # Create Staff Management Tables

  1. New Tables
    - `staff`
      - `id` (uuid, primary key)
      - `name` (text, required) - Employee name
      - `role` (text, required) - Job title/position
      - `phone` (text, required) - Contact phone
      - `email` (text) - Contact email
      - `photo_url` (text) - Profile photo URL
      - `hire_date` (date) - Date of hire
      - `hourly_rate` (numeric) - Hourly pay rate
      - `active` (boolean, default true) - Employment status
      - `notes` (text) - Additional notes
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `staff_schedules`
      - `id` (uuid, primary key)
      - `staff_id` (uuid, foreign key) - Reference to staff member
      - `day_of_week` (integer, 0-6) - 0=Sunday, 1=Monday, etc.
      - `start_time` (time) - Shift start time
      - `end_time` (time) - Shift end time
      - `is_day_off` (boolean, default false) - Whether this is a day off
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage staff data

  3. Indexes
    - Index on staff_schedules(staff_id) for faster lookups
    - Index on staff(active) for filtering
*/

-- Create staff table
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  phone text NOT NULL,
  email text DEFAULT '',
  photo_url text DEFAULT '',
  hire_date date DEFAULT CURRENT_DATE,
  hourly_rate numeric(10, 2) DEFAULT 0,
  active boolean DEFAULT true,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create staff_schedules table
CREATE TABLE IF NOT EXISTS staff_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time DEFAULT '09:00',
  end_time time DEFAULT '18:00',
  is_day_off boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(staff_id, day_of_week)
);

-- Enable RLS
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for staff table
DROP POLICY IF EXISTS "Authenticated users can view staff" ON staff;
CREATE POLICY "Authenticated users can view staff"
  ON staff
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create staff" ON staff;
CREATE POLICY "Authenticated users can create staff"
  ON staff
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update staff" ON staff;
CREATE POLICY "Authenticated users can update staff"
  ON staff
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete staff" ON staff;
CREATE POLICY "Authenticated users can delete staff"
  ON staff
  FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for staff_schedules table
DROP POLICY IF EXISTS "Authenticated users can view staff schedules" ON staff_schedules;
CREATE POLICY "Authenticated users can view staff schedules"
  ON staff_schedules
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create staff schedules" ON staff_schedules;
CREATE POLICY "Authenticated users can create staff schedules"
  ON staff_schedules
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update staff schedules" ON staff_schedules;
CREATE POLICY "Authenticated users can update staff schedules"
  ON staff_schedules
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete staff schedules" ON staff_schedules;
CREATE POLICY "Authenticated users can delete staff schedules"
  ON staff_schedules
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_schedules_staff_id ON staff_schedules(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_active ON staff(active);
CREATE INDEX IF NOT EXISTS idx_staff_name ON staff(name);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_staff_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS staff_updated_at ON staff;
CREATE TRIGGER staff_updated_at
  BEFORE UPDATE ON staff
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_updated_at();

DROP TRIGGER IF EXISTS staff_schedules_updated_at ON staff_schedules;
CREATE TRIGGER staff_schedules_updated_at
  BEFORE UPDATE ON staff_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_updated_at();