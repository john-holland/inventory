"use strict";

const { getCoefficient } = require('../config/ConstantMarketCoefficients');

class UserAddressService {
  constructor(em) {
    this.em = em;
  }

  /**
   * Create a new address for a user
   */
  async createAddress(userId, addressType, addressData) {
    try {
      const addressRepo = this.em.getRepository('UserAddress');
      const userRepo = this.em.getRepository('User');
      
      // Validate user exists
      const user = await userRepo.findOne({ id: userId });
      if (!user) {
        throw new Error('User not found');
      }

      // Validate address type
      const validTypes = getCoefficient('SHIPPING.ADDRESS_TYPES');
      if (!Object.values(validTypes).includes(addressType)) {
        throw new Error('Invalid address type');
      }

      // Validate required fields
      this.validateAddressData(addressData);

      // Create address
      const address = new (await this.em.getEntity('UserAddress'))(
        userId,
        addressType,
        addressData
      );

      // Set as default if it's the first address of this type
      const existingAddresses = await addressRepo.find({ 
        userId: userId, 
        addressType: addressType,
        isActive: true 
      });
      
      if (existingAddresses.length === 0) {
        address.isDefault = true;
      }

      await this.em.persistAndFlush(address);

      // Create audit log
      await this.createAuditLog('address_created', {
        addressId: address.id,
        userId: userId,
        addressType: addressType,
        addressData: addressData
      });

      return address;
    } catch (error) {
      console.error('Error creating user address:', error);
      throw error;
    }
  }

  /**
   * Validate address data
   */
  validateAddressData(addressData) {
    const requiredFields = ['streetAddress1', 'city', 'state', 'postalCode'];
    
    for (const field of requiredFields) {
      if (!addressData[field] || addressData[field].trim() === '') {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate postal code format (basic US format)
    const postalCodeRegex = /^\d{5}(-\d{4})?$/;
    if (!postalCodeRegex.test(addressData.postalCode)) {
      throw new Error('Invalid postal code format');
    }

    // Validate phone number if provided
    if (addressData.phone) {
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(addressData.phone)) {
        throw new Error('Invalid phone number format');
      }
    }
  }

  /**
   * Update an address
   */
  async updateAddress(addressId, userId, updateData) {
    try {
      const addressRepo = this.em.getRepository('UserAddress');
      
      // Find address
      const address = await addressRepo.findOne({ id: addressId });
      if (!address) {
        throw new Error('Address not found');
      }

      // Check ownership
      if (address.userId !== userId) {
        throw new Error('Unauthorized to update this address');
      }

      // Update fields
      const allowedFields = [
        'streetAddress1', 'streetAddress2', 'city', 'state', 'postalCode',
        'country', 'phone', 'contactName', 'shippingInstructions',
        'accessCode', 'businessHours', 'specialRequirements'
      ];

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          address[field] = updateData[field];
        }
      }

      // Update metadata
      if (updateData.metadata) {
        address.metadata = {
          ...address.metadata,
          ...updateData.metadata,
          auditTrail: [
            ...address.metadata.auditTrail,
            {
              action: 'updated',
              timestamp: new Date(),
              userId: userId,
              details: 'Address updated'
            }
          ]
        };
      }

      await this.em.persistAndFlush(address);

      // Create audit log
      await this.createAuditLog('address_updated', {
        addressId: addressId,
        userId: userId,
        updateData: updateData
      });

      return address;
    } catch (error) {
      console.error('Error updating user address:', error);
      throw error;
    }
  }

  /**
   * Set an address as default
   */
  async setDefaultAddress(addressId, userId) {
    try {
      const addressRepo = this.em.getRepository('UserAddress');
      
      // Find address
      const address = await addressRepo.findOne({ id: addressId });
      if (!address) {
        throw new Error('Address not found');
      }

      // Check ownership
      if (address.userId !== userId) {
        throw new Error('Unauthorized to modify this address');
      }

      // Remove default from other addresses of the same type
      await addressRepo.nativeUpdate(
        { 
          userId: userId, 
          addressType: address.addressType,
          isActive: true 
        },
        { isDefault: false }
      );

      // Set this address as default
      address.isDefault = true;
      await this.em.persistAndFlush(address);

      // Create audit log
      await this.createAuditLog('address_set_default', {
        addressId: addressId,
        userId: userId,
        addressType: address.addressType
      });

      return address;
    } catch (error) {
      console.error('Error setting default address:', error);
      throw error;
    }
  }

  /**
   * Delete an address (soft delete)
   */
  async deleteAddress(addressId, userId) {
    try {
      const addressRepo = this.em.getRepository('UserAddress');
      
      // Find address
      const address = await addressRepo.findOne({ id: addressId });
      if (!address) {
        throw new Error('Address not found');
      }

      // Check ownership
      if (address.userId !== userId) {
        throw new Error('Unauthorized to delete this address');
      }

      // Soft delete
      address.isActive = false;
      address.metadata.auditTrail.push({
        action: 'deleted',
        timestamp: new Date(),
        userId: userId,
        details: 'Address deleted'
      });

      // If this was the default address, set another as default
      if (address.isDefault) {
        const otherAddresses = await addressRepo.find({
          userId: userId,
          addressType: address.addressType,
          isActive: true,
          id: { $ne: addressId }
        });

        if (otherAddresses.length > 0) {
          otherAddresses[0].isDefault = true;
          await this.em.persistAndFlush(otherAddresses[0]);
        }
      }

      await this.em.persistAndFlush(address);

      // Create audit log
      await this.createAuditLog('address_deleted', {
        addressId: addressId,
        userId: userId
      });

      return address;
    } catch (error) {
      console.error('Error deleting user address:', error);
      throw error;
    }
  }

  /**
   * Get addresses by user
   */
  async getAddressesByUser(userId, addressType = null) {
    try {
      const addressRepo = this.em.getRepository('UserAddress');
      const query = { userId: userId, isActive: true };
      
      if (addressType) {
        query.addressType = addressType;
      }
      
      return await addressRepo.find(query, {
        orderBy: { isDefault: 'DESC', createdAt: 'ASC' }
      });
    } catch (error) {
      console.error('Error getting addresses by user:', error);
      throw error;
    }
  }

  /**
   * Get default address for user
   */
  async getDefaultAddress(userId, addressType) {
    try {
      const addressRepo = this.em.getRepository('UserAddress');
      
      return await addressRepo.findOne({
        userId: userId,
        addressType: addressType,
        isDefault: true,
        isActive: true
      });
    } catch (error) {
      console.error('Error getting default address:', error);
      throw error;
    }
  }

  /**
   * Verify an address
   */
  async verifyAddress(addressId, userId, verificationMethod = 'manual') {
    try {
      const addressRepo = this.em.getRepository('UserAddress');
      
      const address = await addressRepo.findOne({ id: addressId });
      if (!address) {
        throw new Error('Address not found');
      }

      if (address.userId !== userId) {
        throw new Error('Unauthorized to verify this address');
      }

      address.isVerified = true;
      address.verificationDate = new Date();
      address.verificationMethod = verificationMethod;
      
      address.metadata.auditTrail.push({
        action: 'verified',
        timestamp: new Date(),
        userId: userId,
        details: `Address verified via ${verificationMethod}`
      });

      await this.em.persistAndFlush(address);

      // Create audit log
      await this.createAuditLog('address_verified', {
        addressId: addressId,
        userId: userId,
        verificationMethod: verificationMethod
      });

      return address;
    } catch (error) {
      console.error('Error verifying address:', error);
      throw error;
    }
  }

  /**
   * Calculate shipping cost between addresses
   */
  async calculateShippingCost(fromAddressId, toAddressId, shippingMethod = 'standard') {
    try {
      const addressRepo = this.em.getRepository('UserAddress');
      
      const fromAddress = await addressRepo.findOne({ id: fromAddressId });
      const toAddress = await addressRepo.findOne({ id: toAddressId });
      
      if (!fromAddress || !toAddress) {
        throw new Error('One or both addresses not found');
      }

      // Calculate distance (simplified - would use real geocoding in production)
      const distance = this.calculateDistance(fromAddress, toAddress);
      
      // Get shipping coefficients
      const costCalculation = getCoefficient('SHIPPING.COST_CALCULATION');
      
      // Calculate base shipping cost
      let baseCost = distance * costCalculation.DISTANCE_RATE;
      
      // Apply shipping method multiplier
      const methodMultipliers = {
        'standard': 1.0,
        'express': 1.5,
        'overnight': 2.5,
        'pickup': 0.5,
        'same_day': 3.0
      };
      
      baseCost *= methodMultipliers[shippingMethod] || 1.0;
      
      // Add fees
      const fuelSurcharge = baseCost * costCalculation.FUEL_SURCHARGE_RATE;
      const handlingFee = costCalculation.HANDLING_FEE;
      
      const totalCost = baseCost + fuelSurcharge + handlingFee;
      
      return {
        baseCost: Math.round(baseCost * 100) / 100,
        fuelSurcharge: Math.round(fuelSurcharge * 100) / 100,
        handlingFee: handlingFee,
        totalCost: Math.round(totalCost * 100) / 100,
        distance: Math.round(distance * 100) / 100,
        shippingMethod: shippingMethod
      };
    } catch (error) {
      console.error('Error calculating shipping cost:', error);
      throw error;
    }
  }

  /**
   * Calculate distance between addresses (simplified)
   */
  calculateDistance(fromAddress, toAddress) {
    // This is a simplified calculation
    // In production, you would use a geocoding service and proper distance calculation
    
    // For now, return a random distance between 1 and 1000 miles
    return Math.random() * 999 + 1;
  }

  /**
   * Get address statistics
   */
  async getAddressStatistics() {
    try {
      const addressRepo = this.em.getRepository('UserAddress');
      
      const totalAddresses = await addressRepo.count({ isActive: true });
      const verifiedAddresses = await addressRepo.count({ isVerified: true, isActive: true });
      const defaultAddresses = await addressRepo.count({ isDefault: true, isActive: true });
      
      // Get address type distribution
      const addresses = await addressRepo.find({ isActive: true });
      const typeCount = {};
      
      addresses.forEach(address => {
        typeCount[address.addressType] = (typeCount[address.addressType] || 0) + 1;
      });
      
      return {
        totalAddresses,
        verifiedAddresses,
        defaultAddresses,
        verificationRate: totalAddresses > 0 ? (verifiedAddresses / totalAddresses * 100).toFixed(1) : 0,
        typeDistribution: typeCount
      };
    } catch (error) {
      console.error('Error getting address statistics:', error);
      throw error;
    }
  }

  /**
   * Create audit log entry
   */
  async createAuditLog(action, data) {
    try {
      console.log(`USER ADDRESS AUDIT LOG [${action}]:`, {
        timestamp: new Date(),
        action,
        data
      });
    } catch (error) {
      console.error('Error creating audit log:', error);
    }
  }
}

module.exports = { UserAddressService }; 