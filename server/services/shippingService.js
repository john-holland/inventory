const { wrap } = require("@mikro-orm/core");

class ShippingService {
  constructor(DI) {
    this.DI = DI;
    this.gasPricePerMile = 0.15; // Average gas cost per mile
    this.flatRateOptions = {
      'fedex_small': 15.99,
      'fedex_medium': 25.99,
      'fedex_large': 35.99,
      'ups_small': 16.99,
      'ups_medium': 26.99,
      'ups_large': 36.99
    };
  }

  // Calculate distance between two coordinates using Haversine formula
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI/180);
  }

  // Calculate shipping cost based on method and distance
  calculateShippingCost(fromLocation, toLocation, method, itemValue = 0) {
    const distance = this.calculateDistance(
      fromLocation.lat, fromLocation.lon,
      toLocation.lat, toLocation.lon
    );

    let baseCost = 0;
    
    switch (method) {
      case 'gas':
        baseCost = distance * this.gasPricePerMile;
        break;
      case 'flatrate':
        // Determine box size based on item value
        if (itemValue < 50) {
          baseCost = this.flatRateOptions.fedex_small;
        } else if (itemValue < 200) {
          baseCost = this.flatRateOptions.fedex_medium;
        } else {
          baseCost = this.flatRateOptions.fedex_large;
        }
        break;
      case 'custom':
        // Custom calculation based on weight, dimensions, etc.
        baseCost = Math.max(distance * 0.25, 10); // Minimum $10
        break;
      default:
        throw new Error(`Unknown shipping method: ${method}`);
    }

    // Apply 2x requirement for hold system
    const requiredHold = baseCost * 2;
    
    return {
      distance,
      baseCost,
      requiredHold,
      estimatedDeliveryDays: Math.ceil(distance / 100) // Rough estimate
    };
  }

  // Create a shipping route between users
  async createShippingRoute(itemId, fromUserId, toUserId, shippingDetails) {
    const route = new this.DI.shippingRouteRepository.entity(
      itemId,
      fromUserId,
      toUserId,
      'pending',
      shippingDetails.requiredHold,
      null
    );

    route.shippingMethod = shippingDetails.method;
    route.estimatedDeliveryDate = new Date(Date.now() + shippingDetails.estimatedDeliveryDays * 24 * 60 * 60 * 1000);
    route.route = [{
      userId: fromUserId,
      status: 'ready',
      timestamp: new Date()
    }];

    await this.DI.shippingRouteRepository.persistAndFlush(route);
    return route;
  }

  // Update shipping route status
  async updateShippingStatus(routeId, status, metadata = {}) {
    const route = await this.DI.shippingRouteRepository.findOneOrFail({ id: routeId });
    
    wrap(route).assign({
      status,
      ...metadata
    });

    if (status === 'delivered') {
      route.actualDeliveryDate = new Date();
    }

    await this.DI.shippingRouteRepository.flush();
    return route;
  }
}

module.exports = { ShippingService }; 