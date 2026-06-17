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

create index if not exists trial_records_created_at_idx
  on public.trial_records (created_at desc);

create index if not exists trial_records_school_idx
  on public.trial_records (school);

create index if not exists trial_records_module_id_idx
  on public.trial_records (module_id);

create index if not exists trial_records_posted_group_name_idx
  on public.trial_records (posted_group_name);
