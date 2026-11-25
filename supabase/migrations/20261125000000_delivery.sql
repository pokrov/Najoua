create table public.delivery_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table public.delivery_galleries (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  title text not null,
  session_date date not null,
  message text not null default '',
  expires_at timestamptz not null,
  disabled_at timestamptz,
  deleting_at timestamptz,
  created_at timestamptz not null default now(),
  code_hash text not null,
  access_version uuid not null default gen_random_uuid()
);

create table public.delivery_files (
  id uuid primary key,
  gallery_id uuid not null references public.delivery_galleries(id) on delete cascade,
  name text not null,
  mime text not null,
  size bigint not null check (size > 0),
  state text not null default 'pending' check (state in ('pending', 'ready', 'deleting')),
  created_at timestamptz not null default now()
);

create index delivery_gallery_files on public.delivery_files(gallery_id);
create index delivery_gallery_created on public.delivery_galleries(created_at desc, id desc);
create table public.delivery_attempts (
  scope text not null,
  time_bucket bigint not null,
  attempts integer not null default 1,
  primary key (scope, time_bucket)
);

alter table public.delivery_admins enable row level security;
alter table public.delivery_galleries enable row level security;
alter table public.delivery_files enable row level security;
alter table public.delivery_attempts enable row level security;
revoke all on public.delivery_admins, public.delivery_galleries, public.delivery_files, public.delivery_attempts from anon, authenticated;
grant select, insert, update, delete on public.delivery_admins, public.delivery_galleries,
  public.delivery_files, public.delivery_attempts to service_role;

create function public.delivery_attempt(attempt_scope text, window_seconds integer)
returns integer
language sql
set search_path = ''
as $$
  insert into public.delivery_attempts as a (scope, time_bucket)
  values (attempt_scope, floor(extract(epoch from now()) / window_seconds))
  on conflict (scope, time_bucket) do update set attempts = a.attempts + 1
  returning attempts
$$;
revoke all on function public.delivery_attempt(text, integer) from public, anon, authenticated;
grant execute on function public.delivery_attempt(text, integer) to service_role;

create function public.delivery_reserve(gallery uuid, asset uuid, filename text, content_type text, bytes bigint)
returns public.delivery_files
language plpgsql
set search_path = ''
as $$
declare result public.delivery_files;
begin
  perform 1 from public.delivery_galleries where id = gallery and deleting_at is null for update;
  if not found then return null; end if;
  if (select count(*) from public.delivery_files where gallery_id = gallery) >= 250 then
    return null;
  end if;
  insert into public.delivery_files (id, gallery_id, name, mime, size)
  values (asset, gallery, filename, content_type, bytes)
  returning * into result;
  return result;
end
$$;
revoke all on function public.delivery_reserve(uuid, uuid, text, text, bigint) from public, anon, authenticated;
grant execute on function public.delivery_reserve(uuid, uuid, text, text, bigint) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('delivery-private', 'delivery-private', false, 52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']);

-- Locks serialize an authorized object insert with API deletion or finalization.
create function public.delivery_can_upload(object_name text)
returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare gallery uuid;
declare asset uuid;
begin
  if auth.uid() is null
    or not exists (select 1 from public.delivery_admins where user_id = auth.uid())
    or object_name !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}$' then
    return false;
  end if;
  gallery := split_part(object_name, '/', 1)::uuid;
  asset := split_part(object_name, '/', 2)::uuid;
  perform 1 from public.delivery_galleries where id = gallery and deleting_at is null for share;
  if not found then return false; end if;
  perform 1 from public.delivery_files
    where id = asset and gallery_id = gallery and state = 'pending'
      and created_at > now() - interval '1 hour' for share;
  return found;
exception when invalid_text_representation then
  return false;
end
$$;
revoke all on function public.delivery_can_upload(text) from public, anon, authenticated;
grant execute on function public.delivery_can_upload(text) to authenticated;

create policy "Studio upload to reserved path"
on storage.objects for insert to authenticated
with check (bucket_id = 'delivery-private' and public.delivery_can_upload(name));

create function public.delivery_usage()
returns bigint
language sql
set search_path = ''
as $$
  select coalesce(sum(size), 0)::bigint from public.delivery_files where state = 'ready'
$$;
revoke all on function public.delivery_usage() from public, anon, authenticated;
grant execute on function public.delivery_usage() to service_role;

create function public.delivery_list(term text, page_start integer)
returns setof public.delivery_galleries
language sql
set search_path = ''
as $$
  select * from public.delivery_galleries
  where position(lower(term) in lower(client_name || ' ' || title)) > 0 or term = ''
  order by created_at desc, id desc
  limit 21 offset page_start
$$;
revoke all on function public.delivery_list(text, integer) from public, anon, authenticated;
grant execute on function public.delivery_list(text, integer) to service_role;
