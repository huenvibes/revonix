-- Revonix Supabase Setup Script
-- IMPORTANT: Run this entire script in your Supabase SQL Editor
-- This script sets up tables, policies, triggers, and the delete_user RPC.

-- Profiles Table Setup for Revonix

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  balance DECIMAL(10, 2) DEFAULT 0.00,
  total_earned DECIMAL(10, 2) DEFAULT 0.00,
  level TEXT DEFAULT 'Beginner',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- TRIGGER FOR AUTOMATIC PROFILE CREATION (Reliable method)
-- This ensures a profile is created even if the frontend fails
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, balance, total_earned, level)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 0, 0, 'Beginner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Survey Biodata Table
CREATE TABLE public.survey_biodata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  gender TEXT,
  date_of_birth DATE,
  country TEXT DEFAULT 'USA',
  state TEXT,
  city TEXT,
  zip_code TEXT,
  marital_status TEXT,
  education_level TEXT,
  employment_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for survey_biodata
ALTER TABLE public.survey_biodata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own survey biodata" 
ON public.survey_biodata FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own survey biodata" 
ON public.survey_biodata FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own survey biodata" 
ON public.survey_biodata FOR UPDATE 
USING (auth.uid() = user_id);

-- Delete user function
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reward Transactions Table (for Offerwalls)
CREATE TABLE public.reward_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trans_id TEXT UNIQUE NOT NULL,
  offer_name TEXT,
  payout DECIMAL(10, 2) DEFAULT 0.00,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for reward_transactions
ALTER TABLE public.reward_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reward transactions"
ON public.reward_transactions FOR SELECT
USING (auth.uid() = user_id);

-- System/Service role will handle inserts
