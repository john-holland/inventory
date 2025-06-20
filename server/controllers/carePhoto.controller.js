const express = require('express');
const router = express.Router();

class CarePhotoController {
  constructor(carePhotoService, authMiddleware) {
    this.carePhotoService = carePhotoService;
    this.authMiddleware = authMiddleware;
    this.setupRoutes();
  }

  setupRoutes() {
    // Upload care photos
    router.post('/upload/:holdId', 
      this.authMiddleware.requireAuth,
      this.carePhotoService.upload.array('photos', 5),
      this.uploadCarePhoto.bind(this)
    );

    // Confirm care photo
    router.post('/confirm/:photoId', 
      this.authMiddleware.requireAuth,
      this.confirmCarePhoto.bind(this)
    );

    // Get hold photos
    router.get('/hold/:holdId', 
      this.authMiddleware.requireAuth,
      this.getHoldPhotos.bind(this)
    );

    // Delete care photo
    router.delete('/:photoId', 
      this.authMiddleware.requireAuth,
      this.deleteCarePhoto.bind(this)
    );

    // Get photo stats
    router.get('/stats/:holdId', 
      this.authMiddleware.requireAuth,
      this.getPhotoStats.bind(this)
    );

    // Validate photos for shipment
    router.get('/validate-shipment/:holdId', 
      this.authMiddleware.requireAuth,
      this.validatePhotosForShipment.bind(this)
    );
  }

  async uploadCarePhoto(req, res) {
    try {
      const { holdId } = req.params;
      const { photoType, description } = req.body;
      const uploadedBy = req.user.id;

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No photos uploaded for hold ' + holdId });
      }

      const validPhotoTypes = ['receipt', 'condition', 'dispute'];
      if (!validPhotoTypes.includes(photoType)) {
        return res.status(400).json({ error: 'Invalid photo type ' + photoType });
      }

      const photos = await this.carePhotoService.uploadCarePhoto(
        holdId,
        uploadedBy,
        photoType,
        req.files,
        description
      );

      res.status(201).json({
        success: true,
        message: 'Photos uploaded successfully',
        photos
      });
    } catch (error) {
      console.error('(with holdId ' + holdId + ' and photoType ' + photoType + ' and description ' + description + ' and uploadedBy ' + uploadedBy + ') Upload care photo error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async confirmCarePhoto(req, res) {
    try {
      const { photoId } = req.params;
      const confirmedBy = req.user.id;

      const photo = await this.carePhotoService.confirmCarePhoto(photoId, confirmedBy);

      res.json({
        success: true,
        message: 'Photo confirmed successfully',
        photo
      });
    } catch (error) {
      console.error('(with photoId ' + photoId + ' and confirmedBy ' + confirmedBy + ') Confirm care photo error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async getHoldPhotos(req, res) {
    try {
      const { holdId } = req.params;
      const userId = req.user.id;

      const photos = await this.carePhotoService.getHoldPhotos(holdId, userId);

      res.json({
        success: true,
        photos
      });
    } catch (error) {
      console.error('(with holdId ' + holdId + ' and userId ' + userId + ') Get hold photos error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async deleteCarePhoto(req, res) {
    try {
      const { photoId } = req.params;
      const userId = req.user.id;

      await this.carePhotoService.deleteCarePhoto(photoId, userId);

      res.json({
        success: true,
        message: 'Photo deleted successfully'
      });
    } catch (error) {
      console.error('(with photoId ' + photoId + ' and userId ' + userId + ') Delete care photo error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async getPhotoStats(req, res) {
    try {
      const { holdId } = req.params;
      const userId = req.user.id;

      // Verify user has access to this hold
      const hold = await this.carePhotoService.holdRepository.findOne({ id: holdId });
      if (!hold) {
        return res.status(404).json({ error: 'Hold not found' });
      }

      const item = await this.carePhotoService.em.findOne('Item', { id: hold.itemId });
      if (hold.userId !== userId && item.listedBy !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const stats = await this.carePhotoService.getPhotoStats(holdId);

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('(with holdId ' + holdId + ' and userId ' + userId + ') Get photo stats error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async validatePhotosForShipment(req, res) {
    try {
      const { holdId } = req.params;
      const userId = req.user.id;

      // Verify user has access to this hold
      const hold = await this.carePhotoService.holdRepository.findOne({ id: holdId });
      if (!hold) {
        return res.status(404).json({ error: 'Hold not found' });
      }

      const item = await this.carePhotoService.em.findOne('Item', { id: hold.itemId });
      if (hold.userId !== userId && item.listedBy !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const photos = await this.carePhotoService.requirePhotosForShipment(holdId);

      res.json({
        success: true,
        message: 'Photos validated for shipment',
        photos
      });
    } catch (error) {
      console.error('(with holdId ' + holdId + ' and userId ' + userId + ') Validate photos for shipment error:', error);
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = { CarePhotoController, router }; 