const { wrap } = require("@mikro-orm/core");
const { getCoefficient } = require('../config/ConstantMarketCoefficients');
const bcrypt = require('bcrypt');

class WaitlistService {
  constructor(DI) {
    this.DI = DI;
    this.constants = getCoefficient;
  }

  // Add user to waitlist
  async addToWaitlist(waitlistData, requestInfo = {}) {
    try {
      const { email, firstName, lastName, phone } = waitlistData;

      // Check if email already exists in waitlist
      const existingWaitlist = await this.DI.waitlistRepository.findOne({ email });
      if (existingWaitlist) {
        throw new Error('Email already exists in waitlist');
      }

      // Check if email already exists as a user
      const existingUser = await this.DI.userRepository.findOne({ email });
      if (existingUser) {
        throw new Error('Email already registered as a user');
      }

      // Check whitelist for auto-approval
      const whitelistMatch = await this.checkWhitelist(email, firstName, lastName, phone);
      let status = 'pending';
      
      if (whitelistMatch) {
        status = 'whitelisted';
      }

      // Create waitlist entry
      const waitlist = new this.DI.waitlistRepository.entity(
        email,
        firstName,
        lastName,
        phone,
        status
      );

      // Add request metadata
      waitlist.metadata = {
        ...waitlist.metadata,
        source: 'web_form',
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        referrer: requestInfo.referrer,
        priority: whitelistMatch ? whitelistMatch.metadata.priority : 0
      };

      await this.DI.waitlistRepository.persistAndFlush(waitlist);

      // If whitelisted, auto-approve and create user account
      if (whitelistMatch && whitelistMatch.autoApprove) {
        await this.autoApproveWaitlist(waitlist.id, whitelistMatch);
      }

      return {
        success: true,
        message: status === 'whitelisted' ? 
          'Congratulations! Welcome to the inventory. Happy sharing...' :
          'Please accept our gratitude for waiting to be admitted to the Inventory.',
        data: {
          id: waitlist.id,
          email: waitlist.email,
          status: waitlist.status,
          appliedAt: waitlist.appliedAt,
          autoApproved: status === 'whitelisted'
        }
      };
    } catch (error) {
      console.error('Error adding to waitlist:', error);
      throw new Error(`Failed to add to waitlist: ${error.message}`);
    }
  }

  // Check if user is in whitelist
  async checkWhitelist(email, firstName, lastName, phone) {
    try {
      // Check by exact email match
      let whitelistEntry = await this.DI.whitelistRepository.findOne({
        email: email,
        status: 'active'
      });

      if (whitelistEntry) {
        return whitelistEntry;
      }

      // Check by domain match
      const domain = email.split('@')[1];
      whitelistEntry = await this.DI.whitelistRepository.findOne({
        type: 'domain',
        email: domain,
        status: 'active'
      });

      if (whitelistEntry) {
        return whitelistEntry;
      }

      // Check by phone number
      if (phone) {
        whitelistEntry = await this.DI.whitelistRepository.findOne({
          phone: phone,
          status: 'active'
        });

        if (whitelistEntry) {
          return whitelistEntry;
        }
      }

      // Check by name match (fuzzy matching)
      if (firstName && lastName) {
        const nameMatches = await this.DI.whitelistRepository.find({
          $or: [
            { firstName: firstName, lastName: lastName },
            { firstName: lastName, lastName: firstName }
          ],
          status: 'active'
        });

        if (nameMatches.length > 0) {
          // Return the highest priority match
          return nameMatches.reduce((highest, current) => 
            current.metadata.priority > highest.metadata.priority ? current : highest
          );
        }
      }

      return null;
    } catch (error) {
      console.error('Error checking whitelist:', error);
      return null;
    }
  }

  // Auto-approve waitlist entry
  async autoApproveWaitlist(waitlistId, whitelistMatch = null) {
    try {
      const waitlist = await this.DI.waitlistRepository.findOne({ id: waitlistId });
      
      if (!waitlist) {
        throw new Error('Waitlist entry not found');
      }

      if (waitlist.status !== 'pending' && waitlist.status !== 'whitelisted') {
        throw new Error('Waitlist entry cannot be auto-approved');
      }

      // Create user account
      const hashedPassword = await bcrypt.hash(this.generateTemporaryPassword(), 10);
      
      const user = new this.DI.userRepository.entity(
        waitlist.email,
        hashedPassword,
        waitlist.firstName,
        waitlist.lastName,
        'active'
      );

      user.phone = waitlist.phone;
      user.metadata = {
        ...user.metadata,
        source: 'waitlist_auto_approval',
        waitlistId: waitlist.id,
        whitelistId: whitelistMatch ? whitelistMatch.id : null
      };

      await this.DI.userRepository.persistAndFlush(user);

      // Update waitlist status
      wrap(waitlist).assign({
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: null, // Auto-approved
        userId: user.id
      });

      await this.DI.waitlistRepository.flush();

      return {
        success: true,
        message: 'Congratulations! Welcome to the inventory. Happy sharing...',
        data: {
          userId: user.id,
          email: user.email,
          status: 'approved',
          approvedAt: waitlist.approvedAt
        }
      };
    } catch (error) {
      console.error('Error auto-approving waitlist:', error);
      throw new Error(`Failed to auto-approve waitlist: ${error.message}`);
    }
  }

  // Manually approve waitlist entry
  async approveWaitlist(waitlistId, adminUserId, notes = '') {
    try {
      const waitlist = await this.DI.waitlistRepository.findOne({ id: waitlistId });
      
      if (!waitlist) {
        throw new Error('Waitlist entry not found');
      }

      if (waitlist.status !== 'pending') {
        throw new Error('Waitlist entry cannot be approved');
      }

      // Create user account
      const hashedPassword = await bcrypt.hash(this.generateTemporaryPassword(), 10);
      
      const user = new this.DI.userRepository.entity(
        waitlist.email,
        hashedPassword,
        waitlist.firstName,
        waitlist.lastName,
        'active'
      );

      user.phone = waitlist.phone;
      user.metadata = {
        ...user.metadata,
        source: 'waitlist_manual_approval',
        waitlistId: waitlist.id,
        approvedBy: adminUserId,
        notes: notes
      };

      await this.DI.userRepository.persistAndFlush(user);

      // Update waitlist status
      wrap(waitlist).assign({
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: adminUserId,
        userId: user.id
      });

      if (notes) {
        waitlist.metadata.notes = notes;
      }

      await this.DI.waitlistRepository.flush();

      return {
        success: true,
        message: 'Congratulations! Welcome to the inventory. Happy sharing...',
        data: {
          userId: user.id,
          email: user.email,
          status: 'approved',
          approvedAt: waitlist.approvedAt,
          approvedBy: adminUserId
        }
      };
    } catch (error) {
      console.error('Error approving waitlist:', error);
      throw new Error(`Failed to approve waitlist: ${error.message}`);
    }
  }

  // Reject waitlist entry
  async rejectWaitlist(waitlistId, adminUserId, reason) {
    try {
      const waitlist = await this.DI.waitlistRepository.findOne({ id: waitlistId });
      
      if (!waitlist) {
        throw new Error('Waitlist entry not found');
      }

      if (waitlist.status !== 'pending') {
        throw new Error('Waitlist entry cannot be rejected');
      }

      wrap(waitlist).assign({
        status: 'rejected',
        rejectedAt: new Date(),
        rejectedBy: adminUserId,
        rejectionReason: reason
      });

      await this.DI.waitlistRepository.flush();

      return {
        success: true,
        message: 'Waitlist entry rejected',
        data: {
          id: waitlist.id,
          email: waitlist.email,
          status: 'rejected',
          rejectedAt: waitlist.rejectedAt,
          rejectionReason: reason
        }
      };
    } catch (error) {
      console.error('Error rejecting waitlist:', error);
      throw new Error(`Failed to reject waitlist: ${error.message}`);
    }
  }

  // Get waitlist statistics
  async getWaitlistStats() {
    try {
      const total = await this.DI.waitlistRepository.count({});
      const pending = await this.DI.waitlistRepository.count({ status: 'pending' });
      const approved = await this.DI.waitlistRepository.count({ status: 'approved' });
      const rejected = await this.DI.waitlistRepository.count({ status: 'rejected' });
      const whitelisted = await this.DI.waitlistRepository.count({ status: 'whitelisted' });

      // Get recent activity
      const recentApplications = await this.DI.waitlistRepository.find({
        appliedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }, {
        orderBy: { appliedAt: 'DESC' },
        limit: 10
      });

      // Get approval rate
      const approvalRate = total > 0 ? (approved / total) * 100 : 0;

      return {
        success: true,
        data: {
          total,
          pending,
          approved,
          rejected,
          whitelisted,
          approvalRate: Math.round(approvalRate * 100) / 100,
          recentApplications: recentApplications.length,
          averageWaitTime: await this.calculateAverageWaitTime()
        }
      };
    } catch (error) {
      console.error('Error getting waitlist stats:', error);
      throw new Error('Failed to get waitlist statistics');
    }
  }

  // Calculate average wait time
  async calculateAverageWaitTime() {
    try {
      const approvedEntries = await this.DI.waitlistRepository.find({
        status: 'approved',
        approvedAt: { $ne: null }
      });

      if (approvedEntries.length === 0) {
        return 0;
      }

      const totalWaitTime = approvedEntries.reduce((sum, entry) => {
        const waitTime = entry.approvedAt.getTime() - entry.appliedAt.getTime();
        return sum + waitTime;
      }, 0);

      const averageWaitTimeMs = totalWaitTime / approvedEntries.length;
      return Math.round(averageWaitTimeMs / (24 * 60 * 60 * 1000)); // Convert to days
    } catch (error) {
      console.error('Error calculating average wait time:', error);
      return 0;
    }
  }

  // Add entry to whitelist
  async addToWhitelist(whitelistData, adminUserId) {
    try {
      const { email, firstName, lastName, phone, type = 'email', reason = '' } = whitelistData;

      // Check if already exists
      const existing = await this.DI.whitelistRepository.findOne({
        email: email,
        type: type,
        status: 'active'
      });

      if (existing) {
        throw new Error('Entry already exists in whitelist');
      }

      const whitelist = new this.DI.whitelistRepository.entity(
        email,
        firstName,
        lastName,
        phone,
        type
      );

      whitelist.addedBy = adminUserId;
      whitelist.metadata = {
        ...whitelist.metadata,
        reason: reason,
        source: 'admin'
      };

      await this.DI.whitelistRepository.persistAndFlush(whitelist);

      return {
        success: true,
        message: 'Entry added to whitelist successfully',
        data: {
          id: whitelist.id,
          email: whitelist.email,
          type: whitelist.type,
          addedAt: whitelist.addedAt
        }
      };
    } catch (error) {
      console.error('Error adding to whitelist:', error);
      throw new Error(`Failed to add to whitelist: ${error.message}`);
    }
  }

  // Remove entry from whitelist
  async removeFromWhitelist(whitelistId, adminUserId) {
    try {
      const whitelist = await this.DI.whitelistRepository.findOne({ id: whitelistId });
      
      if (!whitelist) {
        throw new Error('Whitelist entry not found');
      }

      wrap(whitelist).assign({
        status: 'inactive'
      });

      await this.DI.whitelistRepository.flush();

      return {
        success: true,
        message: 'Entry removed from whitelist successfully',
        data: {
          id: whitelist.id,
          email: whitelist.email,
          status: 'inactive'
        }
      };
    } catch (error) {
      console.error('Error removing from whitelist:', error);
      throw new Error(`Failed to remove from whitelist: ${error.message}`);
    }
  }

  // Generate temporary password
  generateTemporaryPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // Process daily waitlist review
  async processDailyReview() {
    try {
      const pendingEntries = await this.DI.waitlistRepository.find({
        status: 'pending'
      }, {
        orderBy: { appliedAt: 'ASC' }
      });

      const dailyLimit = this.constants('WAITLIST.LIMITS.DAILY_APPROVAL_LIMIT', 100);
      let processed = 0;

      for (const entry of pendingEntries) {
        if (processed >= dailyLimit) {
          break;
        }

        // Check whitelist again (in case new entries were added)
        const whitelistMatch = await this.checkWhitelist(
          entry.email, 
          entry.firstName, 
          entry.lastName, 
          entry.phone
        );

        if (whitelistMatch && whitelistMatch.autoApprove) {
          await this.autoApproveWaitlist(entry.id, whitelistMatch);
          processed++;
        }
      }

      return {
        success: true,
        message: `Daily review completed. Processed ${processed} entries.`,
        data: {
          processed,
          totalPending: pendingEntries.length
        }
      };
    } catch (error) {
      console.error('Error processing daily review:', error);
      throw new Error('Failed to process daily review');
    }
  }
}

module.exports = { WaitlistService }; 