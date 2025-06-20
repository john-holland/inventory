"use strict";

const express = require('express');
const { UserAddressService } = require('../services/userAddressService');
const { getCoefficient } = require('../config/ConstantMarketCoefficients');

class UserAddressController {
  constructor(em) {
    this.router = express.Router();
    this.userAddressService = new UserAddressService(em);
    this.setupRoutes();
  }

  setupRoutes() {
    // Create a new address
    this.router.post('/addresses', async (req, res) => {
      try {
        const { userId, addressType, addressData } = req.body;
        
        if (!userId || !addressType || !addressData) {
          return res.status(400).json({
            success: false,
            message: 'Missing required fields: userId, addressType, addressData'
          });
        }

        const address = await this.userAddressService.createAddress(
          userId, 
          addressType, 
          addressData
        );

        res.status(201).json({
          success: true,
          data: address,
          message: 'Address created successfully'
        });
      } catch (error) {
        console.error('Error creating address:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to create address'
        });
      }
    });

    // Update an address
    this.router.put('/addresses/:addressId', async (req, res) => {
      try {
        const { addressId } = req.params;
        const { userId, updateData } = req.body;
        
        if (!userId) {
          return res.status(400).json({
            success: false,
            message: 'Missing required field: userId'
          });
        }

        const address = await this.userAddressService.updateAddress(
          addressId, 
          userId, 
          updateData
        );

        res.json({
          success: true,
          data: address,
          message: 'Address updated successfully'
        });
      } catch (error) {
        console.error('Error updating address:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to update address'
        });
      }
    });

    // Set address as default
    this.router.post('/addresses/:addressId/default', async (req, res) => {
      try {
        const { addressId } = req.params;
        const { userId } = req.body;
        
        if (!userId) {
          return res.status(400).json({
            success: false,
            message: 'Missing required field: userId'
          });
        }

        const address = await this.userAddressService.setDefaultAddress(addressId, userId);

        res.json({
          success: true,
          data: address,
          message: 'Address set as default successfully'
        });
      } catch (error) {
        console.error('Error setting default address:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to set default address'
        });
      }
    });

    // Delete an address
    this.router.delete('/addresses/:addressId', async (req, res) => {
      try {
        const { addressId } = req.params;
        const { userId } = req.body;
        
        if (!userId) {
          return res.status(400).json({
            success: false,
            message: 'Missing required field: userId'
          });
        }

        const address = await this.userAddressService.deleteAddress(addressId, userId);

        res.json({
          success: true,
          data: address,
          message: 'Address deleted successfully'
        });
      } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to delete address'
        });
      }
    });

    // Get addresses by user
    this.router.get('/users/:userId/addresses', async (req, res) => {
      try {
        const { userId } = req.params;
        const { addressType } = req.query;

        const addresses = await this.userAddressService.getAddressesByUser(userId, addressType);

        res.json({
          success: true,
          data: addresses,
          count: addresses.length
        });
      } catch (error) {
        console.error('Error getting addresses by user:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to get addresses'
        });
      }
    });

    // Get default address for user
    this.router.get('/users/:userId/addresses/default/:addressType', async (req, res) => {
      try {
        const { userId, addressType } = req.params;

        const address = await this.userAddressService.getDefaultAddress(userId, addressType);

        if (!address) {
          return res.status(404).json({
            success: false,
            message: 'Default address not found'
          });
        }

        res.json({
          success: true,
          data: address
        });
      } catch (error) {
        console.error('Error getting default address:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to get default address'
        });
      }
    });

    // Verify an address
    this.router.post('/addresses/:addressId/verify', async (req, res) => {
      try {
        const { addressId } = req.params;
        const { userId, verificationMethod } = req.body;
        
        if (!userId) {
          return res.status(400).json({
            success: false,
            message: 'Missing required field: userId'
          });
        }

        const address = await this.userAddressService.verifyAddress(
          addressId, 
          userId, 
          verificationMethod || 'manual'
        );

        res.json({
          success: true,
          data: address,
          message: 'Address verified successfully'
        });
      } catch (error) {
        console.error('Error verifying address:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to verify address'
        });
      }
    });

    // Calculate shipping cost between addresses
    this.router.post('/shipping/calculate-cost', async (req, res) => {
      try {
        const { fromAddressId, toAddressId, shippingMethod } = req.body;
        
        if (!fromAddressId || !toAddressId) {
          return res.status(400).json({
            success: false,
            message: 'Missing required fields: fromAddressId, toAddressId'
          });
        }

        const cost = await this.userAddressService.calculateShippingCost(
          fromAddressId, 
          toAddressId, 
          shippingMethod || 'standard'
        );

        res.json({
          success: true,
          data: cost
        });
      } catch (error) {
        console.error('Error calculating shipping cost:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to calculate shipping cost'
        });
      }
    });

    // Get address statistics
    this.router.get('/addresses/statistics', async (req, res) => {
      try {
        const stats = await this.userAddressService.getAddressStatistics();

        res.json({
          success: true,
          data: stats
        });
      } catch (error) {
        console.error('Error getting address statistics:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to get address statistics'
        });
      }
    });

    // Get address by ID
    this.router.get('/addresses/:addressId', async (req, res) => {
      try {
        const { addressId } = req.params;
        const addressRepo = this.userAddressService.em.getRepository('UserAddress');
        
        const address = await addressRepo.findOne({ id: addressId }, {
          populate: ['userId']
        });

        if (!address) {
          return res.status(404).json({
            success: false,
            message: 'Address not found'
          });
        }

        res.json({
          success: true,
          data: address
        });
      } catch (error) {
        console.error('Error getting address:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to get address'
        });
      }
    });

    // Get available address types
    this.router.get('/addresses/types', async (req, res) => {
      try {
        const addressTypes = getCoefficient('SHIPPING.ADDRESS_TYPES');

        res.json({
          success: true,
          data: addressTypes
        });
      } catch (error) {
        console.error('Error getting address types:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to get address types'
        });
      }
    });

    // Get shipping methods
    this.router.get('/shipping/methods', async (req, res) => {
      try {
        const shippingMethods = getCoefficient('SHIPPING.SHIPPING_METHODS');

        res.json({
          success: true,
          data: shippingMethods
        });
      } catch (error) {
        console.error('Error getting shipping methods:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to get shipping methods'
        });
      }
    });

    // Get carriers
    this.router.get('/shipping/carriers', async (req, res) => {
      try {
        const carriers = getCoefficient('SHIPPING.CARRIERS');

        res.json({
          success: true,
          data: carriers
        });
      } catch (error) {
        console.error('Error getting carriers:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to get carriers'
        });
      }
    });
  }

  getRouter() {
    return this.router;
  }
}

module.exports = { UserAddressController }; 