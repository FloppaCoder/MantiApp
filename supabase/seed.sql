-- ============================================================================
-- MantiApp · Datos de demostración
--
-- QUÉ HACE (todo en una sola transacción: si algo falla, no se cambia nada):
--   1. Borra TODAS las órdenes, planes de mantenimiento y activos.
--   2. Borra todos los perfiles y cuentas de acceso (auth.users), EXCEPTO las 3 cuentas a conservar.
--   3. Carga datos de prueba: 8 activos, 9 planes de mantenimiento y 8 órdenes de trabajo.
--
-- CÓMO SE USA: pegar este archivo completo en Supabase → SQL Editor y ejecutarlo.
--   Se puede volver a ejecutar las veces que haga falta: siempre deja los mismos datos.
--
-- ANTES DE EJECUTARLO:
--   * Haz un respaldo (Table Editor → Export data) porque el borrado no se puede deshacer.
--   * Las cuentas a conservar deben existir y al menos una debe tener rol "tecnico"
--     (a las cuentas conservadas con rol tecnico se les asignan las órdenes).
--   * Para tener más técnicos en el directorio: registra sus cuentas ANTES de ejecutar este archivo
--     y agrega sus correos a la lista v_conservar (más abajo). Si no están en esa lista,
--     este script también las borra.
--
-- Las fechas se calculan a partir del día en que se ejecuta (hora de El Salvador), así que
-- siempre hay planes vencidos, próximos y programados para mostrar en la defensa.
-- Las fotos de evidencia no se cargan aquí (son archivos del bucket): se suben desde la app móvil.
-- ============================================================================

begin;

do $$
declare
  -- Cuentas que se conservan
  v_conservar text[] := array['marcelo@gmail.com', 'marce.buddy06@gmail.com', 'socialtest700@gmail.com'];
  v_encontradas int;

  -- Técnicos disponibles (entre las cuentas conservadas)
  v_tecnicos uuid[];
  v_n int;
  v_t1 uuid;
  v_t2 uuid;

  -- "Hoy" según la hora de El Salvador, que es la que usa la aplicación
  v_ahora timestamptz := now();
  v_hoy date := (now() at time zone 'America/El_Salvador')::date;

  -- Listas de tareas de las órdenes (las mismas 4 que crea la web)
  v_chk_vacio jsonb := '[{"tarea":"Verificar condiciones de seguridad","completada":false},{"tarea":"Inspeccionar componentes principales","completada":false},{"tarea":"Ejecutar tarea de mantenimiento","completada":false},{"tarea":"Limpiar área de trabajo","completada":false}]';
  v_chk_parcial jsonb := '[{"tarea":"Verificar condiciones de seguridad","completada":true},{"tarea":"Inspeccionar componentes principales","completada":true},{"tarea":"Ejecutar tarea de mantenimiento","completada":false},{"tarea":"Limpiar área de trabajo","completada":false}]';
  v_chk_completo jsonb := '[{"tarea":"Verificar condiciones de seguridad","completada":true},{"tarea":"Inspeccionar componentes principales","completada":true},{"tarea":"Ejecutar tarea de mantenimiento","completada":true},{"tarea":"Limpiar área de trabajo","completada":true}]';
begin
  -- ---------------------------------------------------------------------------
  -- Seguridad: no borrar nada si no se encuentran las cuentas a conservar
  -- ---------------------------------------------------------------------------
  select count(*) into v_encontradas from auth.users where lower(email) = any (v_conservar);
  if v_encontradas = 0 then
    raise exception 'No se encontró ninguna de las cuentas a conservar (%). No se borró nada.', v_conservar;
  end if;
  if v_encontradas < array_length(v_conservar, 1) then
    raise notice 'Solo se encontraron % de % cuentas a conservar.', v_encontradas, array_length(v_conservar, 1);
  end if;

  select coalesce(array_agg(id order by email), '{}') into v_tecnicos
    from public.profiles
   where rol = 'tecnico' and lower(email) = any (v_conservar);
  v_n := coalesce(array_length(v_tecnicos, 1), 0);
  if v_n = 0 then
    raise exception 'Ninguna de las cuentas a conservar tiene rol tecnico: no hay a quién asignar las órdenes. No se borró nada.';
  end if;
  v_t1 := v_tecnicos[1];
  v_t2 := v_tecnicos[least(2, v_n)];  -- si solo hay un técnico, se usa el mismo

  -- ---------------------------------------------------------------------------
  -- 1) Borrar los datos (primero lo que depende de otras tablas)
  -- ---------------------------------------------------------------------------
  delete from public.work_orders;
  delete from public.maintenance_plans;
  delete from public.assets;
  delete from public.profiles where lower(email) <> all (v_conservar);
  delete from auth.users where lower(email) <> all (v_conservar);

  -- ---------------------------------------------------------------------------
  -- 2) Datos de contacto de los técnicos (solo si todavía no los tienen)
  -- ---------------------------------------------------------------------------
  update public.profiles
     set especialidad = coalesce(especialidad, 'Técnico mecánico'),
         telefono = coalesce(telefono, '7000-0001')
   where id = v_t1;
  if v_t2 <> v_t1 then
    update public.profiles
       set especialidad = coalesce(especialidad, 'Técnico en refrigeración'),
           telefono = coalesce(telefono, '7000-0002')
     where id = v_t2;
  end if;

  -- ---------------------------------------------------------------------------
  -- 3) Activos (8). Los que tienen una orden abierta quedan "En Mantenimiento".
  -- ---------------------------------------------------------------------------
  insert into public.assets (codigo, nombre, categoria, ubicacion, estado) values
    ('A-101', 'Torno CNC industrial',          'Maquinaria',           'Planta A · Línea 2',       'En Mantenimiento'),
    ('A-102', 'Compresor de aire',             'Maquinaria',           'Taller central',           'Operativo'),
    ('M-103', 'Planta eléctrica de emergencia','Maquinaria',           'Cuarto eléctrico',         'Fuera de Servicio'),
    ('V-201', 'Camioneta de reparto Hilux',    'Vehículos',            'Bodega principal',         'En Mantenimiento'),
    ('V-202', 'Motocicleta de mensajería',     'Vehículos',            'Parqueo',                  'Operativo'),
    ('H-301', 'Taladro industrial',            'Herramientas',         'Almacén de herramientas',  'Operativo'),
    ('I-401', 'Servidor de archivos',          'Equipos informáticos', 'Oficina administrativa',   'Operativo'),
    ('E-501', 'Aire acondicionado sala de ventas', 'Otros',            'Sala de ventas',           'En Mantenimiento');

  -- ---------------------------------------------------------------------------
  -- 4) Planes de mantenimiento (9). "dias" = días desde hoy (negativo = ya venció).
  --    Vencido si ya pasó la fecha, Próximo si faltan 7 días o menos, Programado si falta más.
  -- ---------------------------------------------------------------------------
  insert into public.maintenance_plans (asset_id, tipo, tarea, frecuencia, proxima_fecha, prioridad, estado)
  select a.id, p.tipo, p.tarea, p.frecuencia, v_hoy + p.dias, p.prioridad,
         case when p.completado then 'Completado'
              when p.dias < 0 then 'Vencido'
              when p.dias <= 7 then 'Próximo'
              else 'Programado' end
    from (values
      ('A-101', 'Preventivo', 'Lubricación de guías y husillo',          'Mensual',    -3, 'Crítica', false),
      ('E-501', 'Preventivo', 'Limpieza de filtros y revisión de gas',   'Trimestral', -10, 'Alta',    false),
      ('M-103', 'Correctivo', 'Prueba de arranque de planta eléctrica',  'Mensual',     1, 'Crítica', false),
      ('I-401', 'Preventivo', 'Respaldo y limpieza del servidor',        'Mensual',     2, 'Alta',    false),
      ('A-102', 'Preventivo', 'Revisión de válvulas y purga del tanque', 'Trimestral',  5, 'Media',   false),
      ('V-201', 'Preventivo', 'Cambio de aceite y filtros',              'Semestral',  12, 'Media',   false),
      ('V-202', 'Preventivo', 'Revisión de frenos y cadena',             'Trimestral', 25, 'Alta',    false),
      ('H-301', 'Preventivo', 'Inspección y calibración de herramientas','Anual',      40, 'Baja',    false),
      ('A-102', 'Correctivo', 'Cambio de aceite del compresor',          'Semestral', -15, 'Media',   true)
    ) as p(codigo, tipo, tarea, frecuencia, dias, prioridad, completado)
    join public.assets a on a.codigo = p.codigo;

  -- ---------------------------------------------------------------------------
  -- 5) Órdenes de trabajo (8): 2 pendientes, 1 asignada, 1 en progreso y 4 completadas.
  --    tecnico: 0 = sin asignar, 1 = primer técnico, 2 = segundo técnico.
  --    dias_vence: días desde hoy. dias_completada: hace cuántos días se completó (dentro del mes actual).
  --    dias_creada: hace cuántos días se creó la orden.
  -- ---------------------------------------------------------------------------
  insert into public.work_orders
    (codigo_ot, asset_id, tecnico_id, titulo, descripcion, instrucciones_seguridad, prioridad, estado,
     checklist, fecha_vencimiento, fecha_completada, observaciones, created_at)
  select o.codigo_ot, a.id,
         case o.tecnico when 1 then v_t1 when 2 then v_t2 end,
         o.titulo, o.descripcion, o.seguridad, o.prioridad, o.estado,
         case o.avance when 'completo' then v_chk_completo when 'parcial' then v_chk_parcial else v_chk_vacio end,
         v_hoy + o.dias_vence,
         case when o.dias_completada is not null
              then greatest(date_trunc('month', v_ahora), v_ahora - make_interval(days => o.dias_completada)) end,
         o.observaciones,
         v_ahora - make_interval(days => o.dias_creada)
    from (values
      ('OT-001', 'A-101', 'Cambio de husillo principal',
        'Reemplazar el husillo principal tras la alerta de vibración en el cabezal.',
        'Bloquear y etiquetar la máquina antes de intervenir. Usar guantes y lentes de seguridad.',
        'Crítica', 'En progreso', 1, 'parcial', 2, null::int, 'Se desmontó la cubierta y se identificó desgaste en los rodamientos. Falta instalar el husillo nuevo.', 3),
      ('OT-002', 'E-501', 'Cambio de compresor',
        'El equipo enfría de forma deficiente. Sustituir el compresor y recargar el gas refrigerante.',
        'Desconectar la energía del equipo. Usar guantes y no manipular el gas sin protección.',
        'Alta', 'Asignada', 2, 'vacio', 4, null, null, 2),
      ('OT-003', 'V-201', 'Cambio de aceite y filtros',
        'Servicio de los 10,000 km: aceite, filtro de aceite y filtro de aire.',
        'Trabajar con el motor frío y el vehículo calzado.',
        'Media', 'Pendiente', 0, 'vacio', 9, null, null, 1),
      ('OT-004', 'I-401', 'Revisión de respaldos y limpieza interna',
        'Verificar los respaldos automáticos y limpiar el polvo acumulado del servidor.',
        'Apagar el equipo y usar pulsera antiestática.',
        'Baja', 'Completada', 1, 'completo', -6, 5, 'Los respaldos se verificaron sin errores y se limpió el equipo. Sin hallazgos.', 12),
      ('OT-005', 'A-102', 'Mantenimiento preventivo de válvulas',
        'Revisar válvulas de seguridad, purgar el tanque y comprobar la presión de trabajo.',
        'Despresurizar el tanque antes de abrir cualquier válvula.',
        'Media', 'Completada', 2, 'completo', -3, 3, 'Se purgó el tanque y se reemplazó una válvula de retención. Presión estable en 120 PSI.', 10),
      ('OT-006', 'H-301', 'Reemplazo de carbones y lubricación',
        'El taladro presenta chispas en el motor. Cambiar los carbones y lubricar el mandril.',
        'Desconectar la herramienta de la corriente antes de abrir la carcasa.',
        'Baja', 'Completada', 1, 'completo', -9, 9, 'Carbones gastados reemplazados. La herramienta funciona con normalidad.', 15),
      ('OT-007', 'V-202', 'Revisión de frenos',
        'Inspeccionar pastillas y disco delantero y ajustar el freno trasero.',
        'Usar casco y guantes durante la prueba en el parqueo.',
        'Alta', 'Completada', 2, 'completo', -1, 1, 'Se cambiaron las pastillas delanteras y se ajustó el freno trasero. Prueba de frenado correcta.', 6),
      ('OT-008', 'M-103', 'Diagnóstico de falla de arranque',
        'La planta eléctrica no arranca en la prueba semanal. Diagnosticar y definir la reparación.',
        'Trabajar con el interruptor principal abierto y ventilar el cuarto eléctrico.',
        'Crítica', 'Pendiente', 0, 'vacio', -1, null, null, 1)
    ) as o(codigo_ot, codigo_activo, titulo, descripcion, seguridad, prioridad, estado, tecnico, avance, dias_vence, dias_completada, observaciones, dias_creada)
    join public.assets a on a.codigo = o.codigo_activo;
end $$;

commit;
