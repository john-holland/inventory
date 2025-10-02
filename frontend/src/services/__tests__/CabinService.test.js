import { CabinService } from '../CabinService';
import { MockAirbnbService } from '../MockAirbnbService';

// Mock the ChatService
jest.mock('../ChatService', () => ({
  ChatService: {
    getInstance: jest.fn(() => ({
      createChannel: jest.fn().mockResolvedValue({ id: 'chat_123' }),
      sendMessage: jest.fn().mockResolvedValue({})
    }))
  }
}));

describe('CabinService', () => {
  let cabinService;
  let mockAirbnbService;

  beforeEach(() => {
    // Reset the singleton instance
    CabinService.instance = undefined;
    cabinService = CabinService.getInstance();
    
    // Mock AirBnB Service
    mockAirbnbService = {
      fetchListing: jest.fn(),
      searchListings: jest.fn(),
      bookListing: jest.fn(),
      cancelBooking: jest.fn()
    };
    
    MockAirbnbService.getInstance = jest.fn().mockReturnValue(mockAirbnbService);
    
    // Set test environment
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCabin', () => {
    it('should create a cabin successfully', async () => {
      const mockAirbnbListing = {
        id: 'airbnb_123',
        title: 'Cozy Cabin',
        description: 'Perfect for demos',
        pricePerNight: 150,
        checkInTime: '3:00 PM',
        checkOutTime: '11:00 AM',
        maxGuests: 8,
        amenities: ['WiFi', 'Kitchen'],
        houseRules: ['No smoking'],
        hostId: 'host_123',
        hostName: 'John Host',
        photos: ['photo1.jpg'],
        address: {
          street: '123 Test St',
          city: 'SF',
          state: 'CA',
          zipCode: '94102',
          country: 'USA'
        }
      };

      mockAirbnbService.fetchListing.mockResolvedValue(mockAirbnbListing);

      const cabinRequest = {
        name: 'Test Cabin',
        description: 'Test description',
        userIds: ['user1', 'user2'],
        itemIds: ['item1', 'item2'],
        airbnbListingId: 'airbnb_123',
        checkIn: '2024-02-01',
        checkOut: '2024-02-03',
        estimatedTravelCost: 100
      };

      const result = await cabinService.createCabin(cabinRequest, 'current-user');

      expect(result).toBeDefined();
      expect(result.name).toBe('Test Cabin');
      expect(result.description).toBe('Test description');
      expect(result.checkIn).toBe('2024-02-01');
      expect(result.checkOut).toBe('2024-02-03');
      expect(result.totalCost).toBe(300); // 2 nights * $150
      expect(result.travelCostHold).toBe(200); // $100 * 2
      expect(result.status).toBe('scheduled');
      expect(result.chatRoomId).toBeDefined();
      expect(mockAirbnbService.fetchListing).toHaveBeenCalledWith('airbnb_123');
    });

    it('should handle AirBnB API error', async () => {
      mockAirbnbService.fetchListing.mockRejectedValue(new Error('AirBnB API error'));

      const cabinRequest = {
        name: 'Test Cabin',
        description: 'Test description',
        userIds: ['user1'],
        itemIds: ['item1'],
        airbnbListingId: 'invalid_id',
        checkIn: '2024-02-01',
        checkOut: '2024-02-03',
        estimatedTravelCost: 100
      };

      await expect(cabinService.createCabin(cabinRequest, 'current-user'))
        .rejects.toThrow('Failed to create cabin');
    });

    it('should calculate costs correctly', async () => {
      const mockAirbnbListing = {
        id: 'airbnb_123',
        title: 'Cozy Cabin',
        description: 'Perfect for demos',
        pricePerNight: 200,
        checkInTime: '3:00 PM',
        checkOutTime: '11:00 AM',
        maxGuests: 8,
        amenities: ['WiFi'],
        houseRules: ['No smoking'],
        hostId: 'host_123',
        hostName: 'John Host',
        photos: ['photo1.jpg'],
        address: {
          street: '123 Test St',
          city: 'SF',
          state: 'CA',
          zipCode: '94102',
          country: 'USA'
        }
      };

      mockAirbnbService.fetchListing.mockResolvedValue(mockAirbnbListing);

      const cabinRequest = {
        name: 'Test Cabin',
        description: 'Test description',
        userIds: ['user1'],
        itemIds: ['item1'],
        airbnbListingId: 'airbnb_123',
        checkIn: '2024-02-01',
        checkOut: '2024-02-05', // 4 nights
        estimatedTravelCost: 150
      };

      const result = await cabinService.createCabin(cabinRequest, 'current-user');

      expect(result.totalCost).toBe(800); // 4 nights * $200
      expect(result.travelCostHold).toBe(300); // $150 * 2
    });
  });

  describe('recordItemTakeout', () => {
    it('should record item takeout successfully', async () => {
      const mockCabin = {
        id: 'cabin_1',
        name: 'Test Cabin',
        users: [{ id: 'user1', name: 'User One' }],
        items: [{
          id: 'item1',
          itemId: 'item1',
          itemName: 'Demo Item 1',
          depositAmount: 100,
          takeAwayHoldMultiplier: 1.5
        }],
        travelCostHold: 200,
        itemTakeouts: []
      };

      cabinService.cabins.set('cabin_1', mockCabin);

      const result = await cabinService.recordItemTakeout(
        'cabin_1',
        'item1',
        'user1',
        '2024-02-05'
      );

      expect(result).toBeDefined();
      expect(result.cabinId).toBe('cabin_1');
      expect(result.itemId).toBe('item1');
      expect(result.userId).toBe('user1');
      expect(result.holdAmount).toBe(350); // (100 * 1.5) + 200
      expect(result.travelCostHold).toBe(200);
      expect(result.status).toBe('active');
    });

    it('should handle cabin not found error', async () => {
      await expect(cabinService.recordItemTakeout(
        'nonexistent_cabin',
        'item1',
        'user1',
        '2024-02-05'
      )).rejects.toThrow('Cabin not found');
    });

    it('should handle item not found error', async () => {
      const mockCabin = {
        id: 'cabin_1',
        name: 'Test Cabin',
        users: [],
        items: [],
        travelCostHold: 200,
        itemTakeouts: []
      };

      cabinService.cabins.set('cabin_1', mockCabin);

      await expect(cabinService.recordItemTakeout(
        'cabin_1',
        'nonexistent_item',
        'user1',
        '2024-02-05'
      )).rejects.toThrow('Item not found in cabin');
    });
  });

  describe('returnItemFromTakeout', () => {
    it('should return item successfully', async () => {
      const mockTakeout = {
        id: 'takeout_1',
        cabinId: 'cabin_1',
        itemId: 'item1',
        userId: 'user1',
        takenAt: '2024-02-01T10:00:00Z',
        expectedReturnDate: '2024-02-05',
        holdAmount: 350,
        travelCostHold: 200,
        status: 'active'
      };

      const mockCabin = {
        id: 'cabin_1',
        name: 'Test Cabin',
        users: [{ id: 'user1', name: 'User One' }],
        items: [],
        travelCostHold: 200,
        itemTakeouts: [mockTakeout]
      };

      cabinService.cabins.set('cabin_1', mockCabin);

      await cabinService.returnItemFromTakeout('takeout_1');

      expect(mockTakeout.status).toBe('returned');
      expect(mockTakeout.actualReturnDate).toBeDefined();
    });

    it('should mark item as overdue if returned late', async () => {
      const mockTakeout = {
        id: 'takeout_1',
        cabinId: 'cabin_1',
        itemId: 'item1',
        userId: 'user1',
        takenAt: '2024-02-01T10:00:00Z',
        expectedReturnDate: '2024-02-05',
        holdAmount: 350,
        travelCostHold: 200,
        status: 'active'
      };

      const mockCabin = {
        id: 'cabin_1',
        name: 'Test Cabin',
        users: [{ id: 'user1', name: 'User One' }],
        items: [],
        travelCostHold: 200,
        itemTakeouts: [mockTakeout]
      };

      cabinService.cabins.set('cabin_1', mockCabin);

      // Mock current date to be after expected return date
      const originalDate = Date;
      global.Date = jest.fn(() => new originalDate('2024-02-06T10:00:00Z'));

      await cabinService.returnItemFromTakeout('takeout_1');

      expect(mockTakeout.status).toBe('overdue');

      // Restore original Date
      global.Date = originalDate;
    });

    it('should handle takeout not found error', async () => {
      await expect(cabinService.returnItemFromTakeout('nonexistent_takeout'))
        .rejects.toThrow('Takeout not found');
    });
  });

  describe('getCabinTakeouts', () => {
    it('should return cabin takeouts', () => {
      const mockTakeouts = [
        { id: 'takeout_1', cabinId: 'cabin_1', status: 'active' },
        { id: 'takeout_2', cabinId: 'cabin_1', status: 'returned' }
      ];

      const mockCabin = {
        id: 'cabin_1',
        name: 'Test Cabin',
        users: [],
        items: [],
        travelCostHold: 200,
        itemTakeouts: mockTakeouts
      };

      cabinService.cabins.set('cabin_1', mockCabin);

      const result = cabinService.getCabinTakeouts('cabin_1');
      expect(result).toEqual(mockTakeouts);
    });

    it('should return empty array for non-existent cabin', () => {
      const result = cabinService.getCabinTakeouts('nonexistent_cabin');
      expect(result).toEqual([]);
    });
  });

  describe('getActiveTakeouts', () => {
    it('should return only active takeouts', () => {
      const mockTakeouts = [
        { id: 'takeout_1', cabinId: 'cabin_1', status: 'active' },
        { id: 'takeout_2', cabinId: 'cabin_1', status: 'returned' },
        { id: 'takeout_3', cabinId: 'cabin_1', status: 'active' }
      ];

      const mockCabin = {
        id: 'cabin_1',
        name: 'Test Cabin',
        users: [],
        items: [],
        travelCostHold: 200,
        itemTakeouts: mockTakeouts
      };

      cabinService.cabins.set('cabin_1', mockCabin);

      const result = cabinService.getActiveTakeouts('cabin_1');
      expect(result).toHaveLength(2);
      expect(result.every(t => t.status === 'active')).toBe(true);
    });
  });

  describe('calculateTotalHolds', () => {
    it('should calculate total holds correctly', () => {
      const mockTakeouts = [
        { id: 'takeout_1', cabinId: 'cabin_1', status: 'active', holdAmount: 150 },
        { id: 'takeout_2', cabinId: 'cabin_1', status: 'returned', holdAmount: 200 },
        { id: 'takeout_3', cabinId: 'cabin_1', status: 'active', holdAmount: 100 }
      ];

      const mockCabin = {
        id: 'cabin_1',
        name: 'Test Cabin',
        users: [],
        items: [],
        travelCostHold: 200,
        itemTakeouts: mockTakeouts
      };

      cabinService.cabins.set('cabin_1', mockCabin);

      const result = cabinService.calculateTotalHolds('cabin_1');
      expect(result).toBe(250); // 150 + 100 (only active takeouts)
    });

    it('should return 0 for non-existent cabin', () => {
      const result = cabinService.calculateTotalHolds('nonexistent_cabin');
      expect(result).toBe(0);
    });
  });
});

