/**
 * Item Type Helper Utilities
 * 
 * Centralized functions for handling different item types consistently across the application.
 */

import type { InventoryItem } from '../data/mockInventoryItems';

export interface ItemTypeChip {
  label: string;
  icon: string;
  color: string;
}

export interface ItemActionConfig {
  label: string;
  action: 'chat' | 'external_link' | 'purchase' | 'request';
  showMap: boolean;
  showExternalLink: boolean;
  externalUrl?: string;
}

/**
 * Get item type chip configuration for display
 */
export function getItemTypeChip(itemType: string): ItemTypeChip {
  const configs: Record<string, ItemTypeChip> = {
    rental: {
      label: '⏳ Rental',
      icon: '⏳',
      color: '#333'
    },
    shipping_hold: {
      label: '🛻 Shipping Hold Agreement',
      icon: '🛻',
      color: '#333'
    },
    insurance_hold: {
      label: '👨‍🚀 Protection Agreement',
      icon: '👨‍🚀',
      color: '#333'
    },
    portfolio_asset: {
      label: '👮 Portfolio Asset',
      icon: '👮',
      color: '#333'
    },
    ebay: {
      label: '🌈 eBay',
      icon: '🌈',
      color: '#333'
    },
    amazon_dropship: {
      label: '📦 Amazon Dropship',
      icon: '📦',
      color: '#333'
    }
  };

  return configs[itemType] || {
    label: 'Unknown',
    icon: '❓',
    color: '#666'
  };
}

/**
 * Get price label based on item type
 */
export function getPriceLabel(item: InventoryItem): string {
  switch (item.itemType) {
    case 'rental':
      return `$${item.price}/day`;
    case 'shipping_hold':
      return `$${item.price} hold`;
    case 'insurance_hold':
      return `$${item.price} coverage`;
    case 'portfolio_asset':
      return `$${item.price}`;
    case 'ebay':
      return `$${item.price}`;
    case 'amazon_dropship':
      return `$${item.price}`;
    default:
      return `$${item.price}`;
  }
}

/**
 * Get action button configuration based on item type and settings
 */
export function getItemActionConfig(item: InventoryItem): ItemActionConfig {
  // Portfolio assets: Request via chat, no map
  if (item.itemType === 'portfolio_asset') {
    return {
      label: 'Request Item',
      action: 'request',
      showMap: false,
      showExternalLink: false
    };
  }

  // eBay items: Always external link
  if (item.itemType === 'ebay') {
    return {
      label: 'View on eBay',
      action: 'external_link',
      showMap: false,
      showExternalLink: true,
      externalUrl: item.externalUrl
    };
  }

  // Amazon Dropship: Depends on useDropshippingFund and enableInventorySale
  if (item.itemType === 'amazon_dropship') {
    if (item.useDropshippingFund) {
      // Partner-funded: show as rental/insurance/shipping hold
      return {
        label: 'Request Item',
        action: 'request',
        showMap: true, // Show map for partner-funded items
        showExternalLink: true,
        externalUrl: item.externalUrl
      };
    } else if (item.enableInventorySale) {
      // Sell on Inventory
      return {
        label: 'Buy on Inventory',
        action: 'purchase',
        showMap: false,
        showExternalLink: true,
        externalUrl: item.externalUrl
      };
    } else {
      // Link directly to Amazon
      return {
        label: 'View on Amazon',
        action: 'external_link',
        showMap: false,
        showExternalLink: true,
        externalUrl: item.externalUrl
      };
    }
  }

  // Default for rental, shipping_hold, insurance_hold
  return {
    label: 'Request Item',
    action: 'request',
    showMap: true,
    showExternalLink: false
  };
}

/**
 * Get chat template message for item requests
 */
export function getChatTemplateMessage(
  item: InventoryItem,
  ownerName: string,
  itemUrl: string
): string {
  if (item.itemType === 'portfolio_asset') {
    return `Hello ${ownerName}, would you consider lending, renting, or selling this item (${itemUrl})? I'm interested in: ${item.name}`;
  }

  return `Hello ${ownerName}, I'm interested in renting/borrowing this item: ${item.name}`;
}

/**
 * Check if item should show route map
 */
export function shouldShowRouteMap(item: InventoryItem): boolean {
  const config = getItemActionConfig(item);
  return config.showMap;
}

/**
 * Get category badge color
 */
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'Electronics': '#2196f3',
    'Sports': '#4caf50',
    'Tools': '#ff9800',
    'Music': '#9c27b0',
    'Agreements': '#2e7d32',
    'Investments': '#7c4dff',
    'Insurance': '#ff9800',
    'Furniture': '#795548'
  };

  return colors[category] || '#666';
}

