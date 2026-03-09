-- SQL para configurar las tablas base de Jaén Sports en Supabase

-- 1. Tabla de Usuarios (Perfiles extendidos)
create table
  public.users (
    id uuid references auth.users not null primary key,
    name text not null,
    email text not null unique,
    phone text,
    avatar text,
    location text default 'Jaén Capital',
    matchesPlayed integer default 0,
    matchesOrganized integer default 0,
    reliability integer default 100,
    createdAt timestamp with time zone default timezone('utc'::text, now()) not null
  );

-- Habilitar RLS para usuarios
alter table public.users enable row level security;

create policy "Perfiles son públicos" on public.users
  for select using (true);

create policy "Usuarios pueden actualizar su propio perfil" on public.users
  for update using (auth.uid() = id);

create policy "Usuarios pueden insertar su propio perfil en registro" on public.users
  for insert with check (auth.uid() = id);

-- 2. Tabla de Partidos
create table
  public.matches (
    id uuid default gen_random_uuid() primary key,
    sport text not null,
    facilityId text not null,
    date timestamp with time zone not null,
    duration integer default 90,
    price numeric not null,
    status text default 'open',
    organizer uuid references public.users(id) not null,
    players text[] default array[]::text[],
    maxPlayers integer not null,
    createdAt timestamp with time zone default timezone('utc'::text, now()) not null
  );

-- Habilitar RLS para partidos
alter table public.matches enable row level security;

create policy "Partidos son públicos" on public.matches
  for select using (true);

create policy "Usuarios autenticados pueden crear partidos" on public.matches
  for insert with check (auth.role() = 'authenticated');

create policy "Cualquiera puede actualizar partidos (apuntarse/desapuntarse)" on public.matches
  for update using (true);

create policy "Solo el organizador puede borrar su partido" on public.matches
  for delete using (auth.uid() = organizer);

-- 3. Trigger: crear perfil en public.users al registrarse (email o Google)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, email, "avatar")
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    coalesce(new.email, new.raw_user_meta_data->>'email', ''),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    name = coalesce(excluded.name, users.name),
    email = coalesce(excluded.email, users.email),
    avatar = coalesce(excluded.avatar, users.avatar);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
