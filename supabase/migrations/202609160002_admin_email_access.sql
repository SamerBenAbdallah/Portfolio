create table if not exists public.admin_emails (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

alter table public.admin_emails enable row level security;

create policy "Admins can read their email membership"
on public.admin_emails for select
to authenticated
using (email = lower(coalesce(auth.jwt() ->> 'email', '')));

create or replace function public.is_portfolio_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (select 1 from public.admin_users where user_id = auth.uid())
    or exists (
      select 1
      from public.admin_emails
      where email = lower(coalesce(auth.jwt() ->> 'email', ''))
    );
$$;

revoke all on function public.is_portfolio_admin() from public;
grant execute on function public.is_portfolio_admin() to authenticated;
