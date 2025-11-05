/**
 * Chat Room Automation Service
 * Automatically creates and manages contextual chat rooms for various platform features
 */

import { ChatService, ChatRoom, ChatMessage } from './ChatService';

export type ChatRoomType =
  | 'hr_onboarding'
  | 'cabin_airbnb_demo'
  | 'item_transaction'
  | 'dispute_resolution'
  | 'investment_hold'
  | 'shipstation_optimization'
  | 'tax_document'
  | 'market_monitoring'
  | 'dropshipping'
  | 'address_pii_safety'
  | 'legal_document';

export interface TriggerEvent {
  type: string;
  data: any;
  userId: string;
  timestamp: string;
}

export interface ContextData {
  [key: string]: any;
}

export interface AutomationConfig {
  chatRoomType: ChatRoomType;
  triggers: string[];
  participants: string[];
  automationFeatures: string[];
  templates: {
    welcome_message?: string;
    system_messages?: string[];
  };
}

export class ChatRoomAutomationService {
  private static instance: ChatRoomAutomationService;
  private chatService: ChatService;
  private automationConfigs: Map<ChatRoomType, AutomationConfig> = new Map();

  static getInstance(): ChatRoomAutomationService {
    if (!ChatRoomAutomationService.instance) {
      ChatRoomAutomationService.instance = new ChatRoomAutomationService();
    }
    return ChatRoomAutomationService.instance;
  }

  constructor() {
    this.chatService = ChatService.getInstance();
    this.initializeAutomationConfigs();
    console.log('🤖 Chat Room Automation Service initialized');
  }

  /**
   * Initialize automation configurations for all chat room types
   */
  private initializeAutomationConfigs() {
    // 1. HR & Onboarding
    this.automationConfigs.set('hr_onboarding', {
      chatRoomType: 'hr_onboarding',
      triggers: ['employee_created', 'onboarding_started'],
      participants: ['hr_team', 'new_employee'],
      automationFeatures: ['welcome_message', 'checklist', 'resource_links'],
      templates: {
        welcome_message: 'Welcome to the team! 🎉 Your HR representative will guide you through onboarding.',
        system_messages: [
          'Please complete your profile information',
          'Review and sign the employee handbook',
          'Set up your benefits enrollment'
        ]
      }
    });

    // 2. Cabin/Airbnb Demo Retreats
    this.automationConfigs.set('cabin_airbnb_demo', {
      chatRoomType: 'cabin_airbnb_demo',
      triggers: ['demo_retreat_created', 'cabin_booking_confirmed'],
      participants: ['retreat_coordinator', 'attendees'],
      automationFeatures: ['booking_details', 'itinerary', 'amenities_list'],
      templates: {
        welcome_message: 'Welcome to your cabin retreat! 🏡 Here are your booking details and itinerary.',
        system_messages: [
          'Check-in: 3:00 PM',
          'Check-out: 11:00 AM',
          'Amenities: WiFi, Kitchen, Hot Tub'
        ]
      }
    });

    // 3. Item Transactions
    this.automationConfigs.set('item_transaction', {
      chatRoomType: 'item_transaction',
      triggers: ['item_borrowed', 'item_lent', 'transaction_created'],
      participants: ['borrower', 'owner'],
      automationFeatures: ['transaction_details', 'shipping_tracking', 'return_reminders'],
      templates: {
        welcome_message: 'Your item transaction has been created. Use this chat to coordinate pickup/delivery.',
        system_messages: [
          'Transaction ID: {transaction_id}',
          'Expected return date: {return_date}',
          'Shipping tracking will appear here'
        ]
      }
    });

    // 4. Dispute Resolution
    this.automationConfigs.set('dispute_resolution', {
      chatRoomType: 'dispute_resolution',
      triggers: ['dispute_created', 'dispute_escalated'],
      participants: ['disputing_parties', 'mediator', 'csr_team'],
      automationFeatures: ['evidence_upload', 'timeline', 'resolution_options'],
      templates: {
        welcome_message: 'A dispute has been opened. A mediator will assist in resolving this matter.',
        system_messages: [
          'Please provide evidence and details',
          'Remain respectful and professional',
          'Resolution timeline: 3-5 business days'
        ]
      }
    });

    // 5. Investment Hold
    this.automationConfigs.set('investment_hold', {
      chatRoomType: 'investment_hold',
      triggers: ['investment_hold_created', 'risky_mode_enabled'],
      participants: ['investor', 'investment_advisor'],
      automationFeatures: ['investment_details', 'risk_disclosure', 'performance_updates'],
      templates: {
        welcome_message: 'Your investment hold has been created. Monitor performance and get updates here.',
        system_messages: [
          'Investment amount: ${amount}',
          'Risk level: {risk_level}',
          'Expected return: {expected_return}%'
        ]
      }
    });

    // 6. ShipStation Optimization
    this.automationConfigs.set('shipstation_optimization', {
      chatRoomType: 'shipstation_optimization',
      triggers: ['shipping_optimization_available', 'label_refund_processed'],
      participants: ['user', 'shipping_team'],
      automationFeatures: ['rate_comparison', 'savings_notification', 'reinvestment_options'],
      templates: {
        welcome_message: 'Shipping optimization opportunity detected! Review savings and reinvestment options.',
        system_messages: [
          'Original rate: ${original_rate}',
          'Optimized rate: ${optimized_rate}',
          'Potential savings: ${savings}'
        ]
      }
    });

    // 7. Tax Document
    this.automationConfigs.set('tax_document', {
      chatRoomType: 'tax_document',
      triggers: ['tax_document_requested', 'tax_document_ready'],
      participants: ['user', 'tax_specialist'],
      automationFeatures: ['document_status', 'download_link', 'tax_advice'],
      templates: {
        welcome_message: 'Your tax document request is being processed. You\'ll be notified when it\'s ready.',
        system_messages: [
          'Document type: {document_type}',
          'Tax year: {tax_year}',
          'Estimated completion: {estimated_time}'
        ]
      }
    });

    // 8. Market Monitoring
    this.automationConfigs.set('market_monitoring', {
      chatRoomType: 'market_monitoring',
      triggers: ['market_volatility_alert', 'emergency_protocol_activated'],
      participants: ['investors', 'market_analysts'],
      automationFeatures: ['volatility_alerts', 'robot_status', 'withdrawal_options'],
      templates: {
        welcome_message: '🚨 Market volatility detected! Investment robots are monitoring your positions.',
        system_messages: [
          'Current volatility: {volatility}%',
          'Robot status: {robot_status}',
          'Recommended action: {recommendation}'
        ]
      }
    });

    // 9. Dropshipping
    this.automationConfigs.set('dropshipping', {
      chatRoomType: 'dropshipping',
      triggers: ['dropshipping_order_created', 'supplier_selected'],
      participants: ['seller', 'buyer', 'supplier'],
      automationFeatures: ['order_tracking', 'supplier_communication', 'fund_management'],
      templates: {
        welcome_message: 'Dropshipping order created! Coordinate with supplier and track fulfillment here.',
        system_messages: [
          'Order ID: {order_id}',
          'Supplier: {supplier_name}',
          'Expected delivery: {delivery_date}'
        ]
      }
    });

    // 10. Address PII Safety
    this.automationConfigs.set('address_pii_safety', {
      chatRoomType: 'address_pii_safety',
      triggers: ['address_estimation_requested', 'pii_concern_flagged'],
      participants: ['user', 'privacy_team'],
      automationFeatures: ['address_generalization', 'privacy_controls', 'estimation_accuracy'],
      templates: {
        welcome_message: 'Address privacy protection is active. Review estimation settings and controls.',
        system_messages: [
          'Estimation level: {estimation_level}',
          'Privacy mode: {privacy_mode}',
          'Accuracy vs. Privacy trade-off explained'
        ]
      }
    });

    // 11. Legal Document
    this.automationConfigs.set('legal_document', {
      chatRoomType: 'legal_document',
      triggers: ['legal_document_requested', 'terms_updated'],
      participants: ['user', 'legal_team'],
      automationFeatures: ['document_status', 'legal_review', 'signature_required'],
      templates: {
        welcome_message: 'Your legal document request is being processed. Legal team will assist if needed.',
        system_messages: [
          'Document type: {document_type}',
          'Status: {status}',
          'Review required: {review_required}'
        ]
      }
    });

    console.log(`✅ Initialized ${this.automationConfigs.size} chat room automation configs`);
  }

  /**
   * Create a contextual chat room based on trigger event
   */
  async createContextualChatRoom(
    triggerEvent: TriggerEvent,
    contextData: ContextData
  ): Promise<ChatRoom> {
    console.log(`🤖 Creating contextual chat room for event: ${triggerEvent.type}`);

    // Determine chat room type from trigger
    const chatRoomType = this.determineChatRoomType(triggerEvent.type);
    
    if (!chatRoomType) {
      throw new Error(`No chat room type found for trigger: ${triggerEvent.type}`);
    }

    // Get automation config
    const config = this.automationConfigs.get(chatRoomType);
    
    if (!config) {
      throw new Error(`No automation config found for chat room type: ${chatRoomType}`);
    }

    // Determine participants
    const participants = this.determineParticipants(config, triggerEvent, contextData);

    // Create chat room name
    const chatRoomName = this.generateChatRoomName(chatRoomType, contextData);

    // Create the chat room
    const chatRoom = this.chatService.createChatRoom(chatRoomName, participants);

    // Set up automation
    await this.setupChatAutomation(chatRoom, chatRoomType, contextData);

    console.log(`✅ Created contextual chat room: ${chatRoom.id} (${chatRoomType})`);
    return chatRoom;
  }

  /**
   * Set up automation for a chat room
   */
  async setupChatAutomation(
    chatRoom: ChatRoom,
    chatRoomType: ChatRoomType,
    contextData: ContextData
  ): Promise<void> {
    const config = this.automationConfigs.get(chatRoomType);
    
    if (!config) {
      console.warn(`No automation config for ${chatRoomType}`);
      return;
    }

    // Send welcome message
    if (config.templates.welcome_message) {
      await this.chatService.sendMessage(chatRoom.id, {
        sender: 'System',
        content: this.interpolateTemplate(config.templates.welcome_message, contextData),
        type: 'system'
      });
    }

    // Send system messages
    if (config.templates.system_messages) {
      for (const message of config.templates.system_messages) {
        await this.chatService.sendMessage(chatRoom.id, {
          sender: 'System',
          content: this.interpolateTemplate(message, contextData),
          type: 'system'
        });
      }
    }

    console.log(`✅ Set up automation for chat room: ${chatRoom.id}`);
  }

  /**
   * Get automation configuration for a chat room type
   */
  getAutomationConfig(chatRoomType: ChatRoomType): AutomationConfig | undefined {
    return this.automationConfigs.get(chatRoomType);
  }

  /**
   * Determine chat room type from trigger event
   */
  private determineChatRoomType(triggerType: string): ChatRoomType | null {
    const triggerMap: { [key: string]: ChatRoomType } = {
      'employee_created': 'hr_onboarding',
      'onboarding_started': 'hr_onboarding',
      'demo_retreat_created': 'cabin_airbnb_demo',
      'cabin_booking_confirmed': 'cabin_airbnb_demo',
      'item_borrowed': 'item_transaction',
      'item_lent': 'item_transaction',
      'transaction_created': 'item_transaction',
      'dispute_created': 'dispute_resolution',
      'dispute_escalated': 'dispute_resolution',
      'investment_hold_created': 'investment_hold',
      'risky_mode_enabled': 'investment_hold',
      'shipping_optimization_available': 'shipstation_optimization',
      'label_refund_processed': 'shipstation_optimization',
      'tax_document_requested': 'tax_document',
      'tax_document_ready': 'tax_document',
      'market_volatility_alert': 'market_monitoring',
      'emergency_protocol_activated': 'market_monitoring',
      'dropshipping_order_created': 'dropshipping',
      'supplier_selected': 'dropshipping',
      'address_estimation_requested': 'address_pii_safety',
      'pii_concern_flagged': 'address_pii_safety',
      'legal_document_requested': 'legal_document',
      'terms_updated': 'legal_document'
    };

    return triggerMap[triggerType] || null;
  }

  /**
   * Determine participants based on config and context
   */
  private determineParticipants(
    config: AutomationConfig,
    triggerEvent: TriggerEvent,
    contextData: ContextData
  ): string[] {
    const participants: string[] = [triggerEvent.userId];

    // Add context-specific participants
    if (contextData.borrower_id) participants.push(contextData.borrower_id);
    if (contextData.owner_id) participants.push(contextData.owner_id);
    if (contextData.hr_representative) participants.push(contextData.hr_representative);
    if (contextData.mediator_id) participants.push(contextData.mediator_id);
    if (contextData.supplier_id) participants.push(contextData.supplier_id);

    // Add default participants from config
    for (const participant of config.participants) {
      if (participant === 'hr_team') participants.push('hr_team_default');
      if (participant === 'csr_team') participants.push('csr_team_default');
      if (participant === 'legal_team') participants.push('legal_team_default');
      if (participant === 'shipping_team') participants.push('shipping_team_default');
    }

    // Remove duplicates
    return Array.from(new Set(participants));
  }

  /**
   * Generate chat room name based on type and context
   */
  private generateChatRoomName(chatRoomType: ChatRoomType, contextData: ContextData): string {
    const nameMap: { [key in ChatRoomType]: string } = {
      'hr_onboarding': `HR Onboarding - ${contextData.employee_name || 'New Employee'}`,
      'cabin_airbnb_demo': `Cabin Retreat - ${contextData.cabin_name || 'Demo Session'}`,
      'item_transaction': `Transaction - ${contextData.item_name || 'Item'} #${contextData.transaction_id || ''}`,
      'dispute_resolution': `Dispute Resolution - Case #${contextData.dispute_id || ''}`,
      'investment_hold': `Investment Hold - ${contextData.investment_type || 'Portfolio'}`,
      'shipstation_optimization': `Shipping Optimization - ${contextData.shipment_id || ''}`,
      'tax_document': `Tax Document - ${contextData.document_type || 'Request'}`,
      'market_monitoring': `Market Alert - ${contextData.alert_type || 'Volatility'}`,
      'dropshipping': `Dropshipping - Order #${contextData.order_id || ''}`,
      'address_pii_safety': `Address Privacy - ${contextData.request_id || ''}`,
      'legal_document': `Legal Document - ${contextData.document_type || 'Request'}`
    };

    return nameMap[chatRoomType] || `Chat Room - ${chatRoomType}`;
  }

  /**
   * Interpolate template with context data
   */
  private interpolateTemplate(template: string, contextData: ContextData): string {
    let result = template;
    
    for (const [key, value] of Object.entries(contextData)) {
      const placeholder = `{${key}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value));
    }
    
    return result;
  }

  /**
   * Trigger chat room creation from event
   */
  async triggerChatRoomCreation(eventType: string, eventData: any, userId: string): Promise<ChatRoom | null> {
    const triggerEvent: TriggerEvent = {
      type: eventType,
      data: eventData,
      userId: userId,
      timestamp: new Date().toISOString()
    };

    try {
      const chatRoom = await this.createContextualChatRoom(triggerEvent, eventData);
      return chatRoom;
    } catch (error) {
      console.error(`Failed to create chat room for event ${eventType}:`, error);
      return null;
    }
  }
}

export default ChatRoomAutomationService;

