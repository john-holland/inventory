const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

class CarePhotoService {
  constructor(em, holdRepository, carePhotoRepository, userRepository, notificationService) {
    this.em = em;
    this.holdRepository = holdRepository;
    this.carePhotoRepository = carePhotoRepository;
    this.userRepository = userRepository;
    this.notificationService = notificationService;
    
    // Configure multer for file uploads
    this.upload = multer({
      storage: multer.diskStorage({
        destination: async (req, file, cb) => {
          const uploadDir = path.join(__dirname, '../../uploads/care-photos');
          try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
          } catch (error) {
            cb(error);
          }
        },
        filename: (req, file, cb) => {
          const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
          cb(null, uniqueName);
        }
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 5 // Max 5 files per upload
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
          return cb(null, true);
        } else {
          cb(new Error('Only image files are allowed ' + mimetype + ' ' + extname));
        }
      }
    });
  }

  async uploadCarePhoto(holdId, uploadedBy, photoType, files, description = '') {
    try {
      // Verify hold exists and user has permission
      const hold = await this.holdRepository.findOne({ id: holdId });
      if (!hold) {
        throw new Error('Hold not found ' + holdId);
      }

      const user = await this.userRepository.findOne({ id: uploadedBy });
      if (!user) {
        throw new Error('User not found ' + uploadedBy);
      }

      // Check if user is involved in this hold (holder or lister)
      const item = await this.em.findOne('Item', { id: hold.itemId });
      if (hold.userId !== uploadedBy && item.listedBy !== uploadedBy) {
        throw new Error('Unauthorized to upload photos for this hold');
      }

      const uploadedPhotos = [];

      for (const file of files) {
        const photo = new this.carePhotoRepository.entity(
          holdId,
          uploadedBy,
          photoType,
          `/uploads/care-photos/${file.filename}`,
          description
        );

        await this.carePhotoRepository.persistAndFlush(photo);
        uploadedPhotos.push(photo);
      }

      // Send notification to other party
      const otherUserId = hold.userId === uploadedBy ? item.listedBy : hold.userId;
      await this.notificationService.createNotification(
        otherUserId,
        'care_photo_uploaded',
        'New Care Photo Uploaded',
        `A new ${photoType} photo has been uploaded for hold #${holdId}`,
        'hold',
        holdId,
        'normal'
      );

      return uploadedPhotos;
    } catch (error) {
      throw new Error(`Failed to upload care photo: ${error.message} with holdId ${holdId} and uploadedBy ${uploadedBy} and photoType ${photoType} and files ${files} and description ${description}`);
    }
  }

  async confirmCarePhoto(photoId, confirmedBy) {
    try {
      const photo = await this.carePhotoRepository.findOne({ id: photoId });
      if (!photo) {
        throw new Error('Photo not found ' + photoId);
      }

      const hold = await this.holdRepository.findOne({ id: photo.holdId });
      if (!hold) {
        throw new Error('Hold not found ' + photoId);
      }

      // Check if user has permission to confirm
      const item = await this.em.findOne('Item', { id: hold.itemId });
      if (hold.userId !== confirmedBy && item.listedBy !== confirmedBy) {
        throw new Error('Unauthorized to confirm this photo ' + photoId);
      }

      photo.confirmedBy = confirmedBy;
      photo.confirmedAt = new Date();
      await this.carePhotoRepository.persistAndFlush(photo);

      // Send notification to photo uploader
      await this.notificationService.createNotification(
        photo.uploadedBy,
        'care_photo_confirmed',
        'Care Photo Confirmed',
        `Your ${photo.photoType} photo has been confirmed for hold #${hold.id}`,
        'hold',
        hold.id,
        'normal'
      );

      return photo;
    } catch (error) {
      throw new Error(`Failed to confirm care photo: ${error.message}`);
    }
  }

  async getHoldPhotos(holdId, userId) {
    try {
      const hold = await this.holdRepository.findOne({ id: holdId });
      if (!hold) {
        throw new Error('Hold not found ' + holdId);
      }

      // Check if user has permission to view photos
      const item = await this.em.findOne('Item', { id: hold.itemId });
      if (hold.userId !== userId && item.listedBy !== userId) {
        throw new Error('Unauthorized to view photos for this hold ' + holdId);
      }

      const photos = await this.carePhotoRepository.find(
        { holdId },
        { orderBy: { createdAt: 'DESC' } }
      );

      return photos;
    } catch (error) {
      throw new Error(`Failed to get hold photos: ${error.message}`);
    }
  }

  async deleteCarePhoto(photoId, userId) {
    try {
      const photo = await this.carePhotoRepository.findOne({ id: photoId });
      if (!photo) {
        throw new Error('Photo not found ' + photoId);
      }

      // Only the uploader can delete the photo
      if (photo.uploadedBy !== userId) {
        throw new Error('Unauthorized to delete this photo ' + photoId + ' userId ' + userId);
      }

      // Delete file from filesystem
      const filePath = path.join(__dirname, '../../', photo.imageUrl);
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.warn(`(with user ${userId}) Failed to delete file ${filePath}:`, error);
      }

      await this.carePhotoRepository.removeAndFlush(photo);
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete care photo: ${error.message} with user ${userId} and photoId ${photoId}`);
    }
  }

  async getPhotoStats(holdId) {
    try {
      const photos = await this.carePhotoRepository.find({ holdId });
      
      const stats = {
        total: photos.length,
        byType: {},
        confirmed: 0,
        pending: 0
      };

      photos.forEach(photo => {
        if (!stats.byType[photo.photoType]) {
          stats.byType[photo.photoType] = 0;
        }
        stats.byType[photo.photoType]++;
        
        if (photo.confirmedBy) {
          stats.confirmed++;
        } else {
          stats.pending++;
        }
      });

      return stats;
    } catch (error) {
      throw new Error(`Failed to get photo stats: ${error.message} with holdId ${holdId}`);
    }
  }

  async requirePhotosForShipment(holdId) {
    try {
      const hold = await this.holdRepository.findOne({ id: holdId });
      if (!hold) {
        throw new Error('Hold not found ' + holdId);
      }

      const photos = await this.carePhotoRepository.find({ 
        holdId,
        photoType: 'receipt'
      });

      const confirmedPhotos = photos.filter(photo => photo.confirmedBy);

      if (confirmedPhotos.length === 0) {
        throw new Error('At least one confirmed receipt photo is required before shipment ' + holdId);
      }

      return confirmedPhotos;
    } catch (error) {
      throw new Error(`Failed to validate photos for shipment: ${error.message} with holdId ${holdId}`);
    }
  }
}

module.exports = CarePhotoService; 