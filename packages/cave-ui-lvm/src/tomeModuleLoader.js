import commerce_wallet from './surfaceIndexes/saurce/commerce_wallet.index.json';
import investment from './surfaceIndexes/saurce/investment.index.json';
import review_cabin from './surfaceIndexes/saurce/review_cabin.index.json';
import cabin_session from './surfaceIndexes/saurce/cabin_session.index.json';
import tax_documents from './surfaceIndexes/resaurce/tax_documents.index.json';
import legal_review from './surfaceIndexes/resaurce/legal_review.index.json';
import inventory_reports from './surfaceIndexes/resaurce/inventory_reports.index.json';
import sales_reports from './surfaceIndexes/resaurce/sales_reports.index.json';
import hr_help from './surfaceIndexes/resaurce/hr_help.index.json';

/**
 * @typedef {Object} TomeSurfaceIndex
 * @property {string} schema_version
 * @property {string} service
 * @property {string} surface
 * @property {string|null} machineId
 * @property {string} [initial]
 * @property {string[]} states
 * @property {string[]} views
 * @property {string[]} messages
 * @property {Record<string, string>} [messages_map]
 * @property {string[]} subMachines
 * @property {string[]} [state_middleware]
 * @property {Record<string, { module?: string }>} [views_map]
 * @property {object} [lvm]
 */

/** @type {Record<string, TomeSurfaceIndex>} */
const REGISTRY = {
  'saurce:commerce_wallet': commerce_wallet,
  'saurce:investment': investment,
  'saurce:review_cabin': review_cabin,
  'saurce:cabin_session': cabin_session,
  'resaurce:tax_documents': tax_documents,
  'resaurce:legal_review': legal_review,
  'resaurce:inventory_reports': inventory_reports,
  'resaurce:sales_reports': sales_reports,
  'resaurce:hr_help': hr_help,
};

/**
 * @param {string} service
 * @param {string} surfaceId
 * @returns {Promise<TomeSurfaceIndex|null>}
 */
export async function loadTomeSurfaceIndex(service, surfaceId) {
  return REGISTRY[`${service}:${surfaceId}`] || null;
}

/**
 * @param {unknown} raw
 * @returns {TomeSurfaceIndex|null}
 */
export function parseTomeSurfaceIndex(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw;
  if (typeof o.surface !== 'string' || typeof o.service !== 'string') return null;
  return o;
}

export function clearTomeSurfaceIndexCache() {
  /* static registry — no-op */
}
