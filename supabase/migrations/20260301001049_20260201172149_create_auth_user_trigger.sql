/*
  # Create Automatic User Record Creation Trigger

  1. Changes
    - Creates function `handle_new_user()` to automatically create records in `public.users`
    - Creates trigger `on_auth_user_created` to execute function when new user signs up
    - Ensures `public.users` records are created atomically with `auth.users`

  2. How it works
    - When a user signs up via Supabase Auth, record is created in `auth.users`
    - Trigger automatically fires and creates corresponding record in `public.users`
    - Uses database privileges to bypass RLS policies
    - Sets default role as 'customer' for all new users

  3. Benefits
    - Works regardless of email confirmation settings
    - Eliminates race conditions and manual insertions
    - Atomic and reliable synchronization
    - Simplifies frontend code

  4. Security
    - Trigger runs with elevated privileges but is safe
    - Only creates records for new users
    - Uses ON CONFLICT to handle duplicates gracefully
    - Maintains existing RLS policies for normal operations
*/

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, role, created_at, updated_at)
  VALUES (
    NEW.id,
    'customer',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user record
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add comment to function
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a record in public.users when a new user signs up via Supabase Auth';
