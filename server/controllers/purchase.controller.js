"use strict";

const { getRepository } = require('typeorm');
const { PurchaseOffer, Item, User, Hold, ShippingRoute } = require('../entities');
const { getCoefficient } = require('../config/ConstantMarketCoefficients');

class PurchaseController {
    // Create a purchase offer
    async createOffer(req, res) {
        try {
            const { itemId, offerPrice, message, shippingAddressId } = req.body;
            const offerRepo = getRepository(PurchaseOffer);
            const itemRepo = getRepository(Item);
            const userRepo = getRepository(User);

            // Validate required fields
            if (!itemId || !offerPrice) {
                return res.status(400).json({
                    success: false,
                    message: 'Item ID and offer price are required'
                });
            }

            // Check if item exists and is available
            const item = await itemRepo.findOne({
                where: { id: parseInt(itemId), isActive: true },
                relations: ['owner']
            });

            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: 'Item not found or not available'
                });
            }

            // Check if user is not the owner
            if (item.owner.id === req.user.id) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot make offer on your own item'
                });
            }

            // Check if user has sufficient balance
            const buyer = await userRepo.findOne({ where: { id: req.user.id } });
            if (buyer.balance < parseFloat(offerPrice)) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient balance for this offer'
                });
            }

            // Check if there's already a pending offer from this user
            const existingOffer = await offerRepo.findOne({
                where: {
                    item: { id: parseInt(itemId) },
                    buyer: { id: req.user.id },
                    status: 'pending'
                }
            });

            if (existingOffer) {
                return res.status(400).json({
                    success: false,
                    message: 'You already have a pending offer for this item'
                });
            }

            // Create the offer
            const offer = offerRepo.create({
                item,
                buyer,
                seller: item.owner,
                offerPrice: parseFloat(offerPrice),
                originalPrice: item.price,
                message: message || '',
                shippingAddressId: shippingAddressId || null,
                status: 'pending',
                createdAt: new Date()
            });

            const savedOffer = await offerRepo.save(offer);

            res.status(201).json({
                success: true,
                data: savedOffer,
                message: 'Purchase offer created successfully'
            });
        } catch (error) {
            console.error('Error creating purchase offer:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating purchase offer'
            });
        }
    }

    // Get pending offers for a seller
    async getPendingOffers(req, res) {
        try {
            const { page = 1, limit = 20 } = req.query;
            const offerRepo = getRepository(PurchaseOffer);

            const [offers, total] = await offerRepo.findAndCount({
                where: {
                    seller: { id: req.user.id },
                    status: 'pending'
                },
                relations: ['item', 'item.images', 'buyer', 'buyer.addresses'],
                order: { createdAt: 'DESC' },
                skip: (page - 1) * limit,
                take: limit
            });

            res.json({
                success: true,
                data: offers,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Error getting pending offers:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving pending offers'
            });
        }
    }

    // Get offers made by a buyer
    async getMyOffers(req, res) {
        try {
            const { page = 1, limit = 20, status } = req.query;
            const offerRepo = getRepository(PurchaseOffer);

            let whereClause = { buyer: { id: req.user.id } };
            if (status) {
                whereClause.status = status;
            }

            const [offers, total] = await offerRepo.findAndCount({
                where: whereClause,
                relations: ['item', 'item.images', 'seller'],
                order: { createdAt: 'DESC' },
                skip: (page - 1) * limit,
                take: limit
            });

            res.json({
                success: true,
                data: offers,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Error getting my offers:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving offers'
            });
        }
    }

    // Respond to an offer (accept/reject)
    async respondToOffer(req, res) {
        try {
            const { offerId } = req.params;
            const { response, counterOffer, message } = req.body;
            const offerRepo = getRepository(PurchaseOffer);
            const userRepo = getRepository(User);

            if (!['accept', 'reject', 'counter'].includes(response)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid response type'
                });
            }

            const offer = await offerRepo.findOne({
                where: { id: parseInt(offerId) },
                relations: ['item', 'buyer', 'seller']
            });

            if (!offer) {
                return res.status(404).json({
                    success: false,
                    message: 'Offer not found'
                });
            }

            // Check if user is the seller
            if (offer.seller.id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to respond to this offer'
                });
            }

            // Check if offer is still pending
            if (offer.status !== 'pending') {
                return res.status(400).json({
                    success: false,
                    message: 'Offer is no longer pending'
                });
            }

            if (response === 'accept') {
                // Accept the offer
                await this.acceptOffer(offer);
            } else if (response === 'reject') {
                // Reject the offer
                offer.status = 'rejected';
                offer.rejectedAt = new Date();
                offer.rejectionMessage = message || '';
            } else if (response === 'counter') {
                // Make a counter offer
                if (!counterOffer || counterOffer <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Valid counter offer price is required'
                    });
                }

                offer.status = 'countered';
                offer.counterOfferPrice = parseFloat(counterOffer);
                offer.counterOfferMessage = message || '';
                offer.counteredAt = new Date();
            }

            const updatedOffer = await offerRepo.save(offer);

            res.json({
                success: true,
                data: updatedOffer,
                message: `Offer ${response}ed successfully`
            });
        } catch (error) {
            console.error('Error responding to offer:', error);
            res.status(500).json({
                success: false,
                message: 'Error responding to offer'
            });
        }
    }

    // Accept a counter offer
    async acceptCounterOffer(req, res) {
        try {
            const { offerId } = req.params;
            const offerRepo = getRepository(PurchaseOffer);

            const offer = await offerRepo.findOne({
                where: { id: parseInt(offerId) },
                relations: ['item', 'buyer', 'seller']
            });

            if (!offer) {
                return res.status(404).json({
                    success: false,
                    message: 'Offer not found'
                });
            }

            // Check if user is the buyer
            if (offer.buyer.id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to accept this counter offer'
                });
            }

            // Check if offer is countered
            if (offer.status !== 'countered') {
                return res.status(400).json({
                    success: false,
                    message: 'Offer is not a counter offer'
                });
            }

            // Accept the counter offer
            await this.acceptOffer(offer, offer.counterOfferPrice);

            res.json({
                success: true,
                data: offer,
                message: 'Counter offer accepted successfully'
            });
        } catch (error) {
            console.error('Error accepting counter offer:', error);
            res.status(500).json({
                success: false,
                message: 'Error accepting counter offer'
            });
        }
    }

    // Helper method to accept an offer
    async acceptOffer(offer, finalPrice = null) {
        const offerRepo = getRepository(PurchaseOffer);
        const userRepo = getRepository(User);
        const holdRepo = getRepository(Hold);

        const price = finalPrice || offer.offerPrice;

        // Update offer status
        offer.status = 'accepted';
        offer.acceptedAt = new Date();
        offer.finalPrice = price;

        // Transfer funds
        const buyer = await userRepo.findOne({ where: { id: offer.buyer.id } });
        const seller = await userRepo.findOne({ where: { id: offer.seller.id } });

        if (buyer.balance < price) {
            throw new Error('Buyer has insufficient funds');
        }

        // Deduct from buyer
        buyer.balance -= price;
        await userRepo.save(buyer);

        // Add to seller
        seller.balance += price;
        await userRepo.save(seller);

        // Check if buyer has a hold on this item
        const existingHold = await holdRepo.findOne({
            where: {
                item: { id: offer.item.id },
                user: { id: offer.buyer.id },
                status: 'active'
            }
        });

        if (existingHold) {
            // Refund hold amount if applicable
            if (existingHold.amount > 0) {
                buyer.balance += existingHold.amount;
                await userRepo.save(buyer);
            }

            // Update hold status
            existingHold.status = 'converted_to_purchase';
            existingHold.convertedAt = new Date();
            await holdRepo.save(existingHold);
        }

        // Save the accepted offer
        await offerRepo.save(offer);

        // Create shipping route if needed
        if (offer.shippingAddressId) {
            await this.createShippingRoute(offer);
        }
    }

    // Create shipping route for accepted purchase
    async createShippingRoute(offer) {
        const shippingRepo = getRepository(ShippingRoute);
        
        const shippingRoute = shippingRepo.create({
            item: offer.item,
            buyer: offer.buyer,
            seller: offer.seller,
            fromAddress: offer.seller.addresses?.find(addr => addr.isDefault) || null,
            toAddress: offer.buyer.addresses?.find(addr => addr.id === offer.shippingAddressId) || null,
            status: 'pending',
            estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            cost: offer.item.shippingCost || 0,
            createdAt: new Date()
        });

        await shippingRepo.save(shippingRoute);
    }

    // Get purchase history
    async getPurchaseHistory(req, res) {
        try {
            const { page = 1, limit = 20, type = 'all' } = req.query;
            const offerRepo = getRepository(PurchaseOffer);

            let whereClause = {};
            if (type === 'purchases') {
                whereClause.buyer = { id: req.user.id };
                whereClause.status = 'accepted';
            } else if (type === 'sales') {
                whereClause.seller = { id: req.user.id };
                whereClause.status = 'accepted';
            } else {
                whereClause = [
                    { buyer: { id: req.user.id } },
                    { seller: { id: req.user.id } }
                ];
            }

            const [offers, total] = await offerRepo.findAndCount({
                where: whereClause,
                relations: ['item', 'item.images', 'buyer', 'seller'],
                order: { createdAt: 'DESC' },
                skip: (page - 1) * limit,
                take: limit
            });

            res.json({
                success: true,
                data: offers,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Error getting purchase history:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving purchase history'
            });
        }
    }

    // Get offer statistics
    async getOfferStats(req, res) {
        try {
            const offerRepo = getRepository(PurchaseOffer);

            const stats = await offerRepo
                .createQueryBuilder('offer')
                .select([
                    'COUNT(*) as totalOffers',
                    'COUNT(CASE WHEN offer.status = \'pending\' THEN 1 END) as pendingOffers',
                    'COUNT(CASE WHEN offer.status = \'accepted\' THEN 1 END) as acceptedOffers',
                    'COUNT(CASE WHEN offer.status = \'rejected\' THEN 1 END) as rejectedOffers',
                    'COUNT(CASE WHEN offer.status = \'countered\' THEN 1 END) as counteredOffers',
                    'AVG(offer.offerPrice) as averageOfferPrice',
                    'SUM(CASE WHEN offer.status = \'accepted\' THEN offer.finalPrice ELSE 0 END) as totalAcceptedValue'
                ])
                .where('offer.seller.id = :sellerId OR offer.buyer.id = :buyerId', {
                    sellerId: req.user.id,
                    buyerId: req.user.id
                })
                .getRawOne();

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Error getting offer stats:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving offer statistics'
            });
        }
    }
}

module.exports = new PurchaseController(); 