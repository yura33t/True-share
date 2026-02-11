
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

// Supabase configuration
const URL = 'https://xzlxfsfithlnvcjczltp.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bHhmc2ZpdGhsbnZjamN6bHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NTQ2NTcsImV4cCI6MjA4NjMzMDY1N30.Uf2nAHKPLFnG9EsRWuWnl0Tg12pvmkLsK0OI6G3zV9Q';

export const supabase = createClient<Database>(URL, KEY);

/**
 * --- FIXED DATABASE SCHEMA (COPY & RUN IN SUPABASE SQL EDITOR) ---
 * 
 * -- 1. Enable extension for fast search (Fixes error 42704)
 * create extension if not exists pg_trgm;
 * 
 * -- 2. Profiles Table
 * create table if not exists public.profiles (
 *   id uuid references auth.users on delete cascade primary key,
 *   username text unique not null,
 *   display_name text,
 *   avatar_url text,
 *   banner_url text,
 *   bio text,
 *   updated_at timestamp with time zone default now()
 * );
 * 
 * -- 3. Posts Table
 * create table if not exists public.posts (
 *   id uuid default gen_random_uuid() primary key,
 *   user_id uuid references public.profiles(id) on delete cascade not null,
 *   content text not null,
 *   image_url text,
 *   created_at timestamp with time zone default now()
 * );
 * 
 * -- 4. Indexes for speed
 * create index if not exists idx_posts_created_at on public.posts(created_at desc);
 * create index if not exists idx_profiles_username_search on public.profiles using gin (username gin_trgm_ops);
 * 
 * -- 5. Trigger for auto-profile creation
 * create or replace function public.handle_new_user()
 * returns trigger as $$
 * begin
 *   insert into public.profiles (id, username, display_name)
 *   values (new.id, coalesce(new.raw_user_meta_data->>'username', 'u_' || substr(new.id::text, 1, 5)), 'New Member');
 *   return new;
 * end;
 * $$ language plpgsql security definer;
 * 
 * drop trigger if exists on_auth_user_created on auth.users;
 * create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
 */
