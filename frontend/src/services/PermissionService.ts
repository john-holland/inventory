// Permission Service - Handles role-based access control and permissions
import { CabinService } from './CabinService';

export enum UserRole {
  // Core Platform Roles
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  SUPPORT = 'support',
  CSR = 'csr', // Customer Service Representative
  
  // User Tiers
  BASIC_USER = 'basic_user',
  PREMIUM_USER = 'premium_user',
  INSTITUTIONAL_USER = 'institutional_user',
  
  // Cabin-Specific Roles
  CABIN_HOST = 'cabin_host',
  CABIN_PARTICIPANT = 'cabin_participant',
  CABIN_MODERATOR = 'cabin_moderator'
}

export enum CabinPermission {
  // Cabin Management
  CREATE_CABIN = 'create_cabin',
  EDIT_CABIN = 'edit_cabin',
  DELETE_CABIN = 'delete_cabin',
  VIEW_CABIN_DETAILS = 'view_cabin_details',
  
  // Participant Management
  ADD_PARTICIPANTS = 'add_participants',
  REMOVE_PARTICIPANTS = 'remove_participants',
  INVITE_USERS = 'invite_users',
  
  // Item Management
  TAKE_ITEMS = 'take_items',
  RETURN_ITEMS = 'return_items',
  MANAGE_ITEM_HOLDS = 'manage_item_holds',
  
  // Financial Management
  VIEW_FINANCIAL_DATA = 'view_financial_data',
  PROCESS_REFUNDS = 'process_refunds',
  MANAGE_HOLDS = 'manage_holds',
  
  // Administrative
  MODERATE_CABIN = 'moderate_cabin',
  SUSPEND_CABIN = 'suspend_cabin',
  VIEW_AUDIT_LOGS = 'view_audit_logs',
  
  // Review System
  CREATE_REVIEWS = 'create_reviews',
  MODERATE_REVIEWS = 'moderate_reviews',
  MANAGE_TICKETS = 'manage_tickets'
}

export interface UserWithPermissions {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: CabinPermission[];
  reputation: number;
  totalTransactions: number;
  isSuspended: boolean;
  suspensionEndTime?: string;
  serviceBanEndTime?: string;
  maxHoldAmount: number;
  maxConcurrentTakeouts: number;
}

export interface CabinAccessRequirements {
  createCabin: {
    minReputation: number;
    minTransactions: number;
    premiumTier?: string;
  };
  takeItems: {
    minReputation: number;
    maxConcurrentTakeouts: number;
    depositMultiplier: number;
  };
  moderateCabin: {
    minReputation: number;
    role: UserRole;
    trainingCompleted: boolean;
  };
}

const SERVICE_CREATION_BAN_DURATION = 10;
export class PermissionService {
  private static instance: PermissionService;
  private users: Map<string, UserWithPermissions> = new Map();
  private accessRequirements: CabinAccessRequirements;

  static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }

  constructor() {
    this.initializeAccessRequirements();
    this.initializeDefaultUsers();
  }

  private initializeAccessRequirements(): void {
    this.accessRequirements = {
      createCabin: {
        minReputation: 50,
        minTransactions: 10,
        premiumTier: 'active_user'
      },
      takeItems: {
        minReputation: 25,
        maxConcurrentTakeouts: 3,
        depositMultiplier: 1.5
      },
      moderateCabin: {
        minReputation: 100,
        role: UserRole.MODERATOR,
        trainingCompleted: true
      }
    };
  }

  private initializeDefaultUsers(): void {
    // Admin user
    this.users.set('admin_1', {
      id: 'admin_1',
      name: 'System Admin',
      email: 'admin@inventory.com',
      role: UserRole.ADMIN,
      permissions: Object.values(CabinPermission),
      reputation: 1000,
      totalTransactions: 1000,
      isSuspended: false,
      maxHoldAmount: 10000,
      maxConcurrentTakeouts: 10
    });

    // CSR user
    this.users.set('csr_1', {
      id: 'csr_1',
      name: 'Customer Service Rep',
      email: 'csr@inventory.com',
      role: UserRole.CSR,
      permissions: [
        CabinPermission.VIEW_CABIN_DETAILS,
        CabinPermission.MANAGE_TICKETS,
        CabinPermission.VIEW_FINANCIAL_DATA,
        CabinPermission.PROCESS_REFUNDS,
        CabinPermission.MANAGE_HOLDS
      ],
      reputation: 500,
      totalTransactions: 500,
      isSuspended: false,
      maxHoldAmount: 5000,
      maxConcurrentTakeouts: 5
    });

    // Premium user
    this.users.set('user_1', {
      id: 'user_1',
      name: 'John Doe',
      email: 'john@example.com',
      role: UserRole.PREMIUM_USER,
      permissions: [
        CabinPermission.CREATE_CABIN,
        CabinPermission.EDIT_CABIN,
        CabinPermission.VIEW_CABIN_DETAILS,
        CabinPermission.ADD_PARTICIPANTS,
        CabinPermission.INVITE_USERS,
        CabinPermission.TAKE_ITEMS,
        CabinPermission.RETURN_ITEMS,
        CabinPermission.CREATE_REVIEWS
      ],
      reputation: 75,
      totalTransactions: 25,
      isSuspended: false,
      maxHoldAmount: 2000,
      maxConcurrentTakeouts: 3
    });
  }

  // Get user with permissions
  async getUserWithPermissions(userId: string): Promise<UserWithPermissions | null> {
    return this.users.get(userId) || null;
  }

  // Check if user has specific permission
  async hasPermission(userId: string, permission: CabinPermission): Promise<boolean> {
    const user = await this.getUserWithPermissions(userId);
    if (!user || user.isSuspended) {
      return false;
    }

    // Check if user is suspended
    if (user.suspensionEndTime && new Date(user.suspensionEndTime) > new Date()) {
      return false;
    }

    return user.permissions.includes(permission) || user.role === UserRole.ADMIN;
  }

  // Check cabin creation permissions
  async canCreateCabin(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    const user = await this.getUserWithPermissions(userId);
    if (!user) {
      return { allowed: false, reason: 'User not found' };
    }

    // Check if user is banned from service creation
    if (user.serviceBanEndTime && new Date(user.serviceBanEndTime) > new Date()) {
      return { 
        allowed: false, 
        reason: `Service creation banned until ${new Date(user.serviceBanEndTime).toLocaleDateString()}` 
      };
    }

    // Check basic permission
    if (!await this.hasPermission(userId, CabinPermission.CREATE_CABIN)) {
      return { allowed: false, reason: 'Insufficient permissions' };
    }

    // Check reputation and transaction requirements
    const requirements = this.accessRequirements.createCabin;
    if (user.reputation < requirements.minReputation) {
      return { 
        allowed: false, 
        reason: `Minimum reputation required: ${requirements.minReputation} (current: ${user.reputation})` 
      };
    }

    if (user.totalTransactions < requirements.minTransactions) {
      return { 
        allowed: false, 
        reason: `Minimum transactions required: ${requirements.minTransactions} (current: ${user.totalTransactions})` 
      };
    }

    return { allowed: true };
  }

  // Check item takeout permissions
  async canTakeItem(userId: string, cabinId: string, itemId: string): Promise<{ allowed: boolean; reason?: string }> {
    const user = await this.getUserWithPermissions(userId);
    if (!user) {
      return { allowed: false, reason: 'User not found' };
    }

    // Check if user is suspended
    if (user.isSuspended) {
      return { allowed: false, reason: 'User account is suspended' };
    }

    // Check basic permission
    if (!await this.hasPermission(userId, CabinPermission.TAKE_ITEMS)) {
      return { allowed: false, reason: 'Insufficient permissions to take items' };
    }

    // Check reputation requirements
    const requirements = this.accessRequirements.takeItems;
    if (user.reputation < requirements.minReputation) {
      return { 
        allowed: false, 
        reason: `Minimum reputation required: ${requirements.minReputation} (current: ${user.reputation})` 
      };
    }

    // Check concurrent takeout limit
    const cabinService = CabinService.getInstance();
    const activeTakeouts = cabinService.getActiveTakeouts(cabinId).filter(t => t.userId === userId);
    if (activeTakeouts.length >= user.maxConcurrentTakeouts) {
      return { 
        allowed: false, 
        reason: `Maximum concurrent takeouts exceeded: ${user.maxConcurrentTakeouts}` 
      };
    }

    return { allowed: true };
  }

  
  // Ban user from service creation
  async banFromServiceCreation(userId: string, days: number = SERVICE_CREATION_BAN_DURATION): Promise<void> {
    const user = await this.getUserWithPermissions(userId);
    if (user) {
      const banEndTime = new Date();
      banEndTime.setDate(banEndTime.getDate() + days);
      user.serviceBanEndTime = banEndTime.toISOString();
      this.users.set(userId, user);
      
      console.log(`User ${userId} banned from service creation until ${banEndTime.toLocaleDateString()}`);
    }
  }

  // Check if user can moderate cabin
  async canModerateCabin(userId: string): Promise<boolean> {
    const user = await this.getUserWithPermissions(userId);
    if (!user) return false;

    const requirements = this.accessRequirements.moderateCabin;
    return user.reputation >= requirements.minReputation && 
           (user.role === requirements.role || user.role === UserRole.ADMIN);
  }

  // Update user reputation
  async updateUserReputation(userId: string, reputationChange: number): Promise<void> {
    const user = await this.getUserWithPermissions(userId);
    if (user) {
      user.reputation = Math.max(0, user.reputation + reputationChange);
      this.users.set(userId, user);
    }
  }

  // Update user transaction count
  async updateUserTransactions(userId: string, transactionCount: number): Promise<void> {
    const user = await this.getUserWithPermissions(userId);
    if (user) {
      user.totalTransactions = transactionCount;
      this.users.set(userId, user);
    }
  }

  // Get all users (for admin purposes)
  getAllUsers(): UserWithPermissions[] {
    return Array.from(this.users.values());
  }

  // Get users by role
  getUsersByRole(role: UserRole): UserWithPermissions[] {
    return Array.from(this.users.values()).filter(user => user.role === role);
  }
}

export default PermissionService;
