"use strict";

const { getCoefficient } = require('../config/ConstantMarketCoefficients');

class HoldService {
  constructor(em) {
    this.em = em;
  }

  /**
   * Create a new hold for an item
   */
  async createHold(userId, itemId, shippingRouteId, amount, metadata = {}) {
    try {
      const holdRepo = this.em.getRepository('Hold');
      const userRepo = this.em.getRepository('User');
      const itemRepo = this.em.getRepository('Item');
      
      // Validate user exists
      const user = await userRepo.findOne({ id: userId });
      if (!user) {
        throw new Error('User not found');
      }

      // Validate item exists
      const item = await itemRepo.findOne({ id: itemId });
      if (!item) {
        throw new Error('Item not found');
      }

      // Validate hold amount
      const minAmount = getCoefficient('HOLDS.REQUIREMENTS.MIN_HOLD_AMOUNT');
      const maxAmount = getCoefficient('HOLDS.REQUIREMENTS.MAX_HOLD_AMOUNT');
      
      if (amount < minAmount || amount > maxAmount) {
        throw new Error(`Hold amount must be between $${minAmount} and $${maxAmount}`);
      }

      // Create hold
      const hold = new (await this.em.getEntity('Hold'))(
        userId, 
        itemId, 
        shippingRouteId, 
        amount, 
        'active'
      );
      
      hold.metadata = {
        ...hold.metadata,
        ...metadata,
        auditTrail: [{
          action: 'created',
          timestamp: new Date(),
          userId: userId,
          details: `Hold created for item ${itemId} with amount $${amount}`
        }]
      };

      await this.em.persistAndFlush(hold);

      // Create audit log
      await this.createAuditLog('hold_created', {
        holdId: hold.id,
        userId: userId,
        itemId: itemId,
        amount: amount,
        metadata: hold.metadata
      });

      return hold;
    } catch (error) {
      console.error('Error creating hold:', error);
      throw error;
    }
  }

  /**
   * Release a hold and create disbursement
   */
  async releaseHold(holdId, userId, releaseReason = '', metadata = {}) {
    try {
      const holdRepo = this.em.getRepository('Hold');
      const releaseRepo = this.em.getRepository('Release');
      const disbursementRepo = this.em.getRepository('Disbursement');
      
      // Find and validate hold
      const hold = await holdRepo.findOne({ id: holdId });
      if (!hold) {
        throw new Error('Hold not found');
      }

      if (hold.status !== 'active') {
        throw new Error('Hold is not active');
      }

      // Update hold status
      hold.status = 'released';
      hold.releaseDate = new Date();
      hold.metadata.releaseReason = releaseReason;
      hold.metadata.auditTrail.push({
        action: 'released',
        timestamp: new Date(),
        userId: userId,
        details: `Hold released: ${releaseReason}`
      });

      // Create release record
      const release = new (await this.em.getEntity('Release'))(
        hold.itemId,
        userId,
        holdId,
        'manual'
      );
      
      release.releaseReason = releaseReason;
      release.metadata = {
        ...release.metadata,
        ...metadata,
        auditTrail: [{
          action: 'created',
          timestamp: new Date(),
          userId: userId,
          details: `Release created for hold ${holdId}`
        }]
      };

      // Calculate disbursement amount with investment returns
      const disbursementAmount = await this.calculateDisbursementAmount(hold);
      
      // Create disbursement
      const disbursement = new (await this.em.getEntity('Disbursement'))(
        hold.userId,
        disbursementAmount,
        'hold_release',
        holdId
      );
      
      disbursement.metadata.disbursementReason = `Hold release: ${releaseReason}`;
      disbursement.metadata.sourceDetails = `Hold ID: ${holdId}, Item ID: ${hold.itemId}`;

      // Link release to disbursement
      release.disbursementId = disbursement.id;
      hold.metadata.releaseReason = releaseReason;

      await this.em.persistAndFlush([hold, release, disbursement]);

      // Create audit log
      await this.createAuditLog('hold_released', {
        holdId: holdId,
        userId: userId,
        releaseId: release.id,
        disbursementId: disbursement.id,
        amount: disbursementAmount,
        reason: releaseReason
      });

      return {
        hold,
        release,
        disbursement
      };
    } catch (error) {
      console.error('Error releasing hold:', error);
      throw error;
    }
  }

  /**
   * Calculate disbursement amount including investment returns
   */
  async calculateDisbursementAmount(hold) {
    try {
      const baseAmount = parseFloat(hold.amount);
      const holdDuration = this.calculateHoldDuration(hold.holdDate);
      
      // Get investment coefficients
      const consumerCutDefault = getCoefficient('REVENUE.HOLD_INVESTMENT.CONSUMER_CUT_DEFAULT');
      const holdDurationBonus = getCoefficient('REVENUE.HOLD_INVESTMENT.HOLD_DURATION_BONUS');
      const maxHoldDurationBonus = getCoefficient('REVENUE.HOLD_INVESTMENT.MAX_HOLD_DURATION_BONUS');
      
      // Calculate duration bonus (2% per week, max 20%)
      const weeksHeld = Math.floor(holdDuration / 7);
      const durationBonus = Math.min(weeksHeld * holdDurationBonus, maxHoldDurationBonus);
      
      // Calculate total return rate
      const totalReturnRate = consumerCutDefault + durationBonus;
      
      // Calculate disbursement amount
      const investmentReturn = baseAmount * totalReturnRate;
      const disbursementAmount = baseAmount + investmentReturn;
      
      return Math.round(disbursementAmount * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      console.error('Error calculating disbursement amount:', error);
      return parseFloat(hold.amount); // Return base amount if calculation fails
    }
  }

  /**
   * Calculate hold duration in days
   */
  calculateHoldDuration(holdDate) {
    const now = new Date();
    const holdTime = new Date(holdDate);
    const diffTime = Math.abs(now - holdTime);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get holds by user
   */
  async getHoldsByUser(userId, status = null) {
    try {
      const holdRepo = this.em.getRepository('Hold');
      const query = { userId: userId };
      
      if (status) {
        query.status = status;
      }
      
      return await holdRepo.find(query, {
        populate: ['itemId', 'shippingRouteId', 'consumerInvestmentId']
      });
    } catch (error) {
      console.error('Error getting holds by user:', error);
      throw error;
    }
  }

  /**
   * Get holds by item
   */
  async getHoldsByItem(itemId, status = null) {
    try {
      const holdRepo = this.em.getRepository('Hold');
      const query = { itemId: itemId };
      
      if (status) {
        query.status = status;
      }
      
      return await holdRepo.find(query, {
        populate: ['userId', 'shippingRouteId', 'consumerInvestmentId']
      });
    } catch (error) {
      console.error('Error getting holds by item:', error);
      throw error;
    }
  }

  /**
   * Get hold statistics
   */
  async getHoldStatistics() {
    try {
      const holdRepo = this.em.getRepository('Hold');
      
      const stats = await holdRepo.count();
      const activeHolds = await holdRepo.count({ status: 'active' });
      const releasedHolds = await holdRepo.count({ status: 'released' });
      const cancelledHolds = await holdRepo.count({ status: 'cancelled' });
      
      // Calculate total amount held
      const allHolds = await holdRepo.find({ status: 'active' });
      const totalAmountHeld = allHolds.reduce((sum, hold) => sum + parseFloat(hold.amount), 0);
      
      return {
        totalHolds: stats,
        activeHolds,
        releasedHolds,
        cancelledHolds,
        totalAmountHeld: Math.round(totalAmountHeld * 100) / 100
      };
    } catch (error) {
      console.error('Error getting hold statistics:', error);
      throw error;
    }
  }

  /**
   * Process expired holds
   */
  async processExpiredHolds() {
    try {
      const holdRepo = this.em.getRepository('Hold');
      const autoExpiryDays = getCoefficient('HOLDS.PROCESSING.AUTO_EXPIRY_DAYS');
      
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() - autoExpiryDays);
      
      const expiredHolds = await holdRepo.find({
        status: 'active',
        holdDate: { $lt: expiryDate }
      });
      
      for (const hold of expiredHolds) {
        await this.expireHold(hold.id, 'Automatic expiry after 90 days');
      }
      
      return {
        processed: expiredHolds.length,
        message: `Processed ${expiredHolds.length} expired holds`
      };
    } catch (error) {
      console.error('Error processing expired holds:', error);
      throw error;
    }
  }

  /**
   * Expire a hold
   */
  async expireHold(holdId, reason = 'Manual expiry') {
    try {
      const holdRepo = this.em.getRepository('Hold');
      
      const hold = await holdRepo.findOne({ id: holdId });
      if (!hold || hold.status !== 'active') {
        throw new Error('Hold not found or not active');
      }
      
      hold.status = 'expired';
      hold.expiryDate = new Date();
      hold.metadata.cancellationReason = reason;
      hold.metadata.auditTrail.push({
        action: 'expired',
        timestamp: new Date(),
        details: `Hold expired: ${reason}`
      });
      
      await this.em.persistAndFlush(hold);
      
      // Create audit log
      await this.createAuditLog('hold_expired', {
        holdId: holdId,
        reason: reason
      });
      
      return hold;
    } catch (error) {
      console.error('Error expiring hold:', error);
      throw error;
    }
  }

  /**
   * Create audit log entry
   */
  async createAuditLog(action, data) {
    try {
      // This would typically write to an audit log table
      // For now, we'll just log to console
      console.log(`AUDIT LOG [${action}]:`, {
        timestamp: new Date(),
        action,
        data
      });
    } catch (error) {
      console.error('Error creating audit log:', error);
    }
  }
}

module.exports = { HoldService }; 