// Review Service - Handles cabin reviews, priority queue, and auto ticket creation
import { PermissionService, UserRole } from './PermissionService';
import { ChatService } from './ChatService';

export interface CabinReview {
  id: string;
  cabinId: string;
  reviewerId: string;
  reviewerName: string;
  rating: number; // 1-5 stars
  title: string;
  content: string;
  categories: ReviewCategory[];
  createdAt: string;
  isVerified: boolean;
  helpfulVotes: number;
  reportCount: number;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
}

export interface ReviewCategory {
  id: string;
  name: string;
  rating: number; // 1-5 for this specific category
}

export interface ReviewTicket {
  id: string;
  reviewId: string;
  cabinId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedCsrId?: string;
  chatRoomId: string;
  reason: string;
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
}

export interface ReviewQueueItem {
  ticketId: string;
  priority: number; // Lower number = higher priority
  createdAt: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class ReviewService {
  private static instance: ReviewService;
  private reviews: Map<string, CabinReview> = new Map();
  private tickets: Map<string, ReviewTicket> = new Map();
  private priorityQueue: ReviewQueueItem[] = [];
  private chatService: ChatService;
  private permissionService: PermissionService;

  // Review categories
  private readonly REVIEW_CATEGORIES = [
    { id: 'cleanliness', name: 'Cleanliness' },
    { id: 'communication', name: 'Communication' },
    { id: 'location', name: 'Location' },
    { id: 'value', name: 'Value for Money' },
    { id: 'amenities', name: 'Amenities' },
    { id: 'checkin', name: 'Check-in Process' },
    { id: 'safety', name: 'Safety' },
    { id: 'items', name: 'Item Quality' }
  ];

  // Priority scoring system
  private readonly PRIORITY_SCORES = {
    low: 4,
    medium: 3,
    high: 2,
    critical: 1
  };

  static getInstance(): ReviewService {
    if (!ReviewService.instance) {
      ReviewService.instance = new ReviewService();
    }
    return ReviewService.instance;
  }

  constructor() {
    this.chatService = ChatService.getInstance();
    this.permissionService = PermissionService.getInstance();
  }

  // Create a new review
  async createReview(
    cabinId: string,
    reviewerId: string,
    reviewerName: string,
    rating: number,
    title: string,
    content: string,
    categoryRatings: { [categoryId: string]: number }
  ): Promise<CabinReview> {
    try {
      // Validate rating
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      // Check if user can create reviews
      const canReview = await this.permissionService.hasPermission(reviewerId, 'create_reviews' as any);
      if (!canReview) {
        throw new Error('Insufficient permissions to create reviews');
      }

      // Create categories
      const categories: ReviewCategory[] = Object.entries(categoryRatings).map(([categoryId, rating]) => ({
        id: categoryId,
        name: this.REVIEW_CATEGORIES.find(c => c.id === categoryId)?.name || categoryId,
        rating: Math.max(1, Math.min(5, rating))
      }));

      const review: CabinReview = {
        id: `review_${Date.now()}`,
        cabinId,
        reviewerId,
        reviewerName,
        rating,
        title,
        content,
        categories,
        createdAt: new Date().toISOString(),
        isVerified: false,
        helpfulVotes: 0,
        reportCount: 0,
        status: 'pending'
      };

      // Store review
      this.reviews.set(review.id, review);

      // Check if review triggers auto ticket creation
      await this.checkForAutoTicketCreation(review);

      console.log(`Review created: ${review.id}`);
      return review;

    } catch (error) {
      console.error('Failed to create review:', error);
      throw error;
    }
  }

  // Check if review should trigger auto ticket creation
  private async checkForAutoTicketCreation(review: CabinReview): Promise<void> {
    const shouldCreateTicket = this.shouldCreateTicket(review);
    
    if (shouldCreateTicket) {
      await this.createAutoTicket(review);
    }
  }

  // Determine if review should create a ticket
  private shouldCreateTicket(review: CabinReview): boolean {
    // Create ticket for low ratings
    if (review.rating <= 2) {
      return true;
    }

    // Create ticket for specific negative keywords
    const negativeKeywords = [
      'terrible', 'awful', 'horrible', 'disgusting', 'unsafe',
      'broken', 'dirty', 'stolen', 'missing', 'damaged',
      'scam', 'fraud', 'fake', 'misleading'
    ];

    const contentLower = review.content.toLowerCase();
    const titleLower = review.title.toLowerCase();
    
    const hasNegativeKeywords = negativeKeywords.some(keyword => 
      contentLower.includes(keyword) || titleLower.includes(keyword)
    );

    if (hasNegativeKeywords) {
      return true;
    }

    // Create ticket for multiple low category ratings
    const lowCategoryRatings = review.categories.filter(cat => cat.rating <= 2).length;
    if (lowCategoryRatings >= 3) {
      return true;
    }

    return false;
  }

  // Create auto ticket for bad review
  private async createAutoTicket(review: CabinReview): Promise<ReviewTicket> {
    try {
      // Determine priority based on review severity
      let priority: 'low' | 'medium' | 'high' | 'critical' = 'low';
      
      if (review.rating === 1) {
        priority = 'critical';
      } else if (review.rating === 2) {
        priority = 'high';
      } else if (review.categories.some(cat => cat.rating <= 2)) {
        priority = 'medium';
      }

      // Create chat room for CSR
      const chatRoom = await this.chatService.createChannel(
        `Review Ticket - ${review.id}`,
        [] // Will be populated when CSR is assigned
      );

      const ticket: ReviewTicket = {
        id: `ticket_${Date.now()}`,
        reviewId: review.id,
        cabinId: review.cabinId,
        priority,
        status: 'open',
        chatRoomId: chatRoom.id,
        reason: this.generateTicketReason(review),
        createdAt: new Date().toISOString()
      };

      // Store ticket
      this.tickets.set(ticket.id, ticket);

      // Add to priority queue
      this.addToPriorityQueue(ticket);

      // Send notification to CSR team
      await this.notifyCsrTeam(ticket);

      console.log(`Auto ticket created: ${ticket.id} for review: ${review.id}`);
      return ticket;

    } catch (error) {
      console.error('Failed to create auto ticket:', error);
      throw error;
    }
  }

  // Generate ticket reason based on review
  private generateTicketReason(review: CabinReview): string {
    if (review.rating <= 2) {
      return `Low rating (${review.rating}/5): ${review.title}`;
    }

    const lowCategories = review.categories.filter(cat => cat.rating <= 2);
    if (lowCategories.length > 0) {
      return `Poor category ratings: ${lowCategories.map(cat => cat.name).join(', ')}`;
    }

    return `Flagged content: ${review.title}`;
  }

  // Add ticket to priority queue
  private addToPriorityQueue(ticket: ReviewTicket): void {
    const queueItem: ReviewQueueItem = {
      ticketId: ticket.id,
      priority: this.PRIORITY_SCORES[ticket.priority],
      createdAt: ticket.createdAt,
      category: 'review',
      severity: ticket.priority
    };

    this.priorityQueue.push(queueItem);
    this.priorityQueue.sort((a, b) => a.priority - b.priority);

    console.log(`Ticket ${ticket.id} added to priority queue`);
  }

  // Notify CSR team of new ticket
  private async notifyCsrTeam(ticket: ReviewTicket): Promise<void> {
    try {
      const csrUsers = this.permissionService.getUsersByRole(UserRole.CSR);
      
      for (const csr of csrUsers) {
        await this.chatService.sendMessage(ticket.chatRoomId, {
          sender: 'System',
          content: `🚨 New Review Ticket Created

Ticket ID: ${ticket.id}
Priority: ${ticket.priority.toUpperCase()}
Reason: ${ticket.reason}
Review Rating: ${this.reviews.get(ticket.reviewId)?.rating}/5

Please assign this ticket to an available CSR.`,
          type: 'system'
        });
      }
    } catch (error) {
      console.error('Failed to notify CSR team:', error);
    }
  }

  // Assign ticket to CSR
  async assignTicket(ticketId: string, csrId: string): Promise<void> {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Check if CSR has permission
    const canManageTickets = await this.permissionService.hasPermission(csrId, 'manage_tickets' as any);
    if (!canManageTickets) {
      throw new Error('Insufficient permissions to manage tickets');
    }

    // Update ticket
    ticket.assignedCsrId = csrId;
    ticket.status = 'in_progress';
    this.tickets.set(ticketId, ticket);

    // Add CSR to chat room
    await this.chatService.addUserToChannel(ticket.chatRoomId, csrId);

    // Send assignment notification
    await this.chatService.sendMessage(ticket.chatRoomId, {
      sender: 'System',
      content: `Ticket assigned to CSR: ${csrId}`,
      type: 'system'
    });

    console.log(`Ticket ${ticketId} assigned to CSR ${csrId}`);
  }

  // Get priority queue for CSR dashboard
  getPriorityQueue(): ReviewQueueItem[] {
    return [...this.priorityQueue];
  }

  // Get tickets assigned to specific CSR
  getTicketsForCsr(csrId: string): ReviewTicket[] {
    return Array.from(this.tickets.values()).filter(ticket => ticket.assignedCsrId === csrId);
  }

  // Resolve ticket
  async resolveTicket(ticketId: string, csrId: string, resolution: string): Promise<void> {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Check if CSR is assigned to this ticket
    if (ticket.assignedCsrId !== csrId) {
      throw new Error('Ticket not assigned to this CSR');
    }

    // Update ticket
    ticket.status = 'resolved';
    ticket.resolvedAt = new Date().toISOString();
    ticket.resolution = resolution;
    this.tickets.set(ticketId, ticket);

    // Remove from priority queue
    this.priorityQueue = this.priorityQueue.filter(item => item.ticketId !== ticketId);

    // Send resolution notification
    await this.chatService.sendMessage(ticket.chatRoomId, {
      sender: 'System',
      content: `✅ Ticket Resolved

Resolution: ${resolution}
Resolved by: ${csrId}
Resolved at: ${new Date().toLocaleString()}`,
      type: 'system'
    });

    console.log(`Ticket ${ticketId} resolved by CSR ${csrId}`);
  }

  // Check for consistent bad reviews and ban user
  async checkForServiceBan(reviewerId: string): Promise<void> {
    const userReviews = Array.from(this.reviews.values())
      .filter(review => review.reviewerId === reviewerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Check last 5 reviews
    const recentReviews = userReviews.slice(0, 5);
    
    if (recentReviews.length >= 3) {
      const lowRatings = recentReviews.filter(review => review.rating <= 2).length;
      
      // If 3 or more of last 5 reviews are low ratings, ban from service creation
      if (lowRatings >= 3) {
        await this.permissionService.banFromServiceCreation(reviewerId, 10);
        
        console.log(`User ${reviewerId} banned from service creation due to consistent bad reviews`);
        
        // Create notification ticket
        await this.createBanNotificationTicket(reviewerId, lowRatings);
      }
    }
  }

  // Create notification ticket for service ban
  private async createBanNotificationTicket(userId: string, lowRatingCount: number): Promise<void> {
    const ticket: ReviewTicket = {
      id: `ban_ticket_${Date.now()}`,
      reviewId: '', // No specific review
      cabinId: '', // No specific cabin
      priority: 'high',
      status: 'open',
      chatRoomId: `ban_chat_${Date.now()}`,
      reason: `User ${userId} banned from service creation due to ${lowRatingCount} low ratings in recent reviews`,
      createdAt: new Date().toISOString()
    };

    this.tickets.set(ticket.id, ticket);
    this.addToPriorityQueue(ticket);

    console.log(`Ban notification ticket created: ${ticket.id}`);
  }

  // Get review statistics
  getReviewStats(cabinId: string): {
    totalReviews: number;
    averageRating: number;
    ratingDistribution: { [rating: number]: number };
    categoryAverages: { [categoryId: string]: number };
  } {
    const cabinReviews = Array.from(this.reviews.values())
      .filter(review => review.cabinId === cabinId && review.status === 'approved');

    const totalReviews = cabinReviews.length;
    const averageRating = totalReviews > 0 
      ? cabinReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;

    const ratingDistribution: { [rating: number]: number } = {};
    for (let i = 1; i <= 5; i++) {
      ratingDistribution[i] = cabinReviews.filter(review => review.rating === i).length;
    }

    const categoryAverages: { [categoryId: string]: number } = {};
    this.REVIEW_CATEGORIES.forEach(category => {
      const categoryReviews = cabinReviews.flatMap(review => 
        review.categories.filter(cat => cat.id === category.id)
      );
      
      if (categoryReviews.length > 0) {
        categoryAverages[category.id] = 
          categoryReviews.reduce((sum, cat) => sum + cat.rating, 0) / categoryReviews.length;
      }
    });

    return {
      totalReviews,
      averageRating,
      ratingDistribution,
      categoryAverages
    };
  }

  // Get all reviews for a cabin
  getCabinReviews(cabinId: string): CabinReview[] {
    return Array.from(this.reviews.values())
      .filter(review => review.cabinId === cabinId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Get all tickets
  getAllTickets(): ReviewTicket[] {
    return Array.from(this.tickets.values());
  }
}

export default ReviewService;
