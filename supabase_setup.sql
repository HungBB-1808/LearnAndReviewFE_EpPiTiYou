-- =============================================
-- EduFU Supabase Database Setup
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Questions Table (already created, ensure it exists)
create table if not exists questions (
  id text primary key,
  parent_key text not null,
  content jsonb not null,
  updated_at timestamp with time zone default now()
);

-- 2. User Profiles Table
create table if not exists user_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  avatar_url text,
  role text default 'student' check (role in ('student', 'admin')),
  created_at timestamp with time zone default now()
);

-- 3. Exam History Table  
create table if not exists exam_history (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  subject text,
  score numeric,
  correct integer,
  total integer,
  time_spent integer,
  details jsonb,
  created_at timestamp with time zone default now()
);

-- 4. Bookmarks Table
create table if not exists bookmarks (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  question_id text not null,
  created_at timestamp with time zone default now(),
  unique(user_id, question_id)
);

-- 5. App Settings Table (global admin settings like locked subjects)
create table if not exists app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamp with time zone default now()
);

-- =============================================
-- Row Level Security Policies
-- =============================================

-- Questions: Everyone can read, only authenticated users can write
alter table questions enable row level security;
drop policy if exists "Allow public read" on questions;
drop policy if exists "Allow admin all" on questions;
drop policy if exists "Allow all users sync" on questions;
create policy "Anyone can read questions" on questions for select using (true);
create policy "Authenticated users can modify questions" on questions for all using (auth.role() = 'authenticated');

-- User Profiles: Users can read/write their own profile
alter table user_profiles enable row level security;
create policy "Users can view own profile" on user_profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on user_profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on user_profiles for insert with check (auth.uid() = id);

-- Exam History: Users can read/write their own history
alter table exam_history enable row level security;
create policy "Users can view own history" on exam_history for select using (auth.uid() = user_id);
create policy "Users can insert own history" on exam_history for insert with check (auth.uid() = user_id);

-- Bookmarks: Users can manage their own bookmarks
alter table bookmarks enable row level security;
create policy "Users can view own bookmarks" on bookmarks for select using (auth.uid() = user_id);
create policy "Users can insert own bookmarks" on bookmarks for insert with check (auth.uid() = user_id);
create policy "Users can delete own bookmarks" on bookmarks for delete using (auth.uid() = user_id);

-- =============================================
-- Indexes for Performance
-- =============================================
create index if not exists idx_questions_parent_key on questions(parent_key);
create index if not exists idx_exam_history_user on exam_history(user_id);
create index if not exists idx_bookmarks_user on bookmarks(user_id);

-- App Settings: Everyone can read, only authenticated users can write
alter table app_settings enable row level security;
create policy "Anyone can read settings" on app_settings for select using (true);
create policy "Authenticated users can modify settings" on app_settings for all using (auth.role() = 'authenticated');
