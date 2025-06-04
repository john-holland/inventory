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
    TextField
} from '@mui/material';
import { InventoryService, InventoryItem } from '../services/InventoryService';

interface InventoryListProps {
    inventoryService: InventoryService;
}

export const InventoryList: React.FC<InventoryListProps> = ({ inventoryService }) => {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
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
            const itemId = await inventoryService.createItem(
                newItem.name,
                newItem.description,
                newItem.shippingCost,
                newItem.buyoutPrice
            );
            const item = await inventoryService.getItem(itemId);
            setItems([...items, item]);
            setOpenDialog(false);
        } catch (error) {
            console.error('Error creating item:', error);
        }
    };

    const handleLendItem = async (item: InventoryItem) => {
        try {
            await inventoryService.lendItem(item.id, item.shippingCost);
            const updatedItem = await inventoryService.getItem(item.id);
            setItems(items.map(i => i.id === item.id ? updatedItem : i));
        } catch (error) {
            console.error('Error lending item:', error);
        }
    };

    const handleReturnItem = async (item: InventoryItem) => {
        try {
            await inventoryService.returnItem(item.id);
            const updatedItem = await inventoryService.getItem(item.id);
            setItems(items.map(i => i.id === item.id ? updatedItem : i));
        } catch (error) {
            console.error('Error returning item:', error);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
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
                                <Typography variant="h6">{item.name}</Typography>
                                <Typography color="textSecondary">{item.description}</Typography>
                                <Typography>
                                    Shipping Cost: {item.shippingCost} ETH
                                </Typography>
                                {item.buyoutPrice && (
                                    <Typography>
                                        Buyout Price: {item.buyoutPrice} ETH
                                    </Typography>
                                )}
                                <Typography>
                                    Status: {item.status}
                                </Typography>
                                <Box sx={{ mt: 2 }}>
                                    {item.status === 'AVAILABLE' && (
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={() => handleLendItem(item)}
                                        >
                                            Lend
                                        </Button>
                                    )}
                                    {item.status === 'LENT' && item.currentHolderId === 'CURRENT_USER_ADDRESS' && (
                                        <Button
                                            variant="contained"
                                            color="secondary"
                                            onClick={() => handleReturnItem(item)}
                                        >
                                            Return
                                        </Button>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
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
                    <Button onClick={handleCreateItem} color="primary">
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}; 