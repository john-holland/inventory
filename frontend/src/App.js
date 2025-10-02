import React, { useState } from 'react';
import { Box, Container, ThemeProvider, createTheme } from '@mui/material';

// Import our new components
import { SharedHeader } from './components/SharedHeader';
import { DarkDashboard } from './components/DarkDashboard';
import { SearchPage } from './components/SearchPage';
import { MapPage } from './components/MapPage';
import { InventoryList } from './components/InventoryList';
import { CabinPage } from './components/CabinPage';

// Create dark theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4caf50',
    },
    secondary: {
      main: '#2196f3',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#fff',
      secondary: '#ccc',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e1e1e',
          border: '1px solid #333',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e1e1e',
        },
      },
    },
  },
});

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tabpanel-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 0 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function App() {
  const [tabValue, setTabValue] = useState(0);
  const [charityFeaturesEnabled, setCharityFeaturesEnabled] = useState(true);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ flexGrow: 1, backgroundColor: '#121212', minHeight: '100vh' }}>
        {/* Shared Header */}
        <SharedHeader
          currentTab={tabValue}
          onTabChange={handleTabChange}
          charityFeaturesEnabled={charityFeaturesEnabled}
        />

        {/* Tab Content */}
        <TabPanel value={tabValue} index={0}>
          <DarkDashboard />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <SearchPage />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <MapPage />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <InventoryList />
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <CabinPage />
        </TabPanel>
      </Box>
    </ThemeProvider>
  );
}

export default App; 