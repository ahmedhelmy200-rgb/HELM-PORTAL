-- HELM Portal: secure Meta (Facebook + Instagram) social publishing
-- Apply after migration 030.

create table if not exists public.social_connections (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'meta' check (provider = 'meta'),
  connected_by uuid references auth.users(id) on delete set null,
  facebook_page_id text not null,
  facebook_page_name text,
  instagram_business_id text,
  instagram_username text,
  granted_scopes text[] not null default '{}',
  token_expires_at timestamptz,
  is_active boolean not null default true,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider)
);

create table if not exists public.social_connection_secrets (
  connection_id uuid primary key references public.social_connections(id) on delete cascade,
  page_access_token text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.social_oauth_states (
  state_hash text primary key,
  requested_by uuid not null references auth.users(id) on delete cascade,
  requested_page_id text,
  return_url text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete restrict,
  caption text not null default '',
  media_bucket text,
  media_path text,
  targets text[] not null default array['facebook']::text[],
  instagram_placement text not null default 'story' check (instagram_placement in ('feed', 'story')),
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'publishing', 'published', 'partially_published', 'failed')),
  scheduled_at timestamptz,
  published_at timestamptz,
  provider_results jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (targets <@ array['facebook','instagram']::text[]),
  check (cardinality(targets) > 0),
  check (caption <> '' or media_path is not null)
);

create index if not exists social_posts_queue_idx
  on public.social_posts (status, scheduled_at)
  where status = 'scheduled';

alter table public.social_connections enable row level security;
alter table public.social_connection_secrets enable row level security;
alter table public.social_oauth_states enable row level security;
alter table public.social_posts enable row level security;

drop policy if exists "admin manage social connections" on public.social_connections;
create policy "admin manage social connections" on public.social_connections
for all to authenticated
using (public.is_admin_email(auth.email()))
with check (public.is_admin_email(auth.email()));

drop policy if exists "admin manage social posts" on public.social_posts;
create policy "admin manage social posts" on public.social_posts
for all to authenticated
using (public.is_admin_email(auth.email()))
with check (public.is_admin_email(auth.email()));

-- Secrets and OAuth states are deliberately service-role only.
revoke all on public.social_connection_secrets from anon, authenticated;
revoke all on public.social_oauth_states from anon, authenticated;
grant select, insert, update, delete on public.social_connections to authenticated;
grant select, insert, update, delete on public.social_posts to authenticated;

create or replace function public.touch_social_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_social_connections_updated_at on public.social_connections;
create trigger trg_social_connections_updated_at
before update on public.social_connections
for each row execute function public.touch_social_updated_at();

drop trigger if exists trg_social_posts_updated_at on public.social_posts;
create trigger trg_social_posts_updated_at
before update on public.social_posts
for each row execute function public.touch_social_updated_at();

comment on table public.social_connection_secrets is
  'Meta page tokens. Service-role only; never expose this table through the browser.';
comment on table public.social_posts is
  'HELM Portal publishing queue for Facebook Pages and connected Instagram professional accounts.';
