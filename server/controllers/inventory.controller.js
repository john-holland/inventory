const { Router } = require("express");
const jwt = require("jsonwebtoken");
const { InventoryService } = require("../services/inventoryService");

const router = Router();

const InventoryController = (DI) => {
  const inventoryService = new InventoryService(DI);

  // Middleware to verify JWT token
  const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).send({
        success: false,
        message: "Authentication token required",
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.userId = decoded.userId;
      next();
    } catch (error) {
      return res.status(403).send({
        success: false,
        message: "Invalid or expired token",
      });
    }
  };

  // Create new item
  router.post("/items", authenticateToken, async (req, res) => {
    const {
      title,
      description,
      category,
      condition,
      value,
      location,
      shippingMethod,
      images,
      tags
    } = req.body;

    if (!title || !description || !category || !condition || !value || !location || !shippingMethod) {
      return res.status(400).send({
        success: false,
        message: "All required fields must be provided",
      });
    }

    try {
      const item = await inventoryService.createItem(req.userId, {
        title,
        description,
        category,
        condition,
        value,
        location,
        shippingMethod,
        images,
        tags
      });

      res.status(201).send({
        success: true,
        message: "Item created successfully",
        item
      });
    } catch (e) {
      return res.status(400).send({ success: false, message: e.message });
    }
  });

  // Get all available items
  router.get("/items", async (req, res) => {
    try {
      const { category, lat, lon, radius = 50 } = req.query;
      
      let items;
      
      if (lat && lon) {
        // Location-based search
        items = await inventoryService.getItemsNearLocation(
          parseFloat(lat),
          parseFloat(lon),
          parseFloat(radius),
          category
        );
      } else {
        // General search
        const query = { isAvailable: true };
        if (category) {
          query.category = category;
        }
        items = await DI.itemRepository.find(query);
      }

      res.status(200).send({
        success: true,
        message: "Items retrieved successfully",
        items
      });
    } catch (e) {
      return res.status(400).send({ success: false, message: e.message });
    }
  });

  // Get specific item
  router.get("/items/:id", async (req, res) => {
    const { id } = req.params;

    try {
      const item = await DI.itemRepository.findOneOrFail({ id });
      
      res.status(200).send({
        success: true,
        message: "Item retrieved successfully",
        item
      });
    } catch (e) {
      return res.status(400).send({ success: false, message: e.message });
    }
  });

  // Request hold on item
  router.post("/items/:id/hold", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { location } = req.body;

    if (!location || !location.lat || !location.lon) {
      return res.status(400).send({
        success: false,
        message: "User location is required",
      });
    }

    try {
      const result = await inventoryService.requestHold(parseInt(id), req.userId, location);
      
      res.status(200).send({
        success: true,
        message: "Item hold requested successfully",
        ...result
      });
    } catch (e) {
      return res.status(400).send({ success: false, message: e.message });
    }
  });

  // Release hold on item
  router.post("/items/:id/release", authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
      const result = await inventoryService.releaseHold(parseInt(id), req.userId);
      
      res.status(200).send({
        success: true,
        message: "Item hold released successfully",
        ...result
      });
    } catch (e) {
      return res.status(400).send({ success: false, message: e.message });
    }
  });

  // Purchase item
  router.post("/items/:id/purchase", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { location } = req.body;

    if (!location || !location.lat || !location.lon) {
      return res.status(400).send({
        success: false,
        message: "User location is required",
      });
    }

    try {
      const result = await inventoryService.purchaseItem(parseInt(id), req.userId, location);
      
      res.status(200).send({
        success: true,
        message: "Item purchased successfully",
        ...result
      });
    } catch (e) {
      return res.status(400).send({ success: false, message: e.message });
    }
  });

  // Transfer item (convert hold to purchase)
  router.post("/items/:id/transfer", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { toUserId, transferType } = req.body;

    if (!toUserId) {
      return res.status(400).send({
        success: false,
        message: "Target user ID is required",
      });
    }

    try {
      const result = await inventoryService.transferItem(parseInt(id), req.userId, toUserId, transferType);
      
      res.status(200).send({
        success: true,
        message: "Item transferred successfully",
        ...result
      });
    } catch (e) {
      return res.status(400).send({ success: false, message: e.message });
    }
  });

  // Get user's inventory
  router.get("/inventory", authenticateToken, async (req, res) => {
    try {
      const inventory = await inventoryService.getUserInventory(req.userId);
      
      res.status(200).send({
        success: true,
        message: "User inventory retrieved successfully",
        inventory
      });
    } catch (e) {
      return res.status(400).send({ success: false, message: e.message });
    }
  });

  // Get user's hold analytics
  router.get("/analytics/holds", authenticateToken, async (req, res) => {
    try {
      const analytics = await inventoryService.getUserHoldAnalytics(req.userId);
      
      res.status(200).send({
        success: true,
        message: "Hold analytics retrieved successfully",
        analytics
      });
    } catch (e) {
      return res.status(400).send({ success: false, message: e.message });
    }
  });

  // Update item
  router.put("/items/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    try {
      const item = await DI.itemRepository.findOneOrFail({ id });
      
      // Check if user owns the item
      if (item.ownerId !== req.userId) {
        return res.status(403).send({
          success: false,
          message: "You can only update your own items",
        });
      }

      // Remove fields that shouldn't be updated
      delete updateData.id;
      delete updateData.ownerId;
      delete updateData.createdAt;
      delete updateData.updatedAt;

      const { wrap } = require("@mikro-orm/core");
      wrap(item).assign(updateData);
      await DI.itemRepository.flush();

      res.status(200).send({
        success: true,
        message: "Item updated successfully",
        item
      });
    } catch (e) {
      return res.status(400).send({ success: false, message: e.message });
    }
  });

  // Delete item
  router.delete("/items/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
      const item = await DI.itemRepository.findOneOrFail({ id });
      
      // Check if user owns the item
      if (item.ownerId !== req.userId) {
        return res.status(403).send({
          success: false,
          message: "You can only delete your own items",
        });
      }

      // Check if item is currently held
      if (item.currentHolderId) {
        return res.status(400).send({
          success: false,
          message: "Cannot delete item that is currently held",
        });
      }

      await DI.itemRepository.removeAndFlush(item);

      res.status(200).send({
        success: true,
        message: "Item deleted successfully"
      });
    } catch (e) {
      return res.status(400).send({ success: false, message: e.message });
    }
  });

  // Get items by category
  router.get("/categories/:category", async (req, res) => {
    const { category } = req.params;
    const { lat, lon, radius = 50 } = req.query;

    try {
      let items;
      
      if (lat && lon) {
        items = await inventoryService.getItemsNearLocation(
          parseFloat(lat),
          parseFloat(lon),
          parseFloat(radius),
          category
        );
      } else {
        items = await DI.itemRepository.find({
          category,
          isAvailable: true
        });
      }

      res.status(200).send({
        success: true,
        message: `Items in category ${category} retrieved successfully`,
        items
      });
    } catch (e) {
      return res.status(400).send({ success: false, message: e.message });
    }
  });

  return router;
};

module.exports = { InventoryController }; 