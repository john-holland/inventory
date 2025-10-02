import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Card, CardContent, Alert } from '@mui/material';
import { HotelService } from '../services/HotelService';
import { CabinService } from '../services/CabinService';

export const HotelIntegrationExample: React.FC = () => {
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hotelService = HotelService.getInstance();
  const cabinService = CabinService.getInstance();

  const testHotelSearch = async () => {
    try {
      setLoading(true);
      setError(null);

      // Test hotel search
      const searchRequest = {
        location: 'San Francisco, CA',
        checkIn: new Date().toISOString().split('T')[0],
        checkOut: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        guests: 2,
        rooms: 1,
        maxPrice: 300
      };

      const results = await hotelService.searchHotels(searchRequest);
      setHotels(results);
      setLoading(false);

    } catch (error) {
      setError('Failed to search hotels');
      setLoading(false);
    }
  };

  const testCabinHotelIntegration = async () => {
    try {
      setLoading(true);
      setError(null);

      // Test cabin hotel integration
      const recommendations = await cabinService.getHotelRecommendations(
        'San Francisco, CA',
        new Date().toISOString().split('T')[0],
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        2
      );

      setHotels(recommendations.recommendations);
      setLoading(false);

    } catch (error) {
      setError('Failed to get hotel recommendations');
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#121212', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#fff', mb: 3 }}>
        🏨 Hotel Integration Test
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          onClick={testHotelSearch}
          disabled={loading}
          sx={{ mr: 2, backgroundColor: '#4caf50' }}
        >
          Test Hotel Search
        </Button>
        <Button
          variant="contained"
          onClick={testCabinHotelIntegration}
          disabled={loading}
          sx={{ backgroundColor: '#2196f3' }}
        >
          Test Cabin Integration
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Loading hotels...
        </Alert>
      )}

      <Typography variant="h6" gutterBottom sx={{ color: '#fff', mb: 2 }}>
        Search Results ({hotels.length} hotels found)
      </Typography>

      {hotels.map((hotel, index) => (
        <Card key={hotel.id || index} sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333', mb: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: '#fff' }}>
              {hotel.name}
            </Typography>
            <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
              {hotel.description}
            </Typography>
            <Typography variant="body2" sx={{ color: '#4caf50' }}>
              ${hotel.pricePerNight}/night | Rating: {hotel.rating}/5
            </Typography>
            <Typography variant="body2" sx={{ color: '#2196f3' }}>
              Provider: {hotel.provider}
            </Typography>
          </CardContent>
        </Card>
      ))}

      {hotels.length === 0 && !loading && (
        <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: '#fff', textAlign: 'center' }}>
              No hotels found
            </Typography>
            <Typography variant="body2" sx={{ color: '#ccc', textAlign: 'center' }}>
              Click the buttons above to test the hotel integration.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default HotelIntegrationExample;
