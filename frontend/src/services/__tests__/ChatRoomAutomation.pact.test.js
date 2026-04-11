/**
 * PACT Tests for Chat Room Automation Provider
 */

import { ChatRoomAutomationService } from '../ChatRoomAutomationService';
import { SlackIntegrationService } from '../SlackIntegrationService';

describe('Chat Room Automation PACT Tests', () => {
  let chatService;
  let slackService;

  beforeEach(() => {
    chatService = ChatRoomAutomationService.getInstance();
    slackService = SlackIntegrationService.getInstance();
  });

  test('should create HR onboarding chat room', async () => {
    const chatRoom = await chatService.createContextualChatRoom(
      {
        type: 'employee_created',
        data: {},
        userId: 'employee_001',
        timestamp: new Date().toISOString(),
      },
      {
        employee_name: 'Alice',
        hr_representative: 'hr_employee_001',
      }
    );

    expect(chatRoom.id).toBeTruthy();
    expect(chatRoom.participants.length).toBeGreaterThan(0);
  });

  test('should create dispute resolution chat room', async () => {
    const chatRoom = await chatService.createContextualChatRoom(
      {
        type: 'dispute_created',
        data: {},
        userId: 'borrower_001',
        timestamp: new Date().toISOString(),
      },
      {
        borrower_id: 'borrower_001',
        owner_id: 'owner_001',
        mediator_id: 'mediator_001',
        dispute_id: 'd-1',
      }
    );

    expect(chatRoom.id).toBeTruthy();
    expect(chatRoom.participants.length).toBeGreaterThanOrEqual(2);
  });

  test('should sync message to Slack', async () => {
    await slackService.createSlackChannel('chat_dispute_001', 'Dispute chat', ['u1', 'u2']);
    const synced = await slackService.syncChatToSlack('chat_dispute_001', {
      id: 'm1',
      sender: 'System',
      content: 'Dispute resolution initiated',
      timestamp: new Date().toISOString(),
      type: 'system',
    });

    expect(synced).toBe(true);
  });
});

