// Onboarding Service - Handles automated onboarding workflows
// Including chat room creation, meeting scheduling, and participant management

export interface OnboardingParticipant {
  id: string;
  name: string;
  email: string;
  role: 'hiring_manager' | 'team_member' | 'hr_representative' | 'new_hire' | 'cabin_specialist' | 'cabin_host';
  department: string;
  employeeType?: 'technical' | 'operations' | 'customer_service' | 'management';
}

export interface OnboardingMeeting {
  id: string;
  candidateId: string;
  candidateName: string;
  startDate: string;
  meetingDate: string;
  duration: number; // in minutes
  title: string;
  description: string;
  participants: OnboardingParticipant[];
  chatRoomId: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  calendarEventId?: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  participants: OnboardingParticipant[];
  meetingId: string;
  createdAt: string;
  status: 'active' | 'archived';
  type: 'onboarding' | 'cabin_training' | 'cabin_employee_joint' | 'department_specific';
  department?: string;
  employeeType?: string;
}

export class OnboardingService {
  private static instance: OnboardingService;
  private chatRooms: Map<string, ChatRoom> = new Map();
  private meetings: Map<string, OnboardingMeeting> = new Map();

  static getInstance(): OnboardingService {
    if (!OnboardingService.instance) {
      OnboardingService.instance = new OnboardingService();
      OnboardingService.instance.initializeJointCabinRoom();
    }
    return OnboardingService.instance;
  }

  // Initialize joint cabin room if it doesn't exist
  private async initializeJointCabinRoom(): Promise<void> {
    try {
      const existingJointRoom = this.getJointCabinChatRoom();
      if (!existingJointRoom) {
        await this.createJointCabinEmployeeChatRoom();
        console.log('Joint cabin-employee chat room initialized');
      }
    } catch (error) {
      console.error('Failed to initialize joint cabin room:', error);
    }
  }

  // Automatically schedule onboarding meeting when candidate is hired
  async scheduleOnboardingMeeting(
    candidateId: string,
    candidateName: string,
    startDate: string,
    hiringTeam: string[]
  ): Promise<OnboardingMeeting> {
    try {
      // Create participants list
      const participants: OnboardingParticipant[] = [
        {
          id: candidateId,
          name: candidateName,
          email: `${candidateName.toLowerCase().replace(' ', '.')}@company.com`,
          role: 'new_hire',
          department: 'New Hire'
        },
        // Add hiring team members
        ...hiringTeam.map((member, index) => ({
          id: `hiring_${index}`,
          name: member,
          email: `${member.toLowerCase().replace(' ', '.')}@company.com`,
          role: 'hiring_manager' as const,
          department: 'Hiring Team'
        }))
      ];

      // Create meeting
      const meeting: OnboardingMeeting = {
        id: `meeting_${Date.now()}`,
        candidateId,
        candidateName,
        startDate,
        meetingDate: new Date(startDate).toISOString(),
        duration: 60,
        title: `Onboarding Meeting - ${candidateName}`,
        description: `Welcome to the team! This onboarding meeting will cover company policies, team introductions, and next steps.`,
        participants,
        chatRoomId: `chat_${Date.now()}`,
        status: 'scheduled'
      };

      // Create chat room
      const chatRoom: ChatRoom = {
        id: meeting.chatRoomId,
        name: `Onboarding - ${candidateName}`,
        participants,
        meetingId: meeting.id,
        createdAt: new Date().toISOString(),
        status: 'active',
        type: 'onboarding'
      };

      // Store meeting and chat room
      this.meetings.set(meeting.id, meeting);
      this.chatRooms.set(chatRoom.id, chatRoom);

      // Schedule calendar event (integration with calendar APIs)
      await this.scheduleCalendarEvent(meeting);

      // Send invitations
      await this.sendMeetingInvitations(meeting);

      // Create Cabin training chat room for new hire
      await this.createCabinTrainingChatRoom(
        candidateId,
        candidateName,
        'technical', // Default to technical, can be customized
        'Engineering' // Default department, can be customized
      );

      console.log('Onboarding meeting scheduled:', meeting);
      return meeting;
    } catch (error) {
      console.error('Failed to schedule onboarding meeting:', error);
      throw new Error('Failed to schedule onboarding meeting');
    }
  }

  // Schedule calendar event (Google Calendar, Outlook, etc.)
  private async scheduleCalendarEvent(meeting: OnboardingMeeting): Promise<void> {
    try {
      // Integration with calendar APIs would go here
      // For now, we'll simulate the calendar event creation
      const calendarEvent = {
        id: `event_${Date.now()}`,
        title: meeting.title,
        description: meeting.description,
        startTime: meeting.meetingDate,
        endTime: new Date(new Date(meeting.meetingDate).getTime() + meeting.duration * 60000).toISOString(),
        attendees: meeting.participants.map(p => p.email),
        location: 'Virtual Meeting',
        organizer: meeting.participants.find(p => p.role === 'hiring_manager')?.email || 'hr@company.com'
      };

      // Update meeting with calendar event ID
      meeting.calendarEventId = calendarEvent.id;
      this.meetings.set(meeting.id, meeting);

      console.log('Calendar event created:', calendarEvent);
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      throw new Error('Failed to create calendar event');
    }
  }

  // Send meeting invitations
  private async sendMeetingInvitations(meeting: OnboardingMeeting): Promise<void> {
    try {
      // Email integration would go here
      // For now, we'll simulate sending invitations
      const invitations = meeting.participants.map(participant => ({
        to: participant.email,
        subject: `Onboarding Meeting Invitation - ${meeting.candidateName}`,
        body: `
          Hi ${participant.name},
          
          You are invited to attend the onboarding meeting for ${meeting.candidateName}.
          
          Meeting Details:
          - Date: ${new Date(meeting.meetingDate).toLocaleString()}
          - Duration: ${meeting.duration} minutes
          - Location: Virtual Meeting
          
          Please join the chat room: ${meeting.chatRoomId}
          
          Best regards,
          HR Team
        `
      }));

      console.log('Meeting invitations sent:', invitations);
    } catch (error) {
      console.error('Failed to send meeting invitations:', error);
      throw new Error('Failed to send meeting invitations');
    }
  }

  // Create chat room for onboarding
  async createOnboardingChatRoom(meeting: OnboardingMeeting): Promise<ChatRoom> {
    try {
      const chatRoom: ChatRoom = {
        id: meeting.chatRoomId,
        name: `Onboarding - ${meeting.candidateName}`,
        participants: meeting.participants,
        meetingId: meeting.id,
        createdAt: new Date().toISOString(),
        status: 'active',
        type: 'onboarding'
      };

      this.chatRooms.set(chatRoom.id, chatRoom);

      // Initialize chat room with welcome message
      await this.initializeChatRoom(chatRoom);

      console.log('Chat room created:', chatRoom);
      return chatRoom;
    } catch (error) {
      console.error('Failed to create chat room:', error);
      throw new Error('Failed to create chat room');
    }
  }

  // Initialize chat room with welcome message and onboarding materials
  private async initializeChatRoom(chatRoom: ChatRoom): Promise<void> {
    try {
      const welcomeMessage = {
        id: `msg_${Date.now()}`,
        sender: 'HR Bot',
        content: `Welcome to the onboarding chat room! This is where you can ask questions and get support during your onboarding process.`,
        timestamp: new Date().toISOString(),
        type: 'system'
      };

      const onboardingMaterials = {
        id: `materials_${Date.now()}`,
        sender: 'HR Bot',
        content: `📋 Onboarding Materials:
        • Company Handbook
        • IT Setup Guide
        • Benefits Overview
        • Team Introduction
        • First Week Schedule`,
        timestamp: new Date().toISOString(),
        type: 'system'
      };

      console.log('Chat room initialized with welcome messages');
    } catch (error) {
      console.error('Failed to initialize chat room:', error);
    }
  }

  // Get all onboarding meetings
  getOnboardingMeetings(): OnboardingMeeting[] {
    return Array.from(this.meetings.values());
  }

  // Get all chat rooms
  getChatRooms(): ChatRoom[] {
    return Array.from(this.chatRooms.values());
  }

  // Get meeting by ID
  getMeeting(meetingId: string): OnboardingMeeting | undefined {
    return this.meetings.get(meetingId);
  }

  // Get chat room by ID
  getChatRoom(chatRoomId: string): ChatRoom | undefined {
    return this.chatRooms.get(chatRoomId);
  }

  // Update meeting status
  updateMeetingStatus(meetingId: string, status: OnboardingMeeting['status']): void {
    const meeting = this.meetings.get(meetingId);
    if (meeting) {
      meeting.status = status;
      this.meetings.set(meetingId, meeting);
    }
  }

  // Archive chat room
  archiveChatRoom(chatRoomId: string): void {
    const chatRoom = this.chatRooms.get(chatRoomId);
    if (chatRoom) {
      chatRoom.status = 'archived';
      this.chatRooms.set(chatRoomId, chatRoom);
    }
  }

  // Create Cabin training chat room for new employee
  async createCabinTrainingChatRoom(
    newEmployeeId: string,
    newEmployeeName: string,
    employeeType: 'technical' | 'operations' | 'customer_service' | 'management',
    department: string
  ): Promise<ChatRoom> {
    try {
      // Get relevant cabin specialists based on employee type
      const cabinSpecialists = this.getCabinSpecialistsForEmployeeType(employeeType);
      
      const participants: OnboardingParticipant[] = [
        {
          id: newEmployeeId,
          name: newEmployeeName,
          email: `${newEmployeeName.toLowerCase().replace(' ', '.')}@company.com`,
          role: 'new_hire',
          department,
          employeeType
        },
        ...cabinSpecialists
      ];

      const chatRoom: ChatRoom = {
        id: `cabin_training_${Date.now()}`,
        name: `Cabin Training - ${newEmployeeName}`,
        participants,
        meetingId: `cabin_training_${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'active',
        type: 'cabin_training',
        department,
        employeeType
      };

      // Store chat room
      this.chatRooms.set(chatRoom.id, chatRoom);

      // Initialize with Cabin training materials
      await this.initializeCabinTrainingChatRoom(chatRoom, employeeType);

      console.log(`Cabin training chat room created: ${chatRoom.id}`);
      return chatRoom;

    } catch (error) {
      console.error('Failed to create cabin training chat room:', error);
      throw error;
    }
  }

  // Create joint Cabin-employee chat room
  async createJointCabinEmployeeChatRoom(): Promise<ChatRoom> {
    try {
      // Get all cabin specialists and active employees
      const cabinSpecialists = this.getCabinSpecialists();
      const activeEmployees = this.getActiveEmployees();

      const participants: OnboardingParticipant[] = [
        ...cabinSpecialists,
        ...activeEmployees
      ];

      const chatRoom: ChatRoom = {
        id: `cabin_employee_joint_${Date.now()}`,
        name: 'Cabin Team - All Employees',
        participants,
        meetingId: `joint_${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'active',
        type: 'cabin_employee_joint'
      };

      // Store chat room
      this.chatRooms.set(chatRoom.id, chatRoom);

      // Initialize with welcome message and resources
      await this.initializeJointCabinChatRoom(chatRoom);

      console.log(`Joint cabin-employee chat room created: ${chatRoom.id}`);
      return chatRoom;

    } catch (error) {
      console.error('Failed to create joint cabin-employee chat room:', error);
      throw error;
    }
  }

  // Get cabin specialists based on employee type
  private getCabinSpecialistsForEmployeeType(employeeType: string): OnboardingParticipant[] {
    const specialists: OnboardingParticipant[] = [];

    // Technical employees get technical cabin specialists
    if (employeeType === 'technical') {
      specialists.push(
        {
          id: 'cabin_tech_lead',
          name: 'Sarah Chen',
          email: 'sarah.chen@company.com',
          role: 'cabin_specialist',
          department: 'Engineering',
          employeeType: 'technical'
        },
        {
          id: 'cabin_dev_specialist',
          name: 'Mike Rodriguez',
          email: 'mike.rodriguez@company.com',
          role: 'cabin_specialist',
          department: 'Engineering',
          employeeType: 'technical'
        }
      );
    }

    // Operations employees get operations specialists
    if (employeeType === 'operations') {
      specialists.push(
        {
          id: 'cabin_ops_lead',
          name: 'Jennifer Walsh',
          email: 'jennifer.walsh@company.com',
          role: 'cabin_specialist',
          department: 'Operations',
          employeeType: 'operations'
        },
        {
          id: 'cabin_logistics_specialist',
          name: 'David Kim',
          email: 'david.kim@company.com',
          role: 'cabin_specialist',
          department: 'Operations',
          employeeType: 'operations'
        }
      );
    }

    // Customer service employees get CS specialists
    if (employeeType === 'customer_service') {
      specialists.push(
        {
          id: 'cabin_cs_lead',
          name: 'Amanda Foster',
          email: 'amanda.foster@company.com',
          role: 'cabin_specialist',
          department: 'Customer Success',
          employeeType: 'customer_service'
        },
        {
          id: 'cabin_support_specialist',
          name: 'Robert Taylor',
          email: 'robert.taylor@company.com',
          role: 'cabin_specialist',
          department: 'Customer Success',
          employeeType: 'customer_service'
        }
      );
    }

    // Management gets senior cabin specialists
    if (employeeType === 'management') {
      specialists.push(
        {
          id: 'cabin_director',
          name: 'Lisa Johnson',
          email: 'lisa.johnson@company.com',
          role: 'cabin_specialist',
          department: 'Product',
          employeeType: 'management'
        },
        {
          id: 'cabin_strategy_lead',
          name: 'James Wilson',
          email: 'james.wilson@company.com',
          role: 'cabin_specialist',
          department: 'Strategy',
          employeeType: 'management'
        }
      );
    }

    return specialists;
  }

  // Get all cabin specialists
  private getCabinSpecialists(): OnboardingParticipant[] {
    return [
      {
        id: 'cabin_tech_lead',
        name: 'Sarah Chen',
        email: 'sarah.chen@company.com',
        role: 'cabin_specialist',
        department: 'Engineering',
        employeeType: 'technical'
      },
      {
        id: 'cabin_ops_lead',
        name: 'Jennifer Walsh',
        email: 'jennifer.walsh@company.com',
        role: 'cabin_specialist',
        department: 'Operations',
        employeeType: 'operations'
      },
      {
        id: 'cabin_cs_lead',
        name: 'Amanda Foster',
        email: 'amanda.foster@company.com',
        role: 'cabin_specialist',
        department: 'Customer Success',
        employeeType: 'customer_service'
      },
      {
        id: 'cabin_director',
        name: 'Lisa Johnson',
        email: 'lisa.johnson@company.com',
        role: 'cabin_specialist',
        department: 'Product',
        employeeType: 'management'
      }
    ];
  }

  // Get active employees (mock data)
  private getActiveEmployees(): OnboardingParticipant[] {
    return [
      {
        id: 'employee_1',
        name: 'Alex Thompson',
        email: 'alex.thompson@company.com',
        role: 'team_member',
        department: 'Engineering',
        employeeType: 'technical'
      },
      {
        id: 'employee_2',
        name: 'Maria Garcia',
        email: 'maria.garcia@company.com',
        role: 'team_member',
        department: 'Operations',
        employeeType: 'operations'
      },
      {
        id: 'employee_3',
        name: 'Tom Anderson',
        email: 'tom.anderson@company.com',
        role: 'team_member',
        department: 'Customer Success',
        employeeType: 'customer_service'
      }
    ];
  }

  // Initialize cabin training chat room with materials
  private async initializeCabinTrainingChatRoom(
    chatRoom: ChatRoom, 
    employeeType: string
  ): Promise<void> {
    try {
      const welcomeMessage = {
        id: `msg_${Date.now()}`,
        sender: 'Cabin Training Bot',
        content: `🏠 Welcome to Cabin Training!

This chat room is designed to help you understand our Cabin feature - our innovative item demo and tour service.

Your role: ${employeeType.toUpperCase()}
Department: ${chatRoom.department}

Let's get started with your Cabin training!`,
        timestamp: new Date().toISOString(),
        type: 'system'
      };

      // Role-specific training materials
      const trainingMaterials = this.getCabinTrainingMaterials(employeeType);
      
      const materialsMessage = {
        id: `materials_${Date.now()}`,
        sender: 'Cabin Training Bot',
        content: `📚 Your Cabin Training Materials:

${trainingMaterials.map(material => `• ${material}`).join('\n')}

Please review these materials and feel free to ask any questions!`,
        timestamp: new Date().toISOString(),
        type: 'system'
      };

      console.log('Cabin training chat room initialized with role-specific materials');
    } catch (error) {
      console.error('Failed to initialize cabin training chat room:', error);
    }
  }

  // Initialize joint cabin chat room
  private async initializeJointCabinChatRoom(chatRoom: ChatRoom): Promise<void> {
    try {
      const welcomeMessage = {
        id: `msg_${Date.now()}`,
        sender: 'Cabin Team Bot',
        content: `🏠 Welcome to the Cabin Team Chat!

This is our joint chat room for all Cabin-related discussions, updates, and collaboration.

Team Members: ${chatRoom.participants.length}
Departments: ${[...new Set(chatRoom.participants.map(p => p.department))].join(', ')}

Let's work together to make Cabin the best it can be!`,
        timestamp: new Date().toISOString(),
        type: 'system'
      };

      const resourcesMessage = {
        id: `resources_${Date.now()}`,
        sender: 'Cabin Team Bot',
        content: `📋 Cabin Team Resources:

• Cabin Documentation: /docs/cabin
• Feature Roadmap: /roadmap/cabin
• Bug Reports: /bugs/cabin
• Feature Requests: /features/cabin
• Training Materials: /training/cabin
• API Documentation: /api/cabin

Use this chat for:
- Quick questions and clarifications
- Feature announcements
- Cross-team coordination
- Knowledge sharing`,
        timestamp: new Date().toISOString(),
        type: 'system'
      };

      console.log('Joint cabin chat room initialized');
    } catch (error) {
      console.error('Failed to initialize joint cabin chat room:', error);
    }
  }

  // Get cabin training materials based on employee type
  private getCabinTrainingMaterials(employeeType: string): string[] {
    const baseMaterials = [
      'Cabin Overview & Core Concepts',
      'User Journey & Experience Flow',
      'Safety & Security Guidelines',
      'Customer Support Procedures'
    ];

    switch (employeeType) {
      case 'technical':
        return [
          ...baseMaterials,
          'Cabin API Documentation',
          'Technical Architecture Overview',
          'Integration Points & Dependencies',
          'Performance & Scalability Considerations',
          'Testing & Quality Assurance',
          'Deployment & Monitoring'
        ];
      
      case 'operations':
        return [
          ...baseMaterials,
          'Cabin Logistics & Fulfillment',
          'Inventory Management Integration',
          'Shipping & Tracking Procedures',
          'Vendor & Partner Management',
          'Operational Metrics & KPIs',
          'Process Optimization'
        ];
      
      case 'customer_service':
        return [
          ...baseMaterials,
          'Customer Support Workflows',
          'Common Issues & Solutions',
          'Escalation Procedures',
          'Customer Communication Guidelines',
          'Review & Feedback Management',
          'CSR Dashboard & Tools'
        ];
      
      case 'management':
        return [
          ...baseMaterials,
          'Business Strategy & Vision',
          'Financial Impact & ROI',
          'Market Analysis & Competition',
          'Team Management & Coordination',
          'Stakeholder Communication',
          'Strategic Planning & Roadmap'
        ];
      
      default:
        return baseMaterials;
    }
  }

  // Get chat rooms by type
  getChatRoomsByType(type: 'onboarding' | 'cabin_training' | 'cabin_employee_joint' | 'department_specific'): ChatRoom[] {
    return Array.from(this.chatRooms.values())
      .filter(room => room.type === type)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Get cabin training chat rooms for specific employee type
  getCabinTrainingChatRooms(employeeType?: string): ChatRoom[] {
    let rooms = Array.from(this.chatRooms.values())
      .filter(room => room.type === 'cabin_training');

    if (employeeType) {
      rooms = rooms.filter(room => room.employeeType === employeeType);
    }

    return rooms.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Get joint cabin chat room
  getJointCabinChatRoom(): ChatRoom | undefined {
    return Array.from(this.chatRooms.values())
      .find(room => room.type === 'cabin_employee_joint');
  }
}

export default OnboardingService; 