/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test runner. */
const assert = require('node:assert/strict');
const test = require('node:test');
const { renderScreen, screens } = require('./render-components.cjs');
for (const name of Object.keys(screens)) {
  test(`${name}: renders real components with isolated endpoint fixtures`, () => {
    const html = renderScreen(name);
    assert.ok(html.includes('id="contenido"'));
    assert.ok(html.includes('<h1'));
    assert.ok(!html.includes('undefined'));
  });
}
test('error states do not become zero metrics', () => {
  const html = renderScreen('dashboard', 'error');
  assert.ok(html.includes('Volver a intentar'));
  assert.ok(!html.includes('Equipos en el inventario'));
});
test('loading and empty collections render explicit states', () => {
  assert.ok(renderScreen('activos', 'loading').includes('Cargando información'));
  assert.ok(renderScreen('activos', 'empty').includes('Tu inventario comienza aquí'));
  assert.ok(renderScreen('nueva-orden', 'empty').includes('Primero registra un activo'));
  assert.ok(renderScreen('activo', 'empty').includes('Activo no encontrado'));
});
test('unsupported writes are not offered as active settings', () => {
  const html = renderScreen('configuracion');
  assert.ok(html.includes('Todavía no disponible'));
  assert.ok(!html.includes('Guardar'));
});
test('existing states and single-technician assignment are preserved', () => {
  const html = renderScreen('nueva-orden');
  assert.ok(html.includes('name="tecnico_id"'));
  assert.ok(!html.includes('multiple=""'));
  assert.ok(!renderScreen('orden').includes('Cancelada'));
});

function findForm(node) {
  if (!node || typeof node !== 'object') return null;
  if (node.type === 'form') return node;
  const children = node.props?.children;
  for (const child of (Array.isArray(children) ? children.flat(Infinity) : [children])) {
    const found = findForm(child); if (found) return found;
  }
  return null;
}
const assetFields = { codigo: ' EQ-001 ', nombre: ' Equipo de prueba ', categoria: 'Maquinaria', ubicacion: 'Taller', estado: 'Operativo' };
test('asset creation submits only the existing contract and redirects after success', async () => {
  const context = renderScreen('nuevo-activo', 'data', {component:'AssetForm', fields:assetFields});
  await findForm(context.tree).props.onSubmit({preventDefault(){},currentTarget:{}});
  assert.equal(context.calls[0].url, '/api/activos');
  assert.equal(context.calls[0].method, 'POST');
  assert.equal(context.calls[0].body.codigo, 'EQ-001');
  assert.equal(context.calls[0].body.nombre, 'Equipo de prueba');
  assert.deepEqual(context.destinations, ['/admin/activos']);
});
test('asset edit sends all writable fields to the existing PUT endpoint', async () => {
  const {codigo, ...fields} = assetFields;
  const context = renderScreen('editar-activo', 'data', {component:'AssetForm', fields, props:{asset:{id:'qa-asset-1',codigo,...fields}}});
  await findForm(context.tree).props.onSubmit({preventDefault(){},currentTarget:{}});
  assert.equal(context.calls[0].url, '/api/activos/qa-asset-1');
  assert.equal(context.calls[0].method, 'PUT');
  assert.deepEqual(Object.keys(context.calls[0].body).sort(), ['categoria','estado','nombre','ubicacion']);
});
test('order creation maps a single technician to the current API', async () => {
  const fields = {asset_id:'qa-asset-1',tecnico_id:'qa-person-1',titulo:'Inspección',descripcion:'Revisar equipo',prioridad:'Alta',fecha_vencimiento:'2026-09-23',instrucciones_seguridad:'Usar protección'};
  const context = renderScreen('nueva-orden', 'data', {fields});
  await findForm(context.tree).props.onSubmit({preventDefault(){},currentTarget:{}});
  assert.equal(context.calls[0].url, '/api/ordenes');
  assert.deepEqual(context.calls[0].body,fields);
  assert.deepEqual(context.destinations,['/admin/ordenes']);
});
test('plan creation uses the current maintenance contract', async () => {
  const fields = {asset_id:'qa-asset-1',tarea:'Revisión',proxima_fecha:'2026-09-23',tipo:'Preventivo',frecuencia:'Mensual',prioridad:'Media'};
  const context = renderScreen('nuevo-plan', 'data', {fields});
  await findForm(context.tree).props.onSubmit({preventDefault(){},currentTarget:{}});
  assert.equal(context.calls[0].url, '/api/mantenimientos');
  assert.deepEqual(context.calls[0].body,fields);
});
test('failed saves retain the form and do not redirect as success', async () => {
  const context = renderScreen('nuevo-activo', 'data', {component:'AssetForm', fields:assetFields, fail:true});
  await findForm(context.tree).props.onSubmit({preventDefault(){},currentTarget:{}});
  assert.deepEqual(context.destinations,[]);
  assert.ok(context.updates.includes('Error de prueba'));
  assert.equal(context.updates.at(-1),false);
});

test('asset detail shows associated plans but never another asset plan', () => {
  const html = renderScreen('activo');
  assert.ok(html.includes('Planes de mantenimiento asociados'));
  assert.ok(html.includes('Lubricar componentes'));
  assert.ok(!html.includes('Revisar conexiones'));
  assert.ok(html.includes('Próximo mantenimiento'));
});
test('maintenance summary keeps global totals while filtering rows', () => {
  const context = renderScreen('mantenimientos','data',{stateValues:['Vencido']});
  const html = require('react-dom/server').renderToStaticMarkup(context.tree);
  assert.ok(html.includes('Revisar conexiones'));
  assert.ok(!html.includes('Lubricar componentes'));
  assert.match(html,/Programados[\s\S]*?<strong>1<\/strong>/);
});
test('reports include print metadata and accessible category data', () => {
  const html = renderScreen('reportes');
  assert.ok(html.includes('Imprimir / PDF'));
  assert.ok(html.includes('Fecha de emisión:'));
  assert.ok(html.includes('Detalle de las distribuciones'));
  assert.ok(html.includes('Distribución de 3 activos'));
});
