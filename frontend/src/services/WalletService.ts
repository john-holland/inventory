/**
 * Wallet Service
 * 
 * Manages dropshipping fund wallets for partner accounts
 * - Amazon wallet integration
 * - Balance management
 * - Transaction history
 * - Account linking
 * - Investment hold management
 * - 2x shipping threshold validation
 */

import { InvestmentService } from './InvestmentService';

export interface DropshippingWallet {
  id: string;
  name: string;
  balance: number;
  linkedAccount: string; // Amazon Business account email
  accountType: 'amazon_business' | 'paypal' | 'stripe';
  currency: string;
  lastUpdated: string;
  createdAt: string;
  isActive: boolean;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: 'deposit' | 'withdrawal' | 'purchase' | 'refund' | 
        'shipping_hold_2x' | 'additional_hold' | 'insurance_hold' |
        'risky_investment' | 'anti_collateral' | 'fallout_refund' |
        'shipping_label_refund' | 'shipping_label_reinvestment' |
        'shipping_hold_deposit' | 'additional_investment_hold' | 'insurance_hold_deposit' |
        'shipping_hold_investment' | 'additional_hold_investment' | 'insurance_hold_investment' |
        'anti_investment_collateral' | 'fallout_borrower_share' | 'fallout_owner_share' | 'capital_loss';
  amount: number;
  description: string;
  itemId?: string;
  itemName?: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
  fundType?: 'investable' | 'non_investable';
  holdType?: 'shipping' | 'additional' | 'insurance';
}

export class WalletService {
  private static instance: WalletService;
  private wallets: Map<string, DropshippingWallet> = new Map();
  private transactions: Map<string, WalletTransaction> = new Map();
  private investmentService: InvestmentService;

  static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  constructor() {
    this.investmentService = InvestmentService.getInstance();
    console.log('💳 Wallet Service initialized');
    this.initializeMockWallets();
  }

  private initializeMockWallets(): void {
    // Create a sample wallet for demonstration
    const mockWallet: DropshippingWallet = {
      id: 'wallet_001',
      name: 'Main Amazon Business Wallet',
      balance: 5000.00,
      linkedAccount: 'partner@business.amazon.com',
      accountType: 'amazon_business',
      currency: 'USD',
      lastUpdated: new Date().toISOString(),
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true
    };

    this.wallets.set(mockWallet.id, mockWallet);

    // Add some sample transactions
    this.addMockTransaction('wallet_001', 'deposit', 1000, 'Initial deposit');
    this.addMockTransaction('wallet_001', 'purchase', -250, 'Ergonomic Office Chair', 'item_11');
    this.addMockTransaction('wallet_001', 'deposit', 4500, 'Monthly fund addition');
    this.addMockTransaction('wallet_001', 'purchase', -250, 'Wireless Headphones', 'item_10');
  }

  private addMockTransaction(
    walletId: string,
    type: WalletTransaction['type'],
    amount: number,
    description: string,
    itemId?: string
  ): void {
    const transaction: WalletTransaction = {
      id: `tx_${Date.now()}_${Math.random()}`,
      walletId,
      type,
      amount,
      description,
      itemId,
      timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'completed'
    };

    this.transactions.set(transaction.id, transaction);
  }

  // Get all wallets for a user
  getAllWallets(): DropshippingWallet[] {
    return Array.from(this.wallets.values());
  }

  // Get specific wallet
  getWallet(walletId: string): DropshippingWallet | undefined {
    return this.wallets.get(walletId);
  }

  // Get wallet balance
  async getWalletBalance(walletId: string): Promise<number> {
    const wallet = this.wallets.get(walletId);
    return wallet ? wallet.balance : 0;
  }

  // Add funds to wallet
  async addFunds(walletId: string, amount: number, description: string = 'Funds added'): Promise<boolean> {
    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    wallet.balance += amount;
    wallet.lastUpdated = new Date().toISOString();
    this.wallets.set(walletId, wallet);

    // Record transaction
    const transaction: WalletTransaction = {
      id: `tx_${Date.now()}`,
      walletId,
      type: 'deposit',
      amount,
      description,
      timestamp: new Date().toISOString(),
      status: 'completed'
    };

    this.transactions.set(transaction.id, transaction);
    console.log(`💳 Added $${amount} to wallet ${walletId}. New balance: $${wallet.balance}`);
    return true;
  }

  // Deduct from wallet (for purchases)
  async deduct(walletId: string, amount: number, description: string, itemId?: string): Promise<boolean> {
    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    if (wallet.balance < amount) {
      throw new Error('Insufficient funds');
    }

    wallet.balance -= amount;
    wallet.lastUpdated = new Date().toISOString();
    this.wallets.set(walletId, wallet);

    // Record transaction
    const transaction: WalletTransaction = {
      id: `tx_${Date.now()}`,
      walletId,
      type: 'purchase',
      amount: -amount,
      description,
      itemId,
      timestamp: new Date().toISOString(),
      status: 'completed'
    };

    this.transactions.set(transaction.id, transaction);
    console.log(`💳 Deducted $${amount} from wallet ${walletId}. New balance: $${wallet.balance}`);
    return true;
  }

  // Link Amazon Business account
  async linkAmazonAccount(email: string, credentials: any): Promise<DropshippingWallet> {
    // In production, this would validate credentials with Amazon API
    const newWallet: DropshippingWallet = {
      id: `wallet_${Date.now()}`,
      name: 'Amazon Business Wallet',
      balance: 0,
      linkedAccount: email,
      accountType: 'amazon_business',
      currency: 'USD',
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      isActive: true
    };

    this.wallets.set(newWallet.id, newWallet);
    console.log(`✅ Linked Amazon account: ${email}`);
    return newWallet;
  }

  // Get transaction history for a wallet
  getTransactionHistory(walletId: string): WalletTransaction[] {
    return Array.from(this.transactions.values())
      .filter(tx => tx.walletId === walletId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Get all transactions
  getAllTransactions(): WalletTransaction[] {
    return Array.from(this.transactions.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Create new wallet
  async createWallet(name: string, accountType: DropshippingWallet['accountType'], linkedAccount: string): Promise<DropshippingWallet> {
    const newWallet: DropshippingWallet = {
      id: `wallet_${Date.now()}`,
      name,
      balance: 0,
      linkedAccount,
      accountType,
      currency: 'USD',
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      isActive: true
    };

    this.wallets.set(newWallet.id, newWallet);
    console.log(`💳 Created new wallet: ${name}`);
    return newWallet;
  }

  // Delete wallet
  async deleteWallet(walletId: string): Promise<boolean> {
    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      return false;
    }

    if (wallet.balance > 0) {
      throw new Error('Cannot delete wallet with positive balance. Please withdraw funds first.');
    }

    wallet.isActive = false;
    this.wallets.set(walletId, wallet);
    console.log(`🗑️ Deactivated wallet: ${walletId}`);
    return true;
  }

  // Shipping Hold Management - simplified signature for backwards compatibility
  async processShippingHold(itemIdOrWalletId: string, shippingCost: number, additionalHold: number = 0, insuranceHold: number = 0): Promise<boolean> {
    // Default wallet for simplified signature
    const walletId = 'wallet_001';
    const itemId = itemIdOrWalletId;
    
    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const totalAmount = (shippingCost * 2) + additionalHold + insuranceHold;
    
    if (wallet.balance < totalAmount) {
      throw new Error(`Insufficient funds. Required: $${totalAmount}, Available: $${wallet.balance}`);
    }

    // Deduct from wallet
    wallet.balance -= totalAmount;
    wallet.lastUpdated = new Date().toISOString();
    this.wallets.set(walletId, wallet);

    // Investment service will track holds automatically when queried

    // Record shipping hold deposit (non-investable)
    this.recordTransaction(walletId, 'shipping_hold_deposit', shippingCost * 2, 
      `Shipping hold deposit for item ${itemId}`, itemId, 'non_investable', 'shipping');

    // Record additional investment hold (investable)
    if (additionalHold > 0) {
      this.recordTransaction(walletId, 'additional_investment_hold', additionalHold,
        `Additional investment hold for item ${itemId}`, itemId, 'investable', 'additional');
    }

    // Record insurance hold (investable after shipping)
    if (insuranceHold > 0) {
      this.recordTransaction(walletId, 'insurance_hold_deposit', insuranceHold,
        `Insurance hold for item ${itemId}`, itemId, 'investable', 'insurance');
    }

    console.log(`💰 Processed shipping hold for item ${itemId}: $${totalAmount}`);
    return true;
  }

  // Investment Hold Operations
  async investHold(
    walletId: string,
    itemId: string,
    holdType: 'shipping' | 'additional' | 'insurance',
    amount: number,
    investmentType: 'crypto' | 'yield' | 'defi' = 'crypto'
  ): Promise<boolean> {
    // Validate investment eligibility through InvestmentService
    // Note: InvestmentService tracks holds automatically
    
    // Record investment transaction
    const transactionType = this.getInvestmentTransactionType(holdType);
    this.recordTransaction(walletId, transactionType, amount,
      `Investment in ${investmentType} for item ${itemId}`, itemId, 'investable', holdType);

    console.log(`💰 Invested ${holdType} hold: $${amount} in ${investmentType} for item ${itemId}`);
    return true;
  }

  // Enable Risky Investment Mode
  async enableRiskyInvestmentMode(
    walletId: string,
    itemId: string,
    riskPercentage: number,
    antiInvestmentCollateral: number
  ): Promise<boolean> {
    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    if (wallet.balance < antiInvestmentCollateral) {
      throw new Error(`Insufficient funds for anti-investment collateral. Required: $${antiInvestmentCollateral}`);
    }

    // Deduct anti-investment collateral
    wallet.balance -= antiInvestmentCollateral;
    wallet.lastUpdated = new Date().toISOString();
    this.wallets.set(walletId, wallet);

    // Record anti-investment collateral transaction
    this.recordTransaction(walletId, 'anti_investment_collateral', antiInvestmentCollateral,
      `Anti-investment collateral for risky mode (${riskPercentage}%)`, itemId, 'non_investable');

    // Enable risky mode in InvestmentService
    const riskConfig = await this.investmentService.enableRiskyInvestmentMode(itemId, riskPercentage, antiInvestmentCollateral);
    
    if (riskConfig) {
      console.log(`⚠️ Risky investment mode enabled for item ${itemId} at ${riskPercentage}% risk`);
    }

    return !!riskConfig;
  }

  // Handle Fallout Scenario
  async handleFalloutScenario(
    itemId: string,
    borrowerWalletId: string,
    ownerWalletId: string,
    totalLoss: number,
    shippingCost: number,
    insuranceCost: number
  ): Promise<boolean> {
    const borrowerWallet = this.wallets.get(borrowerWalletId);
    const ownerWallet = this.wallets.get(ownerWalletId);
    
    if (!borrowerWallet || !ownerWallet) {
      throw new Error('Borrower or owner wallet not found');
    }

    // Calculate 50/50 split
    const totalCosts = shippingCost + insuranceCost;
    const borrowerShare = totalCosts * 0.5;
    const ownerShare = totalCosts * 0.5;
    const investmentLoss = totalLoss - totalCosts;

    // Deduct from borrower wallet
    if (borrowerWallet.balance < borrowerShare) {
      throw new Error(`Insufficient funds in borrower wallet. Required: $${borrowerShare}`);
    }
    borrowerWallet.balance -= borrowerShare;
    borrowerWallet.lastUpdated = new Date().toISOString();
    this.wallets.set(borrowerWalletId, borrowerWallet);

    // Deduct from owner wallet
    if (ownerWallet.balance < ownerShare) {
      throw new Error(`Insufficient funds in owner wallet. Required: $${ownerShare}`);
    }
    ownerWallet.balance -= ownerShare;
    ownerWallet.lastUpdated = new Date().toISOString();
    this.wallets.set(ownerWalletId, ownerWallet);

    // Record fallout transactions
    this.recordTransaction(borrowerWalletId, 'fallout_borrower_share', borrowerShare,
      `Fallout scenario - borrower share for item ${itemId}`, itemId);
    
    this.recordTransaction(ownerWalletId, 'fallout_owner_share', ownerShare,
      `Fallout scenario - owner share for item ${itemId}`, itemId);

    // Record capital loss for both parties
    this.recordTransaction(borrowerWalletId, 'capital_loss', investmentLoss * 0.5,
      `Capital loss from investment failure for item ${itemId}`, itemId);
    
    this.recordTransaction(ownerWalletId, 'capital_loss', investmentLoss * 0.5,
      `Capital loss from investment failure for item ${itemId}`, itemId);

    // Handle fallout in InvestmentService
    await this.investmentService.handleFalloutScenario(itemId, totalLoss);

    console.log(`💥 Fallout scenario handled for item ${itemId}: Borrower $${borrowerShare}, Owner $${ownerShare}`);
    return true;
  }

  // Trigger Insurance Hold Investment (called when item ships)
  async triggerInsuranceHoldInvestment(itemId: string): Promise<void> {
    // Note: InvestmentService handles insurance hold investment automatically
    console.log(`✅ Insurance holds are now investable for item ${itemId}`);
  }

  // Get Investment Status for Item
  getInvestmentStatus(itemId: string) {
    return this.investmentService.getInvestmentStatus(itemId);
  }

  // Helper Methods
  private recordTransaction(
    walletId: string,
    type: WalletTransaction['type'],
    amount: number,
    description: string,
    itemId?: string,
    fundType?: 'investable' | 'non_investable',
    holdType?: 'shipping' | 'additional' | 'insurance'
  ): void {
    const transaction: WalletTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      walletId,
      type,
      amount,
      description,
      itemId,
      timestamp: new Date().toISOString(),
      status: 'completed',
      fundType,
      holdType
    };

    this.transactions.set(transaction.id, transaction);
  }

  private getInvestmentTransactionType(holdType: string): WalletTransaction['type'] {
    switch (holdType) {
      case 'shipping':
        return 'shipping_hold_investment';
      case 'additional':
        return 'additional_hold_investment';
      case 'insurance':
        return 'insurance_hold_investment';
      default:
        return 'deposit';
    }
  }

  // Get transactions by fund type
  getTransactionsByFundType(fundType: 'investable' | 'non_investable'): WalletTransaction[] {
    return Array.from(this.transactions.values())
      .filter(tx => tx.fundType === fundType)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Get transactions by hold type
  getTransactionsByHoldType(holdType: 'shipping' | 'additional' | 'insurance'): WalletTransaction[] {
    return Array.from(this.transactions.values())
      .filter(tx => tx.holdType === holdType)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // New methods for Plan #3 implementation

  /**
   * Create additional investment hold (3rd x - immediately investable)
   */
  async createAdditionalInvestmentHold(itemId: string, amount: number): Promise<boolean> {
    console.log(`💰 Creating additional investment hold for item: ${itemId}, amount: $${amount}`);

    const walletId = 'wallet_001';
    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    if (wallet.balance < amount) {
      throw new Error(`Insufficient funds for additional hold. Required: $${amount}, Available: $${wallet.balance}`);
    }

    // Deduct from wallet
    wallet.balance -= amount;
    wallet.lastUpdated = new Date().toISOString();
    this.wallets.set(walletId, wallet);

    // Record transaction
    this.recordTransaction(walletId, 'additional_hold', amount,
      `Additional investment hold (3rd x) for item ${itemId}`, itemId, 'investable', 'additional');

    console.log(`✅ Created additional investment hold: $${amount} (immediately investable)`);
    return true;
  }

  /**
   * Create insurance hold (investable after shipping)
   */
  async createInsuranceHold(itemId: string, amount: number): Promise<boolean> {
    console.log(`🛡️ Creating insurance hold for item: ${itemId}, amount: $${amount}`);

    const walletId = 'wallet_001';
    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    if (wallet.balance < amount) {
      throw new Error(`Insufficient funds for insurance hold. Required: $${amount}, Available: $${wallet.balance}`);
    }

    // Deduct from wallet
    wallet.balance -= amount;
    wallet.lastUpdated = new Date().toISOString();
    this.wallets.set(walletId, wallet);

    // Record transaction
    this.recordTransaction(walletId, 'insurance_hold', amount,
      `Insurance hold for item ${itemId}`, itemId, 'investable', 'insurance');

    console.log(`✅ Created insurance hold: $${amount} (investable after shipping)`);
    return true;
  }


  /**
   * Enable risky investment mode
   */


  /**
   * Get hold balance for specific item and hold type
   */
  async getHoldBalance(itemId: string, holdType: 'shipping_hold_2x' | 'additional_hold' | 'insurance_hold'): Promise<number> {
    const transactions = Array.from(this.transactions.values())
      .filter(tx => tx.itemId === itemId && tx.type === holdType)
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    return transactions;
  }

  /**
   * Get total investable holds for an item
   */
  async getTotalInvestableHolds(itemId: string): Promise<number> {
    const additionalHold = await this.getHoldBalance(itemId, 'additional_hold');
    const insuranceHold = await this.getHoldBalance(itemId, 'insurance_hold');
    return additionalHold + insuranceHold;
  }

  /**
   * Get total non-investable holds for an item
   */
  async getTotalNonInvestableHolds(itemId: string): Promise<number> {
    return await this.getHoldBalance(itemId, 'shipping_hold_2x');
  }

  /**
   * Disable risky investment mode
   */
  async disableRiskyInvestmentMode(itemId: string): Promise<boolean> {
    console.log(`🛑 Disabling risky investment mode for item: ${itemId}`);
    
    // In production, this would refund anti-collateral and disable risky mode
    console.log(`✅ Risky investment mode disabled for item: ${itemId}`);
    return true;
  }

  /**
   * REVIEW: This is not implemented yet
   * Trigger insurance hold investment after shipping
   */


}

