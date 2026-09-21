import assert from 'node:assert/strict';
import test from 'node:test';
import { csvText, dateLabel, distribution, normalized, relation } from '../lib/domain.ts';

test('CSV preserves quotes and multiline values while neutralizing spreadsheet formulas', () => {
  const result = csvText([['nombre', 'nota'], ['Equipo "A"', '=HYPERLINK("x")'], [' línea\nsegunda', '  +123']]);
  assert.ok(result.startsWith('\uFEFF"nombre","nota"\r\n'));
  assert.ok(result.includes('"Equipo ""A"""'));
  assert.ok(result.includes('"\'=HYPERLINK(""x"")"'));
  assert.ok(result.includes('"\'  +123"'));
  assert.ok(result.includes('" línea\nsegunda"'));
});

test('relations accept object, array, null and missing values from existing routes', () => {
  const asset = { id: 'asset-1' };
  assert.equal(relation(asset), asset);
  assert.equal(relation([asset]), asset);
  for (const value of [null, undefined, []]) assert.equal(relation(value), null);
});

test('calendar date does not shift to the preceding day in El Salvador', () => {
  process.env.TZ = 'America/El_Salvador';
  assert.match(dateLabel('2026-09-20'), /20/);
  assert.equal(dateLabel(null), 'Sin fecha');
  assert.equal(dateLabel('bad-date'), 'Sin fecha válida');
});

test('status matching ignores case and accents, distribution retains all rows', () => {
  assert.equal(normalized(' En Mantenimiento '), 'en mantenimiento');
  assert.equal(normalized('Crítica'), 'critica');
  assert.deepEqual(distribution(['Maquinaria', '', 'Maquinaria', 'Otros']), [
    { label: 'Maquinaria', count: 2 }, { label: 'Sin clasificar', count: 1 }, { label: 'Otros', count: 1 },
  ]);
});
