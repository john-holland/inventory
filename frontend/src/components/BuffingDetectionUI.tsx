import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  LinearProgress,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Warning as WarningIcon,
  Security as SecurityIcon,
  Timeline as TimelineIcon,
  NetworkCheck as NetworkIcon,
  Psychology as PsychologyIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { buffingDetectionService, ReputationAnalysis, CollusionRing } from '../services/BuffingDetectionService';

interface BuffingDetectionUIProps {
  isVisible?: boolean;
}

export const BuffingDetectionUI: React.FC<BuffingDetectionUIProps> = ({ isVisible = false }) => {
  const [highRiskUsers, setHighRiskUsers] = useState<ReputationAnalysis[]>([]);
  const [collusionRings, setCollusionRings] = useState<CollusionRing[]>([]);
  const [networkStats, setNetworkStats] = useState<any>({});
  const [selectedUser, setSelectedUser] = useState<ReputationAnalysis | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    if (isVisible) {
      refreshData();
      const interval = setInterval(refreshData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  const refreshData = () => {
    const highRisk = buffingDetectionService.getHighRiskUsers();
    const rings = buffingDetectionService.getCollusionRings();
    const stats = buffingDetectionService.getNetworkStatistics();
    
    setHighRiskUsers(highRisk);
    setCollusionRings(rings);
    setNetworkStats(stats);
    setLastUpdated(new Date());
  };

  const handleUserDetail = (user: ReputationAnalysis) => {
    setSelectedUser(user);
    setDetailDialogOpen(true);
  };

  const exportAnalysis = (userId: string) => {
    const analysis = buffingDetectionService.exportAnalysis(userId);
    if (analysis) {
      const dataStr = JSON.stringify(analysis, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `buffing-analysis-${userId}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 0.8) return 'error';
    if (riskScore >= 0.6) return 'warning';
    return 'info';
  };

  const getFlagIcon = (flag: string) => {
    switch (flag) {
      case 'unusual_reputation_jump':
        return <TimelineIcon fontSize="small" />;
      case 'behavioral_anomaly':
        return <PsychologyIcon fontSize="small" />;
      case 'collusion_detected':
        return <NetworkIcon fontSize="small" />;
      case 'temporal_anomaly':
        return <TimelineIcon fontSize="small" />;
      default:
        return <WarningIcon fontSize="small" />;
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <SecurityIcon color="primary" />
        Buffing Detection Monitor
        <Chip 
          label="STEALTH MODE" 
          color="secondary" 
          size="small" 
          variant="outlined"
        />
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        This system monitors for suspicious patterns without affecting user reputation or marking accounts. 
        All data is collected independently for analysis purposes only.
      </Alert>

      {/* Network Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Users Monitored
              </Typography>
              <Typography variant="h4">
                {networkStats.totalUsers || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                High Risk Users
              </Typography>
              <Typography variant="h4" color="error">
                {networkStats.highRiskUsers || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Collusion Rings
              </Typography>
              <Typography variant="h4" color="warning.main">
                {networkStats.collusionRings || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Behavioral Clusters
              </Typography>
              <Typography variant="h4" color="info.main">
                {networkStats.behavioralClusters || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* High Risk Users Table */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              High Risk Users ({highRiskUsers.length})
            </Typography>
            <Box>
              <Tooltip title="Refresh Data">
                <IconButton onClick={refreshData}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                Last updated: {lastUpdated.toLocaleTimeString()}
              </Typography>
            </Box>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User ID</TableCell>
                  <TableCell>Current Reputation</TableCell>
                  <TableCell>Risk Score</TableCell>
                  <TableCell>Confidence</TableCell>
                  <TableCell>Flags</TableCell>
                  <TableCell>Last Updated</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {highRiskUsers.map((user) => (
                  <TableRow key={user.userId} hover>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {user.userId.slice(0, 8)}...{user.userId.slice(-6)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">
                          {user.currentReputation}
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={Math.min(user.currentReputation, 100)} 
                          sx={{ width: 50, height: 6 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`${(user.riskScore * 100).toFixed(1)}%`}
                        color={getRiskColor(user.riskScore)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {(user.confidence * 100).toFixed(1)}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {user.flags.map((flag, index) => (
                          <Tooltip key={index} title={flag.replace(/_/g, ' ')}>
                            <Chip
                              icon={getFlagIcon(flag)}
                              label={flag.split('_')[0]}
                              size="small"
                              variant="outlined"
                              color="warning"
                            />
                          </Tooltip>
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.lastUpdated.toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            onClick={() => handleUserDetail(user)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Export Analysis">
                          <IconButton 
                            size="small" 
                            onClick={() => exportAnalysis(user.userId)}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {highRiskUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="textSecondary">
                        No high-risk users detected
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Collusion Rings */}
      {collusionRings.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Detected Collusion Rings ({collusionRings.length})
            </Typography>
            <Grid container spacing={2}>
              {collusionRings.map((ring, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Pattern: {ring.pattern.toUpperCase()}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Members: {ring.members.length}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Risk Score: {(ring.riskScore * 100).toFixed(1)}%
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        First Detected: {ring.firstDetected.toLocaleDateString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* User Detail Dialog */}
      <Dialog 
        open={detailDialogOpen} 
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          User Analysis Details
          {selectedUser && (
            <Typography variant="body2" color="textSecondary">
              {selectedUser.userId}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Reputation History
                </Typography>
                <Box sx={{ height: 200, overflow: 'auto' }}>
                  {selectedUser.reputationHistory.map((rep, index) => (
                    <Typography key={index} variant="body2">
                      {index + 1}. {rep}
                    </Typography>
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Transaction History
                </Typography>
                <Box sx={{ height: 200, overflow: 'auto' }}>
                  {selectedUser.transactionHistory.map((tx, index) => (
                    <Typography key={index} variant="body2">
                      {tx.type}: {tx.counterparty.slice(0, 8)}... ({tx.reputationChange > 0 ? '+' : ''}{tx.reputationChange})
                    </Typography>
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Analysis Metrics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="textSecondary">
                      Behavioral Score
                    </Typography>
                    <Typography variant="h6">
                      {(selectedUser.behavioralScore * 100).toFixed(1)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="textSecondary">
                      Network Risk
                    </Typography>
                    <Typography variant="h6">
                      {(selectedUser.networkRisk * 100).toFixed(1)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="textSecondary">
                      Temporal Anomaly
                    </Typography>
                    <Typography variant="h6">
                      {(selectedUser.temporalAnomaly * 100).toFixed(1)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="textSecondary">
                      Confidence
                    </Typography>
                    <Typography variant="h6">
                      {(selectedUser.confidence * 100).toFixed(1)}%
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
          {selectedUser && (
            <Button 
              onClick={() => exportAnalysis(selectedUser.userId)}
              startIcon={<DownloadIcon />}
            >
              Export Analysis
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BuffingDetectionUI; 