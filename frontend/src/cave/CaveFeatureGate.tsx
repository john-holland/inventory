/**
 * Renders loading placeholder, unset message, or LVM surface via useTomeSurface.
 */

import React, { useMemo } from 'react';
import { Alert, Box, Button, CircularProgress } from '@mui/material';
import { useTomeSurface, TomeSurfaceView, getPresenceStore } from '@inventory/cave-ui-lvm';
import { readPresenceFromWindow } from '../adapters/userPresenceCaveAdapter';
import { caveUnsetMessage } from './caveShellMessages';
import { useCaveShell, type CaveShellStatus } from './useCaveShell';
import { getSurfaceRegistry } from '../surfaces/registry';
import type { ResaurceInventoryCave } from './resaurceInventoryCave';
import type { SaurceInventoryCave } from './saurceInventoryCave';
import type { SoaServiceName } from '../services/soaRegistry';

function readSaurcePresence(): string | null {
  try {
    return getPresenceStore('saurce').readSync();
  } catch {
    return null;
  }
}

type Props = {
  service: 'resaurce' | 'saurce';
  surface: string;
  featureLabel?: string;
  enabled?: boolean;
  initialModel?: Record<string, unknown>;
  loadingFallback?: React.ReactNode;
  children?: (ctx: {
    cave: ResaurceInventoryCave | SaurceInventoryCave;
    status: CaveShellStatus;
    machine: NonNullable<ReturnType<typeof useTomeSurface>['machine']>;
    viewStack: React.ReactNode;
  }) => React.ReactNode;
};

function MachineViewSlot({
  machine,
  cave,
  status,
  initialModel,
  children,
}: {
  machine: NonNullable<ReturnType<typeof useTomeSurface>['machine']>;
  cave: ResaurceInventoryCave | SaurceInventoryCave;
  status: CaveShellStatus;
  initialModel?: Record<string, unknown>;
  children?: Props['children'];
}) {
  const { viewStack } = machine.useViewStateMachine(initialModel || {});
  if (children) {
    return <>{children({ cave, status, machine, viewStack })}</>;
  }
  return <TomeSurfaceView machine={machine} />;
}

export function CaveFeatureGate({
  service,
  surface,
  featureLabel,
  enabled = true,
  initialModel,
  loadingFallback,
  children,
}: Props): React.ReactElement | null {
  const { status, cave, error, retry } = useCaveShell(service, { enabled });
  const registry = getSurfaceRegistry(service, surface);

  const robotCopySend = useMemo(() => {
    if (!cave?.robotCopy) return undefined;
    return (
      message: string,
      payload: Record<string, unknown>,
      opts?: { traceId?: string; presence?: string | null; service?: string }
    ) =>
      cave.robotCopy.sendMessage(message, payload, {
        traceId: opts?.traceId,
        presence: opts?.presence,
        service: (opts?.service as SoaServiceName) || service,
      });
  }, [cave, service]);

  const readPresence = useMemo(() => {
    if (service === 'resaurce') return readPresenceFromWindow;
    return readSaurcePresence;
  }, [service]);

  const surfaceReady = status === 'ready' && !!registry && !!robotCopySend;
  const { machine, error: surfaceError } = useTomeSurface(service, surface, {
    viewComponents: registry?.viewComponents || {},
    messages: registry?.messages || {},
    robotCopySend: robotCopySend || (async () => ({ ok: false, error: 'no_robotcopy' })),
    readPresence,
    initialModel,
    enabled: surfaceReady,
  });

  if (!enabled || status === 'unset') {
    return (
      <Alert severity="info">
        {featureLabel ? `${featureLabel}: ` : ''}
        {caveUnsetMessage(service as SoaServiceName)}
      </Alert>
    );
  }

  if (status === 'loading') {
    if (loadingFallback) return <>{loadingFallback}</>;
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (status === 'error') {
    return (
      <Box>
        <Alert severity="error">{error}</Alert>
        <Button size="small" onClick={retry} sx={{ mt: 1 }}>
          Retry
        </Button>
      </Box>
    );
  }

  if (!cave || !registry) {
    return (
      <Alert severity="warning">
        {featureLabel ? `${featureLabel}: ` : ''}
        Surface &quot;{surface}&quot; is not registered for {service}.
      </Alert>
    );
  }

  if (surfaceError) {
    return <Alert severity="error">{surfaceError}</Alert>;
  }

  if (!machine) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <MachineViewSlot
      machine={machine}
      cave={cave}
      status={status}
      initialModel={initialModel}
      children={children}
    />
  );
}

export default CaveFeatureGate;
