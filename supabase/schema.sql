-- KCL Racing check-in system: database schema + RLS policies
-- Paste this whole file into Supabase Dashboard -> SQL Editor and run once

create extension if not exists "pgcrypto";

-- Fixed member roster
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  student_id text,
  created_at timestamptz not null default now()
);

-- One row per meeting / session
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  session_date date not null default current_date,
  created_by uuid references auth.users(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Check-in records
create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  unique (session_id, member_id)
);

create index if not exists attendance_session_id_idx on attendance(session_id);
create index if not exists attendance_member_id_idx on attendance(member_id);

-- Enable RLS
alter table members enable row level security;
alter table sessions enable row level security;
alter table attendance enable row level security;

-- members: anyone (including anonymous) can read (the check-in page needs the
-- name dropdown), only authenticated users can write.
drop policy if exists "members_select_all" on members;
create policy "members_select_all" on members
  for select using (true);

drop policy if exists "members_write_authenticated" on members;
create policy "members_write_authenticated" on members
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- sessions: anyone can read (the check-in page needs to validate the
-- session exists/is active), only authenticated users can write.
drop policy if exists "sessions_select_all" on sessions;
create policy "sessions_select_all" on sessions
  for select using (true);

drop policy if exists "sessions_write_authenticated" on sessions;
create policy "sessions_write_authenticated" on sessions
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- attendance: only authenticated users (admins) can read. Writes always go
-- through the server-side service role key (/api/checkin), which bypasses
-- RLS, so anonymous users get no write access here.
drop policy if exists "attendance_select_authenticated" on attendance;
create policy "attendance_select_authenticated" on attendance
  for select using (auth.role() = 'authenticated');

-- Aggregates attendance counts per member in the database instead of
-- returning one row per check-in to the client. This keeps the ranking
-- page's response size bounded by the number of members (not the number
-- of check-in records), so it doesn't get silently truncated by
-- PostgREST's default 1000-row response limit as the club grows.
create or replace function attendance_counts_for_sessions(p_session_ids uuid[])
returns table(member_id uuid, attended_count bigint)
language sql
stable
as $$
  select member_id, count(*) as attended_count
  from attendance
  where session_id = any(p_session_ids)
  group by member_id;
$$;

grant execute on function attendance_counts_for_sessions(uuid[]) to authenticated;
