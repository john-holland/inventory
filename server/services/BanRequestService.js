"use strict";

class BanRequestService {
  constructor(em) {
    this.em = em;
    this.banRequestRepository = em.getRepository('BanRequest');
    this.userRepository = em.getRepository('User');
    this.notificationService = null; // Will be injected
  }

  /**
   * Set notification service reference
   */
  setNotificationService(notificationService) {
    this.notificationService = notificationService;
  }

  /**
   * Create a new ban request
   */
  async createBanRequest(data) {
    try {
      const { targetUserId, requestedBy, banLevel, reason, evidence, type = 'ban_request' } = data;

      // Validate target user exists
      const targetUser = await this.userRepository.findOne({ id: targetUserId });
      if (!targetUser) {
        throw new Error('Target user not found');
      }

      // Validate requesting user has CSR role
      const requestingUser = await this.userRepository.findOne({ id: requestedBy });
      if (!requestingUser || !['CUSTOMER_SUPPORT_ROLE_EMPLOYEE', 'ADMIN', 'IT_ADMIN', 'HR_ADMIN'].includes(requestingUser.role)) {
        throw new Error('Insufficient permissions to create ban request');
      }

      // Check if there's already a pending request for this user
      const existingRequest = await this.banRequestRepository.findOne({
        targetUserId,
        status: 'pending',
        type
      });

      if (existingRequest) {
        throw new Error('A pending request already exists for this user');
      }

      // Set expiration time (24 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const banRequest = this.banRequestRepository.create({
        type,
        targetUserId,
        targetUsername: targetUser.username,
        requestedBy,
        requestedByUsername: requestingUser.username,
        banLevel,
        reason,
        evidence,
        status: 'pending',
        adminVotes: {},
        requiredVotes: 2,
        expiresAt
      });

      await this.banRequestRepository.persistAndFlush(banRequest);

      // Notify all admin users
      await this.notifyAdmins(banRequest);

      return banRequest;
    } catch (error) {
      console.error('Error creating ban request:', error);
      throw error;
    }
  }

  /**
   * Vote on a ban request (admin and CSR employees)
   */
  async voteOnBanRequest(requestId, voterUserId, vote) {
    try {
      const banRequest = await this.banRequestRepository.findOne({ id: requestId });
      if (!banRequest) {
        throw new Error('Ban request not found');
      }

      if (banRequest.status !== 'pending') {
        throw new Error('Ban request is no longer pending');
      }

      // Check if voter has already voted
      if (banRequest.adminVotes[voterUserId]) {
        throw new Error('You have already voted on this request');
      }

      // Validate voter role - allow CSR employees and admins to vote
      const voterUser = await this.userRepository.findOne({ id: voterUserId });
      if (!voterUser || !['ADMIN', 'IT_ADMIN', 'HR_ADMIN', 'CSR_ADMIN', 'CUSTOMER_SUPPORT_ROLE_EMPLOYEE'].includes(voterUser.role)) {
        throw new Error('Insufficient permissions to vote on ban request');
      }

      // Add vote
      banRequest.adminVotes[voterUserId] = vote;
      banRequest.updatedAt = new Date();

      // Check if quorum is reached
      const approveVotes = Object.values(banRequest.adminVotes).filter(v => v === 'approve').length;
      const rejectVotes = Object.values(banRequest.adminVotes).filter(v => v === 'reject').length;

      if (approveVotes >= banRequest.requiredVotes) {
        // Request approved
        await this.approveBanRequest(banRequest, voterUserId);
      } else if (rejectVotes >= banRequest.requiredVotes) {
        // Request rejected
        await this.rejectBanRequest(banRequest, voterUserId);
      }

      await this.banRequestRepository.persistAndFlush(banRequest);

      return banRequest;
    } catch (error) {
      console.error('Error voting on ban request:', error);
      throw error;
    }
  }

  /**
   * Approve a ban request
   */
  async approveBanRequest(banRequest, approvedBy) {
    try {
      const targetUser = await this.userRepository.findOne({ id: banRequest.targetUserId });
      if (!targetUser) {
        throw new Error('Target user not found');
      }

      // Apply the ban
      targetUser.banLevel = banRequest.banLevel;
      targetUser.banReason = banRequest.reason;
      targetUser.banExpiresAt = banRequest.banLevel === 'permanent' ? null : new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours for temporary

      await this.userRepository.persistAndFlush(targetUser);

      // Update ban request
      banRequest.status = 'approved';
      banRequest.approvedBy = approvedBy;
      banRequest.approvedAt = new Date();

      // Notify CSR who made the request
      await this.notifyCSR(banRequest, 'approved');

      console.log(`✅ Ban request approved for user ${targetUser.username}`);
    } catch (error) {
      console.error('Error approving ban request:', error);
      throw error;
    }
  }

  /**
   * Reject a ban request
   */
  async rejectBanRequest(banRequest, rejectedBy, rejectionReason = null) {
    try {
      banRequest.status = 'rejected';
      banRequest.rejectedBy = rejectedBy;
      banRequest.rejectedAt = new Date();
      banRequest.rejectionReason = rejectionReason;

      // Notify CSR who made the request
      await this.notifyCSR(banRequest, 'rejected', rejectionReason);

      console.log(`❌ Ban request rejected for user ${banRequest.targetUsername}`);
    } catch (error) {
      console.error('Error rejecting ban request:', error);
      throw error;
    }
  }

  /**
   * Get ban requests for CSR user
   */
  async getBanRequestsForCSR(csrUserId, filters = {}) {
    try {
      const query = { requestedBy: csrUserId };
      
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.type) {
        query.type = filters.type;
      }

      const banRequests = await this.banRequestRepository.find(query, {
        orderBy: { createdAt: 'DESC' },
        limit: filters.limit || 50
      });

      return banRequests;
    } catch (error) {
      console.error('Error getting ban requests for CSR:', error);
      throw error;
    }
  }

  /**
   * Get pending ban requests for admin users
   */
  async getPendingBanRequests() {
    try {
      const banRequests = await this.banRequestRepository.find(
        { status: 'pending' },
        { orderBy: { createdAt: 'ASC' } }
      );

      return banRequests;
    } catch (error) {
      console.error('Error getting pending ban requests:', error);
      throw error;
    }
  }

  /**
   * Get ban request by ID
   */
  async getBanRequestById(requestId) {
    try {
      const banRequest = await this.banRequestRepository.findOne({ id: requestId });
      return banRequest;
    } catch (error) {
      console.error('Error getting ban request:', error);
      throw error;
    }
  }

  /**
   * Notify admin users of new ban request
   */
  async notifyAdmins(banRequest) {
    if (!this.notificationService) {
      console.warn('Notification service not available');
      return;
    }

    try {
      const adminUsers = await this.userRepository.find({ 
        role: { $in: ['ADMIN', 'IT_ADMIN', 'HR_ADMIN', 'CSR_ADMIN'] } 
      });

      const message = `New ${banRequest.type.replace('_', ' ')} for user ${banRequest.targetUsername}: ${banRequest.reason}`;

      for (const admin of adminUsers) {
        await this.notificationService.createNotification({
          userId: admin.id,
          title: `Ban Request - ${banRequest.type.toUpperCase()}`,
          message: message,
          type: 'ban_request',
          priority: 'high',
          data: {
            requestId: banRequest.id,
            targetUserId: banRequest.targetUserId,
            targetUsername: banRequest.targetUsername,
            banLevel: banRequest.banLevel,
            reason: banRequest.reason
          }
        });
      }
    } catch (error) {
      console.error('Error notifying admins:', error);
    }
  }

  /**
   * Notify CSR of ban request status change
   */
  async notifyCSR(banRequest, status, rejectionReason = null) {
    if (!this.notificationService) {
      console.warn('Notification service not available');
      return;
    }

    try {
      const csrUser = await this.userRepository.findOne({ id: banRequest.requestedBy });
      if (!csrUser) return;

      const statusMessages = {
        'approved': `Your ${banRequest.type.replace('_', ' ')} for ${banRequest.targetUsername} has been approved.`,
        'rejected': `Your ${banRequest.type.replace('_', ' ')} for ${banRequest.targetUsername} has been rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`
      };

      await this.notificationService.createNotification({
        userId: csrUser.id,
        title: `Ban Request ${status.toUpperCase()}`,
        message: statusMessages[status],
        type: 'ban_request_update',
        priority: 'medium',
        data: {
          requestId: banRequest.id,
          status,
          targetUsername: banRequest.targetUsername,
          rejectionReason
        }
      });
    } catch (error) {
      console.error('Error notifying CSR:', error);
    }
  }

  /**
   * Clean up expired ban requests and notify concerned parties
   */
  async cleanupExpiredRequests() {
    try {
      const expiredRequests = await this.banRequestRepository.find({
        status: 'pending',
        expiresAt: { $lt: new Date() }
      });

      for (const request of expiredRequests) {
        request.status = 'expired';
        request.updatedAt = new Date();
        
        // Notify concerned parties about expired request
        await this.notifyExpiredRequest(request);
      }

      if (expiredRequests.length > 0) {
        await this.banRequestRepository.persistAndFlush(expiredRequests);
        console.log(`🧹 Cleaned up ${expiredRequests.length} expired ban requests`);
      }
    } catch (error) {
      console.error('Error cleaning up expired requests:', error);
    }
  }

  /**
   * Notify concerned parties about expired ban request
   */
  async notifyExpiredRequest(banRequest) {
    if (!this.notificationService) {
      console.warn('Notification service not available');
      return;
    }

    try {
      // Notify the CSR who made the request
      await this.notificationService.createNotification({
        userId: banRequest.requestedBy,
        title: 'Ban Request Expired',
        message: `Your ${banRequest.type.replace('_', ' ')} for ${banRequest.targetUsername} has expired without reaching quorum.`,
        type: 'ban_request_expired',
        priority: 'medium',
        data: {
          requestId: banRequest.id,
          targetUsername: banRequest.targetUsername,
          reason: banRequest.reason
        }
      });

      // Notify all admin users about the expired request
      const adminUsers = await this.userRepository.find({ 
        role: { $in: ['ADMIN', 'IT_ADMIN', 'HR_ADMIN', 'CSR_ADMIN'] } 
      });

      for (const admin of adminUsers) {
        await this.notificationService.createNotification({
          userId: admin.id,
          title: 'Ban Request Expired',
          message: `Ban request for ${banRequest.targetUsername} has expired without reaching quorum.`,
          type: 'ban_request_expired',
          priority: 'medium',
          data: {
            requestId: banRequest.id,
            targetUsername: banRequest.targetUsername,
            requestedBy: banRequest.requestedByUsername,
            reason: banRequest.reason
          }
        });
      }

      console.log(`📢 Notified concerned parties about expired ban request for ${banRequest.targetUsername}`);
    } catch (error) {
      console.error('Error notifying about expired request:', error);
    }
  }
}

module.exports = BanRequestService; 