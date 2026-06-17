/**
 * Per-surface XState transition extras merged onto DEFAULT_ON from buildXstateFromIndex.
 */

import { mergeChartTransitions } from './buildSurfaceMachineCore.js';

export { mergeChartTransitions };

/** @type {Record<string, Record<string, Record<string, string>>>} */
const SURFACE_CHART_EXTRAS = {
  'saurce:cabin_session': {
    idle: { LOAD: 'loading', OPEN_WIZARD: 'wizardActive' },
    loading: { DATA_OK: 'ready', CAVE_FAIL: 'error', PRESENCE_REQUIRED: 'awaiting_presence' },
    ready: {
      LOAD: 'loading',
      REFRESH: 'loading',
      OPEN_WIZARD: 'wizardActive',
      SUBMIT_REVIEW: 'submitting',
    },
    wizardActive: { CLOSE_WIZARD: 'ready', SUBMIT_SESSION: 'submitting' },
    submitting: { DATA_OK: 'ready', CAVE_FAIL: 'error' },
    error: { RETRY: 'loading' },
    awaiting_presence: { PRESENCE_VERIFIED: 'loading' },
  },
  'saurce:review_cabin': {
    ready: { SUBMIT_REVIEW: 'submitting' },
    submitting: { DATA_OK: 'ready', CAVE_FAIL: 'error' },
  },
  'saurce:investment': {
    ready: { ENABLE_RISKY_MODE: 'submitting', APPLY_HOLD: 'submitting' },
    submitting: { DATA_OK: 'ready', CAVE_FAIL: 'error' },
  },
  'saurce:commerce_wallet': {
    ready: { APPLY_HOLD: 'loading' },
  },
  'resaurce:tax_documents': {
    ready: { GENERATE: 'generating' },
    generating: { DATA_OK: 'ready', CAVE_FAIL: 'error' },
  },
  'resaurce:legal_review': {
    ready: { GENERATE: 'generating' },
    generating: { DATA_OK: 'ready', CAVE_FAIL: 'error' },
  },
  'resaurce:inventory_reports': {
    ready: { GENERATE: 'generating' },
    generating: { DATA_OK: 'ready', CAVE_FAIL: 'error' },
  },
  'resaurce:sales_reports': {
    ready: { GENERATE: 'generating' },
    generating: { DATA_OK: 'ready', CAVE_FAIL: 'error' },
  },
  'resaurce:hr_help': {},
};

/**
 * @param {string} registryKey e.g. saurce:investment
 * @returns {Record<string, Record<string, string>>}
 */
export function getSurfaceChartExtras(registryKey) {
  return SURFACE_CHART_EXTRAS[registryKey] || {};
}
