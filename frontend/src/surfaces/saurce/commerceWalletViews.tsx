/**
 * View components registered for commerce_wallet withState handlers.
 */

import React, { useEffect, useState } from 'react';
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
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  AccountBalance as WalletIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Link as LinkIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { WalletService, type DropshippingWallet, type WalletTransaction } from '../../services/WalletService';
import type { SurfaceViewProps } from '../types';

export function WalletIdleView({ send }: SurfaceViewProps) {
  useEffect(() => {
    send({ type: 'LOAD' });
  }, [send]);
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
      <CircularProgress />
    </Box>
  );
}

export function WalletLoadingView() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
      <CircularProgress />
    </Box>
  );
}

export function WalletErrorView({ send, model }: SurfaceViewProps) {
  const err = (model as { error?: string })?.error || 'Wallet request failed';
  return (
    <Alert
      severity="error"
      action={
        <Button color="inherit" size="small" onClick={() => send({ type: 'RETRY' })}>
          Retry
        </Button>
      }
    >
      {err}
    </Alert>
  );
}

export function PresenceSignInView({ send }: SurfaceViewProps) {
  return (
    <Alert
      severity="warning"
      action={
        <Button color="inherit" size="small" onClick={() => send({ type: 'PRESENCE_VERIFIED' })}>
          Continue
        </Button>
      }
    >
      Sign in required to access wallet data.
    </Alert>
  );
}

export function WalletReadyView({ send, model }: SurfaceViewProps) {
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

  const loadWallets = async () => {
    await walletService.syncLedgerFromSaurce();
    const allWallets = walletService.getAllWallets();
    setWallets(allWallets);
    if (allWallets.length > 0) {
      setSelectedWallet((prev) => prev || allWallets[0]);
      loadTransactions(allWallets[0].id);
    }
  };

  const loadTransactions = (walletId: string) => {
    setTransactions(walletService.getTransactionHistory(walletId));
  };

  useEffect(() => {
    void loadWallets();
  }, [model]);

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
      await loadWallets();
      if (selectedWallet) loadTransactions(selectedWallet.id);
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add funds');
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
      await loadWallets();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to link account');
    }
  };

  const getTotalBalance = () => wallets.reduce((sum, w) => sum + w.balance, 0);

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
            sx={{ borderColor: '#4caf50', color: '#4caf50' }}
          >
            Link Amazon Account
          </Button>
          <IconButton onClick={() => { void loadWallets(); send({ type: 'REFRESH' }); }} sx={{ color: '#4caf50' }}>
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
            </CardContent>
          </Card>
        </Grid>
        {wallets.map((wallet) => (
          <Grid item xs={12} md={4} key={wallet.id}>
            <Card
              sx={{
                backgroundColor: selectedWallet?.id === wallet.id ? '#2a3a2a' : '#23272b',
                border: selectedWallet?.id === wallet.id ? '2px solid #4caf50' : '1px solid #333',
                cursor: 'pointer',
              }}
              onClick={() => handleSelectWallet(wallet)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <WalletIcon sx={{ color: '#4caf50' }} />
                  <Chip label={wallet.accountType.replace('_', ' ').toUpperCase()} size="small" />
                </Box>
                <Typography variant="h6" sx={{ color: '#fff' }}>
                  {wallet.name}
                </Typography>
                <Typography variant="h5" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                  ${wallet.balance.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {selectedWallet && (
        <>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddFundsDialogOpen(true)} sx={{ mb: 3, backgroundColor: '#4caf50' }}>
            Add Funds
          </Button>
          <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <HistoryIcon sx={{ mr: 1, color: '#4caf50' }} />
                <Typography variant="h6" sx={{ color: '#fff' }}>
                  Transaction History
                </Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#999' }}>Date</TableCell>
                      <TableCell sx={{ color: '#999' }}>Type</TableCell>
                      <TableCell sx={{ color: '#999' }}>Description</TableCell>
                      <TableCell align="right" sx={{ color: '#999' }}>Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} sx={{ color: '#666', textAlign: 'center' }}>
                          No transactions yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell sx={{ color: '#ccc' }}>{new Date(tx.timestamp).toLocaleDateString()}</TableCell>
                          <TableCell sx={{ color: '#ccc' }}>{tx.type}</TableCell>
                          <TableCell sx={{ color: '#ccc' }}>{tx.description}</TableCell>
                          <TableCell align="right" sx={{ color: tx.amount > 0 ? '#4caf50' : '#f44336' }}>
                            {tx.amount > 0 ? '+' : ''}${tx.amount.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={addFundsDialogOpen} onClose={() => setAddFundsDialogOpen(false)}>
        <DialogTitle>Add Funds</DialogTitle>
        <DialogContent>
          <TextField label="Amount (USD)" type="number" fullWidth value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddFundsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddFunds} variant="contained">Add Funds</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={linkAccountDialogOpen} onClose={() => setLinkAccountDialogOpen(false)}>
        <DialogTitle>Link Amazon Business Account</DialogTitle>
        <DialogContent>
          <TextField label="Email" type="email" fullWidth value={newAccountEmail} onChange={(e) => setNewAccountEmail(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkAccountDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleLinkAccount} variant="contained">Link</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export const commerceWalletViews = {
  WalletIdleView,
  WalletLoadingView,
  WalletReadyView,
  WalletErrorView,
  PresenceSignInView,
};
