import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Box,
  Chip,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Search as SearchIcon,
  Map as MapIcon,
  Dashboard as DashboardIcon,
  Menu as MenuIcon
} from '@mui/icons-material';

interface SharedHeaderProps {
  currentTab: number;
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  charityFeaturesEnabled: boolean;
  onMenuClick?: () => void;
}

export const SharedHeader: React.FC<SharedHeaderProps> = ({
  currentTab,
  onTabChange,
  charityFeaturesEnabled,
  onMenuClick
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const tabs = [
    { label: 'Dashboard', icon: <DashboardIcon />, index: 0 },
    { label: 'Search', icon: <SearchIcon />, index: 1 },
    { label: 'Map', icon: <MapIcon />, index: 2 },
    { label: 'Inventory', icon: <InventoryIcon />, index: 3 },
    { label: 'Cabin', icon: <MenuIcon />, index: 4 }
  ];

  return (
    <AppBar 
      position="static" 
      sx={{ 
        backgroundColor: '#1a1a1a',
        borderBottom: '1px solid #333',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }}
    >
      <Toolbar sx={{ minHeight: '64px' }}>
        {isMobile && onMenuClick && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={onMenuClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            color: '#fff',
            fontWeight: 600,
            fontSize: { xs: '1rem', md: '1.25rem' }
          }}
        >
          Inventory Network
        </Typography>
        
        <Chip 
          label={charityFeaturesEnabled ? "Charity Enabled" : "Charity Disabled"} 
          color={charityFeaturesEnabled ? "success" : "default"}
          size="small"
          sx={{ 
            backgroundColor: charityFeaturesEnabled ? '#2e7d32' : '#666',
            color: '#fff',
            mr: 2
          }}
        />
      </Toolbar>
      
      <Tabs
        value={currentTab}
        onChange={onTabChange}
        aria-label="dashboard navigation tabs"
        variant={isMobile ? "scrollable" : "fullWidth"}
        scrollButtons="auto"
        sx={{
          backgroundColor: '#1a1a1a',
          borderTop: '1px solid #333',
          '& .MuiTab-root': {
            color: '#ccc',
            textTransform: 'none',
            fontWeight: 500,
            minHeight: '48px',
            '&.Mui-selected': {
              color: '#4caf50',
              backgroundColor: 'rgba(76, 175, 80, 0.1)'
            },
            '&:hover': {
              color: '#4caf50',
              backgroundColor: 'rgba(76, 175, 80, 0.05)'
            }
          },
          '& .MuiTabs-indicator': {
            backgroundColor: '#4caf50',
            height: '3px'
          }
        }}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.index}
            icon={tab.icon}
            label={tab.label}
            iconPosition="start"
            sx={{ 
              minWidth: isMobile ? 'auto' : '120px',
              fontSize: { xs: '0.75rem', md: '0.875rem' }
            }}
          />
        ))}
      </Tabs>
    </AppBar>
  );
}; 