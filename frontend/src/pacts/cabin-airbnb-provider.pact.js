/** @jest-environment node */
/**
 * Consumer pact: AirBnB / chat / calendar mocks used during cabin demo orchestration.
 */

const { Matchers } = require('@pact-foundation/pact');
const { getJson, postJson } = require('./pactHttp');
const { createPactHarness } = require('./pactTestHarness');

const harness = createPactHarness({
  consumer: 'inventory-frontend',
  provider: 'airbnb-api-mock',
  logName: 'cabin_airbnb_pact',
});

describe('Cabin AirBnB Integration PACT', () => {
  beforeAll(() => {
    harness.resetPactFile();
  });

  beforeEach(async () => {
    await harness.setup();
  });

  afterEach(async () => {
    await harness.verify();
  });

  afterAll(async () => {
    await harness.finalize();
  });

  test('should fetch AirBnB listing details', async () => {
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
      houseRules: ['No smoking', 'No pets', 'Quiet hours after 10 PM', 'Clean up after demos'],
      hostId: 'host_123',
      hostName: 'John Host',
      photos: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
      address: {
        street: '123 Cabin Lane',
        city: 'Mountain View',
        state: 'CA',
        zipCode: '94041',
        country: 'USA',
        latitude: 37.7749,
        longitude: -122.4194,
      },
    };

    await harness.provider.addInteraction({
      state: 'AirBnB listing exists',
      uponReceiving: 'a request for AirBnB listing details',
      withRequest: {
        method: 'GET',
        path: `/api/v1/listings/${airbnbListingId}`,
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer mock_token',
        },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: expectedResponse,
      },
    });

    const res = await getJson(harness.port, `/api/v1/listings/${airbnbListingId}`, {
      Accept: 'application/json',
      Authorization: 'Bearer mock_token',
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(expectedResponse);
  });

  test('should handle AirBnB API error when listing not found', async () => {
    const airbnbListingId = 'nonexistent_listing';

    await harness.provider.addInteraction({
      state: 'AirBnB listing does not exist',
      uponReceiving: 'a request for non-existent AirBnB listing',
      withRequest: {
        method: 'GET',
        path: `/api/v1/listings/${airbnbListingId}`,
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer mock_token',
        },
      },
      willRespondWith: {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
        body: { error: 'Listing not found', code: 'LISTING_NOT_FOUND' },
      },
    });

    const res = await getJson(harness.port, `/api/v1/listings/${airbnbListingId}`, {
      Accept: 'application/json',
      Authorization: 'Bearer mock_token',
    });
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe('Listing not found');
  });

  test('should handle AirBnB API rate limiting', async () => {
    const airbnbListingId = 'airbnb_12345';

    await harness.provider.addInteraction({
      state: 'AirBnB API is rate limited',
      uponReceiving: 'a request when rate limited',
      withRequest: {
        method: 'GET',
        path: `/api/v1/listings/${airbnbListingId}`,
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer mock_token',
        },
      },
      willRespondWith: {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
        body: { error: 'Rate limit exceeded', code: 'RATE_LIMIT_EXCEEDED', retryAfter: 60 },
      },
    });

    const res = await getJson(harness.port, `/api/v1/listings/${airbnbListingId}`, {
      Accept: 'application/json',
      Authorization: 'Bearer mock_token',
    });
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.error).toBe('Rate limit exceeded');
  });

  test('should create chat room for cabin participants', async () => {
    const cabinId = 'cabin_1234567890';
    const participants = ['user1', 'user2'];

    await harness.provider.addInteraction({
      state: 'Chat service is available',
      uponReceiving: 'a request to create cabin chat room',
      withRequest: {
        method: 'POST',
        path: '/api/v1/chat/rooms',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock_token',
        },
        body: {
          name: `Cabin Chat - ${cabinId}`,
          type: 'channel',
          participants,
        },
      },
      willRespondWith: {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
        body: {
          id: `cabin_chat_${cabinId}`,
          name: `Cabin Chat - ${cabinId}`,
          type: 'channel',
          participants,
          createdAt: Matchers.like('2024-01-15T10:00:00Z'),
        },
      },
    });

    const res = await postJson(
      harness.port,
      '/api/v1/chat/rooms',
      { name: `Cabin Chat - ${cabinId}`, type: 'channel', participants },
      { Authorization: 'Bearer mock_token' }
    );
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.id).toBe(`cabin_chat_${cabinId}`);
    expect(json.participants).toEqual(participants);
  });

  test('should create calendar event for cabin', async () => {
    const cabinId = 'cabin_1234567890';
    const eventData = {
      title: 'Cabin Demo: Tech Demo Cabin',
      description: 'Cabin for showcasing new inventory items',
      startTime: '2024-02-01T15:00:00Z',
      endTime: '2024-02-03T11:00:00Z',
      location: '123 Cabin Lane, Mountain View, CA 94041',
      attendees: ['user1@example.com', 'user2@example.com'],
      organizer: 'current-user@example.com',
    };

    await harness.provider.addInteraction({
      state: 'Calendar service is available',
      uponReceiving: 'a request to create calendar event',
      withRequest: {
        method: 'POST',
        path: '/api/v1/calendar/events',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock_token',
        },
        body: eventData,
      },
      willRespondWith: {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
        body: {
          id: `cal_${cabinId}`,
          ...eventData,
          createdAt: Matchers.like('2024-01-15T10:00:00Z'),
          status: 'confirmed',
        },
      },
    });

    const res = await postJson(harness.port, '/api/v1/calendar/events', eventData, {
      Authorization: 'Bearer mock_token',
    });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.id).toBe(`cal_${cabinId}`);
    expect(json.title).toBe(eventData.title);
    expect(json.attendees).toEqual(eventData.attendees);
  });
});
