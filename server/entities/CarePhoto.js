const { EntitySchema } = require("@mikro-orm/core");

class CarePhoto {
  constructor(holdId, uploadedBy, photoType, imageUrl, description, confirmedBy = null) {
    this.holdId = holdId;
    this.uploadedBy = uploadedBy;
    this.photoType = photoType; // 'receipt', 'condition', 'dispute'
    this.imageUrl = imageUrl;
    this.description = description;
    this.confirmedBy = confirmedBy;
    this.confirmedAt = confirmedBy ? new Date() : null;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}

const schema = new EntitySchema({
  class: CarePhoto,
  tableName: 'care_photos',
  properties: {
    id: { primary: true, type: 'uuid' },
    holdId: { type: 'uuid', nullable: false },
    uploadedBy: { type: 'uuid', nullable: false },
    photoType: { type: 'string', length: 20, nullable: false },
    imageUrl: { type: 'text', nullable: false },
    description: { type: 'text', nullable: true },
    confirmedBy: { type: 'uuid', nullable: true },
    confirmedAt: { type: 'datetime', nullable: true },
    createdAt: { type: 'datetime', nullable: false },
    updatedAt: { type: 'datetime', nullable: false }
  },
  indexes: [
    { properties: ['holdId'] },
    { properties: ['uploadedBy'] },
    { properties: ['photoType'] },
    { properties: ['confirmedBy'] },
    { properties: ['createdAt'] }
  ]
});

module.exports = { CarePhoto, schema }; 