import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Tabs,
  Tab,
  Badge,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Assignment as TicketIcon,
  Chat as ChatIcon,
  CheckCircle as ResolveIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { ReviewService, ReviewTicket } from '../services/ReviewService';
import { PermissionService, UserRole } from '../services/PermissionService';

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
      id={`csr-tabpanel-${index}`}
      aria-labelledby={`csr-tab-${index}`}
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

export const CSRDashboard: React.FC = () => {
  const [tickets, setTickets] = useState<ReviewTicket[]>([]);
  const [priorityQueue, setPriorityQueue] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<ReviewTicket | null>(null);
  const [openTicketDialog, setOpenTicketDialog] = useState(false);
  const [resolution, setResolution] = useState('');
  const [currentUser, setCurrentUser] = useState<string>('csr_1'); // Mock current CSR
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reviewService = ReviewService.getInstance();
  const permissionService = PermissionService.getInstance();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const allTickets = reviewService.getAllTickets();
      const queue = reviewService.getPriorityQueue();
      const myTickets = reviewService.getTicketsForCsr(currentUser);
      
      setTickets(allTickets);
      setPriorityQueue(queue);
      setLoading(false);
    } catch (error) {
      setError('Failed to load dashboard data');
      setLoading(false);
    }
  };

  const handleAssignTicket = async (ticketId: string) => {
    try {
      await reviewService.assignTicket(ticketId, currentUser);
      await loadDashboardData();
      setError(null);
    } catch (error) {
      setError('Failed to assign ticket');
    }
  };

  const handleResolveTicket = async () => {
    if (!selectedTicket || !resolution.trim()) return;

    try {
      await reviewService.resolveTicket(selectedTicket.id, currentUser, resolution);
      setOpenTicketDialog(false);
      setResolution('');
      setSelectedTicket(null);
      await loadDashboardData();
      setError(null);
    } catch (error) {
      setError('Failed to resolve ticket');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'error';
      case 'in_progress': return 'warning';
      case 'resolved': return 'success';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <ErrorIcon />;
      case 'high': return <WarningIcon />;
      case 'medium': return <InfoIcon />;
      case 'low': return <InfoIcon />;
      default: return <InfoIcon />;
    }
  };

  const openTickets = tickets.filter(t => t.status === 'open');
  const myTickets = tickets.filter(t => t.assignedCsrId === currentUser);
  const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed');

  return (
    <Box sx={{ p: 3, backgroundColor: '#121212', minHeight: '100vh' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ color: '#fff' }}>
          🎫 CSR Dashboard - Review Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={loadDashboardData}
          disabled={loading}
        >
          Refresh
        </Button>
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
              <Badge badgeContent={openTickets.length} color="error">
                Open Tickets
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={myTickets.length} color="warning">
                My Tickets
              </Badge>
            } 
          />
          <Tab label="Priority Queue" />
          <Tab label="Resolved" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
          Open Tickets ({openTickets.length})
        </Typography>
        <TableContainer component={Paper} sx={{ backgroundColor: '#1e1e1e' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#fff' }}>Ticket ID</TableCell>
                <TableCell sx={{ color: '#fff' }}>Priority</TableCell>
                <TableCell sx={{ color: '#fff' }}>Reason</TableCell>
                <TableCell sx={{ color: '#fff' }}>Created</TableCell>
                <TableCell sx={{ color: '#fff' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {openTickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell sx={{ color: '#fff' }}>{ticket.id}</TableCell>
                  <TableCell>
                    <Chip
                      icon={getPriorityIcon(ticket.priority)}
                      label={ticket.priority.toUpperCase()}
                      color={getPriorityColor(ticket.priority) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#fff' }}>{ticket.reason}</TableCell>
                  <TableCell sx={{ color: '#fff' }}>
                    {new Date(ticket.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleAssignTicket(ticket.id)}
                      sx={{ color: '#4caf50', borderColor: '#4caf50' }}
                    >
                      Assign to Me
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
          My Assigned Tickets ({myTickets.length})
        </Typography>
        <TableContainer component={Paper} sx={{ backgroundColor: '#1e1e1e' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#fff' }}>Ticket ID</TableCell>
                <TableCell sx={{ color: '#fff' }}>Priority</TableCell>
                <TableCell sx={{ color: '#fff' }}>Status</TableCell>
                <TableCell sx={{ color: '#fff' }}>Reason</TableCell>
                <TableCell sx={{ color: '#fff' }}>Created</TableCell>
                <TableCell sx={{ color: '#fff' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {myTickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell sx={{ color: '#fff' }}>{ticket.id}</TableCell>
                  <TableCell>
                    <Chip
                      icon={getPriorityIcon(ticket.priority)}
                      label={ticket.priority.toUpperCase()}
                      color={getPriorityColor(ticket.priority) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={ticket.status.toUpperCase()}
                      color={getStatusColor(ticket.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#fff' }}>{ticket.reason}</TableCell>
                  <TableCell sx={{ color: '#fff' }}>
                    {new Date(ticket.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ChatIcon />}
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setOpenTicketDialog(true);
                      }}
                      sx={{ color: '#2196f3', borderColor: '#2196f3', mr: 1 }}
                    >
                      Chat
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ResolveIcon />}
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setOpenTicketDialog(true);
                      }}
                      sx={{ color: '#4caf50', borderColor: '#4caf50' }}
                    >
                      Resolve
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
          Priority Queue ({priorityQueue.length})
        </Typography>
        <TableContainer component={Paper} sx={{ backgroundColor: '#1e1e1e' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#fff' }}>Ticket ID</TableCell>
                <TableCell sx={{ color: '#fff' }}>Priority Score</TableCell>
                <TableCell sx={{ color: '#fff' }}>Category</TableCell>
                <TableCell sx={{ color: '#fff' }}>Severity</TableCell>
                <TableCell sx={{ color: '#fff' }}>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {priorityQueue.map((item) => (
                <TableRow key={item.ticketId}>
                  <TableCell sx={{ color: '#fff' }}>{item.ticketId}</TableCell>
                  <TableCell sx={{ color: '#fff' }}>{item.priority}</TableCell>
                  <TableCell sx={{ color: '#fff' }}>{item.category}</TableCell>
                  <TableCell>
                    <Chip
                      label={item.severity.toUpperCase()}
                      color={getPriorityColor(item.severity) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#fff' }}>
                    {new Date(item.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
          Resolved Tickets ({resolvedTickets.length})
        </Typography>
        <TableContainer component={Paper} sx={{ backgroundColor: '#1e1e1e' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#fff' }}>Ticket ID</TableCell>
                <TableCell sx={{ color: '#fff' }}>Priority</TableCell>
                <TableCell sx={{ color: '#fff' }}>Reason</TableCell>
                <TableCell sx={{ color: '#fff' }}>Resolved By</TableCell>
                <TableCell sx={{ color: '#fff' }}>Resolved At</TableCell>
                <TableCell sx={{ color: '#fff' }}>Resolution</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {resolvedTickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell sx={{ color: '#fff' }}>{ticket.id}</TableCell>
                  <TableCell>
                    <Chip
                      icon={getPriorityIcon(ticket.priority)}
                      label={ticket.priority.toUpperCase()}
                      color={getPriorityColor(ticket.priority) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#fff' }}>{ticket.reason}</TableCell>
                  <TableCell sx={{ color: '#fff' }}>{ticket.assignedCsrId}</TableCell>
                  <TableCell sx={{ color: '#fff' }}>
                    {ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleString() : 'N/A'}
                  </TableCell>
                  <TableCell sx={{ color: '#fff' }}>{ticket.resolution || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Ticket Resolution Dialog */}
      <Dialog open={openTicketDialog} onClose={() => setOpenTicketDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedTicket ? `Resolve Ticket: ${selectedTicket.id}` : 'Resolve Ticket'}
        </DialogTitle>
        <DialogContent>
          {selectedTicket && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Reason:</strong> {selectedTicket.reason}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Priority:</strong> {selectedTicket.priority.toUpperCase()}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Created:</strong> {new Date(selectedTicket.createdAt).toLocaleString()}
              </Typography>
              
              <TextField
                autoFocus
                margin="dense"
                label="Resolution Details"
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Describe how this ticket was resolved..."
                sx={{ mt: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTicketDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleResolveTicket}
            disabled={!resolution.trim()}
            startIcon={<ResolveIcon />}
          >
            Resolve Ticket
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CSRDashboard;
