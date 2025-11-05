/**
 * Settings Page
 * 
 * Main settings container with multiple tabs:
 * - Profile Settings
 * - Partner Dashboard (dropshipping funds)
 * - Preferences
 * - Account
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent
} from '@mui/material';
import { PartnerDashboard } from './PartnerDashboard';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export const SettingsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#121212', minHeight: '100vh', color: '#fff' }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#fff', mb: 3 }}>
        Settings
      </Typography>

      <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
        <Box sx={{ borderBottom: 1, borderColor: '#333' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                color: '#ccc',
                textTransform: 'none',
                '&.Mui-selected': {
                  color: '#4caf50'
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#4caf50'
              }
            }}
          >
            <Tab label="Profile Settings" />
            <Tab label="Partner Dashboard" />
            <Tab label="Preferences" />
            <Tab label="Account" />
          </Tabs>
        </Box>

        <CardContent>
          <TabPanel value={tabValue} index={0}>
            <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
              Profile Settings
            </Typography>
            <Typography sx={{ color: '#999' }}>
              Profile configuration coming soon...
            </Typography>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <PartnerDashboard />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
              Preferences
            </Typography>
            <Typography sx={{ color: '#999' }}>
              User preferences coming soon...
            </Typography>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
              Account Settings
            </Typography>
            <Typography sx={{ color: '#999' }}>
              Account management coming soon...
            </Typography>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};

