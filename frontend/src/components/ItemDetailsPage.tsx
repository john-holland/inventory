/**
 * Item Details Page
 * 
 * Comprehensive view of a single inventory item with:
 * - Full item information
 * - Route map (if applicable)
 * - Chat with owner
 * - Action buttons (Request/Buy/View)
 * - External shop links for eBay/Amazon
 */

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  IconButton,
  Avatar,
  Divider,
  Rating,
  Switch,
  FormControlLabel,
  LinearProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  LocationOn as LocationIcon,
  OpenInNew as OpenInNewIcon,
  Chat as ChatIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  LocalShipping as ShippingIcon,
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  AttachMoney as MoneyIcon,
  Speed as SpeedIcon,
  Settings as SettingsIcon,
  SmartToy as RobotIcon,
  Savings as SavingsIcon
} from '@mui/icons-material';
import { mockInventoryItems } from '../data/mockInventoryItems';
import { getItemTypeChip, getPriceLabel, getItemActionConfig, getChatTemplateMessage } from '../utils/itemTypeHelpers';
import { ChatService } from '../services/ChatService';
import { RouteMap } from './RouteMap';
import { WalletService } from '../services/WalletService';
import { dropShippingIntegration } from '../services/DropShippingIntegrationService';
import { InvestmentService } from '../services/InvestmentService';
import { ShipStationService } from '../services/ShipStationService';
import { ShippingService } from '../services/ShippingService';

export const ItemDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const chatService = ChatService.getInstance();
  const walletService = WalletService.getInstance();
  const investmentService = InvestmentService.getInstance();
  const shipStationService = ShipStationService.getInstance();
  const shippingService = ShippingService.getInstance();
  
  const [processing, setProcessing] = useState(false);
  const [investmentStatus, setInvestmentStatus] = useState<any>(null);
  const [riskyModeEnabled, setRiskyModeEnabled] = useState(false);
  const [riskPercentage, setRiskPercentage] = useState(50);
  const [shipStationSettings, setShipStationSettings] = useState({
    autoOptimize: true,
    minimumSavings: 2.00,
    riskTolerance: 'conservative' as 'conservative' | 'moderate' | 'aggressive'
  });
  const [optimizationOpportunity, setOptimizationOpportunity] = useState<any>(null);
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  const [showShipStationModal, setShowShipStationModal] = useState(false);

  // Load investment status on component mount
  React.useEffect(() => {
    const loadInvestmentStatus = async () => {
      if (id) {
        try {
          const status = await investmentService.getInvestmentStatus(id);
          setInvestmentStatus(status);
          setRiskyModeEnabled(status.riskyModeEnabled);
          setRiskPercentage(status.riskPercentage);
          
          // Check for optimization opportunities
          const optimization = await shippingService.checkLabelOptimization(id);
          setOptimizationOpportunity(optimization);
        } catch (error) {
          console.error('Failed to load investment status:', error);
        }
      }
    };
    
    loadInvestmentStatus();
  }, [id, investmentService, shippingService]);

  // Update ShipStation settings
  const handleShipStationSettingsChange = (newSettings: Partial<typeof shipStationSettings>) => {
    const updatedSettings = { ...shipStationSettings, ...newSettings };
    setShipStationSettings(updatedSettings);
    shippingService.updateOptimizationPreferences({
      autoOptimize: updatedSettings.autoOptimize,
      minimumSavings: updatedSettings.minimumSavings,
      riskTolerance: updatedSettings.riskTolerance
    });
  };

  // New event handlers for Plan #3

  /**
   * Enable risky investment mode
   */
  const handleEnableRiskyMode = async () => {
    if (!id) return;
    
    try {
      setProcessing(true);
      
      // Calculate anti-collateral
      const antiCollateral = await investmentService.calculateAntiCollateral(
        investmentStatus?.holdBalance?.shippingHold2x || 0,
        riskPercentage
      );
      
      // Enable risky mode
      const walletId = 'wallet_001'; // Default wallet
      await walletService.enableRiskyInvestmentMode(walletId, id, riskPercentage, antiCollateral);
      
      // Refresh investment status
      const status = await investmentService.getInvestmentStatus(id);
      setInvestmentStatus(status);
      setRiskyModeEnabled(true);
      
      console.log(`✅ Risky investment mode enabled at ${riskPercentage}% risk`);
    } catch (error) {
      console.error('Failed to enable risky mode:', error);
      alert(`Failed to enable risky mode: ${error}`);
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Update risk percentage slider
   */
  const handleRiskPercentageChange = (value: number) => {
    setRiskPercentage(value);
  };

  /**
   * Trigger shipping optimization
   */
  const handleOptimizeShipping = async () => {
    if (!id || !optimizationOpportunity) return;
    
    try {
      setProcessing(true);
      
      const result = await shipStationService.optimizeShippingLabel(`ship_${id}`);
      
      if (result.success) {
        alert(`✅ Shipping optimized! Saved $${result.savings.toFixed(2)}`);
        
        // Refresh optimization opportunities
        const optimization = await shippingService.checkLabelOptimization(id);
        setOptimizationOpportunity(optimization);
      } else {
        alert(`Optimization failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Shipping optimization failed:', error);
      alert(`Optimization failed: ${error}`);
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Toggle auto-reinvestment
   */
  const handleAutoReinvestToggle = async (enabled: boolean) => {
    try {
      await shipStationService.updateOptimizationSettings('user_default', {
        autoReinvestEnabled: enabled
      });
      
      setShipStationSettings(prev => ({ ...prev, autoOptimize: enabled }));
      console.log(`✅ Auto-reinvestment ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Failed to update auto-reinvestment:', error);
    }
  };
  
  const item = mockInventoryItems.find(i => i.id === id);

  if (!item) {
    return (
      <Box sx={{ p: 4, backgroundColor: '#121212', minHeight: '100vh', color: '#fff' }}>
        <Typography variant="h4">Item not found</Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mt: 2, color: '#4caf50' }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  const actionConfig = getItemActionConfig(item);
  const itemTypeChip = getItemTypeChip(item.itemType);
  const priceLabel = getPriceLabel(item);

  const handleAction = () => {
    switch (actionConfig.action) {
      case 'external_link':
        if (actionConfig.externalUrl) {
          window.open(actionConfig.externalUrl, '_blank');
        }
        break;
      case 'request':
      case 'chat':
        // Check if this is a partner-funded request
        if (item.useDropshippingFund && item.dropshippingWalletId) {
          handlePartnerFundedRequest();
        } else {
          handleChatWithOwner();
        }
        break;
      case 'purchase':
        handlePurchase();
        break;
    }
  };

  const handleChatWithOwner = () => {
    // Create or open chat room with owner
    const chatRoom = chatService.createChatRoom(
      `Chat about: ${item.name}`,
      [item.owner, '0xCurrentUser...1234']
    );

    // Send template message
    const templateMessage = getChatTemplateMessage(
      item,
      item.owner,
      window.location.href
    );
    
    chatService.sendMessage(chatRoom.id, {
      sender: '0xCurrentUser...1234',
      content: templateMessage,
      type: 'user'
    });

    alert('Chat opened! Check the chat window in the lower left corner.');
  };

  const handlePurchase = async () => {
    if (!item) return;

    setProcessing(true);
    
    try {
      // For Amazon dropship with inventory sale enabled
      if (item.itemType === 'amazon_dropship' && item.enableInventorySale) {
        // Place order through dropshipping API
        const orderResult = await dropShippingIntegration.placeCharityOrder({
          charityId: 'inventory-platform',
          itemId: item.id,
          quantity: 1,
          shippingAddress: 'User shipping address', // Would come from user settings
          contactInfo: {
            name: 'Current User',
            email: 'user@example.com',
            phone: '555-0100'
          },
          specialInstructions: []
        });

        if (orderResult.success) {
          alert(`Purchase successful! Order ID: ${orderResult.orderId}`);
          // TODO: Add item to user's inventory
        } else {
          alert(`Purchase failed: ${orderResult.error}`);
        }
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Purchase failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePartnerFundedRequest = async () => {
    if (!item || !item.useDropshippingFund || !item.dropshippingWalletId) return;

    setProcessing(true);

    try {
      // Check wallet balance
      const wallet = walletService.getWallet(item.dropshippingWalletId);
      if (!wallet) {
        alert('Dropshipping wallet not found. Please contact the partner.');
        setProcessing(false);
        return;
      }

      if (wallet.balance < item.price) {
        alert(`Insufficient funds in dropshipping wallet. Required: $${item.price}, Available: $${wallet.balance}`);
        setProcessing(false);
        return;
      }

      // Deduct from partner's wallet
      await walletService.deduct(
        item.dropshippingWalletId,
        item.price,
        `Partner-funded item: ${item.name}`,
        item.id
      );

      // Place order via Amazon API
      const orderResult = await dropShippingIntegration.placeCharityOrder({
        charityId: item.owner,
        itemId: item.id,
        quantity: 1,
        shippingAddress: 'User shipping address',
        contactInfo: {
          name: 'Current User',
          email: 'user@example.com',
          phone: '555-0100'
        },
        specialInstructions: ['Partner-funded item']
      });

      if (orderResult.success) {
        // Create chat with partner
        handleChatWithOwner();
        
        alert(`✅ Request successful! Partner has been charged $${item.price}. Item will be added to your inventory (hidden by default). Check your chat for updates!`);
      } else {
        // Refund wallet if order failed
        await walletService.addFunds(
          item.dropshippingWalletId,
          item.price,
          `Refund for failed order: ${item.name}`
        );
        alert(`Order failed: ${orderResult.error}`);
      }
    } catch (error) {
      console.error('Partner-funded request error:', error);
      alert(`Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#121212', minHeight: '100vh', color: '#fff' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ color: '#4caf50' }}
        >
          Back
        </Button>
        {/* Edit button if user is owner */}
        {/* <IconButton sx={{ color: '#4caf50' }}>
          <EditIcon />
        </IconButton> */}
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Image */}
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
            <Box
              component="img"
              src={item.imageUrl || 'https://via.placeholder.com/400x400/1e1e1e/4caf50?text=No+Image'}
              alt={item.name}
              sx={{
                width: '100%',
                height: 300,
                objectFit: 'cover'
              }}
            />
          </Card>
        </Grid>

        {/* Right Column - Details */}
        <Grid item xs={12} md={8}>
          <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333', p: 3 }}>
            <Typography variant="h4" sx={{ color: '#fff', mb: 2 }}>
              {item.name}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Chip
                label={itemTypeChip.label}
                sx={{
                  backgroundColor: itemTypeChip.color,
                  color: '#fff',
                  border: '1px solid #555'
                }}
              />
              <Chip
                label={item.category}
                sx={{
                  backgroundColor: '#333',
                  color: '#ccc'
                }}
              />
              {item.available ? (
                <Chip label="Available" color="success" />
              ) : (
                <Chip label="Unavailable" sx={{ backgroundColor: '#666', color: '#fff' }} />
              )}
            </Box>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Typography variant="body2" sx={{ color: '#999' }}>Price</Typography>
                <Typography variant="h5" sx={{ color: '#4caf50' }}>{priceLabel}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" sx={{ color: '#999' }}>Rating</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Rating value={item.rating} precision={0.1} readOnly size="small" />
                  <Typography variant="body2" sx={{ color: '#ccc', ml: 1 }}>
                    {item.rating}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" sx={{ color: '#999' }}>Location</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationIcon sx={{ fontSize: 16, mr: 0.5, color: '#4caf50' }} />
                  <Typography variant="body2" sx={{ color: '#ccc' }}>{item.location}</Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" sx={{ color: '#999' }}>Distance</Typography>
                <Typography variant="body2" sx={{ color: '#ccc' }}>{item.distance} miles</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ color: '#999' }}>Owner</Typography>
                <Typography variant="body2" sx={{ color: '#ccc' }}>{item.owner}</Typography>
              </Grid>
            </Grid>

            <Divider sx={{ borderColor: '#333', my: 2 }} />

            <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>Description</Typography>
            <Typography variant="body2" sx={{ color: '#ccc', mb: 3 }}>
              {item.description}
            </Typography>

            {/* Tags */}
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 3 }}>
              {item.tags.map(tag => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  sx={{ backgroundColor: '#2a2a2a', color: '#ccc' }}
                />
              ))}
            </Box>

            {/* External Shop Link */}
            {actionConfig.showExternalLink && item.externalUrl && (
              <Button
                variant="outlined"
                startIcon={<OpenInNewIcon />}
                href={item.externalUrl}
                target="_blank"
                sx={{
                  borderColor: '#4caf50',
                  color: '#4caf50',
                  mb: 2,
                  mr: 2,
                  '&:hover': {
                    borderColor: '#66bb6a',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)'
                  }
                }}
              >
                View on {item.itemType === 'ebay' ? 'eBay' : 'Amazon'}
              </Button>
            )}

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<ChatIcon />}
                onClick={handleChatWithOwner}
                sx={{
                  borderColor: '#4caf50',
                  color: '#4caf50',
                  '&:hover': {
                    borderColor: '#66bb6a',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)'
                  }
                }}
              >
                Chat with Owner
              </Button>
              <Button
                variant="contained"
                onClick={handleAction}
                disabled={processing}
                sx={{
                  backgroundColor: '#4caf50',
                  '&:hover': {
                    backgroundColor: '#66bb6a'
                  },
                  '&:disabled': {
                    backgroundColor: '#666'
                  }
                }}
              >
                {processing ? 'Processing...' : actionConfig.label}
              </Button>
            </Box>
          </Card>
        </Grid>

        {/* Investment Status Section */}
        <Grid item xs={12}>
          <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333', p: 3 }}>
            <Typography variant="h6" sx={{ color: '#fff', mb: 2, display: 'flex', alignItems: 'center' }}>
              <TrendingUpIcon sx={{ mr: 1, color: '#4caf50' }} />
              Investment Status
            </Typography>
            
            {investmentStatus && (
              <Box>
                {/* Hold Balances Display */}
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

                {/* Investment Summary */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ color: '#999', mb: 1 }}>
                    Total Investable: ${investmentStatus.holdBalance?.totalInvestable?.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#999', mb: 1 }}>
                    Current Investments: ${investmentStatus.currentInvestments?.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#999' }}>
                    Investment Return: +${investmentStatus.investmentReturn?.toFixed(2) || '0.00'} 
                    (+{investmentStatus.investmentReturnPercentage?.toFixed(1) || '0.0'}%)
                  </Typography>
                </Box>

                {/* Risky Investment Mode Section */}
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
                              '& .MuiLinearProgress-bar': { backgroundColor: '#ff9800' }
                            }}
                          />
                        </Box>
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ color: '#999', mb: 1 }}>
                            Anti-collateral Required: ${investmentStatus.antiCollateralRequired?.toFixed(2) || '0.00'}
                          </Typography>
                        </Box>
                        
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          <Typography variant="body2">
                            ⚠️ Warning: Risky investment mode puts shipping holds at risk. 
                            In case of investment failure, losses will be shared 50/50 between borrower and owner.
                          </Typography>
                        </Alert>
                        
                        <Button
                          variant="outlined"
                          startIcon={<WarningIcon />}
                          onClick={handleEnableRiskyMode}
                          disabled={processing}
                          sx={{
                            borderColor: '#ff9800',
                            color: '#ff9800',
                            '&:hover': { borderColor: '#ffb74d', backgroundColor: 'rgba(255, 152, 0, 0.1)' }
                          }}
                        >
                          Enable Risky Mode
                        </Button>
                      </Box>
                    ) : (
                      <Box>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          <Typography variant="body2">
                            ⚠️ Risky Investment Mode Active ({riskPercentage}% risk)
                          </Typography>
                          <Typography variant="caption">
                            Anti-collateral deposited: ${investmentStatus.antiCollateralDeposited?.toFixed(2) || '0.00'}
                          </Typography>
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

                {/* Investment Actions */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    startIcon={<TrendingUpIcon />}
                    onClick={() => setShowInvestmentModal(true)}
                    disabled={investmentStatus.holdBalance?.totalInvestable === 0}
                    sx={{
                      borderColor: '#4caf50',
                      color: '#4caf50',
                      '&:hover': { borderColor: '#66bb6a', backgroundColor: 'rgba(76, 175, 80, 0.1)' }
                    }}
                  >
                    Investment Options
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<MoneyIcon />}
                    onClick={() => {
                      // Show investment history
                      alert('Investment history would be displayed here');
                    }}
                    sx={{
                      borderColor: '#2196f3',
                      color: '#2196f3',
                      '&:hover': { borderColor: '#42a5f5', backgroundColor: 'rgba(33, 150, 243, 0.1)' }
                    }}
                  >
                    Investment History
                  </Button>
                </Box>
              </Box>
            )}
          </Card>
        </Grid>

        {/* ShipStation Optimization Section */}
        <Grid item xs={12}>
          <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333', p: 3 }}>
            <Typography variant="h6" sx={{ color: '#fff', mb: 2, display: 'flex', alignItems: 'center' }}>
              <ShippingIcon sx={{ mr: 1, color: '#4caf50' }} />
              ShipStation Optimization
            </Typography>
            
            {/* Auto-optimization Toggle */}
            <Box sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={shipStationSettings.autoOptimize}
                    onChange={(e) => handleAutoReinvestToggle(e.target.checked)}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#4caf50' } }}
                  />
                }
                label="Auto-optimization enabled (default: on)"
                sx={{ color: '#fff' }}
              />
            </Box>

            {/* Current Shipping Cost */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ color: '#999', mb: 1 }}>
                Current shipping cost: $15.50
              </Typography>
            </Box>

            {/* Optimization Opportunities */}
            {optimizationOpportunity && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ color: '#999', mb: 1 }}>
                  Optimized rate available: ${(15.50 - optimizationOpportunity.potentialSavings).toFixed(2)}
                </Typography>
                <Typography variant="body2" sx={{ color: '#999', mb: 1 }}>
                  Potential savings: ${optimizationOpportunity.potentialSavings.toFixed(2)}
                </Typography>
                <Typography variant="body2" sx={{ color: '#999', mb: 2 }}>
                  Refund policy: {optimizationOpportunity.recommendedAction.includes('Switch to') ? 'Free' : 'Paid'}
                </Typography>
                
                {optimizationOpportunity.optimizationAvailable && (
                  <Button
                    variant="contained"
                    startIcon={<SpeedIcon />}
                    onClick={handleOptimizeShipping}
                    disabled={processing}
                    sx={{
                      backgroundColor: '#4caf50',
                      '&:hover': { backgroundColor: '#66bb6a' },
                      '&:disabled': { backgroundColor: '#666' }
                    }}
                  >
                    Optimize Now
                  </Button>
                )}
              </Box>
            )}

            {/* Optimization History */}
            <Accordion sx={{ backgroundColor: '#2a2a2a', color: '#fff', mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#4caf50' }} />}>
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center' }}>
                  <SavingsIcon sx={{ mr: 1, color: '#4caf50' }} />
                  Optimization History
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon sx={{ color: '#4caf50' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="UPS Ground Optimization"
                      secondary="Saved $1.25 - Switched from USPS Priority Mail"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon sx={{ color: '#4caf50' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="FedEx Ground Optimization"
                      secondary="Saved $0.75 - Switched from UPS Ground"
                    />
                  </ListItem>
                </List>
              </AccordionDetails>
            </Accordion>

            {/* Settings */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ color: '#999', mb: 1 }}>
                Minimum savings threshold: ${shipStationSettings.minimumSavings}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(shipStationSettings.minimumSavings / 10) * 100} 
                sx={{ 
                  backgroundColor: '#333',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#4caf50' }
                }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ color: '#999', mb: 1 }}>
                Risk tolerance: {shipStationSettings.riskTolerance}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {['conservative', 'moderate', 'aggressive'].map((risk) => (
                  <Chip
                    key={risk}
                    label={risk}
                    size="small"
                    onClick={() => handleShipStationSettingsChange({ riskTolerance: risk as any })}
                    sx={{
                      backgroundColor: shipStationSettings.riskTolerance === risk ? '#4caf50' : '#333',
                      color: '#fff',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </Box>
            </Box>

            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => setShowShipStationModal(true)}
              sx={{
                borderColor: '#4caf50',
                color: '#4caf50',
                '&:hover': { borderColor: '#66bb6a', backgroundColor: 'rgba(76, 175, 80, 0.1)' }
              }}
            >
              Advanced Settings
            </Button>
          </Card>
        </Grid>

        {/* Route Map */}
        {actionConfig.showMap && (
          <Grid item xs={12}>
            <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #333', p: 3 }}>
              <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                Route to Item
              </Typography>
              <RouteMap item={item} />
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

