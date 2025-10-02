import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Chat as ChatIcon,
  Group as GroupIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { OnboardingService, ChatRoom, OnboardingParticipant } from '../services/OnboardingService';

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
      id={`cabin-onboarding-tabpanel-${index}`}
      aria-labelledby={`cabin-onboarding-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export const CabinOnboardingDashboard: React.FC = () => {
  const [cabinTrainingRooms, setCabinTrainingRooms] = useState<ChatRoom[]>([]);
  const [jointCabinRoom, setJointCabinRoom] = useState<ChatRoom | null>(null);
  const [allChatRooms, setAllChatRooms] = useState<ChatRoom[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New employee form state
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeType, setNewEmployeeType] = useState<'technical' | 'operations' | 'customer_service' | 'management'>('technical');
  const [newEmployeeDepartment, setNewEmployeeDepartment] = useState('');

  const onboardingService = OnboardingService.getInstance();

  useEffect(() => {
    loadChatRooms();
  }, []);

  const loadChatRooms = async () => {
    try {
      setLoading(true);
      const trainingRooms = onboardingService.getCabinTrainingChatRooms();
      const jointRoom = onboardingService.getJointCabinChatRoom();
      const allRooms = onboardingService.getChatRooms();

      setCabinTrainingRooms(trainingRooms);
      setJointCabinRoom(jointRoom || null);
      setAllChatRooms(allRooms);
      setLoading(false);
    } catch (error) {
      setError('Failed to load chat rooms');
      setLoading(false);
    }
  };

  const handleCreateCabinTrainingRoom = async () => {
    if (!newEmployeeName.trim() || !newEmployeeDepartment.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await onboardingService.createCabinTrainingChatRoom(
        `employee_${Date.now()}`,
        newEmployeeName,
        newEmployeeType,
        newEmployeeDepartment
      );

      // Reset form
      setNewEmployeeName('');
      setNewEmployeeType('technical');
      setNewEmployeeDepartment('');
      setOpenCreateDialog(false);

      // Reload chat rooms
      await loadChatRooms();
      setError(null);
    } catch (error) {
      setError('Failed to create cabin training room');
      setLoading(false);
    }
  };

  const handleCreateJointRoom = async () => {
    try {
      setLoading(true);
      await onboardingService.createJointCabinEmployeeChatRoom();
      await loadChatRooms();
      setError(null);
    } catch (error) {
      setError('Failed to create joint cabin room');
      setLoading(false);
    }
  };

  const getEmployeeTypeColor = (type: string) => {
    switch (type) {
      case 'technical': return 'primary';
      case 'operations': return 'success';
      case 'customer_service': return 'warning';
      case 'management': return 'error';
      default: return 'default';
    }
  };

  const getEmployeeTypeIcon = (type: string) => {
    switch (type) {
      case 'technical': return <WorkIcon />;
      case 'operations': return <GroupIcon />;
      case 'customer_service': return <ChatIcon />;
      case 'management': return <SchoolIcon />;
      default: return <WorkIcon />;
    }
  };

  const getChatRoomTypeColor = (type: string) => {
    switch (type) {
      case 'cabin_training': return 'primary';
      case 'cabin_employee_joint': return 'success';
      case 'onboarding': return 'info';
      case 'department_specific': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#121212', minHeight: '100vh' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ color: '#fff' }}>
          🏠 Cabin Onboarding Dashboard
        </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateDialog(true)}
            sx={{ mr: 2, backgroundColor: '#4caf50' }}
          >
            New Training Room
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadChatRooms}
            disabled={loading}
            sx={{ color: '#2196f3', borderColor: '#2196f3' }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab 
            label={
              <Box display="flex" alignItems="center">
                <SchoolIcon sx={{ mr: 1 }} />
                Cabin Training Rooms ({cabinTrainingRooms.length})
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center">
                <GroupIcon sx={{ mr: 1 }} />
                Joint Cabin Room
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center">
                <ChatIcon sx={{ mr: 1 }} />
                All Chat Rooms ({allChatRooms.length})
              </Box>
            } 
          />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Typography variant="h6" gutterBottom sx={{ color: '#fff', mb: 3 }}>
          Cabin Training Rooms by Employee Type
        </Typography>
        
        <Grid container spacing={3}>
          {['technical', 'operations', 'customer_service', 'management'].map((type) => {
            const roomsForType = cabinTrainingRooms.filter(room => room.employeeType === type);
            return (
              <Grid item xs={12} md={6} key={type}>
                <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      {getEmployeeTypeIcon(type)}
                      <Typography variant="h6" sx={{ color: '#fff', ml: 1 }}>
                        {type.charAt(0).toUpperCase() + type.slice(1)} Training
                      </Typography>
                      <Chip
                        label={roomsForType.length}
                        color={getEmployeeTypeColor(type) as any}
                        size="small"
                        sx={{ ml: 'auto' }}
                      />
                    </Box>
                    
                    {roomsForType.length > 0 ? (
                      <List>
                        {roomsForType.map((room) => (
                          <ListItem key={room.id} sx={{ px: 0 }}>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: '#4caf50' }}>
                                <ChatIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={room.name}
                              secondary={`Created: ${new Date(room.createdAt).toLocaleDateString()}`}
                              primaryTypographyProps={{ color: '#fff' }}
                              secondaryTypographyProps={{ color: '#ccc' }}
                            />
                            <Chip
                              label={room.status}
                              color={room.status === 'active' ? 'success' : 'default'}
                              size="small"
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#ccc', fontStyle: 'italic' }}>
                        No training rooms for {type} employees yet
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom sx={{ color: '#fff', mb: 3 }}>
          Joint Cabin-Employee Chat Room
        </Typography>
        
        {jointCabinRoom ? (
          <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <GroupIcon sx={{ color: '#4caf50', mr: 1 }} />
                <Typography variant="h6" sx={{ color: '#fff' }}>
                  {jointCabinRoom.name}
                </Typography>
                <Chip
                  label={jointCabinRoom.status}
                  color={jointCabinRoom.status === 'active' ? 'success' : 'default'}
                  size="small"
                  sx={{ ml: 'auto' }}
                />
              </Box>
              
              <Typography variant="body2" sx={{ color: '#ccc', mb: 2 }}>
                Participants: {jointCabinRoom.participants.length} | 
                Created: {new Date(jointCabinRoom.createdAt).toLocaleDateString()}
              </Typography>
              
              <Typography variant="body2" sx={{ color: '#fff', mb: 2 }}>
                This is the main collaboration room for all Cabin-related discussions, 
                updates, and cross-team coordination.
              </Typography>
              
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  startIcon={<ChatIcon />}
                  sx={{ color: '#2196f3', borderColor: '#2196f3' }}
                >
                  Join Chat
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<InfoIcon />}
                  sx={{ color: '#4caf50', borderColor: '#4caf50' }}
                >
                  View Details
                </Button>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                No Joint Cabin Room Created Yet
              </Typography>
              <Typography variant="body2" sx={{ color: '#ccc', mb: 3 }}>
                Create a joint cabin-employee chat room for all Cabin-related discussions and collaboration.
              </Typography>
              <Button
                variant="contained"
                startIcon={<GroupIcon />}
                onClick={handleCreateJointRoom}
                disabled={loading}
                sx={{ backgroundColor: '#4caf50' }}
              >
                Create Joint Room
              </Button>
            </CardContent>
          </Card>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom sx={{ color: '#fff', mb: 3 }}>
          All Chat Rooms
        </Typography>
        
        <Grid container spacing={2}>
          {allChatRooms.map((room) => (
            <Grid item xs={12} md={6} lg={4} key={room.id}>
              <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <ChatIcon sx={{ color: '#2196f3', mr: 1 }} />
                    <Typography variant="h6" sx={{ color: '#fff' }}>
                      {room.name}
                    </Typography>
                    <Chip
                      label={room.type.replace('_', ' ').toUpperCase()}
                      color={getChatRoomTypeColor(room.type) as any}
                      size="small"
                      sx={{ ml: 'auto' }}
                    />
                  </Box>
                  
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                    Participants: {room.participants.length}
                  </Typography>
                  
                  {room.employeeType && (
                    <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                      Type: {room.employeeType.charAt(0).toUpperCase() + room.employeeType.slice(1)}
                    </Typography>
                  )}
                  
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 2 }}>
                    Created: {new Date(room.createdAt).toLocaleDateString()}
                  </Typography>
                  
                  <Box display="flex" gap={1}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ChatIcon />}
                      sx={{ color: '#2196f3', borderColor: '#2196f3' }}
                    >
                      Join
                    </Button>
                    <Chip
                      label={room.status}
                      color={room.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Create New Training Room Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Cabin Training Room</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Employee Name"
            fullWidth
            variant="outlined"
            value={newEmployeeName}
            onChange={(e) => setNewEmployeeName(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Department"
            fullWidth
            variant="outlined"
            value={newEmployeeDepartment}
            onChange={(e) => setNewEmployeeDepartment(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Employee Type</InputLabel>
            <Select
              value={newEmployeeType}
              onChange={(e) => setNewEmployeeType(e.target.value as any)}
              label="Employee Type"
            >
              <MenuItem value="technical">Technical</MenuItem>
              <MenuItem value="operations">Operations</MenuItem>
              <MenuItem value="customer_service">Customer Service</MenuItem>
              <MenuItem value="management">Management</MenuItem>
            </Select>
          </FormControl>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            This will create a specialized Cabin training room with relevant specialists 
            and role-specific training materials.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateCabinTrainingRoom}
            disabled={loading || !newEmployeeName.trim() || !newEmployeeDepartment.trim()}
            startIcon={<AddIcon />}
          >
            Create Training Room
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CabinOnboardingDashboard;
