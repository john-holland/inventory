const { wrap } = require("@mikro-orm/core");

class DropShippingService {
  constructor(DI) {
    this.DI = DI;
    this.commissionRates = {
      affiliate: 0.04, // 4% affiliate commission
      platform: 0.02, // 2% platform commission
      curator: 0.01   // 1% curator commission
    };
  }

  // Create a new drop shipping list
  async createDropShippingList(userId, listData) {
    const user = await this.DI.userRepository.findOneOrFail({ id: userId });

    const list = new this.DI.dropShippingListRepository.entity(
      userId,
      listData.title,
      listData.description,
      listData.category,
      'active',
      listData.visibility || 'public'
    );

    list.tags = listData.tags || [];
    list.metadata = {
      ...list.metadata,
      targetAudience: listData.targetAudience || '',
      priceRange: listData.priceRange || { min: 0, max: 0 },
      estimatedShipping: listData.estimatedShipping || 0
    };

    await this.DI.dropShippingListRepository.persistAndFlush(list);

    // Create transaction for list creation
    const transaction = new this.DI.transactionRepository.entity(
      'list_creation',
      userId,
      null,
      0,
      `Created drop shipping list: ${list.title}`,
      'completed'
    );

    transaction.metadata = {
      listId: list.id,
      category: list.category,
      visibility: list.visibility
    };

    await this.DI.transactionRepository.persistAndFlush(transaction);

    return list;
  }

  // Add product to drop shipping list
  async addProductToList(listId, productId, position, notes = null) {
    const list = await this.DI.dropShippingListRepository.findOneOrFail({ id: listId });
    const product = await this.DI.amazonProductRepository.findOneOrFail({ id: productId });

    // Check if product is already in the list
    const existingProduct = await this.DI.listProductRepository.findOne({
      listId: listId,
      productId: productId,
      status: 'active'
    });

    if (existingProduct) {
      throw new Error('Product is already in this list');
    }

    const listProduct = new this.DI.listProductRepository.entity(
      listId,
      productId,
      position,
      notes,
      'active'
    );

    await this.DI.listProductRepository.persistAndFlush(listProduct);

    // Update list metadata
    const listProducts = await this.DI.listProductRepository.find({
      listId: listId,
      status: 'active'
    });

    const totalProducts = listProducts.length;
    const totalValue = listProducts.reduce((sum, lp) => {
      return sum + (product.price * lp.recommendedQuantity);
    }, 0);

    wrap(list).assign({
      metadata: {
        ...list.metadata,
        totalProducts: totalProducts,
        lastUpdated: new Date()
      }
    });

    await this.DI.dropShippingListRepository.flush();

    return listProduct;
  }

  // Remove product from drop shipping list
  async removeProductFromList(listId, productId) {
    const listProduct = await this.DI.listProductRepository.findOne({
      listId: listId,
      productId: productId,
      status: 'active'
    });

    if (!listProduct) {
      throw new Error('Product not found in list');
    }

    wrap(listProduct).assign({
      status: 'removed'
    });

    await this.DI.listProductRepository.flush();

    return listProduct;
  }

  // Get drop shipping list with products
  async getDropShippingList(listId, includeProducts = true) {
    const list = await this.DI.dropShippingListRepository.findOneOrFail({ id: listId });

    if (includeProducts) {
      const listProducts = await this.DI.listProductRepository.find({
        listId: listId,
        status: 'active'
      }, {
        orderBy: { position: 'ASC' }
      });

      const products = await Promise.all(
        listProducts.map(async (lp) => {
          const product = await this.DI.amazonProductRepository.findOne({ id: lp.productId });
          return {
            listProduct: lp,
            product: product
          };
        })
      );

      return {
        list,
        products
      };
    }

    return { list };
  }

  // Get all drop shipping lists with filters
  async getDropShippingLists(filters = {}) {
    const query = {
      status: 'active'
    };

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.visibility) {
      query.visibility = filters.visibility;
    }

    if (filters.featured) {
      query.featured = true;
    }

    if (filters.creatorId) {
      query.creatorId = filters.creatorId;
    }

    const lists = await this.DI.dropShippingListRepository.find(query, {
      orderBy: filters.sortBy || { createdAt: 'DESC' },
      limit: filters.limit || 50,
      offset: filters.offset || 0
    });

    return lists;
  }

  // Search drop shipping lists
  async searchDropShippingLists(searchTerm, filters = {}) {
    const lists = await this.DI.dropShippingListRepository.find({
      status: 'active',
      $or: [
        { title: { $ilike: `%${searchTerm}%` } },
        { description: { $ilike: `%${searchTerm}%` } },
        { tags: { $contains: searchTerm } }
      ]
    }, {
      orderBy: { rating: 'DESC' },
      limit: filters.limit || 20
    });

    return lists;
  }

  // Rate a drop shipping list
  async rateDropShippingList(userId, listId, rating, review = null) {
    const list = await this.DI.dropShippingListRepository.findOneOrFail({ id: listId });

    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Check if user has already rated this list
    const existingRating = await this.DI.transactionRepository.findOne({
      userId: userId,
      type: 'list_rating',
      metadata: { listId: listId }
    });

    if (existingRating) {
      throw new Error('You have already rated this list');
    }

    // Update list rating
    const newRatingCount = list.ratingCount + 1;
    const newRating = ((list.rating * list.ratingCount) + rating) / newRatingCount;

    wrap(list).assign({
      rating: newRating,
      ratingCount: newRatingCount
    });

    await this.DI.dropShippingListRepository.flush();

    // Create rating transaction
    const ratingTransaction = new this.DI.transactionRepository.entity(
      'list_rating',
      userId,
      listId,
      rating,
      `Rated list: ${list.title}`,
      'completed'
    );

    ratingTransaction.metadata = {
      listId: listId,
      rating: rating,
      review: review
    };

    await this.DI.transactionRepository.persistAndFlush(ratingTransaction);

    return {
      list,
      rating,
      review
    };
  }

  // Purchase product from drop shipping list
  async purchaseFromList(userId, listId, productId, quantity = 1, shippingAddress = null) {
    const user = await this.DI.userRepository.findOneOrFail({ id: userId });
    const list = await this.DI.dropShippingListRepository.findOneOrFail({ id: listId });
    const listProduct = await this.DI.listProductRepository.findOne({
      listId: listId,
      productId: productId,
      status: 'active'
    });

    if (!listProduct) {
      throw new Error('Product not found in list');
    }

    const product = await this.DI.amazonProductRepository.findOneOrFail({ id: productId });

    // Check product availability
    if (product.availability !== 'in_stock') {
      throw new Error('Product is not available');
    }

    // Calculate total cost
    const subtotal = product.price * quantity;
    const shippingCost = product.freeShipping ? 0 : (product.metadata.estimatedShipping || 10);
    const taxAmount = subtotal * 0.08; // Simplified tax calculation
    const totalAmount = subtotal + shippingCost + taxAmount;

    // Check if user has sufficient balance
    if (user.availableBalance < totalAmount) {
      throw new Error(`Insufficient balance. Required: $${totalAmount}, Available: $${user.availableBalance}`);
    }

    // Create Amazon order
    const amazonOrder = new this.DI.amazonOrderRepository.entity(
      userId,
      `AMZ_${Date.now()}`, // Generate Amazon order ID
      productId,
      listId,
      quantity,
      totalAmount,
      'pending'
    );

    amazonOrder.shippingAddress = shippingAddress || user.defaultAddress || {};
    amazonOrder.billingAddress = user.defaultAddress || {};
    amazonOrder.shippingCost = shippingCost;
    amazonOrder.taxAmount = taxAmount;
    amazonOrder.subtotal = subtotal;
    amazonOrder.primeEligible = product.primeEligible;
    amazonOrder.freeShipping = product.freeShipping;

    // Calculate commissions
    const affiliateCommission = subtotal * this.commissionRates.affiliate;
    const platformCommission = subtotal * this.commissionRates.platform;
    const curatorCommission = subtotal * this.commissionRates.curator;

    amazonOrder.metadata = {
      ...amazonOrder.metadata,
      affiliateCommission: affiliateCommission,
      platformCommission: platformCommission,
      curatorCommission: curatorCommission
    };

    // Deduct amount from user's balance
    wrap(user).assign({
      availableBalance: user.availableBalance - totalAmount
    });

    // Update list statistics
    wrap(list).assign({
      purchaseCount: list.purchaseCount + 1,
      totalRevenue: list.totalRevenue + totalAmount
    });

    // Update list product statistics
    wrap(listProduct).assign({
      purchaseCount: listProduct.purchaseCount + 1,
      revenue: listProduct.revenue + totalAmount
    });

    // Create purchase transaction
    const purchaseTransaction = new this.DI.transactionRepository.entity(
      'amazon_purchase',
      userId,
      productId,
      -totalAmount,
      `Purchased ${product.title} from list: ${list.title}`,
      'completed'
    );

    purchaseTransaction.metadata = {
      listId: listId,
      productId: productId,
      quantity: quantity,
      amazonOrderId: amazonOrder.amazonOrderId,
      commissions: {
        affiliate: affiliateCommission,
        platform: platformCommission,
        curator: curatorCommission
      }
    };

    await this.DI.amazonOrderRepository.persistAndFlush(amazonOrder);
    await this.DI.dropShippingListRepository.flush();
    await this.DI.listProductRepository.flush();
    await this.DI.userRepository.flush();
    await this.DI.transactionRepository.persistAndFlush(purchaseTransaction);

    return {
      order: amazonOrder,
      product: product,
      list: list,
      totalAmount: totalAmount,
      commissions: {
        affiliate: affiliateCommission,
        platform: platformCommission,
        curator: curatorCommission
      }
    };
  }

  // Get trending drop shipping lists
  async getTrendingLists(limit = 10) {
    const lists = await this.DI.dropShippingListRepository.find({
      status: 'active',
      visibility: 'public'
    }, {
      orderBy: { purchaseCount: 'DESC' },
      limit: limit
    });

    return lists;
  }

  // Get user's drop shipping lists
  async getUserLists(userId, includeStats = true) {
    const lists = await this.DI.dropShippingListRepository.find({
      creatorId: userId
    }, {
      orderBy: { createdAt: 'DESC' }
    });

    if (includeStats) {
      const listsWithStats = await Promise.all(
        lists.map(async (list) => {
          const listProducts = await this.DI.listProductRepository.find({
            listId: list.id,
            status: 'active'
          });

          const totalProducts = listProducts.length;
          const totalValue = listProducts.reduce((sum, lp) => sum + lp.revenue, 0);

          return {
            ...list,
            stats: {
              totalProducts,
              totalValue,
              averageRating: list.rating,
              totalRatings: list.ratingCount
            }
          };
        })
      );

      return listsWithStats;
    }

    return lists;
  }

  // Get drop shipping analytics
  async getDropShippingAnalytics() {
    const totalLists = await this.DI.dropShippingListRepository.count({ status: 'active' });
    const totalProducts = await this.DI.listProductRepository.count({ status: 'active' });
    const totalPurchases = await this.DI.amazonOrderRepository.count({ status: { $ne: 'cancelled' } });
    const totalRevenue = await this.DI.amazonOrderRepository.find({ status: { $ne: 'cancelled' } });

    const revenueSum = totalRevenue.reduce((sum, order) => sum + order.totalAmount, 0);

    const topLists = await this.DI.dropShippingListRepository.find({
      status: 'active'
    }, {
      orderBy: { purchaseCount: 'DESC' },
      limit: 5
    });

    const topProducts = await this.DI.listProductRepository.find({
      status: 'active'
    }, {
      orderBy: { purchaseCount: 'DESC' },
      limit: 10
    });

    return {
      totalLists,
      totalProducts,
      totalPurchases,
      totalRevenue: revenueSum,
      topLists,
      topProducts
    };
  }

  // Update product prices in lists
  async updateListProductPrices() {
    const listProducts = await this.DI.listProductRepository.find({
      status: 'active'
    });

    const updates = [];

    for (const listProduct of listProducts) {
      const product = await this.DI.amazonProductRepository.findOne({ id: listProduct.productId });
      
      if (product && product.metadata.lastPriceUpdate) {
        const hoursSinceUpdate = (Date.now() - product.metadata.lastPriceUpdate.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceUpdate > 24) { // Update prices older than 24 hours
          // In a real implementation, you would call Amazon API to get fresh prices
          updates.push({
            productId: product.id,
            listId: listProduct.listId,
            currentPrice: product.price,
            lastUpdate: product.metadata.lastPriceUpdate
          });
        }
      }
    }

    return {
      totalProducts: listProducts.length,
      productsToUpdate: updates.length,
      updates
    };
  }
}

module.exports = { DropShippingService }; 