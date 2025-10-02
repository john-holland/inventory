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
  Rating,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Hotel as HotelIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  CalendarToday as CalendarIcon,
  Star as StarIcon,
  Wifi as WifiIcon,
  Pool as PoolIcon,
  Restaurant as RestaurantIcon,
  LocalBar as BarIcon,
  DirectionsCar as CarIcon,
  Spa as SpaIcon,
  BookOnline as BookIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { HotelService, Hotel, HotelSearchRequest, HotelBookingRequest } from '../services/HotelService';

export const HotelSearchPage: React.FC = () => {
  const [searchRequest, setSearchRequest] = useState<HotelSearchRequest>({
    location: 'San Francisco, CA',
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    guests: 2,
    rooms: 1,
    minPrice: 0,
    maxPrice: 500
  });

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [openBookingDialog, setOpenBookingDialog] = useState(false);
  const [bookingRequest, setBookingRequest] = useState<Partial<HotelBookingRequest>>({});

  const hotelService = HotelService.getInstance();

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const results = await hotelService.searchHotels(searchRequest);
      setHotels(results);
      setLoading(false);
    } catch (error) {
      setError('Failed to search hotels');
      setLoading(false);
    }
  };

  const handleBookHotel = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    setBookingRequest({
      hotelId: hotel.id,
      roomTypeId: hotel.roomTypes[0]?.id,
      checkIn: searchRequest.checkIn,
      checkOut: searchRequest.checkOut,
      guests: searchRequest.guests,
      rooms: searchRequest.rooms,
      guestInfo: {
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
      },
      paymentInfo: {
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        billingAddress: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'USA',
          latitude: 0,
          longitude: 0
        }
      }
    });
    setOpenBookingDialog(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedHotel || !bookingRequest.hotelId) return;

    try {
      setLoading(true);
      const booking = await hotelService.bookHotel('hoteltonight', bookingRequest as HotelBookingRequest);
      
      setOpenBookingDialog(false);
      setError(null);
      alert(`Booking confirmed! Confirmation code: ${booking.confirmationCode}`);
      setLoading(false);
    } catch (error) {
      setError('Failed to book hotel');
      setLoading(false);
    }
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi': return <WifiIcon />;
      case 'pool': return <PoolIcon />;
      case 'restaurant': return <RestaurantIcon />;
      case 'bar': return <BarIcon />;
      case 'parking': return <CarIcon />;
      case 'spa': return <SpaIcon />;
      default: return <InfoIcon />;
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'hoteltonight': return 'primary';
      case 'booking': return 'success';
      case 'expedia': return 'warning';
      case 'airbnb': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#121212', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#fff', mb: 3 }}>
        🏨 Hotel Search - Multi-Provider Integration
      </Typography>

      {/* Search Form */}
      <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333', mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Location"
                value={searchRequest.location}
                onChange={(e) => setSearchRequest({ ...searchRequest, location: e.target.value })}
                InputProps={{
                  startAdornment: <LocationIcon sx={{ mr: 1, color: '#2196f3' }} />
                }}
                sx={{ '& .MuiInputBase-input': { color: '#fff' } }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Check-in"
                type="date"
                value={searchRequest.checkIn}
                onChange={(e) => setSearchRequest({ ...searchRequest, checkIn: e.target.value })}
                InputProps={{
                  startAdornment: <CalendarIcon sx={{ mr: 1, color: '#4caf50' }} />
                }}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiInputBase-input': { color: '#fff' } }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Check-out"
                type="date"
                value={searchRequest.checkOut}
                onChange={(e) => setSearchRequest({ ...searchRequest, checkOut: e.target.value })}
                InputProps={{
                  startAdornment: <CalendarIcon sx={{ mr: 1, color: '#ff9800' }} />
                }}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiInputBase-input': { color: '#fff' } }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Guests"
                type="number"
                value={searchRequest.guests}
                onChange={(e) => setSearchRequest({ ...searchRequest, guests: parseInt(e.target.value) || 1 })}
                InputProps={{
                  startAdornment: <PeopleIcon sx={{ mr: 1, color: '#9c27b0' }} />
                }}
                sx={{ '& .MuiInputBase-input': { color: '#fff' } }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Max Price"
                type="number"
                value={searchRequest.maxPrice}
                onChange={(e) => setSearchRequest({ ...searchRequest, maxPrice: parseInt(e.target.value) || 500 })}
                InputProps={{
                  startAdornment: <Typography variant="body2" sx={{ mr: 1, color: '#4caf50' }}>$</Typography>
                }}
                sx={{ '& .MuiInputBase-input': { color: '#fff' } }}
              />
            </Grid>
            <Grid item xs={12} md={1}>
              <Button
                fullWidth
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
                onClick={handleSearch}
                disabled={loading}
                sx={{ backgroundColor: '#4caf50', height: '56px' }}
              >
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search Results */}
      <Typography variant="h6" gutterBottom sx={{ color: '#fff', mb: 2 }}>
        Search Results ({hotels.length} hotels found)
      </Typography>

      <Grid container spacing={3}>
        {hotels.map((hotel) => (
          <Grid item xs={12} md={6} lg={4} key={hotel.id}>
            <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333', height: '100%' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Typography variant="h6" sx={{ color: '#fff' }}>
                    {hotel.name}
                  </Typography>
                  <Chip
                    label={hotel.provider.toUpperCase()}
                    color={getProviderColor(hotel.provider) as any}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" sx={{ color: '#ccc', mb: 2 }}>
                  {hotel.description}
                </Typography>

                <Box display="flex" alignItems="center" mb={1}>
                  <LocationIcon sx={{ color: '#2196f3', mr: 1, fontSize: 16 }} />
                  <Typography variant="body2" sx={{ color: '#fff' }}>
                    {hotel.address.city}, {hotel.address.state}
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center" mb={2}>
                  <Rating value={hotel.rating} precision={0.1} size="small" readOnly />
                  <Typography variant="body2" sx={{ color: '#ccc', ml: 1 }}>
                    {hotel.rating}/5
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" sx={{ color: '#4caf50' }}>
                    ${hotel.pricePerNight}/night
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    Max {hotel.maxGuests} guests
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#fff', mb: 1 }}>
                    Amenities:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {hotel.amenities.slice(0, 4).map((amenity) => (
                      <Chip
                        key={amenity}
                        icon={getAmenityIcon(amenity)}
                        label={amenity}
                        size="small"
                        variant="outlined"
                        sx={{ color: '#2196f3', borderColor: '#2196f3' }}
                      />
                    ))}
                    {hotel.amenities.length > 4 && (
                      <Chip
                        label={`+${hotel.amenities.length - 4} more`}
                        size="small"
                        variant="outlined"
                        sx={{ color: '#ccc', borderColor: '#ccc' }}
                      />
                    )}
                  </Box>
                </Box>

                <Divider sx={{ my: 2, bgcolor: '#333' }} />

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    Check-in: {hotel.checkInTime} | Check-out: {hotel.checkOutTime}
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<BookIcon />}
                    onClick={() => handleBookHotel(hotel)}
                    sx={{ backgroundColor: '#4caf50' }}
                  >
                    Book Now
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {hotels.length === 0 && !loading && (
        <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: '#fff', textAlign: 'center', mb: 2 }}>
              No hotels found
            </Typography>
            <Typography variant="body2" sx={{ color: '#ccc', textAlign: 'center' }}>
              Try adjusting your search criteria or expanding your price range.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Booking Dialog */}
      <Dialog open={openBookingDialog} onClose={() => setOpenBookingDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Book Hotel - {selectedHotel?.name}
        </DialogTitle>
        <DialogContent>
          {selectedHotel && (
            <Box>
              <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                {selectedHotel.name}
              </Typography>
              <Typography variant="body2" sx={{ color: '#ccc', mb: 3 }}>
                {selectedHotel.address.street}, {selectedHotel.address.city}, {selectedHotel.address.state}
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={bookingRequest.guestInfo?.firstName || ''}
                    onChange={(e) => setBookingRequest({
                      ...bookingRequest,
                      guestInfo: { ...bookingRequest.guestInfo!, firstName: e.target.value }
                    })}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={bookingRequest.guestInfo?.lastName || ''}
                    onChange={(e) => setBookingRequest({
                      ...bookingRequest,
                      guestInfo: { ...bookingRequest.guestInfo!, lastName: e.target.value }
                    })}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={bookingRequest.guestInfo?.email || ''}
                    onChange={(e) => setBookingRequest({
                      ...bookingRequest,
                      guestInfo: { ...bookingRequest.guestInfo!, email: e.target.value }
                    })}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={bookingRequest.guestInfo?.phone || ''}
                    onChange={(e) => setBookingRequest({
                      ...bookingRequest,
                      guestInfo: { ...bookingRequest.guestInfo!, phone: e.target.value }
                    })}
                    sx={{ mb: 2 }}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                Payment Information
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={8}>
                  <TextField
                    fullWidth
                    label="Card Number"
                    value={bookingRequest.paymentInfo?.cardNumber || ''}
                    onChange={(e) => setBookingRequest({
                      ...bookingRequest,
                      paymentInfo: { ...bookingRequest.paymentInfo!, cardNumber: e.target.value }
                    })}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={2}>
                  <TextField
                    fullWidth
                    label="Expiry"
                    placeholder="MM/YY"
                    value={bookingRequest.paymentInfo?.expiryDate || ''}
                    onChange={(e) => setBookingRequest({
                      ...bookingRequest,
                      paymentInfo: { ...bookingRequest.paymentInfo!, expiryDate: e.target.value }
                    })}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={2}>
                  <TextField
                    fullWidth
                    label="CVV"
                    value={bookingRequest.paymentInfo?.cvv || ''}
                    onChange={(e) => setBookingRequest({
                      ...bookingRequest,
                      paymentInfo: { ...bookingRequest.paymentInfo!, cvv: e.target.value }
                    })}
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
            onClick={handleConfirmBooking}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <BookIcon />}
          >
            {loading ? 'Booking...' : 'Confirm Booking'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HotelSearchPage;
