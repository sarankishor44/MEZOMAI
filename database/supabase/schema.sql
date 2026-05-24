create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  email text,
  avatar_name text default 'ARIA',
  avatar_style text default 'gold',
  avatar_gender text default 'female',
  system_prompt text,
  personality text default 'friendly',
  voice_name text default 'Rachel',
  voice_speed numeric default 1,
  voice_pitch numeric default 1,
  model text default 'claude-3-5-sonnet-20241022',
  active_provider text default 'anthropic',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.user_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  secret_value text not null,
  key_hint text,
  is_valid boolean default false,
  last_tested_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, provider)
);

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text default 'New Chat',
  personality text default 'friendly',
  message_count integer default 0,
  token_count integer default 0,
  is_active boolean default true,
  started_at timestamptz default now(),
  ended_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  has_image boolean default false,
  image_path text,
  token_count integer default 0,
  emotion text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.code_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  filename text not null,
  language text default 'python',
  content text default '',
  folder_path text default 'workspace',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.code_versions (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.code_files(id) on delete cascade,
  content text not null,
  change_summary text,
  created_at timestamptz default now()
);

create table if not exists public.code_runs (
  id uuid primary key default gen_random_uuid(),
  file_id uuid references public.code_files(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  language text not null,
  input_code text not null,
  output text,
  error text,
  duration_ms integer default 0,
  exit_code integer default 0,
  executed_at timestamptz default now()
);

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  room_id text not null,
  platform text,
  bot_name text,
  bot_personality text,
  status text default 'scheduled',
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.transcripts (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  speaker text not null,
  content text not null,
  spoken_at timestamptz default now()
);

create table if not exists public.meeting_notes (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  summary text,
  key_points jsonb default '[]'::jsonb,
  action_items jsonb default '[]'::jsonb,
  generated_at timestamptz default now()
);

create table if not exists public.analytics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  sessions_count integer default 0,
  messages_count integer default 0,
  tokens_input integer default 0,
  tokens_output integer default 0,
  estimated_cost_usd numeric default 0,
  voice_chars_used integer default 0,
  meetings_count integer default 0,
  meeting_minutes numeric default 0,
  updated_at timestamptz default now(),
  unique (user_id, date)
);

create index if not exists idx_chat_sessions_user_updated on public.chat_sessions(user_id, updated_at desc);
create index if not exists idx_messages_session_created on public.messages(session_id, created_at);
create index if not exists idx_code_files_user_updated on public.code_files(user_id, updated_at desc);
create index if not exists idx_meetings_user_created on public.meetings(user_id, created_at desc);
create index if not exists idx_transcripts_meeting_spoken on public.transcripts(meeting_id, spoken_at);
create index if not exists idx_analytics_user_date on public.analytics(user_id, date desc);

alter table public.profiles enable row level security;
alter table public.user_api_keys enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.messages enable row level security;
alter table public.code_files enable row level security;
alter table public.code_versions enable row level security;
alter table public.code_runs enable row level security;
alter table public.meetings enable row level security;
alter table public.transcripts enable row level security;
alter table public.meeting_notes enable row level security;
alter table public.analytics enable row level security;

drop policy if exists "profiles own rows" on public.profiles;
drop policy if exists "api keys own rows" on public.user_api_keys;
drop policy if exists "chat sessions own rows" on public.chat_sessions;
drop policy if exists "messages own rows" on public.messages;
drop policy if exists "code files own rows" on public.code_files;
drop policy if exists "code versions own files" on public.code_versions;
drop policy if exists "code runs own rows" on public.code_runs;
drop policy if exists "meetings own rows" on public.meetings;
drop policy if exists "transcripts own meetings" on public.transcripts;
drop policy if exists "meeting notes own meetings" on public.meeting_notes;
drop policy if exists "analytics own rows" on public.analytics;

create policy "profiles own rows" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "api keys own rows" on public.user_api_keys
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "chat sessions own rows" on public.chat_sessions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "messages own rows" on public.messages
  for all using (
    user_id = auth.uid()
    and exists (
      select 1 from public.chat_sessions
      where chat_sessions.id = messages.session_id
      and chat_sessions.user_id = auth.uid()
    )
  ) with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.chat_sessions
      where chat_sessions.id = messages.session_id
      and chat_sessions.user_id = auth.uid()
    )
  );

create policy "code files own rows" on public.code_files
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "code versions own files" on public.code_versions
  for all using (
    exists (
      select 1 from public.code_files
      where code_files.id = code_versions.file_id
      and code_files.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.code_files
      where code_files.id = code_versions.file_id
      and code_files.user_id = auth.uid()
    )
  );

create policy "code runs own rows" on public.code_runs
  for all using (
    user_id = auth.uid()
    and (
      file_id is null
      or exists (
        select 1 from public.code_files
        where code_files.id = code_runs.file_id
        and code_files.user_id = auth.uid()
      )
    )
  ) with check (
    user_id = auth.uid()
    and (
      file_id is null
      or exists (
        select 1 from public.code_files
        where code_files.id = code_runs.file_id
        and code_files.user_id = auth.uid()
      )
    )
  );

create policy "meetings own rows" on public.meetings
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "transcripts own meetings" on public.transcripts
  for all using (
    exists (
      select 1 from public.meetings
      where meetings.id = transcripts.meeting_id
      and meetings.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.meetings
      where meetings.id = transcripts.meeting_id
      and meetings.user_id = auth.uid()
    )
  );

create policy "meeting notes own meetings" on public.meeting_notes
  for all using (
    exists (
      select 1 from public.meetings
      where meetings.id = meeting_notes.meeting_id
      and meetings.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.meetings
      where meetings.id = meeting_notes.meeting_id
      and meetings.user_id = auth.uid()
    )
  );

create policy "analytics own rows" on public.analytics
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
