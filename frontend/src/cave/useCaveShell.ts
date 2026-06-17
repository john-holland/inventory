/**
 * Cave shell availability: unset → message, loading → placeholder, ready → children.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  isServiceConfigured,
  type SoaServiceName,
} from '../services/soaRegistry';
import { caveUnsetMessage } from './caveShellMessages';
import { loadResaurceInventoryCave, type ResaurceInventoryCave } from './resaurceInventoryCave';
import { loadSaurceInventoryCave, type SaurceInventoryCave } from './saurceInventoryCave';

export { caveUnsetMessage };

export type CaveShellStatus = 'unset' | 'loading' | 'ready' | 'error';

export type CaveShellState = {
  status: CaveShellStatus;
  cave: ResaurceInventoryCave | SaurceInventoryCave | null;
  error: string | null;
  retry: () => void;
};

export function useCaveShell(
  service: 'resaurce' | 'saurce',
  options?: { enabled?: boolean; forceRefresh?: boolean }
): CaveShellState {
  const enabled = options?.enabled !== false;
  const [status, setStatus] = useState<CaveShellStatus>(() =>
    !enabled || !isServiceConfigured(service) ? 'unset' : 'loading'
  );
  const [cave, setCave] = useState<ResaurceInventoryCave | SaurceInventoryCave | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const retry = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!enabled) {
      setStatus('unset');
      setCave(null);
      setError(null);
      return;
    }
    if (!isServiceConfigured(service)) {
      setStatus('unset');
      setCave(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setStatus('loading');
    setError(null);
    setCave(null);

    const load =
      service === 'resaurce'
        ? loadResaurceInventoryCave({ forceRefresh: options?.forceRefresh || tick > 0 })
        : loadSaurceInventoryCave({ forceRefresh: options?.forceRefresh || tick > 0 });

    load.then((c) => {
      if (cancelled) return;
      if (!c) {
        setStatus('error');
        setError(`Could not load ${service} Cave shell (manifest or UI Tome unavailable).`);
        return;
      }
      setCave(c);
      setStatus('ready');
    });

    return () => {
      cancelled = true;
    };
  }, [service, enabled, tick, options?.forceRefresh]);

  return { status, cave, error, retry };
}
