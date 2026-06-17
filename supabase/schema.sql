create table if not exists public.trial_records (
  id text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  operator_name text,
  school text,
  country text,
  module_id text,
  module_name text,
  time_node text,
  recent_discussion text,
  dialogue_id text,
  dialogue_key text,
  dialogue_title text,
  dialogue_angle text,
  copy_text text,
  posted_group_name text,
  group_size integer default 0,
  posted_at timestamptz,
  reply_count integer default 0,
  active_effect text,
  edit_level text,
  quality_score integer default 0,
  risk_status text,
  risk_note text,
  note text
);

create index if not exists trial_records_created_at_idx on public.trial_records (created_at desc);
create index if not exists trial_records_school_idx on public.trial_records (school);
create index if not exists trial_records_module_id_idx on public.trial_records (module_id);
create index if not exists trial_records_posted_group_name_idx on public.trial_records (posted_group_name);

create table if not exists public.published_topics (
  id text primary key,
  created_at timestamptz not null default now(),
  school text,
  country text,
  module_id text,
  module_name text,
  dialogue_key text,
  title text,
  copy_text text,
  effect text,
  posted_group_name text,
  operator_name text
);

create index if not exists published_topics_module_key_idx on public.published_topics (module_id, dialogue_key);

create table if not exists public.bug_reports (
  id text primary key,
  created_at timestamptz not null default now(),
  reporter_name text,
  title text,
  description text,
  severity text default '一般',
  status text default '待处理',
  school text,
  module_name text
);

create index if not exists bug_reports_created_at_idx on public.bug_reports (created_at desc);
create index if not exists bug_reports_status_idx on public.bug_reports (status);

create table if not exists public.user_testing_logs (
  id text primary key,
  created_at timestamptz not null default now(),
  tester_name text,
  test_date date,
  school text,
  module_name text,
  generated_count integer default 0,
  published_count integer default 0,
  bug_count integer default 0,
  notes text
);

create index if not exists user_testing_logs_test_date_idx on public.user_testing_logs (test_date desc);
create index if not exists user_testing_logs_tester_idx on public.user_testing_logs (tester_name);

create table if not exists public.ai_safety_records (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  school text,
  country text,
  group_type text,
  time_node text,
  risk_type text,
  student_question text,
  recent_discussion text,
  risk_judgement text,
  not_suitable_to_say text,
  senior_reply text,
  peer_reply text,
  group_opening text,
  follow_up text,
  safety_reminder text,
  need_official_confirmation text,
  source text
);

create index if not exists ai_safety_records_created_at_idx on public.ai_safety_records (created_at desc);
create index if not exists ai_safety_records_risk_type_idx on public.ai_safety_records (risk_type);
