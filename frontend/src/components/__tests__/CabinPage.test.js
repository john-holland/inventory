import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CabinPage } from '../CabinPage';
import { CabinService } from '../../services/CabinService';
import { MockAirbnbService } from '../../services/MockAirbnbService';

// Mock the CabinService
jest.mock('../../services/CabinService');
jest.mock('../../services/MockAirbnbService');

describe('CabinPage Component', () => {
  let mockCabinService;
  let mockAirbnbService;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock CabinService
    mockCabinService = {
      getCabins: jest.fn(),
      createCabin: jest.fn(),
      addUserToCabin: jest.fn(),
      recordItemTakeout: jest.fn(),
      getCabinTakeouts: jest.fn(),
      getActiveTakeouts: jest.fn(),
      calculateTotalHolds: jest.fn()
    };
    
    CabinService.getInstance = jest.fn().mockReturnValue(mockCabinService);
    
    // Mock AirBnB Service
    mockAirbnbService = {
      fetchListing: jest.fn(),
      searchListings: jest.fn(),
      bookListing: jest.fn(),
      cancelBooking: jest.fn()
    };
    
    MockAirbnbService.getInstance = jest.fn().mockReturnValue(mockAirbnbService);
  });

  it('renders cabin page with create button', () => {
    mockCabinService.getCabins.mockReturnValue([]);
    
    render(<CabinPage />);
    
    expect(screen.getByText('Cabin - Item Demo Service')).toBeInTheDocument();
    expect(screen.getByText('Create New Cabin')).toBeInTheDocument();
  });

  it('displays existing cabins', () => {
    const mockCabins = [
      {
        id: 'cabin_1',
        name: 'Test Cabin 1',
        description: 'Test description 1',
        checkIn: '2024-02-01',
        checkOut: '2024-02-03',
        totalCost: 300,
        status: 'scheduled',
        users: [{ id: 'user1', name: 'User One', email: 'user1@example.com' }],
        items: [{ id: 'item1', itemName: 'Demo Item 1', deposit: 50 }],
        address: {
          city: 'San Francisco',
          state: 'CA'
        },
        airbnbInfo: {
          title: 'Cozy Cabin',
          checkInTime: '3:00 PM',
          checkOutTime: '11:00 AM'
        }
      }
    ];
    
    mockCabinService.getCabins.mockReturnValue(mockCabins);
    
    render(<CabinPage />);
    
    expect(screen.getByText('Test Cabin 1')).toBeInTheDocument();
    expect(screen.getByText('Test description 1')).toBeInTheDocument();
    expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
  });

  it('opens create cabin dialog when create button is clicked', () => {
    mockCabinService.getCabins.mockReturnValue([]);
    
    render(<CabinPage />);
    
    const createButton = screen.getByText('Create New Cabin');
    fireEvent.click(createButton);
    
    expect(screen.getByText('Create New Cabin')).toBeInTheDocument();
    expect(screen.getByLabelText('Cabin Name')).toBeInTheDocument();
  });

  it('creates a new cabin successfully', async () => {
    const mockCabin = {
      id: 'cabin_new',
      name: 'New Cabin',
      description: 'New description',
      checkIn: '2024-02-01',
      checkOut: '2024-02-03',
      totalCost: 300,
      status: 'scheduled',
      users: [],
      items: [],
      address: { city: 'SF', state: 'CA' },
      airbnbInfo: { title: 'Test Listing' }
    };
    
    mockCabinService.getCabins.mockReturnValue([]);
    mockCabinService.createCabin.mockResolvedValue(mockCabin);
    mockAirbnbService.fetchListing.mockResolvedValue({
      id: 'airbnb_123',
      title: 'Test Listing',
      pricePerNight: 150,
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
    });
    
    render(<CabinPage />);
    
    // Open create dialog
    fireEvent.click(screen.getByText('Create New Cabin'));
    
    // Fill in cabin details
    fireEvent.change(screen.getByLabelText('Cabin Name'), {
      target: { value: 'New Cabin' }
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'New description' }
    });
    fireEvent.change(screen.getByLabelText('AirBnB Listing ID'), {
      target: { value: 'airbnb_123' }
    });
    fireEvent.change(screen.getByLabelText('Check-in Date'), {
      target: { value: '2024-02-01' }
    });
    fireEvent.change(screen.getByLabelText('Check-out Date'), {
      target: { value: '2024-02-03' }
    });
    fireEvent.change(screen.getByLabelText('Estimated Travel Cost (one way)'), {
      target: { value: '100' }
    });
    
    // Submit form
    fireEvent.click(screen.getByText('Create Cabin'));
    
    await waitFor(() => {
      expect(mockCabinService.createCabin).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Cabin',
          description: 'New description',
          airbnbListingId: 'airbnb_123',
          checkIn: '2024-02-01',
          checkOut: '2024-02-03',
          estimatedTravelCost: 100
        }),
        'current-user'
      );
    });
  });

  it('handles cabin creation error', async () => {
    mockCabinService.getCabins.mockReturnValue([]);
    mockCabinService.createCabin.mockRejectedValue(new Error('Creation failed'));
    
    render(<CabinPage />);
    
    // Open create dialog
    fireEvent.click(screen.getByText('Create New Cabin'));
    
    // Fill in required fields
    fireEvent.change(screen.getByLabelText('Cabin Name'), {
      target: { value: 'Test Cabin' }
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Test description' }
    });
    fireEvent.change(screen.getByLabelText('AirBnB Listing ID'), {
      target: { value: 'airbnb_123' }
    });
    fireEvent.change(screen.getByLabelText('Check-in Date'), {
      target: { value: '2024-02-01' }
    });
    fireEvent.change(screen.getByLabelText('Check-out Date'), {
      target: { value: '2024-02-03' }
    });
    
    // Submit form
    fireEvent.click(screen.getByText('Create Cabin'));
    
    await waitFor(() => {
      expect(screen.getByText('Failed to create cabin')).toBeInTheDocument();
    });
  });

  it('displays cabin details correctly', () => {
    const mockCabin = {
      id: 'cabin_1',
      name: 'Test Cabin',
      description: 'Test description',
      checkIn: '2024-02-01',
      checkOut: '2024-02-03',
      totalCost: 300,
      travelCostHold: 200,
      status: 'scheduled',
      users: [
        { id: 'user1', name: 'User One', email: 'user1@example.com' },
        { id: 'user2', name: 'User Two', email: 'user2@example.com' }
      ],
      items: [
        { id: 'item1', itemName: 'Demo Item 1', deposit: 50 },
        { id: 'item2', itemName: 'Demo Item 2', deposit: 75 }
      ],
      address: {
        city: 'San Francisco',
        state: 'CA'
      },
      airbnbInfo: {
        title: 'Cozy Cabin',
        checkInTime: '3:00 PM',
        checkOutTime: '11:00 AM'
      },
      chatRoomId: 'chat_123',
      calendarEventId: 'cal_123'
    };
    
    mockCabinService.getCabins.mockReturnValue([mockCabin]);
    
    render(<CabinPage />);
    
    expect(screen.getByText('Test Cabin')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
    expect(screen.getByText('User One')).toBeInTheDocument();
    expect(screen.getByText('User Two')).toBeInTheDocument();
    expect(screen.getByText('Demo Item 1')).toBeInTheDocument();
    expect(screen.getByText('Demo Item 2')).toBeInTheDocument();
    expect(screen.getByText('Chat Active')).toBeInTheDocument();
    expect(screen.getByText('Calendar Event')).toBeInTheDocument();
  });

  it('handles item takeout', async () => {
    const mockCabin = {
      id: 'cabin_1',
      name: 'Test Cabin',
      description: 'Test description',
      checkIn: '2024-02-01',
      checkOut: '2024-02-03',
      totalCost: 300,
      status: 'scheduled',
      users: [{ id: 'user1', name: 'User One', email: 'user1@example.com' }],
      items: [{ id: 'item1', itemName: 'Demo Item 1', deposit: 50 }],
      address: { city: 'SF', state: 'CA' },
      airbnbInfo: { title: 'Test Listing' }
    };
    
    const mockTakeout = {
      id: 'takeout_1',
      cabinId: 'cabin_1',
      itemId: 'item1',
      userId: 'user1',
      takenAt: '2024-02-01T10:00:00Z',
      expectedReturnDate: '2024-02-05',
      holdAmount: 150,
      travelCostHold: 100,
      status: 'active'
    };
    
    mockCabinService.getCabins.mockReturnValue([mockCabin]);
    mockCabinService.recordItemTakeout.mockResolvedValue(mockTakeout);
    
    render(<CabinPage />);
    
    // Click take away button
    const takeAwayButton = screen.getByText('Take Away');
    fireEvent.click(takeAwayButton);
    
    // Fill in return date
    fireEvent.change(screen.getByLabelText('Expected Return Date'), {
      target: { value: '2024-02-05' }
    });
    
    // Confirm takeout
    fireEvent.click(screen.getByText('Confirm Takeout'));
    
    await waitFor(() => {
      expect(mockCabinService.recordItemTakeout).toHaveBeenCalledWith(
        'cabin_1',
        'item1',
        'user1',
        '2024-02-05'
      );
    });
  });
});

