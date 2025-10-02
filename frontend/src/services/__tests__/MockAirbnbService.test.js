import { MockAirbnbService } from '../MockAirbnbService';

describe('MockAirbnbService', () => {
  let mockService;

  beforeEach(() => {
    // Reset the singleton instance
    MockAirbnbService.instance = undefined;
    mockService = MockAirbnbService.getInstance();
  });

  describe('fetchListing', () => {
    it('should fetch existing listing', async () => {
      const result = await mockService.fetchListing('airbnb_12345');
      
      expect(result).toBeDefined();
      expect(result.id).toBe('airbnb_12345');
      expect(result.title).toBe('Cozy Cabin in the Woods');
      expect(result.pricePerNight).toBe(150);
      expect(result.amenities).toContain('WiFi');
      expect(result.houseRules).toContain('No smoking');
    });

    it('should throw error for non-existent listing', async () => {
      await expect(mockService.fetchListing('nonexistent_listing'))
        .rejects.toThrow('Listing not found: nonexistent_listing');
    });

    it('should simulate API delay', async () => {
      const startTime = Date.now();
      await mockService.fetchListing('airbnb_12345');
      const endTime = Date.now();
      
      // Should take at least 100ms (simulated delay)
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });
  });

  describe('searchListings', () => {
    it('should return all listings by default', async () => {
      const result = await mockService.searchListings({});
      
      expect(result).toHaveLength(3); // 3 mock listings
      expect(result.every(listing => listing.id.startsWith('airbnb_'))).toBe(true);
    });

    it('should filter by location', async () => {
      const result = await mockService.searchListings({ location: 'Mountain View' });
      
      expect(result).toHaveLength(1);
      expect(result[0].address.city).toBe('Mountain View');
    });

    it('should filter by guests', async () => {
      const result = await mockService.searchListings({ guests: 10 });
      
      expect(result).toHaveLength(1);
      expect(result[0].maxGuests).toBeGreaterThanOrEqual(10);
    });

    it('should filter by price range', async () => {
      const result = await mockService.searchListings({ 
        minPrice: 100, 
        maxPrice: 200 
      });
      
      expect(result.every(listing => 
        listing.pricePerNight >= 100 && listing.pricePerNight <= 200
      )).toBe(true);
    });

    it('should combine multiple filters', async () => {
      const result = await mockService.searchListings({ 
        location: 'CA',
        guests: 6,
        minPrice: 100
      });
      
      expect(result.length).toBeGreaterThan(0);
      expect(result.every(listing => 
        listing.address.state === 'CA' &&
        listing.maxGuests >= 6 &&
        listing.pricePerNight >= 100
      )).toBe(true);
    });
  });

  describe('bookListing', () => {
    it('should book listing successfully', async () => {
      const bookingData = {
        checkIn: '2024-02-01',
        checkOut: '2024-02-03',
        guests: 4,
        totalCost: 300
      };

      const result = await mockService.bookListing('airbnb_12345', bookingData);
      
      expect(result).toBeDefined();
      expect(result.bookingId).toMatch(/^booking_\d+$/);
      expect(result.confirmationCode).toMatch(/^ABC-[A-Z0-9]+$/);
      expect(result.status).toBe('confirmed');
      expect(result.totalCost).toBe(300);
      expect(result.checkInInstructions).toContain('Key will be in the lockbox');
    });

    it('should throw error for non-existent listing', async () => {
      const bookingData = {
        checkIn: '2024-02-01',
        checkOut: '2024-02-03',
        guests: 4,
        totalCost: 300
      };

      await expect(mockService.bookListing('nonexistent_listing', bookingData))
        .rejects.toThrow('Listing not found: nonexistent_listing');
    });

    it('should simulate booking delay', async () => {
      const startTime = Date.now();
      await mockService.bookListing('airbnb_12345', {
        checkIn: '2024-02-01',
        checkOut: '2024-02-03',
        guests: 4,
        totalCost: 300
      });
      const endTime = Date.now();
      
      // Should take at least 300ms (simulated delay)
      expect(endTime - startTime).toBeGreaterThanOrEqual(300);
    });
  });

  describe('cancelBooking', () => {
    it('should cancel booking successfully', async () => {
      const result = await mockService.cancelBooking('booking_123');
      
      expect(result).toBeDefined();
      expect(result.bookingId).toBe('booking_123');
      expect(result.status).toBe('cancelled');
      expect(result.refundAmount).toBe(0);
    });

    it('should simulate cancellation delay', async () => {
      const startTime = Date.now();
      await mockService.cancelBooking('booking_123');
      const endTime = Date.now();
      
      // Should take at least 150ms (simulated delay)
      expect(endTime - startTime).toBeGreaterThanOrEqual(150);
    });
  });

  describe('addListing', () => {
    it('should add new listing', () => {
      const newListing = {
        id: 'airbnb_new',
        title: 'New Test Listing',
        description: 'Test description',
        pricePerNight: 100,
        checkInTime: '3:00 PM',
        checkOutTime: '11:00 AM',
        maxGuests: 4,
        bedrooms: 2,
        bathrooms: 1,
        amenities: ['WiFi'],
        houseRules: ['No smoking'],
        hostId: 'host_new',
        hostName: 'New Host',
        photos: ['photo.jpg'],
        address: {
          street: '123 New St',
          city: 'New City',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        }
      };

      mockService.addListing(newListing);
      
      expect(mockService.getAllListings()).toContainEqual(newListing);
    });
  });

  describe('removeListing', () => {
    it('should remove existing listing', () => {
      const result = mockService.removeListing('airbnb_12345');
      
      expect(result).toBe(true);
      expect(mockService.getAllListings().find(l => l.id === 'airbnb_12345')).toBeUndefined();
    });

    it('should return false for non-existent listing', () => {
      const result = mockService.removeListing('nonexistent_listing');
      
      expect(result).toBe(false);
    });
  });

  describe('getAllListings', () => {
    it('should return all listings', () => {
      const result = mockService.getAllListings();
      
      expect(result).toHaveLength(3);
      expect(result.every(listing => listing.id.startsWith('airbnb_'))).toBe(true);
    });
  });

  describe('simulateRateLimit', () => {
    it('should throw rate limit error', async () => {
      await expect(mockService.simulateRateLimit())
        .rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('simulateNetworkError', () => {
    it('should throw network error', async () => {
      await expect(mockService.simulateNetworkError())
        .rejects.toThrow('Network error');
    });
  });

  describe('singleton pattern', () => {
    it('should return same instance', () => {
      const instance1 = MockAirbnbService.getInstance();
      const instance2 = MockAirbnbService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });
});

