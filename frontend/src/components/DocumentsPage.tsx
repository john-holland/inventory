/**
 * Documents Page
 * Displays tax documents, legal documents, inventory reports, and sales reports
 * Includes "Get HR Help" button for HR assistance
 */

import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
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
import { isServiceConfigured } from '../services/soaRegistry';
import { loadResaurceInventoryCave, type ResaurceInventoryCave } from '../cave/resaurceInventoryCave';

const HrChatRemote = lazy(() => import('resaurce_hr/HrChatApp'));

const hrRemoteModuleEnabled =
  (typeof process !== 'undefined' && process.env.REACT_APP_RESAURCE_HR_REMOTE === 'true') || false;

/** When true, Documents HR entry is Resaurce-only (RobotCopy + federated UI); legacy in-memory HR dialog is hidden. */
const useResaurceHrPrimary = (remoteFlag: boolean, resaurceConfigured: boolean) =>
  remoteFlag && resaurceConfigured;

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
  const [hrRemoteDialogOpen, setHrRemoteDialogOpen] = useState(false);
  const [resaurceCave, setResaurceCave] = useState<ResaurceInventoryCave | null>(null);
  const [hrCaveError, setHrCaveError] = useState<string | null>(null);

  const resaurceHrPrimary = useResaurceHrPrimary(hrRemoteModuleEnabled, isServiceConfigured('resaurce'));
  const hrHelpService = HRHelpService.getInstance();

  const tenantId =
    (typeof process !== 'undefined' && process.env.REACT_APP_SOA_TENANT) || undefined;
  const inventoryUserId =
    (typeof process !== 'undefined' && process.env.REACT_APP_INVENTORY_USER_ID) || 'current_user_id';

  useEffect(() => {
    if (!hrRemoteDialogOpen || !hrRemoteModuleEnabled) return;
    let cancelled = false;
    setResaurceCave(null);
    setHrCaveError(null);
    loadResaurceInventoryCave({ forceRefresh: true }).then((c) => {
      if (cancelled) return;
      if (!c) setHrCaveError('Could not load Resaurce UI Tome (check REACT_APP_SOA_RES_AURCE_URL).');
      else setResaurceCave(c);
    });
    return () => {
      cancelled = true;
    };
  }, [hrRemoteDialogOpen, hrRemoteModuleEnabled]);

  const executeRobotCopyFlow = useCallback(
    (name: string, vars: Record<string, unknown>, opts?: { traceId?: string; tenant?: string | null }) => {
      if (!resaurceCave?.robotCopy) {
        return Promise.resolve({ ok: false, error: 'cave_not_loaded' });
      }
      return resaurceCave.robotCopy.executeFlow(name, vars, {
        ...opts,
        tenant: opts?.tenant ?? tenantId ?? null,
      });
    },
    [resaurceCave, tenantId]
  );

  const loadDocuments = useCallback(async () => {
    const mockTax: Document[] = [
      {
        id: 'doc_001',
        type: 'tax',
        name: 'W2 Form - 2024',
        description: 'Annual wage and tax statement',
        status: 'available',
      },
      {
        id: 'doc_002',
        type: 'tax',
        name: 'Investment Gains/Losses - 2024',
        description: 'Summary of investment activity',
        status: 'available',
      },
    ];
    const mockDocuments: Document[] = [
      ...mockTax,
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

    if (!isServiceConfigured('resaurce')) {
      setDocuments(mockDocuments);
      return;
    }

    const cave = await loadResaurceInventoryCave({ forceRefresh: true });
    if (!cave) {
      setDocuments(mockDocuments);
      return;
    }

    const listRes = await cave.robotCopy.executeFlow(
      'tax_documents_list',
      {},
      { traceId: `tax-list-${Date.now()}`, tenant: tenantId ?? null }
    );
    const remote = listRes as { ok?: boolean; documents?: unknown[] };
    if (remote.ok && Array.isArray(remote.documents)) {
      const mapped: Document[] = remote.documents.map((row: unknown) => {
        const r = row as Record<string, unknown>;
        const st = String(r.status || 'available');
        const status: Document['status'] =
          st === 'ready' ? 'ready' : st === 'generating' ? 'generating' : 'available';
        return {
          id: String(r.id ?? `doc_${Math.random()}`),
          type: 'tax',
          name: String(r.name ?? 'Tax document'),
          description: String(r.description ?? ''),
          status,
          generatedAt: r.generated_at != null ? String(r.generated_at) : undefined,
        };
      });
      const nonTax = mockDocuments.filter((d) => d.type !== 'tax');
      setDocuments([...mapped, ...nonTax]);
      return;
    }

    setDocuments(mockDocuments);
  }, [tenantId]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const inferTaxDocumentType = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes('1099')) return '1099-C';
    if (n.includes('investment')) return 'investment_gains_losses';
    return 'w2';
  };

  const handleGenerateDocument = async (documentLabel: string) => {
    setGeneratingDocType(documentLabel);
    setLoading(true);

    try {
      const docRow = documents.find((d) => d.name === documentLabel || d.name.includes(documentLabel));
      const isTax = docRow?.type === 'tax';

      if (isTax && isServiceConfigured('resaurce')) {
        const cave = await loadResaurceInventoryCave({ forceRefresh: true });
        if (cave) {
          const traceId = `tax-gen-${Date.now()}`;
          const sessionId = `tax-sess-${Date.now()}`;
          const out = (await cave.robotCopy.executeFlow(
            'tax_generate_enqueue',
            {
              userId: inventoryUserId,
              year: new Date().getFullYear(),
              documentType: inferTaxDocumentType(documentLabel),
              traceId,
              sessionId,
            },
            { traceId, tenant: tenantId ?? null }
          )) as { ok?: boolean; error?: string; document?: Record<string, unknown> };
          if (out.ok) {
            setDocuments((prev) =>
              prev.map((doc) =>
                doc.name === documentLabel || doc.name.includes(documentLabel)
                  ? { ...doc, status: 'ready' as const, generatedAt: new Date().toISOString() }
                  : doc
              )
            );
            alert(`Tax document generated via Resaurce Cave (${documentLabel}).`);
            return;
          }
          console.warn('tax_generate_enqueue failed', out);
        }
      }

      console.log(`Generating document: ${documentLabel}`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.name.includes(documentLabel)
            ? { ...doc, status: 'ready' as const, generatedAt: new Date().toISOString() }
            : doc
        )
      );
      alert(`Document generated successfully: ${documentLabel}`);
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
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {resaurceHrPrimary ? (
            <Button
              variant="contained"
              color="primary"
              startIcon={<HelpIcon />}
              onClick={() => setHrRemoteDialogOpen(true)}
              size="large"
            >
              Get HR Help
            </Button>
          ) : (
            <>
              <Button
                variant="contained"
                color="primary"
                startIcon={<HelpIcon />}
                onClick={handleGetHRHelp}
                size="large"
              >
                Get HR Help
              </Button>
              {hrRemoteModuleEnabled && isServiceConfigured('resaurce') && (
                <Button variant="outlined" color="primary" onClick={() => setHrRemoteDialogOpen(true)} size="large">
                  HR workspace (Resaurce)
                </Button>
              )}
            </>
          )}
        </Box>
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

      {/* Legacy in-memory HR help (hidden when Resaurce HR remote is the primary path) */}
      <Dialog open={!resaurceHrPrimary && hrHelpDialogOpen} onClose={() => setHrHelpDialogOpen(false)} maxWidth="sm" fullWidth>
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

      <Dialog open={hrRemoteDialogOpen} onClose={() => setHrRemoteDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>HR workspace</DialogTitle>
        <DialogContent>
          {hrCaveError && <Alert severity="error">{hrCaveError}</Alert>}
          {!resaurceCave && !hrCaveError ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : null}
          {resaurceCave ? (
            <Suspense fallback={<CircularProgress />}>
              <HrChatRemote
                executeFlow={executeRobotCopyFlow}
                userId={inventoryUserId}
                tenant={tenantId ?? null}
              />
            </Suspense>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHrRemoteDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentsPage;

