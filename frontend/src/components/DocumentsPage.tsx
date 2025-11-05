/**
 * Documents Page
 * Displays tax documents, legal documents, inventory reports, and sales reports
 * Includes "Get HR Help" button for HR assistance
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Description as DescriptionIcon,
  Gavel as GavelIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  Help as HelpIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import HRHelpService, { HREmployee, HelpRequest } from '../services/HRHelpService';

interface Document {
  id: string;
  type: 'tax' | 'legal' | 'inventory' | 'sales' | 'service-performance';
  name: string;
  description: string;
  sessionId?: string;
  status: 'available' | 'generating' | 'ready';
  generatedAt?: string;
}

const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [hrHelpDialogOpen, setHrHelpDialogOpen] = useState(false);
  const [selectedHREmployee, setSelectedHREmployee] = useState<HREmployee | null>(null);
  const [helpContext, setHelpContext] = useState('');
  const [generatingDocType, setGeneratingDocType] = useState<string | null>(null);

  const hrHelpService = HRHelpService.getInstance();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = () => {
    // Mock documents - in production, load from API
    const mockDocuments: Document[] = [
      {
        id: 'doc_001',
        type: 'tax',
        name: 'W2 Form - 2024',
        description: 'Annual wage and tax statement',
        status: 'available'
      },
      {
        id: 'doc_002',
        type: 'tax',
        name: 'Investment Gains/Losses - 2024',
        description: 'Summary of investment activity',
        status: 'available'
      },
      {
        id: 'doc_003',
        type: 'legal',
        name: 'Terms of Service',
        description: 'Platform terms and conditions',
        status: 'ready',
        generatedAt: '2024-01-15'
      },
      {
        id: 'doc_004',
        type: 'legal',
        name: 'Mission Statement',
        description: 'Company mission and values',
        status: 'ready',
        generatedAt: '2024-01-15'
      },
      {
        id: 'doc_005',
        type: 'inventory',
        name: 'Inventory Report - Q1 2024',
        description: 'Comprehensive inventory audit report',
        status: 'available'
      },
      {
        id: 'doc_006',
        type: 'sales',
        name: 'Sales Report - January 2024',
        description: 'Monthly sales and revenue analysis',
        status: 'available'
      },
      {
        id: 'doc_007',
        type: 'service-performance',
        name: 'Service Performance Requirements',
        description: 'AWS and Slack quota recommendations and throughput requirements',
        status: 'ready',
        generatedAt: new Date().toISOString()
      }
    ];

    setDocuments(mockDocuments);
  };

  const handleGenerateDocument = async (documentType: string) => {
    setGeneratingDocType(documentType);
    setLoading(true);

    try {
      // Mock document generation - in production, call actual API
      console.log(`Generating document: ${documentType}`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update document status
      setDocuments(prev => prev.map(doc => 
        doc.name.includes(documentType) 
          ? { ...doc, status: 'ready' as const, generatedAt: new Date().toISOString() }
          : doc
      ));

      alert(`Document generated successfully: ${documentType}`);
    } catch (error) {
      console.error('Failed to generate document:', error);
      alert('Failed to generate document. Please try again.');
    } finally {
      setLoading(false);
      setGeneratingDocType(null);
    }
  };

  const handleDownloadDocument = (document: Document) => {
    console.log(`Downloading document: ${document.name}`);
    // In production, trigger actual download
    alert(`Downloading: ${document.name}`);
  };

  const handleGetHRHelp = async () => {
    setHrHelpDialogOpen(true);
    
    // Find available HR employees
    const availableEmployees = await hrHelpService.findAvailableHREmployees(
      new Date().toISOString(),
      ['documents', 'tax', 'compliance']
    );

    if (availableEmployees.length > 0) {
      setSelectedHREmployee(availableEmployees[0]);
    }
  };

  const handleConfirmHRHelp = async () => {
    if (!selectedHREmployee) {
      alert('No HR employee available');
      return;
    }

    try {
      const helpRequest: HelpRequest = {
        userId: 'current_user_id', // In production, get from auth context
        context: helpContext || 'Document assistance',
        skillsRequired: ['documents', 'tax'],
        urgency: 'medium'
      };

      const session = await hrHelpService.getHRHelp(helpRequest);
      
      setHrHelpDialogOpen(false);
      setHelpContext('');
      
      alert(`HR Help session started! Chat room ID: ${session.chatRoomId}\n\nConnected with: ${selectedHREmployee.name}`);
      
      // In production, open chat window automatically
      // window.openChatWindow(session.chatRoomId);
      
    } catch (error) {
      console.error('Failed to get HR help:', error);
      alert('Failed to connect with HR. Please try again.');
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'tax': return <DescriptionIcon />;
      case 'legal': return <GavelIcon />;
      case 'inventory': return <InventoryIcon />;
      case 'sales': return <MoneyIcon />;
      case 'service-performance': return <DescriptionIcon />;
      default: return <DescriptionIcon />;
    }
  };

  const getDocumentColor = (type: string) => {
    switch (type) {
      case 'tax': return 'primary';
      case 'legal': return 'secondary';
      case 'inventory': return 'success';
      case 'sales': return 'warning';
      case 'service-performance': return 'info';
      default: return 'default';
    }
  };

  const groupedDocuments = documents.reduce((acc, doc) => {
    if (!acc[doc.type]) {
      acc[doc.type] = [];
    }
    acc[doc.type].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          📄 Documents
        </Typography>
        
        {/* Get HR Help Button */}
        <Button
          variant="contained"
          color="primary"
          startIcon={<HelpIcon />}
          onClick={handleGetHRHelp}
          size="large"
        >
          Get HR Help
        </Button>
      </Box>

      {/* Document Categories */}
      <Grid container spacing={3}>
        {/* Tax Documents */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DescriptionIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Tax Documents</Typography>
              </Box>
              <List>
                {groupedDocuments.tax?.map(doc => (
                  <ListItem key={doc.id}>
                    <ListItemIcon>
                      {getDocumentIcon(doc.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={doc.name}
                      secondary={doc.description}
                    />
                    <Box>
                      {doc.status === 'ready' ? (
                        <Button
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={() => handleDownloadDocument(doc)}
                        >
                          Download
                        </Button>
                      ) : doc.status === 'generating' ? (
                        <CircularProgress size={24} />
                      ) : (
                        <Button
                          size="small"
                          startIcon={<RefreshIcon />}
                          onClick={() => handleGenerateDocument(doc.name)}
                          disabled={loading}
                        >
                          Generate
                        </Button>
                      )}
                    </Box>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Legal Documents */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <GavelIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">Legal Documents</Typography>
              </Box>
              <List>
                {groupedDocuments.legal?.map(doc => (
                  <ListItem key={doc.id}>
                    <ListItemIcon>
                      {getDocumentIcon(doc.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={doc.name}
                      secondary={doc.description}
                    />
                    <Box>
                      {doc.status === 'ready' ? (
                        <Button
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={() => handleDownloadDocument(doc)}
                        >
                          Download
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          startIcon={<RefreshIcon />}
                          onClick={() => handleGenerateDocument(doc.name)}
                          disabled={loading}
                        >
                          Generate
                        </Button>
                      )}
                    </Box>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Inventory Reports */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <InventoryIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Inventory Reports</Typography>
              </Box>
              <List>
                {groupedDocuments.inventory?.map(doc => (
                  <ListItem key={doc.id}>
                    <ListItemIcon>
                      {getDocumentIcon(doc.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={doc.name}
                      secondary={doc.description}
                    />
                    <Box>
                      {doc.status === 'ready' ? (
                        <Button
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={() => handleDownloadDocument(doc)}
                        >
                          Download
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          startIcon={<RefreshIcon />}
                          onClick={() => handleGenerateDocument(doc.name)}
                          disabled={loading}
                        >
                          Generate
                        </Button>
                      )}
                    </Box>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Sales Reports */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MoneyIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Sales Reports</Typography>
              </Box>
              <List>
                {groupedDocuments.sales?.map(doc => (
                  <ListItem key={doc.id}>
                    <ListItemIcon>
                      {getDocumentIcon(doc.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={doc.name}
                      secondary={doc.description}
                    />
                    <Box>
                      {doc.status === 'ready' ? (
                        <Button
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={() => handleDownloadDocument(doc)}
                        >
                          Download
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          startIcon={<RefreshIcon />}
                          onClick={() => handleGenerateDocument(doc.name)}
                          disabled={loading}
                        >
                          Generate
                        </Button>
                      )}
                    </Box>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* HR Help Dialog */}
      <Dialog open={hrHelpDialogOpen} onClose={() => setHrHelpDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>🆘 Get HR Help</DialogTitle>
        <DialogContent>
          {selectedHREmployee ? (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                You'll be connected with an HR representative to assist with your document questions.
              </Alert>
              
              <Typography variant="subtitle1" gutterBottom>
                <strong>HR Representative:</strong> {selectedHREmployee.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Email: {selectedHREmployee.email}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Skills: {selectedHREmployee.skills.join(', ')}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Rating: {'⭐'.repeat(Math.round(selectedHREmployee.rating))} ({selectedHREmployee.rating}/5)
              </Typography>
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="What do you need help with?"
                value={helpContext}
                onChange={(e) => setHelpContext(e.target.value)}
                placeholder="e.g., I have questions about my W2 form..."
                sx={{ mt: 2 }}
              />
            </Box>
          ) : (
            <Alert severity="warning">
              No HR representatives are currently available. Please try again later.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHrHelpDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmHRHelp}
            disabled={!selectedHREmployee || !helpContext}
          >
            Start Chat
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentsPage;

