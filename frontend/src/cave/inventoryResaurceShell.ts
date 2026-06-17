/**
 * Browser Cave shell stub — XState/log-view-machine runs on Cave hosts, not in inventory bundle.
 */

import type { ResaurceFrontendTome } from '../services/resaurceUiTome';
import { createStubCaveShellInstance, type CaveShellInstance } from './caveShellInstance';

export type ResaurceShellTome = {
  uiTome: ResaurceFrontendTome;
  tomeInstance: CaveShellInstance;
};

export function createResaurceInventoryShellTome(uiTome: ResaurceFrontendTome): ResaurceShellTome {
  return { uiTome, tomeInstance: createStubCaveShellInstance() };
}
