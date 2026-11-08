-- ============================================================================
-- MantiApp · Sincronizar técnicos entre public.users y public.profiles
-- Fecha: 2026-11-08
--
-- PROBLEMA
--   El registro (web y móvil) inserta solo en public.users, pero:
--     · /api/tecnicos lee public.profiles  -> los técnicos nuevos no aparecen.
--     · work_orders.tecnico_id -> profiles.id, y las APIs móviles filtran por
--       auth.uid -> si profiles.id <> users.id, el técnico no ve sus órdenes.
--
-- SOLUCIÓN
--   1. Crear una fila en profiles para cada usuario con rol 'tecnico',
--      usando profiles.id = users.id (la convención que ya usa el código).
--   2. Mantener la sincronización con un trigger sobre public.users.
--
-- ALCANCE
--   No renombra tablas ni cambia columnas. Es compatible con el código actual.
-- ============================================================================

begin;

-- 1) Backfill: perfil para cada técnico que aún no lo tiene.
insert into public.profiles (id, email, nombre, rol, created_at)
select
  u.id,
  u.email,
  coalesce(
    nullif(trim(concat_ws(' ', u.nombre, u.apellido)), ''),
    split_part(u.email, '@', 1)
  ),
  'tecnico',
  now()
from public.users u
where lower(trim(u.rol)) = 'tecnico'
  and not exists (
    select 1 from public.profiles p where p.id = u.id
  );

-- 2) Función de sincronización.
create or replace function public.sync_technician_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nombre text;
begin
  if tg_op = 'DELETE' then
    delete from public.profiles where id = old.id;
    return old;
  end if;

  v_nombre := coalesce(
    nullif(trim(concat_ws(' ', new.nombre, new.apellido)), ''),
    split_part(new.email, '@', 1)
  );

  if lower(trim(new.rol)) = 'tecnico' then
    insert into public.profiles (id, email, nombre, rol, created_at)
    values (new.id, new.email, v_nombre, 'tecnico', now())
    on conflict (id) do update
      set email  = excluded.email,
          nombre = excluded.nombre,
          rol    = excluded.rol;
  else
    -- Si deja de ser técnico, el perfil se conserva pero sale del directorio.
    update public.profiles
       set email  = new.email,
           nombre = v_nombre,
           rol    = new.rol
     where id = new.id;
  end if;

  return new;
end;
$$;

-- 3) Triggers sobre public.users.
drop trigger if exists trg_sync_technician_profile on public.users;
create trigger trg_sync_technician_profile
after insert or update of email, nombre, apellido, rol on public.users
for each row execute function public.sync_technician_profile();

drop trigger if exists trg_delete_technician_profile on public.users;
create trigger trg_delete_technician_profile
after delete on public.users
for each row execute function public.sync_technician_profile();

-- 4) Índice para las consultas del móvil y del panel.
create index if not exists work_orders_tecnico_id_idx
  on public.work_orders (tecnico_id);

commit;

-- ============================================================================
-- VERIFICACIÓN (ejecutar después del commit)
-- ============================================================================

-- Debe devolver 0.
select count(*) as tecnicos_sin_perfil
from public.users u
left join public.profiles p on p.id = u.id
where lower(trim(u.rol)) = 'tecnico'
  and p.id is null;

-- Debe listar 8 técnicos reales (además del perfil demo de Carlos).
select u.id, u.email, p.nombre, p.especialidad, p.telefono
from public.users u
join public.profiles p on p.id = u.id
where lower(trim(u.rol)) = 'tecnico'
order by p.nombre;

-- Órdenes huérfanas: asignadas a un perfil que no tiene cuenta de login.
select wo.codigo_ot, wo.estado, wo.tecnico_id
from public.work_orders wo
left join public.users u on u.id = wo.tecnico_id
where wo.tecnico_id is not null and u.id is null;

-- ============================================================================
-- OPCIONAL · Reasignar órdenes del perfil demo (sin cuenta) a un técnico real.
-- Descomentar y ajustar el correo antes de ejecutar.
-- ============================================================================
-- update public.work_orders
--    set tecnico_id = (
--      select id from public.users where email = 'susancoreas@gmail.com'
--    )
--  where tecnico_id in (
--    select p.id
--    from public.profiles p
--    left join public.users u on u.id = p.id
--    where u.id is null
--  );
