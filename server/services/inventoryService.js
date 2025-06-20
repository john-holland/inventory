const { wrap } = require("@mikro-orm/core");
const { ShippingService } = require("./shippingService");
const { BillingService } = require("./billingService");
const { ConsumerInvestmentService } = require("./consumerInvestmentService");

class InventoryService {
  constructor(DI) {
    this.DI = DI;
    this.shippingService = new ShippingService(DI);
    this.billingService = new BillingService(DI);
    this.consumerInvestmentService = new ConsumerInvestmentService(DI);
    this.serviceFees = {
      hold: 0.05, // 5% of hold amount - primary revenue source
      shipping: 0.10, // 10% of shipping cost - secondary revenue
      platform: 0.03 // 3% platform fee on successful transactions
    };
  }

  // Create a new item in the inventory
  async createItem(ownerId, itemData) {
    const item = new this.DI.itemRepository.entity(
      ownerId,
      itemData.title,
      itemData.description,
      itemData.category,
      itemData.condition,
      itemData.value,
      itemData.location,
      itemData.shippingMethod
    );

    if (itemData.images) {
      item.images = itemData.images;
    }

    if (itemData.tags) {
      item.tags = itemData.tags;
    }

    await this.DI.itemRepository.persistAndFlush(item);

    // Create transaction for item creation
    const transaction = new this.DI.transactionRepository.entity(
      'item_creation',
      ownerId,
      item.id,
      0,
      `Created item: ${item.title}`,
      'completed'
    );

    await this.DI.transactionRepository.persistAndFlush(transaction);

    return item;
  }

  // Request to hold an item (requires 2x shipping cost)
  async requestHold(itemId, userId, userLocation) {
    const item = await this.DI.itemRepository.findOneOrFail({ id: itemId });
    const user = await this.DI.userRepository.findOneOrFail({ id: userId });

    if (!item.isAvailable) {
      throw new Error('Item is not available for hold');
    }

    // Calculate shipping cost and required hold
    const shippingDetails = this.shippingService.calculateShippingCost(
      item.location,
      userLocation,
      item.shippingMethod,
      item.value
    );

    const requiredHold = shippingDetails.requiredHold;
    const serviceFee = requiredHold * this.serviceFees.hold;
    const totalRequired = requiredHold + serviceFee;

    // Check if user has sufficient available balance
    if (user.availableBalance < totalRequired) {
      throw new Error(`Insufficient balance. Required: $${totalRequired.toFixed(2)}`);
    }

    // Deduct hold amount from user's available balance
    wrap(user).assign({
      availableBalance: user.availableBalance - totalRequired,
      heldBalance: user.heldBalance + requiredHold
    });

    // Update item status
    wrap(item).assign({
      currentHolderId: userId,
      holdAmount: requiredHold,
      isAvailable: false
    });

    // Create transaction records
    const holdTransaction = new this.DI.transactionRepository.entity(
      'hold',
      userId,
      itemId,
      -requiredHold,
      `Hold deposit for item: ${item.title}`,
      'completed'
    );

    const serviceFeeTransaction = new this.DI.transactionRepository.entity(
      'service_fee',
      userId,
      itemId,
      -serviceFee,
      `Service fee for item hold: ${item.title}`,
      'completed'
    );

    // Process energy efficiency revenue
    const energyEconomies = await this.billingService.processOptimisticEnergyEconomies(
      userId,
      'hold',
      requiredHold
    );

    await this.DI.transactionRepository.persistAndFlush(holdTransaction);
    await this.DI.transactionRepository.persistAndFlush(serviceFeeTransaction);
    await this.DI.userRepository.flush();
    await this.DI.itemRepository.flush();

    return {
      item,
      holdAmount: requiredHold,
      serviceFee,
      totalRequired,
      shippingDetails,
      energyEconomies
    };
  }

  // Release hold and return funds
  async releaseHold(itemId, userId) {
    const item = await this.DI.itemRepository.findOneOrFail({ id: itemId });
    const user = await this.DI.userRepository.findOneOrFail({ id: userId });

    if (item.currentHolderId !== userId) {
      throw new Error('User is not the current holder of this item');
    }

    const holdAmount = item.holdAmount;
    const holdDurationDays = (Date.now() - item.updatedAt.getTime()) / (1000 * 60 * 60 * 24);

    // Calculate hold stagnation revenue before release
    const stagnationRevenue = await this.billingService.calculateHoldStagnationRevenue(
      holdDurationDays,
      holdAmount
    );

    // Return hold amount to user (minus stagnation fees if applicable)
    const returnAmount = holdAmount - stagnationRevenue;
    
    wrap(user).assign({
      availableBalance: user.availableBalance + returnAmount,
      heldBalance: user.heldBalance - holdAmount
    });

    // Update item status
    wrap(item).assign({
      currentHolderId: null,
      holdAmount: 0,
      isAvailable: true
    });

    // Create refund transaction
    const refundTransaction = new this.DI.transactionRepository.entity(
      'refund',
      userId,
      itemId,
      returnAmount,
      `Hold refund for item: ${item.title}`,
      'completed'
    );

    // Create stagnation revenue transaction if applicable
    if (stagnationRevenue > 0) {
      const stagnationTransaction = new this.DI.transactionRepository.entity(
        'service_fee',
        userId,
        itemId,
        -stagnationRevenue,
        `Hold stagnation fee for ${Math.floor(holdDurationDays)} days: ${item.title}`,
        'completed'
      );
      stagnationTransaction.metadata = {
        feeType: 'hold_stagnation',
        holdDurationDays: Math.floor(holdDurationDays)
      };
      await this.DI.transactionRepository.persistAndFlush(stagnationTransaction);
    }

    await this.DI.transactionRepository.persistAndFlush(refundTransaction);
    await this.DI.userRepository.flush();
    await this.DI.itemRepository.flush();

    return {
      item,
      refundedAmount: returnAmount,
      stagnationRevenue,
      holdDurationDays: Math.floor(holdDurationDays)
    };
  }

  // Purchase an item (permanent transfer) - optimized for energy economies
  async purchaseItem(itemId, userId, userLocation) {
    const item = await this.DI.itemRepository.findOneOrFail({ id: itemId });
    const user = await this.DI.userRepository.findOneOrFail({ id: userId });

    if (!item.isAvailable) {
      throw new Error('Item is not available for purchase');
    }

    const purchasePrice = item.value;
    const shippingDetails = this.shippingService.calculateShippingCost(
      item.location,
      userLocation,
      item.shippingMethod,
      item.value
    );

    const totalCost = purchasePrice + shippingDetails.baseCost;
    const serviceFee = totalCost * this.serviceFees.shipping;
    const platformFee = totalCost * this.serviceFees.platform;
    const finalTotal = totalCost + serviceFee + platformFee;

    // Check if user has sufficient balance
    if (user.availableBalance < finalTotal) {
      throw new Error(`Insufficient balance. Required: $${finalTotal.toFixed(2)}`);
    }

    // Deduct purchase amount
    wrap(user).assign({
      availableBalance: user.availableBalance - finalTotal
    });

    // Update item status
    wrap(item).assign({
      ownerId: userId,
      currentHolderId: null,
      holdAmount: 0,
      isAvailable: false,
      isShipped: true,
      location: userLocation
    });

    // Create purchase transaction
    const purchaseTransaction = new this.DI.transactionRepository.entity(
      'purchase',
      userId,
      itemId,
      -finalTotal,
      `Purchase of item: ${item.title}`,
      'completed'
    );

    // Create service fee transaction
    const serviceFeeTransaction = new this.DI.transactionRepository.entity(
      'service_fee',
      userId,
      itemId,
      -serviceFee,
      `Shipping service fee for item: ${item.title}`,
      'completed'
    );

    // Create platform fee transaction
    const platformFeeTransaction = new this.DI.transactionRepository.entity(
      'service_fee',
      userId,
      itemId,
      -platformFee,
      `Platform fee for item purchase: ${item.title}`,
      'completed'
    );

    // Process energy efficiency revenue from purchase
    const energyEconomies = await this.billingService.processOptimisticEnergyEconomies(
      userId,
      'purchase',
      totalCost
    );

    // Create shipping route
    const shippingRoute = await this.shippingService.createShippingRoute(
      itemId,
      item.ownerId,
      userId,
      shippingDetails
    );

    await this.DI.transactionRepository.persistAndFlush(purchaseTransaction);
    await this.DI.transactionRepository.persistAndFlush(serviceFeeTransaction);
    await this.DI.transactionRepository.persistAndFlush(platformFeeTransaction);
    await this.DI.itemRepository.flush();

    return {
      item,
      totalCost,
      serviceFee,
      platformFee,
      finalTotal,
      shippingRoute,
      energyEconomies
    };
  }

  // Transfer item between users (for holds that become purchases)
  async transferItem(itemId, fromUserId, toUserId, transferType = 'hold_to_purchase') {
    const item = await this.DI.itemRepository.findOneOrFail({ id: itemId });
    
    if (item.currentHolderId !== fromUserId) {
      throw new Error('User is not the current holder of this item');
    }

    const holdDurationDays = (Date.now() - item.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    const holdAmount = item.holdAmount;

    // Calculate transfer fees based on hold duration
    const transferFee = holdAmount * 0.02; // 2% transfer fee
    const stagnationRevenue = await this.billingService.calculateHoldStagnationRevenue(
      holdDurationDays,
      holdAmount
    );

    // Update item ownership
    wrap(item).assign({
      ownerId: toUserId,
      currentHolderId: toUserId,
      holdAmount: holdAmount - transferFee - stagnationRevenue
    });

    // Create transfer transaction
    const transferTransaction = new this.DI.transactionRepository.entity(
      'transfer',
      toUserId,
      itemId,
      -(holdAmount - transferFee - stagnationRevenue),
      `${transferType} transfer for item: ${item.title}`,
      'completed'
    );

    // Create transfer fee transaction
    const transferFeeTransaction = new this.DI.transactionRepository.entity(
      'service_fee',
      fromUserId,
      itemId,
      -transferFee,
      `Transfer fee for item: ${item.title}`,
      'completed'
    );

    // Create stagnation revenue transaction
    if (stagnationRevenue > 0) {
      const stagnationTransaction = new this.DI.transactionRepository.entity(
        'service_fee',
        fromUserId,
        itemId,
        -stagnationRevenue,
        `Hold stagnation fee for ${Math.floor(holdDurationDays)} days: ${item.title}`,
        'completed'
      );
      stagnationTransaction.metadata = {
        feeType: 'hold_stagnation',
        holdDurationDays: Math.floor(holdDurationDays)
      };
      await this.DI.transactionRepository.persistAndFlush(stagnationTransaction);
    }

    await this.DI.transactionRepository.persistAndFlush(transferTransaction);
    await this.DI.transactionRepository.persistAndFlush(transferFeeTransaction);
    await this.DI.itemRepository.flush();

    return {
      item,
      transferFee,
      stagnationRevenue,
      holdDurationDays: Math.floor(holdDurationDays),
      newHoldAmount: item.holdAmount
    };
  }

  // Get items near a location
  async getItemsNearLocation(lat, lon, radius = 50, category = null) {
    const items = await this.DI.itemRepository.find({
      isAvailable: true
    });

    const nearbyItems = items.filter(item => {
      const distance = this.shippingService.calculateDistance(
        lat, lon,
        item.location.lat, item.location.lon
      );
      
      const categoryMatch = !category || item.category === category;
      return distance <= radius && categoryMatch;
    });

    return nearbyItems.map(item => ({
      ...item,
      distance: this.shippingService.calculateDistance(
        lat, lon,
        item.location.lat, item.location.lon
      )
    })).sort((a, b) => a.distance - b.distance);
  }

  // Get user's inventory (owned and held items)
  async getUserInventory(userId) {
    const ownedItems = await this.DI.itemRepository.find({
      ownerId: userId
    });

    const heldItems = await this.DI.itemRepository.find({
      currentHolderId: userId
    });

    return {
      owned: ownedItems,
      held: heldItems
    };
  }

  // Get hold analytics for a user
  async getUserHoldAnalytics(userId) {
    const heldItems = await this.DI.itemRepository.find({
      currentHolderId: userId,
      holdAmount: { $gt: 0 }
    });

    const analytics = heldItems.map(item => {
      const holdDurationDays = (Date.now() - item.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
      const stagnationRevenue = this.billingService.calculateHoldStagnationRevenue(
        holdDurationDays,
        item.holdAmount
      );

      return {
        itemId: item.id,
        itemTitle: item.title,
        holdAmount: item.holdAmount,
        holdDurationDays: Math.floor(holdDurationDays),
        stagnationRevenue,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      };
    });

    const totalHoldAmount = analytics.reduce((sum, item) => sum + item.holdAmount, 0);
    const totalStagnationRevenue = analytics.reduce((sum, item) => sum + item.stagnationRevenue, 0);
    const averageHoldDuration = analytics.reduce((sum, item) => sum + item.holdDurationDays, 0) / analytics.length;

    return {
      activeHolds: analytics.length,
      totalHoldAmount,
      totalStagnationRevenue,
      averageHoldDuration,
      holdDetails: analytics
    };
  }

  // Place a hold on an item (creates consumer investment)
  async holdItem(userId, itemId, location) {
    const item = await this.DI.itemRepository.findOneOrFail({ id: itemId });
    const user = await this.DI.userRepository.findOneOrFail({ id: userId });

    if (item.currentHolderId) {
      throw new Error('Item is already held by another user');
    }

    if (item.ownerId === userId) {
      throw new Error('Cannot hold your own item');
    }

    // Calculate shipping cost and hold amount (2x shipping cost)
    const shippingCost = await this.calculateShippingCost(item.location, location, item.shippingMethod);
    const holdAmount = shippingCost * 2; // Hold amount is 2x shipping cost

    // Check if user has sufficient balance for hold amount
    if (user.availableBalance < holdAmount) {
      throw new Error(`Insufficient balance. Required: $${holdAmount}, Available: $${user.availableBalance}`);
    }

    // Create consumer investment (50/50 split)
    const investmentResult = await this.consumerInvestmentService.createConsumerInvestment(
      userId,
      itemId,
      holdAmount
    );

    // Update item with hold information
    wrap(item).assign({
      currentHolderId: userId,
      holdAmount: holdAmount,
      holdDate: new Date(),
      status: 'held'
    });

    // Create hold transaction
    const holdTransaction = new this.DI.transactionRepository.entity(
      'item_hold',
      userId,
      itemId,
      -holdAmount,
      `Hold placed on ${item.title}`,
      'completed'
    );

    holdTransaction.metadata = {
      shippingCost: shippingCost,
      holdAmount: holdAmount,
      consumerInvestmentId: investmentResult.consumerInvestment.id,
      location: location
    };

    await this.DI.itemRepository.flush();
    await this.DI.transactionRepository.persistAndFlush(holdTransaction);

    return {
      item,
      holdAmount,
      shippingCost,
      consumerInvestment: investmentResult.consumerInvestment,
      investmentSplit: {
        consumerShare: investmentResult.consumerInvestmentAmount,
        platformShare: investmentResult.platformInvestmentAmount
      }
    };
  }

  // Release a hold on an item (completes consumer investment)
  async releaseHold(userId, itemId) {
    const item = await this.DI.itemRepository.findOneOrFail({ id: itemId });

    if (!item.currentHolderId || item.currentHolderId !== userId) {
      throw new Error('You do not have a hold on this item');
    }

    // Find the consumer investment for this hold
    const consumerInvestment = await this.DI.consumerInvestmentRepository.findOne({
      userId: userId,
      itemId: itemId,
      status: 'active'
    });

    if (!consumerInvestment) {
      throw new Error('No active investment found for this hold');
    }

    // Complete the consumer investment
    const completionResult = await this.consumerInvestmentService.completeConsumerInvestment(
      consumerInvestment.id,
      'hold_release'
    );

    // Update item status
    wrap(item).assign({
      currentHolderId: null,
      holdAmount: 0,
      holdDate: null,
      status: 'available'
    });

    // Create release transaction
    const releaseTransaction = new this.DI.transactionRepository.entity(
      'item_release',
      userId,
      itemId,
      completionResult.totalReturns,
      `Hold released on ${item.title}`,
      'completed'
    );

    releaseTransaction.metadata = {
      originalHoldAmount: item.holdAmount,
      totalReturns: completionResult.totalReturns,
      consumerReturn: completionResult.investment.consumerReturnAmount,
      platformReturn: completionResult.investment.platformReturnAmount,
      sharedReturn: completionResult.investment.sharedReturnAmount,
      investmentId: consumerInvestment.id
    };

    await this.DI.itemRepository.flush();
    await this.DI.transactionRepository.persistAndFlush(releaseTransaction);

    return {
      item,
      originalHoldAmount: item.holdAmount,
      totalReturns: completionResult.totalReturns,
      investmentCompletion: completionResult
    };
  }

  // Purchase an item (completes consumer investment if there's a hold)
  async purchaseItem(userId, itemId, location) {
    const item = await this.DI.itemRepository.findOneOrFail({ id: itemId });
    const user = await this.DI.userRepository.findOneOrFail({ id: userId });
    const owner = await this.DI.userRepository.findOneOrFail({ id: item.ownerId });

    if (item.ownerId === userId) {
      throw new Error('Cannot purchase your own item');
    }

    // Calculate shipping cost
    const shippingCost = await this.calculateShippingCost(item.location, location, item.shippingMethod);
    const totalCost = item.value + shippingCost;

    // Check if user has sufficient balance
    if (user.availableBalance < totalCost) {
      throw new Error(`Insufficient balance. Required: $${totalCost}, Available: $${user.availableBalance}`);
    }

    // Handle existing hold if any
    let holdCompletionResult = null;
    if (item.currentHolderId) {
      if (item.currentHolderId !== userId) {
        throw new Error('Item is held by another user');
      }

      // Complete the consumer investment for the hold
      const consumerInvestment = await this.DI.consumerInvestmentRepository.findOne({
        userId: userId,
        itemId: itemId,
        status: 'active'
      });

      if (consumerInvestment) {
        holdCompletionResult = await this.consumerInvestmentService.completeConsumerInvestment(
          consumerInvestment.id,
          'purchase'
        );
      }
    }

    // Deduct purchase amount from buyer
    wrap(user).assign({
      availableBalance: user.availableBalance - totalCost
    });

    // Add sale amount to owner (minus platform fees)
    const platformFee = totalCost * 0.03; // 3% platform fee
    const ownerAmount = totalCost - platformFee;
    
    wrap(owner).assign({
      availableBalance: owner.availableBalance + ownerAmount
    });

    // Update item ownership
    wrap(item).assign({
      ownerId: userId,
      currentHolderId: null,
      holdAmount: 0,
      holdDate: null,
      status: 'sold',
      soldDate: new Date()
    });

    // Create purchase transaction
    const purchaseTransaction = new this.DI.transactionRepository.entity(
      'item_purchase',
      userId,
      itemId,
      -totalCost,
      `Purchased ${item.title}`,
      'completed'
    );

    purchaseTransaction.metadata = {
      itemValue: item.value,
      shippingCost: shippingCost,
      platformFee: platformFee,
      ownerAmount: ownerAmount,
      holdCompletion: holdCompletionResult ? {
        totalReturns: holdCompletionResult.totalReturns,
        investmentId: holdCompletionResult.investment.id
      } : null
    };

    // Create sale transaction for owner
    const saleTransaction = new this.DI.transactionRepository.entity(
      'item_sale',
      owner.id,
      itemId,
      ownerAmount,
      `Sold ${item.title}`,
      'completed'
    );

    saleTransaction.metadata = {
      itemValue: item.value,
      shippingCost: shippingCost,
      platformFee: platformFee,
      buyerId: userId
    };

    // Create platform fee transaction
    const feeTransaction = new this.DI.transactionRepository.entity(
      'platform_fee',
      null,
      itemId,
      platformFee,
      `Platform fee for ${item.title} sale`,
      'completed'
    );

    feeTransaction.metadata = {
      feeType: 'purchase',
      itemValue: item.value,
      totalAmount: totalCost
    };

    await this.DI.itemRepository.flush();
    await this.DI.userRepository.flush();
    await this.DI.transactionRepository.persistAndFlush(purchaseTransaction);
    await this.DI.transactionRepository.persistAndFlush(saleTransaction);
    await this.DI.transactionRepository.persistAndFlush(feeTransaction);

    return {
      item,
      totalCost,
      shippingCost,
      platformFee,
      ownerAmount,
      holdCompletion: holdCompletionResult
    };
  }

  // Calculate shipping cost
  async calculateShippingCost(fromLocation, toLocation, shippingMethod) {
    // Simplified shipping calculation - in production, integrate with real shipping APIs
    const baseCosts = {
      'flatrate': 10,
      'express': 25,
      'overnight': 50,
      'economy': 5
    };

    const baseCost = baseCosts[shippingMethod] || 10;
    
    // Calculate distance-based cost
    const distance = this.calculateDistance(fromLocation, toLocation);
    const distanceCost = distance * 0.1; // $0.10 per mile

    return baseCost + distanceCost;
  }

  // Calculate distance between two locations
  calculateDistance(location1, location2) {
    const R = 3959; // Earth's radius in miles
    const lat1 = location1.lat * Math.PI / 180;
    const lat2 = location2.lat * Math.PI / 180;
    const deltaLat = (location2.lat - location1.lat) * Math.PI / 180;
    const deltaLon = (location2.lon - location1.lon) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Get user's holds with investment information
  async getUserHolds(userId) {
    const items = await this.DI.itemRepository.find({
      currentHolderId: userId
    });

    const holdsWithInvestments = await Promise.all(
      items.map(async (item) => {
        const consumerInvestment = await this.DI.consumerInvestmentRepository.findOne({
          userId: userId,
          itemId: item.id,
          status: 'active'
        });

        return {
          item,
          consumerInvestment: consumerInvestment ? {
            id: consumerInvestment.id,
            consumerInvestmentAmount: consumerInvestment.consumerInvestmentAmount,
            platformInvestmentAmount: consumerInvestment.platformInvestmentAmount,
            currentValue: consumerInvestment.currentValue,
            returnRate: consumerInvestment.returnRate,
            consumerReturnAmount: consumerInvestment.consumerReturnAmount,
            platformReturnAmount: consumerInvestment.platformReturnAmount,
            sharedReturnAmount: consumerInvestment.sharedReturnAmount,
            createdAt: consumerInvestment.createdAt
          } : null
        };
      })
    );

    return holdsWithInvestments;
  }

  // Get hold analytics with investment data
  async getHoldAnalytics() {
    const activeHolds = await this.DI.itemRepository.find({
      currentHolderId: { $ne: null }
    });

    const analytics = {
      totalActiveHolds: activeHolds.length,
      totalHoldValue: activeHolds.reduce((sum, item) => sum + item.holdAmount, 0),
      averageHoldAmount: activeHolds.length > 0 ? 
        activeHolds.reduce((sum, item) => sum + item.holdAmount, 0) / activeHolds.length : 0,
      holdsByCategory: {},
      investmentData: await this.consumerInvestmentService.getPlatformInvestmentAnalytics()
    };

    // Group holds by category
    activeHolds.forEach(item => {
      if (!analytics.holdsByCategory[item.category]) {
        analytics.holdsByCategory[item.category] = {
          count: 0,
          totalValue: 0
        };
      }
      analytics.holdsByCategory[item.category].count++;
      analytics.holdsByCategory[item.category].totalValue += item.holdAmount;
    });

    return analytics;
  }
}

module.exports = { InventoryService }; 