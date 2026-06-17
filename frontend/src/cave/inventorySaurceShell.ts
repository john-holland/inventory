/**
 * Browser Cave shell stub — XState/log-view-machine runs on Cave hosts, not in inventory bundle.
 */

import type { SaurceFrontendTome } from '../services/saurceUiTome';
import { createStubCaveShellInstance, type CaveShellInstance } from './caveShellInstance';

export type SaurceShellTome = {
  uiTome: SaurceFrontendTome;
  tomeInstance: CaveShellInstance;
};

export function createSaurceInventoryShellTome(uiTome: SaurceFrontendTome): SaurceShellTome {
  return { uiTome, tomeInstance: createStubCaveShellInstance() };
}
