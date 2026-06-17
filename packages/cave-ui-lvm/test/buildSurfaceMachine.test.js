import { test } from 'node:test';
import assert from 'node:assert';
import { buildXstateFromIndex, stateMetaFromIndex } from '../src/buildSurfaceMachineCore.js';

test('buildXstateFromIndex creates chart states from surface index', () => {
  const index = {
    service: 'saurce',
    surface: 'commerce_wallet',
    machineId: 'inventory:partnerWalletUi',
    initial: 'idle',
    states: ['idle', 'loading', 'ready'],
    lvm: {
      machines: [
        {
          id: 'inventory:partnerWalletUi',
          initial: 'idle',
          states: {
            idle: { view: 'WalletIdleView', on_enter: { message: 'wallet_list' } },
            loading: { view: 'WalletLoadingView' },
            ready: { view: 'WalletReadyView' },
          },
        },
      ],
    },
  };
  const chart = buildXstateFromIndex(index);
  assert.equal(chart.initial, 'idle');
  assert.ok(chart.states.idle);
  assert.equal(chart.states.idle.on.DATA_OK, 'ready');
  const meta = stateMetaFromIndex(index);
  assert.equal(meta.idle.view, 'WalletIdleView');
  assert.equal(meta.idle.on_enter.message, 'wallet_list');
});
