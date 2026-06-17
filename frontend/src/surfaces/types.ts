import type React from 'react';

export type SurfaceViewProps = {
  model?: Record<string, unknown>;
  send: (event: { type: string; [key: string]: unknown }) => void;
  state?: string;
  log?: (message: string, meta?: Record<string, unknown>) => Promise<void>;
  parentSend?: (event: { type: string; [key: string]: unknown }) => void;
  getSubMachine?: (id: string) => { useViewStateMachine: (model: unknown) => { viewStack: React.ReactNode } } | undefined;
};

export type SurfaceViewComponent = React.ComponentType<SurfaceViewProps>;
