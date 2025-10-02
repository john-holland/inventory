// Mock AirBnB API Service for testing
export interface MockAirbnbListing {
  id: string;
  title: string;
  description: string;
  pricePerNight: number;
  checkInTime: string;
  checkOutTime: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  houseRules: string[];
  hostId: string;
  hostName: string;
  photos: string[];
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
}

export class MockAirbnbService {
  private static instance: MockAirbnbService;
  private listings: Map<string, MockAirbnbListing> = new Map();

  static getInstance(): MockAirbnbService {
    if (!MockAirbnbService.instance) {
      MockAirbnbService.instance = new MockAirbnbService();
    }
    return MockAirbnbService.instance;
  }

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    // Mock listing 1: Cozy Cabin
    this.listings.set('airbnb_12345', {
      id: 'airbnb_12345',
      title: 'Cozy Cabin in the Woods',
      description: 'Perfect for item demos and team retreats. Features a large workspace and modern amenities.',
      pricePerNight: 150,
      checkInTime: '3:00 PM',
      checkOutTime: '11:00 AM',
      maxGuests: 8,
      bedrooms: 3,
      bathrooms: 2,
      amenities: ['WiFi', 'Kitchen', 'Parking', 'Workspace', 'Projector', 'Whiteboard'],
      houseRules: [
        'No smoking',
        'No pets',
        'Quiet hours after 10 PM',
        'Clean up after demos',
        'No loud music after 9 PM'
      ],
      hostId: 'host_123',
      hostName: 'John Host',
      photos: [
        'https://example.com/cabin1_exterior.jpg',
        'https://example.com/cabin1_living.jpg',
        'https://example.com/cabin1_workspace.jpg'
      ],
      address: {
        street: '123 Cabin Lane',
        city: 'Mountain View',
        state: 'CA',
        zipCode: '94041',
        country: 'USA',
        latitude: 37.7749,
        longitude: -122.4194
      }
    });

    // Mock listing 2: Urban Loft
    this.listings.set('airbnb_67890', {
      id: 'airbnb_67890',
      title: 'Modern Urban Loft',
      description: 'Sleek urban space perfect for tech demos and presentations.',
      pricePerNight: 200,
      checkInTime: '4:00 PM',
      checkOutTime: '12:00 PM',
      maxGuests: 6,
      bedrooms: 2,
      bathrooms: 1,
      amenities: ['WiFi', 'Kitchen', 'Parking', 'Workspace', 'Smart TV', 'Sound System'],
      houseRules: [
        'No smoking',
        'No pets',
        'No parties',
        'Respect neighbors',
        'Clean up after events'
      ],
      hostId: 'host_456',
      hostName: 'Sarah Host',
      photos: [
        'https://example.com/loft1_exterior.jpg',
        'https://example.com/loft1_living.jpg',
        'https://example.com/loft1_workspace.jpg'
      ],
      address: {
        street: '456 Tech Street',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',
        country: 'USA',
        latitude: 37.7849,
        longitude: -122.4094
      }
    });

    // Mock listing 3: Beach House
    this.listings.set('airbnb_11111', {
      id: 'airbnb_11111',
      title: 'Beach House Retreat',
      description: 'Relaxing beach house with ocean views, perfect for creative demos.',
      pricePerNight: 300,
      checkInTime: '3:00 PM',
      checkOutTime: '11:00 AM',
      maxGuests: 10,
      bedrooms: 4,
      bathrooms: 3,
      amenities: ['WiFi', 'Kitchen', 'Parking', 'Workspace', 'Ocean View', 'Deck', 'BBQ'],
      houseRules: [
        'No smoking',
        'No pets',
        'No loud music',
        'Respect beach hours',
        'Clean up after demos'
      ],
      hostId: 'host_789',
      hostName: 'Mike Host',
      photos: [
        'https://example.com/beach1_exterior.jpg',
        'https://example.com/beach1_living.jpg',
        'https://example.com/beach1_deck.jpg'
      ],
      address: {
        street: '789 Ocean Drive',
        city: 'Santa Monica',
        state: 'CA',
        zipCode: '90401',
        country: 'USA',
        latitude: 34.0195,
        longitude: -118.4912
      }
    });
  }

  async fetchListing(listingId: string): Promise<MockAirbnbListing> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const listing = this.listings.get(listingId);
    if (!listing) {
      throw new Error(`Listing not found: ${listingId}`);
    }

    return { ...listing };
  }

  async searchListings(query: {
    location?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<MockAirbnbListing[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));

    let results = Array.from(this.listings.values());

    // Apply filters
    if (query.location) {
      results = results.filter(listing => 
        listing.address.city.toLowerCase().includes(query.location!.toLowerCase()) ||
        listing.address.state.toLowerCase().includes(query.location!.toLowerCase())
      );
    }

    if (query.guests) {
      results = results.filter(listing => listing.maxGuests >= query.guests!);
    }

    if (query.minPrice) {
      results = results.filter(listing => listing.pricePerNight >= query.minPrice!);
    }

    if (query.maxPrice) {
      results = results.filter(listing => listing.pricePerNight <= query.maxPrice!);
    }

    return results;
  }

  async bookListing(listingId: string, bookingData: {
    checkIn: string;
    checkOut: string;
    guests: number;
    totalCost: number;
  }): Promise<{
    bookingId: string;
    confirmationCode: string;
    status: 'confirmed' | 'pending' | 'cancelled';
    totalCost: number;
    checkInInstructions: string;
  }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const listing = this.listings.get(listingId);
    if (!listing) {
      throw new Error(`Listing not found: ${listingId}`);
    }

    // Simulate booking confirmation
    return {
      bookingId: `booking_${Date.now()}`,
      confirmationCode: `ABC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      status: 'confirmed',
      totalCost: bookingData.totalCost,
      checkInInstructions: `Check-in at ${listing.checkInTime}. Key will be in the lockbox. Code: 1234`
    };
  }

  async cancelBooking(bookingId: string): Promise<{
    bookingId: string;
    status: 'cancelled';
    refundAmount: number;
  }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 150));

    return {
      bookingId,
      status: 'cancelled',
      refundAmount: 0 // Mock: no refund for demo purposes
    };
  }

  // Add a new listing for testing
  addListing(listing: MockAirbnbListing): void {
    this.listings.set(listing.id, listing);
  }

  // Remove a listing for testing
  removeListing(listingId: string): boolean {
    return this.listings.delete(listingId);
  }

  // Get all listings
  getAllListings(): MockAirbnbListing[] {
    return Array.from(this.listings.values());
  }

  // Simulate rate limiting
  async simulateRateLimit(): Promise<never> {
    const error = new Error('Rate limit exceeded');
    (error as any).code = 'RATE_LIMIT_EXCEEDED';
    (error as any).retryAfter = 60;
    throw error;
  }

  // Simulate network error
  async simulateNetworkError(): Promise<never> {
    const error = new Error('Network error');
    (error as any).code = 'NETWORK_ERROR';
    throw error;
  }
}

export default MockAirbnbService;

