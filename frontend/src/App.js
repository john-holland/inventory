import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom';
import { Box, Container, ThemeProvider, createTheme } from '@mui/material';

// Import our new components
import { SharedHeader } from './components/SharedHeader';
import { DarkDashboard } from './components/DarkDashboard';
import { SearchPage } from './components/SearchPage';
import { MapPage } from './components/MapPage';
import { InventoryList } from './components/InventoryList';
import { CabinPage } from './components/CabinPage';
import { PersistentChatWindow } from './components/PersistentChatWindow';
import { ItemDetailsPage } from './components/ItemDetailsPage';
import { SettingsPage } from './components/SettingsPage';

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

function App() {
  const [charityFeaturesEnabled, setCharityFeaturesEnabled] = useState(true);

  return (
    <ThemeProvider theme={darkTheme}>
      <BrowserRouter>
        <AppContent charityFeaturesEnabled={charityFeaturesEnabled} />
      </BrowserRouter>
    </ThemeProvider>
  );
}

function AppContent({ charityFeaturesEnabled }) {
  const [searchParams] = useSearchParams();

  return (
    <Box sx={{ flexGrow: 1, backgroundColor: '#121212', minHeight: '100vh' }}>
      {/* Shared Header */}
      <SharedHeader charityFeaturesEnabled={charityFeaturesEnabled} />

      {/* Routes */}
      <Routes>
        <Route path="/" element={<DarkDashboard />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/inventory" element={<InventoryList />} />
        <Route path="/cabins" element={<CabinPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/item/:id" element={<ItemDetailsPage />} />
      </Routes>

      {/* Item Modal - shown when ?item=id query param exists */}
      {searchParams.get('item') && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1300,
          }}
        >
          {/* ItemModal component will be added in Phase 7 */}
          <Box sx={{ color: '#fff' }}>Item Modal Placeholder (ID: {searchParams.get('item')})</Box>
        </Box>
      )}

      {/* PersistentChatWindow - Always visible on all pages */}
      <PersistentChatWindow />
    </Box>
  );
}

export default App; 