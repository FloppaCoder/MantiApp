begin;

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
    update public.profiles
       set email  = new.email,
           nombre = v_nombre,
           rol    = new.rol
     where id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_technician_profile on public.users;
create trigger trg_sync_technician_profile
after insert or update of email, nombre, apellido, rol on public.users
for each row execute function public.sync_technician_profile();

drop trigger if exists trg_delete_technician_profile on public.users;
create trigger trg_delete_technician_profile
after delete on public.users
for each row execute function public.sync_technician_profile();

create index if not exists work_orders_tecnico_id_idx
  on public.work_orders (tecnico_id);

commit;

select count(*) as tecnicos_sin_perfil
from public.users u
left join public.profiles p on p.id = u.id
where lower(trim(u.rol)) = 'tecnico'
  and p.id is null;

select u.id, u.email, p.nombre, p.especialidad, p.telefono
from public.users u
join public.profiles p on p.id = u.id
where lower(trim(u.rol)) = 'tecnico'
order by p.nombre;

select wo.codigo_ot, wo.estado, wo.tecnico_id
from public.work_orders wo
left join public.users u on u.id = wo.tecnico_id
where wo.tecnico_id is not null and u.id is null;
