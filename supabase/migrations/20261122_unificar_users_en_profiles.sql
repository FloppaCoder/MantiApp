-- Unifica las tablas users y profiles en una sola: profiles.
-- Ya se ejecutó en el proyecto de Supabase (2026-11-22). Se guarda aquí para documentar el cambio.
-- Reemplaza a 20261108_sync_technician_profiles.sql (el trigger que sincronizaba users -> profiles).

begin;

-- 0) Nueva columna apellido
alter table public.profiles add column apellido text;

-- 1) Perfiles existentes: nombre y apellido separados, tomados de users
update public.profiles p
set nombre   = coalesce(nullif(trim(u.nombre), ''), split_part(p.email, '@', 1)),
    apellido = nullif(trim(u.apellido), '')
from public.users u
where u.id = p.id;

-- 2) Los dos perfiles de demostracion (no existen en users)
update public.profiles set nombre = 'Roberto', apellido = 'Gómez'
where id = '11111111-1111-1111-1111-111111111111';
update public.profiles set nombre = 'Carlos', apellido = 'Méndez'
where id = '22222222-2222-2222-2222-222222222222';

-- 3) Crear perfil para quien solo estaba en users (los administradores)
insert into public.profiles (id, email, nombre, apellido, rol)
select
  u.id,
  u.email,
  coalesce(nullif(trim(u.nombre), ''), split_part(u.email, '@', 1)),
  nullif(trim(u.apellido), ''),
  u.rol
from public.users u
on conflict do nothing;

-- 4) Verificar que nadie se quedo sin perfil (si falla, se cancela todo)
do $$
begin
  if exists (
    select 1 from public.users u
    where not exists (select 1 from public.profiles p where p.id = u.id)
  ) then
    raise exception 'Hay usuarios sin perfil. No se elimina la tabla users.';
  end if;
end $$;

-- 5) Eliminar lo redundante
drop trigger if exists trg_sync_technician_profile on public.users;
drop trigger if exists trg_delete_technician_profile on public.users;
drop function if exists public.sync_technician_profile();
drop table public.users;

-- 6) profiles queda enlazada a la cuenta de Auth
alter table public.profiles alter column id drop default;
alter table public.profiles
  add constraint profiles_id_fkey
  foreign key (id) references auth.users (id) on delete cascade
  not valid;  -- no revisa los 2 perfiles de demostracion

-- 7) assets: aceptar "Otros" (la web ya la ofrece)
alter table public.assets drop constraint assets_categoria_check;
alter table public.assets add constraint assets_categoria_check
  check (categoria in ('Maquinaria', 'Vehículos', 'Herramientas', 'Equipos informáticos', 'Otros'));

-- 8) Un activo con ordenes no se puede borrar (se conserva el historial)
alter table public.work_orders drop constraint work_orders_asset_id_fkey;
alter table public.work_orders add constraint work_orders_asset_id_fkey
  foreign key (asset_id) references public.assets (id) on delete restrict;

-- 9) Fecha en que se completo cada orden
alter table public.work_orders add column fecha_completada timestamptz;

-- 10) Indices
create index work_orders_asset_id_idx on public.work_orders (asset_id);
create index maintenance_plans_asset_id_idx on public.maintenance_plans (asset_id);
create index maintenance_plans_proxima_fecha_idx on public.maintenance_plans (proxima_fecha);

commit;
