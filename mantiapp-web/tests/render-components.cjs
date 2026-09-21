/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS is required by the isolated transpilation harness. */
// Isolated component renderer. Never imports a real session or calls a remote service.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
const fixtures = {
  '/api/activos': [
    { id: 'qa-asset-1', codigo: 'EQ-001', nombre: 'Compresor de aire', categoria: 'Maquinaria', ubicacion: 'Taller central', estado: 'Operativo' },
    { id: 'qa-asset-2', codigo: 'EQ-002', nombre: 'Bomba de circulación', categoria: 'Maquinaria', ubicacion: 'Planta de producción', estado: 'En Mantenimiento' },
    { id: 'qa-asset-3', codigo: 'EQ-003', nombre: 'Vehículo de servicio', categoria: 'Vehículos', ubicacion: 'Almacén', estado: 'Fuera de Servicio' },
  ],
  '/api/ordenes': [
    { id: 'qa-order-1', codigo_ot: 'OT-101', asset_id: 'qa-asset-1', tecnico_id: null, titulo: 'Revisar presión y conexiones', descripcion: 'Inspeccionar conexiones del sistema de aire.', prioridad: 'Alta', estado: 'Pendiente', fecha_vencimiento: '2026-09-22', assets: { id: 'qa-asset-1', codigo: 'EQ-001', nombre: 'Compresor de aire' }, profiles: null },
    { id: 'qa-order-2', codigo_ot: 'OT-102', asset_id: 'qa-asset-2', tecnico_id: 'qa-person-1', titulo: 'Inspección de bomba', descripcion: 'Verificar sellos y lubricación.', prioridad: 'Media', estado: 'En progreso', fecha_vencimiento: '2026-09-24', assets: [{ id: 'qa-asset-2', codigo: 'EQ-002', nombre: 'Bomba de circulación' }], profiles: { id: 'qa-person-1', nombre: 'Técnico de prueba' } },
    { id: 'qa-order-3', codigo_ot: 'OT-103', asset_id: 'qa-asset-1', tecnico_id: 'qa-person-1', titulo: 'Limpieza de filtros', descripcion: 'Limpieza general.', prioridad: 'Baja', estado: 'Completada', fecha_vencimiento: '2026-09-19', assets: { id: 'qa-asset-1', codigo: 'EQ-001', nombre: 'Compresor de aire' }, profiles: { id: 'qa-person-1', nombre: 'Técnico de prueba' } },
  ],
  '/api/mantenimientos': [
    { id: 'qa-plan-1', asset_id: 'qa-asset-1', tipo: 'Preventivo', tarea: 'Lubricar componentes', frecuencia: 'Cada mes', proxima_fecha: '2026-09-23', prioridad: 'Media', estado: 'Programado', assets: { id: 'qa-asset-1', codigo: 'EQ-001', nombre: 'Compresor de aire' } },
    { id: 'qa-plan-2', asset_id: 'qa-asset-2', tipo: 'Preventivo', tarea: 'Revisar conexiones', frecuencia: 'Cada semana', proxima_fecha: '2026-09-18', prioridad: 'Alta', estado: 'Vencido', assets: { id: 'qa-asset-2', codigo: 'EQ-002', nombre: 'Bomba de circulación' } },
  ],
  '/api/tecnicos': [{ id: 'qa-person-1', nombre: 'Técnico de prueba', email: 'tecnico@example.test', telefono: 'Sin registrar', especialidad: 'Mantenimiento general', ordenes_activas: 1, completadas_mes: 1 }],
  '/api/dashboard/metricas': { kpis: { total_activos: 3, programados_semana: 1, mantenimientos_vencidos: 1, ordenes_en_progreso: 1 }, alertas: [{ id: 'qa-alert-1', tipo: 'Crítica', mensaje: 'Un vehículo requiere revisión antes de regresar al servicio.' }, { id: 'qa-alert-2', tipo: 'Advertencia', mensaje: 'La revisión de conexiones está pendiente.' }], activos_atencion: [] },
};
const screens = {
  dashboard: ['overview', 'DashboardPage', '/admin'],
  activos: ['assets', 'AssetsPage', '/admin/activos'],
  activo: ['assets', 'AssetDetailPage', '/admin/activos/qa-asset-1', { id: 'qa-asset-1' }],
  'nuevo-activo': ['assets', 'NewAssetPage', '/admin/activos/nuevo'],
  'editar-activo': ['assets', 'AssetDetailPage', '/admin/activos/qa-asset-1/editar', { id: 'qa-asset-1', edit: true }],
  ordenes: ['orders', 'OrdersPage', '/admin/ordenes'],
  orden: ['orders', 'OrderDetailPage', '/admin/ordenes/qa-order-1', { id: 'qa-order-1' }],
  'nueva-orden': ['orders', 'NewOrderPage', '/admin/ordenes/nueva'],
  mantenimientos: ['maintenance', 'MaintenancePage', '/admin/mantenimientos'],
  'nuevo-plan': ['maintenance', 'NewMaintenancePage', '/admin/mantenimientos/nuevo'],
  tecnicos: ['overview', 'TechniciansPage', '/admin/tecnicos'],
  historial: ['overview', 'HistoryPage', '/admin/historial'],
  reportes: ['overview', 'ReportsPage', '/admin/reportes'],
  alertas: ['overview', 'AlertsPage', '/admin/alertas'],
  configuracion: ['overview', 'SettingsPage', '/admin/configuracion'],
};
function renderScreen(name, mode = 'data', control) {
  const [moduleName, component, pathname, props = {}] = screens[name];
  const cache = new Map();
  const calls = [], destinations = [], updates = [];
  const router = { push(url) { destinations.push(url); }, replace(url) { destinations.push(url); } };
  const stubs = {
    ...(mode === 'navigation' ? { react: { ...React, useState: initial => React.useState(initial === false ? true : initial) } } : {}),
    '@/lib/use-business-date': {useBusinessDate: () => '2026-09-20'},
    'next/link': { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) },
    'next/navigation': { useRouter: () => router, usePathname: () => pathname, useSearchParams: () => new URLSearchParams() },
    '@/lib/supabaseClient': { supabase: new Proxy({}, { get() { throw new Error('Real authentication must not run in isolated tests'); } }) },
    '@/lib/api-client': {
      async request(url, init) {
        if (!control) throw new Error('Mutations must not run in render tests');
        calls.push({url, ...init, body: JSON.parse(init.body ?? '{}')});
        if (control.fail) throw new Error('Error de prueba');
        return {id:'qa-created'};
      }, useDebounced: value => value,
      useResource(url) {
        if (mode === 'error') return { error: 'No se pudo completar la solicitud. Inténtalo nuevamente.', loading: false, reload() {} };
        if (mode === 'loading') return { loading: true, reload() {} };
        const parsed = new URL(url, 'http://test.invalid');
        let data = structuredClone(fixtures[parsed.pathname]);
        if (data === undefined) throw new Error('Unapproved endpoint: ' + url);
        if (mode === 'empty') data = Array.isArray(data) ? [] : { kpis: {}, alertas: [], activos_atencion: [] };
        if (parsed.searchParams.has('estado') && Array.isArray(data)) data = data.filter(row => row.estado === parsed.searchParams.get('estado'));
        return { data, loading: false, reload() {} };
      },
    },
  };
  if (control) {
    let stateIndex = 0;
    stubs.react = {...React, useState: initial => [control.stateValues?.[stateIndex++] ?? initial, value => updates.push(value)]};
  }
  const FormDataStub = control ? class {
    constructor() { this.values = new Map(Object.entries(control.fields ?? {})); }
    entries() { return this.values.entries(); }
    [Symbol.iterator]() { return this.entries(); }
  } : FormData;
  function load(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file).exports;
    const loaded = { exports: {} }; cache.set(file, loaded);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: true }, fileName: file }).outputText;
    const localRequire = id => {
      if (stubs[id]) return stubs[id];
      if (id.startsWith('@/') || id.startsWith('.')) {
        const target = id.startsWith('@/') ? path.join(root, id.slice(2)) : path.resolve(path.dirname(file), id);
        const resolved = [target, target + '.tsx', target + '.ts'].find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
        if (!resolved) throw new Error('Module missing: ' + id);
        return load(resolved);
      }
      return require(id);
    };
    vm.runInThisContext(`(function(require,module,exports,FormData){${code}\n})`, { filename: file })(localRequire, loaded, loaded.exports, FormDataStub);
    return loaded.exports;
  }
  const Component = load(path.join(root, 'components', moduleName + '.tsx'))[control?.component ?? component];
  if (control) return {tree: Component(control.props ?? props), calls, destinations, updates};
  const { AdminWorkspace } = load(path.join(root, 'components/admin-shell.tsx'));
  return renderToStaticMarkup(React.createElement('div', {className:'admin-theme'}, React.createElement(AdminWorkspace, { account: 'qa@example.test', logout() {} }, React.createElement(Component, props))));
}
module.exports = { renderScreen, screens };
if (require.main === module) {
  const folder = path.join(root, 'public', '__qa_static');
  fs.mkdirSync(folder, { recursive: true });
  const css = fs.readFileSync(path.join(root, 'app/globals.css'), 'utf8') + '\n' + fs.readFileSync(path.join(root, 'app/admin/admin.css'), 'utf8');
  for (const name of Object.keys(screens)) {
    fs.writeFileSync(path.join(folder, name + '.html'), `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>QA aislado · ${name}</title><style>${css}
:root{--font-geist-sans:Arial,sans-serif;--font-geist-mono:monospace}body{margin:0}button{border:0}dl,dd{margin:0}</style></head><body>${renderScreen(name)}<div style="position:fixed;bottom:0;right:0;padding:3px 8px;background:#fff4cb;font:10px Arial">QA estático · datos ficticios</div></body></html>`);
  }
  console.log('Generated ' + Object.keys(screens).length + ' isolated static screens. Remove public/__qa_static after visual QA.');
}
