"use strict";

const { getRepository } = require('typeorm');
const { Item, User, Hold, PurchaseOffer } = require('../entities');
const { getCoefficient } = require('../config/ConstantMarketCoefficients');

class ItemController {
    // Get all items with pagination and filters
    async getAllItems(req, res) {
        try {
            const { page = 1, limit = 20, category, condition, minPrice, maxPrice, search } = req.query;
            const itemRepo = getRepository(Item);
            
            let query = itemRepo.createQueryBuilder('item')
                .leftJoinAndSelect('item.owner', 'owner')
                .leftJoinAndSelect('item.images', 'images')
                .where('item.isActive = :isActive', { isActive: true });

            // Apply filters
            if (category) {
                query = query.andWhere('item.category = :category', { category });
            }
            
            if (condition) {
                query = query.andWhere('item.condition = :condition', { condition });
            }
            
            if (minPrice) {
                query = query.andWhere('item.price >= :minPrice', { minPrice: parseFloat(minPrice) });
            }
            
            if (maxPrice) {
                query = query.andWhere('item.price <= :maxPrice', { maxPrice: parseFloat(maxPrice) });
            }
            
            if (search) {
                query = query.andWhere(
                    '(item.title ILIKE :search OR item.description ILIKE :search OR item.category ILIKE :search)',
                    { search: `%${search}%` }
                );
            }

            const [items, total] = await query
                .orderBy('item.createdAt', 'DESC')
                .skip((page - 1) * limit)
                .take(limit)
                .getManyAndCount();

            res.json({
                success: true,
                data: items,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Error getting items:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving items'
            });
        }
    }

    // Get item by ID with full details
    async getItemById(req, res) {
        try {
            const { id } = req.params;
            const itemRepo = getRepository(Item);
            
            const item = await itemRepo.findOne({
                where: { id: parseInt(id), isActive: true },
                relations: ['owner', 'images', 'holds', 'purchaseOffers']
            });

            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: 'Item not found'
                });
            }

            res.json({
                success: true,
                data: item
            });
        } catch (error) {
            console.error('Error getting item:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving item'
            });
        }
    }

    // Create new item with image upload support
    async createItem(req, res) {
        try {
            const itemRepo = getRepository(Item);
            const userRepo = getRepository(User);
            
            const {
                title,
                description,
                category,
                price,
                condition,
                quantity,
                weight,
                dimensions,
                shippingCost,
                metaData,
                amazonData
            } = req.body;

            // Validate required fields
            if (!title || !description || !category || !price || !condition) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields'
                });
            }

            // Get user from request (assuming authentication middleware sets req.user)
            const user = await userRepo.findOne({ where: { id: req.user.id } });
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Create item
            const item = itemRepo.create({
                title,
                description,
                category,
                price: parseFloat(price),
                condition,
                quantity: parseInt(quantity) || 1,
                weight: parseFloat(weight) || 0,
                dimensions,
                shippingCost: parseFloat(shippingCost) || 0,
                owner: user,
                metaData: metaData || {},
                amazonData: amazonData || {},
                isActive: true
            });

            // Handle image uploads
            if (req.files && req.files.length > 0) {
                const images = req.files.map(file => ({
                    url: file.path,
                    filename: file.filename,
                    mimetype: file.mimetype,
                    size: file.size
                }));
                item.images = images;
            }

            const savedItem = await itemRepo.save(item);

            res.status(201).json({
                success: true,
                data: savedItem,
                message: 'Item created successfully'
            });
        } catch (error) {
            console.error('Error creating item:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating item'
            });
        }
    }

    // Update item
    async updateItem(req, res) {
        try {
            const { id } = req.params;
            const itemRepo = getRepository(Item);
            
            const item = await itemRepo.findOne({
                where: { id: parseInt(id) },
                relations: ['owner']
            });

            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: 'Item not found'
                });
            }

            // Check ownership
            if (item.owner.id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to update this item'
                });
            }

            // Update fields
            const updateData = req.body;
            Object.keys(updateData).forEach(key => {
                if (key !== 'id' && key !== 'owner' && key !== 'createdAt') {
                    item[key] = updateData[key];
                }
            });

            // Handle new images
            if (req.files && req.files.length > 0) {
                const newImages = req.files.map(file => ({
                    url: file.path,
                    filename: file.filename,
                    mimetype: file.mimetype,
                    size: file.size
                }));
                item.images = [...(item.images || []), ...newImages];
            }

            const updatedItem = await itemRepo.save(item);

            res.json({
                success: true,
                data: updatedItem,
                message: 'Item updated successfully'
            });
        } catch (error) {
            console.error('Error updating item:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating item'
            });
        }
    }

    // Delete item (soft delete)
    async deleteItem(req, res) {
        try {
            const { id } = req.params;
            const itemRepo = getRepository(Item);
            
            const item = await itemRepo.findOne({
                where: { id: parseInt(id) },
                relations: ['owner']
            });

            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: 'Item not found'
                });
            }

            // Check ownership
            if (item.owner.id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to delete this item'
                });
            }

            // Soft delete
            item.isActive = false;
            await itemRepo.save(item);

            res.json({
                success: true,
                message: 'Item deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting item:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting item'
            });
        }
    }

    // Get items by user
    async getUserItems(req, res) {
        try {
            const { userId } = req.params;
            const { page = 1, limit = 20 } = req.query;
            
            const itemRepo = getRepository(Item);
            
            const [items, total] = await itemRepo.findAndCount({
                where: { 
                    owner: { id: parseInt(userId) },
                    isActive: true 
                },
                relations: ['images'],
                order: { createdAt: 'DESC' },
                skip: (page - 1) * limit,
                take: limit
            });

            res.json({
                success: true,
                data: items,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Error getting user items:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving user items'
            });
        }
    }

    // Search items with advanced filters
    async searchItems(req, res) {
        try {
            const {
                query,
                category,
                condition,
                minPrice,
                maxPrice,
                location,
                sortBy = 'createdAt',
                sortOrder = 'DESC',
                page = 1,
                limit = 20
            } = req.query;

            const itemRepo = getRepository(Item);
            
            let queryBuilder = itemRepo.createQueryBuilder('item')
                .leftJoinAndSelect('item.owner', 'owner')
                .leftJoinAndSelect('item.images', 'images')
                .where('item.isActive = :isActive', { isActive: true });

            // Text search
            if (query) {
                queryBuilder = queryBuilder.andWhere(
                    '(item.title ILIKE :query OR item.description ILIKE :query OR item.category ILIKE :query)',
                    { query: `%${query}%` }
                );
            }

            // Filters
            if (category) {
                queryBuilder = queryBuilder.andWhere('item.category = :category', { category });
            }

            if (condition) {
                queryBuilder = queryBuilder.andWhere('item.condition = :condition', { condition });
            }

            if (minPrice) {
                queryBuilder = queryBuilder.andWhere('item.price >= :minPrice', { minPrice: parseFloat(minPrice) });
            }

            if (maxPrice) {
                queryBuilder = queryBuilder.andWhere('item.price <= :maxPrice', { maxPrice: parseFloat(maxPrice) });
            }

            if (location) {
                queryBuilder = queryBuilder.andWhere('owner.location ILIKE :location', { location: `%${location}%` });
            }

            // Sorting
            const validSortFields = ['createdAt', 'price', 'title', 'condition'];
            const validSortOrders = ['ASC', 'DESC'];
            
            if (validSortFields.includes(sortBy) && validSortOrders.includes(sortOrder.toUpperCase())) {
                queryBuilder = queryBuilder.orderBy(`item.${sortBy}`, sortOrder.toUpperCase());
            }

            const [items, total] = await queryBuilder
                .skip((page - 1) * limit)
                .take(limit)
                .getManyAndCount();

            res.json({
                success: true,
                data: items,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Error searching items:', error);
            res.status(500).json({
                success: false,
                message: 'Error searching items'
            });
        }
    }

    // Get item statistics
    async getItemStats(req, res) {
        try {
            const itemRepo = getRepository(Item);
            
            const stats = await itemRepo
                .createQueryBuilder('item')
                .select([
                    'COUNT(*) as totalItems',
                    'COUNT(CASE WHEN item.condition = \'new\' THEN 1 END) as newItems',
                    'COUNT(CASE WHEN item.condition = \'like_new\' THEN 1 END) as likeNewItems',
                    'COUNT(CASE WHEN item.condition = \'good\' THEN 1 END) as goodItems',
                    'COUNT(CASE WHEN item.condition = \'fair\' THEN 1 END) as fairItems',
                    'COUNT(CASE WHEN item.condition = \'poor\' THEN 1 END) as poorItems',
                    'AVG(item.price) as averagePrice',
                    'MIN(item.price) as minPrice',
                    'MAX(item.price) as maxPrice'
                ])
                .where('item.isActive = :isActive', { isActive: true })
                .getRawOne();

            // Category breakdown
            const categoryStats = await itemRepo
                .createQueryBuilder('item')
                .select('item.category', 'category')
                .addSelect('COUNT(*)', 'count')
                .addSelect('AVG(item.price)', 'avgPrice')
                .where('item.isActive = :isActive', { isActive: true })
                .groupBy('item.category')
                .getRawMany();

            res.json({
                success: true,
                data: {
                    overview: stats,
                    categories: categoryStats
                }
            });
        } catch (error) {
            console.error('Error getting item stats:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving item statistics'
            });
        }
    }

    // Import item from Amazon/Meta
    async importItem(req, res) {
        try {
            const { source, itemId, url } = req.body;
            
            if (!source || !itemId) {
                return res.status(400).json({
                    success: false,
                    message: 'Source and item ID are required'
                });
            }

            let itemData = {};

            // Fetch item data from external source
            if (source === 'amazon') {
                itemData = await this.fetchAmazonItem(itemId);
            } else if (source === 'meta') {
                itemData = await this.fetchMetaItem(itemId);
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Unsupported source'
                });
            }

            if (!itemData) {
                return res.status(404).json({
                    success: false,
                    message: 'Item not found in external source'
                });
            }

            res.json({
                success: true,
                data: itemData,
                message: 'Item data imported successfully'
            });
        } catch (error) {
            console.error('Error importing item:', error);
            res.status(500).json({
                success: false,
                message: 'Error importing item data'
            });
        }
    }

    // Helper method to fetch Amazon item data
    async fetchAmazonItem(itemId) {
        // This would integrate with Amazon Product Advertising API
        // For now, return mock data
        return {
            title: 'Sample Amazon Product',
            description: 'Product description from Amazon',
            price: 29.99,
            category: 'electronics',
            condition: 'new',
            images: ['https://example.com/image1.jpg'],
            metaData: {
                asin: itemId,
                brand: 'Sample Brand',
                dimensions: '10 x 5 x 2 inches',
                weight: '1.5 lbs'
            }
        };
    }

    // Helper method to fetch Meta item data
    async fetchMetaItem(itemId) {
        // This would integrate with Meta/Facebook Marketplace API
        // For now, return mock data
        return {
            title: 'Sample Meta Product',
            description: 'Product description from Meta',
            price: 19.99,
            category: 'clothing',
            condition: 'good',
            images: ['https://example.com/image2.jpg'],
            metaData: {
                metaId: itemId,
                seller: 'Sample Seller',
                location: 'San Francisco, CA'
            }
        };
    }
}

module.exports = new ItemController(); 