#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = path.resolve(process.argv[2] ?? '.');
const envPath = path.join(projectRoot, 'mantiapp-mobile', '.env');

function parseEnv(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_0-9]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return out;
}

const env = parseEnv(await readFile(envPath, 'utf8'));
const baseUrl = (env.EXPO_PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '');
const apiKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!baseUrl || !apiKey) {
  throw new Error('Faltan EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_ANON_KEY en mantiapp-mobile/.env');
}

const TABLES = [
  { name: 'users', pk: 'id' },
  { name: 'profiles', pk: 'id' },
  { name: 'assets', pk: 'id' },
  { name: 'maintenance_plans', pk: 'id' },
  { name: 'work_orders', pk: 'id' },
];

const COLUMN_TYPES = {
  users: { id: 'uuid', email: 'text', rol: 'text', nombre: 'text', apellido: 'text' },
  profiles: {
    id: 'uuid', email: 'text', nombre: 'text', rol: 'text',
    especialidad: 'text', telefono: 'text', created_at: 'timestamptz',
  },
  assets: {
    id: 'uuid', codigo: 'text', nombre: 'text', categoria: 'text',
    ubicacion: 'text', estado: 'text', created_at: 'timestamptz',
  },
  maintenance_plans: {
    id: 'uuid', asset_id: 'uuid', tipo: 'text', tarea: 'text', frecuencia: 'text',
    proxima_fecha: 'date', prioridad: 'text', estado: 'text', created_at: 'timestamptz',
  },
  work_orders: {
    id: 'uuid', codigo_ot: 'text', asset_id: 'uuid', tecnico_id: 'uuid', titulo: 'text',
    descripcion: 'text', instrucciones_seguridad: 'text', prioridad: 'text', estado: 'text',
    checklist: 'jsonb', evidencia_url: 'text', fecha_vencimiento: 'date', created_at: 'timestamptz',
  },
};

const FOREIGN_KEYS = [
  ['maintenance_plans', 'asset_id', 'assets', 'id'],
  ['work_orders', 'asset_id', 'assets', 'id'],
  ['work_orders', 'tecnico_id', 'profiles', 'id'],
];

const headers = { apikey: apiKey, Authorization: `Bearer ${apiKey}` };

async function fetchTable(table, pk) {
  const pageSize = 1000;
  const rows = [];
  for (let offset = 0; ; offset += pageSize) {
    const url = `${baseUrl}/rest/v1/${table}?select=*&order=${pk}.asc&limit=${pageSize}&offset=${offset}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`${table}: HTTP ${res.status} ${body.slice(0, 300)}`);
    }
    const page = await res.json();
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows;
}

function qid(name) {
  return `"${name.replace(/"/g, '""')}"`;
}

function sqlValue(value, type) {
  if (value === null || value === undefined) return 'NULL';
  if (type === 'jsonb') return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  if (type === 'boolean') return value ? 'true' : 'false';
  if (type === 'integer' || type === 'numeric') return String(value);
  return `'${String(value).replace(/'/g, "''")}'`;
}

function inferType(value) {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'numeric';
  if (value && typeof value === 'object') return 'jsonb';
  return 'text';
}

const data = {};
const columns = {};

for (const { name, pk } of TABLES) {
  const rows = await fetchTable(name, pk);
  data[name] = rows;

  const declared = COLUMN_TYPES[name] ?? {};
  const keys = new Set(Object.keys(declared));
  for (const row of rows) for (const key of Object.keys(row)) keys.add(key);

  columns[name] = [...keys].map((column) => {
    const sample = rows.map((r) => r[column]).find((v) => v !== null && v !== undefined);
    return { column, type: declared[column] ?? inferType(sample), pk: column === pk };
  });
}

const stamp = new Date();
const folderName = `${stamp.toISOString().slice(0, 10).replace(/-/g, '')}_pre_tecnico_sync`;
const outDir = path.join(projectRoot, 'backups', folderName);
await mkdir(outDir, { recursive: true });

for (const { name } of TABLES) {
  await writeFile(path.join(outDir, `${name}.json`), JSON.stringify(data[name], null, 2) + '\n', 'utf8');
}

const schemaSql = [
  '-- Esquema reconstruido de public (solo estructura, sin datos).',
  '-- Tipos tomados del ERD del proyecto. Sin DEFAULT ni NOT NULL salvo PK.',
  '-- Para DDL exacto usa export-schema-authoritative.sql en el SQL Editor.',
  '',
  'create extension if not exists pgcrypto;',
  '',
  ...TABLES.map(({ name }) => {
    const cols = columns[name].map(({ column, type, pk }) =>
      `  ${qid(column)} ${type}${pk ? ' not null' : ''}`
    );
    const pkCol = columns[name].find((c) => c.pk)?.column;
    if (pkCol) cols.push(`  constraint ${qid(`${name}_pkey`)} primary key (${qid(pkCol)})`);
    return `create table if not exists public.${qid(name)} (\n${cols.join(',\n')}\n);\n`;
  }),
  '-- Claves foráneas conocidas',
  ...FOREIGN_KEYS.map(([table, column, refTable, refColumn]) => [
    `alter table public.${qid(table)} drop constraint if exists ${qid(`${table}_${column}_fkey`)};`,
    `alter table public.${qid(table)} add constraint ${qid(`${table}_${column}_fkey`)}`,
    `  foreign key (${qid(column)}) references public.${qid(refTable)} (${qid(refColumn)});`,
  ].join('\n')),
  '',
].join('\n');
await writeFile(path.join(outDir, 'schema.sql'), schemaSql, 'utf8');

const insertBlocks = TABLES.map(({ name }) => {
  const cols = columns[name].map((c) => c.column);
  const colList = cols.map(qid).join(', ');
  const values = data[name].map((row) => {
    const vals = cols.map((col) => {
      const type = columns[name].find((c) => c.column === col)?.type;
      return sqlValue(row[col], type);
    });
    return `  (${vals.join(', ')})`;
  });
  return [
    `-- ${name}: ${data[name].length} fila(s)`,
    `insert into public.${qid(name)} (${colList}) values`,
    values.join(',\n') + ';',
    '',
  ].join('\n');
});

const dataSql = [
  '-- Datos de public. Ejecutar después de schema.sql en un proyecto vacío.',
  'begin;',
  '',
  TABLE_ORDER_HINT(),
  ...insertBlocks,
  'commit;',
  '',
].join('\n');
await writeFile(path.join(outDir, 'data.sql'), dataSql, 'utf8');

const originalProfileIds = data.profiles.map((p) => p.id);
const rollbackSql = `-- Revierte la migración 20261108_sync_technician_profiles.sql
-- Deja public.profiles exactamente con las filas de este respaldo.
begin;

delete from public.profiles
 where id in (
   select u.id from public.users u where lower(trim(u.rol)) = 'tecnico'
 )
 and id not in (
${originalProfileIds.map((id) => `   '${id}'`).join(',\n')}
 );

commit;

-- Objetos creados por la migración
drop trigger if exists trg_sync_technician_profile on public.users;
drop trigger if exists trg_delete_technician_profile on public.users;
drop function if exists public.sync_technician_profile();
drop index if exists public.work_orders_tecnico_id_idx;
`;
await writeFile(path.join(outDir, 'rollback_migration.sql'), rollbackSql, 'utf8');

function TABLE_ORDER_HINT() {
  return '-- Orden respeta las claves foráneas: users, profiles, assets, maintenance_plans, work_orders.\n';
}

const manifest = {
  createdAt: stamp.toISOString(),
  projectUrl: baseUrl,
  schema: 'public',
  tables: Object.fromEntries(TABLES.map(({ name }) => [name, data[name].length])),
  note: 'No incluye auth.users ni objetos de Storage. Respaldo de solo lectura via PostgREST.',
};
await writeFile(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');

const readme = `# Respaldo previo a la sincronización de técnicos

Generado: ${stamp.toISOString()}
Proyecto: ${baseUrl}

## Contenido

| Archivo | Descripción |
|---|---|
| \`users.json\`, \`profiles.json\`, \`assets.json\`, \`maintenance_plans.json\`, \`work_orders.json\` | Datos crudos tal como estaban |
| \`schema.sql\` | Estructura reconstruida (PK y FKs conocidas) |
| \`data.sql\` | INSERTs en orden de dependencias |
| \`rollback_migration.sql\` | Revierte solo la migración de técnicos |
| \`export-schema-authoritative.sql\` | Consultas para obtener el DDL exacto |

Filas respaldadas:

${TABLES.map(({ name }) => `- ${name}: ${data[name].length}`).join('\n')}

## Cómo restaurar

1. Crear un proyecto Supabase vacío (o una base local).
2. Ejecutar \`schema.sql\`.
3. Ejecutar \`data.sql\`.
4. Recrear los usuarios en Auth (este respaldo **no** incluye \`auth.users\`).

## Revertir la migración

Ejecuta \`rollback_migration.sql\` en el SQL Editor. Elimina únicamente los perfiles
creados por la migración (los que tienen cuenta en \`users\`) y borra el trigger,
la función y el índice. Deja \`profiles\` igual que en este respaldo.

## Limitaciones

- No incluye \`auth.users\`, contraseñas ni archivos de Storage.
- \`schema.sql\` es una reconstrucción: no conserva DEFAULT, CHECK, triggers ni índices originales.
- Para un respaldo exacto usa \`pg_dump\` o los backups del panel de Supabase.
`;
await writeFile(path.join(outDir, 'README.md'), readme, 'utf8');

const exportSql = `-- Ejecutar en el SQL Editor y guardar los resultados.
-- 1) Columnas con tipo, nulabilidad y default
select table_name, ordinal_position, column_name, data_type, udt_name, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;

-- 2) Constraints (PK, FK, CHECK, UNIQUE)
select conrelid::regclass as tabla, conname, pg_get_constraintdef(oid) as definicion
from pg_constraint
where connamespace = 'public'::regnamespace
order by 1, 2;

-- 3) Índices
select tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
order by 1, 2;

-- 4) Triggers
select event_object_table as tabla, trigger_name, event_manipulation, action_timing, action_statement
from information_schema.triggers
where trigger_schema = 'public'
order by 1, 2;

-- 5) RLS
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by 1;

-- 6) Políticas
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
order by 1, 2;
`;
await writeFile(path.join(outDir, 'export-schema-authoritative.sql'), exportSql, 'utf8');

console.log(`Backup generado en: ${outDir}`);
for (const { name } of TABLES) console.log(`  ${name}: ${data[name].length} fila(s)`);
