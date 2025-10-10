// Warehousing Service - Handles cabin reservations and meeting log integration
// Removed circular dependency - will use dependency injection instead
import { Cabin } from './CabinService';
import { OnboardingService } from './OnboardingService';

export interface CabinReservation {
  id: string;
  cabinId: string;
  cabinName: string;
  checkIn: string;
  checkOut: string;
  participants: string[];
  items: string[];
  totalCost: number;
  status: 'confirmed' | 'active' | 'completed' | 'cancelled';
  meetingLogId?: string;
  warehouseLocation?: string;
  createdAt: string;
}

export interface MeetingLog {
  id: string;
  type: 'cabin_reservation' | 'onboarding' | 'item_demo';
  title: string;
  description: string;
  participants: string[];
  startTime: string;
  endTime: string;
  location: string;
  items: string[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  capacity: number;
  currentOccupancy: number;
  amenities: string[];
  isActive: boolean;
}

export class WarehousingService {
  private static instance: WarehousingService;
  private reservations: Map<string, CabinReservation> = new Map();
  private meetingLogs: Map<string, MeetingLog> = new Map();
  private warehouseLocations: Map<string, WarehouseLocation> = new Map();
  private onboardingService: OnboardingService;

  static getInstance(): WarehousingService {
    if (!WarehousingService.instance) {
      WarehousingService.instance = new WarehousingService();
    }
    return WarehousingService.instance;
  }

  constructor() {
    this.onboardingService = OnboardingService.getInstance();
    this.initializeWarehouseLocations();
  }

  private initializeWarehouseLocations(): void {
    // Mock warehouse locations
    this.warehouseLocations.set('warehouse_1', {
      id: 'warehouse_1',
      name: 'Main Distribution Center',
      address: '123 Warehouse Blvd',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94107',
      capacity: 1000,
      currentOccupancy: 250,
      amenities: ['Loading Dock', 'Climate Control', 'Security', 'Office Space'],
      isActive: true
    });

    this.warehouseLocations.set('warehouse_2', {
      id: 'warehouse_2',
      name: 'East Coast Hub',
      address: '456 Logistics Way',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      capacity: 800,
      currentOccupancy: 400,
      amenities: ['Loading Dock', 'Climate Control', 'Security', 'Conference Rooms'],
      isActive: true
    });
  }

  // Create cabin reservation and meeting log
  async createCabinReservation(cabin: Cabin): Promise<CabinReservation> {
    try {
      const reservation: CabinReservation = {
        id: `reservation_${Date.now()}`,
        cabinId: cabin.id,
        cabinName: cabin.name,
        checkIn: cabin.checkIn,
        checkOut: cabin.checkOut,
        participants: cabin.users.map(u => u.id),
        items: cabin.items.map(i => i.itemId),
        totalCost: cabin.totalCost,
        status: 'confirmed',
        createdAt: new Date().toISOString()
      };

      // Store reservation
      this.reservations.set(reservation.id, reservation);

      // Create meeting log
      const meetingLog = await this.createMeetingLog({
        type: 'cabin_reservation',
        title: `Cabin Reservation: ${cabin.name}`,
        description: `Cabin demo session at ${cabin.address.city}, ${cabin.address.state}`,
        participants: cabin.users.map(u => u.id),
        startTime: cabin.checkIn,
        endTime: cabin.checkOut,
        location: `${cabin.address.address}, ${cabin.address.city}, ${cabin.address.state}`,
        items: cabin.items.map(i => i.itemId),
        status: 'scheduled'
      });

      // Link meeting log to reservation
      reservation.meetingLogId = meetingLog.id;
      this.reservations.set(reservation.id, reservation);

      // Assign warehouse location if needed
      await this.assignWarehouseLocation(reservation);

      console.log(`Cabin reservation created: ${reservation.id}`);
      return reservation;

    } catch (error) {
      console.error('Failed to create cabin reservation:', error);
      throw error;
    }
  }

  // Create meeting log
  async createMeetingLog(logData: {
    type: 'cabin_reservation' | 'onboarding' | 'item_demo';
    title: string;
    description: string;
    participants: string[];
    startTime: string;
    endTime: string;
    location: string;
    items: string[];
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    notes?: string;
    attachments?: string[];
  }): Promise<MeetingLog> {
    try {
      const meetingLog: MeetingLog = {
        id: `meeting_${Date.now()}`,
        ...logData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store meeting log
      this.meetingLogs.set(meetingLog.id, meetingLog);

      // If this is an onboarding meeting, also create it in the onboarding service
      if (logData.type === 'onboarding') {
        await this.onboardingService.scheduleOnboardingMeeting(
          logData.participants[0], // Assuming first participant is the candidate
          logData.participants[0], // Using same as name for simplicity
          logData.startTime,
          logData.participants.slice(1) // Rest are hiring team
        );
      }

      console.log(`Meeting log created: ${meetingLog.id}`);
      return meetingLog;

    } catch (error) {
      console.error('Failed to create meeting log:', error);
      throw error;
    }
  }

  // Assign warehouse location to reservation
  private async assignWarehouseLocation(reservation: CabinReservation): Promise<void> {
    try {
      // Find available warehouse location
      const availableWarehouses = Array.from(this.warehouseLocations.values())
        .filter(warehouse => warehouse.isActive && warehouse.currentOccupancy < warehouse.capacity);

      if (availableWarehouses.length > 0) {
        // Assign to the warehouse with most available capacity
        const selectedWarehouse = availableWarehouses.reduce((prev, current) => 
          (current.capacity - current.currentOccupancy) > (prev.capacity - prev.currentOccupancy) 
            ? current : prev
        );

        reservation.warehouseLocation = selectedWarehouse.id;
        this.reservations.set(reservation.id, reservation);

        // Update warehouse occupancy
        selectedWarehouse.currentOccupancy += 1;
        this.warehouseLocations.set(selectedWarehouse.id, selectedWarehouse);

        console.log(`Reservation ${reservation.id} assigned to warehouse ${selectedWarehouse.name}`);
      }
    } catch (error) {
      console.error('Failed to assign warehouse location:', error);
    }
  }

  // Update meeting log
  async updateMeetingLog(
    logId: string, 
    updates: Partial<MeetingLog>
  ): Promise<MeetingLog> {
    try {
      const meetingLog = this.meetingLogs.get(logId);
      if (!meetingLog) {
        throw new Error('Meeting log not found');
      }

      const updatedLog = {
        ...meetingLog,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      this.meetingLogs.set(logId, updatedLog);

      console.log(`Meeting log updated: ${logId}`);
      return updatedLog;

    } catch (error) {
      console.error('Failed to update meeting log:', error);
      throw error;
    }
  }

  // Get all meeting logs
  getAllMeetingLogs(): MeetingLog[] {
    return Array.from(this.meetingLogs.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Get meeting logs by type
  getMeetingLogsByType(type: 'cabin_reservation' | 'onboarding' | 'item_demo'): MeetingLog[] {
    return Array.from(this.meetingLogs.values())
      .filter(log => log.type === type)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Get cabin reservations
  getCabinReservations(): CabinReservation[] {
    return Array.from(this.reservations.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Get warehouse locations
  getWarehouseLocations(): WarehouseLocation[] {
    return Array.from(this.warehouseLocations.values());
  }

  // Get meeting log by ID
  getMeetingLog(logId: string): MeetingLog | undefined {
    return this.meetingLogs.get(logId);
  }

  // Get reservation by ID
  getReservation(reservationId: string): CabinReservation | undefined {
    return this.reservations.get(reservationId);
  }

  // Update reservation status
  async updateReservationStatus(
    reservationId: string, 
    status: CabinReservation['status']
  ): Promise<void> {
    try {
      const reservation = this.reservations.get(reservationId);
      if (!reservation) {
        throw new Error('Reservation not found');
      }

      reservation.status = status;
      this.reservations.set(reservationId, reservation);

      // Update associated meeting log
      if (reservation.meetingLogId) {
        const meetingLog = this.meetingLogs.get(reservation.meetingLogId);
        if (meetingLog) {
          let logStatus: MeetingLog['status'];
          switch (status) {
            case 'confirmed':
              logStatus = 'scheduled';
              break;
            case 'active':
              logStatus = 'in_progress';
              break;
            case 'completed':
              logStatus = 'completed';
              break;
            case 'cancelled':
              logStatus = 'cancelled';
              break;
            default:
              logStatus = 'scheduled';
          }
          
          await this.updateMeetingLog(reservation.meetingLogId, { status: logStatus });
        }
      }

      console.log(`Reservation ${reservationId} status updated to ${status}`);
    } catch (error) {
      console.error('Failed to update reservation status:', error);
      throw error;
    }
  }

  // Get warehouse capacity utilization
  getWarehouseUtilization(): {
    totalCapacity: number;
    totalOccupancy: number;
    utilizationPercentage: number;
    warehouses: Array<{
      id: string;
      name: string;
      capacity: number;
      occupancy: number;
      utilizationPercentage: number;
    }>;
  } {
    const warehouses = Array.from(this.warehouseLocations.values());
    const totalCapacity = warehouses.reduce((sum, w) => sum + w.capacity, 0);
    const totalOccupancy = warehouses.reduce((sum, w) => sum + w.currentOccupancy, 0);
    const utilizationPercentage = totalCapacity > 0 ? (totalOccupancy / totalCapacity) * 100 : 0;

    return {
      totalCapacity,
      totalOccupancy,
      utilizationPercentage,
      warehouses: warehouses.map(w => ({
        id: w.id,
        name: w.name,
        capacity: w.capacity,
        occupancy: w.currentOccupancy,
        utilizationPercentage: w.capacity > 0 ? (w.currentOccupancy / w.capacity) * 100 : 0
      }))
    };
  }

  // Search meeting logs
  searchMeetingLogs(query: {
    type?: string;
    status?: string;
    participant?: string;
    dateRange?: { start: string; end: string };
  }): MeetingLog[] {
    let logs = Array.from(this.meetingLogs.values());

    if (query.type) {
      logs = logs.filter(log => log.type === query.type);
    }

    if (query.status) {
      logs = logs.filter(log => log.status === query.status);
    }

    if (query.participant) {
      logs = logs.filter(log => 
        log.participants.some(p => p.includes(query.participant!))
      );
    }

    if (query.dateRange) {
      const startDate = new Date(query.dateRange.start);
      const endDate = new Date(query.dateRange.end);
      logs = logs.filter(log => {
        const logDate = new Date(log.startTime);
        return logDate >= startDate && logDate <= endDate;
      });
    }

    return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export default WarehousingService;
