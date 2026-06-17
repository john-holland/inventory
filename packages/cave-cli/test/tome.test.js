'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const YAML = require('yaml');
const { validateTomeModule, buildTomeIndex } = require('../lib/tome');

test('validateTomeModule accepts commerce_wallet module shape', () => {
  const doc = {
    schema_version: 'tome-module/2',
    service: 'saurce',
    surface: 'commerce_wallet',
    messages: { wallet_list: 'wallet/list' },
    robotcopy: { flows: { wallet_list: { message: 'wallet_list', payload_template: {} } } },
    lvm: {
      machines: [
        {
          id: 'inventory:partnerWalletUi',
          initial: 'idle',
          states: {
            idle: { view: 'WalletIdleView', on_enter: { message: 'wallet_list' } },
          },
        },
      ],
    },
  };
  assert.deepEqual(validateTomeModule(doc), []);
  const index = buildTomeIndex(doc);
  assert.equal(index.surface, 'commerce_wallet');
  assert.ok(index.states.includes('idle'));
  assert.ok(index.views.includes('WalletIdleView'));
});

test('buildTomeIndex emits sub_machines for cabin_session module', () => {
  const yamlPath = path.resolve(__dirname, '../../../docs/tomes/saurce/cabin_session/tome.module.yaml');
  const doc = YAML.parse(fs.readFileSync(yamlPath, 'utf8'));
  assert.deepEqual(validateTomeModule(doc), []);
  const index = buildTomeIndex(doc);
  assert.equal(index.surface, 'cabin_session');
  assert.deepEqual(index.subMachines, ['createWizard']);
  assert.equal(index.capsule, 'subMachineRouter');
  assert.ok(index.sub_machines.createWizard.states.confirm.view === 'WizardConfirmView');
});
