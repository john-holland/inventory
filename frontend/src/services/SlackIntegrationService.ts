/**
 * Slack Integration Service
 * Mirrors chat rooms to Slack channels and syncs messages bidirectionally
 */

import { ChatRoom, ChatMessage } from './ChatService';

export interface SlackChannel {
  id: string;
  name: string;
  chatRoomId: string;
  slackChannelId: string;
  createdAt: string;
  isActive: boolean;
}

export interface SlackMessage {
  ts: string; // Slack timestamp
  channel: string;
  text: string;
  user: string;
}

export interface SlackConfig {
  botToken: string;
  workspace: string;
  webhookUrl: string;
}

export class SlackIntegrationService {
  private static instance: SlackIntegrationService;
  private slackChannels: Map<string, SlackChannel> = new Map();
  private config: SlackConfig | null = null;

  static getInstance(): SlackIntegrationService {
    if (!SlackIntegrationService.instance) {
      SlackIntegrationService.instance = new SlackIntegrationService();
    }
    return SlackIntegrationService.instance;
  }

  constructor() {
    this.loadConfig();
    console.log('💬 Slack Integration Service initialized');
  }

  /**
   * Load Slack configuration
   */
  private loadConfig() {
    // In production, load from environment variables or secure storage
    this.config = {
      botToken: process.env.REACT_APP_SLACK_BOT_TOKEN || 'mock_token',
      workspace: process.env.REACT_APP_SLACK_WORKSPACE || 'inventory-platform',
      webhookUrl: process.env.REACT_APP_SLACK_WEBHOOK_URL || 'https://hooks.slack.com/services/mock'
    };
  }

  /**
   * Create a Slack channel mirroring a chat room
   */
  async createSlackChannel(chatRoomId: string, chatRoomName: string, participants: string[]): Promise<SlackChannel> {
    console.log(`📡 Creating Slack channel for chat room: ${chatRoomId}`);

    // Generate Slack-friendly channel name
    const slackChannelName = this.generateSlackChannelName(chatRoomName);

    // Mock Slack API call - in production, use actual Slack Web API
    const slackChannelId = await this.callSlackAPI('conversations.create', {
      name: slackChannelName,
      is_private: false
    });

    // Invite participants to Slack channel
    for (const participant of participants) {
      await this.inviteUserToSlackChannel(slackChannelId, participant);
    }

    // Create Slack channel record
    const slackChannel: SlackChannel = {
      id: `slack_${Date.now()}`,
      name: slackChannelName,
      chatRoomId: chatRoomId,
      slackChannelId: slackChannelId,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    this.slackChannels.set(chatRoomId, slackChannel);

    // Send initial message to Slack channel
    await this.sendSlackMessage(slackChannelId, {
      text: `🎉 This channel is mirrored with chat room: ${chatRoomName}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Chat Room Mirror Active*\n\nThis Slack channel is synchronized with the platform chat room: *${chatRoomName}*\n\nMessages sent here will appear in the platform, and vice versa.`
          }
        }
      ]
    });

    console.log(`✅ Created Slack channel: ${slackChannelName} (${slackChannelId})`);
    return slackChannel;
  }

  /**
   * Sync a chat message to Slack
   */
  async syncChatToSlack(chatRoomId: string, message: ChatMessage): Promise<boolean> {
    const slackChannel = this.slackChannels.get(chatRoomId);

    if (!slackChannel || !slackChannel.isActive) {
      console.warn(`No active Slack channel for chat room: ${chatRoomId}`);
      return false;
    }

    try {
      // Format message for Slack
      const slackMessage = this.formatMessageForSlack(message);

      // Send to Slack
      await this.sendSlackMessage(slackChannel.slackChannelId, slackMessage);

      console.log(`✅ Synced message to Slack: ${message.id}`);
      return true;
    } catch (error) {
      console.error(`Failed to sync message to Slack:`, error);
      return false;
    }
  }

  /**
   * Sync a Slack message to chat room
   */
  async syncSlackToChat(slackMessage: SlackMessage, chatRoomId: string): Promise<boolean> {
    try {
      // This would integrate with ChatService to send the message
      console.log(`✅ Synced Slack message to chat room: ${chatRoomId}`);
      return true;
    } catch (error) {
      console.error(`Failed to sync Slack message to chat:`, error);
      return false;
    }
  }

  /**
   * Send user notes/nicknames to Slack
   */
  async syncUserNotesToSlack(userId: string, notes: string, nickname: string): Promise<boolean> {
    try {
      // Find user's Slack ID
      const slackUserId = await this.getSlackUserId(userId);

      if (!slackUserId) {
        console.warn(`No Slack user found for: ${userId}`);
        return false;
      }

      // Update Slack profile
      await this.callSlackAPI('users.profile.set', {
        user: slackUserId,
        profile: {
          display_name: nickname,
          status_text: notes.substring(0, 100) // Slack status text limit
        }
      });

      console.log(`✅ Synced user notes to Slack for: ${userId}`);
      return true;
    } catch (error) {
      console.error(`Failed to sync user notes to Slack:`, error);
      return false;
    }
  }

  /**
   * Get Slack channel for chat room
   */
  getSlackChannel(chatRoomId: string): SlackChannel | undefined {
    return this.slackChannels.get(chatRoomId);
  }

  /**
   * Deactivate Slack channel
   */
  async deactivateSlackChannel(chatRoomId: string): Promise<boolean> {
    const slackChannel = this.slackChannels.get(chatRoomId);

    if (!slackChannel) {
      return false;
    }

    try {
      // Archive Slack channel
      await this.callSlackAPI('conversations.archive', {
        channel: slackChannel.slackChannelId
      });

      slackChannel.isActive = false;
      this.slackChannels.set(chatRoomId, slackChannel);

      console.log(`✅ Deactivated Slack channel: ${slackChannel.slackChannelId}`);
      return true;
    } catch (error) {
      console.error(`Failed to deactivate Slack channel:`, error);
      return false;
    }
  }

  /**
   * Generate Slack-friendly channel name
   */
  private generateSlackChannelName(chatRoomName: string): string {
    // Slack channel names: lowercase, no spaces, hyphens only
    return chatRoomName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 80); // Slack channel name limit
  }

  /**
   * Format chat message for Slack
   */
  private formatMessageForSlack(message: ChatMessage): any {
    const emoji = message.type === 'system' ? '🤖' : '💬';
    
    return {
      text: `${emoji} ${message.sender}: ${message.content}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${message.sender}* (${message.type})\n${message.content}`
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `<!date^${Math.floor(new Date(message.timestamp).getTime() / 1000)}^{date_short_pretty} at {time}|${message.timestamp}>`
            }
          ]
        }
      ]
    };
  }

  /**
   * Send message to Slack channel
   */
  private async sendSlackMessage(channelId: string, message: any): Promise<void> {
    if (!this.config) {
      throw new Error('Slack configuration not loaded');
    }

    // Mock Slack API call - in production, use actual Slack Web API
    console.log(`📤 Sending message to Slack channel: ${channelId}`);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Invite user to Slack channel
   */
  private async inviteUserToSlackChannel(channelId: string, userId: string): Promise<void> {
    const slackUserId = await this.getSlackUserId(userId);
    
    if (!slackUserId) {
      console.warn(`Cannot invite user to Slack: ${userId} (no Slack ID found)`);
      return;
    }

    await this.callSlackAPI('conversations.invite', {
      channel: channelId,
      users: slackUserId
    });

    console.log(`✅ Invited user to Slack channel: ${userId}`);
  }

  /**
   * Get Slack user ID from platform user ID
   */
  private async getSlackUserId(platformUserId: string): Promise<string | null> {
    // Mock implementation - in production, query user mapping database
    // This would map platform user IDs to Slack user IDs
    return `U${platformUserId.substring(0, 10).toUpperCase()}`;
  }

  /**
   * Call Slack API
   */
  private async callSlackAPI(method: string, params: any): Promise<any> {
    if (!this.config) {
      throw new Error('Slack configuration not loaded');
    }

    console.log(`📡 Calling Slack API: ${method}`, params);

    // Mock implementation - in production, use actual Slack Web API
    // Return mock channel ID for conversations.create
    if (method === 'conversations.create') {
      return `C${Date.now().toString(36).toUpperCase()}`;
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return { ok: true };
  }

  /**
   * Set up webhook listener for incoming Slack messages
   */
  setupWebhookListener(callback: (slackMessage: SlackMessage, chatRoomId: string) => void) {
    // In production, this would set up a webhook endpoint to receive Slack events
    console.log('🔗 Slack webhook listener configured');
    
    // Mock webhook listener setup
    // In production, this would be handled by backend webhook endpoint
  }

  /**
   * Send HR help chat notification to Slack
   */
  async notifyHRHelpInSlack(hrEmployeeId: string, requesterId: string, helpContext: string): Promise<boolean> {
    try {
      const slackUserId = await this.getSlackUserId(hrEmployeeId);
      
      if (!slackUserId) {
        return false;
      }

      // Send direct message to HR employee
      await this.callSlackAPI('chat.postMessage', {
        channel: slackUserId,
        text: `🆘 HR Help Request`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*New HR Help Request*\n\nFrom: <@${await this.getSlackUserId(requesterId)}>\nContext: ${helpContext}`
            }
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Open Chat'
                },
                url: `https://platform.example.com/chat?user=${requesterId}`,
                action_id: 'open_chat'
              }
            ]
          }
        ]
      });

      console.log(`✅ Notified HR employee in Slack: ${hrEmployeeId}`);
      return true;
    } catch (error) {
      console.error(`Failed to notify HR employee in Slack:`, error);
      return false;
    }
  }
}

export default SlackIntegrationService;

