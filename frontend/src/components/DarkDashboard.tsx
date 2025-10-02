import React from 'react';
import { Box, AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemIcon, ListItemText, CssBaseline, Paper, Grid, Card, CardContent } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import MapIcon from '@mui/icons-material/Map';
import SettingsIcon from '@mui/icons-material/Settings';

const drawerWidth = 220;

export const DarkDashboard: React.FC = () => {
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
            { text: 'Dashboard', icon: <DashboardIcon /> },
            { text: 'Inventory', icon: <InventoryIcon /> },
            { text: 'Map', icon: <MapIcon /> },
            { text: 'Settings', icon: <SettingsIcon /> },
          ].map((item) => (
            <ListItem button key={item.text}>
              <ListItemIcon sx={{ color: '#4caf50' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Drawer>
      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, ml: `${drawerWidth}px` }}>
        <AppBar position="fixed" sx={{ zIndex: 1201, bgcolor: '#222', boxShadow: 'none', left: drawerWidth }}>
          <Toolbar>
            <Typography variant="h5" sx={{ color: '#fff' }}>
              Dashboard
            </Typography>
          </Toolbar>
        </AppBar>
        <Toolbar />
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