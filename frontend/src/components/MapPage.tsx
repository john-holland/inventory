import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Grid,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Paper,
  Slider,
  FormControlLabel,
  Checkbox,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  LocationOn as LocationIcon,
  MyLocation as MyLocationIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  PriceCheck as PriceIcon,
  Star as StarIcon,
  Directions as DirectionsIcon
} from '@mui/icons-material';

interface MapItem {
  id: string;
  name: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  distance: number;
  price: number;
  rating: number;
  available: boolean;
  owner: string;
  imageUrl?: string;
  tags: string[];
}

const mockMapItems: MapItem[] = [
  {
    id: '1',
    name: 'Professional Camera Lens',
    description: 'Canon EF 24-70mm f/2.8L II USM lens',
    category: 'Electronics',
    latitude: 37.7749,
    longitude: -122.4194,
    distance: 2.3,
    price: 15,
    rating: 4.8,
    available: true,
    owner: '0x1234...5678',
    imageUrl: 'https://via.placeholder.com/60x60/4caf50/ffffff?text=Camera',
    tags: ['photography', 'professional']
  },
  {
    id: '2',
    name: 'Mountain Bike',
    description: 'Trek Marlin 7 mountain bike',
    category: 'Sports',
    latitude: 37.8044,
    longitude: -122.2711,
    distance: 5.1,
    price: 8,
    rating: 4.6,
    available: true,
    owner: '0x8765...4321',
    imageUrl: 'https://via.placeholder.com/60x60/2196f3/ffffff?text=Bike',
    tags: ['cycling', 'outdoor']
  },
  {
    id: '3',
    name: 'Power Tools Set',
    description: 'Complete DeWalt power tools set',
    category: 'Tools',
    latitude: 37.8716,
    longitude: -122.2727,
    distance: 3.7,
    price: 12,
    rating: 4.9,
    available: false,
    owner: '0x9876...5432',
    imageUrl: 'https://via.placeholder.com/60x60/ff9800/ffffff?text=Tools',
    tags: ['construction', 'professional']
  },
  {
    id: '4',
    name: 'Guitar',
    description: 'Acoustic guitar in excellent condition',
    category: 'Music',
    latitude: 37.7858,
    longitude: -122.4064,
    distance: 1.2,
    price: 6,
    rating: 4.7,
    available: true,
    owner: '0x5432...8765',
    imageUrl: 'https://via.placeholder.com/60x60/9c27b0/ffffff?text=Guitar',
    tags: ['music', 'acoustic']
  }
];

export const MapPage: React.FC = () => {
  const [selectedRadius, setSelectedRadius] = useState(10);
  const [filters, setFilters] = useState({
    showAvailableOnly: true,
    maxPrice: 50,
    minRating: 0,
    categories: ['Electronics', 'Sports', 'Tools', 'Music']
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MapItem | null>(null);

  const filteredItems = mockMapItems.filter(item => {
    const matchesQuery = searchQuery === '' || 
                        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDistance = item.distance <= selectedRadius;
    const matchesAvailability = !filters.showAvailableOnly || item.available;
    const matchesPrice = item.price <= filters.maxPrice;
    const matchesRating = item.rating >= filters.minRating;
    const matchesCategory = filters.categories.includes(item.category);

    return matchesQuery && matchesDistance && matchesAvailability && matchesPrice && matchesRating && matchesCategory;
  });

  return (
    <Box sx={{ p: 3, backgroundColor: '#121212', minHeight: '100vh', color: '#fff' }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#fff', mb: 3 }}>
        Map View
      </Typography>

      <Grid container spacing={3}>
        {/* Map Area */}
        <Grid item xs={12} md={8}>
          <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333', height: '600px' }}>
            <CardContent sx={{ height: '100%', position: 'relative' }}>
              {/* Mock Map Interface */}
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#2a2a2a',
                  borderRadius: 1,
                  position: 'relative',
                  overflow: 'hidden',
                  backgroundImage: 'radial-gradient(circle at 20% 20%, #333 0%, #1a1a1a 100%)'
                }}
              >
                {/* Map Grid Lines */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `
                      linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
                    `,
                    backgroundSize: '50px 50px'
                  }}
                />

                {/* Map Items as Dots */}
                {filteredItems.map((item) => (
                  <Box
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    sx={{
                      position: 'absolute',
                      left: `${(item.longitude + 122.5) * 200}px`,
                      top: `${(37.9 - item.latitude) * 200}px`,
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: item.available ? '#4caf50' : '#666',
                      border: '2px solid #fff',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'scale(1.5)',
                        boxShadow: '0 0 10px rgba(76, 175, 80, 0.5)'
                      },
                      ...(selectedItem?.id === item.id && {
                        transform: 'scale(1.5)',
                        boxShadow: '0 0 15px rgba(76, 175, 80, 0.8)'
                      })
                    }}
                  />
                ))}

                {/* Map Controls */}
                <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
                  <Button
                    variant="contained"
                    startIcon={<MyLocationIcon />}
                    size="small"
                    sx={{
                      backgroundColor: '#4caf50',
                      '&:hover': { backgroundColor: '#45a049' }
                    }}
                  >
                    My Location
                  </Button>
                </Box>

                {/* Map Legend */}
                <Box sx={{ position: 'absolute', bottom: 10, left: 10 }}>
                  <Paper sx={{ backgroundColor: 'rgba(30, 30, 30, 0.9)', p: 1 }}>
                    <Typography variant="caption" sx={{ color: '#ccc', display: 'block' }}>
                      Available: <Box component="span" sx={{ color: '#4caf50' }}>●</Box>
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#ccc', display: 'block' }}>
                      Unavailable: <Box component="span" sx={{ color: '#666' }}>●</Box>
                    </Typography>
                  </Paper>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Search */}
          <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333', mb: 3 }}>
            <CardContent>
              <TextField
                fullWidth
                placeholder="Search items on map..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#666' }} />
                    </InputAdornment>
                  ),
                  sx: {
                    backgroundColor: '#2a2a2a',
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#444' },
                      '&:hover fieldset': { borderColor: '#666' },
                      '&.Mui-focused fieldset': { borderColor: '#4caf50' },
                    },
                    '& .MuiInputBase-input': { color: '#fff' },
                  }
                }}
              />
            </CardContent>
          </Card>

          {/* Filters */}
          <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333', mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FilterIcon sx={{ mr: 1, color: '#4caf50' }} />
                <Typography variant="h6" sx={{ color: '#fff' }}>
                  Map Filters
                </Typography>
              </Box>

              <Accordion sx={{ backgroundColor: 'transparent', color: '#fff', mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#fff' }} />}>
                  <LocationIcon sx={{ mr: 1, color: '#4caf50' }} />
                  <Typography>Search Radius</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography gutterBottom sx={{ color: '#ccc' }}>
                    Radius: {selectedRadius} miles
                  </Typography>
                  <Slider
                    value={selectedRadius}
                    onChange={(e, value) => setSelectedRadius(value as number)}
                    min={1}
                    max={25}
                    sx={{
                      color: '#4caf50',
                      '& .MuiSlider-thumb': { backgroundColor: '#4caf50' },
                    }}
                  />
                </AccordionDetails>
              </Accordion>

              <Accordion sx={{ backgroundColor: 'transparent', color: '#fff', mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#fff' }} />}>
                  <PriceIcon sx={{ mr: 1, color: '#4caf50' }} />
                  <Typography>Price Range</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography gutterBottom sx={{ color: '#ccc' }}>
                    Max Price: ${filters.maxPrice}
                  </Typography>
                  <Slider
                    value={filters.maxPrice}
                    onChange={(e, value) => setFilters({ ...filters, maxPrice: value as number })}
                    min={1}
                    max={100}
                    sx={{
                      color: '#4caf50',
                      '& .MuiSlider-thumb': { backgroundColor: '#4caf50' },
                    }}
                  />
                </AccordionDetails>
              </Accordion>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.showAvailableOnly}
                    onChange={(e) => setFilters({ ...filters, showAvailableOnly: e.target.checked })}
                    sx={{
                      color: '#4caf50',
                      '&.Mui-checked': { color: '#4caf50' },
                    }}
                  />
                }
                label="Show Available Only"
                sx={{ color: '#fff' }}
              />
            </CardContent>
          </Card>

          {/* Selected Item Details */}
          {selectedItem && (
            <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333', mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                  Selected Item
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    src={selectedItem.imageUrl}
                    sx={{ width: 60, height: 60, mr: 2 }}
                  >
                    {selectedItem.name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ color: '#fff' }}>
                      {selectedItem.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                      {selectedItem.distance} miles away
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ color: '#ccc', mb: 2 }}>
                  {selectedItem.description}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label={`$${selectedItem.price}/day`}
                    size="small"
                    sx={{ backgroundColor: '#333', color: '#ccc' }}
                  />
                  <Chip
                    icon={<StarIcon />}
                    label={selectedItem.rating}
                    size="small"
                    sx={{ backgroundColor: '#333', color: '#ccc' }}
                  />
                  <Chip
                    label={selectedItem.available ? 'Available' : 'Unavailable'}
                    color={selectedItem.available ? 'success' : 'default'}
                    size="small"
                    sx={{
                      backgroundColor: selectedItem.available ? '#2e7d32' : '#666',
                      color: '#fff',
                    }}
                  />
                </Box>
                <Button
                  variant="contained"
                  startIcon={<DirectionsIcon />}
                  fullWidth
                  disabled={!selectedItem.available}
                  sx={{
                    backgroundColor: '#4caf50',
                    '&:hover': { backgroundColor: '#45a049' },
                    '&:disabled': { backgroundColor: '#666' }
                  }}
                >
                  Get Directions
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Nearby Items List */}
          <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                Nearby Items ({filteredItems.length})
              </Typography>
              <List sx={{ p: 0 }}>
                {filteredItems.slice(0, 5).map((item) => (
                  <ListItem
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: 1,
                      mb: 1,
                      backgroundColor: selectedItem?.id === item.id ? '#252525' : 'transparent',
                      '&:hover': { backgroundColor: '#252525' }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar src={item.imageUrl} sx={{ width: 40, height: 40 }}>
                        {item.name.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ color: '#fff' }}>
                          {item.name}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" sx={{ color: '#ccc' }}>
                          {item.distance} miles • ${item.price}/day
                        </Typography>
                      }
                    />
                    <Chip
                      label={item.available ? 'Available' : 'Unavailable'}
                      size="small"
                      sx={{
                        backgroundColor: item.available ? '#2e7d32' : '#666',
                        color: '#fff',
                        fontSize: '0.7rem'
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}; 