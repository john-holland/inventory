# Data & Schema Migration

This directory contains centralized data definitions and schema migrations for the inventory system.

## Files

### `mockInventoryItems.ts`

**Purpose**: Centralized mock/seed data for the inventory system.

**Contents**:
- `InventoryItem` interface - TypeScript type definition
- `generateMockInventoryItems()` - Function to generate items with calculated shipping holds
- `mockInventoryItems` - Pre-generated array of mock items
- `inventoryItemsSchema` - Database schema definition
- `createTableSQL` - SQL for creating the inventory_items table
- `generateSeedDataSQL()` - Function to generate SQL INSERT statements

**Usage**:

```typescript
// Import in components
import { mockInventoryItems, type InventoryItem } from '../data/mockInventoryItems';

// Use in your component
const items = mockInventoryItems;
```

**Database Seeding**:

```typescript
import { generateSeedDataSQL } from './data/mockInventoryItems';

// Generate SQL
const sql = generateSeedDataSQL();
// Execute this SQL to populate your database
```

## Item Types

The system supports four distinct business models:

### 1. **Rental Items** (`rental`)
- Traditional time-based rentals
- Pricing: `$X/day`
- Examples: Camera lens, bikes, tools
- Revenue model: Daily rental fees

### 2. **Shipping Hold Agreements** (`shipping_hold`)
- Peer-to-peer shipping protection agreements
- Pricing: Calculated based on shipping costs × multiplier
- Collateral hold for safe return
- Revenue model: Interest on held funds while in escrow

### 3. **Insurance Hold Agreements** (`insurance_hold`)  
- User agreements for high-value item protection
- Pricing: Based on item value and shipping costs
- Covers both-way shipping with P2P payouts
- Revenue model: Interest on held funds + protection fees

### 4. **Portfolio Assets** (`portfolio_asset`)
- Investment-grade collectibles and curated portfolios
- Pricing: Market-based
- Revenue model: Appreciation + passive returns

## Adding New Items

To add new items to the system:

1. Open `mockInventoryItems.ts`
2. Add your item to the array in `generateMockInventoryItems()`
3. Follow the existing structure for your item type
4. For `shipping_hold` or `insurance_hold` types, use `ShippingService` to calculate holds

Example:

```typescript
{
  id: '8',
  name: 'New Item Name',
  description: 'Item description here',
  category: 'Category',
  location: 'City, State',
  latitude: 37.7749,
  longitude: -122.4194,
  distance: 2.5,
  price: 50,
  rating: 4.5,
  available: true,
  owner: '0xABC...123',
  imageUrl: 'https://...',
  tags: ['tag1', 'tag2'],
  itemType: 'rental' // or shipping_hold, insurance_hold, portfolio_asset
}
```

## Database Schema

The schema is designed for PostgreSQL/MySQL and includes:

- **Indexes** on frequently queried fields (category, item_type, available, owner, price)
- **Geolocation support** with latitude/longitude for map features
- **JSON support** for flexible tags storage
- **ENUM type** for item_type to ensure data integrity
- **Timestamps** for audit trails

## Migration Strategy

When updating the schema:

1. **Development**: Update `inventoryItemsSchema` object
2. **SQL Generation**: Use provided `createTableSQL`  
3. **Data Migration**: Use `generateSeedDataSQL()` for initial data
4. **Version Control**: Keep track of schema changes in git

## Future Enhancements

Planned improvements:

- [ ] Add support for item variations/options
- [ ] Include shipping dimensions in schema
- [ ] Add support for multi-currency pricing
- [ ] Implement item history/audit log
- [ ] Add support for item bundles/packages
- [ ] Include smart contract addresses for blockchain items

