import React, { Suspense, lazy, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import CaveFeatureGate from '../../cave/CaveFeatureGate';
import type { SurfaceViewProps } from '../types';

const HrChatRemote = lazy(() => import('resaurce_hr/HrChatApp'));

const hrRemoteModuleEnabled =
  (typeof process !== 'undefined' && process.env.REACT_APP_RESAURCE_HR_REMOTE === 'true') || false;

/** Parent `idle` (initial). Auto-sends LOAD when dialog gate is enabled. */
export function HrIdleView({ send }: SurfaceViewProps) {
  useEffect(() => {
    send({ type: 'LOAD' });
  }, [send]);
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
      <CircularProgress size={24} />
    </Box>
  );
}

/** Parent `loading`. on_enter → request_hr_help. */
export function HrLoadingView() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
      <CircularProgress size={24} />
    </Box>
  );
}

/** Parent `ready`. Hosts federated HR chat when remote module enabled. */
export function HrReadyView({ model }: SurfaceViewProps) {
  const tenantId = (model as { tenantId?: string })?.tenantId;
  const userId = (model as { userId?: string })?.userId || 'current_user_id';
  const [context, setContext] = React.useState('Document assistance');

  if (hrRemoteModuleEnabled) {
    return (
      <Suspense fallback={<CircularProgress size={24} />}>
        <HrChatRemote tenantId={tenantId} userId={userId} initialContext={context} />
      </Suspense>
    );
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 2 }}>
        HR help session ready via resaurce Cave.
      </Typography>
      <TextField
        fullWidth
        label="What do you need help with?"
        value={context}
        onChange={(e) => setContext(e.target.value)}
        multiline
        rows={3}
        sx={{ mb: 2 }}
      />
      <Alert severity="info">
        Enable REACT_APP_RESAURCE_HR_REMOTE for federated HR chat UI.
      </Alert>
    </Box>
  );
}

export function HrErrorView({ send }: SurfaceViewProps) {
  return (
    <Alert severity="error" action={<Button size="small" onClick={() => send({ type: 'RETRY' })}>Retry</Button>}>
      HR help request failed.
    </Alert>
  );
}

export function PresenceSignInView({ send }: SurfaceViewProps) {
  return (
    <Alert
      severity="warning"
      action={
        <Button size="small" onClick={() => send({ type: 'PRESENCE_VERIFIED' })}>
          Continue
        </Button>
      }
    >
      Sign in required for HR workspace.
    </Alert>
  );
}

export const hrHelpViews = {
  HrIdleView,
  HrLoadingView,
  HrReadyView,
  HrErrorView,
  PresenceSignInView,
};

/** Dialog wrapper used by DocumentsPage thin shell. */
export function HrHelpDialog({
  open,
  onClose,
  tenantId,
  userId,
}: {
  open: boolean;
  onClose: () => void;
  tenantId?: string;
  userId?: string;
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>HR Help</DialogTitle>
      <DialogContent>
        <CaveFeatureGate
          service="resaurce"
          surface="hr_help"
          enabled={open}
          initialModel={{ tenantId, userId }}
        />
      </DialogContent>
    </Dialog>
  );
}
