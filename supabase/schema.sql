-- 社团签到系统 数据库结构 + RLS 策略
-- 在 Supabase Dashboard -> SQL Editor 里粘贴运行一次即可

create extension if not exists "pgcrypto";

-- 固定成员名单
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  student_id text,
  created_at timestamptz not null default now()
);

-- 每次 meeting / session
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  session_date date not null default current_date,
  created_by uuid references auth.users(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 签到记录
create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  unique (session_id, member_id)
);

create index if not exists attendance_session_id_idx on attendance(session_id);
create index if not exists attendance_member_id_idx on attendance(member_id);

-- 开启 RLS
alter table members enable row level security;
alter table sessions enable row level security;
alter table attendance enable row level security;

-- members: 匿名和已登录用户都可以读（签到页需要展示名单下拉），只有已登录用户可以增删改
drop policy if exists "members_select_all" on members;
create policy "members_select_all" on members
  for select using (true);

drop policy if exists "members_write_authenticated" on members;
create policy "members_write_authenticated" on members
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- sessions: 匿名和已登录用户都可以读（签到页需要校验 session 是否存在/有效），只有已登录用户可以增删改
drop policy if exists "sessions_select_all" on sessions;
create policy "sessions_select_all" on sessions
  for select using (true);

drop policy if exists "sessions_write_authenticated" on sessions;
create policy "sessions_write_authenticated" on sessions
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- attendance: 只有已登录用户（管理员）能读；写入统一走服务端 service role key（/api/checkin），
-- 绕过 RLS，所以这里不给匿名任何写权限。
drop policy if exists "attendance_select_authenticated" on attendance;
create policy "attendance_select_authenticated" on attendance
  for select using (auth.role() = 'authenticated');
