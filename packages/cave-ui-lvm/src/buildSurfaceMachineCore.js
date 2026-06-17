/**
 * Pure helpers for building XState charts from Tome surface indexes (no React).
 */

/** @typedef {import('./tomeModuleLoader.js').TomeSurfaceIndex} TomeSurfaceIndex */

const DEFAULT_ON = {
  DATA_OK: 'ready',
  CAVE_FAIL: 'error',
  PRESENCE_REQUIRED: 'awaiting_presence',
  LOAD: 'loading',
  REFRESH: 'loading',
  RETRY: 'loading',
  PRESENCE_VERIFIED: 'loading',
};

/**
 * @param {TomeSurfaceIndex} index
 */
export function buildXstateFromIndex(index) {
  const machine = index.lvm?.machines?.[0] || {};
  const initial = machine.initial || index.initial || index.states[0] || 'idle';
  /** @type {Record<string, { on: Record<string, string> }>} */
  const states = {};
  for (const name of index.states) {
    states[name] = { on: { ...DEFAULT_ON } };
  }
  return { id: index.machineId || `inventory:${index.surface}`, initial, states };
}

/**
 * @param {TomeSurfaceIndex} index
 */
export function stateMetaFromIndex(index) {
  const machine = index.lvm?.machines?.[0];
  /** @type {Record<string, object>} */
  const meta = {};
  if (!machine?.states) return meta;
  for (const [name, cfg] of Object.entries(machine.states)) {
    meta[name] = {
      ...(cfg.requires_presence ? { requires_presence: true } : {}),
      ...(cfg.on_enter ? { on_enter: cfg.on_enter } : {}),
      ...(cfg.view ? { view: cfg.view } : {}),
    };
  }
  return meta;
}

/**
 * Merge extra transitions onto a base XState chart.
 * @param {object} baseChart
 * @param {Record<string, Record<string, string>>} extraByState
 */
export function mergeChartTransitions(baseChart, extraByState) {
  const states = { ...baseChart.states };
  for (const [name, node] of Object.entries(states)) {
    states[name] = {
      ...node,
      on: { ...(node.on || {}), ...(extraByState[name] || {}) },
    };
  }
  return { ...baseChart, states };
}
