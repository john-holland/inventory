/**
 * cabin_session surface — withState views (no page-level switch).
 */

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  Grid,
  List,
  ListItem,
  ListItemText,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Chat as ChatIcon,
  Inventory as InventoryIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  ShoppingBag as BagIcon,
} from '@mui/icons-material';
import {
  CabinService,
  type Cabin,
  type CabinCreateRequest,
} from '../../../services/CabinService';
import type { SurfaceViewProps } from '../../types';
import { SubMachineSlot } from './SubMachineSlot';

const STEPS = ['Basic Info', 'Users & Items', 'AirBnB & Dates', 'Review'];

const emptyDraft = (): CabinCreateRequest => ({
  name: '',
  description: '',
  userIds: [],
  itemIds: [],
  airbnbListingId: '',
  checkIn: new Date().toISOString().split('T')[0],
  checkOut: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  originAddress: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    latitude: 0,
    longitude: 0,
  },
  vehicleInfo: { mpg: 25, fuelType: 'gasoline' },
});

function statusColor(status: string) {
  switch (status) {
    case 'scheduled':
      return 'info';
    case 'active':
      return 'success';
    case 'completed':
      return 'default';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
}

/** Parent `idle` (initial). Auto-sends LOAD → `loading`. */
export function CabinIdleView({ send }: SurfaceViewProps) {
  useEffect(() => {
    send({ type: 'LOAD' });
  }, [send]);
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
      <CircularProgress />
    </Box>
  );
}

/** Parent `loading`. Incoming: `idle` (LOAD), `ready` (LOAD|REFRESH), `error` (RETRY), `awaiting_presence` (PRESENCE_VERIFIED). on_enter → review_queue_list. Outgoing: DATA_OK → `ready`, CAVE_FAIL → `error`, PRESENCE_REQUIRED → `awaiting_presence`. */
export function CabinLoadingView() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
      <CircularProgress />
    </Box>
  );
}

/** Parent `error`. Incoming: `loading` (CAVE_FAIL), `submitting` (CAVE_FAIL). Outgoing: RETRY → `loading`. */
export function CabinErrorView({ send, model }: SurfaceViewProps) {
  const err = (model?.error as string) || 'Request failed';
  return (
    <Alert
      severity="error"
      sx={{ mb: 2 }}
      action={
        <Button size="small" onClick={() => send({ type: 'RETRY' })}>
          Retry
        </Button>
      }
    >
      {err}
    </Alert>
  );
}

/** Parent `submitting`. Incoming: `ready` (SUBMIT_REVIEW), `wizardActive` (SUBMIT_SESSION). Outgoing: DATA_OK → `ready`, CAVE_FAIL → `error`. */
export function CabinSubmittingView() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
      <CircularProgress size={24} />
      <Typography sx={{ color: '#ccc' }}>Submitting…</Typography>
    </Box>
  );
}

/** Parent `wizardActive` (capsule → createWizard). Incoming: `ready` (OPEN_WIZARD), `idle` (OPEN_WIZARD). Outgoing: CLOSE_WIZARD → `ready`; sub-machine CONFIRM → parent SUBMIT_SESSION → `submitting`. */
export function CabinWizardShellView({ send, getSubMachine, model }: SurfaceViewProps) {
  const sub = getSubMachine?.('createWizard');
  return (
    <Box sx={{ p: 2, mb: 2, border: '1px solid #333', borderRadius: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ color: '#fff' }}>
          Create Cabin Demo Session
        </Typography>
        <Button size="small" onClick={() => send({ type: 'CLOSE_WIZARD' })}>
          Cancel
        </Button>
      </Box>
      <Stepper activeStep={wizardStepIndex(model)} sx={{ mb: 3 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <SubMachineSlot subMachine={sub} model={model} />
    </Box>
  );
}

function wizardStepIndex(model?: Record<string, unknown>) {
  const step = String(model?.wizardSubState || 'basic');
  const map: Record<string, number> = { basic: 0, users: 1, airbnb: 2, confirm: 3 };
  return map[step] ?? 0;
}

/** Parent `ready`. Incoming: `loading` (DATA_OK), `submitting` (DATA_OK), `wizardActive` (CLOSE_WIZARD). Outgoing: OPEN_WIZARD → `wizardActive`, LOAD|REFRESH → `loading`, SUBMIT_REVIEW → `submitting`. */
export function CabinReadyView({ send }: SurfaceViewProps) {
  const cabinService = CabinService.getInstance();
  const [cabins, setCabins] = useState<Cabin[]>([]);
  const [selectedCabin, setSelectedCabin] = useState<Cabin | null>(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [openTakeout, setOpenTakeout] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [takeoutDate, setTakeoutDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const reload = () => setCabins(cabinService.getCabins());

  useEffect(() => {
    reload();
  }, []);

  const handleTakeout = async () => {
    if (!selectedCabin || !selectedItemId) return;
    setLoading(true);
    setError(null);
    try {
      await cabinService.recordItemTakeout(selectedCabin.id, selectedItemId, 'current-user', takeoutDate);
      setSuccess('Item takeout recorded.');
      setOpenTakeout(false);
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Takeout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#121212', minHeight: '100vh' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ color: '#fff' }}>
          Cabin — Item Demo Sessions
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => send({ type: 'OPEN_WIZARD' })}
          sx={{ backgroundColor: '#4caf50' }}
        >
          Create Cabin
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {cabins.map((cabin) => (
          <Grid item xs={12} md={6} lg={4} key={cabin.id}>
            <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography variant="h6" sx={{ color: '#fff' }}>
                    {cabin.name}
                  </Typography>
                  <Chip label={cabin.status} color={statusColor(cabin.status) as any} size="small" />
                </Box>
                <Typography variant="body2" sx={{ color: '#ccc', mb: 2 }}>
                  {cabin.description}
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Chip icon={<PeopleIcon />} label={`${cabin.users.length} participants`} size="small" sx={{ mr: 1, mb: 1 }} />
                  <Chip icon={<InventoryIcon />} label={`${cabin.items.length} items`} size="small" sx={{ mr: 1, mb: 1 }} />
                  <Chip icon={<LocationIcon />} label={cabin.address.city} size="small" sx={{ mb: 1 }} />
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="outlined" size="small" startIcon={<ChatIcon />} fullWidth sx={{ color: '#4caf50', borderColor: '#4caf50' }}>
                    Chat
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    onClick={() => {
                      setSelectedCabin(cabin);
                      setOpenDetails(true);
                    }}
                    sx={{ color: '#2196f3', borderColor: '#2196f3' }}
                  >
                    Details
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDetails} onClose={() => setOpenDetails(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedCabin?.name}</DialogTitle>
        <DialogContent>
          {selectedCabin && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedCabin.description}
              </Typography>
              <List>
                {selectedCabin.items.map((item) => (
                  <ListItem
                    key={item.id}
                    secondaryAction={
                      item.canTakeAway ? (
                        <Button
                          size="small"
                          startIcon={<BagIcon />}
                          onClick={() => {
                            setSelectedItemId(item.itemId);
                            setOpenTakeout(true);
                          }}
                        >
                          Take Away
                        </Button>
                      ) : undefined
                    }
                  >
                    <ListItemText primary={item.itemName} secondary={`$${item.itemValue}`} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetails(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openTakeout} onClose={() => setOpenTakeout(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Take Item Away</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Expected Return Date"
            type="date"
            fullWidth
            value={takeoutDate}
            onChange={(e) => setTakeoutDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTakeout(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleTakeout} disabled={loading}>
            {loading ? 'Processing…' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

/** Sub-machine `createWizard` / `basic` (initial). Incoming: wizard open, or `users` (BACK). Outgoing: NEXT → `users`. */
export function WizardBasicView({ send, model }: SurfaceViewProps) {
  const draft = (model?.wizardDraft as CabinCreateRequest) || emptyDraft();
  const [name, setName] = useState(draft.name);
  const [description, setDescription] = useState(draft.description);
  return (
    <Box>
      <TextField
        autoFocus
        margin="dense"
        label="Cabin Name"
        fullWidth
        value={name}
        onChange={(e) => setName(e.target.value)}
        sx={{ mb: 2 }}
      />
      <TextField
        margin="dense"
        label="Description"
        fullWidth
        multiline
        rows={4}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={() =>
            send({ type: 'NEXT', wizardDraft: { ...draft, name, description }, wizardSubState: 'users' })
          }
        >
          Next
        </Button>
      </Box>
    </Box>
  );
}

/** Sub-machine `createWizard` / `users`. Incoming: `basic` (NEXT), `airbnb` (BACK). Outgoing: NEXT → `airbnb`, BACK → `basic`. */
export function WizardUsersView({ send, model }: SurfaceViewProps) {
  const draft = (model?.wizardDraft as CabinCreateRequest) || emptyDraft();
  const [userIds, setUserIds] = useState<string[]>(draft.userIds);
  const [itemIds, setItemIds] = useState<string[]>(draft.itemIds);
  const toggle = (list: string[], id: string, set: (v: string[]) => void) => {
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Participants
      </Typography>
      <FormGroup>
        <FormControlLabel
          control={<Checkbox checked={userIds.includes('user_1')} onChange={() => toggle(userIds, 'user_1', setUserIds)} />}
          label="John Doe"
        />
        <FormControlLabel
          control={<Checkbox checked={userIds.includes('user_2')} onChange={() => toggle(userIds, 'user_2', setUserIds)} />}
          label="Jane Smith"
        />
      </FormGroup>
      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        Items
      </Typography>
      <FormGroup>
        <FormControlLabel
          control={<Checkbox checked={itemIds.includes('item_1')} onChange={() => toggle(itemIds, 'item_1', setItemIds)} />}
          label="Professional Camera"
        />
        <FormControlLabel
          control={<Checkbox checked={itemIds.includes('item_2')} onChange={() => toggle(itemIds, 'item_2', setItemIds)} />}
          label="DJ Equipment"
        />
      </FormGroup>
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={() => send({ type: 'BACK', wizardSubState: 'basic' })}>Back</Button>
        <Button
          variant="contained"
          onClick={() => send({ type: 'NEXT', wizardDraft: { ...draft, userIds, itemIds }, wizardSubState: 'airbnb' })}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
}

/** Sub-machine `createWizard` / `airbnb`. Incoming: `users` (NEXT), `confirm` (BACK). Outgoing: NEXT → `confirm`, BACK → `users`. */
export function WizardAirbnbView({ send, model }: SurfaceViewProps) {
  const draft = (model?.wizardDraft as CabinCreateRequest) || emptyDraft();
  const [airbnbListingId, setListing] = useState(draft.airbnbListingId);
  const [checkIn, setCheckIn] = useState(draft.checkIn);
  const [checkOut, setCheckOut] = useState(draft.checkOut);
  return (
    <Box>
      <TextField
        margin="dense"
        label="AirBnB Listing ID"
        fullWidth
        value={airbnbListingId}
        onChange={(e) => setListing(e.target.value)}
        sx={{ mb: 2 }}
      />
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            label="Check-in"
            type="date"
            fullWidth
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Check-out"
            type="date"
            fullWidth
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={() => send({ type: 'BACK', wizardSubState: 'users' })}>Back</Button>
        <Button
          variant="contained"
          onClick={() =>
            send({
              type: 'NEXT',
              wizardDraft: { ...draft, airbnbListingId, checkIn, checkOut },
              wizardSubState: 'confirm',
            })
          }
        >
          Next
        </Button>
      </Box>
    </Box>
  );
}

/** Sub-machine `createWizard` / `confirm`. Incoming: `airbnb` (NEXT). Outgoing: BACK → `airbnb`; parentSend SUBMIT_SESSION → parent `submitting`, CLOSE_WIZARD → parent `ready`. Local validation errors stay on this state. */
export function WizardConfirmView({ send, model, parentSend }: SurfaceViewProps) {
  const draft = (model?.wizardDraft as CabinCreateRequest) || emptyDraft();
  const cabinService = CabinService.getInstance();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleConfirm = async () => {
    setLoading(true);
    setErr(null);
    try {
      if (!draft.name?.trim()) throw new Error('Cabin name is required');
      if (!draft.userIds.length) throw new Error('Select at least one participant');
      if (!draft.itemIds.length) throw new Error('Select at least one item');
      const cabin = await cabinService.createCabin(draft, 'current-user');
      parentSend?.({ type: 'SUBMIT_SESSION', cabinId: cabin.id, wizardDraft: draft });
      parentSend?.({ type: 'CLOSE_WIZARD' });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Create failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review Cabin Details
      </Typography>
      <List>
        <ListItem>
          <ListItemText primary="Name" secondary={draft.name} />
        </ListItem>
        <ListItem>
          <ListItemText primary="Participants" secondary={`${draft.userIds.length} users`} />
        </ListItem>
        <ListItem>
          <ListItemText primary="Items" secondary={`${draft.itemIds.length} items`} />
        </ListItem>
      </List>
      {err && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {err}
        </Alert>
      )}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={() => send({ type: 'BACK', wizardSubState: 'airbnb' })}>Back</Button>
        <Button variant="contained" onClick={handleConfirm} disabled={loading} startIcon={loading ? <CircularProgress size={18} /> : undefined}>
          Create Cabin
        </Button>
      </Box>
    </Box>
  );
}

const wizardViews = {
  WizardBasicView,
  WizardUsersView,
  WizardAirbnbView,
  WizardConfirmView,
};

export const cabinSessionViews = {
  CabinIdleView,
  CabinLoadingView,
  CabinReadyView,
  CabinWizardShellView,
  CabinSubmittingView,
  CabinErrorView,
  ...wizardViews,
};

export { wizardViews };
