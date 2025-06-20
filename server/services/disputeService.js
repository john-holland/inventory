const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

class DisputeService {
  constructor(em, disputeRepository, holdRepository, carePhotoRepository, userRepository, notificationService, shippingService, investmentService) {
    this.em = em;
    this.disputeRepository = disputeRepository;
    this.holdRepository = holdRepository;
    this.carePhotoRepository = carePhotoRepository;
    this.userRepository = userRepository;
    this.notificationService = notificationService;
    this.shippingService = shippingService;
    this.investmentService = investmentService;
    
    // Email configuration
    this.emailTransporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async createDispute(holdId, initiatedBy, disputeType, description, additionalPhotos = []) {
    try {
      const hold = await this.holdRepository.findOne({ id: holdId });
      if (!hold) {
        throw new Error('Hold not found');
      }

      const user = await this.userRepository.findOne({ id: initiatedBy });
      if (!user) {
        throw new Error('User not found');
      }

      // Check if user is involved in this hold
      const item = await this.em.findOne('Item', { id: hold.itemId });
      if (hold.userId !== initiatedBy && item.listedBy !== initiatedBy) {
        throw new Error('Unauthorized to create dispute for this hold');
      }

      // Check if dispute already exists
      const existingDispute = await this.disputeRepository.findOne({ 
        holdId, 
        status: { $in: ['open', 'under_review'] } 
      });
      if (existingDispute) {
        throw new Error('An active dispute already exists for this hold');
      }

      // Create dispute
      const dispute = new this.disputeRepository.entity(
        holdId,
        initiatedBy,
        disputeType,
        description
      );

      await this.disputeRepository.persistAndFlush(dispute);

      // Upload additional photos if provided
      if (additionalPhotos.length > 0) {
        for (const photo of additionalPhotos) {
          const carePhoto = new this.carePhotoRepository.entity(
            holdId,
            initiatedBy,
            'dispute',
            photo.imageUrl,
            `Dispute evidence: ${disputeType}`
          );
          await this.carePhotoRepository.persistAndFlush(carePhoto);
        }
      }

      // Send notifications to all parties involved
      const allParties = [hold.userId, item.listedBy];
      for (const partyId of allParties) {
        if (partyId !== initiatedBy) {
          await this.notificationService.createNotification(
            partyId,
            'dispute_created',
            'New Dispute Created',
            `A dispute has been created for hold #${holdId}`,
            'dispute',
            dispute.id,
            'high'
          );
        }
      }

      // Send email notifications
      await this.sendDisputeEmails(dispute, hold, item);

      return dispute;
    } catch (error) {
      throw new Error(`Failed to create dispute: ${error.message}`);
    }
  }

  async updateDispute(disputeId, updates, updatedBy) {
    try {
      const dispute = await this.disputeRepository.findOne({ id: disputeId });
      if (!dispute) {
        throw new Error('Dispute not found');
      }

      // Check if user has permission to update
      const hold = await this.holdRepository.findOne({ id: dispute.holdId });
      const item = await this.em.findOne('Item', { id: hold.itemId });
      
      if (dispute.initiatedBy !== updatedBy && 
          hold.userId !== updatedBy && 
          item.listedBy !== updatedBy) {
        throw new Error('Unauthorized to update this dispute');
      }

      // Update allowed fields
      if (updates.description) {
        dispute.description = updates.description;
      }

      dispute.updatedAt = new Date();
      await this.disputeRepository.persistAndFlush(dispute);

      return dispute;
    } catch (error) {
      throw new Error(`Failed to update dispute: ${error.message}`);
    }
  }

  async resolveDispute(disputeId, resolvedBy, resolution, moderationNotes = '', moderationActions = {}) {
    try {
      const dispute = await this.disputeRepository.findOne({ id: disputeId });
      if (!dispute) {
        throw new Error('Dispute not found');
      }

      // Only moderators or admins can resolve disputes
      const resolver = await this.userRepository.findOne({ id: resolvedBy });
      if (!resolver || !resolver.isModerator) {
        throw new Error('Unauthorized to resolve disputes');
      }

      dispute.status = 'resolved';
      dispute.resolvedBy = resolvedBy;
      dispute.resolvedAt = new Date();
      dispute.resolution = resolution;
      dispute.moderationNotes = moderationNotes;
      dispute.updatedAt = new Date();

      // Apply moderation actions
      if (moderationActions.holdReleaseOrdered) {
        await this.orderHoldRelease(dispute, resolvedBy);
      }

      if (moderationActions.createShipmentLabel) {
        await this.createReturnShipmentLabel(dispute, resolvedBy);
      }

      if (moderationActions.banUser) {
        await this.applyBan(dispute, moderationActions.banUser, resolvedBy);
      }

      // Record moderation actions
      dispute.moderationActions.push({
        action: 'dispute_resolved',
        moderatorId: resolvedBy,
        timestamp: new Date(),
        details: moderationActions
      });

      await this.disputeRepository.persistAndFlush(dispute);

      // Send notifications to all parties
      const hold = await this.holdRepository.findOne({ id: dispute.holdId });
      const item = await this.em.findOne('Item', { id: hold.itemId });
      
      const allParties = [hold.userId, item.listedBy, dispute.initiatedBy];
      for (const partyId of allParties) {
        await this.notificationService.createNotification(
          partyId,
          'dispute_resolved',
          'Dispute Resolved',
          `Dispute #${disputeId} has been resolved`,
          'dispute',
          dispute.id,
          'high'
        );
      }

      // Send resolution emails
      await this.sendResolutionEmails(dispute, hold, item, resolution);

      return dispute;
    } catch (error) {
      throw new Error(`Failed to resolve dispute: ${error.message}`);
    }
  }

  async orderHoldRelease(dispute, moderatorId) {
    try {
      const hold = await this.holdRepository.findOne({ id: dispute.holdId });
      if (!hold) {
        throw new Error('Hold not found');
      }

      // Release the hold
      hold.status = 'released';
      hold.releaseDate = new Date();
      hold.metadata.releaseReason = 'Dispute resolution - moderator ordered release';
      hold.metadata.moderationNotes = dispute.moderationNotes;

      await this.holdRepository.persistAndFlush(hold);

      // Mark dispute as having hold release ordered
      dispute.holdReleaseOrdered = true;
      dispute.moderationActions.push({
        action: 'hold_release_ordered',
        moderatorId: moderatorId,
        timestamp: new Date(),
        holdId: hold.id
      });

      // Notify the holder
      await this.notificationService.createNotification(
        hold.userId,
        'hold_released_by_moderator',
        'Hold Released by Moderator',
        `Your hold #${hold.id} has been released by a moderator due to dispute resolution`,
        'hold',
        hold.id,
        'high'
      );

      return hold;
    } catch (error) {
      throw new Error(`Failed to order hold release: ${error.message}`);
    }
  }

  async createReturnShipmentLabel(dispute, moderatorId) {
    try {
      const hold = await this.holdRepository.findOne({ id: dispute.holdId });
      if (!hold) {
        throw new Error('Hold not found');
      }

      const item = await this.em.findOne('Item', { id: hold.itemId });
      const holder = await this.userRepository.findOne({ id: hold.userId });
      const lister = await this.userRepository.findOne({ id: item.listedBy });

      // Use the hold investment to create a return shipment label
      const shippingCost = await this.shippingService.calculateShippingCost(
        holder.defaultAddressId,
        lister.defaultAddressId,
        item.weight,
        item.dimensions
      );

      // Create shipment label using the hold amount
      const shipmentLabel = await this.shippingService.createReturnShipmentLabel({
        fromAddress: holder.defaultAddressId,
        toAddress: lister.defaultAddressId,
        itemId: item.id,
        holdId: hold.id,
        disputeId: dispute.id,
        cost: Math.min(hold.amount / 2, shippingCost), // Use hold amount for shipping
        priority: 'high',
        notes: `Return shipment due to dispute resolution - Dispute #${dispute.id}`
      });

      // Mark dispute as having shipment label created
      dispute.shipmentLabelCreated = true;
      dispute.moderationActions.push({
        action: 'return_shipment_label_created',
        moderatorId: moderatorId,
        timestamp: new Date(),
        shipmentLabelId: shipmentLabel.id,
        cost: shipmentLabel.cost
      });

      // Notify both parties about the shipment label
      await this.notificationService.createNotification(
        hold.userId,
        'return_shipment_label_created',
        'Return Shipment Label Created',
        `A return shipment label has been created for hold #${hold.id} due to dispute resolution`,
        'hold',
        hold.id,
        'high'
      );

      await this.notificationService.createNotification(
        item.listedBy,
        'return_shipment_label_created',
        'Return Shipment Label Created',
        `A return shipment label has been created for item #${item.id} due to dispute resolution`,
        'item',
        item.id,
        'high'
      );

      return shipmentLabel;
    } catch (error) {
      throw new Error(`Failed to create return shipment label: ${error.message}`);
    }
  }

  async applyBan(dispute, banDetails, moderatorId) {
    try {
      const { userId, banLevel, reason, expiryDate, disbursementInfo } = banDetails;
      
      const user = await this.userRepository.findOne({ id: userId });
      if (!user) {
        throw new Error('User to ban not found');
      }

      // Apply the ban
      dispute.banLevel = banLevel;
      dispute.bannedUserId = userId;
      dispute.banReason = reason;
      dispute.banExpiryDate = expiryDate ? new Date(expiryDate) : null;
      dispute.disbursementInfo = disbursementInfo;

      // Update user's ban status
      user.banLevel = banLevel;
      user.banReason = reason;
      user.banExpiryDate = expiryDate ? new Date(expiryDate) : null;
      user.bannedAt = new Date();
      user.bannedBy = moderatorId;

      // Handle different ban levels
      switch (banLevel) {
        case 'no-buy':
          user.canBuy = false;
          break;
        case 'no-list':
          user.canList = false;
          break;
        case 'hide':
          user.isHidden = true;
          break;
        case 'ip-ban':
          user.ipBanned = true;
          break;
        case 'email-ban':
          user.emailBanned = true;
          break;
        case 'unlist':
          // Unlist all user's items
          const userItems = await this.em.find('Item', { listedBy: userId, status: 'available' });
          for (const item of userItems) {
            item.status = 'unlisted';
            item.unlistedAt = new Date();
            item.unlistedReason = `Dispute resolution - ${reason}`;
            await this.em.persistAndFlush(item);
          }
          break;
      }

      await this.userRepository.persistAndFlush(user);

      // Record the ban action
      dispute.moderationActions.push({
        action: 'user_banned',
        moderatorId: moderatorId,
        timestamp: new Date(),
        banLevel: banLevel,
        reason: reason,
        expiryDate: expiryDate
      });

      // Notify the banned user
      await this.notificationService.createNotification(
        userId,
        'user_banned',
        'Account Restricted',
        `Your account has been restricted: ${banLevel}. Reason: ${reason}`,
        'system',
        null,
        'urgent'
      );

      // Send ban notification email
      await this.sendBanNotificationEmail(user, banLevel, reason, expiryDate, disbursementInfo);

      return user;
    } catch (error) {
      throw new Error(`Failed to apply ban: ${error.message}`);
    }
  }

  async getDispute(disputeId, userId) {
    try {
      const dispute = await this.disputeRepository.findOne({ id: disputeId });
      if (!dispute) {
        throw new Error('Dispute not found');
      }

      // Check if user has permission to view
      const hold = await this.holdRepository.findOne({ id: dispute.holdId });
      const item = await this.em.findOne('Item', { id: hold.itemId });
      
      if (dispute.initiatedBy !== userId && 
          hold.userId !== userId && 
          item.listedBy !== userId) {
        throw new Error('Unauthorized to view this dispute');
      }

      // Get related photos
      const photos = await this.carePhotoRepository.find({ 
        holdId: dispute.holdId,
        photoType: 'dispute'
      });

      return {
        ...dispute,
        photos
      };
    } catch (error) {
      throw new Error(`Failed to get dispute: ${error.message}`);
    }
  }

  async getHoldDisputes(holdId, userId) {
    try {
      const hold = await this.holdRepository.findOne({ id: holdId });
      if (!hold) {
        throw new Error('Hold not found');
      }

      // Check if user has permission to view
      const item = await this.em.findOne('Item', { id: hold.itemId });
      if (hold.userId !== userId && item.listedBy !== userId) {
        throw new Error('Unauthorized to view disputes for this hold');
      }

      const disputes = await this.disputeRepository.find(
        { holdId },
        { orderBy: { createdAt: 'DESC' } }
      );

      return disputes;
    } catch (error) {
      throw new Error(`Failed to get hold disputes: ${error.message}`);
    }
  }

  async sendDisputeEmails(dispute, hold, item) {
    try {
      const initiator = await this.userRepository.findOne({ id: dispute.initiatedBy });
      const holder = await this.userRepository.findOne({ id: hold.userId });
      const lister = await this.userRepository.findOne({ id: item.listedBy });

      const disputeEmailTemplate = `
        <h2>New Dispute Created</h2>
        <p><strong>Dispute ID:</strong> ${dispute.id}</p>
        <p><strong>Hold ID:</strong> ${hold.id}</p>
        <p><strong>Item:</strong> ${item.title}</p>
        <p><strong>Type:</strong> ${dispute.disputeType}</p>
        <p><strong>Description:</strong> ${dispute.description}</p>
        <p><strong>Initiated by:</strong> ${initiator.email}</p>
        <p><strong>Date:</strong> ${dispute.createdAt}</p>
        
        <h3>Parties Involved:</h3>
        <ul>
          <li>Holder: ${holder.email}</li>
          <li>Lister: ${lister.email}</li>
        </ul>
        
        <p>Our moderation team will review this dispute and contact you with a resolution.</p>
      `;

      // Send to all parties
      const allParties = [holder, lister];
      for (const party of allParties) {
        await this.emailTransporter.sendMail({
          from: process.env.SMTP_FROM || 'noreply@inventory.com',
          to: party.email,
          subject: `Dispute Created - Hold #${hold.id}`,
          html: disputeEmailTemplate
        });
      }

      // Send to moderation team
      await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@inventory.com',
        to: process.env.MODERATION_EMAIL || 'moderation@inventory.com',
        subject: `New Dispute Requires Review - #${dispute.id}`,
        html: disputeEmailTemplate
      });

    } catch (error) {
      console.error('Failed to send dispute emails:', error);
    }
  }

  async sendResolutionEmails(dispute, hold, item, resolution) {
    try {
      const initiator = await this.userRepository.findOne({ id: dispute.initiatedBy });
      const holder = await this.userRepository.findOne({ id: hold.userId });
      const lister = await this.userRepository.findOne({ id: item.listedBy });
      const resolver = await this.userRepository.findOne({ id: dispute.resolvedBy });

      const resolutionEmailTemplate = `
        <h2>Dispute Resolved</h2>
        <p><strong>Dispute ID:</strong> ${dispute.id}</p>
        <p><strong>Hold ID:</strong> ${hold.id}</p>
        <p><strong>Item:</strong> ${item.title}</p>
        <p><strong>Resolution:</strong> ${resolution}</p>
        <p><strong>Resolved by:</strong> ${resolver.email}</p>
        <p><strong>Date:</strong> ${dispute.resolvedAt}</p>
        
        <h3>Moderation Notes:</h3>
        <p>${dispute.moderationNotes || 'No additional notes provided.'}</p>
        
        ${dispute.holdReleaseOrdered ? '<p><strong>Hold Release:</strong> The hold has been ordered to be released.</p>' : ''}
        ${dispute.shipmentLabelCreated ? '<p><strong>Return Shipment:</strong> A return shipment label has been created.</p>' : ''}
        ${dispute.banLevel ? `<p><strong>User Restriction:</strong> ${dispute.banLevel} applied to ${dispute.bannedUserId}</p>` : ''}
        
        <p>This dispute has been resolved. If you have any questions, please contact support.</p>
      `;

      // Send to all parties
      const allParties = [holder, lister];
      for (const party of allParties) {
        await this.emailTransporter.sendMail({
          from: process.env.SMTP_FROM || 'noreply@inventory.com',
          to: party.email,
          subject: `Dispute Resolved - Hold #${hold.id}`,
          html: resolutionEmailTemplate
        });
      }

    } catch (error) {
      console.error('Failed to send resolution emails:', error);
    }
  }

  async sendBanNotificationEmail(user, banLevel, reason, expiryDate, disbursementInfo) {
    try {
      const banEmailTemplate = `
        <h2>Account Restriction Notice</h2>
        <p><strong>Account:</strong> ${user.email}</p>
        <p><strong>Restriction Level:</strong> ${banLevel}</p>
        <p><strong>Reason:</strong> ${reason}</p>
        ${expiryDate ? `<p><strong>Expires:</strong> ${new Date(expiryDate).toLocaleDateString()}</p>` : '<p><strong>Duration:</strong> Permanent</p>'}
        
        ${disbursementInfo ? `
        <h3>Fund Disbursement Information</h3>
        <p><strong>Amount:</strong> $${disbursementInfo.amount}</p>
        <p><strong>Method:</strong> ${disbursementInfo.method}</p>
        <p><strong>Details:</strong> ${disbursementInfo.details}</p>
        ` : ''}
        
        <p>If you believe this restriction was applied in error, please contact our support team.</p>
      `;

      await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@inventory.com',
        to: user.email,
        subject: `Account Restriction - ${banLevel}`,
        html: banEmailTemplate
      });

    } catch (error) {
      console.error('Failed to send ban notification email:', error);
    }
  }

  async getDisputeStats() {
    try {
      const disputes = await this.disputeRepository.findAll();
      
      const stats = {
        total: disputes.length,
        byStatus: {},
        byType: {},
        byBanLevel: {},
        resolved: 0,
        open: 0,
        averageResolutionTime: 0,
        moderationActions: {
          holdReleases: 0,
          shipmentLabels: 0,
          bans: 0
        }
      };

      let totalResolutionTime = 0;
      let resolvedCount = 0;

      disputes.forEach(dispute => {
        // Status stats
        if (!stats.byStatus[dispute.status]) {
          stats.byStatus[dispute.status] = 0;
        }
        stats.byStatus[dispute.status]++;

        // Type stats
        if (!stats.byType[dispute.disputeType]) {
          stats.byType[dispute.disputeType] = 0;
        }
        stats.byType[dispute.disputeType]++;

        // Ban level stats
        if (dispute.banLevel) {
          if (!stats.byBanLevel[dispute.banLevel]) {
            stats.byBanLevel[dispute.banLevel] = 0;
          }
          stats.byBanLevel[dispute.banLevel]++;
        }

        // Moderation actions
        if (dispute.holdReleaseOrdered) stats.moderationActions.holdReleases++;
        if (dispute.shipmentLabelCreated) stats.moderationActions.shipmentLabels++;
        if (dispute.banLevel) stats.moderationActions.bans++;

        // Resolution time
        if (dispute.status === 'resolved' && dispute.resolvedAt) {
          const resolutionTime = dispute.resolvedAt - dispute.createdAt;
          totalResolutionTime += resolutionTime;
          resolvedCount++;
        }
      });

      stats.resolved = stats.byStatus.resolved || 0;
      stats.open = stats.byStatus.open || 0;
      stats.averageResolutionTime = resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0;

      return stats;
    } catch (error) {
      throw new Error(`Failed to get dispute stats: ${error.message}`);
    }
  }
}

module.exports = DisputeService; 