/**
 * PACT Tests for Chat Room Automation Provider
 */

import { ChatRoomAutomationService } from '../ChatRoomAutomationService';
import { SlackIntegrationService } from '../SlackIntegrationService';

describe('Chat Room Automation PACT Tests', () => {
  let chatService: ChatRoomAutomationService;
  let slackService: SlackIntegrationService;

  beforeEach(() => {
    chatService = ChatRoomAutomationService.getInstance();
    slackService = SlackIntegrationService.getInstance();
  });

  test('should create HR onboarding chat room', async () => {
    const chatRoom = await chatService.createContextualChatRoom({
      contextType: 'hr_onboarding',
      participantIds: ['employee_001', 'hr_employee_001'],
      automated: true
    });

    expect(chatRoom.chat_room_id).toBeTruthy();
    expect(chatRoom.type).toBe('hr_onboarding');
  });

  test('should create dispute resolution chat room', async () => {
    const chatRoom = await chatService.createContextualChatRoom({
      contextType: 'dispute',
      participantIds: ['borrower_001', 'owner_001', 'mediator_001'],
      automated: true
    });

    expect(chatRoom.chat_room_id).toBeTruthy();
    expect(chatRoom.type).toBe('dispute');
    expect(chatRoom.participants).toHaveLength(3);
  });

  test('should sync message to Slack', async () => {
    const result = await slackService.syncMessageToSlack({
      chatRoomId: 'chat_dispute_001',
      message: 'Dispute resolution initiated',
      channelId: '#inventory-dispute'
    });

    expect(result.synced).toBe(true);
    expect(result.slackMessageId).toBeTruthy();
  });
});

