import React, { useEffect, useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    Chip,
    Divider,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Tooltip,
    FormControlLabel,
    Switch,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import {
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    SwapHoriz as SwapHorizIcon,
    Report as ReportIcon,
    Gavel as GavelIcon,
    Security as SecurityIcon,
    ExpandMore as ExpandMoreIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import { InventoryService, InventoryItem } from '../services/InventoryService';
import { ward, wardString, wardNumber } from '../utils/assertions';

interface InventoryListProps {
    inventoryService: InventoryService;
}

interface NextShipperRequest {
    requester: string;
    requestTime: number;
    offeredShippingCost: string;
    isActive: boolean;
}

export const InventoryList: React.FC<InventoryListProps> = ({ inventoryService }) => {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [openLendDialog, setOpenLendDialog] = useState(false);
    const [openEarlyReturnDialog, setOpenEarlyReturnDialog] = useState(false);
    const [openNextShipperDialog, setOpenNextShipperDialog] = useState(false);
    const [openDisputeDialog, setOpenDisputeDialog] = useState(false);
    const [openAutoReturnSettingsDialog, setOpenAutoReturnSettingsDialog] = useState(false);
    const [nextShipperRequests, setNextShipperRequests] = useState<NextShipperRequest[]>([]);
    const [shipbackPayment, setShipbackPayment] = useState('');
    const [disputeReason, setDisputeReason] = useState('');
    const [useAdditionalProtection, setUseAdditionalProtection] = useState(false);
    const [autoReturnEnabled, setAutoReturnEnabled] = useState(false);
    const [autoReturnThreshold, setAutoReturnThreshold] = useState(7);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [newItem, setNewItem] = useState({
        name: '',
        description: '',
        shippingCost: 0,
        buyoutPrice: 0
    });

    useEffect(() => {
        // TODO: Implement item fetching from the contract
    }, []);

    const handleCreateItem = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Validate input using ward functions
            wardString(newItem.name, 'Item name is required');
            wardString(newItem.description, 'Item description is required');
            wardNumber(newItem.shippingCost, 'Shipping cost must be positive', 0);
            
            const itemId = await inventoryService.createItem(
                newItem.name,
                newItem.description,
                newItem.shippingCost,
                newItem.buyoutPrice
            );
            const item = await inventoryService.getItem(itemId);
            setItems([...items, item]);
            setOpenDialog(false);
            setSuccess('Item created successfully!');
        } catch (error) {
            console.error('Error creating item:', error);
            setError(error instanceof Error ? error.message : 'Failed to create item');
        } finally {
            setLoading(false);
        }
    };

    const handleLendItem = async (item: InventoryItem) => {
        try {
            setLoading(true);
            setError(null);
            
            await inventoryService.lendItem(item.id, item.shippingCost, useAdditionalProtection);
            const updatedItem = await inventoryService.getItem(item.id);
            setItems(items.map(i => i.id === item.id ? updatedItem : i));
            setOpenLendDialog(false);
            setUseAdditionalProtection(false);
            setSuccess(`Item borrowed successfully! ${useAdditionalProtection ? 'Additional protection enabled.' : ''}`);
        } catch (error) {
            console.error('Error lending item:', error);
            setError(error instanceof Error ? error.message : 'Failed to borrow item');
        } finally {
            setLoading(false);
        }
    };

    const handleReturnItem = async (item: InventoryItem) => {
        try {
            setLoading(true);
            setError(null);
            
            await inventoryService.returnItem(item.id);
            const updatedItem = await inventoryService.getItem(item.id);
            setItems(items.map(i => i.id === item.id ? updatedItem : i));
            setSuccess('Item returned successfully! Security deposit and protection refunded.');
        } catch (error) {
            console.error('Error returning item:', error);
            setError(error instanceof Error ? error.message : 'Failed to return item');
        } finally {
            setLoading(false);
        }
    };

    const handleEarlyReturn = async (item: InventoryItem) => {
        try {
            setLoading(true);
            setError(null);
            
            wardNumber(Number(shipbackPayment), 'Shipback payment must be positive', 0);
            ward(Number(shipbackPayment) >= item.shippingCost, 'Shipback payment must cover shipping cost');
            
            await inventoryService.earlyReturnItem(item.id, Number(shipbackPayment));
            const updatedItem = await inventoryService.getItem(item.id);
            setItems(items.map(i => i.id === item.id ? updatedItem : i));
            setOpenEarlyReturnDialog(false);
            setShipbackPayment('');
            setSuccess('Item returned early! Security deposit and protection refunded. Excess payment returned to you.');
        } catch (error) {
            console.error('Error with early return:', error);
            setError(error instanceof Error ? error.message : 'Failed to return item early');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestNextShipper = async (item: InventoryItem) => {
        try {
            setLoading(true);
            setError(null);
            
            await inventoryService.requestNextShipper(item.id, item.shippingCost, useAdditionalProtection);
            setOpenNextShipperDialog(false);
            setUseAdditionalProtection(false);
            setSuccess('Next shipper request submitted! Current holder will be notified.');
        } catch (error) {
            console.error('Error requesting next shipper:', error);
            setError(error instanceof Error ? error.message : 'Failed to request next shipper');
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptNextShipper = async (item: InventoryItem, requester: string) => {
        try {
            setLoading(true);
            setError(null);
            
            await inventoryService.acceptNextShipper(item.id, requester);
            const updatedItem = await inventoryService.getItem(item.id);
            setItems(items.map(i => i.id === item.id ? updatedItem : i));
            setSuccess('Next shipper accepted! Item transferred successfully.');
        } catch (error) {
            console.error('Error accepting next shipper:', error);
            setError(error instanceof Error ? error.message : 'Failed to accept next shipper');
        } finally {
            setLoading(false);
        }
    };

    const handleRejectNextShipper = async (item: InventoryItem, requester: string) => {
        try {
            setLoading(true);
            setError(null);
            
            // Rejecting next shipper requires returning item to owner
            wardNumber(Number(shipbackPayment), 'Return shipping payment required', 0);
            ward(Number(shipbackPayment) >= item.shippingCost, 'Return shipping payment must cover shipping cost');
            
            await inventoryService.rejectNextShipper(item.id, requester, Number(shipbackPayment));
            const updatedItem = await inventoryService.getItem(item.id);
            setItems(items.map(i => i.id === item.id ? updatedItem : i));
            setOpenNextShipperDialog(false);
            setShipbackPayment('');
            setSuccess('Next shipper rejected. Item returned to owner. Security deposit and protection refunded.');
        } catch (error) {
            console.error('Error rejecting next shipper:', error);
            setError(error instanceof Error ? error.message : 'Failed to reject next shipper');
        } finally {
            setLoading(false);
        }
    };

    const handleRaiseDispute = async (item: InventoryItem) => {
        try {
            setLoading(true);
            setError(null);
            
            wardString(disputeReason, 'Dispute reason is required');
            
            await inventoryService.raiseDispute(item.id, disputeReason);
            const updatedItem = await inventoryService.getItem(item.id);
            setItems(items.map(i => i.id === item.id ? updatedItem : i));
            setOpenDisputeDialog(false);
            setDisputeReason('');
            setSuccess('Dispute raised successfully. Admin will review the case.');
        } catch (error) {
            console.error('Error raising dispute:', error);
            setError(error instanceof Error ? error.message : 'Failed to raise dispute');
        } finally {
            setLoading(false);
        }
    };

    const handleAutoReturnSettings = async () => {
        try {
            setLoading(true);
            setError(null);
            
            await inventoryService.setAutoReturnPreference(autoReturnEnabled, autoReturnThreshold);
            setOpenAutoReturnSettingsDialog(false);
            setSuccess(`Auto-return preference ${autoReturnEnabled ? 'enabled' : 'disabled'} with ${autoReturnThreshold} day threshold.`);
        } catch (error) {
            console.error('Error setting auto-return preference:', error);
            setError(error instanceof Error ? error.message : 'Failed to set auto-return preference');
        } finally {
            setLoading(false);
        }
    };

    const handleTriggerAutoReturn = async (item: InventoryItem) => {
        try {
            setLoading(true);
            setError(null);
            
            await inventoryService.triggerAutoReturn(item.id);
            const updatedItem = await inventoryService.getItem(item.id);
            setItems(items.map(i => i.id === item.id ? updatedItem : i));
            setSuccess('Auto-return triggered successfully! Item returned to owner.');
        } catch (error) {
            console.error('Error triggering auto-return:', error);
            setError(error instanceof Error ? error.message : 'Failed to trigger auto-return');
        } finally {
            setLoading(false);
        }
    };

    const getPaymentBreakdown = (item: InventoryItem) => {
        const breakdown = inventoryService.calculateLendingPayment(item.shippingCost, useAdditionalProtection);
        return breakdown;
    };

    const getStatusChip = (item: InventoryItem) => {
        if (item.hasDispute) {
            return <Chip icon={<WarningIcon />} label="DISPUTED" color="error" />;
        }
        
        switch (item.status) {
            case 'AVAILABLE':
                return <Chip icon={<CheckCircleIcon />} label="AVAILABLE" color="success" />;
            case 'LENT':
                return <Chip icon={<SwapHorizIcon />} label="LENT" color="primary" />;
            case 'SOLD':
                return <Chip icon={<CheckCircleIcon />} label="SOLD" color="default" />;
            case 'LOST':
                return <Chip icon={<CancelIcon />} label="LOST" color="error" />;
            default:
                return <Chip label={item.status} color="default" />;
        }
    };

    const getActionButtons = (item: InventoryItem) => {
        const buttons = [];
        
        if (item.status === 'AVAILABLE') {
            buttons.push(
                <Button
                    key="lend"
                    variant="contained"
                    color="primary"
                    onClick={() => {
                        setSelectedItem(item);
                        setOpenLendDialog(true);
                    }}
                    disabled={loading}
                >
                    Borrow Item
                </Button>
            );
        }
        
        if (item.status === 'LENT' && item.currentHolderId === 'CURRENT_USER_ADDRESS') {
            buttons.push(
                <Button
                    key="return"
                    variant="contained"
                    color="secondary"
                    onClick={() => handleReturnItem(item)}
                    disabled={loading}
                >
                    Return Item
                </Button>
            );
            
            buttons.push(
                <Button
                    key="early-return"
                    variant="outlined"
                    color="secondary"
                    onClick={() => {
                        setSelectedItem(item);
                        setOpenEarlyReturnDialog(true);
                    }}
                    disabled={loading}
                >
                    Early Return
                </Button>
            );
            
            buttons.push(
                <Button
                    key="next-shipper"
                    variant="outlined"
                    color="primary"
                    onClick={() => {
                        setSelectedItem(item);
                        setOpenNextShipperDialog(true);
                    }}
                    disabled={loading}
                >
                    Next Shipper Requests
                </Button>
            );
        }
        
        if (item.status === 'LENT' && item.ownerId === 'CURRENT_USER_ADDRESS') {
            buttons.push(
                <Button
                    key="dispute"
                    variant="outlined"
                    color="error"
                    onClick={() => {
                        setSelectedItem(item);
                        setOpenDisputeDialog(true);
                    }}
                    disabled={loading}
                    startIcon={<ReportIcon />}
                >
                    Raise Dispute
                </Button>
            );
        }
        
        if (item.status === 'LENT' && item.currentHolderId !== 'CURRENT_USER_ADDRESS' && item.ownerId !== 'CURRENT_USER_ADDRESS') {
            buttons.push(
                <Button
                    key="request-next"
                    variant="outlined"
                    color="primary"
                    onClick={() => handleRequestNextShipper(item)}
                    disabled={loading}
                >
                    Request Next
                </Button>
            );
        }
        
        // Add auto-return trigger button for any user (if conditions are met)
        if (item.status === 'LENT' && item.currentHolderId !== 'CURRENT_USER_ADDRESS') {
            buttons.push(
                <Button
                    key="trigger-auto-return"
                    variant="outlined"
                    color="warning"
                    onClick={() => handleTriggerAutoReturn(item)}
                    disabled={loading}
                    size="small"
                >
                    Trigger Auto-Return
                </Button>
            );
        }
        
        return buttons;
    };

    return (
        <Box sx={{ p: 3 }}>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}
            
            {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            )}

            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h4">Inventory Items</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setOpenDialog(true)}
                >
                    Add New Item
                </Button>
            </Box>

            <Grid container spacing={3}>
                {items.map(item => (
                    <Grid item xs={12} sm={6} md={4} key={item.id}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Typography variant="h6">{item.name}</Typography>
                                    {getStatusChip(item)}
                                </Box>
                                
                                <Typography color="textSecondary" sx={{ mb: 2 }}>
                                    {item.description}
                                </Typography>
                                
                                <Typography sx={{ mb: 1 }}>
                                    Shipping Cost: {item.shippingCost} ETH
                                </Typography>
                                
                                {item.buyoutPrice && (
                                    <Typography sx={{ mb: 1 }}>
                                        Buyout Price: {item.buyoutPrice} ETH
                                    </Typography>
                                )}

                                {item.additionalProtection > 0 && (
                                    <Box sx={{ mb: 2, p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
                                        <Typography variant="body2" color="success.contrastText">
                                            <SecurityIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                            Additional Protection: {item.additionalProtection} ETH
                                        </Typography>
                                    </Box>
                                )}
                                
                                {item.hasDispute && (
                                    <Alert severity="warning" sx={{ mb: 2 }}>
                                        ⚠️ This item has an active dispute
                                    </Alert>
                                )}
                                
                                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {getActionButtons(item)}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Create Item Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add New Item</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Name"
                        fullWidth
                        value={newItem.name}
                        onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Description"
                        fullWidth
                        multiline
                        rows={4}
                        value={newItem.description}
                        onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Shipping Cost (ETH)"
                        type="number"
                        fullWidth
                        value={newItem.shippingCost}
                        onChange={e => setNewItem({ ...newItem, shippingCost: Number(e.target.value) })}
                    />
                    <TextField
                        margin="dense"
                        label="Buyout Price (ETH)"
                        type="number"
                        fullWidth
                        value={newItem.buyoutPrice}
                        onChange={e => setNewItem({ ...newItem, buyoutPrice: Number(e.target.value) })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button onClick={handleCreateItem} color="primary" disabled={loading}>
                        {loading ? 'Creating...' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Lend Item Dialog */}
            <Dialog open={openLendDialog} onClose={() => setOpenLendDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Borrow Item</DialogTitle>
                <DialogContent>
                    {selectedItem && (
                        <>
                            <Typography variant="h6" gutterBottom>
                                {selectedItem.name}
                            </Typography>
                            <Typography color="textSecondary" sx={{ mb: 2 }}>
                                {selectedItem.description}
                            </Typography>

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={useAdditionalProtection}
                                        onChange={(e) => setUseAdditionalProtection(e.target.checked)}
                                    />
                                }
                                label="Use Additional Protection (3x shipping cost)"
                            />

                            <Accordion sx={{ mt: 2 }}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography variant="subtitle2">
                                        <InfoIcon sx={{ mr: 1 }} />
                                        Payment Breakdown
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    {selectedItem && (
                                        <Box>
                                            {(() => {
                                                const breakdown = getPaymentBreakdown(selectedItem);
                                                return (
                                                    <>
                                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                                            <strong>Total Payment:</strong> {breakdown.totalPayment} ETH
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                                            <strong>Security Deposit:</strong> {breakdown.securityDeposit} ETH
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                                            <strong>Shipping Fund:</strong> {breakdown.shippingFund} ETH
                                                        </Typography>
                                                        {useAdditionalProtection && (
                                                            <Typography variant="body2" sx={{ mb: 1, color: 'success.main' }}>
                                                                <strong>Additional Protection:</strong> {breakdown.additionalProtection} ETH
                                                            </Typography>
                                                        )}
                                                        <Alert severity="info" sx={{ mt: 1 }}>
                                                            {useAdditionalProtection 
                                                                ? "Additional protection provides extra security against negative deltas and shipping imbalances."
                                                                : "Standard 2x payment covers shipping and security deposit."
                                                            }
                                                        </Alert>
                                                    </>
                                                );
                                            })()}
                                        </Box>
                                    )}
                                </AccordionDetails>
                            </Accordion>
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenLendDialog(false)}>Cancel</Button>
                    <Button onClick={() => handleLendItem(selectedItem!)} color="primary" disabled={loading}>
                        {loading ? 'Processing...' : 'Borrow Item'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Early Return Dialog */}
            <Dialog open={openEarlyReturnDialog} onClose={() => setOpenEarlyReturnDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Early Return</DialogTitle>
                <DialogContent>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        You can return this item early by paying the shipback cost. 
                        Any excess payment will be refunded to you unless there's an active dispute.
                        Your security deposit and additional protection will be refunded.
                    </Alert>
                    <TextField
                        margin="dense"
                        label="Shipback Payment (ETH)"
                        type="number"
                        fullWidth
                        value={shipbackPayment}
                        onChange={e => setShipbackPayment(e.target.value)}
                        helperText="Must cover the shipping cost. Excess will be refunded."
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenEarlyReturnDialog(false)}>Cancel</Button>
                    <Button onClick={() => handleEarlyReturn(selectedItem!)} color="primary" disabled={loading}>
                        {loading ? 'Processing...' : 'Return Early'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Next Shipper Dialog */}
            <Dialog open={openNextShipperDialog} onClose={() => setOpenNextShipperDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>Next Shipper Requests</DialogTitle>
                <DialogContent>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        To reject a next shipper request, you must return the item to the owner. 
                        You'll need to pay the return shipping cost.
                    </Alert>
                    
                    {nextShipperRequests.length === 0 ? (
                        <Typography color="textSecondary">No pending next shipper requests.</Typography>
                    ) : (
                        <List>
                            {nextShipperRequests.map((request, index) => (
                                <ListItem key={index} divider>
                                    <ListItemText
                                        primary={`Request from ${request.requester}`}
                                        secondary={`Offered: ${request.offeredShippingCost} ETH • ${new Date(request.requestTime * 1000).toLocaleString()}`}
                                    />
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={() => handleAcceptNextShipper(selectedItem!, request.requester)}
                                            disabled={loading}
                                        >
                                            Accept
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            onClick={() => handleRejectNextShipper(selectedItem!, request.requester)}
                                            disabled={loading}
                                        >
                                            Reject
                                        </Button>
                                    </Box>
                                </ListItem>
                            ))}
                        </List>
                    )}
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <TextField
                        margin="dense"
                        label="Return Shipping Payment (ETH)"
                        type="number"
                        fullWidth
                        value={shipbackPayment}
                        onChange={e => setShipbackPayment(e.target.value)}
                        helperText="Required for rejecting next shipper requests"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenNextShipperDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Dispute Dialog */}
            <Dialog open={openDisputeDialog} onClose={() => setOpenDisputeDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Raise Dispute</DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Raising a dispute will affect the borrower's reputation and may impact future lending.
                        Only raise disputes for legitimate concerns.
                    </Alert>
                    <TextField
                        margin="dense"
                        label="Dispute Reason"
                        fullWidth
                        multiline
                        rows={4}
                        value={disputeReason}
                        onChange={e => setDisputeReason(e.target.value)}
                        helperText="Please provide a clear reason for the dispute"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDisputeDialog(false)}>Cancel</Button>
                    <Button onClick={() => handleRaiseDispute(selectedItem!)} color="error" disabled={loading}>
                        {loading ? 'Raising...' : 'Raise Dispute'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Auto-Return Settings Dialog */}
            <Dialog open={openAutoReturnSettingsDialog} onClose={() => setOpenAutoReturnSettingsDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Auto-Return Settings</DialogTitle>
                <DialogContent>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Enable passive early return to automatically return items when conditions are met, 
                        such as when someone requests to be the next borrower or when approaching the maximum lending duration.
                    </Alert>
                    
                    <FormControlLabel
                        control={
                            <Switch
                                checked={autoReturnEnabled}
                                onChange={(e) => setAutoReturnEnabled(e.target.checked)}
                            />
                        }
                        label="Enable Auto-Return"
                        sx={{ mb: 2 }}
                    />
                    
                    {autoReturnEnabled && (
                        <TextField
                            margin="dense"
                            label="Minimum Time Before Auto-Return (days)"
                            type="number"
                            fullWidth
                            value={autoReturnThreshold}
                            onChange={(e) => setAutoReturnThreshold(Number(e.target.value))}
                            helperText="Items won't be auto-returned until this minimum time has passed (1-30 days)"
                            inputProps={{ min: 1, max: 30 }}
                        />
                    )}
                    
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        <strong>Note:</strong> When auto-return is triggered, your security deposit and additional protection will be refunded, 
                        but you won't need to pay for return shipping.
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAutoReturnSettingsDialog(false)}>Cancel</Button>
                    <Button onClick={handleAutoReturnSettings} color="primary" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Settings'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}; 