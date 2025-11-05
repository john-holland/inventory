/**
 * HR Help Service
 * Smart HR employee selection with calendar integration and 1:1 chat creation
 */

import { ChatService, ChatRoom } from './ChatService';
import SlackIntegrationService from './SlackIntegrationService';

export interface HREmployee {
  id: string;
  name: string;
  email: string;
  skills: string[];
  availability: AvailabilitySlot[];
  currentLoad: number; // Number of active help sessions
  maxLoad: number; // Maximum concurrent sessions
  rating: number; // 0-5 rating
}

export interface AvailabilitySlot {
  start: string; // ISO timestamp
  end: string; // ISO timestamp
  status: 'available' | 'busy' | 'away';
}

export interface HelpRequest {
  userId: string;
  context: string;
  skillsRequired: string[];
  urgency: 'low' | 'medium' | 'high';
  preferredTime?: string;
}

export interface HRHelpSession {
  id: string;
  requesterId: string;
  hrEmployeeId: string;
  chatRoomId: string;
  context: string;
  startTime: string;
  endTime?: string;
  status: 'active' | 'completed' | 'cancelled';
  rating?: number;
}

export class HRHelpService {
  private static instance: HRHelpService;
  private chatService: ChatService;
  private slackService: SlackIntegrationService;
  private hrEmployees: Map<string, HREmployee> = new Map();
  private activeSessions: Map<string, HRHelpSession> = new Map();

  static getInstance(): HRHelpService {
    if (!HRHelpService.instance) {
      HRHelpService.instance = new HRHelpService();
    }
    return HRHelpService.instance;
  }

  constructor() {
    this.chatService = ChatService.getInstance();
    this.slackService = SlackIntegrationService.getInstance();
    this.initializeMockHREmployees();
    console.log('🆘 HR Help Service initialized');
  }

  /**
   * Initialize mock HR employees (in production, load from database)
   */
  private initializeMockHREmployees() {
    const mockEmployees: HREmployee[] = [
      {
        id: 'hr_001',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@company.com',
        skills: ['onboarding', 'benefits', 'payroll'],
        availability: this.generateMockAvailability(),
        currentLoad: 2,
        maxLoad: 5,
        rating: 4.8
      },
      {
        id: 'hr_002',
        name: 'Michael Chen',
        email: 'michael.chen@company.com',
        skills: ['compliance', 'legal', 'employee_relations'],
        availability: this.generateMockAvailability(),
        currentLoad: 1,
        maxLoad: 4,
        rating: 4.9
      },
      {
        id: 'hr_003',
        name: 'Emily Rodriguez',
        email: 'emily.rodriguez@company.com',
        skills: ['training', 'development', 'performance'],
        availability: this.generateMockAvailability(),
        currentLoad: 0,
        maxLoad: 6,
        rating: 4.7
      }
    ];

    mockEmployees.forEach(emp => this.hrEmployees.set(emp.id, emp));
    console.log(`✅ Initialized ${mockEmployees.length} HR employees`);
  }

  /**
   * Generate mock availability (in production, integrate with calendar API)
   */
  private generateMockAvailability(): AvailabilitySlot[] {
    const slots: AvailabilitySlot[] = [];
    const now = new Date();
    
    // Generate availability for next 7 days, 9 AM - 5 PM
    for (let day = 0; day < 7; day++) {
      const date = new Date(now);
      date.setDate(date.getDate() + day);
      date.setHours(9, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(17, 0, 0, 0);
      
      slots.push({
        start: date.toISOString(),
        end: endDate.toISOString(),
        status: Math.random() > 0.3 ? 'available' : 'busy'
      });
    }
    
    return slots;
  }

  /**
   * Main function to get HR help
   */
  async getHRHelp(helpRequest: HelpRequest): Promise<HRHelpSession> {
    console.log(`🆘 Processing HR help request from user: ${helpRequest.userId}`);

    // Find available HR employees
    const availableEmployees = await this.findAvailableHREmployees(
      helpRequest.preferredTime || new Date().toISOString(),
      helpRequest.skillsRequired
    );

    if (availableEmployees.length === 0) {
      throw new Error('No HR employees available at this time. Please try again later.');
    }

    // Select best HR employee
    const selectedEmployee = this.selectBestHREmployee(availableEmployees, helpRequest);

    // Create 1:1 chat
    const chatRoom = await this.createHRHelpChat(helpRequest.userId, selectedEmployee, helpRequest.context);

    // Set up integrations (Slack, tabbed window)
    await this.setupChatIntegrations(chatRoom, selectedEmployee, helpRequest);

    // Load contextual resources
    await this.loadContextualResources(chatRoom, helpRequest.context);

    // Set up reminders
    await this.setupHRHelpReminders(chatRoom.id, selectedEmployee.id, helpRequest.userId);

    // Create session record
    const session: HRHelpSession = {
      id: `hr_session_${Date.now()}`,
      requesterId: helpRequest.userId,
      hrEmployeeId: selectedEmployee.id,
      chatRoomId: chatRoom.id,
      context: helpRequest.context,
      startTime: new Date().toISOString(),
      status: 'active'
    };

    this.activeSessions.set(session.id, session);

    // Update HR employee load
    selectedEmployee.currentLoad++;
    this.hrEmployees.set(selectedEmployee.id, selectedEmployee);

    console.log(`✅ Created HR help session: ${session.id}`);
    return session;
  }

  /**
   * Find available HR employees based on time and skills
   */
  async findAvailableHREmployees(requestTime: string, skillsRequired: string[]): Promise<HREmployee[]> {
    const requestDate = new Date(requestTime);
    const availableEmployees: HREmployee[] = [];

    for (const [id, employee] of this.hrEmployees) {
      // Check if employee has capacity
      if (employee.currentLoad >= employee.maxLoad) {
        continue;
      }

      // Check if employee has required skills
      const hasSkills = skillsRequired.length === 0 || 
        skillsRequired.some(skill => employee.skills.includes(skill));
      
      if (!hasSkills) {
        continue;
      }

      // Check availability at requested time
      const isAvailable = employee.availability.some(slot => {
        const slotStart = new Date(slot.start);
        const slotEnd = new Date(slot.end);
        return slot.status === 'available' && 
               requestDate >= slotStart && 
               requestDate <= slotEnd;
      });

      if (isAvailable) {
        availableEmployees.push(employee);
      }
    }

    console.log(`📋 Found ${availableEmployees.length} available HR employees`);
    return availableEmployees;
  }

  /**
   * Select best HR employee based on context and availability
   */
  selectBestHREmployee(availableEmployees: HREmployee[], helpRequest: HelpRequest): HREmployee {
    // Score employees based on multiple factors
    const scoredEmployees = availableEmployees.map(emp => {
      let score = 0;

      // Skill match (40% weight)
      const skillMatchCount = helpRequest.skillsRequired.filter(skill => 
        emp.skills.includes(skill)
      ).length;
      score += (skillMatchCount / Math.max(helpRequest.skillsRequired.length, 1)) * 40;

      // Current load (30% weight) - prefer less busy employees
      score += ((emp.maxLoad - emp.currentLoad) / emp.maxLoad) * 30;

      // Rating (30% weight)
      score += (emp.rating / 5) * 30;

      return { employee: emp, score };
    });

    // Sort by score descending
    scoredEmployees.sort((a, b) => b.score - a.score);

    const selected = scoredEmployees[0].employee;
    console.log(`✅ Selected HR employee: ${selected.name} (score: ${scoredEmployees[0].score.toFixed(2)})`);
    
    return selected;
  }

  /**
   * Create 1:1 HR help chat
   */
  async createHRHelpChat(requesterId: string, hrEmployee: HREmployee, context: string): Promise<ChatRoom> {
    const chatRoom = this.chatService.createChatRoom(
      `HR Help - ${hrEmployee.name}`,
      [requesterId, hrEmployee.id]
    );

    // Send welcome message
    await this.chatService.sendMessage(chatRoom.id, {
      sender: 'System',
      content: `🆘 HR Help Session Started\n\nYou've been connected with ${hrEmployee.name} from our HR team.\n\nContext: ${context}\n\nFeel free to ask any questions!`,
      type: 'system'
    });

    // HR employee introduction
    await this.chatService.sendMessage(chatRoom.id, {
      sender: hrEmployee.name,
      content: `Hi! I'm ${hrEmployee.name} from HR. I'm here to help you with ${context}. How can I assist you today?`,
      type: 'user'
    });

    console.log(`✅ Created HR help chat room: ${chatRoom.id}`);
    return chatRoom;
  }

  /**
   * Set up chat integrations (Slack, tabbed window)
   */
  async setupChatIntegrations(chatRoom: ChatRoom, hrEmployee: HREmployee, helpRequest: HelpRequest): Promise<void> {
    // Create Slack channel for the chat
    await this.slackService.createSlackChannel(
      chatRoom.id,
      chatRoom.name,
      [helpRequest.userId, hrEmployee.id]
    );

    // Notify HR employee in Slack
    await this.slackService.notifyHRHelpInSlack(
      hrEmployee.id,
      helpRequest.userId,
      helpRequest.context
    );

    console.log(`✅ Set up chat integrations for HR help session`);
  }

  /**
   * Load contextual resources into chat
   */
  async loadContextualResources(chatRoom: ChatRoom, context: string): Promise<void> {
    // Determine relevant resources based on context
    const resources = this.getContextualResources(context);

    if (resources.length > 0) {
      const resourceList = resources.map(r => `• ${r.title}: ${r.url}`).join('\n');
      
      await this.chatService.sendMessage(chatRoom.id, {
        sender: 'System',
        content: `📚 Helpful Resources:\n\n${resourceList}`,
        type: 'system'
      });
    }

    console.log(`✅ Loaded ${resources.length} contextual resources`);
  }

  /**
   * Get contextual resources based on help context
   */
  private getContextualResources(context: string): Array<{ title: string; url: string }> {
    const resourceMap: { [key: string]: Array<{ title: string; url: string }> } = {
      'onboarding': [
        { title: 'Employee Handbook', url: '/resources/handbook' },
        { title: 'First Day Checklist', url: '/resources/first-day' },
        { title: 'Benefits Overview', url: '/resources/benefits' }
      ],
      'benefits': [
        { title: 'Benefits Enrollment Guide', url: '/resources/benefits-enrollment' },
        { title: 'Health Insurance Options', url: '/resources/health-insurance' },
        { title: '401(k) Plan Details', url: '/resources/401k' }
      ],
      'payroll': [
        { title: 'Payroll Schedule', url: '/resources/payroll-schedule' },
        { title: 'Direct Deposit Setup', url: '/resources/direct-deposit' },
        { title: 'Tax Withholding Forms', url: '/resources/tax-forms' }
      ],
      'compliance': [
        { title: 'Company Policies', url: '/resources/policies' },
        { title: 'Code of Conduct', url: '/resources/code-of-conduct' },
        { title: 'Compliance Training', url: '/resources/compliance-training' }
      ]
    };

    // Find matching resources
    for (const [key, resources] of Object.entries(resourceMap)) {
      if (context.toLowerCase().includes(key)) {
        return resources;
      }
    }

    return [];
  }

  /**
   * Set up reminders for HR help session
   */
  async setupHRHelpReminders(chatRoomId: string, hrEmployeeId: string, requesterId: string): Promise<void> {
    // In production, this would set up actual reminders/notifications
    console.log(`⏰ Set up reminders for HR help session: ${chatRoomId}`);
    
    // Mock reminder setup
    // - Reminder to HR employee if no response in 5 minutes
    // - Reminder to requester to rate session after completion
    // - Follow-up reminder 24 hours after session
  }

  /**
   * Complete HR help session
   */
  async completeSession(sessionId: string, rating?: number): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      return false;
    }

    session.status = 'completed';
    session.endTime = new Date().toISOString();
    session.rating = rating;

    this.activeSessions.set(sessionId, session);

    // Update HR employee load
    const hrEmployee = this.hrEmployees.get(session.hrEmployeeId);
    if (hrEmployee) {
      hrEmployee.currentLoad = Math.max(0, hrEmployee.currentLoad - 1);
      this.hrEmployees.set(hrEmployee.id, hrEmployee);
    }

    // Send completion message
    await this.chatService.sendMessage(session.chatRoomId, {
      sender: 'System',
      content: `✅ HR Help Session Completed\n\nThank you for using our HR help service!${rating ? `\n\nYour rating: ${'⭐'.repeat(rating)}` : ''}`,
      type: 'system'
    });

    console.log(`✅ Completed HR help session: ${sessionId}`);
    return true;
  }

  /**
   * Get active sessions for a user
   */
  getActiveSessionsForUser(userId: string): HRHelpSession[] {
    return Array.from(this.activeSessions.values()).filter(
      session => session.requesterId === userId && session.status === 'active'
    );
  }

  /**
   * Get all HR employees
   */
  getAllHREmployees(): HREmployee[] {
    return Array.from(this.hrEmployees.values());
  }

  /**
   * Get HR employee by ID
   */
  getHREmployee(employeeId: string): HREmployee | undefined {
    return this.hrEmployees.get(employeeId);
  }
}

export default HRHelpService;

