/**
 * Mock Inventory Items - Schema Migration Document
 * 
 * This file contains sample data for populating the inventory system.
 * Can be used for:
 * - Development/testing
 * - Database seeding
 * - Schema migrations
 * - API mocking
 * 
 * Item Types:
 * - rental: Time-based rentals (price per day)
 * - shipping_hold: Collateral-based shipping agreements
 * - insurance_hold: Protection agreements with held funds
 * - portfolio_asset: Investment/collectible items
 */

import { ShippingService } from '../services/ShippingService';

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  distance: number;
  price: number;
  rating: number;
  available: boolean;
  owner: string;
  tags: string[];
  itemType: 'rental' | 'shipping_hold' | 'insurance_hold' | 'portfolio_asset' | 'ebay' | 'amazon_dropship';
  // Optional map-specific fields
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  // External links
  externalUrl?: string; // For Ebay/Amazon links
  enableInventorySale?: boolean; // For Amazon Dropship - sell on Inventory or link directly
  // Dropshipping Fund fields
  useDropshippingFund?: boolean; // If true, partner pays from their wallet
  dropshippingWalletId?: string; // Which wallet to charge
  hiddenByDefault?: boolean; // Auto-add to customer inventory but hidden initially
}

/**
 * Generate mock inventory items with calculated shipping holds
 */
export const generateMockInventoryItems = (): InventoryItem[] => {
  const shippingService = ShippingService.getInstance();
  
  // Calculate shipping holds for different scenarios
  const electronicsShipping = shippingService.calculateShippingHold(
    { street: '', city: 'San Francisco', state: 'CA', zipCode: '94102', country: 'USA' },
    { street: '', city: 'Los Angeles', state: 'CA', zipCode: '90001', country: 'USA' },
    { length: 12, width: 8, height: 6, weight: 3 },
    500, // item value
    2 // 2x hold multiplier
  );

  const largeItemShipping = shippingService.calculateShippingHold(
    { street: '', city: 'San Francisco', state: 'CA', zipCode: '94102', country: 'USA' },
    { street: '', city: 'New York', state: 'NY', zipCode: '10001', country: 'USA' },
    { length: 24, width: 18, height: 12, weight: 15 },
    1000, // item value
    3 // 3x hold multiplier for higher value
  );

  return [
    // Rental Items
    {
      id: '1',
      name: 'Professional Camera Lens',
      description: 'Canon EF 24-70mm f/2.8L II USM lens in excellent condition',
      category: 'Electronics',
      location: 'San Francisco, CA',
      latitude: 37.7749,
      longitude: -122.4194,
      distance: 2.3,
      price: 15,
      rating: 4.8,
      available: true,
      owner: '0x1234...5678',
      imageUrl: 'https://via.placeholder.com/60x60/4caf50/ffffff?text=Camera',
      tags: ['photography', 'professional', 'camera'],
      itemType: 'rental'
    },
    {
      id: '2',
      name: 'Mountain Bike',
      description: 'Trek Marlin 7 mountain bike, perfect for trails',
      category: 'Sports',
      location: 'Oakland, CA',
      latitude: 37.8044,
      longitude: -122.2711,
      distance: 5.1,
      price: 8,
      rating: 4.6,
      available: true,
      owner: '0x8765...4321',
      imageUrl: 'https://via.placeholder.com/60x60/2196f3/ffffff?text=Bike',
      tags: ['cycling', 'outdoor', 'trail'],
      itemType: 'rental'
    },
    {
      id: '3',
      name: 'Power Tools Set',
      description: 'Complete DeWalt power tools set with carrying case',
      category: 'Tools',
      location: 'Berkeley, CA',
      latitude: 37.8716,
      longitude: -122.2727,
      distance: 3.7,
      price: 12,
      rating: 4.9,
      available: false,
      owner: '0x9876...5432',
      imageUrl: 'https://via.placeholder.com/60x60/ff9800/ffffff?text=Tools',
      tags: ['construction', 'professional', 'home-improvement'],
      itemType: 'rental'
    },
    {
      id: '4',
      name: 'Guitar',
      description: 'Acoustic guitar in excellent condition',
      category: 'Music',
      location: 'San Francisco, CA',
      latitude: 37.7858,
      longitude: -122.4064,
      distance: 1.2,
      price: 6,
      rating: 4.7,
      available: true,
      owner: '0x5432...8765',
      imageUrl: 'https://via.placeholder.com/60x60/9c27b0/ffffff?text=Guitar',
      tags: ['music', 'acoustic'],
      itemType: 'rental'
    },

    // Shipping Hold Agreements
    {
      id: '5',
      name: 'Shipping Hold Agreement',
      description: `User agreement for shipping protection with collateral hold. Hold: $${electronicsShipping.totalHold}, potential return: $${electronicsShipping.expectedReturn}. Peer-to-peer payout if item damaged.`,
      category: 'Agreements',
      location: 'San Francisco, CA',
      latitude: 37.7649,
      longitude: -122.4194,
      distance: 1.5,
      price: electronicsShipping.totalHold,
      rating: 4.9,
      available: true,
      owner: '0x1111...2222',
      imageUrl: 'https://via.placeholder.com/60x60/2196f3/ffffff?text=Ship',
      tags: ['agreement', 'shipping', 'savings', 'p2p'],
      itemType: 'shipping_hold'
    },

    // Portfolio Assets
    {
      id: '6',
      name: 'Collectible Art Portfolio',
      description: 'Curated portfolio asset generating passive returns',
      category: 'Investments',
      location: 'Oakland, CA',
      latitude: 37.8044,
      longitude: -122.2811,
      distance: 4.2,
      price: 5000,
      rating: 4.7,
      available: true,
      owner: '0x3333...4444',
      imageUrl: 'https://via.placeholder.com/60x60/9c27b0/ffffff?text=Art',
      tags: ['art', 'portfolio', 'investment'],
      itemType: 'portfolio_asset'
    },

    // Insurance Hold Agreements
    {
      id: '7',
      name: 'Full Desktop Innovation Electronics Setup',
      description: `A desktop with a hologram, a computer monitor, usbc laptop dock, ergonomic keyboard, ergonomic mouse, hand sensing emotes, vr headset metaquest for demos and recreation. User agreement hold: $${largeItemShipping.totalHold}, covers shipping both ways with peer-to-peer payout protection.`,
      category: 'Agreements',
      location: 'Berkeley, CA',
      latitude: 37.8716,
      longitude: -122.2827,
      distance: 3.1,
      price: largeItemShipping.totalHold,
      rating: 4.8,
      available: true,
      owner: '0x5555...6666',
      imageUrl: 'https://via.placeholder.com/60x60/9c27b0/ffffff?text=VR',
      tags: ['agreement', 'electronics', 'protection', 'vr', 'hologram', 'desktop', 'p2p'],
      itemType: 'insurance_hold'
    },

    // Ebay Items
    {
      id: '8',
      name: 'Vintage Mechanical Keyboard',
      description: 'IBM Model M mechanical keyboard, rare find in excellent condition',
      category: 'Electronics',
      location: 'Portland, OR',
      latitude: 45.5152,
      longitude: -122.6784,
      distance: 635,
      price: 120,
      rating: 4.9,
      available: true,
      owner: '0xEbay...1111',
      imageUrl: 'https://via.placeholder.com/60x60/ff6b6b/ffffff?text=Ebay',
      tags: ['ebay', 'vintage', 'keyboard', 'collectible'],
      itemType: 'ebay',
      externalUrl: 'https://www.ebay.com/itm/example123'
    },

    // Amazon Dropship Items
    {
      id: '9',
      name: 'Standing Desk Converter',
      description: 'Adjustable height standing desk converter, ergonomic design',
      category: 'Furniture',
      location: 'Seattle, WA',
      latitude: 47.6062,
      longitude: -122.3321,
      distance: 808,
      price: 89.99,
      rating: 4.6,
      available: true,
      owner: '0xAmazon...2222',
      imageUrl: 'https://via.placeholder.com/60x60/ff9900/ffffff?text=Amzn',
      tags: ['amazon', 'dropship', 'desk', 'ergonomic'],
      itemType: 'amazon_dropship',
      externalUrl: 'https://www.amazon.com/dp/B08EXAMPLE',
      enableInventorySale: false // Link directly to Amazon
    },
    {
      id: '10',
      name: 'Wireless Noise Cancelling Headphones',
      description: 'Premium headphones with active noise cancellation and 30hr battery',
      category: 'Electronics',
      location: 'San Jose, CA',
      latitude: 37.3382,
      longitude: -121.8863,
      distance: 45,
      price: 199.99,
      rating: 4.7,
      available: true,
      owner: '0xAmazon...3333',
      imageUrl: 'https://via.placeholder.com/60x60/ff9900/ffffff?text=Amzn',
      tags: ['amazon', 'dropship', 'headphones', 'audio'],
      itemType: 'amazon_dropship',
      externalUrl: 'https://www.amazon.com/dp/B09EXAMPLE',
      enableInventorySale: true // Allow purchase on Inventory
    },

    // Partner-funded Amazon Dropship Example
    {
      id: '11',
      name: 'Ergonomic Office Chair',
      description: 'Premium ergonomic chair with lumbar support, partner-funded rental program',
      category: 'Furniture',
      location: 'San Francisco, CA',
      latitude: 37.7749,
      longitude: -122.4194,
      distance: 2.5,
      price: 25,
      rating: 4.8,
      available: true,
      owner: '0xPartner...4444',
      imageUrl: 'https://via.placeholder.com/60x60/ff9900/ffffff?text=Chair',
      tags: ['amazon', 'dropship', 'partner-funded', 'ergonomic', 'furniture'],
      itemType: 'amazon_dropship',
      externalUrl: 'https://www.amazon.com/dp/B09PARTNERCHAIR',
      useDropshippingFund: true, // Partner pays from their wallet
      dropshippingWalletId: 'wallet_001',
      hiddenByDefault: true // Auto-add to customer inventory but hidden
    }
  ];
};

/**
 * Get mock items as a static array (for when you don't need recalculation)
 */
export const mockInventoryItems = generateMockInventoryItems();

/**
 * Database Schema Definition
 * 
 * This represents the expected schema for the inventory_items table
 */
export const inventoryItemsSchema = {
  tableName: 'inventory_items',
  columns: {
    id: { type: 'VARCHAR(36)', primaryKey: true },
    name: { type: 'VARCHAR(255)', nullable: false },
    description: { type: 'TEXT', nullable: false },
    category: { type: 'VARCHAR(100)', nullable: false, indexed: true },
    location: { type: 'VARCHAR(255)', nullable: false },
    latitude: { type: 'DECIMAL(10, 8)', nullable: true },
    longitude: { type: 'DECIMAL(11, 8)', nullable: true },
    distance: { type: 'DECIMAL(8, 2)', nullable: false },
    price: { type: 'DECIMAL(10, 2)', nullable: false, indexed: true },
    rating: { type: 'DECIMAL(3, 2)', nullable: false },
    available: { type: 'BOOLEAN', nullable: false, default: true, indexed: true },
    owner: { type: 'VARCHAR(42)', nullable: false, indexed: true }, // Ethereum address
    tags: { type: 'JSON', nullable: false }, // Array of strings
    item_type: { 
      type: 'ENUM', 
      values: ['rental', 'shipping_hold', 'insurance_hold', 'portfolio_asset'],
      nullable: false,
      indexed: true
    },
    image_url: { type: 'VARCHAR(500)', nullable: true },
    created_at: { type: 'TIMESTAMP', nullable: false, default: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'TIMESTAMP', nullable: false, default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
  },
  indexes: [
    { name: 'idx_category', columns: ['category'] },
    { name: 'idx_item_type', columns: ['item_type'] },
    { name: 'idx_available', columns: ['available'] },
    { name: 'idx_owner', columns: ['owner'] },
    { name: 'idx_price', columns: ['price'] },
    { name: 'idx_location', columns: ['latitude', 'longitude'] }
  ]
};

/**
 * Migration SQL for creating the table
 */
export const createTableSQL = `
CREATE TABLE IF NOT EXISTS inventory_items (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  location VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  distance DECIMAL(8, 2) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  rating DECIMAL(3, 2) NOT NULL,
  available BOOLEAN NOT NULL DEFAULT TRUE,
  owner VARCHAR(42) NOT NULL,
  tags JSON NOT NULL,
  item_type ENUM('rental', 'shipping_hold', 'insurance_hold', 'portfolio_asset') NOT NULL,
  image_url VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_category (category),
  INDEX idx_item_type (item_type),
  INDEX idx_available (available),
  INDEX idx_owner (owner),
  INDEX idx_price (price),
  INDEX idx_location (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

/**
 * Seed data SQL
 */
export const generateSeedDataSQL = (): string => {
  const items = generateMockInventoryItems();
  
  const values = items.map(item => {
    const tags = JSON.stringify(item.tags);
    const lat = item.latitude || 'NULL';
    const lng = item.longitude || 'NULL';
    const imgUrl = item.imageUrl ? `'${item.imageUrl}'` : 'NULL';
    
    return `(
      '${item.id}',
      '${item.name.replace(/'/g, "''")}',
      '${item.description.replace(/'/g, "''")}',
      '${item.category}',
      '${item.location}',
      ${lat},
      ${lng},
      ${item.distance},
      ${item.price},
      ${item.rating},
      ${item.available ? 1 : 0},
      '${item.owner}',
      '${tags}',
      '${item.itemType}',
      ${imgUrl}
    )`;
  }).join(',\n  ');
  
  return `
INSERT INTO inventory_items (
  id, name, description, category, location, latitude, longitude,
  distance, price, rating, available, owner, tags, item_type, image_url
) VALUES
  ${values};
`;
};

