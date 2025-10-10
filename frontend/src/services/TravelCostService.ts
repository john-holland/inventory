// Travel Cost Service - Calculate travel costs based on gas prices, MPG, and distance
export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface VehicleInfo {
  mpg: number; // Miles per gallon
  fuelType: 'gasoline' | 'diesel' | 'electric';
}

export interface TravelCostBreakdown {
  distance: number; // Miles (as the crow flies)
  gasPrice: number; // Price per gallon
  mpg: number; // Miles per gallon
  fuelCost: number; // Total fuel cost for one way
  roundTripCost: number; // Fuel cost * 2
  holdAmount: number; // Round trip cost * 2 (4x one-way cost)
}

export interface GasPriceData {
  state: string;
  city: string;
  gasoline: number; // Price per gallon
  diesel: number; // Price per gallon
  lastUpdated: string;
}

export class TravelCostService {
  private static instance: TravelCostService;
  private gasPrices: Map<string, GasPriceData> = new Map();

  static getInstance(): TravelCostService {
    if (!TravelCostService.instance) {
      TravelCostService.instance = new TravelCostService();
    }
    return TravelCostService.instance;
  }

  constructor() {
    this.initializeGasPrices();
    console.log('🚗 Travel Cost Service initialized');
  }

  // Initialize gas prices (in real implementation, this would fetch from API)
  private initializeGasPrices(): void {
    const mockGasPrices: GasPriceData[] = [
      {
        state: 'CA',
        city: 'San Francisco',
        gasoline: 4.50,
        diesel: 4.80,
        lastUpdated: new Date().toISOString()
      },
      {
        state: 'CA',
        city: 'Los Angeles',
        gasoline: 4.30,
        diesel: 4.60,
        lastUpdated: new Date().toISOString()
      },
      {
        state: 'NY',
        city: 'New York',
        gasoline: 3.80,
        diesel: 4.10,
        lastUpdated: new Date().toISOString()
      },
      {
        state: 'TX',
        city: 'Houston',
        gasoline: 3.20,
        diesel: 3.50,
        lastUpdated: new Date().toISOString()
      },
      {
        state: 'FL',
        city: 'Miami',
        gasoline: 3.60,
        diesel: 3.90,
        lastUpdated: new Date().toISOString()
      }
    ];

    mockGasPrices.forEach(price => {
      const key = `${price.state}_${price.city}`.toLowerCase();
      this.gasPrices.set(key, price);
    });
  }

  // Calculate distance between two addresses (as the crow flies)
  calculateDistance(origin: Address, destination: Address): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.deg2rad(destination.latitude - origin.latitude);
    const dLon = this.deg2rad(destination.longitude - origin.longitude);
    
    // the formula for the haversine distance
    // a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlon/2)
    // c = 2 * atan2(√a, √(1-a))
    // d = R * c
    // where R is the earth's radius in miles
    // and Δlat and Δlon are the differences in latitude and longitude
    // and lat1 and lat2 are the latitudes of the two points
    // and lon1 and lon2 are the longitudes of the two points
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(origin.latitude)) * Math.cos(this.deg2rad(destination.latitude)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in miles
    
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  // Convert degrees to radians
  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  // Get gas price for a specific location
  getGasPrice(city: string, state: string, fuelType: 'gasoline' | 'diesel' = 'gasoline'): number {
    const key = `${state}_${city}`.toLowerCase();
    const priceData = this.gasPrices.get(key);
    
    if (priceData) {
      return fuelType === 'diesel' ? priceData.diesel : priceData.gasoline;
    }

    // Fallback to average national price if city not found
    const nationalAverages = {
      gasoline: 3.50,
      diesel: 3.80
    };

    return nationalAverages[fuelType];
  }

  // Calculate travel cost breakdown
  calculateTravelCost(
    origin: Address,
    destination: Address,
    vehicleInfo: VehicleInfo = { mpg: 25, fuelType: 'gasoline' }
  ): TravelCostBreakdown {
    // Calculate distance
    const distance = this.calculateDistance(origin, destination);
    
    // Get gas price for origin location (only for gasoline/diesel)
    const gasPrice = vehicleInfo.fuelType === 'electric' 
      ? 0 
      : this.getGasPrice(origin.city, origin.state, vehicleInfo.fuelType as 'gasoline' | 'diesel');
    
    // Calculate fuel cost for one way
    const gallonsNeeded = distance / vehicleInfo.mpg;
    const fuelCost = gallonsNeeded * gasPrice;
    
    // Calculate round trip cost
    const roundTripCost = fuelCost * 2;
    
    // Calculate hold amount (2x round trip cost)
    const holdAmount = roundTripCost * 2;

    return {
      distance,
      gasPrice,
      mpg: vehicleInfo.mpg,
      fuelCost: Math.round(fuelCost * 100) / 100,
      roundTripCost: Math.round(roundTripCost * 100) / 100,
      holdAmount: Math.round(holdAmount * 100) / 100
    };
  }

  // Calculate travel cost for cabin creation
  calculateCabinTravelCost(
    origin: Address,
    cabinAddress: Address,
    vehicleInfo?: VehicleInfo
  ): TravelCostBreakdown {
    const defaultVehicle: VehicleInfo = {
      mpg: 25,
      fuelType: 'gasoline'
    };

    return this.calculateTravelCost(origin, cabinAddress, vehicleInfo || defaultVehicle);
  }

  // Get gas price data for a location
  getGasPriceData(city: string, state: string): GasPriceData | null {
    const key = `${state}_${city}`.toLowerCase();
    return this.gasPrices.get(key) || null;
  }

  // Update gas prices (for real-time updates)
  updateGasPrices(priceData: GasPriceData[]): void {
    priceData.forEach(price => {
      const key = `${price.state}_${price.city}`.toLowerCase();
      this.gasPrices.set(key, price);
    });
    console.log(`Updated gas prices for ${priceData.length} locations`);
  }

  // Get all available gas price locations
  getAvailableLocations(): string[] {
    return Array.from(this.gasPrices.keys());
  }

  // Calculate fuel cost for electric vehicles (simplified)
  calculateElectricCost(
    origin: Address,
    destination: Address,
    efficiency: number = 3.5 // Miles per kWh
  ): number {
    const distance = this.calculateDistance(origin, destination);
    const kwhNeeded = distance / efficiency;
    const electricRate = 0.15; // $0.15 per kWh (national average)
    return Math.round(kwhNeeded * electricRate * 100) / 100;
  }

  // Get travel cost estimate with different vehicle types
  getTravelCostComparison(
    origin: Address,
    destination: Address
  ): {
    gasoline: TravelCostBreakdown;
    diesel: TravelCostBreakdown;
    electric: { cost: number; efficiency: number };
  } {
    const gasoline = this.calculateTravelCost(origin, destination, { mpg: 25, fuelType: 'gasoline' });
    const diesel = this.calculateTravelCost(origin, destination, { mpg: 30, fuelType: 'diesel' });
    const electric = {
      cost: this.calculateElectricCost(origin, destination),
      efficiency: 3.5
    };

    return { gasoline, diesel, electric };
  }
}

export default TravelCostService;
