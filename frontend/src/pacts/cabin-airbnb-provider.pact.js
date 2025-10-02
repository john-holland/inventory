const { Pact } = require('@pact-foundation/pact');
const path = require('path');

describe('Cabin AirBnB Integration PACT', () => {
  let provider;

  beforeAll(async () => {
    provider = new Pact({
      consumer: 'inventory-frontend',
      provider: 'airbnb-api-mock',
      port: 4001,
      log: path.resolve(process.cwd(), 'logs', 'pact.log'),
      dir: path.resolve(process.cwd(), 'pacts'),
      logLevel: 'INFO',
      spec: 2,
      pactfileWriteMode: 'update'
    });

    await provider.setup();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  describe('AirBnB API Integration', () => {
    it('should fetch AirBnB listing details', async () => {
      const airbnbListingId = 'airbnb_12345';
      const expectedResponse = {
        id: airbnbListingId,
        title: 'Cozy Cabin in the Woods',
        description: 'Perfect for item demos and team retreats',
        pricePerNight: 150,
        checkInTime: '3:00 PM',
        checkOutTime: '11:00 AM',
        maxGuests: 8,
        bedrooms: 3,
        bathrooms: 2,
        amenities: ['WiFi', 'Kitchen', 'Parking', 'Workspace'],
        houseRules: [
          'No smoking',
          'No pets',
          'Quiet hours after 10 PM',
          'Clean up after demos'
        ],
        hostId: 'host_123',
        hostName: 'John Host',
        photos: [
          'https://example.com/photo1.jpg',
          'https://example.com/photo2.jpg'
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
      };

      await provider
        .addInteraction({
          state: 'AirBnB listing exists',
          uponReceiving: 'a request for AirBnB listing details',
          withRequest: {
            method: 'GET',
            path: `/api/v1/listings/${airbnbListingId}`,
            headers: {
              'Accept': 'application/json',
              'Authorization': 'Bearer mock_token'
            }
          },
          willRespondWith: {
            status: 200,
            headers: {
              'Content-Type': 'application/json'
            },
            body: expectedResponse
          }
        });

      // Test the actual API call
      const response = await fetch(`http://localhost:4001/api/v1/listings/${airbnbListingId}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer mock_token'
        }
      });
      
      const result = await response.json();
      expect(result).toEqual(expectedResponse);
    });

    it('should handle AirBnB API error when listing not found', async () => {
      const airbnbListingId = 'nonexistent_listing';

      await provider
        .addInteraction({
          state: 'AirBnB listing does not exist',
          uponReceiving: 'a request for non-existent AirBnB listing',
          withRequest: {
            method: 'GET',
            path: `/api/v1/listings/${airbnbListingId}`,
            headers: {
              'Accept': 'application/json',
              'Authorization': 'Bearer mock_token'
            }
          },
          willRespondWith: {
            status: 404,
            headers: {
              'Content-Type': 'application/json'
            },
            body: {
              error: 'Listing not found',
              code: 'LISTING_NOT_FOUND'
            }
          }
        });

      // Test error handling
      const response = await fetch(`http://localhost:4001/api/v1/listings/${airbnbListingId}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer mock_token'
        }
      });
      
      expect(response.status).toBe(404);
      const result = await response.json();
      expect(result.error).toBe('Listing not found');
    });

    it('should handle AirBnB API rate limiting', async () => {
      const airbnbListingId = 'airbnb_12345';

      await provider
        .addInteraction({
          state: 'AirBnB API is rate limited',
          uponReceiving: 'a request when rate limited',
          withRequest: {
            method: 'GET',
            path: `/api/v1/listings/${airbnbListingId}`,
            headers: {
              'Accept': 'application/json',
              'Authorization': 'Bearer mock_token'
            }
          },
          willRespondWith: {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': '60'
            },
            body: {
              error: 'Rate limit exceeded',
              code: 'RATE_LIMIT_EXCEEDED',
              retryAfter: 60
            }
          }
        });

      // Test rate limit handling
      const response = await fetch(`http://localhost:4001/api/v1/listings/${airbnbListingId}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer mock_token'
        }
      });
      
      expect(response.status).toBe(429);
      const result = await response.json();
      expect(result.error).toBe('Rate limit exceeded');
    });
  });

  describe('Cabin Creation Flow', () => {
    it('should create cabin with AirBnB integration', async () => {
      const cabinRequest = {
        name: 'Tech Demo Cabin',
        description: 'Cabin for showcasing new inventory items',
        userIds: ['user1', 'user2'],
        itemIds: ['item1', 'item2'],
        airbnbListingId: 'airbnb_12345',
        checkIn: '2024-02-01',
        checkOut: '2024-02-03',
        estimatedTravelCost: 100
      };

      const airbnbResponse = {
        id: 'airbnb_12345',
        title: 'Cozy Cabin in the Woods',
        pricePerNight: 150,
        checkInTime: '3:00 PM',
        checkOutTime: '11:00 AM',
        maxGuests: 8,
        amenities: ['WiFi', 'Kitchen', 'Parking'],
        houseRules: ['No smoking', 'No pets'],
        hostId: 'host_123',
        hostName: 'John Host',
        photos: ['https://example.com/photo1.jpg'],
        address: {
          street: '123 Cabin Lane',
          city: 'Mountain View',
          state: 'CA',
          zipCode: '94041',
          country: 'USA'
        }
      };

      // Mock AirBnB API call
      await provider
        .addInteraction({
          state: 'AirBnB listing exists',
          uponReceiving: 'a request for AirBnB listing details',
          withRequest: {
            method: 'GET',
            path: `/api/v1/listings/${cabinRequest.airbnbListingId}`,
            headers: {
              'Accept': 'application/json',
              'Authorization': 'Bearer mock_token'
            }
          },
          willRespondWith: {
            status: 200,
            headers: {
              'Content-Type': 'application/json'
            },
            body: airbnbResponse
          }
        });

      // Test AirBnB API call
      const response = await fetch(`http://localhost:4001/api/v1/listings/${cabinRequest.airbnbListingId}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer mock_token'
        }
      });
      
      const result = await response.json();
      expect(result).toEqual(airbnbResponse);
    });
  });

  describe('Chat Integration', () => {
    it('should create chat room for cabin participants', async () => {
      const cabinId = 'cabin_1234567890';
      const participants = ['user1', 'user2'];

      await provider
        .addInteraction({
          state: 'Chat service is available',
          uponReceiving: 'a request to create cabin chat room',
          withRequest: {
            method: 'POST',
            path: '/api/v1/chat/rooms',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer mock_token'
            },
            body: {
              name: `Cabin Chat - ${cabinId}`,
              type: 'channel',
              participants
            }
          },
          willRespondWith: {
            status: 201,
            headers: {
              'Content-Type': 'application/json'
            },
            body: {
              id: `cabin_chat_${cabinId}`,
              name: `Cabin Chat - ${cabinId}`,
              type: 'channel',
              participants,
              createdAt: '2024-01-15T10:00:00Z'
            }
          }
        });

      // Test chat room creation
      const response = await fetch(`http://localhost:4001/api/v1/chat/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock_token'
        },
        body: JSON.stringify({
          name: `Cabin Chat - ${cabinId}`,
          type: 'channel',
          participants
        })
      });

      const result = await response.json();
      expect(result.id).toBe(`cabin_chat_${cabinId}`);
      expect(result.participants).toEqual(participants);
    });
  });

  describe('Calendar Integration', () => {
    it('should create calendar event for cabin', async () => {
      const cabinId = 'cabin_1234567890';
      const eventData = {
        title: 'Cabin Demo: Tech Demo Cabin',
        description: 'Cabin for showcasing new inventory items',
        startTime: '2024-02-01T15:00:00Z',
        endTime: '2024-02-03T11:00:00Z',
        location: '123 Cabin Lane, Mountain View, CA 94041',
        attendees: ['user1@example.com', 'user2@example.com'],
        organizer: 'current-user@example.com'
      };

      await provider
        .addInteraction({
          state: 'Calendar service is available',
          uponReceiving: 'a request to create calendar event',
          withRequest: {
            method: 'POST',
            path: '/api/v1/calendar/events',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer mock_token'
            },
            body: eventData
          },
          willRespondWith: {
            status: 201,
            headers: {
              'Content-Type': 'application/json'
            },
            body: {
              id: `cal_${cabinId}`,
              ...eventData,
              createdAt: '2024-01-15T10:00:00Z',
              status: 'confirmed'
            }
          }
        });

      // Test calendar event creation
      const response = await fetch(`http://localhost:4001/api/v1/calendar/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock_token'
        },
        body: JSON.stringify(eventData)
      });

      const result = await response.json();
      expect(result.id).toBe(`cal_${cabinId}`);
      expect(result.title).toBe(eventData.title);
      expect(result.attendees).toEqual(eventData.attendees);
    });
  });
});