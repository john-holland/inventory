const { Router } = require("express");
const jwt = require("jsonwebtoken");
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

const DropShippingController = (DI) => {
  const dropShippingService = new DropShippingService(DI);

  // Create a new drop shipping list
  router.post("/lists", authenticateToken, async (req, res) => {
    try {
      const { userId } = req.user;
      const { title, description, category, visibility, tags, targetAudience, priceRange, estimatedShipping } = req.body;

      if (!title || !description || !category) {
        return res.status(400).json({
          success: false,
          message: 'Title, description, and category are required'
        });
      }

      const listData = {
        title,
        description,
        category,
        visibility,
        tags,
        targetAudience,
        priceRange,
        estimatedShipping
      };

      const list = await dropShippingService.createDropShippingList(userId, listData);

      res.json({
        success: true,
        message: 'Drop shipping list created successfully',
        list
      });
    } catch (error) {
      console.error('Error creating drop shipping list:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create drop shipping list'
      });
    }
  });

  // Add product to drop shipping list
  router.post("/lists/:listId/products", authenticateToken, async (req, res) => {
    try {
      const { listId } = req.params;
      const { productId, position, notes } = req.body;

      if (!productId) {
        return res.status(400).json({
          success: false,
          message: 'Product ID is required'
        });
      }

      const listProduct = await dropShippingService.addProductToList(
        parseInt(listId),
        parseInt(productId),
        position || 1,
        notes
      );

      res.json({
        success: true,
        message: 'Product added to list successfully',
        listProduct
      });
    } catch (error) {
      console.error('Error adding product to list:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to add product to list'
      });
    }
  });

  // Remove product from drop shipping list
  router.delete("/lists/:listId/products/:productId", authenticateToken, async (req, res) => {
    try {
      const { listId, productId } = req.params;

      const listProduct = await dropShippingService.removeProductFromList(
        parseInt(listId),
        parseInt(productId)
      );

      res.json({
        success: true,
        message: 'Product removed from list successfully',
        listProduct
      });
    } catch (error) {
      console.error('Error removing product from list:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to remove product from list'
      });
    }
  });

  // Get drop shipping list with products
  router.get("/lists/:listId", async (req, res) => {
    try {
      const { listId } = req.params;
      const { includeProducts = 'true' } = req.query;

      const result = await dropShippingService.getDropShippingList(
        parseInt(listId),
        includeProducts === 'true'
      );

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Error getting drop shipping list:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get drop shipping list'
      });
    }
  });

  // Get all drop shipping lists with filters
  router.get("/lists", async (req, res) => {
    try {
      const { category, visibility, featured, creatorId, sortBy, limit, offset } = req.query;

      const filters = {
        category,
        visibility,
        featured: featured === 'true',
        creatorId: creatorId ? parseInt(creatorId) : null,
        sortBy,
        limit: limit ? parseInt(limit) : 50,
        offset: offset ? parseInt(offset) : 0
      };

      const lists = await dropShippingService.getDropShippingLists(filters);

      res.json({
        success: true,
        lists
      });
    } catch (error) {
      console.error('Error getting drop shipping lists:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get drop shipping lists'
      });
    }
  });

  // Search drop shipping lists
  router.get("/lists/search", async (req, res) => {
    try {
      const { q, limit } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Search term is required'
        });
      }

      const filters = {
        limit: limit ? parseInt(limit) : 20
      };

      const lists = await dropShippingService.searchDropShippingLists(q, filters);

      res.json({
        success: true,
        lists
      });
    } catch (error) {
      console.error('Error searching drop shipping lists:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search drop shipping lists'
      });
    }
  });

  // Rate a drop shipping list
  router.post("/lists/:listId/rate", authenticateToken, async (req, res) => {
    try {
      const { userId } = req.user;
      const { listId } = req.params;
      const { rating, review } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }

      const result = await dropShippingService.rateDropShippingList(
        userId,
        parseInt(listId),
        rating,
        review
      );

      res.json({
        success: true,
        message: 'List rated successfully',
        ...result
      });
    } catch (error) {
      console.error('Error rating drop shipping list:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to rate drop shipping list'
      });
    }
  });

  // Purchase product from drop shipping list
  router.post("/lists/:listId/products/:productId/purchase", authenticateToken, async (req, res) => {
    try {
      const { userId } = req.user;
      const { listId, productId } = req.params;
      const { quantity = 1, shippingAddress } = req.body;

      if (!quantity || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be at least 1'
        });
      }

      const result = await dropShippingService.purchaseFromList(
        userId,
        parseInt(listId),
        parseInt(productId),
        quantity,
        shippingAddress
      );

      res.json({
        success: true,
        message: 'Product purchased successfully',
        ...result
      });
    } catch (error) {
      console.error('Error purchasing from list:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to purchase product'
      });
    }
  });

  // Get trending drop shipping lists
  router.get("/lists/trending", async (req, res) => {
    try {
      const { limit = 10 } = req.query;

      const lists = await dropShippingService.getTrendingLists(parseInt(limit));

      res.json({
        success: true,
        lists
      });
    } catch (error) {
      console.error('Error getting trending lists:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get trending lists'
      });
    }
  });

  // Get user's drop shipping lists
  router.get("/lists/user", authenticateToken, async (req, res) => {
    try {
      const { userId } = req.user;
      const { includeStats = 'true' } = req.query;

      const lists = await dropShippingService.getUserLists(
        userId,
        includeStats === 'true'
      );

      res.json({
        success: true,
        lists
      });
    } catch (error) {
      console.error('Error getting user lists:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user lists'
      });
    }
  });

  // Update drop shipping list
  router.put("/lists/:listId", authenticateToken, async (req, res) => {
    try {
      const { userId } = req.user;
      const { listId } = req.params;
      const { title, description, category, visibility, tags, targetAudience, priceRange, estimatedShipping } = req.body;

      const list = await DI.dropShippingListRepository.findOne({
        id: parseInt(listId),
        creatorId: userId
      });

      if (!list) {
        return res.status(404).json({
          success: false,
          message: 'List not found or you do not have permission to edit it'
        });
      }

      const { wrap } = require("@mikro-orm/core");
      wrap(list).assign({
        title: title || list.title,
        description: description || list.description,
        category: category || list.category,
        visibility: visibility || list.visibility,
        tags: tags || list.tags,
        metadata: {
          ...list.metadata,
          targetAudience: targetAudience || list.metadata.targetAudience,
          priceRange: priceRange || list.metadata.priceRange,
          estimatedShipping: estimatedShipping || list.metadata.estimatedShipping,
          lastUpdated: new Date()
        }
      });

      await DI.dropShippingListRepository.flush();

      res.json({
        success: true,
        message: 'List updated successfully',
        list
      });
    } catch (error) {
      console.error('Error updating drop shipping list:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update drop shipping list'
      });
    }
  });

  // Delete drop shipping list
  router.delete("/lists/:listId", authenticateToken, async (req, res) => {
    try {
      const { userId } = req.user;
      const { listId } = req.params;

      const list = await DI.dropShippingListRepository.findOne({
        id: parseInt(listId),
        creatorId: userId
      });

      if (!list) {
        return res.status(404).json({
          success: false,
          message: 'List not found or you do not have permission to delete it'
        });
      }

      const { wrap } = require("@mikro-orm/core");
      wrap(list).assign({
        status: 'archived'
      });

      await DI.dropShippingListRepository.flush();

      res.json({
        success: true,
        message: 'List deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting drop shipping list:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete drop shipping list'
      });
    }
  });

  // Get drop shipping analytics
  router.get("/analytics", authenticateToken, async (req, res) => {
    try {
      const analytics = await dropShippingService.getDropShippingAnalytics();

      res.json({
        success: true,
        analytics
      });
    } catch (error) {
      console.error('Error getting drop shipping analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get drop shipping analytics'
      });
    }
  });

  // Get list product recommendations
  router.get("/lists/:listId/recommendations", async (req, res) => {
    try {
      const { listId } = req.params;
      const { limit = 10 } = req.query;

      const list = await DI.dropShippingListRepository.findOneOrFail({ id: parseInt(listId) });

      // Get products in the list
      const listProducts = await DI.listProductRepository.find({
        listId: parseInt(listId),
        status: 'active'
      });

      const productIds = listProducts.map(lp => lp.productId);

      // Get recommendations based on list category and products
      const recommendations = await DI.amazonProductRepository.find({
        category: list.category,
        id: { $nin: productIds },
        status: 'active'
      }, {
        orderBy: { rating: 'DESC' },
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        recommendations
      });
    } catch (error) {
      console.error('Error getting list product recommendations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get product recommendations'
      });
    }
  });

  // Update list product details
  router.put("/lists/:listId/products/:productId", authenticateToken, async (req, res) => {
    try {
      const { userId } = req.user;
      const { listId, productId } = req.params;
      const { position, notes, featured, recommendedQuantity, curatorRating, curatorReview } = req.body;

      // Verify user owns the list
      const list = await DI.dropShippingListRepository.findOne({
        id: parseInt(listId),
        creatorId: userId
      });

      if (!list) {
        return res.status(404).json({
          success: false,
          message: 'List not found or you do not have permission to edit it'
        });
      }

      const listProduct = await DI.listProductRepository.findOne({
        listId: parseInt(listId),
        productId: parseInt(productId),
        status: 'active'
      });

      if (!listProduct) {
        return res.status(404).json({
          success: false,
          message: 'Product not found in list'
        });
      }

      const { wrap } = require("@mikro-orm/core");
      wrap(listProduct).assign({
        position: position || listProduct.position,
        notes: notes !== undefined ? notes : listProduct.notes,
        featured: featured !== undefined ? featured : listProduct.featured,
        recommendedQuantity: recommendedQuantity || listProduct.recommendedQuantity,
        curatorRating: curatorRating || listProduct.curatorRating,
        curatorReview: curatorReview !== undefined ? curatorReview : listProduct.curatorReview
      });

      await DI.listProductRepository.flush();

      res.json({
        success: true,
        message: 'List product updated successfully',
        listProduct
      });
    } catch (error) {
      console.error('Error updating list product:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update list product'
      });
    }
  });

  // Get featured drop shipping lists
  router.get("/lists/featured", async (req, res) => {
    try {
      const { limit = 5 } = req.query;

      const lists = await DI.dropShippingListRepository.find({
        status: 'active',
        visibility: 'public',
        featured: true
      }, {
        orderBy: { rating: 'DESC' },
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        lists
      });
    } catch (error) {
      console.error('Error getting featured lists:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get featured lists'
      });
    }
  });

  return router;
};

module.exports = { DropShippingController }; 