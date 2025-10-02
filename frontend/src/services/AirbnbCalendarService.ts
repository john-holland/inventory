// Airbnb Calendar Service - Handle calendar availability and appointment scheduling
export interface CalendarAvailability {
  listingId: string;
  date: string; // YYYY-MM-DD format
  available: boolean;
  price?: number; // Price for that specific date
  minimumNights?: number;
  maximumNights?: number;
  blockedReason?: string; // If not available, why?
}

export interface CalendarBlock {
  listingId: string;
  startDate: string;
  endDate: string;
  reason: 'maintenance' | 'cleaning' | 'personal' | 'booking' | 'other';
  description?: string;
  createdBy: string;
  createdAt: string;
}

export interface AppointmentSlot {
  id: string;
  listingId: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  duration: number; // minutes
  maxParticipants: number;
  currentParticipants: number;
  price: number;
  status: 'available' | 'booked' | 'cancelled';
  appointmentType: 'demo' | 'tour' | 'meeting' | 'inspection';
  description?: string;
  requirements?: string[];
}

export interface AppointmentBooking {
  id: string;
  slotId: string;
  listingId: string;
  userId: string;
  userName: string;
  userEmail: string;
  startTime: string;
  endTime: string;
  participants: number;
  totalCost: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  specialRequests?: string;
  createdAt: string;
  confirmationCode: string;
}

export interface CalendarSearchRequest {
  listingId: string;
  startDate: string;
  endDate: string;
  appointmentType?: 'demo' | 'tour' | 'meeting' | 'inspection';
  duration?: number; // minutes
  maxParticipants?: number;
}

export class AirbnbCalendarService {
  private static instance: AirbnbCalendarService;
  private availability: Map<string, CalendarAvailability[]> = new Map();
  private blocks: Map<string, CalendarBlock[]> = new Map();
  private appointmentSlots: Map<string, AppointmentSlot[]> = new Map();
  private bookings: Map<string, AppointmentBooking> = new Map();

  static getInstance(): AirbnbCalendarService {
    if (!AirbnbCalendarService.instance) {
      AirbnbCalendarService.instance = new AirbnbCalendarService();
    }
    return AirbnbCalendarService.instance;
  }

  constructor() {
    this.initializeMockData();
    console.log('📅 Airbnb Calendar Service initialized');
  }

  // Initialize mock calendar data
  private initializeMockData(): void {
    // Mock availability for different listings
    const listings = ['airbnb_123', 'airbnb_456', 'airbnb_789'];
    
    listings.forEach(listingId => {
      const availability: CalendarAvailability[] = [];
      const blocks: CalendarBlock[] = [];
      const slots: AppointmentSlot[] = [];

      // Generate 90 days of availability data
      for (let i = 0; i < 90; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        // Mock availability logic
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const isHoliday = this.isHoliday(date);
        const isBlocked = Math.random() < 0.1; // 10% chance of being blocked

        availability.push({
          listingId,
          date: dateStr,
          available: !isHoliday && !isBlocked,
          price: isWeekend ? 200 : 150,
          minimumNights: 1,
          maximumNights: 7,
          blockedReason: isHoliday ? 'Holiday' : isBlocked ? 'Maintenance' : undefined
        });

        // Add some random blocks
        if (isBlocked) {
          blocks.push({
            listingId,
            startDate: dateStr,
            endDate: dateStr,
            reason: 'maintenance',
            description: 'Scheduled maintenance',
            createdBy: 'system',
            createdAt: new Date().toISOString()
          });
        }

        // Generate appointment slots for available days
        if (!isHoliday && !isBlocked) {
          const slotsForDay = this.generateAppointmentSlots(listingId, dateStr);
          slots.push(...slotsForDay);
        }
      }

      this.availability.set(listingId, availability);
      this.blocks.set(listingId, blocks);
      this.appointmentSlots.set(listingId, slots);
    });
  }

  // Generate appointment slots for a specific date
  private generateAppointmentSlots(listingId: string, date: string): AppointmentSlot[] {
    const slots: AppointmentSlot[] = [];
    const baseDate = new Date(date);
    
    // Generate slots every 2 hours from 9 AM to 7 PM
    for (let hour = 9; hour <= 19; hour += 2) {
      const startTime = new Date(baseDate);
      startTime.setHours(hour, 0, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setHours(hour + 2, 0, 0, 0);

      // Randomly make some slots unavailable
      const isAvailable = Math.random() > 0.3; // 70% chance of being available
      
      slots.push({
        id: `slot_${listingId}_${date}_${hour}`,
        listingId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: 120, // 2 hours
        maxParticipants: 8,
        currentParticipants: isAvailable ? 0 : Math.floor(Math.random() * 8),
        price: 150 + Math.floor(Math.random() * 100),
        status: isAvailable ? 'available' : 'booked',
        appointmentType: 'demo',
        description: 'Item demonstration session',
        requirements: ['Valid ID', 'Signed waiver']
      });
    }

    return slots;
  }

  // Check if a date is a holiday
  private isHoliday(date: Date): boolean {
    const month = date.getMonth();
    const day = date.getDate();
    
    // Simple holiday check (US holidays)
    const holidays = [
      [0, 1],   // New Year's Day
      [6, 4],   // Independence Day
      [10, 25], // Christmas
      [11, 31]  // New Year's Eve
    ];

    return holidays.some(([holidayMonth, holidayDay]) => 
      month === holidayMonth && day === holidayDay
    );
  }

  // Get calendar availability for a listing
  async getAvailability(listingId: string, startDate: string, endDate: string): Promise<CalendarAvailability[]> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200));

      const listingAvailability = this.availability.get(listingId) || [];
      
      return listingAvailability.filter(avail => 
        avail.date >= startDate && avail.date <= endDate
      );

    } catch (error) {
      console.error('Failed to get calendar availability:', error);
      throw error;
    }
  }

  // Search for available appointment slots
  async searchAppointmentSlots(request: CalendarSearchRequest): Promise<AppointmentSlot[]> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      const slots = this.appointmentSlots.get(request.listingId) || [];
      
      const startDate = new Date(request.startDate);
      const endDate = new Date(request.endDate);

      return slots.filter(slot => {
        const slotDate = new Date(slot.startTime);
        
        // Filter by date range
        if (slotDate < startDate || slotDate > endDate) return false;
        
        // Filter by appointment type
        if (request.appointmentType && slot.appointmentType !== request.appointmentType) return false;
        
        // Filter by duration
        if (request.duration && slot.duration !== request.duration) return false;
        
        // Filter by max participants
        if (request.maxParticipants && slot.maxParticipants < request.maxParticipants) return false;
        
        // Only return available slots
        return slot.status === 'available';
      });

    } catch (error) {
      console.error('Failed to search appointment slots:', error);
      throw error;
    }
  }

  // Book an appointment slot
  async bookAppointment(
    slotId: string,
    userId: string,
    userName: string,
    userEmail: string,
    participants: number,
    specialRequests?: string
  ): Promise<AppointmentBooking> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Find the slot
      let slot: AppointmentSlot | undefined;
      let listingId: string | undefined;

      for (const [listing, slots] of this.appointmentSlots.entries()) {
        slot = slots.find(s => s.id === slotId);
        if (slot) {
          listingId = listing;
          break;
        }
      }

      if (!slot || !listingId) {
        throw new Error('Appointment slot not found');
      }

      if (slot.status !== 'available') {
        throw new Error('Appointment slot is not available');
      }

      if (slot.currentParticipants + participants > slot.maxParticipants) {
        throw new Error('Not enough space for requested participants');
      }

      // Create booking
      const booking: AppointmentBooking = {
        id: `booking_${Date.now()}`,
        slotId,
        listingId,
        userId,
        userName,
        userEmail,
        startTime: slot.startTime,
        endTime: slot.endTime,
        participants,
        totalCost: slot.price * participants,
        status: 'confirmed',
        specialRequests,
        createdAt: new Date().toISOString(),
        confirmationCode: `APT-${Math.random().toString(36).substr(2, 8).toUpperCase()}`
      };

      // Update slot
      slot.currentParticipants += participants;
      if (slot.currentParticipants >= slot.maxParticipants) {
        slot.status = 'booked';
      }

      // Store booking
      this.bookings.set(booking.id, booking);

      console.log(`Appointment booked: ${booking.id}`);
      return booking;

    } catch (error) {
      console.error('Failed to book appointment:', error);
      throw error;
    }
  }

  // Cancel an appointment
  async cancelAppointment(bookingId: string): Promise<{ success: boolean; refundAmount: number }> {
    try {
      const booking = this.bookings.get(bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.status === 'cancelled') {
        throw new Error('Booking already cancelled');
      }

      // Find and update the slot
      const slots = this.appointmentSlots.get(booking.listingId) || [];
      const slot = slots.find(s => s.id === booking.slotId);
      
      if (slot) {
        slot.currentParticipants -= booking.participants;
        if (slot.currentParticipants < slot.maxParticipants) {
          slot.status = 'available';
        }
      }

      // Update booking
      booking.status = 'cancelled';
      this.bookings.set(bookingId, booking);

      // Calculate refund (full refund if cancelled more than 24 hours in advance)
      const bookingTime = new Date(booking.startTime);
      const now = new Date();
      const hoursUntilAppointment = (bookingTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      const refundAmount = hoursUntilAppointment > 24 ? booking.totalCost : booking.totalCost * 0.5;

      return { success: true, refundAmount };

    } catch (error) {
      console.error('Failed to cancel appointment:', error);
      throw error;
    }
  }

  // Get user's appointments
  async getUserAppointments(userId: string): Promise<AppointmentBooking[]> {
    try {
      const userBookings = Array.from(this.bookings.values())
        .filter(booking => booking.userId === userId)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      return userBookings;

    } catch (error) {
      console.error('Failed to get user appointments:', error);
      throw error;
    }
  }

  // Get appointment details
  async getAppointmentDetails(bookingId: string): Promise<AppointmentBooking | null> {
    try {
      return this.bookings.get(bookingId) || null;
    } catch (error) {
      console.error('Failed to get appointment details:', error);
      throw error;
    }
  }

  // Block calendar dates
  async blockCalendarDates(
    listingId: string,
    startDate: string,
    endDate: string,
    reason: CalendarBlock['reason'],
    description?: string,
    createdBy: string = 'system'
  ): Promise<CalendarBlock> {
    try {
      const block: CalendarBlock = {
        listingId,
        startDate,
        endDate,
        reason,
        description,
        createdBy,
        createdAt: new Date().toISOString()
      };

      const blocks = this.blocks.get(listingId) || [];
      blocks.push(block);
      this.blocks.set(listingId, blocks);

      // Update availability
      const availability = this.availability.get(listingId) || [];
      const start = new Date(startDate);
      const end = new Date(endDate);

      availability.forEach(avail => {
        const availDate = new Date(avail.date);
        if (availDate >= start && availDate <= end) {
          avail.available = false;
          avail.blockedReason = reason;
        }
      });

      this.availability.set(listingId, availability);

      console.log(`Calendar blocked: ${listingId} from ${startDate} to ${endDate}`);
      return block;

    } catch (error) {
      console.error('Failed to block calendar dates:', error);
      throw error;
    }
  }

  // Get calendar blocks for a listing
  async getCalendarBlocks(listingId: string, startDate: string, endDate: string): Promise<CalendarBlock[]> {
    try {
      const blocks = this.blocks.get(listingId) || [];
      
      return blocks.filter(block => 
        block.startDate <= endDate && block.endDate >= startDate
      );

    } catch (error) {
      console.error('Failed to get calendar blocks:', error);
      throw error;
    }
  }

  // Sync with Airbnb API (mock implementation)
  async syncWithAirbnb(listingId: string): Promise<{ success: boolean; syncedDates: number }> {
    try {
      // Simulate API sync delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock sync - in real implementation, would call Airbnb API
      const syncedDates = Math.floor(Math.random() * 30) + 1;
      
      console.log(`Synced ${syncedDates} dates for listing ${listingId}`);
      return { success: true, syncedDates };

    } catch (error) {
      console.error('Failed to sync with Airbnb:', error);
      throw error;
    }
  }
}

export default AirbnbCalendarService;
