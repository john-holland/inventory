import type { SoaServiceName } from '../services/soaRegistry';

const UNSET_MESSAGES: Record<SoaServiceName, string> = {
  resaurce:
    'Resaurce Cave is not configured. Set REACT_APP_SOA_RES_AURCE_URL (or REACT_APP_CAVE_BASE_URL) to enable this feature.',
  saurce: 'Saurce Cave is not configured. Set REACT_APP_SOA_SAURCE_URL to enable wallet and investment features.',
  inventory: 'Inventory Cave is not configured. Set REACT_APP_SOA_INVENTORY_URL.',
};

export function caveUnsetMessage(service: SoaServiceName): string {
  return UNSET_MESSAGES[service] || `${service} Cave is not configured.`;
}
