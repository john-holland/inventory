const { Router } = require("express");
const jwt = require("jsonwebtoken");
const { AmazonService } = require("../services/amazonService");
const { DropShippingService } = require("../services/dropShippingService");

const router = Router();

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication token required"
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }
};

const AmazonController = (DI) => {
  const amazonService = new AmazonService(DI);
  const dropShippingService = new DropShippingService(DI);

  // Connect Amazon account
  router.post("/connect", authenticateToken, async (req, res) => {
    try {
      const { userId } = req.user;
      const { amazonUserId, amazonEmail, amazonAccessToken, refreshToken } = req.body;

      // Check if user already has Amazon account connected
      const existingAmazonUser = await DI.amazonUserRepository.findOne({
        userId: userId
      });

      if (existingAmazonUser) {
        return res.status(400).json({
          success: false,
          message: 'Amazon account already connected'
        });
      }

      const amazonUser = new DI.amazonUserRepository.entity(
        userId,
        amazonUserId,
        amazonEmail,
        amazonAccessToken,
        refreshToken,
        'active'
      );

      await DI.amazonUserRepository.persistAndFlush(amazonUser);

      res.json({
        success: true,
        message: 'Amazon account connected successfully',
        amazonUser: {
          id: amazonUser.id,
          amazonUserId: amazonUser.amazonUserId,
          amazonEmail: amazonUser.amazonEmail,
          status: amazonUser.status,
          lastSync: amazonUser.lastSync
        }
      });
    } catch (error) {
      console.error('Error connecting Amazon account:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to connect Amazon account'
      });
    }
  });

  // Disconnect Amazon account
  router.post("/disconnect", authenticateToken, async (req, res) => {
    try {
      const { userId } = req.user;

      const amazonUser = await DI.amazonUserRepository.findOne({
        userId: userId
      });

      if (!amazonUser) {
        return res.status(404).json({
          success: false,
          message: 'Amazon account not found'
        });
      }

      const { wrap } = require("@mikro-orm/core");
      wrap(amazonUser).assign({
        status: 'inactive'
      });

      await DI.amazonUserRepository.flush();

      res.json({
        success: true,
        message: 'Amazon account disconnected successfully'
      });
    } catch (error) {
      console.error('Error disconnecting Amazon account:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to disconnect Amazon account'
      });
    }
  });

  // Get Amazon account status
  router.get("/status", authenticateToken, async (req, res) => {
    try {
      const { userId } = req.user;

      const amazonUser = await DI.amazonUserRepository.findOne({
        userId: userId
      });

      if (!amazonUser) {
        return res.json({
          success: true,
          connected: false,
          message: 'No Amazon account connected'
        });
      }

      res.json({
        success: true,
        connected: true,
        amazonUser: {
          id: amazonUser.id,
          amazonUserId: amazonUser.amazonUserId,
          amazonEmail: amazonUser.amazonEmail,
          status: amazonUser.status,
          lastSync: amazonUser.lastSync,
          preferences: amazonUser.preferences,
          metadata: amazonUser.metadata
        }
      });
    } catch (error) {
      console.error('Error getting Amazon account status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get Amazon account status'
      });
    }
  });

  // Search Amazon products
  router.get("/search", async (req, res) => {
    try {
      const { keywords, category, minPrice, maxPrice, sortBy } = req.query;

      if (!keywords) {
        return res.status(400).json({
          success: false,
          message: 'Keywords are required'
        });
      }

      const results = await amazonService.searchProducts(
        keywords,
        category,
        minPrice,
        maxPrice,
        sortBy
      );

      res.json({
        success: true,
        results
      });
    } catch (error) {
      console.error('Error searching products:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search products'
      });
    }
  });

  // Get product details
  router.get("/products/:asin", async (req, res) => {
    try {
      const { asin } = req.params;

      if (!asin) {
        return res.status(400).json({
          success: false,
          message: 'ASIN is required'
        });
      }

      const product = await amazonService.getProductDetails(asin);

      res.json({
        success: true,
        product
      });
    } catch (error) {
      console.error('Error getting product details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get product details'
      });
    }
  });

  // Get product recommendations
  router.get("/products/:asin/recommendations", async (req, res) => {
    try {
      const { asin } = req.params;
      const { category } = req.query;

      if (!asin) {
        return res.status(400).json({
          success: false,
          message: 'ASIN is required'
        });
      }

      const recommendations = await amazonService.getProductRecommendations(asin, category);

      res.json({
        success: true,
        recommendations
      });
    } catch (error) {
      console.error('Error getting product recommendations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get product recommendations'
      });
    }
  });

  // Get product reviews
  router.get("/products/:asin/reviews", async (req, res) => {
    try {
      const { asin } = req.params;
      const { page = 1 } = req.query;

      if (!asin) {
        return res.status(400).json({
          success: false,
          message: 'ASIN is required'
        });
      }

      const reviews = await amazonService.getProductReviews(asin, parseInt(page));

      res.json({
        success: true,
        reviews
      });
    } catch (error) {
      console.error('Error getting product reviews:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get product reviews'
      });
    }
  });

  // Check product availability
  router.get("/products/:asin/availability", async (req, res) => {
    try {
      const { asin } = req.params;

      if (!asin) {
        return res.status(400).json({
          success: false,
          message: 'ASIN is required'
        });
      }

      const availability = await amazonService.checkProductAvailability(asin);

      res.json({
        success: true,
        availability
      });
    } catch (error) {
      console.error('Error checking product availability:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check product availability'
      });
    }
  });

  // Get trending products
  router.get("/trending", async (req, res) => {
    try {
      const { category, limit = 20 } = req.query;

      const products = await amazonService.getTrendingProducts(category, parseInt(limit));

      res.json({
        success: true,
        products
      });
    } catch (error) {
      console.error('Error getting trending products:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get trending products'
      });
    }
  });

  // Get deals
  router.get("/deals", async (req, res) => {
    try {
      const { category, minDiscount = 20 } = req.query;

      const deals = await amazonService.getDeals(category, parseInt(minDiscount));

      res.json({
        success: true,
        deals
      });
    } catch (error) {
      console.error('Error getting deals:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get deals'
      });
    }
  });

  // Sync Amazon user data
  router.post("/sync", authenticateToken, async (req, res) => {
    try {
      const { userId } = req.user;

      const amazonUser = await DI.amazonUserRepository.findOne({
        userId: userId
      });

      if (!amazonUser) {
        return res.status(404).json({
          success: false,
          message: 'Amazon account not found'
        });
      }

      const syncResult = await amazonService.syncAmazonUserData(amazonUser.amazonUserId);

      res.json({
        success: true,
        syncResult
      });
    } catch (error) {
      console.error('Error syncing Amazon user data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to sync Amazon user data'
      });
    }
  });

  // Get user's Amazon orders
  router.get("/orders", authenticateToken, async (req, res) => {
    try {
      const { userId } = req.user;
      const { status, limit = 50, offset = 0 } = req.query;

      const query = { userId: userId };

      if (status) {
        query.status = status;
      }

      const orders = await DI.amazonOrderRepository.find(query, {
        orderBy: { orderDate: 'DESC' },
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const totalOrders = await DI.amazonOrderRepository.count(query);

      res.json({
        success: true,
        orders,
        pagination: {
          total: totalOrders,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < totalOrders
        }
      });
    } catch (error) {
      console.error('Error getting user orders:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user orders'
      });
    }
  });

  // Get order details
  router.get("/orders/:orderId", authenticateToken, async (req, res) => {
    try {
      const { orderId } = req.params;
      const { userId } = req.user;

      const order = await DI.amazonOrderRepository.findOne({
        id: orderId,
        userId: userId
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      const product = await DI.amazonProductRepository.findOne({ id: order.productId });
      const list = order.listId ? await DI.dropShippingListRepository.findOne({ id: order.listId }) : null;

      res.json({
        success: true,
        order: {
          ...order,
          product,
          list
        }
      });
    } catch (error) {
      console.error('Error getting order details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get order details'
      });
    }
  });

  // Update Amazon user preferences
  router.put("/preferences", authenticateToken, async (req, res) => {
    try {
      const { userId } = req.user;
      const { preferences } = req.body;

      const amazonUser = await DI.amazonUserRepository.findOne({
        userId: userId
      });

      if (!amazonUser) {
        return res.status(404).json({
          success: false,
          message: 'Amazon account not found'
        });
      }

      const { wrap } = require("@mikro-orm/core");
      wrap(amazonUser).assign({
        preferences: {
          ...amazonUser.preferences,
          ...preferences
        }
      });

      await DI.amazonUserRepository.flush();

      res.json({
        success: true,
        message: 'Preferences updated successfully',
        preferences: amazonUser.preferences
      });
    } catch (error) {
      console.error('Error updating Amazon user preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update preferences'
      });
    }
  });

  // Get Amazon integration analytics
  router.get("/analytics", authenticateToken, async (req, res) => {
    try {
      const { userId } = req.user;

      const amazonUser = await DI.amazonUserRepository.findOne({
        userId: userId
      });

      if (!amazonUser) {
        return res.status(404).json({
          success: false,
          message: 'Amazon account not found'
        });
      }

      const totalOrders = await DI.amazonOrderRepository.count({ userId: userId });
      const totalSpent = await DI.amazonOrderRepository.find({ userId: userId });
      const totalSpentAmount = totalSpent.reduce((sum, order) => sum + order.totalAmount, 0);

      const ordersByStatus = await DI.amazonOrderRepository.find({ userId: userId });
      const statusCounts = ordersByStatus.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});

      const recentOrders = await DI.amazonOrderRepository.find({ userId: userId }, {
        orderBy: { orderDate: 'DESC' },
        limit: 5
      });

      res.json({
        success: true,
        analytics: {
          totalOrders,
          totalSpent: totalSpentAmount,
          ordersByStatus: statusCounts,
          recentOrders,
          lastSync: amazonUser.lastSync,
          accountStatus: amazonUser.status
        }
      });
    } catch (error) {
      console.error('Error getting Amazon analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get Amazon analytics'
      });
    }
  });

  return router;
};

module.exports = { AmazonController }; 