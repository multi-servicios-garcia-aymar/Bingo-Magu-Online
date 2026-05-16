-- PROCEDIMIENTO PARA ACTUALIZAR O REINICIAR LA BASE DE DATOS
-- 1. Eliminar tablas existentes (¡CUIDADO! Esto borrará los datos)
-- drop table if exists participants;
-- drop table if exists game_sessions;

-- 2. Crear tabla de sesiones de juego (si no existe)
create table if not exists game_sessions (
  id uuid default gen_random_uuid() primary key,
  status text check (status in ('waiting', 'playing', 'finished')) default 'waiting',
  is_paused boolean default false,
  type text check (type in ('global', 'personal')) default 'global',
  creator_id text,
  current_number int,
  drawn_numbers int[] default '{}',
  ball_limit int default 75,
  winning_pattern text default 'full',
  winner_id text,
  last_ball_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- Si la tabla ya existe pero no tiene la columna is_paused:
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name='game_sessions' and column_name='is_paused') then
    alter table game_sessions add column is_paused boolean default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='game_sessions' and column_name='last_ball_at') then
    alter table game_sessions add column last_ball_at timestamp with time zone default now();
  end if;
end $$;

-- 3. Crear tabla de participantes (si no existe)
create table if not exists participants (
  id uuid default gen_random_uuid() primary key,
  game_id uuid references game_sessions(id) on delete cascade,
  user_id text not null,
  user_name text not null,
  card_data jsonb not null,
  marked_keys text[] default '{}',
  has_won boolean default false,
  joined_at timestamp with time zone default now()
);

-- Si la tabla ya existe pero no tiene marked_keys:
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name='participants' and column_name='marked_keys') then
    alter table participants add column marked_keys text[] default '{}';
  end if;
end $$;

-- 6. Tabla de Perfiles para Super Administradores y Usuarios
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  username text,
  avatar_url text,
  is_admin boolean default false,
  is_super_admin boolean default false,
  is_banned boolean default false,
  last_seen_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Si la tabla ya existe, asegurar columnas
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='username') then
    alter table profiles add column username text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='avatar_url') then
    alter table profiles add column avatar_url text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='is_admin') then
    alter table profiles add column is_admin boolean default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='last_seen_at') then
    alter table profiles add column last_seen_at timestamp with time zone default now();
  end if;
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='is_banned') then
    alter table profiles add column is_banned boolean default false;
  end if;
end $$;

-- Funciones seguras para evitar recursión en RLS
create or replace function public.check_is_super_admin(user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles 
    where id = user_id and is_super_admin = true
  );
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.check_is_admin(user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles 
    where id = user_id and (is_admin = true or is_super_admin = true)
  );
end;
$$ language plpgsql security definer set search_path = public;

-- Habilitar RLS en perfiles
alter table profiles enable row level security;

drop policy if exists "Perfiles visibles para todos" on profiles;
create policy "Perfiles visibles para todos"
  on profiles for select
  using ( true );

drop policy if exists "Usuarios pueden actualizar su propio perfil" on profiles;
create policy "Usuarios pueden actualizar su propio perfil"
  on profiles for update
  using ( auth.uid() = id );

drop policy if exists "Super admins gestionan todo" on profiles;
create policy "Super admins gestionan todo"
  on profiles for all
  using ( check_is_super_admin(auth.uid()) );

-- 7. Configuración de Almacenamiento (Storage)
-- Nota: El bucket 'assets' debe crearse manualmente en el panel de Supabase o mediante SQL
insert into storage.buckets (id, name, public)
values ('assets', 'assets', true)
on conflict (id) do nothing;

-- Políticas de Storage para el bucket assets
drop policy if exists "Cualquiera puede ver assets" on storage.objects;
create policy "Cualquiera puede ver assets"
  on storage.objects for select
  using ( bucket_id = 'assets' );

drop policy if exists "Usuarios autenticados pueden subir avatars" on storage.objects;
create policy "Usuarios autenticados pueden subir avatars"
  on storage.objects for insert
  with check ( 
    bucket_id = 'assets' AND 
    auth.role() = 'authenticated'
  );

drop policy if exists "Usuarios pueden actualizar sus propios assets" on storage.objects;
create policy "Usuarios pueden actualizar sus propios assets"
  on storage.objects for update
  using ( bucket_id = 'assets' AND auth.uid() = owner );

drop policy if exists "Usuarios pueden borrar sus propios assets" on storage.objects;
create policy "Usuarios pueden borrar sus propios assets"
  on storage.objects for delete
  using ( bucket_id = 'assets' AND auth.uid() = owner );

-- RELLENO RETROACTIVO: Insertar usuarios que ya existen en auth.users pero no en profiles
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- Trigger para crear perfil automáticamente al registrar un usuario futuro
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Borrar trigger si existe para evitar errores al re-ejecutar
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. Tabla de Publicidad
create table if not exists publicity (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  message text not null,
  image_url text,
  media_type text default 'image', -- 'image' | 'video'
  target_user_ids text[] default null, -- null = todos
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- Si la tabla ya existe pero no tiene media_type:
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name='publicity' and column_name='media_type') then
    alter table publicity add column media_type text default 'image';
  end if;
  if not exists (select 1 from information_schema.columns where table_name='publicity' and column_name='external_url') then
    alter table publicity add column external_url text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='publicity' and column_name='display_settings') then
    alter table publicity add column display_settings jsonb default '{}';
  end if;
end $$;

-- 8. Buckets de Almacenamiento (Si no existen)
insert into storage.buckets (id, name, public)
select 'assets', 'assets', true
where not exists (
  select 1 from storage.buckets where id = 'assets'
);

-- Políticas de Bucket (Limpiar y Recrear)
drop policy if exists "Acceso público a assets" on storage.objects;
create policy "Acceso público a assets" on storage.objects for select using (bucket_id = 'assets');
drop policy if exists "Admin total assets" on storage.objects;
create policy "Admin total assets" on storage.objects for all using (
  bucket_id = 'assets' and 
  exists (select 1 from public.profiles where id = auth.uid() and is_super_admin = true)
);

-- 4. Habilitar Realtime de forma segura
do $$
begin
  -- Intentar crear la publicación si no existe
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

-- Agregar tablas a la publicación solo si no están ya presentes
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'game_sessions') then
    alter publication supabase_realtime add table game_sessions;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'participants') then
    alter publication supabase_realtime add table participants;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles') then
    alter publication supabase_realtime add table profiles;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'publicity') then
    alter publication supabase_realtime add table publicity;
  end if;
end $$;

-- 5. Políticas de Seguridad (RLS)
alter table game_sessions enable row level security;
alter table participants enable row level security;
alter table profiles enable row level security;
alter table publicity enable row level security;

-- Eliminar políticas viejas para reiniciarlas
drop policy if exists "Acceso total para todos" on game_sessions;
drop policy if exists "Acceso total para todos" on participants;
drop policy if exists "Lectura pública de sesiones" on game_sessions;
drop policy if exists "Creación de sesiones para autenticados" on game_sessions;
drop policy if exists "Update de sesiones para admin o creador" on game_sessions;
drop policy if exists "Delete de sesiones para superadmin" on game_sessions;
drop policy if exists "Lectura pública de participantes" on participants;
drop policy if exists "Unirse a juego" on participants;
drop policy if exists "Actualización de propios datos" on participants;
drop policy if exists "Delete de participantes para admin o dueño" on participants;
drop policy if exists "Publicidad visible para todos" on publicity;
drop policy if exists "Admin total publicidad" on publicity;

create policy "Lectura pública de sesiones" on game_sessions for select using (true);
create policy "Creación de sesiones para autenticados" on game_sessions for insert with check (auth.role() = 'authenticated');
create policy "Update de sesiones para admin o creador" on game_sessions for update using (
  check_is_admin(auth.uid()) or (auth.uid()::text = creator_id)
);
create policy "Delete de sesiones para superadmin" on game_sessions for delete using (check_is_super_admin(auth.uid()));

create policy "Lectura pública de participantes" on participants for select using (true);
create policy "Unirse a juego" on participants for insert with check (auth.role() = 'authenticated');
create policy "Actualización de propios datos" on participants for update using (auth.uid()::text = user_id);
create policy "Delete de participantes para admin o dueño" on participants for delete using (
  check_is_admin(auth.uid()) or (auth.uid()::text = user_id)
);

create policy "Publicidad visible para todos" on publicity for select using (true);
create policy "Admin total publicidad" on publicity for all using (
  check_is_super_admin(auth.uid())
);

-- 9. Índices de Rendimiento (Escalabilidad)
create index if not exists idx_game_sessions_status_worker on game_sessions (status, is_paused, last_ball_at);
create index if not exists idx_game_sessions_type on game_sessions (type, creator_id);
create index if not exists idx_participants_game_id on participants (game_id);
create index if not exists idx_participants_user_win on participants (user_id, has_won);
create index if not exists idx_profiles_roles on profiles (is_super_admin, is_admin, is_banned);
create index if not exists idx_profiles_last_seen on profiles (last_seen_at desc);

-- 10. Función Atómica para Sorteo (Evita balotas dobles)
create or replace function draw_next_bingo_number(target_game_id uuid, draw_interval_seconds int)
returns json as $$
declare
  game_record record;
  available_numbers int[];
  next_num int;
  updated_drawn_numbers int[];
begin
  -- Bloquear la fila para evitar que otro worker la toque al mismo tiempo
  select * into game_record 
  from game_sessions 
  where id = target_game_id 
  for update skip locked;

  if not found then
    return json_build_object('success', false, 'error', 'Game locked or not found');
  end if;

  -- Verificar si realmente le toca balota (Doble validación de seguridad)
  if game_record.status != 'playing' or game_record.is_paused = true then
    return json_build_object('success', false, 'error', 'Game not active');
  end if;

  if game_record.last_ball_at is not null and (now() - game_record.last_ball_at) < (draw_interval_seconds || ' seconds')::interval then
    return json_build_object('success', false, 'error', 'Too early');
  end if;
  
  if game_record.last_ball_at is null and (now() - game_record.created_at) < (draw_interval_seconds || ' seconds')::interval then
    return json_build_object('success', false, 'error', 'Too early for first ball');
  end if;

  -- Calcular números disponibles
  select array_agg(s.n) into available_numbers
  from generate_series(1, game_record.ball_limit) s(n)
  where s.n != all(coalesce(game_record.drawn_numbers, '{}'));

  if available_numbers is null or array_length(available_numbers, 1) = 0 then
    update game_sessions set status = 'finished' where id = target_game_id;
    return json_build_object('success', true, 'finished', true);
  end if;

  -- Elegir número aleatorio
  next_num := available_numbers[floor(random() * array_length(available_numbers, 1) + 1)];
  updated_drawn_numbers := array_append(coalesce(game_record.drawn_numbers, '{}'), next_num);

  -- Actualizar
  update game_sessions set
    current_number = next_num,
    drawn_numbers = updated_drawn_numbers,
    last_ball_at = now()
  where id = target_game_id;

  return json_build_object('success', true, 'number', next_num);
end;
$$ language plpgsql security definer;

-- 11. Tabla de Suscripciones Push
create table if not exists push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  subscription jsonb not null,
  created_at timestamp with time zone default now()
);

-- Índices
create index if not exists idx_push_subscriptions_user_id on push_subscriptions(user_id);

-- RLS para Suscripciones Push
alter table push_subscriptions enable row level security;

drop policy if exists "Usuarios pueden ver sus propias suscripciones" on push_subscriptions;
create policy "Usuarios pueden ver sus propias suscripciones"
  on push_subscriptions for select
  using ( auth.uid()::text = user_id );

drop policy if exists "Usuarios pueden agregar sus suscripciones" on push_subscriptions;
create policy "Usuarios pueden agregar sus suscripciones"
  on push_subscriptions for insert
  with check ( auth.uid()::text = user_id );

drop policy if exists "Usuarios pueden borrar sus propias suscripciones" on push_subscriptions;
create policy "Usuarios pueden borrar sus propias suscripciones"
  on push_subscriptions for delete
  using ( auth.uid()::text = user_id );

GRANT ALL ON public.push_subscriptions TO postgres, service_role, anon, authenticated;

-- 12. Tabla de Chat del Juego
create table if not exists game_chat (
  id uuid default gen_random_uuid() primary key,
  game_id uuid references game_sessions(id) on delete cascade,
  user_id text not null,
  user_name text not null,
  message text not null,
  created_at timestamp with time zone default now()
);

create index if not exists idx_game_chat_game_id on game_chat(game_id);

alter table game_chat enable row level security;

drop policy if exists "Lectura pública de chat" on game_chat;
create policy "Lectura pública de chat" on game_chat for select using (true);

drop policy if exists "Enviar mensajes para autenticados" on game_chat;
create policy "Enviar mensajes para autenticados" on game_chat for insert with check (auth.role() = 'authenticated');

-- Añadir a realtime
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'game_chat') then
    alter publication supabase_realtime add table game_chat;
  end if;
end $$;
