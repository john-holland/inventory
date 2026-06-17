/**
 * Investment surface views — hold balances, risky mode, invest actions.
 * Local InvestmentService / WalletService boundary until all saurce routes exist.
 */

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CircularProgress,
  Grid,
  LinearProgress,
  Typography,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  AttachMoney as MoneyIcon,
  SmartToy as RobotIcon,
} from '@mui/icons-material';
import { InvestmentService } from '../../services/InvestmentService';
import { WalletService } from '../../services/WalletService';
import type { SurfaceViewProps } from '../types';

/** Parent `idle` (initial). Auto-sends LOAD → `loading`. */
export function InvestmentIdleView({ send }: SurfaceViewProps) {
  useEffect(() => {
    send({ type: 'LOAD' });
  }, [send]);
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
      <CircularProgress size={28} />
    </Box>
  );
}

/** Parent `loading`. on_enter → investment_eligibility (itemId from model). */
export function InvestmentLoadingView() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
      <CircularProgress size={28} />
    </Box>
  );
}

/** Parent `ready`. Incoming: `loading` (DATA_OK). Full investment panel for model.itemId. */
export function InvestmentReadyView({ model, send }: SurfaceViewProps) {
  const itemId = String((model as { itemId?: string })?.itemId || '');
  const investmentService = InvestmentService.getInstance();
  const walletService = WalletService.getInstance();
  const [investmentStatus, setInvestmentStatus] = useState<any>(null);
  const [riskyModeEnabled, setRiskyModeEnabled] = useState(false);
  const [riskPercentage] = useState(50);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!itemId) return;
    void (async () => {
      try {
        const status = await investmentService.getInvestmentStatus(itemId);
        setInvestmentStatus(status);
        setRiskyModeEnabled(status.riskyModeEnabled);
      } catch (e) {
        console.error('Failed to load investment status:', e);
      }
    })();
  }, [itemId, investmentService, model]);

  const handleEnableRiskyMode = async () => {
    if (!itemId) return;
    send({ type: 'ENABLE_RISKY_MODE', itemId, riskPercentage });
  };

  const refreshStatus = async () => {
    if (!itemId) return;
    const status = await investmentService.getInvestmentStatus(itemId);
    setInvestmentStatus(status);
    setRiskyModeEnabled(status.riskyModeEnabled);
  };

  if (!itemId) {
    return <Alert severity="warning">Item id required for investment surface.</Alert>;
  }

  if (!investmentStatus) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333', p: 3 }}>
      <Typography variant="h6" sx={{ color: '#fff', mb: 2, display: 'flex', alignItems: 'center' }}>
        <TrendingUpIcon sx={{ mr: 1, color: '#4caf50' }} />
        Investment Status
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Box sx={{ p: 2, backgroundColor: '#2a2a2a', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ color: '#999', mb: 1 }}>
              Shipping Holds (2x)
            </Typography>
            <Typography variant="h6" sx={{ color: '#ff9800' }}>
              ${investmentStatus.holdBalance?.shippingHold2x?.toFixed(2) || '0.00'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#ccc' }}>
              Non-investable
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} md={4}>
          <Box sx={{ p: 2, backgroundColor: '#2a2a2a', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ color: '#999', mb: 1 }}>
              Additional Holds (3rd x)
            </Typography>
            <Typography variant="h6" sx={{ color: '#4caf50' }}>
              ${investmentStatus.holdBalance?.additionalHold?.toFixed(2) || '0.00'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#ccc' }}>
              Investable
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} md={4}>
          <Box sx={{ p: 2, backgroundColor: '#2a2a2a', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ color: '#999', mb: 1 }}>
              Insurance Holds
            </Typography>
            <Typography variant="h6" sx={{ color: '#4caf50' }}>
              ${investmentStatus.holdBalance?.insuranceHold?.toFixed(2) || '0.00'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#ccc' }}>
              Investable after shipping
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ color: '#999', mb: 1 }}>
          Total Investable: ${investmentStatus.holdBalance?.totalInvestable?.toFixed(2) || '0.00'}
        </Typography>
        <Typography variant="body2" sx={{ color: '#999', mb: 1 }}>
          Current Investments: ${investmentStatus.currentInvestments?.toFixed(2) || '0.00'}
        </Typography>
        <Typography variant="body2" sx={{ color: '#999' }}>
          Investment Return: +${investmentStatus.investmentReturn?.toFixed(2) || '0.00'} (+
          {investmentStatus.investmentReturnPercentage?.toFixed(1) || '0.0'}%)
        </Typography>
      </Box>

      <Accordion sx={{ backgroundColor: '#2a2a2a', color: '#fff', mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#4caf50' }} />}>
          <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center' }}>
            <WarningIcon sx={{ mr: 1, color: '#ff9800' }} />
            Risky Investment Mode
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {!riskyModeEnabled ? (
            <Box>
              <Typography variant="body2" sx={{ color: '#ccc', mb: 2 }}>
                Enable risky investment mode to invest shipping holds (2x) with additional collateral.
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#999', mb: 1 }}>
                  Risk Percentage: {riskPercentage}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={riskPercentage}
                  sx={{
                    backgroundColor: '#333',
                    '& .MuiLinearProgress-bar': { backgroundColor: '#ff9800' },
                  }}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#999', mb: 1 }}>
                  Anti-collateral Required: $
                  {investmentStatus.antiCollateralRequired?.toFixed(2) || '0.00'}
                </Typography>
              </Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Risky investment mode puts shipping holds at risk. Losses may be shared 50/50 between
                borrower and owner.
              </Alert>
              <Button
                variant="outlined"
                startIcon={<WarningIcon />}
                onClick={handleEnableRiskyMode}
                disabled={processing}
                sx={{
                  borderColor: '#ff9800',
                  color: '#ff9800',
                  '&:hover': { borderColor: '#ffb74d', backgroundColor: 'rgba(255, 152, 0, 0.1)' },
                }}
              >
                Enable Risky Mode
              </Button>
            </Box>
          ) : (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Risky Investment Mode Active ({riskPercentage}% risk)
              </Alert>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <RobotIcon sx={{ mr: 1, color: investmentStatus.robotsActive ? '#4caf50' : '#666' }} />
                <Typography variant="body2" sx={{ color: '#ccc' }}>
                  Investment Robots: {investmentStatus.robotsActive ? 'Active' : 'Inactive'}
                </Typography>
              </Box>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          startIcon={<TrendingUpIcon />}
          disabled={investmentStatus.holdBalance?.totalInvestable === 0}
          sx={{
            borderColor: '#4caf50',
            color: '#4caf50',
            '&:hover': { borderColor: '#66bb6a', backgroundColor: 'rgba(76, 175, 80, 0.1)' },
          }}
          onClick={() => alert('Investment options modal — local UI boundary')}
        >
          Investment Options
        </Button>
        <Button
          variant="outlined"
          startIcon={<MoneyIcon />}
          sx={{
            borderColor: '#2196f3',
            color: '#2196f3',
            '&:hover': { borderColor: '#42a5f5', backgroundColor: 'rgba(33, 150, 243, 0.1)' },
          }}
          onClick={() => alert('Investment history would be displayed here')}
        >
          Investment History
        </Button>
        <Button variant="text" size="small" onClick={() => void refreshStatus()}>
          Refresh
        </Button>
      </Box>
    </Card>
  );
}

/** Parent `submitting`. Cave on_enter → investment_mode_enable; local WalletService fallback then DATA_OK. */
export function InvestmentSubmittingView({ model, send }: SurfaceViewProps) {
  const itemId = String((model as { itemId?: string })?.itemId || '');
  const investmentService = InvestmentService.getInstance();
  const walletService = WalletService.getInstance();

  useEffect(() => {
    if (!itemId) {
      send({ type: 'CAVE_FAIL' });
      return;
    }
    void (async () => {
      try {
        const status = await investmentService.getInvestmentStatus(itemId);
        const shipping2x = status?.holdBalance?.shippingHold2x || 0;
        const riskPercentage = 50;
        const amountAtRisk = (shipping2x * riskPercentage) / 100;
        const antiCollateral = await investmentService.calculateAntiCollateral(amountAtRisk, riskPercentage);
        const walletId = 'wallet_001';
        await walletService.enableRiskyInvestmentMode(walletId, itemId, riskPercentage, antiCollateral);
        send({ type: 'DATA_OK' });
      } catch (e) {
        console.error('Investment submit failed:', e);
        send({ type: 'CAVE_FAIL', error: String(e) });
      }
    })();
  }, [itemId, investmentService, walletService, send]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
      <CircularProgress size={24} />
      <Typography sx={{ color: '#ccc' }}>Enabling risky investment mode…</Typography>
    </Box>
  );
}

export function InvestmentErrorView({ send, model }: SurfaceViewProps) {
  const err = (model as { error?: string })?.error || 'Investment request failed';
  return (
    <Alert severity="error" action={<Button size="small" onClick={() => send({ type: 'RETRY' })}>Retry</Button>}>
      {err}
    </Alert>
  );
}

export function PresenceSignInView({ send }: SurfaceViewProps) {
  return (
    <Alert
      severity="warning"
      action={
        <Button size="small" onClick={() => send({ type: 'PRESENCE_VERIFIED' })}>
          Continue
        </Button>
      }
    >
      Sign in required for investment operations.
    </Alert>
  );
}

export const investmentViews = {
  InvestmentIdleView,
  InvestmentLoadingView,
  InvestmentReadyView,
  InvestmentSubmittingView,
  InvestmentErrorView,
  PresenceSignInView,
};
