import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Card, CardContent, Alert, Grid } from '@mui/material';
import { AirbnbCalendarService } from '../services/AirbnbCalendarService';
import { CabinService } from '../services/CabinService';

export const CalendarIntegrationTest: React.FC = () => {
  const [calendarResults, setCalendarResults] = useState<any>(null);
  const [cabinResults, setCabinResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calendarService = AirbnbCalendarService.getInstance();
  const cabinService = CabinService.getInstance();

  const testCalendarService = async () => {
    try {
      setLoading(true);
      setError(null);

      // Test calendar availability
      const availability = await calendarService.getAvailability(
        'airbnb_123',
        new Date().toISOString().split('T')[0],
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      );

      // Test appointment slots search
      const slots = await calendarService.searchAppointmentSlots({
        listingId: 'airbnb_123',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        appointmentType: 'demo',
        duration: 120,
        maxParticipants: 8
      });

      // Test appointment booking
      const booking = await calendarService.bookAppointment(
        slots[0]?.id || 'test_slot',
        'test-user',
        'John Doe',
        'john@example.com',
        2,
        'Test appointment'
      );

      setCalendarResults({
        availability: availability.length,
        slots: slots.length,
        booking: booking.confirmationCode
      });
      setLoading(false);

    } catch (error) {
      setError('Failed to test calendar service');
      setLoading(false);
    }
  };

  const testCabinIntegration = async () => {
    try {
      setLoading(true);
      setError(null);

      // Test cabin appointment slots
      const slots = await cabinService.getCabinAppointmentSlots(
        'cabin_123',
        new Date().toISOString().split('T')[0],
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        'demo'
      );

      // Test cabin appointment history
      const history = await cabinService.getCabinAppointmentHistory('cabin_123');

      // Test calendar sync
      const syncResult = await cabinService.syncCabinCalendar('cabin_123');

      setCabinResults({
        slots: slots.length,
        history: history.length,
        syncedDates: syncResult.syncedDates
      });
      setLoading(false);

    } catch (error) {
      setError('Failed to test cabin integration');
      setLoading(false);
    }
  };

  const testBlockDates = async () => {
    try {
      setLoading(true);
      setError(null);

      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const block = await cabinService.blockCabinDates(
        'cabin_123',
        startDate,
        endDate,
        'maintenance',
        'Test maintenance block'
      );

      alert(`Cabin dates blocked: ${startDate} to ${endDate}`);
      setLoading(false);

    } catch (error) {
      setError('Failed to block cabin dates');
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#121212', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#fff', mb: 3 }}>
        📅 Calendar Integration Test
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                Airbnb Calendar Service Test
              </Typography>

              <Button
                fullWidth
                variant="contained"
                onClick={testCalendarService}
                disabled={loading}
                sx={{ mb: 2, backgroundColor: '#4caf50' }}
              >
                Test Calendar Service
              </Button>

              {calendarResults && (
                <Box>
                  <Typography variant="body1" sx={{ color: '#ccc', mb: 1 }}>
                    <strong>Availability Records:</strong> {calendarResults.availability}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#ccc', mb: 1 }}>
                    <strong>Available Slots:</strong> {calendarResults.slots}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#ccc', mb: 1 }}>
                    <strong>Test Booking:</strong> {calendarResults.booking}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                Cabin Integration Test
              </Typography>

              <Button
                fullWidth
                variant="contained"
                onClick={testCabinIntegration}
                disabled={loading}
                sx={{ mb: 2, backgroundColor: '#2196f3' }}
              >
                Test Cabin Integration
              </Button>

              <Button
                fullWidth
                variant="outlined"
                onClick={testBlockDates}
                disabled={loading}
                sx={{ mb: 2, borderColor: '#f44336', color: '#f44336' }}
              >
                Test Block Dates
              </Button>

              {cabinResults && (
                <Box>
                  <Typography variant="body1" sx={{ color: '#ccc', mb: 1 }}>
                    <strong>Appointment Slots:</strong> {cabinResults.slots}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#ccc', mb: 1 }}>
                    <strong>Appointment History:</strong> {cabinResults.history}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#ccc', mb: 1 }}>
                    <strong>Synced Dates:</strong> {cabinResults.syncedDates}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333', mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
            Calendar Integration Features
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
            ✅ <strong>Airbnb Calendar API:</strong> Mock implementation with availability checking
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
            ✅ <strong>Appointment Scheduling:</strong> Book, cancel, and manage appointments
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
            ✅ <strong>Cabin Integration:</strong> Schedule appointments for specific cabins
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
            ✅ <strong>Calendar Sync:</strong> Sync with Airbnb calendar availability
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
            ✅ <strong>Date Blocking:</strong> Block dates for maintenance or other reasons
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
            ✅ <strong>Appointment History:</strong> Track all cabin appointments
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
            ✅ <strong>Real-time Updates:</strong> Chat notifications for all calendar events
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CalendarIntegrationTest;
