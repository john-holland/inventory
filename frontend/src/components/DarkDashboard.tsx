import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Toolbar, Typography, Drawer, List, ListItem, ListItemIcon, ListItemText, CssBaseline, Paper, Grid, Card, CardContent } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import MapIcon from '@mui/icons-material/Map';
import SettingsIcon from '@mui/icons-material/Settings';

const drawerWidth = 220;

export const DarkDashboard: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ display: 'flex', bgcolor: '#181818', minHeight: '100vh', color: '#fff' }}>
      <CssBaseline />
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: '#23272b',
            color: '#fff',
            borderRight: '1px solid #333',
            top: '112px', // Offset for SharedHeader (AppBar + Tabs)
            height: 'calc(100vh - 112px)',
          },
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap>
            Inventory
          </Typography>
        </Toolbar>
        <List>
          {[
            { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
            { text: 'Inventory', icon: <InventoryIcon />, path: '/inventory' },
            { text: 'Map', icon: <MapIcon />, path: '/map' },
            { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
          ].map((item) => (
            <ListItem 
              button 
              key={item.text}
              onClick={() => navigate(item.path)}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(76, 175, 80, 0.1)',
                }
              }}
            >
              <ListItemIcon sx={{ color: '#4caf50' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Drawer>
      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, ml: `${drawerWidth}px`, mt: 0 }}>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: '#23272b', color: '#fff', border: '1px solid #333' }}>
              <CardContent>
                <Typography variant="h6">Total Items</Typography>
                <Typography variant="h3" sx={{ color: '#4caf50' }}>128</Typography>
                <Typography variant="body2" sx={{ color: '#aaa' }}>Items in inventory</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: '#23272b', color: '#fff', border: '1px solid #333' }}>
              <CardContent>
                <Typography variant="h6">Active Users</Typography>
                <Typography variant="h3" sx={{ color: '#4caf50' }}>42</Typography>
                <Typography variant="body2" sx={{ color: '#aaa' }}>Users online</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: '#23272b', color: '#fff', border: '1px solid #333' }}>
              <CardContent>
                <Typography variant="h6">Recent Activity</Typography>
                <Typography variant="body2" sx={{ color: '#aaa' }}>- John borrowed a camera<br/>- Alice returned a bike<br/>- Bob added a new tool</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        <Paper sx={{ mt: 4, p: 3, bgcolor: '#23272b', color: '#fff', border: '1px solid #333' }}>
          <Typography variant="h6" gutterBottom>
            Welcome to the Inventory Dashboard
          </Typography>
          <Typography variant="body1" sx={{ color: '#aaa' }}>
            Here you can manage your items, view activity, and monitor usage statistics. Use the sidebar to navigate between different sections.
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default DarkDashboard; 