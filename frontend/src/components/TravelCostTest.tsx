import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Card, CardContent, Alert } from '@mui/material';
import { TravelCostService } from '../services/TravelCostService';

export const TravelCostTest: React.FC = () => {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const travelCostService = TravelCostService.getInstance();

  const testTravelCostCalculation = async () => {
    try {
      setLoading(true);
      setError(null);

      // Test with San Francisco to Los Angeles
      const origin = {
        street: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        country: 'USA',
        latitude: 37.7749,
        longitude: -122.4194
      };

      const destination = {
        street: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90210',
        country: 'USA',
        latitude: 34.0522,
        longitude: -118.2437
      };

      const vehicleInfo = {
        mpg: 25,
        fuelType: 'gasoline' as const
      };

      const breakdown = travelCostService.calculateTravelCost(origin, destination, vehicleInfo);
      setResults(breakdown);
      setLoading(false);

    } catch (error) {
      setError('Failed to calculate travel cost');
      setLoading(false);
    }
  };

  const testComparison = () => {
    try {
      const origin = {
        street: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        country: 'USA',
        latitude: 37.7749,
        longitude: -122.4194
      };

      const destination = {
        street: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90210',
        country: 'USA',
        latitude: 34.0522,
        longitude: -118.2437
      };

      const comparison = travelCostService.getTravelCostComparison(origin, destination);
      console.log('Vehicle Comparison:', comparison);
      return comparison;
    } catch (error) {
      console.error('Failed to get comparison:', error);
      return null;
    }
  };

  useEffect(() => {
    testTravelCostCalculation();
  }, []);

  return (
    <Box sx={{ p: 3, backgroundColor: '#121212', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#fff', mb: 3 }}>
        🚗 Travel Cost Calculation Test
      </Typography>

      <Button
        variant="contained"
        onClick={testTravelCostCalculation}
        disabled={loading}
        sx={{ mb: 3, backgroundColor: '#4caf50' }}
      >
        {loading ? 'Calculating...' : 'Test Travel Cost'}
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {results && (
        <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
              Travel Cost Breakdown
            </Typography>

            <Typography variant="body1" sx={{ color: '#ccc', mb: 1 }}>
              <strong>Distance:</strong> {results.distance} miles
            </Typography>
            <Typography variant="body1" sx={{ color: '#ccc', mb: 1 }}>
              <strong>Gas Price:</strong> ${results.gasPrice}/gallon
            </Typography>
            <Typography variant="body1" sx={{ color: '#ccc', mb: 1 }}>
              <strong>Vehicle MPG:</strong> {results.mpg}
            </Typography>
            <Typography variant="body1" sx={{ color: '#ccc', mb: 1 }}>
              <strong>One-way Fuel Cost:</strong> ${results.fuelCost}
            </Typography>
            <Typography variant="body1" sx={{ color: '#ccc', mb: 1 }}>
              <strong>Round Trip Cost:</strong> ${results.roundTripCost}
            </Typography>
            <Typography variant="h5" sx={{ color: '#4caf50', mt: 2 }}>
              <strong>Travel Hold Amount:</strong> ${results.holdAmount}
            </Typography>
            <Typography variant="body2" sx={{ color: '#ccc', mt: 1 }}>
              (2x round trip cost - this is the hold amount for cabin items)
            </Typography>
          </CardContent>
        </Card>
      )}

      <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333', mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
            How the Calculation Works
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
            1. <strong>Distance:</strong> Calculated using "as the crow flies" formula between coordinates
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
            2. <strong>Gas Price:</strong> Looked up based on origin city/state (currently using mock data)
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
            3. <strong>Fuel Cost:</strong> (Distance ÷ MPG) × Gas Price
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
            4. <strong>Round Trip:</strong> One-way cost × 2
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc' }}>
            5. <strong>Hold Amount:</strong> Round trip cost × 2 (4x one-way total)
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TravelCostTest;
