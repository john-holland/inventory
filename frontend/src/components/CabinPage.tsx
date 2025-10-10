import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Paper,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Stepper,
  Step,
  StepLabel,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Home as HomeIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Event as EventIcon,
  Chat as ChatIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Flight as FlightIcon,
  Hotel as HotelIcon,
  ShoppingBag as BagIcon
} from '@mui/icons-material';
import { CabinService, Cabin, CabinCreateRequest, CabinItemTakeout } from '../services/CabinService';

export const CabinPage: React.FC = () => {
  const [cabins, setCabins] = useState<Cabin[]>([]);
  const [selectedCabin, setSelectedCabin] = useState<Cabin | null>(null);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [openTakeoutDialog, setOpenTakeoutDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  const cabinService = CabinService.getInstance();

  const [newCabin, setNewCabin] = useState<CabinCreateRequest>({
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
      longitude: 0
    },
    vehicleInfo: {
      mpg: 25,
      fuelType: 'gasoline'
    }
  });

  const [selectedItemForTakeout, setSelectedItemForTakeout] = useState<string | null>(null);
  const [takeoutReturnDate, setTakeoutReturnDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  useEffect(() => {
    loadCabins();
  }, []);

  const loadCabins = () => {
    const allCabins = cabinService.getCabins();
    setCabins(allCabins);
  };

  const handleCreateCabin = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate
      if (!newCabin.name.trim()) {
        throw new Error('Cabin name is required');
      }
      if (!newCabin.description.trim()) {
        throw new Error('Description is required');
      }
      if (newCabin.userIds.length === 0) {
        throw new Error('At least one user is required');
      }
      if (newCabin.itemIds.length === 0) {
        throw new Error('At least one item is required');
      }
      if (!newCabin.airbnbListingId.trim()) {
        throw new Error('AirBnB listing ID is required');
      }

      const cabin = await cabinService.createCabin(newCabin, 'current-user');
      setCabins([...cabins, cabin]);
      setSuccess('Cabin created successfully! Chat room and calendar invites sent.');
      setOpenCreateDialog(false);
      setActiveStep(0);
      setNewCabin({
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
          longitude: 0
        },
        vehicleInfo: {
          mpg: 25,
          fuelType: 'gasoline'
        }
      });

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create cabin');
    } finally {
      setLoading(false);
    }
  };

  const handleItemTakeout = async () => {
    if (!selectedCabin || !selectedItemForTakeout) return;

    try {
      setLoading(true);
      setError(null);

      await cabinService.recordItemTakeout(
        selectedCabin.id,
        selectedItemForTakeout,
        'current-user',
        takeoutReturnDate
      );

      setSuccess('Item takeout recorded! Hold has been placed.');
      setOpenTakeoutDialog(false);
      loadCabins();

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to record takeout');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
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
  };

  const steps = ['Basic Info', 'Users & Items', 'AirBnB & Dates', 'Review'];

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <TextField
              autoFocus
              margin="dense"
              label="Cabin Name"
              fullWidth
              variant="outlined"
              value={newCabin.name}
              onChange={(e) => setNewCabin({ ...newCabin, name: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              value={newCabin.description}
              onChange={(e) => setNewCabin({ ...newCabin, description: e.target.value })}
              placeholder="Describe the purpose of this cabin demo session..."
            />
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Participants
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={newCabin.userIds.includes('user_1')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewCabin({ ...newCabin, userIds: [...newCabin.userIds, 'user_1'] });
                      } else {
                        setNewCabin({ ...newCabin, userIds: newCabin.userIds.filter(id => id !== 'user_1') });
                      }
                    }}
                  />
                }
                label="John Doe (john@example.com)"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={newCabin.userIds.includes('user_2')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewCabin({ ...newCabin, userIds: [...newCabin.userIds, 'user_2'] });
                      } else {
                        setNewCabin({ ...newCabin, userIds: newCabin.userIds.filter(id => id !== 'user_2') });
                      }
                    }}
                  />
                }
                label="Jane Smith (jane@example.com)"
              />
            </FormGroup>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Select Items for Demo
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={newCabin.itemIds.includes('item_1')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewCabin({ ...newCabin, itemIds: [...newCabin.itemIds, 'item_1'] });
                      } else {
                        setNewCabin({ ...newCabin, itemIds: newCabin.itemIds.filter(id => id !== 'item_1') });
                      }
                    }}
                  />
                }
                label="Professional Camera ($500 value)"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={newCabin.itemIds.includes('item_2')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewCabin({ ...newCabin, itemIds: [...newCabin.itemIds, 'item_2'] });
                      } else {
                        setNewCabin({ ...newCabin, itemIds: newCabin.itemIds.filter(id => id !== 'item_2') });
                      }
                    }}
                  />
                }
                label="DJ Equipment ($1000 value)"
              />
            </FormGroup>
          </Box>
        );

      case 2:
        return (
          <Box>
            <TextField
              margin="dense"
              label="AirBnB Listing ID"
              fullWidth
              variant="outlined"
              value={newCabin.airbnbListingId}
              onChange={(e) => setNewCabin({ ...newCabin, airbnbListingId: e.target.value })}
              placeholder="Enter AirBnB listing ID"
              sx={{ mb: 2 }}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  margin="dense"
                  label="Check-in Date"
                  type="date"
                  fullWidth
                  variant="outlined"
                  value={newCabin.checkIn}
                  onChange={(e) => setNewCabin({ ...newCabin, checkIn: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  margin="dense"
                  label="Check-out Date"
                  type="date"
                  fullWidth
                  variant="outlined"
                  value={newCabin.checkOut}
                  onChange={(e) => setNewCabin({ ...newCabin, checkOut: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            <Alert severity="info" sx={{ mt: 2 }}>
              Travel cost will be calculated automatically based on origin address, destination, and vehicle information.
            </Alert>
          </Box>
        );

      case 3:
        const checkInDate = new Date(newCabin.checkIn);
        const checkOutDate = new Date(newCabin.checkOut);
        const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
        const estimatedAirbnbCost = nights * 150;
        const travelHold = 0; // Will be calculated automatically
        
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Cabin Details
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Cabin Name"
                  secondary={newCabin.name}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Participants"
                  secondary={`${newCabin.userIds.length} users`}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Items for Demo"
                  secondary={`${newCabin.itemIds.length} items`}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Duration"
                  secondary={`${nights} nights`}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Estimated AirBnB Cost"
                  secondary={`$${estimatedAirbnbCost.toFixed(2)}`}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Travel Cost Hold"
                  secondary={`$${travelHold.toFixed(2)}`}
                />
              </ListItem>
            </List>
            <Alert severity="success" sx={{ mt: 2 }}>
              Upon creation, a chat room will be opened and calendar invites will be sent to all participants.
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#121212', minHeight: '100vh' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
          🏠 Cabin - Item Demo Sessions
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateDialog(true)}
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
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Typography variant="h6" sx={{ color: '#fff' }}>
                    {cabin.name}
                  </Typography>
                  <Chip
                    label={cabin.status}
                    color={getStatusColor(cabin.status) as any}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" sx={{ color: '#ccc', mb: 2 }}>
                  {cabin.description}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Chip
                    icon={<PeopleIcon />}
                    label={`${cabin.users.length} participants`}
                    size="small"
                    sx={{ mr: 1, mb: 1 }}
                  />
                  <Chip
                    icon={<InventoryIcon />}
                    label={`${cabin.items.length} items`}
                    size="small"
                    sx={{ mr: 1, mb: 1 }}
                  />
                  <Chip
                    icon={<LocationIcon />}
                    label={cabin.address.city}
                    size="small"
                    sx={{ mb: 1 }}
                  />
                </Box>

                <Divider sx={{ my: 2, bgcolor: '#333' }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    Check-in:
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#fff' }}>
                    {new Date(cabin.checkIn).toLocaleDateString()}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    Check-out:
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#fff' }}>
                    {new Date(cabin.checkOut).toLocaleDateString()}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    Total Cost:
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                    ${cabin.totalCost.toFixed(2)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    Travel Hold:
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                    ${cabin.travelCostHold.toFixed(2)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ChatIcon />}
                    fullWidth
                    sx={{ color: '#4caf50', borderColor: '#4caf50' }}
                  >
                    Chat
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setSelectedCabin(cabin);
                      setOpenDetailsDialog(true);
                    }}
                    fullWidth
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

      {/* Create Cabin Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Cabin Demo Session</DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ mt: 2, mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {renderStepContent(activeStep)}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          {activeStep > 0 && (
            <Button onClick={() => setActiveStep(activeStep - 1)}>
              Back
            </Button>
          )}
          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={() => setActiveStep(activeStep + 1)}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleCreateCabin}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
            >
              {loading ? 'Creating...' : 'Create Cabin'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Cabin Details Dialog */}
      <Dialog open={openDetailsDialog} onClose={() => setOpenDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedCabin?.name}
        </DialogTitle>
        <DialogContent>
          {selectedCabin && (
            <Box>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {selectedCabin.description}
              </Typography>

              <Paper sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
                <Typography variant="h6" gutterBottom>
                  📍 AirBnB Information
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>{selectedCabin.airbnbInfo.title}</strong>
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {selectedCabin.airbnbInfo.description}
                </Typography>
                <Typography variant="body2">
                  💰 ${selectedCabin.airbnbInfo.pricePerNight}/night
                </Typography>
                <Typography variant="body2">
                  🕐 Check-in: {selectedCabin.airbnbInfo.checkInTime} | Check-out: {selectedCabin.airbnbInfo.checkOutTime}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  📍 {selectedCabin.address.address}, {selectedCabin.address.city}, {selectedCabin.address.state}
                </Typography>
              </Paper>

              <Typography variant="h6" gutterBottom>
                👥 Participants ({selectedCabin.users.length})
              </Typography>
              <List>
                {selectedCabin.users.map((user) => (
                  <ListItem key={user.id}>
                    <ListItemAvatar>
                      <Avatar>{user.name.charAt(0)}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={user.name}
                      secondary={user.email}
                    />
                  </ListItem>
                ))}
              </List>

              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                📦 Items for Demo ({selectedCabin.items.length})
              </Typography>
              <List>
                {selectedCabin.items.map((item) => (
                  <ListItem
                    key={item.id}
                    secondaryAction={
                      item.canTakeAway && (
                        <Button
                          size="small"
                          startIcon={<BagIcon />}
                          onClick={() => {
                            setSelectedItemForTakeout(item.itemId);
                            setOpenTakeoutDialog(true);
                          }}
                        >
                          Take Away
                        </Button>
                      )
                    }
                  >
                    <ListItemText
                      primary={item.itemName}
                      secondary={`Value: $${item.itemValue} | Deposit: $${item.depositAmount}`}
                    />
                  </ListItem>
                ))}
              </List>

              {selectedCabin.itemTakeouts.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    📋 Active Takeouts
                  </Typography>
                  <List>
                    {selectedCabin.itemTakeouts.map((takeout) => (
                      <ListItem key={takeout.id}>
                        <ListItemText
                          primary={`Item ${takeout.itemId}`}
                          secondary={`Hold: $${takeout.holdAmount.toFixed(2)} | Return by: ${new Date(takeout.expectedReturnDate).toLocaleDateString()}`}
                        />
                        <Chip
                          label={takeout.status}
                          size="small"
                          color={takeout.status === 'active' ? 'warning' : 'success'}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}

              <Paper sx={{ p: 2, mt: 2, bgcolor: '#fff3cd' }}>
                <Typography variant="body2">
                  <strong>Total Holds:</strong> ${cabinService.calculateTotalHolds(selectedCabin.id).toFixed(2)}
                </Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Item Takeout Dialog */}
      <Dialog open={openTakeoutDialog} onClose={() => setOpenTakeoutDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Take Item Away</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Taking an item away will place a hold on your account for the travel cost (2x) plus the item deposit.
          </Alert>
          <TextField
            margin="dense"
            label="Expected Return Date"
            type="date"
            fullWidth
            variant="outlined"
            value={takeoutReturnDate}
            onChange={(e) => setTakeoutReturnDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTakeoutDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleItemTakeout}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Confirm Takeout'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CabinPage;

