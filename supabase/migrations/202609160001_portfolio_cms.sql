create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_portfolio_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

revoke all on function public.is_portfolio_admin() from public;
grant execute on function public.is_portfolio_admin() to anon, authenticated;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  short_description text not null default '',
  full_description text not null default '',
  category text not null default 'Uncategorized',
  project_type text not null default 'graphic' check (project_type in ('graphic', 'motion')),
  cover_image text not null default '',
  gallery_images jsonb not null default '[]'::jsonb check (jsonb_typeof(gallery_images) = 'array'),
  video_url text,
  video_items jsonb not null default '[]'::jsonb check (jsonb_typeof(video_items) = 'array'),
  behance_url text,
  external_url text,
  tools text[] not null default '{}',
  deliverables text[] not null default '{}',
  year integer check (year is null or year between 1990 and 2100),
  client text,
  featured boolean not null default false,
  published boolean not null default false,
  display_order integer not null default 0 check (display_order >= 0),
  accent text not null default '#1fe7ff' check (accent ~ '^#[0-9A-Fa-f]{6}$'),
  secondary text not null default '#123cc5' check (secondary ~ '^#[0-9A-Fa-f]{6}$'),
  longform boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_public_order_idx on public.projects (published, display_order);
create index if not exists projects_featured_idx on public.projects (featured) where featured = true;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

alter table public.admin_users enable row level security;
alter table public.projects enable row level security;

drop policy if exists "Admins can read their membership" on public.admin_users;
create policy "Admins can read their membership"
on public.admin_users for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Public can read published projects" on public.projects;
create policy "Public can read published projects"
on public.projects for select
to anon, authenticated
using (published = true or public.is_portfolio_admin());

drop policy if exists "Admins can insert projects" on public.projects;
create policy "Admins can insert projects"
on public.projects for insert
to authenticated
with check (public.is_portfolio_admin());

drop policy if exists "Admins can update projects" on public.projects;
create policy "Admins can update projects"
on public.projects for update
to authenticated
using (public.is_portfolio_admin())
with check (public.is_portfolio_admin());

drop policy if exists "Admins can delete projects" on public.projects;
create policy "Admins can delete projects"
on public.projects for delete
to authenticated
using (public.is_portfolio_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-media',
  'project-media',
  true,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view project media" on storage.objects;
create policy "Public can view project media"
on storage.objects for select
to public
using (bucket_id = 'project-media');

drop policy if exists "Admins can upload project media" on storage.objects;
create policy "Admins can upload project media"
on storage.objects for insert
to authenticated
with check (bucket_id = 'project-media' and public.is_portfolio_admin());

drop policy if exists "Admins can update project media" on storage.objects;
create policy "Admins can update project media"
on storage.objects for update
to authenticated
using (bucket_id = 'project-media' and public.is_portfolio_admin())
with check (bucket_id = 'project-media' and public.is_portfolio_admin());

drop policy if exists "Admins can delete project media" on storage.objects;
create policy "Admins can delete project media"
on storage.objects for delete
to authenticated
using (bucket_id = 'project-media' and public.is_portfolio_admin());
