/**
 * Partner Dashboard
 * 
 * Manage dropshipping fund wallets and Amazon Business account integration
 * - View wallet balances
 * - Add funds
 * - Link Amazon accounts
 * - View transaction history
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Alert
} from '@mui/material';
import {
  AccountBalance as WalletIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Link as LinkIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { WalletService, type DropshippingWallet, type WalletTransaction } from '../services/WalletService';

export const PartnerDashboard: React.FC = () => {
  const [wallets, setWallets] = useState<DropshippingWallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<DropshippingWallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [addFundsDialogOpen, setAddFundsDialogOpen] = useState(false);
  const [linkAccountDialogOpen, setLinkAccountDialogOpen] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [newAccountEmail, setNewAccountEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const walletService = WalletService.getInstance();

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = () => {
    const allWallets = walletService.getAllWallets();
    setWallets(allWallets);
    
    if (allWallets.length > 0 && !selectedWallet) {
      setSelectedWallet(allWallets[0]);
      loadTransactions(allWallets[0].id);
    }
  };

  const loadTransactions = (walletId: string) => {
    const txHistory = walletService.getTransactionHistory(walletId);
    setTransactions(txHistory);
  };

  const handleSelectWallet = (wallet: DropshippingWallet) => {
    setSelectedWallet(wallet);
    loadTransactions(wallet.id);
  };

  const handleAddFunds = async () => {
    if (!selectedWallet) return;

    const amount = parseFloat(fundAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      await walletService.addFunds(selectedWallet.id, amount);
      setSuccess(`Successfully added $${amount} to your wallet!`);
      setFundAmount('');
      setAddFundsDialogOpen(false);
      loadWallets();
      loadTransactions(selectedWallet.id);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add funds');
    }
  };

  const handleLinkAccount = async () => {
    if (!newAccountEmail) {
      setError('Please enter an Amazon Business account email');
      return;
    }

    try {
      await walletService.linkAmazonAccount(newAccountEmail, {});
      setSuccess('Amazon Business account linked successfully!');
      setNewAccountEmail('');
      setLinkAccountDialogOpen(false);
      loadWallets();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to link account');
    }
  };

  const getTotalBalance = () => {
    return wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6" sx={{ color: '#fff' }}>
          Dropshipping Fund Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<LinkIcon />}
            onClick={() => setLinkAccountDialogOpen(true)}
            sx={{
              borderColor: '#4caf50',
              color: '#4caf50',
              '&:hover': {
                borderColor: '#66bb6a',
                backgroundColor: 'rgba(76, 175, 80, 0.1)'
              }
            }}
          >
            Link Amazon Account
          </Button>
          <IconButton onClick={loadWallets} sx={{ color: '#4caf50' }}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

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

      {/* Wallet Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: '#23272b', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="body2" sx={{ color: '#999', mb: 1 }}>
                Total Balance
              </Typography>
              <Typography variant="h3" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                ${getTotalBalance().toFixed(2)}
              </Typography>
              <Typography variant="caption" sx={{ color: '#666' }}>
                Across {wallets.length} wallet{wallets.length !== 1 ? 's' : ''}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {wallets.map(wallet => (
          <Grid item xs={12} md={4} key={wallet.id}>
            <Card
              sx={{
                backgroundColor: selectedWallet?.id === wallet.id ? '#2a3a2a' : '#23272b',
                border: selectedWallet?.id === wallet.id ? '2px solid #4caf50' : '1px solid #333',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: '#4caf50'
                }
              }}
              onClick={() => handleSelectWallet(wallet)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <WalletIcon sx={{ color: '#4caf50' }} />
                  <Chip
                    label={wallet.accountType.replace('_', ' ').toUpperCase()}
                    size="small"
                    sx={{ backgroundColor: '#2e7d32', color: '#fff' }}
                  />
                </Box>
                <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                  {wallet.name}
                </Typography>
                <Typography variant="h5" sx={{ color: '#4caf50', fontWeight: 'bold', mb: 1 }}>
                  ${wallet.balance.toFixed(2)}
                </Typography>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  {wallet.linkedAccount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Wallet Actions */}
      {selectedWallet && (
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddFundsDialogOpen(true)}
            sx={{
              backgroundColor: '#4caf50',
              '&:hover': {
                backgroundColor: '#66bb6a'
              }
            }}
          >
            Add Funds
          </Button>
        </Box>
      )}

      {/* Transaction History */}
      {selectedWallet && (
        <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <HistoryIcon sx={{ mr: 1, color: '#4caf50' }} />
              <Typography variant="h6" sx={{ color: '#fff' }}>
                Transaction History
              </Typography>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#999', borderColor: '#333' }}>Date</TableCell>
                    <TableCell sx={{ color: '#999', borderColor: '#333' }}>Type</TableCell>
                    <TableCell sx={{ color: '#999', borderColor: '#333' }}>Description</TableCell>
                    <TableCell align="right" sx={{ color: '#999', borderColor: '#333' }}>Amount</TableCell>
                    <TableCell sx={{ color: '#999', borderColor: '#333' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ color: '#666', borderColor: '#333', textAlign: 'center' }}>
                        No transactions yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((tx) => (
                      <TableRow key={tx.id} sx={{ '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.05)' } }}>
                        <TableCell sx={{ color: '#ccc', borderColor: '#333' }}>
                          {new Date(tx.timestamp).toLocaleDateString()}
                        </TableCell>
                        <TableCell sx={{ color: '#ccc', borderColor: '#333' }}>
                          <Chip
                            label={tx.type}
                            size="small"
                            sx={{
                              backgroundColor: tx.type === 'deposit' ? '#2e7d32' : '#d32f2f',
                              color: '#fff',
                              textTransform: 'capitalize'
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: '#ccc', borderColor: '#333' }}>
                          {tx.description}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            color: tx.amount > 0 ? '#4caf50' : '#f44336',
                            fontWeight: 'bold',
                            borderColor: '#333'
                          }}
                        >
                          {tx.amount > 0 ? '+' : ''}${tx.amount.toFixed(2)}
                        </TableCell>
                        <TableCell sx={{ borderColor: '#333' }}>
                          <Chip
                            label={tx.status}
                            size="small"
                            color={tx.status === 'completed' ? 'success' : 'default'}
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Add Funds Dialog */}
      <Dialog
        open={addFundsDialogOpen}
        onClose={() => setAddFundsDialogOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#1e1e1e',
            border: '1px solid #333'
          }
        }}
      >
        <DialogTitle sx={{ color: '#fff' }}>Add Funds to Wallet</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#ccc', mb: 2 }}>
            Add funds to your {selectedWallet?.name}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Amount (USD)"
            type="number"
            fullWidth
            value={fundAmount}
            onChange={(e) => setFundAmount(e.target.value)}
            sx={{
              '& .MuiInputLabel-root': { color: '#999' },
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                '& fieldset': { borderColor: '#4caf50' },
                '&:hover fieldset': { borderColor: '#66bb6a' },
                '&.Mui-focused fieldset': { borderColor: '#4caf50' }
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddFundsDialogOpen(false)} sx={{ color: '#999' }}>
            Cancel
          </Button>
          <Button
            onClick={handleAddFunds}
            variant="contained"
            sx={{
              backgroundColor: '#4caf50',
              '&:hover': { backgroundColor: '#66bb6a' }
            }}
          >
            Add Funds
          </Button>
        </DialogActions>
      </Dialog>

      {/* Link Account Dialog */}
      <Dialog
        open={linkAccountDialogOpen}
        onClose={() => setLinkAccountDialogOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#1e1e1e',
            border: '1px solid #333'
          }
        }}
      >
        <DialogTitle sx={{ color: '#fff' }}>Link Amazon Business Account</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#ccc', mb: 2 }}>
            Connect your Amazon Business account to manage dropshipping funds
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Amazon Business Email"
            type="email"
            fullWidth
            value={newAccountEmail}
            onChange={(e) => setNewAccountEmail(e.target.value)}
            sx={{
              '& .MuiInputLabel-root': { color: '#999' },
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                '& fieldset': { borderColor: '#4caf50' },
                '&:hover fieldset': { borderColor: '#66bb6a' },
                '&.Mui-focused fieldset': { borderColor: '#4caf50' }
              }
            }}
          />
          <Typography variant="caption" sx={{ color: '#666', mt: 1, display: 'block' }}>
            Note: In production, you would authenticate via Amazon OAuth
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkAccountDialogOpen(false)} sx={{ color: '#999' }}>
            Cancel
          </Button>
          <Button
            onClick={handleLinkAccount}
            variant="contained"
            sx={{
              backgroundColor: '#4caf50',
              '&:hover': { backgroundColor: '#66bb6a' }
            }}
          >
            Link Account
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};





