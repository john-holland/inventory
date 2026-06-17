import React, { useEffect, useMemo, useState } from 'react';
import { loadTomeSurfaceIndex } from './tomeModuleLoader.js';
import { buildSurfaceMachineWithSubMachines } from './buildSurfaceMachineWithSubMachines.jsx';
import { getServiceCaveDb } from './browserCaveDb.js';

/**
 * @typedef {Object} UseTomeSurfaceOptions
 * @property {Record<string, import('react').ComponentType<any>>} viewComponents
 * @property {import('log-view-machine/browser').RobotCopySendFn} robotCopySend
 * @property {() => string | null} readPresence
 * @property {Record<string, string>} messages
 * @property {Record<string, unknown>} [initialModel]
 * @property {boolean} [enabled]
 */

/**
 * @param {'resaurce'|'saurce'} service
 * @param {string} surfaceId
 * @param {UseTomeSurfaceOptions} options
 */
export function useTomeSurface(service, surfaceId, options) {
  const [machine, setMachine] = useState(null);
  const [error, setError] = useState(null);
  const enabled = options.enabled !== false;

  const viewKey = useMemo(
    () => `${service}:${surfaceId}:${Object.keys(options.viewComponents || {}).sort().join(',')}`,
    [service, surfaceId, options.viewComponents]
  );

  useEffect(() => {
    if (!enabled) {
      setMachine(null);
      return;
    }
    let cancelled = false;
    setError(null);
    (async () => {
      const index = await loadTomeSurfaceIndex(service, surfaceId);
      if (cancelled) return;
      if (!index) {
        setError(`Unknown surface ${service}:${surfaceId}`);
        setMachine(null);
        return;
      }
      const db = getServiceCaveDb(service);
      const built = buildSurfaceMachineWithSubMachines({
        index,
        viewComponents: options.viewComponents,
        deps: {
          robotCopySend: options.robotCopySend,
          readPresence: options.readPresence,
          messages: options.messages,
          db,
          delegationService: service,
        },
        initialModel: options.initialModel || {},
      });
      if (typeof built.start === 'function') built.start();
      setMachine(built);
    })().catch((e) => {
      if (!cancelled) setError(e instanceof Error ? e.message : String(e));
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, service, surfaceId, viewKey, options.robotCopySend, options.readPresence, options.messages, options.initialModel, options.viewComponents]);

  return { machine, error };
}

/**
 * Render slot for a built surface machine.
 * @param {{ machine: ReturnType<typeof buildSurfaceMachine>|null; initialModel?: Record<string, unknown> }} props
 */
export function TomeSurfaceView({ machine, initialModel = {} }) {
  if (!machine) return null;
  const { viewStack } = machine.useViewStateMachine(initialModel);
  return <>{viewStack}</>;
}
