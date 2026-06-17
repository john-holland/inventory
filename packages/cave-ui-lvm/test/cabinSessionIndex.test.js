import { test } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cabinIndex = JSON.parse(
  readFileSync(path.join(__dirname, '../src/surfaceIndexes/saurce/cabin_session.index.json'), 'utf8')
);

test('cabin_session index includes sub_machines and capsule router', () => {
  assert.equal(cabinIndex.surface, 'cabin_session');
  assert.deepEqual(cabinIndex.subMachines, ['createWizard']);
  assert.equal(cabinIndex.capsule, 'subMachineRouter');
  assert.ok(cabinIndex.sub_machines.createWizard);
  assert.equal(cabinIndex.sub_machines.createWizard.initial, 'basic');
  assert.ok(cabinIndex.views.includes('WizardConfirmView'));
});
