/* eslint-disable @typescript-eslint/no-require-imports -- Isolated TypeScript module test. */
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const loaded = { exports: {} };
const code = ts.transpileModule(fs.readFileSync(path.join(__dirname,'../lib/scheduling.ts'),'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
new Function('require','exports',code)(() => require('../lib/domain.ts'), loaded.exports);
const { businessDate, calendarDate, weekBounds, plansForWeek, nextPlan } = loaded.exports;
const plan = (id, date, estado = 'Programado', asset_id = 'a') => ({id, proxima_fecha:date, estado, asset_id});
test('business day stays in El Salvador when UTC has crossed midnight', () => {
  assert.equal(businessDate(new Date('2026-09-21T02:00:00Z')), '2026-09-20');
});
test('weeks are Monday through Sunday, including year boundaries', () => {
  assert.deepEqual(weekBounds('2026-09-20'), {start:'2026-09-14',end:'2026-09-20'});
  assert.deepEqual(weekBounds('2026-09-21'), {start:'2026-09-21',end:'2026-09-27'});
  assert.deepEqual(weekBounds('2027-01-01'), {start:'2026-12-28',end:'2027-01-03'});
});
test('invalid dates and rollover dates cannot enter the schedule', () => {
  assert.equal(calendarDate('2026-02-30'),null);
  assert.equal(calendarDate('not-a-date'),null);
  assert.equal(calendarDate(null),null);
  assert.equal(calendarDate('2028-02-29'),'2028-02-29');
});
test('weekly agenda includes only open plans within inclusive bounds', () => {
  const records=[plan('start','2026-09-14'),plan('end','2026-09-20','Vencido'),plan('closed','2026-09-18','Completado'),plan('before','2026-09-13'),plan('after','2026-09-21'),plan('invalid','2026-02-30')];
  assert.deepEqual(plansForWeek(records,'2026-09-20').map(p=>p.id),['start','end']);
});
test('next date is asset-specific and excludes past and completed plans', () => {
  const records=[plan('past','2026-09-19'),plan('other','2026-09-20','Programado','b'),plan('closed','2026-09-20','Completado'),plan('later','2026-10-01'),plan('today','2026-09-20','Próximo')];
  assert.equal(nextPlan(records,'a','2026-09-20').id,'today');
  assert.equal(nextPlan(records,'absent','2026-09-20'),undefined);
});
