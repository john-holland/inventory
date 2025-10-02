import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { TravelCostService, Address, VehicleInfo } from '../services/TravelCostService';

export const TravelCostCalculator: React.FC = () => {
  const [origin, setOrigin] = useState<Address>({
    street: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94102',
    country: 'USA',
    latitude: 37.7749,
    longitude: -122.4194
  });

  const [destination, setDestination] = useState<Address>({
    street: '456 Oak Ave',
    city: 'Los Angeles',
    state: 'CA',
    zipCode: '90210',
    country: 'USA',
    latitude: 34.0522,
    longitude: -118.2437
  });

  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo>({
    mpg: 25,
    fuelType: 'gasoline'
  });

  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const travelCostService = TravelCostService.getInstance();

  const calculateTravelCost = () => {
    try {
      setLoading(true);
      const breakdown = travelCostService.calculateTravelCost(origin, destination, vehicleInfo);
      setResults(breakdown);
      setLoading(false);
    } catch (error) {
      console.error('Failed to calculate travel cost:', error);
      setLoading(false);
    }
  };

  const getComparison = () => {
    try {
      return travelCostService.getTravelCostComparison(origin, destination);
    } catch (error) {
      console.error('Failed to get comparison:', error);
      return null;
    }
  };

  const comparison = getComparison();

  return (
    <Box sx={{ p: 3, backgroundColor: '#121212', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#fff', mb: 3 }}>
        🚗 Travel Cost Calculator
      </Typography>

      <Typography variant="body1" sx={{ color: '#ccc', mb: 3 }}>
        Calculate actual travel costs based on gas prices, MPG, and distance for cabin trips.
      </Typography>

      <Grid container spacing={3}>
        {/* Input Form */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                Trip Details
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ color: '#2196f3', mb: 1 }}>
                    Origin Address
                  </Typography>
                  <TextField
                    fullWidth
                    label="Street"
                    value={origin.street}
                    onChange={(e) => setOrigin({ ...origin, street: e.target.value })}
                    sx={{ mb: 1 }}
                  />
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="City"
                        value={origin.city}
                        onChange={(e) => setOrigin({ ...origin, city: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <TextField
                        fullWidth
                        label="State"
                        value={origin.state}
                        onChange={(e) => setOrigin({ ...origin, state: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <TextField
                        fullWidth
                        label="ZIP"
                        value={origin.zipCode}
                        onChange={(e) => setOrigin({ ...origin, zipCode: e.target.value })}
                      />
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ color: '#4caf50', mb: 1 }}>
                    Destination Address
                  </Typography>
                  <TextField
                    fullWidth
                    label="Street"
                    value={destination.street}
                    onChange={(e) => setDestination({ ...destination, street: e.target.value })}
                    sx={{ mb: 1 }}
                  />
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="City"
                        value={destination.city}
                        onChange={(e) => setDestination({ ...destination, city: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <TextField
                        fullWidth
                        label="State"
                        value={destination.state}
                        onChange={(e) => setDestination({ ...destination, state: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <TextField
                        fullWidth
                        label="ZIP"
                        value={destination.zipCode}
                        onChange={(e) => setDestination({ ...destination, zipCode: e.target.value })}
                      />
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ color: '#ff9800', mb: 1 }}>
                    Vehicle Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="MPG"
                        type="number"
                        value={vehicleInfo.mpg}
                        onChange={(e) => setVehicleInfo({ ...vehicleInfo, mpg: parseInt(e.target.value) || 25 })}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FormControl fullWidth>
                        <InputLabel>Fuel Type</InputLabel>
                        <Select
                          value={vehicleInfo.fuelType}
                          onChange={(e) => setVehicleInfo({ ...vehicleInfo, fuelType: e.target.value as any })}
                        >
                          <MenuItem value="gasoline">Gasoline</MenuItem>
                          <MenuItem value="diesel">Diesel</MenuItem>
                          <MenuItem value="electric">Electric</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={calculateTravelCost}
                    disabled={loading}
                    sx={{ backgroundColor: '#4caf50', height: '48px' }}
                  >
                    {loading ? 'Calculating...' : 'Calculate Travel Cost'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Results */}
        <Grid item xs={12} md={6}>
          {results && (
            <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                  Travel Cost Breakdown
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                    Distance: {results.distance} miles
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                    Gas Price: ${results.gasPrice}/gallon
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                    Vehicle MPG: {results.mpg}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2, bgcolor: '#333' }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#4caf50' }}>
                    One-way Fuel Cost: ${results.fuelCost}
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#2196f3' }}>
                    Round Trip Cost: ${results.roundTripCost}
                  </Typography>
                  <Typography variant="h5" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                    Travel Hold: ${results.holdAmount}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    (2x round trip cost)
                  </Typography>
                </Box>

                <Alert severity="info" sx={{ mt: 2 }}>
                  This hold amount covers the full round trip travel cost and is used as the primary hold for item takeouts.
                </Alert>
              </CardContent>
            </Card>
          )}

          {comparison && (
            <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333', mt: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                  Vehicle Comparison
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                    Gasoline Vehicle (25 MPG): ${comparison.gasoline.holdAmount}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                    Diesel Vehicle (30 MPG): ${comparison.diesel.holdAmount}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                    Electric Vehicle: ${comparison.electric.cost * 4} (4x one-way cost)
                  </Typography>
                </Box>

                <Divider sx={{ my: 2, bgcolor: '#333' }} />

                <Box display="flex" flexWrap="wrap" gap={1}>
                  <Chip
                    label={`Gas: $${comparison.gasoline.holdAmount}`}
                    color="primary"
                    size="small"
                  />
                  <Chip
                    label={`Diesel: $${comparison.diesel.holdAmount}`}
                    color="secondary"
                    size="small"
                  />
                  <Chip
                    label={`Electric: $${(comparison.electric.cost * 4).toFixed(2)}`}
                    color="success"
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333', mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
            How It Works
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
            1. <strong>Distance Calculation:</strong> Uses "as the crow flies" distance between origin and destination
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
            2. <strong>Gas Price Lookup:</strong> Fetches current gas prices based on origin location
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
            3. <strong>Fuel Cost:</strong> Calculates gallons needed (distance ÷ MPG) × gas price
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
            4. <strong>Round Trip:</strong> Multiplies one-way cost by 2 for round trip
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc' }}>
            5. <strong>Hold Amount:</strong> Multiplies round trip cost by 2 (4x one-way total)
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TravelCostCalculator;
