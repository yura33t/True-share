
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

// Supabase configuration
const URL = 'https://xzlxfsfithlnvcjczltp.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bHhmc2ZpdGhsbnZjamN6bHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NTQ2NTcsImV4cCI6MjA4NjMzMDY1N30.Uf2nAHKPLFnG9EsRWuWnl0Tg12pvmkLsK0OI6G3zV9Q';

export const supabase = createClient<Database>(URL, KEY);

/**
 * --- ПОЛНЫЙ ИСПРАВЛЕННЫЙ SQL СКРИПТ (СКОПИРУЙТЕ И ЗАПУСТИТЕ В SQL EDITOR В SUPABASE) ---
 * 
 * -- 1. Расширения
 * create extension if not exists pg_trgm;
 * 
 * -- 2. Таблицы
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
 * create table if not exists public.posts (
 *   id uuid default gen_random_uuid() primary key,
 *   user_id uuid references public.profiles(id) on delete cascade not null,
 *   content text not null,
 *   image_url text,
 *   created_at timestamp with time zone default now()
 * );
 * 
 * create table if not exists public.likes (
 *   id uuid default gen_random_uuid() primary key,
 *   post_id uuid references public.posts(id) on delete cascade not null,
 *   user_id uuid references public.profiles(id) on delete cascade not null,
 *   unique(post_id, user_id)
 * );
 * 
 * create table if not exists public.comments (
 *   id uuid default gen_random_uuid() primary key,
 *   post_id uuid references public.posts(id) on delete cascade not null,
 *   user_id uuid references public.profiles(id) on delete cascade not null,
 *   content text not null,
 *   created_at timestamp with time zone default now()
 * );
 * 
 * create table if not exists public.messages (
 *   id uuid default gen_random_uuid() primary key,
 *   sender_id uuid references public.profiles(id) on delete cascade not null,
 *   receiver_id uuid references public.profiles(id) on delete cascade not null,
 *   content text not null,
 *   created_at timestamp with time zone default now()
 * );
 * 
 * -- 3. Триггер для профилей
 * create or replace function public.handle_new_user()
 * returns trigger as $$
 * begin
 *   insert into public.profiles (id, username, display_name)
 *   values (
 *     new.id, 
 *     coalesce(new.raw_user_meta_data->>'username', 'u_' || substr(new.id::text, 1, 8)), 
 *     coalesce(new.raw_user_meta_data->>'display_name', 'New Member')
 *   )
 *   on conflict (id) do nothing;
 *   return new;
 * end;
 * $$ language plpgsql security definer;
 * 
 * drop trigger if exists on_auth_user_created on auth.users;
 * create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
 * 
 * -- 4. RLS Включение
 * alter table public.profiles enable row level security;
 * alter table public.posts enable row level security;
 * alter table public.likes enable row level security;
 * alter table public.comments enable row level security;
 * alter table public.messages enable row level security;
 * 
 * -- 5. Политики (Удаляем старые перед созданием)
 * drop policy if exists "Profiles are public" on public.profiles;
 * create policy "Profiles are public" on public.profiles for select using (true);
 * drop policy if exists "Users can update own profile" on public.profiles;
 * create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
 * 
 * drop policy if exists "Posts are public" on public.posts;
 * create policy "Posts are public" on public.posts for select using (true);
 * drop policy if exists "Authenticated users can create posts" on public.posts;
 * create policy "Authenticated users can create posts" on public.posts for insert with check (auth.uid() = user_id);
 * 
 * drop policy if exists "Likes are public" on public.likes;
 * create policy "Likes are public" on public.likes for select using (true);
 * drop policy if exists "Auth users can like" on public.likes;
 * create policy "Auth users can like" on public.likes for insert with check (auth.uid() = user_id);
 * drop policy if exists "Users can unlike" on public.likes;
 * create policy "Users can unlike" on public.likes for delete using (auth.uid() = user_id);
 * 
 * drop policy if exists "Comments are public" on public.comments;
 * create policy "Comments are public" on public.comments for select using (true);
 * drop policy if exists "Auth users can comment" on public.comments;
 * create policy "Auth users can comment" on public.comments for insert with check (auth.uid() = user_id);
 * 
 * drop policy if exists "Users can see their own messages" on public.messages;
 * create policy "Users can see their own messages" on public.messages for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
 * drop policy if exists "Users can send messages" on public.messages;
 * create policy "Users can send messages" on public.messages for insert with check (auth.uid() = sender_id);
 */
