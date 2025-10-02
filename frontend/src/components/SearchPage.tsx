import React, { useState } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
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
  ListItemSecondaryAction,
  Divider,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon,
  LocationOn as LocationIcon,
  Category as CategoryIcon,
  PriceCheck as PriceIcon,
  Clear as ClearIcon
} from '@mui/icons-material';

interface SearchResult {
  id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  distance: number;
  price: number;
  rating: number;
  available: boolean;
  owner: string;
  tags: string[];
}

const mockSearchResults: SearchResult[] = [
  {
    id: '1',
    name: 'Professional Camera Lens',
    description: 'Canon EF 24-70mm f/2.8L II USM lens in excellent condition',
    category: 'Electronics',
    location: 'San Francisco, CA',
    distance: 2.3,
    price: 15,
    rating: 4.8,
    available: true,
    owner: '0x1234...5678',
    tags: ['photography', 'professional', 'camera']
  },
  {
    id: '2',
    name: 'Mountain Bike',
    description: 'Trek Marlin 7 mountain bike, perfect for trails',
    category: 'Sports',
    location: 'Oakland, CA',
    distance: 5.1,
    price: 8,
    rating: 4.6,
    available: true,
    owner: '0x8765...4321',
    tags: ['cycling', 'outdoor', 'trail']
  },
  {
    id: '3',
    name: 'Power Tools Set',
    description: 'Complete DeWalt power tools set with carrying case',
    category: 'Tools',
    location: 'Berkeley, CA',
    distance: 3.7,
    price: 12,
    rating: 4.9,
    available: false,
    owner: '0x9876...5432',
    tags: ['construction', 'professional', 'home-improvement']
  }
];

export const SearchPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>(mockSearchResults);
  const [filters, setFilters] = useState({
    category: 'all',
    maxDistance: 10,
    maxPrice: 50,
    availableOnly: true,
    minRating: 0
  });

  const handleSearch = () => {
    // Filter results based on search query and filters
    const filtered = mockSearchResults.filter(item => {
      const matchesQuery = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = filters.category === 'all' || item.category === filters.category;
      const matchesDistance = item.distance <= filters.maxDistance;
      const matchesPrice = item.price <= filters.maxPrice;
      const matchesAvailability = !filters.availableOnly || item.available;
      const matchesRating = item.rating >= filters.minRating;

      return matchesQuery && matchesCategory && matchesDistance && matchesPrice && matchesAvailability && matchesRating;
    });

    setSearchResults(filtered);
  };

  const clearFilters = () => {
    setFilters({
      category: 'all',
      maxDistance: 10,
      maxPrice: 50,
      availableOnly: true,
      minRating: 0
    });
    setSearchResults(mockSearchResults);
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#121212', minHeight: '100vh', color: '#fff' }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#fff', mb: 3 }}>
        Search Inventory
      </Typography>

      {/* Search Bar */}
      <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333', mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                placeholder="Search for items, categories, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#666' }} />
                    </InputAdornment>
                  ),
                  sx: {
                    backgroundColor: '#2a2a2a',
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#444',
                      },
                      '&:hover fieldset': {
                        borderColor: '#666',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#4caf50',
                      },
                    },
                    '& .MuiInputBase-input': {
                      color: '#fff',
                    },
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="contained"
                onClick={handleSearch}
                sx={{
                  backgroundColor: '#4caf50',
                  '&:hover': { backgroundColor: '#45a049' },
                  width: '100%'
                }}
              >
                Search
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Filters Sidebar */}
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FilterIcon sx={{ mr: 1, color: '#4caf50' }} />
                <Typography variant="h6" sx={{ color: '#fff' }}>
                  Filters
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={clearFilters}
                  sx={{ ml: 'auto', color: '#666' }}
                >
                  <ClearIcon />
                </IconButton>
              </Box>

              <Accordion sx={{ backgroundColor: 'transparent', color: '#fff', mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#fff' }} />}>
                  <CategoryIcon sx={{ mr: 1, color: '#4caf50' }} />
                  <Typography>Category</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <FormControl fullWidth>
                    <Select
                      value={filters.category}
                      onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                      sx={{
                        color: '#fff',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#444',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#666',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#4caf50',
                        },
                      }}
                    >
                      <MenuItem value="all">All Categories</MenuItem>
                      <MenuItem value="Electronics">Electronics</MenuItem>
                      <MenuItem value="Sports">Sports</MenuItem>
                      <MenuItem value="Tools">Tools</MenuItem>
                      <MenuItem value="Books">Books</MenuItem>
                      <MenuItem value="Clothing">Clothing</MenuItem>
                    </Select>
                  </FormControl>
                </AccordionDetails>
              </Accordion>

              <Accordion sx={{ backgroundColor: 'transparent', color: '#fff', mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#fff' }} />}>
                  <LocationIcon sx={{ mr: 1, color: '#4caf50' }} />
                  <Typography>Distance</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography gutterBottom sx={{ color: '#ccc' }}>
                    Max Distance: {filters.maxDistance} miles
                  </Typography>
                  <Slider
                    value={filters.maxDistance}
                    onChange={(e, value) => setFilters({ ...filters, maxDistance: value as number })}
                    min={1}
                    max={50}
                    sx={{
                      color: '#4caf50',
                      '& .MuiSlider-thumb': {
                        backgroundColor: '#4caf50',
                      },
                    }}
                  />
                </AccordionDetails>
              </Accordion>

              <Accordion sx={{ backgroundColor: 'transparent', color: '#fff', mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#fff' }} />}>
                  <PriceIcon sx={{ mr: 1, color: '#4caf50' }} />
                  <Typography>Price</Typography>
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
                      '& .MuiSlider-thumb': {
                        backgroundColor: '#4caf50',
                      },
                    }}
                  />
                </AccordionDetails>
              </Accordion>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.availableOnly}
                    onChange={(e) => setFilters({ ...filters, availableOnly: e.target.checked })}
                    sx={{
                      color: '#4caf50',
                      '&.Mui-checked': {
                        color: '#4caf50',
                      },
                    }}
                  />
                }
                label="Available Only"
                sx={{ color: '#fff', mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Search Results */}
        <Grid item xs={12} md={9}>
          <Typography variant="h6" gutterBottom sx={{ color: '#fff', mb: 2 }}>
            Results ({searchResults.length})
          </Typography>

          {searchResults.length === 0 ? (
            <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
              <CardContent>
                <Typography sx={{ color: '#ccc', textAlign: 'center' }}>
                  No items found matching your search criteria.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <List sx={{ p: 0 }}>
              {searchResults.map((item, index) => (
                <React.Fragment key={item.id}>
                  <ListItem
                    component={Card}
                    sx={{
                      backgroundColor: '#1e1e1e',
                      border: '1px solid #333',
                      mb: 2,
                      '&:hover': {
                        backgroundColor: '#252525',
                        borderColor: '#4caf50',
                      },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="h6" sx={{ color: '#fff', flexGrow: 1 }}>
                            {item.name}
                          </Typography>
                          <Chip
                            label={item.available ? 'Available' : 'Unavailable'}
                            color={item.available ? 'success' : 'default'}
                            size="small"
                            sx={{
                              backgroundColor: item.available ? '#2e7d32' : '#666',
                              color: '#fff',
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                            {item.description}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                              icon={<LocationIcon />}
                              label={`${item.distance} miles`}
                              size="small"
                              sx={{ backgroundColor: '#333', color: '#ccc' }}
                            />
                            <Chip
                              icon={<PriceIcon />}
                              label={`$${item.price}/day`}
                              size="small"
                              sx={{ backgroundColor: '#333', color: '#ccc' }}
                            />
                            <Chip
                              label={`★ ${item.rating}`}
                              size="small"
                              sx={{ backgroundColor: '#333', color: '#ccc' }}
                            />
                            {item.tags.map((tag) => (
                              <Chip
                                key={tag}
                                label={tag}
                                size="small"
                                sx={{ backgroundColor: '#2a2a2a', color: '#ccc' }}
                              />
                            ))}
                          </Box>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Button
                        variant="outlined"
                        disabled={!item.available}
                        sx={{
                          borderColor: '#4caf50',
                          color: '#4caf50',
                          '&:hover': {
                            borderColor: '#45a049',
                            backgroundColor: 'rgba(76, 175, 80, 0.1)',
                          },
                          '&:disabled': {
                            borderColor: '#666',
                            color: '#666',
                          },
                        }}
                      >
                        {item.available ? 'Request Item' : 'Unavailable'}
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}; 