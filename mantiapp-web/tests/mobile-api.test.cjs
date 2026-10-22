/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test runner. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function backend({ role = 'tecnico', validToken = true, rows = [], current = { estado: 'Asignada', checklist: [{ tarea: 'Revisar', completada: false }] }, conflict = false } = {}) {
  const calls = [];
  const cache = {};
  const db = {
    auth: { getUser: async token => ({ data: { user: validToken && token === 'valid' ? { id: 'tech-1' } : null }, error: null }) },
    from(table) {
      calls.push(['from', table]);
      let mutation = false;
      const query = {};
      for (const method of ['select', 'eq', 'order', 'single', 'maybeSingle', 'update']) query[method] = (...args) => {
        calls.push([method, ...args]); if (method === 'update') mutation = true; return query;
      };
      query.then = resolve => Promise.resolve({ data: table === 'users' ? { rol: role } : mutation ? (conflict ? null : { id: 'order-1', estado: 'En progreso' }) : table === 'work_orders' ? (calls.some(c => c[0] === 'maybeSingle') ? current : rows) : null, error: null }).then(resolve);
      return query;
    },
  };
  function load(relative) {
    if (cache[relative]) return cache[relative];
    const exports = {};
    cache[relative] = exports;
    const source = fs.readFileSync(path.join(__dirname, '..', relative + '.ts'), 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    vm.runInNewContext(code, {
      exports,
      process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-key' } },
      require: id => id === '@supabase/supabase-js' ? { createClient: (_url, _key, options) => { calls.push(['client', options]); return db; } }
        : id === 'next/server' ? { NextResponse: { json: (data, options = {}) => ({ data, status: options.status || 200 }) } }
        : load(id.startsWith('@/') ? id.slice(2) : 'lib/' + id.replace('./', '')),
    });
    return exports;
  }
  return { load, calls };
}
const request = (token = 'valid', body) => new Request('http://test/api/movil/ordenes', {
  method: body ? 'PATCH' : 'GET', headers: token ? { Authorization: `Bearer ${token}` } : {},
  ...(body ? { body: JSON.stringify(body) } : {}),
});

test('API móvil rechaza solicitudes sin token, tokens inválidos y administradores', async () => {
  for (const [config, token, expected] of [[{}, null, 401], [{ validToken: false }, 'invalid', 401], [{ role: 'administrador' }, 'valid', 403]]) {
    const b = backend(config);
    const response = await b.load('app/api/movil/ordenes/route').GET(request(token));
    assert.equal(response.status, expected);
    assert.ok(!b.calls.some(c => c[0] === 'from' && c[1] === 'work_orders'));
  }
});
test('API móvil limita la consulta al técnico del token y propaga su JWT a Supabase', async () => {
  const b = backend();
  const response = await b.load('app/api/movil/ordenes/route').GET(request());
  assert.equal(response.status, 200);
  assert.ok(b.calls.some(c => c[0] === 'eq' && c[1] === 'tecnico_id' && c[2] === 'tech-1'));
  assert.equal(b.calls.find(c => c[0] === 'client')[1].global.headers.Authorization, 'Bearer valid');
});
test('El servidor exige el checklist original y no permite finalizar sin completar', () => {
  const validate = backend().load('lib/mobile-orders').validateOrderUpdate;
  const order = { estado: 'En progreso', checklist: [{ tarea: 'Revisar', completada: false }] };
  for (const checklist of [[], [{ tarea: 'Otra tarea', completada: true }], [{ tarea: 'Revisar', completada: false }]]) {
    assert.throws(() => validate({ nuevo_estado: 'Completada', estado_anterior: order.estado, checklist }, order), failure => failure.status === 400);
  }
  assert.throws(() => validate({ estado_anterior: 'Asignada' }, order), failure => failure.status === 409);
});
test('PATCH protege identidad, estado previo y no confirma conflictos', async () => {
  const b = backend({ conflict: true });
  const body = { nuevo_estado: 'En progreso', estado_anterior: 'Asignada', checklist: [{ tarea: 'Revisar', completada: true }] };
  const response = await b.load('app/api/movil/ordenes/[id]/route').PATCH(request('valid', body), { params: Promise.resolve({ id: 'order-1' }) });
  assert.equal(response.status, 409);
  assert.ok(b.calls.some(c => c[0] === 'eq' && c[1] === 'estado' && c[2] === 'Asignada'));
  assert.equal(b.calls.filter(c => c[0] === 'eq' && c[1] === 'tecnico_id' && c[2] === 'tech-1').length, 2);
});
test('PATCH devuelve 404 cuando la orden no pertenece al técnico', async () => {
  const b = backend({ current: null });
  const response = await b.load('app/api/movil/ordenes/[id]/route').PATCH(request('valid', { nuevo_estado: 'En progreso' }), { params: Promise.resolve({ id: 'foreign-order' }) });
  assert.equal(response.status, 404);
  assert.ok(!b.calls.some(c => c[0] === 'update'));
});
