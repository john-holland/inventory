// Hotel Service - Generic hotel API abstraction with HotelTonight integration
export interface Hotel {
  id: string;
  name: string;
  description: string;
  address: HotelAddress;
  rating: number;
  pricePerNight: number;
  amenities: string[];
  images: string[];
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: string;
  provider: 'hoteltonight' | 'booking' | 'expedia' | 'airbnb';
  providerId: string;
  isAvailable: boolean;
  maxGuests: number;
  roomTypes: HotelRoomType[];
}

export interface HotelAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface HotelRoomType {
  id: string;
  name: string;
  description: string;
  maxOccupancy: number;
  pricePerNight: number;
  amenities: string[];
  images: string[];
  isAvailable: boolean;
}

export interface HotelSearchRequest {
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  amenities?: string[];
  providers?: string[];
}

export interface HotelBookingRequest {
  hotelId: string;
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
  guestInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  paymentInfo: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    billingAddress: HotelAddress;
  };
}

export interface HotelBooking {
  id: string;
  hotelId: string;
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
  totalCost: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  confirmationCode: string;
  guestInfo: HotelBookingRequest['guestInfo'];
  createdAt: string;
  provider: string;
}

export interface HotelProvider {
  name: string;
  searchHotels(request: HotelSearchRequest): Promise<Hotel[]>;
  bookHotel(request: HotelBookingRequest): Promise<HotelBooking>;
  cancelBooking(bookingId: string): Promise<{ success: boolean; refundAmount: number }>;
  getBookingDetails(bookingId: string): Promise<HotelBooking | null>;
}

export class HotelService {
  private static instance: HotelService;
  private providers: Map<string, HotelProvider> = new Map();
  private bookings: Map<string, HotelBooking> = new Map();

  static getInstance(): HotelService {
    if (!HotelService.instance) {
      HotelService.instance = new HotelService();
    }
    return HotelService.instance;
  }

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize HotelTonight provider
    this.providers.set('hoteltonight', new HotelTonightProvider());
    
    // Initialize other providers (stubbed)
    this.providers.set('booking', new BookingProvider());
    this.providers.set('expedia', new ExpediaProvider());
    this.providers.set('airbnb', new AirbnbProvider());
  }

  // Search hotels across all providers
  async searchHotels(request: HotelSearchRequest): Promise<Hotel[]> {
    try {
      const searchPromises: Promise<Hotel[]>[] = [];
      
      // Determine which providers to search
      const providersToSearch = request.providers || Array.from(this.providers.keys());
      
      for (const providerName of providersToSearch) {
        const provider = this.providers.get(providerName);
        if (provider) {
          searchPromises.push(provider.searchHotels(request));
        }
      }

      // Wait for all searches to complete
      const results = await Promise.allSettled(searchPromises);
      
      // Combine and deduplicate results
      const allHotels: Hotel[] = [];
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          allHotels.push(...result.value);
        }
      });

      // Sort by price and rating
      return allHotels.sort((a, b) => {
        if (a.pricePerNight !== b.pricePerNight) {
          return a.pricePerNight - b.pricePerNight;
        }
        return b.rating - a.rating;
      });

    } catch (error) {
      console.error('Failed to search hotels:', error);
      throw error;
    }
  }

  // Book hotel through specific provider
  async bookHotel(providerName: string, request: HotelBookingRequest): Promise<HotelBooking> {
    try {
      const provider = this.providers.get(providerName);
      if (!provider) {
        throw new Error(`Provider ${providerName} not found`);
      }

      const booking = await provider.bookHotel(request);
      
      // Store booking
      this.bookings.set(booking.id, booking);
      
      console.log(`Hotel booking created: ${booking.id}`);
      return booking;

    } catch (error) {
      console.error('Failed to book hotel:', error);
      throw error;
    }
  }

  // Cancel booking
  async cancelBooking(bookingId: string): Promise<{ success: boolean; refundAmount: number }> {
    try {
      const booking = this.bookings.get(bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }

      const provider = this.providers.get(booking.provider);
      if (!provider) {
        throw new Error(`Provider ${booking.provider} not found`);
      }

      const result = await provider.cancelBooking(bookingId);
      
      if (result.success) {
        booking.status = 'cancelled';
        this.bookings.set(bookingId, booking);
      }

      return result;

    } catch (error) {
      console.error('Failed to cancel booking:', error);
      throw error;
    }
  }

  // Get booking details
  async getBookingDetails(bookingId: string): Promise<HotelBooking | null> {
    try {
      const booking = this.bookings.get(bookingId);
      if (booking) {
        return booking;
      }

      // Try to fetch from provider
      const bookingPromises = Array.from(this.providers.values()).map(provider =>
        provider.getBookingDetails(bookingId)
      );

      const results = await Promise.allSettled(bookingPromises);
      
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          this.bookings.set(bookingId, result.value);
          return result.value;
        }
      }

      return null;

    } catch (error) {
      console.error('Failed to get booking details:', error);
      throw error;
    }
  }

  // Get all bookings
  getAllBookings(): HotelBooking[] {
    return Array.from(this.bookings.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Get bookings by status
  getBookingsByStatus(status: HotelBooking['status']): HotelBooking[] {
    return Array.from(this.bookings.values())
      .filter(booking => booking.status === status);
  }

  // Get available providers
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

// HotelTonight Provider Implementation
class HotelTonightProvider implements HotelProvider {
  name = 'hoteltonight';

  async searchHotels(request: HotelSearchRequest): Promise<Hotel[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Mock HotelTonight data
    const mockHotels: Hotel[] = [
      {
        id: 'ht_hotel_1',
        name: 'The Modern Hotel Tonight',
        description: 'Stylish boutique hotel in the heart of downtown',
        address: {
          street: '123 Modern Street',
          city: request.location.split(',')[0] || 'San Francisco',
          state: 'CA',
          zipCode: '94102',
          country: 'USA',
          latitude: 37.7749,
          longitude: -122.4194
        },
        rating: 4.5,
        pricePerNight: 120,
        amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Bar'],
        images: [
          'https://via.placeholder.com/400x300/4caf50/ffffff?text=Hotel+1',
          'https://via.placeholder.com/400x300/2196f3/ffffff?text=Hotel+1+Room'
        ],
        checkInTime: '3:00 PM',
        checkOutTime: '11:00 AM',
        cancellationPolicy: 'Free cancellation until 6 PM on day of arrival',
        provider: 'hoteltonight',
        providerId: 'ht_12345',
        isAvailable: true,
        maxGuests: 4,
        roomTypes: [
          {
            id: 'ht_room_1',
            name: 'Standard Room',
            description: 'Comfortable room with city view',
            maxOccupancy: 2,
            pricePerNight: 120,
            amenities: ['WiFi', 'TV', 'Mini Bar'],
            images: ['https://via.placeholder.com/300x200/4caf50/ffffff?text=Standard+Room'],
            isAvailable: true
          }
        ]
      },
      {
        id: 'ht_hotel_2',
        name: 'Luxury Suites Tonight',
        description: 'Premium accommodations with exceptional service',
        address: {
          street: '456 Luxury Lane',
          city: request.location.split(',')[0] || 'San Francisco',
          state: 'CA',
          zipCode: '94105',
          country: 'USA',
          latitude: 37.7849,
          longitude: -122.4094
        },
        rating: 4.8,
        pricePerNight: 250,
        amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Concierge', 'Valet'],
        images: [
          'https://via.placeholder.com/400x300/ff9800/ffffff?text=Luxury+Hotel',
          'https://via.placeholder.com/400x300/9c27b0/ffffff?text=Luxury+Suite'
        ],
        checkInTime: '4:00 PM',
        checkOutTime: '12:00 PM',
        cancellationPolicy: 'Free cancellation until 2 PM on day of arrival',
        provider: 'hoteltonight',
        providerId: 'ht_67890',
        isAvailable: true,
        maxGuests: 6,
        roomTypes: [
          {
            id: 'ht_room_2',
            name: 'Luxury Suite',
            description: 'Spacious suite with premium amenities',
            maxOccupancy: 4,
            pricePerNight: 250,
            amenities: ['WiFi', 'TV', 'Mini Bar', 'Jacuzzi', 'Balcony'],
            images: ['https://via.placeholder.com/300x200/ff9800/ffffff?text=Luxury+Suite'],
            isAvailable: true
          }
        ]
      }
    ];

    // Filter by price range if specified
    let filteredHotels = mockHotels;
    if (request.minPrice) {
      filteredHotels = filteredHotels.filter(hotel => hotel.pricePerNight >= request.minPrice!);
    }
    if (request.maxPrice) {
      filteredHotels = filteredHotels.filter(hotel => hotel.pricePerNight <= request.maxPrice!);
    }

    return filteredHotels;
  }

  async bookHotel(request: HotelBookingRequest): Promise<HotelBooking> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const booking: HotelBooking = {
      id: `ht_booking_${Date.now()}`,
      hotelId: request.hotelId,
      roomTypeId: request.roomTypeId,
      checkIn: request.checkIn,
      checkOut: request.checkOut,
      guests: request.guests,
      rooms: request.rooms,
      totalCost: this.calculateTotalCost(request),
      status: 'confirmed',
      confirmationCode: `HT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      guestInfo: request.guestInfo,
      createdAt: new Date().toISOString(),
      provider: 'hoteltonight'
    };

    return booking;
  }

  async cancelBooking(bookingId: string): Promise<{ success: boolean; refundAmount: number }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));

    // Mock cancellation logic
    return {
      success: true,
      refundAmount: 0 // HotelTonight typically offers non-refundable rates
    };
  }

  async getBookingDetails(bookingId: string): Promise<HotelBooking | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Mock booking details lookup
    return null; // Would normally fetch from HotelTonight API
  }

  private calculateTotalCost(request: HotelBookingRequest): number {
    // Mock calculation - in real implementation, would fetch actual room rates
    const baseRate = 120; // Mock base rate
    const nights = Math.ceil(
      (new Date(request.checkOut).getTime() - new Date(request.checkIn).getTime()) / (1000 * 60 * 60 * 24)
    );
    return baseRate * nights * request.rooms;
  }
}

// Stubbed providers for other hotel services
class BookingProvider implements HotelProvider {
  name = 'booking';
  
  async searchHotels(request: HotelSearchRequest): Promise<Hotel[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return []; // Stubbed - would integrate with Booking.com API
  }
  
  async bookHotel(request: HotelBookingRequest): Promise<HotelBooking> {
    await new Promise(resolve => setTimeout(resolve, 600));
    throw new Error('Booking.com integration not implemented');
  }
  
  async cancelBooking(bookingId: string): Promise<{ success: boolean; refundAmount: number }> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: false, refundAmount: 0 };
  }
  
  async getBookingDetails(bookingId: string): Promise<HotelBooking | null> {
    await new Promise(resolve => setTimeout(resolve, 150));
    return null;
  }
}

class ExpediaProvider implements HotelProvider {
  name = 'expedia';
  
  async searchHotels(request: HotelSearchRequest): Promise<Hotel[]> {
    await new Promise(resolve => setTimeout(resolve, 350));
    return []; // Stubbed - would integrate with Expedia API
  }
  
  async bookHotel(request: HotelBookingRequest): Promise<HotelBooking> {
    await new Promise(resolve => setTimeout(resolve, 550));
    throw new Error('Expedia integration not implemented');
  }
  
  async cancelBooking(bookingId: string): Promise<{ success: boolean; refundAmount: number }> {
    await new Promise(resolve => setTimeout(resolve, 250));
    return { success: false, refundAmount: 0 };
  }
  
  async getBookingDetails(bookingId: string): Promise<HotelBooking | null> {
    await new Promise(resolve => setTimeout(resolve, 120));
    return null;
  }
}

class AirbnbProvider implements HotelProvider {
  name = 'airbnb';
  
  async searchHotels(request: HotelSearchRequest): Promise<Hotel[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return []; // Stubbed - would integrate with Airbnb API
  }
  
  async bookHotel(request: HotelBookingRequest): Promise<HotelBooking> {
    await new Promise(resolve => setTimeout(resolve, 700));
    throw new Error('Airbnb integration not implemented');
  }
  
  async cancelBooking(bookingId: string): Promise<{ success: boolean; refundAmount: number }> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return { success: false, refundAmount: 0 };
  }
  
  async getBookingDetails(bookingId: string): Promise<HotelBooking | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return null;
  }
}

export default HotelService;
