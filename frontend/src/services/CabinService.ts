// Cabin Service - AirBnB integrated item demo and tour service
import { ChatService } from './ChatService';
import { PermissionService } from './PermissionService';
import { ReviewService } from './ReviewService';
import { WarehousingService } from './WarehousingService';
import { HotelService } from './HotelService';
import { TravelCostService } from './TravelCostService';
import { AirbnbCalendarService } from './AirbnbCalendarService';

export interface CabinUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  airbnbUsername?: string;
  airbnbOAuth2Token?: string;
  verified: boolean;
  rating: number;
  totalCabinStays: number;
}

export interface CabinItem {
  id: string;
  itemId: string;
  itemName: string;
  itemDescription: string;
  itemValue: number;
  owner: string;
  availableForDemo: boolean;
  requiresDeposit: boolean;
  depositAmount: number;
  canTakeAway: boolean;
  takeAwayHoldMultiplier: number; // Multiplier for hold amount if taken away
}

export interface CabinItemTakeout {
  id: string;
  cabinId: string;
  itemId: string;
  userId: string;
  takenAt: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  holdAmount: number;
  travelCostHold: number;
  returnShippingFee: number; // Prorated return shipping fee
  returnShippingPaid: boolean; // Whether user paid return shipping upfront
  status: 'active' | 'returned' | 'overdue' | 'disputed';
}

export interface CabinAddress {
  id: string;
  airbnbListingId: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude: number;
  longitude: number;
  maxGuests: number;
  amenities: string[];
}

export interface CabinAirbnbInfo {
  listingId: string;
  title: string;
  description: string;
  pricePerNight: number;
  minimumNights: number;
  maximumNights: number;
  checkInTime: string;
  checkOutTime: string;
  houseRules: string[];
  cancellationPolicy: string;
  hostId: string;
  hostName: string;
  photos: string[];
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    latitude: number;
    longitude: number;
  };
}

export interface Cabin {
  id: string;
  name: string;
  description: string;
  users: CabinUser[];
  items: CabinItem[];
  itemTakeouts: CabinItemTakeout[];
  address: CabinAddress;
  originAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  airbnbInfo: CabinAirbnbInfo;
  checkIn: string;
  checkOut: string;
  totalCost: number;
  travelCostHold: number;
  travelCostBreakdown: {
    distance: number; // Miles
    gasPrice: number; // Price per gallon
    mpg: number; // Miles per gallon
    fuelCost: number; // Total fuel cost
    roundTripCost: number; // Fuel cost * 2
  };
  vehicleInfo?: {
    mpg: number;
    fuelType: 'gasoline' | 'diesel' | 'electric';
  };
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  chatRoomId: string;
  calendarEventId?: string;
  createdAt: string;
  createdBy: string;
}

export interface CabinCreateRequest {
  name: string;
  description: string;
  userIds: string[];
  itemIds: string[];
  airbnbListingId: string;
  checkIn: string;
  checkOut: string;
  originAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  vehicleInfo?: {
    mpg: number; // Miles per gallon
    fuelType: 'gasoline' | 'diesel' | 'electric';
  };
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  attendees: string[];
  organizer: string;
  reminders: number[]; // Minutes before event
}

export class CabinService {
  private static instance: CabinService;
  private cabins: Map<string, Cabin> = new Map();
  private users: Map<string, CabinUser> = new Map();
  private chatService: ChatService;
  private permissionService: PermissionService;
  private reviewService: ReviewService;
  private warehousingService: WarehousingService;
  private hotelService: HotelService;
  private travelCostService: TravelCostService;
  private calendarService: AirbnbCalendarService;

  constructor() {
    this.chatService = ChatService.getInstance();
    this.permissionService = PermissionService.getInstance();
    this.reviewService = ReviewService.getInstance();
    this.warehousingService = WarehousingService.getInstance();
    this.hotelService = HotelService.getInstance();
    this.travelCostService = TravelCostService.getInstance();
    this.calendarService = AirbnbCalendarService.getInstance();
    console.log('🏠 Cabin Service initialized');
  }

  static getInstance(): CabinService {
    if (!CabinService.instance) {
      CabinService.instance = new CabinService();
    }
    return CabinService.instance;
  }

  // Create a new Cabin session
  async createCabin(request: CabinCreateRequest, createdBy: string): Promise<Cabin> {
    try {
      // Check permissions before creating cabin
      const permissionCheck = await this.permissionService.canCreateCabin(createdBy);
      if (!permissionCheck.allowed) {
        throw new Error(`Cannot create cabin: ${permissionCheck.reason}`);
      }

      const cabinId = `cabin_${Date.now()}`;
      
      // Fetch AirBnB listing information
      const airbnbInfo = await this.fetchAirbnbListing(request.airbnbListingId);
      
      // Get user information
      const users = request.userIds.map(userId => this.users.get(userId)).filter(Boolean) as CabinUser[];
      
      // Calculate total cost
      const nights = this.calculateNights(request.checkIn, request.checkOut);
      const totalCost = airbnbInfo.pricePerNight * nights;
      
      // Calculate travel cost using actual distance, gas prices, and MPG
      const travelCostBreakdown = this.travelCostService.calculateCabinTravelCost(
        request.originAddress,
        {
          street: airbnbInfo.address.street,
          city: airbnbInfo.address.city,
          state: airbnbInfo.address.state,
          zipCode: airbnbInfo.address.zipCode,
          country: airbnbInfo.address.country,
          latitude: airbnbInfo.address.latitude,
          longitude: airbnbInfo.address.longitude
        },
        request.vehicleInfo
      );
      
      const travelCostHold = travelCostBreakdown.holdAmount;
      
      // Get items
      const items = await this.getItemsForCabin(request.itemIds);
      
      // Create address
      const address = await this.createCabinAddress(airbnbInfo);
      
      // Create the cabin
      const cabin: Cabin = {
        id: cabinId,
        name: request.name,
        description: request.description,
        users,
        items,
        itemTakeouts: [],
        address,
        originAddress: request.originAddress,
        airbnbInfo,
        checkIn: request.checkIn,
        checkOut: request.checkOut,
        totalCost,
        travelCostHold,
        travelCostBreakdown,
        vehicleInfo: request.vehicleInfo,
        status: 'scheduled',
        chatRoomId: `cabin_chat_${cabinId}`,
        createdAt: new Date().toISOString(),
        createdBy
      };

      // Auto-create chat room for all users
      await this.createCabinChatRoom(cabin);
      
      // Auto-create calendar event for all users
      await this.createCalendarEvent(cabin);
      
      // Store cabin
      this.cabins.set(cabinId, cabin);
      
      // Create warehousing reservation and meeting log
      await this.warehousingService.createCabinReservation(cabin);
      
      console.log(`🏠 Created cabin: ${cabinId}`);
      return cabin;
      
    } catch (error) {
      console.error('Failed to create cabin:', error);
      console.error('Error details:', error.message, error.stack);
      throw new Error(`Failed to create cabin: ${error.message}`);
    }
  }

  // Fetch AirBnB listing information
  private async fetchAirbnbListing(listingId: string): Promise<CabinAirbnbInfo> {
    try {
      // In production, this would call the real AirBnB API
      // For testing, we can use the MockAirbnbService
      if (process.env.NODE_ENV === 'test') {
        const { MockAirbnbService } = await import('./MockAirbnbService');
        const mockService = MockAirbnbService.getInstance();
        const listing = await mockService.fetchListing(listingId);
        
        return {
          listingId: listing.id,
          title: listing.title,
          description: listing.description,
          pricePerNight: listing.pricePerNight,
          minimumNights: 2,
          maximumNights: 7,
          checkInTime: listing.checkInTime,
          checkOutTime: listing.checkOutTime,
          houseRules: listing.houseRules,
          cancellationPolicy: 'Flexible: Full refund 1 day prior to arrival',
          hostId: listing.hostId,
          hostName: listing.hostName,
          photos: listing.photos,
          address: {
            street: '123 Demo Street',
            city: 'San Francisco',
            state: 'CA',
            zipCode: '94102',
            country: 'USA',
            latitude: 37.7749,
            longitude: -122.4194
          }
        };
      }
      
      // Mock AirBnB API response for development
      return {
        listingId,
        title: 'Beautiful Downtown Loft for Item Demos',
        description: 'Spacious loft perfect for showcasing items and hosting demo sessions',
        pricePerNight: 150,
        minimumNights: 2,
        maximumNights: 7,
        checkInTime: '3:00 PM',
        checkOutTime: '11:00 AM',
        houseRules: [
          'No smoking',
          'No parties',
          'Respect the space',
          'Handle demo items with care'
        ],
        cancellationPolicy: 'Flexible: Full refund 1 day prior to arrival',
        hostId: 'host_123',
        hostName: 'John Smith',
        photos: [
          'https://via.placeholder.com/400x300/4caf50/ffffff?text=Cabin+1',
          'https://via.placeholder.com/400x300/2196f3/ffffff?text=Cabin+2'
        ],
        address: {
          street: '456 Demo Avenue',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          country: 'USA',
          latitude: 34.0522,
          longitude: -118.2437
        }
      };
    } catch (error) {
      console.error('Failed to fetch AirBnB listing:', error);
      throw error;
    }
  }

  // Create address from AirBnB info
  private async createCabinAddress(airbnbInfo: CabinAirbnbInfo): Promise<CabinAddress> {
    return {
      id: `addr_${Date.now()}`,
      airbnbListingId: airbnbInfo.listingId,
      address: '123 Demo Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      country: 'USA',
      latitude: 37.7749,
      longitude: -122.4194,
      maxGuests: 6,
      amenities: ['WiFi', 'Kitchen', 'Workspace', 'Parking', 'Display Tables']
    };
  }

  // Get items for cabin
  private async getItemsForCabin(itemIds: string[]): Promise<CabinItem[]> {
    // In production, fetch from inventory service
    return itemIds.map(itemId => ({
      id: `cabin_item_${Date.now()}_${itemId}`,
      itemId,
      itemName: `Demo Item ${itemId}`,
      itemDescription: 'Item available for demonstration',
      itemValue: 500,
      owner: 'owner_123',
      availableForDemo: true,
      requiresDeposit: true,
      depositAmount: 100,
      canTakeAway: true,
      takeAwayHoldMultiplier: 1.5
    }));
  }

  // Auto-create chat room for cabin
  private async createCabinChatRoom(cabin: Cabin): Promise<void> {
    try {
      const chatRoom = await this.chatService.createChannel(
        `Cabin: ${cabin.name}`,
        cabin.users.map(u => u.id)
      );
      
      // Send welcome message
      await this.chatService.sendMessage(cabin.chatRoomId, {
        sender: 'Cabin Bot',
        content: `🏠 Welcome to ${cabin.name}!
        
📅 Check-in: ${new Date(cabin.checkIn).toLocaleDateString()} at ${cabin.airbnbInfo.checkInTime}
📅 Check-out: ${new Date(cabin.checkOut).toLocaleDateString()} at ${cabin.airbnbInfo.checkOutTime}
📍 Location: ${cabin.address.city}, ${cabin.address.state}
👥 Participants: ${cabin.users.map(u => u.name).join(', ')}
📦 Items for Demo: ${cabin.items.length}

🚗 Travel Cost Breakdown:
• Distance: ${cabin.travelCostBreakdown.distance} miles
• Gas Price: $${cabin.travelCostBreakdown.gasPrice}/gallon
• Vehicle MPG: ${cabin.travelCostBreakdown.mpg}
• One-way Fuel Cost: $${cabin.travelCostBreakdown.fuelCost}
• Round Trip Cost: $${cabin.travelCostBreakdown.roundTripCost}
• Travel Hold: $${cabin.travelCostHold.toFixed(2)} (2x round trip)

House Rules:
${cabin.airbnbInfo.houseRules.map(rule => `• ${rule}`).join('\n')}

Looking forward to a great demo session!`,
        type: 'bot'
      });
      
      console.log(`💬 Created chat room for cabin: ${cabin.chatRoomId}`);
    } catch (error) {
      console.error('Failed to create cabin chat room:', error);
    }
  }

  // Auto-create calendar event
  private async createCalendarEvent(cabin: Cabin): Promise<void> {
    try {
      const event: CalendarEvent = {
        id: `cal_${Date.now()}`,
        title: `Cabin Demo: ${cabin.name}`,
        description: `${cabin.description}

AirBnB: ${cabin.airbnbInfo.title}
Location: ${cabin.address.address}, ${cabin.address.city}, ${cabin.address.state}

Items for Demo:
${cabin.items.map(item => `• ${item.itemName}`).join('\n')}

Check-in: ${new Date(cabin.checkIn).toLocaleDateString()} at ${cabin.airbnbInfo.checkInTime}
Check-out: ${new Date(cabin.checkOut).toLocaleDateString()} at ${cabin.airbnbInfo.checkOutTime}

Total Cost: $${cabin.totalCost}
Travel Hold: $${cabin.travelCostHold}`,
        startTime: cabin.checkIn,
        endTime: cabin.checkOut,
        location: `${cabin.address.address}, ${cabin.address.city}, ${cabin.address.state} ${cabin.address.zipCode}`,
        attendees: cabin.users.map(u => u.email),
        organizer: cabin.createdBy,
        reminders: [1440, 60] // 1 day before and 1 hour before
      };
      
      // Send calendar invites to all users
      await this.sendCalendarInvites(event, cabin.users);
      
      // Update cabin with calendar event ID
      cabin.calendarEventId = event.id;
      this.cabins.set(cabin.id, cabin);
      
      console.log(`📅 Created calendar event: ${event.id}`);
    } catch (error) {
      console.error('Failed to create calendar event:', error);
    }
  }

  // Send calendar invites
  private async sendCalendarInvites(event: CalendarEvent, users: CabinUser[]): Promise<void> {
    try {
      // In production, this would integrate with Google Calendar, Outlook, etc.
      const invites = users.map(user => ({
        to: user.email,
        subject: `Cabin Demo Invitation: ${event.title}`,
        body: `
Hi ${user.name},

You're invited to a Cabin demo session!

${event.description}

When: ${new Date(event.startTime).toLocaleString()} - ${new Date(event.endTime).toLocaleString()}
Where: ${event.location}

Please RSVP by accepting this calendar invitation.

Best regards,
Cabin Demo Team
        `,
        icalAttachment: this.generateICalAttachment(event)
      }));
      
      console.log(`📧 Sent ${invites.length} calendar invites`);
    } catch (error) {
      console.error('Failed to send calendar invites:', error);
    }
  }

  // Generate iCal attachment for calendar invites
  private generateICalAttachment(event: CalendarEvent): string {
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Inventory System//Cabin Demo//EN
BEGIN:VEVENT
UID:${event.id}@inventory.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${new Date(event.startTime).toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${new Date(event.endTime).toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${event.title}
DESCRIPTION:${event.description.replace(/\n/g, '\\n')}
LOCATION:${event.location}
ORGANIZER:mailto:${event.organizer}
${event.attendees.map(att => `ATTENDEE:mailto:${att}`).join('\n')}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
  }

  // Record item takeout
  async recordItemTakeout(
    cabinId: string,
    itemId: string,
    userId: string,
    expectedReturnDate: string,
    payReturnShippingUpfront: boolean = false
  ): Promise<CabinItemTakeout> {
    try {
      // Check permissions before allowing takeout
      const permissionCheck = await this.permissionService.canTakeItem(userId, cabinId, itemId);
      if (!permissionCheck.allowed) {
        throw new Error(`Cannot take item: ${permissionCheck.reason}`);
      }

      const cabin = this.cabins.get(cabinId);
      if (!cabin) {
        throw new Error('Cabin not found');
      }

      const item = cabin.items.find(i => i.itemId === itemId);
      if (!item) {
        throw new Error('Item not found in cabin');
      }

      // Use cabin travel hold as the primary hold (travel x 2)
      // This replaces the item-specific deposit system
      const travelCostHold = cabin.travelCostHold; // This is already 2x travel cost
      
      // Calculate prorated return shipping fee based on item value and distance
      const returnShippingFee = this.calculateReturnShippingFee(item, cabin);
      
      // If user pays return shipping upfront, add it to the hold
      const totalHold = payReturnShippingUpfront 
        ? travelCostHold + returnShippingFee 
        : travelCostHold;

      const takeout: CabinItemTakeout = {
        id: `takeout_${Date.now()}`,
        cabinId,
        itemId,
        userId,
        takenAt: new Date().toISOString(),
        expectedReturnDate,
        holdAmount: totalHold,
        travelCostHold,
        returnShippingFee,
        returnShippingPaid: payReturnShippingUpfront,
        status: 'active'
      };

      // Add to cabin's takeouts
      cabin.itemTakeouts.push(takeout);
      this.cabins.set(cabinId, cabin);

      // Notify in chat
      await this.chatService.sendMessage(cabin.chatRoomId, {
        sender: 'Cabin Bot',
        content: `📦 Item Takeout Alert:
        
${this.users.get(userId)?.name} has taken "${item.itemName}" from the cabin.

Hold Amount: $${totalHold.toFixed(2)} (Travel Cost Hold - 2x travel cost)
  • This hold covers the item until return
  • No additional deposit required

Return Shipping: $${returnShippingFee.toFixed(2)}
  ${payReturnShippingUpfront 
    ? '✅ Paid upfront - no additional fee at return' 
    : '💳 Pay at return - heavily discounted rate'}

Expected Return: ${new Date(expectedReturnDate).toLocaleString()}`,
        type: 'system'
      });

      console.log(`📦 Recorded item takeout: ${takeout.id}`);
      return takeout;
      
    } catch (error) {
      console.error('Failed to record item takeout:', error);
      throw error;
    }
  }

  // Return item from takeout
  async returnItemFromTakeout(takeoutId: string): Promise<void> {
    try {
      // Find the takeout
      let cabin: Cabin | undefined;
      let takeout: CabinItemTakeout | undefined;

      for (const c of Array.from(this.cabins.values())) {
        takeout = c.itemTakeouts.find(t => t.id === takeoutId);
        if (takeout) {
          cabin = c;
          break;
        }
      }

      if (!cabin || !takeout) {
        throw new Error('Takeout not found');
      }

      // Update takeout status
      takeout.actualReturnDate = new Date().toISOString();
      takeout.status = 'returned';

      // Check if overdue
      if (new Date(takeout.actualReturnDate) > new Date(takeout.expectedReturnDate)) {
        takeout.status = 'overdue';
      }

      this.cabins.set(cabin.id, cabin);

      // Notify in chat
      await this.chatService.sendMessage(cabin.chatRoomId, {
        sender: 'Cabin Bot',
        content: `✅ Item Return:
        
${this.users.get(takeout.userId)?.name} has returned an item.

Return Date: ${new Date(takeout.actualReturnDate).toLocaleString()}
${takeout.status === 'overdue' ? '⚠️ Item was returned late' : '✅ Item returned on time'}

Hold of $${takeout.holdAmount.toFixed(2)} will be released.`,
        type: 'system'
      });

      console.log(`✅ Item returned from takeout: ${takeoutId}`);
      
    } catch (error) {
      console.error('Failed to return item:', error);
      throw error;
    }
  }

  // Get all cabins
  getCabins(): Cabin[] {
    return Array.from(this.cabins.values());
  }

  // Get cabin by ID
  getCabin(cabinId: string): Cabin | undefined {
    return this.cabins.get(cabinId);
  }

  // Get user cabins
  getUserCabins(userId: string): Cabin[] {
    return Array.from(this.cabins.values()).filter(cabin =>
      cabin.users.some(u => u.id === userId)
    );
  }

  // Update cabin status
  updateCabinStatus(cabinId: string, status: Cabin['status']): void {
    const cabin = this.cabins.get(cabinId);
    if (cabin) {
      cabin.status = status;
      this.cabins.set(cabinId, cabin);
    }
  }

  // Register user for cabin service
  registerUser(userData: Omit<CabinUser, 'id' | 'totalCabinStays'>): CabinUser {
    const user: CabinUser = {
      id: `user_${Date.now()}`,
      ...userData,
      totalCabinStays: 0
    };
    this.users.set(user.id, user);
    return user;
  }

  // Calculate nights
  private calculateNights(checkIn: string, checkOut: string): number {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // Get item takeouts for a cabin
  getCabinTakeouts(cabinId: string): CabinItemTakeout[] {
    const cabin = this.cabins.get(cabinId);
    return cabin?.itemTakeouts || [];
  }

  // Get active takeouts
  getActiveTakeouts(cabinId: string): CabinItemTakeout[] {
    const cabin = this.cabins.get(cabinId);
    return cabin?.itemTakeouts.filter(t => t.status === 'active') || [];
  }

  // Calculate total holds for a cabin
  calculateTotalHolds(cabinId: string): number {
    const cabin = this.cabins.get(cabinId);
    if (!cabin) return 0;

    const activeTakeouts = cabin.itemTakeouts.filter(t => t.status === 'active');
    return activeTakeouts.reduce((total, takeout) => total + takeout.holdAmount, 0);
  }

  // Create review for cabin
  async createCabinReview(
    cabinId: string,
    reviewerId: string,
    reviewerName: string,
    rating: number,
    title: string,
    content: string,
    categoryRatings: { [categoryId: string]: number }
  ): Promise<void> {
    try {
      // Create review through review service
      await this.reviewService.createReview(
        cabinId,
        reviewerId,
        reviewerName,
        rating,
        title,
        content,
        categoryRatings
      );

      // Check if user should be banned from service creation
      await this.reviewService.checkForServiceBan(reviewerId);

      console.log(`Review created for cabin ${cabinId} by user ${reviewerId}`);
    } catch (error) {
      console.error('Failed to create cabin review:', error);
      throw error;
    }
  }

  // Get cabin reviews
  getCabinReviews(cabinId: string) {
    return this.reviewService.getCabinReviews(cabinId);
  }

  // Get cabin review statistics
  getCabinReviewStats(cabinId: string) {
    return this.reviewService.getReviewStats(cabinId);
  }

  // Calculate prorated return shipping fee
  private calculateReturnShippingFee(item: CabinItem, cabin: Cabin): number {
    // Base shipping cost (this would normally come from shipping API)
    const baseShippingCost = 15.00; // Standard shipping cost
    
    // Prorate based on item value (higher value = higher discount)
    const valueMultiplier = Math.max(0.1, 1 - (item.itemValue / 1000)); // 10% minimum, decreases with value
    
    // Use actual distance from travel cost breakdown
    const distance = cabin.travelCostBreakdown.distance;
    const distanceMultiplier = this.calculateDistanceMultiplier(distance);
    
    // Calculate prorated fee
    const proratedFee = baseShippingCost * valueMultiplier * distanceMultiplier;
    
    // Round to nearest cent and ensure minimum of $2
    return Math.max(2.00, Math.round(proratedFee * 100) / 100);
  }

  // Calculate distance multiplier for shipping based on actual distance
  private calculateDistanceMultiplier(distance: number): number {
    if (distance < 50) return 0.3; // Local - 70% discount
    if (distance < 100) return 0.5; // Regional - 50% discount
    if (distance < 250) return 0.7; // State - 30% discount
    if (distance < 500) return 0.8; // National - 20% discount
    return 0.9; // International - 10% discount
  }

  // Process return shipping payment
  async processReturnShippingPayment(takeoutId: string, paymentMethod: string): Promise<{
    success: boolean;
    amount: number;
    transactionId: string;
  }> {
    try {
      // Find the takeout
      let cabin: Cabin | undefined;
      let takeout: CabinItemTakeout | undefined;

      for (const c of Array.from(this.cabins.values())) {
        takeout = c.itemTakeouts.find(t => t.id === takeoutId);
        if (takeout) {
          cabin = c;
          break;
        }
      }

      if (!cabin || !takeout) {
        throw new Error('Takeout not found');
      }

      if (takeout.returnShippingPaid) {
        throw new Error('Return shipping already paid');
      }

      // Process payment (mock implementation)
      const transactionId = `shipping_${Date.now()}`;
      
      // Mark as paid
      takeout.returnShippingPaid = true;
      this.cabins.set(cabin.id, cabin);

      // Notify in chat
      await this.chatService.sendMessage(cabin.chatRoomId, {
        sender: 'Cabin Bot',
        content: `💳 Return Shipping Payment Processed:
        
Transaction ID: ${transactionId}
Amount: $${takeout.returnShippingFee.toFixed(2)}
Payment Method: ${paymentMethod}

✅ Return shipping is now paid - no additional fees at return!`,
        type: 'system'
      });

      console.log(`Return shipping payment processed: ${transactionId}`);
      return {
        success: true,
        amount: takeout.returnShippingFee,
        transactionId
      };

    } catch (error) {
      console.error('Failed to process return shipping payment:', error);
      throw error;
    }
  }

  // Search hotel alternatives for cabin location
  async searchHotelAlternatives(
    cabinId: string,
    checkIn: string,
    checkOut: string,
    guests: number = 2
  ) {
    try {
      const cabin = this.cabins.get(cabinId);
      if (!cabin) {
        throw new Error('Cabin not found');
      }

      // Search hotels in the same area as the cabin
      const hotelSearchRequest = {
        location: `${cabin.address.city}, ${cabin.address.state}`,
        checkIn,
        checkOut,
        guests,
        rooms: 1,
        maxPrice: Math.round(cabin.airbnbInfo.pricePerNight * 1.5) // 50% higher than cabin price
      };

      const hotels = await this.hotelService.searchHotels(hotelSearchRequest);
      
      // Notify in chat about hotel alternatives
      if (hotels.length > 0) {
        await this.chatService.sendMessage(cabin.chatRoomId, {
          sender: 'Cabin Bot',
          content: `🏨 Hotel Alternatives Found:
          
Found ${hotels.length} hotel options in ${cabin.address.city}:

${hotels.slice(0, 3).map(hotel => 
  `• ${hotel.name} - $${hotel.pricePerNight}/night (${hotel.rating}/5 ⭐)`
).join('\n')}

${hotels.length > 3 ? `... and ${hotels.length - 3} more options` : ''}

💡 These hotels offer similar amenities and are in the same area as your cabin.`,
          type: 'system'
        });
      }

      return hotels;

    } catch (error) {
      console.error('Failed to search hotel alternatives:', error);
      throw error;
    }
  }

  // Get hotel booking recommendations based on cabin availability
  async getHotelRecommendations(
    location: string,
    checkIn: string,
    checkOut: string,
    guests: number = 2
  ) {
    try {
      const hotelSearchRequest = {
        location,
        checkIn,
        checkOut,
        guests,
        rooms: 1,
        providers: ['hoteltonight', 'booking', 'expedia'] // Search all providers
      };

      const hotels = await this.hotelService.searchHotels(hotelSearchRequest);
      
      // Sort by value (rating/price ratio)
      const sortedHotels = hotels.sort((a, b) => {
        const valueA = a.rating / a.pricePerNight;
        const valueB = b.rating / b.pricePerNight;
        return valueB - valueA;
      });

      return {
        recommendations: sortedHotels.slice(0, 5), // Top 5 recommendations
        totalFound: hotels.length,
        searchCriteria: hotelSearchRequest
      };

    } catch (error) {
      console.error('Failed to get hotel recommendations:', error);
      throw error;
    }
  }

  // Book hotel as alternative to cabin
  async bookHotelAlternative(
    cabinId: string,
    hotelId: string,
    roomTypeId: string,
    checkIn: string,
    checkOut: string,
    guests: number,
    guestInfo: any,
    paymentInfo: any
  ) {
    try {
      const cabin = this.cabins.get(cabinId);
      if (!cabin) {
        throw new Error('Cabin not found');
      }

      // Book hotel through hotel service
      const bookingRequest = {
        hotelId,
        roomTypeId,
        checkIn,
        checkOut,
        guests,
        rooms: 1,
        guestInfo,
        paymentInfo
      };

      const booking = await this.hotelService.bookHotel('hoteltonight', bookingRequest);
      
      // Notify in cabin chat about hotel booking
      await this.chatService.sendMessage(cabin.chatRoomId, {
        sender: 'Cabin Bot',
        content: `🏨 Hotel Alternative Booked:
        
Hotel booking confirmed as alternative to cabin stay.

Booking Details:
• Confirmation: ${booking.confirmationCode}
• Check-in: ${new Date(checkIn).toLocaleDateString()}
• Check-out: ${new Date(checkOut).toLocaleDateString()}
• Guests: ${guests}

✅ Hotel booking successful! You can still participate in cabin activities.`,
        type: 'system'
      });

      return booking;

    } catch (error) {
      console.error('Failed to book hotel alternative:', error);
      throw error;
    }
  }

  // Get hotel service instance for direct access
  getHotelService(): HotelService {
    return this.hotelService;
  }

  // Get calendar service instance for direct access
  getCalendarService(): AirbnbCalendarService {
    return this.calendarService;
  }

  // Schedule appointment for cabin demo
  async scheduleCabinAppointment(
    cabinId: string,
    appointmentType: 'demo' | 'tour' | 'meeting' | 'inspection',
    startTime: string,
    endTime: string,
    participants: number,
    userName: string,
    userEmail: string,
    specialRequests?: string
  ) {
    try {
      const cabin = this.cabins.get(cabinId);
      if (!cabin) {
        throw new Error('Cabin not found');
      }

      // Create appointment slot for the cabin
      const slotId = `cabin_slot_${cabinId}_${Date.now()}`;
      
      // Book the appointment through calendar service
      const booking = await this.calendarService.bookAppointment(
        slotId,
        'current-user',
        userName,
        userEmail,
        participants,
        specialRequests
      );

      // Notify in cabin chat
      await this.chatService.sendMessage(cabin.chatRoomId, {
        sender: 'Cabin Bot',
        content: `📅 New Appointment Scheduled:
        
Type: ${appointmentType}
Date: ${new Date(startTime).toLocaleDateString()}
Time: ${new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
Participants: ${participants}
Booked by: ${userName}

Confirmation: ${booking.confirmationCode}

✅ Appointment confirmed!`,
        type: 'system'
      });

      console.log(`Appointment scheduled for cabin ${cabinId}: ${booking.id}`);
      return booking;

    } catch (error) {
      console.error('Failed to schedule cabin appointment:', error);
      throw error;
    }
  }

  // Get available appointment slots for cabin
  async getCabinAppointmentSlots(
    cabinId: string,
    startDate: string,
    endDate: string,
    appointmentType?: 'demo' | 'tour' | 'meeting' | 'inspection'
  ) {
    try {
      const cabin = this.cabins.get(cabinId);
      if (!cabin) {
        throw new Error('Cabin not found');
      }

      const searchRequest = {
        listingId: cabin.airbnbInfo.listingId,
        startDate,
        endDate,
        appointmentType,
        duration: 120, // 2 hours default
        maxParticipants: cabin.address.maxGuests
      };

      const slots = await this.calendarService.searchAppointmentSlots(searchRequest);
      return slots;

    } catch (error) {
      console.error('Failed to get cabin appointment slots:', error);
      throw error;
    }
  }

  // Block cabin dates for maintenance
  async blockCabinDates(
    cabinId: string,
    startDate: string,
    endDate: string,
    reason: 'maintenance' | 'cleaning' | 'personal' | 'booking' | 'other',
    description?: string
  ) {
    try {
      const cabin = this.cabins.get(cabinId);
      if (!cabin) {
        throw new Error('Cabin not found');
      }

      const block = await this.calendarService.blockCalendarDates(
        cabin.airbnbInfo.listingId,
        startDate,
        endDate,
        reason,
        description,
        'cabin-service'
      );

      // Notify in cabin chat
      await this.chatService.sendMessage(cabin.chatRoomId, {
        sender: 'Cabin Bot',
        content: `🚫 Cabin Dates Blocked:
        
From: ${new Date(startDate).toLocaleDateString()}
To: ${new Date(endDate).toLocaleDateString()}
Reason: ${reason}
${description ? `Description: ${description}` : ''}

These dates are no longer available for appointments.`,
        type: 'system'
      });

      console.log(`Cabin dates blocked: ${cabinId} from ${startDate} to ${endDate}`);
      return block;

    } catch (error) {
      console.error('Failed to block cabin dates:', error);
      throw error;
    }
  }

  // Sync cabin calendar with Airbnb
  async syncCabinCalendar(cabinId: string) {
    try {
      const cabin = this.cabins.get(cabinId);
      if (!cabin) {
        throw new Error('Cabin not found');
      }

      const result = await this.calendarService.syncWithAirbnb(cabin.airbnbInfo.listingId);

      // Notify in cabin chat
      await this.chatService.sendMessage(cabin.chatRoomId, {
        sender: 'Cabin Bot',
        content: `🔄 Calendar Sync Complete:
        
Synced ${result.syncedDates} dates with Airbnb for listing ${cabin.airbnbInfo.listingId}.

✅ Calendar is now up to date!`,
        type: 'system'
      });

      console.log(`Calendar synced for cabin ${cabinId}: ${result.syncedDates} dates`);
      return result;

    } catch (error) {
      console.error('Failed to sync cabin calendar:', error);
      throw error;
    }
  }

  // Get cabin appointment history
  async getCabinAppointmentHistory(cabinId: string) {
    try {
      const cabin = this.cabins.get(cabinId);
      if (!cabin) {
        throw new Error('Cabin not found');
      }

      // Get all appointments for this cabin's listing
      const allBookings = await this.calendarService.getUserAppointments('current-user');
      const cabinBookings = allBookings.filter(booking => 
        booking.listingId === cabin.airbnbInfo.listingId
      );

      return cabinBookings.sort((a, b) => 
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );

    } catch (error) {
      console.error('Failed to get cabin appointment history:', error);
      throw error;
    }
  }

  // Cancel cabin appointment
  async cancelCabinAppointment(cabinId: string, bookingId: string) {
    try {
      const cabin = this.cabins.get(cabinId);
      if (!cabin) {
        throw new Error('Cabin not found');
      }

      const result = await this.calendarService.cancelAppointment(bookingId);

      if (result.success) {
        // Notify in cabin chat
        await this.chatService.sendMessage(cabin.chatRoomId, {
          sender: 'Cabin Bot',
          content: `❌ Appointment Cancelled:
        
Booking ID: ${bookingId}
Refund Amount: $${result.refundAmount}

The appointment has been cancelled and refunded.`,
          type: 'system'
        });
      }

      console.log(`Cabin appointment cancelled: ${bookingId}`);
      return result;

    } catch (error) {
      console.error('Failed to cancel cabin appointment:', error);
      throw error;
    }
  }
}

export default CabinService;

