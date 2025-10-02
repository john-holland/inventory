// Charity Lending Service
// Handles charity lending through drop shipping APIs to avoid tax complications
// and ensure shelters don't incur shipping costs on donations

export interface CharityProfile {
  id: string;
  name: string;
  type: 'shelter' | 'food_bank' | 'clothing_bank' | 'medical_clinic' | 'education_center';
  address: string;
  contactPerson: string;
  email: string;
  phone: string;
  verified: boolean;
  socialWorkerId: string;
  maxItemValue: number;
  preferredCategories: string[];
  specialNeeds: string[];
  createdAt: Date;
  lastActivity: Date;
}

export interface SocialWorkerProfile {
  id: string;
  name: string;
  organization: string;
  licenseNumber: string;
  email: string;
  phone: string;
  verified: boolean;
  charities: string[]; // Charity IDs they curate
  specialties: string[];
  maxCuratedItems: number;
  createdAt: Date;
}

export interface DropShippingItem {
  id: string;
  title: string;
  description: string;
  platform: 'amazon' | 'ebay' | 'walmart';
  platformItemId: string;
  category: string;
  price: number;
  shippingCost: number;
  taxRate: number;
  estimatedTax: number;
  totalCost: number;
  availability: number;
  condition: 'new' | 'used_like_new' | 'used_good' | 'used_acceptable';
  images: string[];
  sellerRating: number;
  dropShippingExclusive: boolean; // Charity items only
  charityId?: string; // If this item is for a specific charity
  socialWorkerId?: string; // Curated by which social worker
  urgency: 'low' | 'medium' | 'high' | 'critical';
  specialNotes: string[];
  createdAt: Date;
  expiresAt?: Date; // For time-sensitive needs
}

export interface CharityLendingRequest {
  id: string;
  charityId: string;
  itemId: string;
  requestedQuantity: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  purpose: string;
  expectedReturnDate?: Date;
  specialInstructions: string[];
  status: 'pending' | 'approved' | 'shipped' | 'delivered' | 'returned' | 'cancelled';
  approvedBy?: string;
  approvedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  returnedAt?: Date;
  createdAt: Date;
}

export interface DonorProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  verified: boolean;
  totalDonations: number;
  totalValue: number;
  preferredCharities: string[];
  taxReceipts: boolean;
  anonymous: boolean;
  createdAt: Date;
  lastDonation: Date;
}

export class CharityLendingService {
  private charities: Map<string, CharityProfile> = new Map();
  private socialWorkers: Map<string, SocialWorkerProfile> = new Map();
  private dropShippingItems: Map<string, DropShippingItem> = new Map();
  private lendingRequests: Map<string, CharityLendingRequest> = new Map();
  private donors: Map<string, DonorProfile> = new Map();

  constructor() {
    console.log('🏥 Charity Lending Service initialized');
  }

  // Social Worker Management
  async registerSocialWorker(profile: Omit<SocialWorkerProfile, 'id' | 'createdAt'>): Promise<string> {
    const id = `sw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const socialWorker: SocialWorkerProfile = {
      ...profile,
      id,
      createdAt: new Date()
    };

    this.socialWorkers.set(id, socialWorker);
    console.log(`👨‍⚕️ Social worker registered: ${profile.name} (${profile.organization})`);
    return id;
  }

  async verifySocialWorker(socialWorkerId: string): Promise<boolean> {
    const socialWorker = this.socialWorkers.get(socialWorkerId);
    if (!socialWorker) return false;

    // In practice, you'd verify license numbers, contact organizations, etc.
    socialWorker.verified = true;
    this.socialWorkers.set(socialWorkerId, socialWorker);
    
    console.log(`✅ Social worker verified: ${socialWorker.name}`);
    return true;
  }

  // Charity Management
  async registerCharity(profile: Omit<CharityProfile, 'id' | 'createdAt' | 'lastActivity'>): Promise<string> {
    const id = `charity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const charity: CharityProfile = {
      ...profile,
      id,
      createdAt: new Date(),
      lastActivity: new Date()
    };

    this.charities.set(id, charity);
    
    // Add to social worker's charity list
    const socialWorker = this.socialWorkers.get(profile.socialWorkerId);
    if (socialWorker) {
      socialWorker.charities.push(id);
      this.socialWorkers.set(profile.socialWorkerId, socialWorker);
    }

    console.log(`🏠 Charity registered: ${profile.name} (${profile.type})`);
    return id;
  }

  async verifyCharity(charityId: string): Promise<boolean> {
    const charity = this.charities.get(charityId);
    if (!charity) return false;

    // In practice, you'd verify with IRS, state registries, etc.
    charity.verified = true;
    this.charities.set(charityId, charity);
    
    console.log(`✅ Charity verified: ${charity.name}`);
    return true;
  }

  // Drop Shipping Item Management
  async addDropShippingItem(
    item: Omit<DropShippingItem, 'id' | 'createdAt'>,
    socialWorkerId: string
  ): Promise<string> {
    // Verify social worker can add items
    const socialWorker = this.socialWorkers.get(socialWorkerId);
    if (!socialWorker || !socialWorker.verified) {
      throw new Error('Unauthorized: Social worker not verified');
    }

    const id = `ds_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const dropShippingItem: DropShippingItem = {
      ...item,
      id,
      dropShippingExclusive: true, // Charity items only
      socialWorkerId,
      createdAt: new Date()
    };

    this.dropShippingItems.set(id, dropShippingItem);
    
    console.log(`📦 Drop shipping item added: ${item.title} (${item.platform})`);
    return id;
  }

  async getDropShippingItems(filters?: {
    category?: string;
    maxPrice?: number;
    urgency?: string;
    charityId?: string;
    platform?: string;
  }): Promise<DropShippingItem[]> {
    let items = Array.from(this.dropShippingItems.values());

    if (filters) {
      if (filters.category) {
        items = items.filter(item => item.category === filters.category);
      }
      if (filters.maxPrice) {
        items = items.filter(item => item.totalCost <= filters.maxPrice!);
      }
      if (filters.urgency) {
        items = items.filter(item => item.urgency === filters.urgency);
      }
      if (filters.charityId) {
        items = items.filter(item => item.charityId === filters.charityId);
      }
      if (filters.platform) {
        items = items.filter(item => item.platform === filters.platform);
      }
    }

    return items.sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });
  }

  // Charity Lending Request Management
  async createLendingRequest(
    charityId: string,
    itemId: string,
    request: Omit<CharityLendingRequest, 'id' | 'charityId' | 'itemId' | 'status' | 'createdAt'>
  ): Promise<string> {
    // Verify charity exists and is verified
    const charity = this.charities.get(charityId);
    if (!charity || !charity.verified) {
      throw new Error('Unauthorized: Charity not verified');
    }

    // Verify item exists and is drop shipping exclusive
    const item = this.dropShippingItems.get(itemId);
    if (!item || !item.dropShippingExclusive) {
      throw new Error('Invalid item: Not available for charity lending');
    }

    const id = `lending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const lendingRequest: CharityLendingRequest = {
      ...request,
      id,
      charityId,
      itemId,
      status: 'pending',
      createdAt: new Date()
    };

    this.lendingRequests.set(id, lendingRequest);
    
    console.log(`📋 Lending request created: ${charity.name} → ${item.title}`);
    return id;
  }

  async approveLendingRequest(
    requestId: string,
    approvedBy: string
  ): Promise<boolean> {
    const request = this.lendingRequests.get(requestId);
    if (!request) return false;

    request.status = 'approved';
    request.approvedBy = approvedBy;
    request.approvedAt = new Date();

    this.lendingRequests.set(requestId, request);
    
    console.log(`✅ Lending request approved: ${requestId}`);
    return true;
  }

  async shipLendingRequest(requestId: string): Promise<boolean> {
    const request = this.lendingRequests.get(requestId);
    if (!request || request.status !== 'approved') return false;

    request.status = 'shipped';
    request.shippedAt = new Date();

    this.lendingRequests.set(requestId, request);
    
    console.log(`🚚 Lending request shipped: ${requestId}`);
    return true;
  }

  async deliverLendingRequest(requestId: string): Promise<boolean> {
    const request = this.lendingRequests.get(requestId);
    if (!request || request.status !== 'shipped') return false;

    request.status = 'delivered';
    request.deliveredAt = new Date();

    this.lendingRequests.set(requestId, request);
    
    console.log(`📦 Lending request delivered: ${requestId}`);
    return true;
  }

  // Donor Management
  async registerDonor(profile: Omit<DonorProfile, 'id' | 'createdAt' | 'lastDonation'>): Promise<string> {
    const id = `donor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const donor: DonorProfile = {
      ...profile,
      id,
      createdAt: new Date(),
      lastDonation: new Date()
    };

    this.donors.set(id, donor);
    
    console.log(`💝 Donor registered: ${profile.name}`);
    return id;
  }

  async processDonation(
    donorId: string,
    itemId: string,
    quantity: number,
    anonymous: boolean = false
  ): Promise<string> {
    const donor = this.donors.get(donorId);
    const item = this.dropShippingItems.get(itemId);
    
    if (!donor || !item) {
      throw new Error('Invalid donor or item');
    }

    // Create lending request for the donation
    const charityId = item.charityId || this.getDefaultCharityId();
    const requestId = await this.createLendingRequest(charityId, itemId, {
      requestedQuantity: quantity,
      urgency: item.urgency,
      purpose: `Donation from ${anonymous ? 'Anonymous' : donor.name}`,
      specialInstructions: ['No return shipping costs for charity']
    });

    // Update donor stats
    donor.totalDonations += quantity;
    donor.totalValue += item.totalCost * quantity;
    donor.lastDonation = new Date();
    this.donors.set(donorId, donor);

    // Auto-approve charity donations
    await this.approveLendingRequest(requestId, 'system');

    console.log(`💝 Donation processed: ${quantity}x ${item.title} from ${anonymous ? 'Anonymous' : donor.name}`);
    return requestId;
  }

  // Utility Methods
  private getDefaultCharityId(): string {
    // Return the first verified charity, or create a default one
    const verifiedCharities = Array.from(this.charities.values()).filter(c => c.verified);
    return verifiedCharities[0]?.id || 'default_charity';
  }

  // Reporting and Analytics
  async getCharityStats(charityId: string): Promise<any> {
    const charity = this.charities.get(charityId);
    if (!charity) return null;

    const requests = Array.from(this.lendingRequests.values())
      .filter(r => r.charityId === charityId);

    return {
      charity,
      totalRequests: requests.length,
      pendingRequests: requests.filter(r => r.status === 'pending').length,
      approvedRequests: requests.filter(r => r.status === 'approved').length,
      shippedRequests: requests.filter(r => r.status === 'shipped').length,
      deliveredRequests: requests.filter(r => r.status === 'delivered').length,
      totalValue: requests.reduce((sum, r) => {
        const item = this.dropShippingItems.get(r.itemId);
        return sum + (item?.totalCost || 0) * r.requestedQuantity;
      }, 0)
    };
  }

  async getSocialWorkerStats(socialWorkerId: string): Promise<any> {
    const socialWorker = this.socialWorkers.get(socialWorkerId);
    if (!socialWorker) return null;

    const curatedItems = Array.from(this.dropShippingItems.values())
      .filter(item => item.socialWorkerId === socialWorkerId);

    const charityRequests = Array.from(this.lendingRequests.values())
      .filter(r => socialWorker.charities.includes(r.charityId));

    return {
      socialWorker,
      curatedItems: curatedItems.length,
      charityRequests: charityRequests.length,
      totalValue: curatedItems.reduce((sum, item) => sum + item.totalCost, 0)
    };
  }

  // Search and Discovery
  async searchCharities(query: string): Promise<CharityProfile[]> {
    const charities = Array.from(this.charities.values());
    return charities.filter(charity => 
      charity.name.toLowerCase().includes(query.toLowerCase()) ||
      charity.type.toLowerCase().includes(query.toLowerCase())
    );
  }

  async getCharitiesByType(type: string): Promise<CharityProfile[]> {
    return Array.from(this.charities.values())
      .filter(charity => charity.type === type && charity.verified);
  }

  async getUrgentItems(): Promise<DropShippingItem[]> {
    return Array.from(this.dropShippingItems.values())
      .filter(item => item.urgency === 'critical' || item.urgency === 'high')
      .sort((a, b) => {
        const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      });
  }

  // Reset for testing
  reset(): void {
    this.charities.clear();
    this.socialWorkers.clear();
    this.dropShippingItems.clear();
    this.lendingRequests.clear();
    this.donors.clear();
    console.log('🔄 Charity Lending Service reset');
  }
}

// Export singleton instance
export const charityLendingService = new CharityLendingService(); 