declare module '@inventory/cave-ui-lvm' {
  import type React from 'react';

  export function createBrowserCaveDb(tomeId: string): import('log-view-machine/browser').CaveDBAdapter;
  export function getServiceCaveDb(service: string): import('log-view-machine/browser').CaveDBAdapter;
  export function serviceCaveDbTomeId(service: string): string;
  export function getPresenceStore(service?: string): {
    readSync: () => string | null;
    read: () => Promise<string | null>;
    write: (token: string | null) => Promise<void>;
  };
  export function loadTomeSurfaceIndex(service: string, surfaceId: string): Promise<Record<string, unknown> | null>;
  export function buildSurfaceMachine(options: Record<string, unknown>): import('log-view-machine/browser').ViewStateMachine;
  export function buildSurfaceMachineWithSubMachines(options: Record<string, unknown>): import('log-view-machine/browser').ViewStateMachine;
  export function useTomeSurface(
    service: 'resaurce' | 'saurce',
    surfaceId: string,
    options: Record<string, unknown>
  ): { machine: import('log-view-machine/browser').ViewStateMachine | null; error: string | null };
  export function TomeSurfaceView(props: {
    machine: import('log-view-machine/browser').ViewStateMachine | null;
    initialModel?: Record<string, unknown>;
  }): React.ReactElement | null;
}
