import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Schedule as ScheduleIcon,
  People as PeopleIcon,
  LocationOn as LocationIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Sync as SyncIcon,
  Block as BlockIcon,
  Add as AddIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { CabinService } from '../services/CabinService';
import { AppointmentSlot, AppointmentBooking } from '../services/AirbnbCalendarService';

export const CabinCalendarIntegration: React.FC = () => {
  const [cabins, setCabins] = useState<any[]>([]);
  const [selectedCabin, setSelectedCabin] = useState<any>(null);
  const [appointmentSlots, setAppointmentSlots] = useState<AppointmentSlot[]>([]);
  const [appointmentHistory, setAppointmentHistory] = useState<AppointmentBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openBookingDialog, setOpenBookingDialog] = useState(false);
  const [openBlockDialog, setOpenBlockDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null);
  const [bookingForm, setBookingForm] = useState({
    userName: '',
    userEmail: '',
    participants: 1,
    specialRequests: ''
  });
  const [blockForm, setBlockForm] = useState({
    startDate: '',
    endDate: '',
    reason: 'maintenance',
    description: ''
  });

  const cabinService = CabinService.getInstance();

  const loadCabins = async () => {
    try {
      const allCabins = cabinService.getCabins();
      setCabins(allCabins);
      if (allCabins.length > 0) {
        setSelectedCabin(allCabins[0]);
        await loadCabinData(allCabins[0].id);
      }
    } catch (error) {
      setError('Failed to load cabins');
    }
  };

  const loadCabinData = async (cabinId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Load appointment slots for next 7 days
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const slots = await cabinService.getCabinAppointmentSlots(cabinId, startDate, endDate);
      setAppointmentSlots(slots);

      // Load appointment history
      const history = await cabinService.getCabinAppointmentHistory(cabinId);
      setAppointmentHistory(history);

      setLoading(false);
    } catch (error) {
      setError('Failed to load cabin data');
      setLoading(false);
    }
  };

  const bookAppointment = async () => {
    if (!selectedCabin || !selectedSlot) return;

    try {
      setLoading(true);
      setError(null);

      const booking = await cabinService.scheduleCabinAppointment(
        selectedCabin.id,
        selectedSlot.appointmentType,
        selectedSlot.startTime,
        selectedSlot.endTime,
        bookingForm.participants,
        bookingForm.userName,
        bookingForm.userEmail,
        bookingForm.specialRequests
      );

      setOpenBookingDialog(false);
      setSelectedSlot(null);
      setBookingForm({
        userName: '',
        userEmail: '',
        participants: 1,
        specialRequests: ''
      });

      await loadCabinData(selectedCabin.id);
      alert(`Appointment booked! Confirmation: ${booking.confirmationCode}`);
      setLoading(false);

    } catch (error) {
      setError('Failed to book appointment');
      setLoading(false);
    }
  };

  const blockCabinDates = async () => {
    if (!selectedCabin) return;

    try {
      setLoading(true);
      setError(null);

      await cabinService.blockCabinDates(
        selectedCabin.id,
        blockForm.startDate,
        blockForm.endDate,
        blockForm.reason as any,
        blockForm.description
      );

      setOpenBlockDialog(false);
      setBlockForm({
        startDate: '',
        endDate: '',
        reason: 'maintenance',
        description: ''
      });

      await loadCabinData(selectedCabin.id);
      alert('Cabin dates blocked successfully');
      setLoading(false);

    } catch (error) {
      setError('Failed to block cabin dates');
      setLoading(false);
    }
  };

  const syncCalendar = async () => {
    if (!selectedCabin) return;

    try {
      setLoading(true);
      const result = await cabinService.syncCabinCalendar(selectedCabin.id);
      alert(`Calendar synced! ${result.syncedDates} dates updated.`);
      await loadCabinData(selectedCabin.id);
      setLoading(false);
    } catch (error) {
      setError('Failed to sync calendar');
      setLoading(false);
    }
  };

  const cancelAppointment = async (bookingId: string) => {
    if (!selectedCabin || !window.confirm('Are you sure you want to cancel this appointment?')) return;

    try {
      setLoading(true);
      const result = await cabinService.cancelCabinAppointment(selectedCabin.id, bookingId);
      alert(`Appointment cancelled. Refund: $${result.refundAmount}`);
      await loadCabinData(selectedCabin.id);
      setLoading(false);
    } catch (error) {
      setError('Failed to cancel appointment');
      setLoading(false);
    }
  };

  const handleSlotSelect = (slot: AppointmentSlot) => {
    setSelectedSlot(slot);
    setOpenBookingDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      case 'completed': return 'info';
      default: return 'default';
    }
  };

  const getAppointmentTypeIcon = (type: string) => {
    switch (type) {
      case 'demo': return '🎯';
      case 'tour': return '🏠';
      case 'meeting': return '💼';
      case 'inspection': return '🔍';
      default: return '📅';
    }
  };

  useEffect(() => {
    loadCabins();
  }, []);

  return (
    <Box sx={{ p: 3, backgroundColor: '#121212', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#fff', mb: 3 }}>
        🏠 Cabin Calendar Integration
      </Typography>

      <Grid container spacing={3}>
        {/* Cabin Selection */}
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                Select Cabin
              </Typography>

              <List>
                {cabins.map((cabin) => (
                  <ListItem
                    key={cabin.id}
                    button
                    selected={selectedCabin?.id === cabin.id}
                    onClick={() => {
                      setSelectedCabin(cabin);
                      loadCabinData(cabin.id);
                    }}
                    sx={{ 
                      backgroundColor: selectedCabin?.id === cabin.id ? '#333' : 'transparent',
                      borderRadius: 1,
                      mb: 1
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ backgroundColor: '#4caf50' }}>
                        🏠
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={cabin.name}
                      secondary={`${cabin.address.city}, ${cabin.address.state}`}
                      primaryTypographyProps={{ color: '#fff' }}
                      secondaryTypographyProps={{ color: '#ccc' }}
                    />
                  </ListItem>
                ))}
              </List>

              {selectedCabin && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<SyncIcon />}
                    onClick={syncCalendar}
                    disabled={loading}
                    sx={{ mb: 1, borderColor: '#2196f3', color: '#2196f3' }}
                  >
                    Sync Calendar
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<BlockIcon />}
                    onClick={() => setOpenBlockDialog(true)}
                    sx={{ borderColor: '#f44336', color: '#f44336' }}
                  >
                    Block Dates
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Appointment Slots */}
        <Grid item xs={12} md={9}>
          <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                Available Appointment Slots ({appointmentSlots.length})
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              {loading && (
                <Box display="flex" justifyContent="center" py={3}>
                  <CircularProgress />
                </Box>
              )}

              {!loading && appointmentSlots.length === 0 && (
                <Alert severity="info">
                  No available appointment slots found for this cabin.
                </Alert>
              )}

              {!loading && appointmentSlots.length > 0 && (
                <TableContainer component={Paper} sx={{ backgroundColor: '#2a2a2a' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: '#fff' }}>Date & Time</TableCell>
                        <TableCell sx={{ color: '#fff' }}>Type</TableCell>
                        <TableCell sx={{ color: '#fff' }}>Duration</TableCell>
                        <TableCell sx={{ color: '#fff' }}>Participants</TableCell>
                        <TableCell sx={{ color: '#fff' }}>Price</TableCell>
                        <TableCell sx={{ color: '#fff' }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {appointmentSlots.map((slot) => (
                        <TableRow key={slot.id}>
                          <TableCell sx={{ color: '#fff' }}>
                            {new Date(slot.startTime).toLocaleDateString()} at{' '}
                            {new Date(slot.startTime).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </TableCell>
                          <TableCell sx={{ color: '#fff' }}>
                            <Chip
                              icon={<span>{getAppointmentTypeIcon(slot.appointmentType)}</span>}
                              label={slot.appointmentType}
                              size="small"
                              color="primary"
                            />
                          </TableCell>
                          <TableCell sx={{ color: '#fff' }}>
                            {slot.duration} min
                          </TableCell>
                          <TableCell sx={{ color: '#fff' }}>
                            {slot.currentParticipants}/{slot.maxParticipants}
                          </TableCell>
                          <TableCell sx={{ color: '#fff' }}>
                            ${slot.price}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => handleSlotSelect(slot)}
                              sx={{ backgroundColor: '#4caf50' }}
                            >
                              Book
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>

          {/* Appointment History */}
          <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333', mt: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                Appointment History ({appointmentHistory.length})
              </Typography>

              {appointmentHistory.length === 0 ? (
                <Alert severity="info">
                  No appointment history for this cabin.
                </Alert>
              ) : (
                <List>
                  {appointmentHistory.map((appointment) => (
                    <ListItem key={appointment.id} sx={{ borderBottom: '1px solid #333' }}>
                      <ListItemAvatar>
                        <Avatar sx={{ backgroundColor: '#4caf50' }}>
                          {getAppointmentTypeIcon('demo')}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6" sx={{ color: '#fff' }}>
                              {new Date(appointment.startTime).toLocaleDateString()} at{' '}
                              {new Date(appointment.startTime).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </Typography>
                            <Chip
                              label={appointment.status}
                              color={getStatusColor(appointment.status) as any}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" sx={{ color: '#ccc' }}>
                              Confirmation: {appointment.confirmationCode}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#ccc' }}>
                              Participants: {appointment.participants} | Total: ${appointment.totalCost}
                            </Typography>
                            {appointment.specialRequests && (
                              <Typography variant="body2" sx={{ color: '#ccc' }}>
                                Special Requests: {appointment.specialRequests}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <Box>
                        <IconButton
                          onClick={() => cancelAppointment(appointment.id)}
                          disabled={appointment.status === 'cancelled' || appointment.status === 'completed'}
                          sx={{ color: '#f44336' }}
                        >
                          <CancelIcon />
                        </IconButton>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Booking Dialog */}
      <Dialog open={openBookingDialog} onClose={() => setOpenBookingDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Book Appointment - {selectedSlot?.appointmentType}
        </DialogTitle>
        <DialogContent>
          {selectedSlot && (
            <Box>
              <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                {new Date(selectedSlot.startTime).toLocaleDateString()} at{' '}
                {new Date(selectedSlot.startTime).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Your Name"
                    value={bookingForm.userName}
                    onChange={(e) => setBookingForm({ ...bookingForm, userName: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={bookingForm.userEmail}
                    onChange={(e) => setBookingForm({ ...bookingForm, userEmail: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Number of Participants"
                    type="number"
                    value={bookingForm.participants}
                    onChange={(e) => setBookingForm({ ...bookingForm, participants: parseInt(e.target.value) || 1 })}
                    inputProps={{ min: 1, max: selectedSlot.maxParticipants - selectedSlot.currentParticipants }}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Total Cost"
                    value={`$${selectedSlot.price * bookingForm.participants}`}
                    disabled
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Special Requests (Optional)"
                    multiline
                    rows={3}
                    value={bookingForm.specialRequests}
                    onChange={(e) => setBookingForm({ ...bookingForm, specialRequests: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                </Grid>
              </Grid>

              <Alert severity="info" sx={{ mt: 2 }}>
                This appointment will be scheduled for the selected cabin and all participants will be notified.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBookingDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={bookAppointment}
            disabled={loading || !bookingForm.userName || !bookingForm.userEmail}
            startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
          >
            {loading ? 'Booking...' : 'Confirm Booking'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Block Dates Dialog */}
      <Dialog open={openBlockDialog} onClose={() => setOpenBlockDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Block Cabin Dates
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={blockForm.startDate}
                onChange={(e) => setBlockForm({ ...blockForm, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={blockForm.endDate}
                onChange={(e) => setBlockForm({ ...blockForm, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Reason</InputLabel>
                <Select
                  value={blockForm.reason}
                  onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                >
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="cleaning">Cleaning</MenuItem>
                  <MenuItem value="personal">Personal</MenuItem>
                  <MenuItem value="booking">Booking</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description (Optional)"
                multiline
                rows={3}
                value={blockForm.description}
                onChange={(e) => setBlockForm({ ...blockForm, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBlockDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={blockCabinDates}
            disabled={loading || !blockForm.startDate || !blockForm.endDate}
            startIcon={loading ? <CircularProgress size={20} /> : <BlockIcon />}
            sx={{ backgroundColor: '#f44336' }}
          >
            {loading ? 'Blocking...' : 'Block Dates'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CabinCalendarIntegration;
