import React, { useEffect } from 'react';
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';
import type { SurfaceViewProps } from '../types';
import { CsrDashboardBody } from './csrDashboardBody';

/** Parent `idle` (initial). Auto-sends LOAD → `loading`. */
export function ReviewIdleView({ send }: SurfaceViewProps) {
  useEffect(() => {
    send({ type: 'LOAD' });
  }, [send]);
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
      <CircularProgress size={20} />
    </Box>
  );
}

/** Parent `loading`. Incoming: `idle` (LOAD), `ready` (LOAD|REFRESH), `error` (RETRY), `awaiting_presence` (PRESENCE_VERIFIED). on_enter → review_queue_list. Outgoing: DATA_OK → `ready`, CAVE_FAIL → `error`. */
export function ReviewLoadingView() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1, mb: 2 }}>
      <CircularProgress size={20} />
      <Typography variant="body2" sx={{ color: '#999' }}>
        Loading review queue…
      </Typography>
    </Box>
  );
}

/** Parent `ready`. Incoming: `loading` (DATA_OK). CSR ticket queue body; no LVM send events in this view yet. */
export function ReviewReadyView() {
  return <CsrDashboardBody />;
}

/** Parent `submitting`. Incoming: `ready` (SUBMIT_REVIEW). on_enter → review_cabin_submit. Outgoing: DATA_OK → `ready`, CAVE_FAIL → `error`. */
export function ReviewSubmittingView() {
  return (
    <Alert severity="info" sx={{ mb: 2 }}>
      Submitting cabin review…
    </Alert>
  );
}

/** Parent `error`. Incoming: `loading` (CAVE_FAIL), `submitting` (CAVE_FAIL). Outgoing: RETRY → `loading`. */
export function ReviewErrorView({ send }: SurfaceViewProps) {
  return (
    <Alert
      severity="error"
      sx={{ mb: 2 }}
      action={
        <Button color="inherit" size="small" onClick={() => send({ type: 'RETRY' })}>
          Retry
        </Button>
      }
    >
      Review queue request failed.
    </Alert>
  );
}

export const reviewCabinViews = {
  ReviewIdleView,
  ReviewLoadingView,
  ReviewReadyView,
  ReviewSubmittingView,
  ReviewErrorView,
};
