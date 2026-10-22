const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function client({ base = 'http://192.168.1.100:3000/', token = 'test-token', status = 200, networkError = false } = {}) {
  const calls = [];
  const cache = {};
  function load(name) {
    if (cache[name]) return cache[name];
    const exports = {};
    const source = fs.readFileSync(path.join(__dirname, '../lib', name + '.ts'), 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const requireStub = id => id === 'react' ? {} : id === './supabaseClient'
      ? { supabase: { auth: { getSession: async () => ({ data: { session: token ? { access_token: token } : null }, error: null }) } } }
      : load(id.replace('./', ''));
    vm.runInNewContext(code, {
      exports, require: requireStub, Date, Headers, AbortController,
      process: { env: { EXPO_PUBLIC_API_URL: base } },
      fetch: async (url, options) => {
        calls.push({ url, options });
        if (networkError) throw Error('Offline');
        return { ok: status === 200, status, json: async () => ({ id: 'order-1', estado: 'En progreso' }) };
      },
    });
    return cache[name] = exports;
  }
  return { load, calls };
}

test('La API usa el origen configurado y el token de sesión', async () => {
  const c = client();
  await c.load('technician-api').loadOrders();
  assert.equal(c.calls[0].url, 'http://192.168.1.100:3000/api/movil/ordenes');
  assert.equal(c.calls[0].options.headers.get('Authorization'), 'Bearer test-token');
  assert.ok(!c.calls[0].url.includes('tecnico_id'));
});
test('Sin sesión o URL configurada no se envían solicitudes', async () => {
  for (const config of [{ token: null }, { base: '' }]) {
    const c = client(config);
    await assert.rejects(c.load('technician-api').loadOrders());
    assert.equal(c.calls.length, 0);
  }
});
test('Guardar envía el contrato HTTP y escapa el identificador', async () => {
  const c = client();
  await c.load('technician-api').saveOrder({ id: 'order/1', estado: 'Asignada' }, 'En progreso', []);
  const call = c.calls[0];
  assert.equal(call.options.method, 'PATCH');
  assert.equal(call.url.endsWith('/order%2F1'), true);
  assert.deepEqual(JSON.parse(call.options.body), { nuevo_estado: 'En progreso', estado_anterior: 'Asignada', checklist: [] });
});
test('Los conflictos y la expiración de sesión son errores recuperables', async () => {
  for (const status of [401, 403, 409, 500]) {
    const c = client({ status });
    await assert.rejects(c.load('technician-api').loadOrders(), failure => failure.status === status);
  }
});
test('La desconexión se presenta como error de conexión', async () => {
  const c = client({ networkError: true });
  await assert.rejects(c.load('technician-api').loadOrders(), /No pudimos conectar/);
});
test('No se completa una orden sin iniciar o con tareas pendientes', async () => {
  const c = client();
  const api = c.load('technician-api');
  await assert.rejects(api.saveOrder({ id: '1', estado: 'Asignada' }, 'Completada', [{ tarea: 'Revisión', completada: true }]));
  await assert.rejects(api.saveOrder({ id: '1', estado: 'En progreso' }, 'Completada', []));
  await assert.rejects(api.saveOrder({ id: '1', estado: 'En progreso' }, 'Completada', [{ tarea: 'Revisión', completada: false }]));
  assert.equal(c.calls.length, 0);
});
test('Dominio: estados normalizados y fechas de calendario', () => {
  const d = client().load('domain');
  assert.equal(d.isActive({ estado: 'Cancelada' }), false);
  assert.equal(d.isCompleted({ estado: ' completada ' }), true);
  assert.equal(d.normalized('Crítica'), 'critica');
  assert.equal(d.dateLabel(null), 'Sin fecha');
  assert.match(d.dateLabel('2026-10-21'), /21/);
});
