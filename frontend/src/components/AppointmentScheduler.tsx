import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Schedule as ScheduleIcon,
  People as PeopleIcon,
  LocationOn as LocationIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Sync as SyncIcon,
  Block as BlockIcon
} from '@mui/icons-material';
import { AirbnbCalendarService, AppointmentSlot, AppointmentBooking, CalendarSearchRequest } from '../services/AirbnbCalendarService';

export const AppointmentScheduler: React.FC = () => {
  const [searchRequest, setSearchRequest] = useState<CalendarSearchRequest>({
    listingId: 'airbnb_123',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    appointmentType: 'demo',
    duration: 120,
    maxParticipants: 8
  });

  const [availableSlots, setAvailableSlots] = useState<AppointmentSlot[]>([]);
  const [userAppointments, setUserAppointments] = useState<AppointmentBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null);
  const [openBookingDialog, setOpenBookingDialog] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    userName: '',
    userEmail: '',
    participants: 1,
    specialRequests: ''
  });
  const [activeStep, setActiveStep] = useState(0);

  const calendarService = AirbnbCalendarService.getInstance();

  const searchSlots = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const slots = await calendarService.searchAppointmentSlots(searchRequest);
      setAvailableSlots(slots);
      setLoading(false);
    } catch (error) {
      setError('Failed to search appointment slots');
      setLoading(false);
    }
  };

  const loadUserAppointments = async () => {
    try {
      const appointments = await calendarService.getUserAppointments('current-user');
      setUserAppointments(appointments);
    } catch (error) {
      console.error('Failed to load user appointments:', error);
    }
  };

  const bookAppointment = async () => {
    if (!selectedSlot) return;

    try {
      setLoading(true);
      setError(null);

      const booking = await calendarService.bookAppointment(
        selectedSlot.id,
        'current-user',
        bookingForm.userName,
        bookingForm.userEmail,
        bookingForm.participants,
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

      // Refresh data
      await searchSlots();
      await loadUserAppointments();

      alert(`Appointment booked successfully! Confirmation: ${booking.confirmationCode}`);
      setLoading(false);

    } catch (error) {
      setError('Failed to book appointment');
      setLoading(false);
    }
  };

  const cancelAppointment = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;

    try {
      setLoading(true);
      const result = await calendarService.cancelAppointment(bookingId);
      
      if (result.success) {
        alert(`Appointment cancelled. Refund amount: $${result.refundAmount}`);
        await loadUserAppointments();
        await searchSlots();
      }
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
    searchSlots();
    loadUserAppointments();
  }, []);

  return (
    <Box sx={{ p: 3, backgroundColor: '#121212', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#fff', mb: 3 }}>
        📅 Appointment Scheduler - Airbnb Calendar Integration
      </Typography>

      <Grid container spacing={3}>
        {/* Search Form */}
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                Search Appointments
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Listing ID"
                    value={searchRequest.listingId}
                    onChange={(e) => setSearchRequest({ ...searchRequest, listingId: e.target.value })}
                    sx={{ '& .MuiInputBase-input': { color: '#fff' } }}
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    value={searchRequest.startDate}
                    onChange={(e) => setSearchRequest({ ...searchRequest, startDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    sx={{ '& .MuiInputBase-input': { color: '#fff' } }}
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    value={searchRequest.endDate}
                    onChange={(e) => setSearchRequest({ ...searchRequest, endDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    sx={{ '& .MuiInputBase-input': { color: '#fff' } }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Appointment Type</InputLabel>
                    <Select
                      value={searchRequest.appointmentType}
                      onChange={(e) => setSearchRequest({ ...searchRequest, appointmentType: e.target.value as any })}
                    >
                      <MenuItem value="demo">Demo</MenuItem>
                      <MenuItem value="tour">Tour</MenuItem>
                      <MenuItem value="meeting">Meeting</MenuItem>
                      <MenuItem value="inspection">Inspection</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Duration (minutes)"
                    type="number"
                    value={searchRequest.duration}
                    onChange={(e) => setSearchRequest({ ...searchRequest, duration: parseInt(e.target.value) || 120 })}
                    sx={{ '& .MuiInputBase-input': { color: '#fff' } }}
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Max Participants"
                    type="number"
                    value={searchRequest.maxParticipants}
                    onChange={(e) => setSearchRequest({ ...searchRequest, maxParticipants: parseInt(e.target.value) || 8 })}
                    sx={{ '& .MuiInputBase-input': { color: '#fff' } }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
                    onClick={searchSlots}
                    disabled={loading}
                    sx={{ backgroundColor: '#4caf50' }}
                  >
                    {loading ? 'Searching...' : 'Search Slots'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Sync Button */}
          <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333', mt: 2 }}>
            <CardContent>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<SyncIcon />}
                onClick={async () => {
                  try {
                    setLoading(true);
                    const result = await calendarService.syncWithAirbnb(searchRequest.listingId);
                    alert(`Synced ${result.syncedDates} dates with Airbnb`);
                    await searchSlots();
                    setLoading(false);
                  } catch (error) {
                    setError('Failed to sync with Airbnb');
                    setLoading(false);
                  }
                }}
                disabled={loading}
                sx={{ borderColor: '#2196f3', color: '#2196f3' }}
              >
                Sync with Airbnb
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Available Slots */}
        <Grid item xs={12} md={8}>
          <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                Available Appointment Slots ({availableSlots.length})
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              {availableSlots.length === 0 && !loading ? (
                <Alert severity="info">
                  No available slots found for the selected criteria.
                </Alert>
              ) : (
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
                      {availableSlots.map((slot) => (
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
        </Grid>
      </Grid>

      {/* User Appointments */}
      <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333', mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
            My Appointments ({userAppointments.length})
          </Typography>

          {userAppointments.length === 0 ? (
            <Alert severity="info">
              You have no scheduled appointments.
            </Alert>
          ) : (
            <List>
              {userAppointments.map((appointment) => (
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
                This is a demo booking. No real payment will be processed.
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
    </Box>
  );
};

export default AppointmentScheduler;
