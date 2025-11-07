-- Create profiles table for user information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('worker', 'employer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create workers table
CREATE TABLE IF NOT EXISTS public.workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  skills TEXT[] NOT NULL DEFAULT '{}',
  experience INTEGER NOT NULL DEFAULT 0,
  location TEXT NOT NULL,
  contact TEXT NOT NULL,
  profile_pic_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view workers"
  ON public.workers FOR SELECT
  USING (true);

CREATE POLICY "Workers can update own profile"
  ON public.workers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Workers can insert own profile"
  ON public.workers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  skills_required TEXT[] NOT NULL DEFAULT '{}',
  location TEXT NOT NULL,
  budget DECIMAL(10,2) NOT NULL,
  deadline_days INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'accepted', 'declined', 'completed')),
  accepted_worker_id UUID REFERENCES public.workers(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view jobs"
  ON public.jobs FOR SELECT
  USING (true);

CREATE POLICY "Employers can insert jobs"
  ON public.jobs FOR INSERT
  WITH CHECK (auth.uid() = employer_id);

CREATE POLICY "Employers can update own jobs"
  ON public.jobs FOR UPDATE
  USING (auth.uid() = employer_id);

CREATE POLICY "Employers can delete own jobs"
  ON public.jobs FOR DELETE
  USING (auth.uid() = employer_id);

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES public.workers(id) ON DELETE CASCADE NOT NULL,
  employer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Employers can insert reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = employer_id);

-- Create applications table (job offers to workers)
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES public.workers(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(worker_id, job_id)
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can view own applications"
  ON public.applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workers 
      WHERE workers.id = applications.worker_id 
      AND workers.user_id = auth.uid()
    )
  );

CREATE POLICY "Employers can view applications for their jobs"
  ON public.applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = applications.job_id 
      AND jobs.employer_id = auth.uid()
    )
  );

CREATE POLICY "Employers can create applications"
  ON public.applications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = applications.job_id 
      AND jobs.employer_id = auth.uid()
    )
  );

CREATE POLICY "Workers can update own applications"
  ON public.applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workers 
      WHERE workers.id = applications.worker_id 
      AND workers.user_id = auth.uid()
    )
  );

-- Create trigger to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, user_type)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'employer')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();