/**
 * PACT Contract: Chat Room Automation API Provider
 * Defines contracts for chat room automation service
 */

const { Pact } = require('@pact-foundation/pact');
const path = require('path');

describe('Chat Room Automation API PACT Contract', () => {
  const provider = new Pact({
    consumer: 'Frontend',
    provider: 'Chat Room Automation API',
    port: 1235,
    log: path.resolve(process.cwd(), 'logs', 'chat_automation_pact.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2
  });

  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  describe('Contextual Chat Room Creation', () => {
    test('should create contextual chat room for HR', async () => {
      await provider
        .given('new employee onboarding triggered')
        .uponReceiving('a request to create HR onboarding chat room')
        .withRequest({
          method: 'POST',
          path: '/api/chat/create-contextual',
          headers: { 'Content-Type': 'application/json' },
          body: {
            contextType: 'hr_onboarding',
            participantIds: ['employee_001', 'hr_employee_001'],
            automated: true,
            context: {
              employeeName: 'Jane Doe',
              department: 'Engineering',
              startDate: '2024-02-15'
            }
          }
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            chatRoomId: 'chat_hr_onboarding_001',
            type: 'hr_onboarding',
            participants: ['employee_001', 'hr_employee_001'],
            automated: true,
            contextType: 'hr_onboarding',
            createdAt: '2024-01-15T10:00:00Z'
          }
        });
    });

    test('should create contextual chat room for dispute resolution', async () => {
      await provider
        .given('investment fallout scenario triggered')
        .uponReceiving('a request to create dispute resolution chat room')
        .withRequest({
          method: 'POST',
          path: '/api/chat/create-contextual',
          headers: { 'Content-Type': 'application/json' },
          body: {
            contextType: 'dispute',
            participantIds: ['borrower_001', 'owner_001', 'mediator_001'],
            automated: true,
            context: {
              itemId: 'item_001',
              totalLoss: 100.00,
              borrowerShare: 25.00,
              ownerShare: 25.00
            }
          }
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            chatRoomId: 'chat_dispute_001',
            type: 'dispute',
            participants: ['borrower_001', 'owner_001', 'mediator_001'],
            automated: true,
            contextType: 'dispute',
            createdAt: '2024-01-15T10:00:00Z'
          }
        });
    });
  });

  describe('Chat Automation Setup', () => {
    test('should setup chat automation', async () => {
      await provider
        .given('user wants to enable chat automation')
        .uponReceiving('a request to setup chat automation')
        .withRequest({
          method: 'POST',
          path: '/api/chat/automation/setup',
          headers: { 'Content-Type': 'application/json' },
          body: {
            feature: 'investment_fallout',
            triggers: ['market_downturn', 'investment_loss'],
            autoCreateChat: true
          }
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            success: true,
            feature: 'investment_fallout',
            automationEnabled: true
          }
        });
    });
  });

  describe('Slack Integration', () => {
    test('should sync message to Slack', async () => {
      await provider
        .given('chat message sent in chat room')
        .uponReceiving('a request to sync message to Slack')
        .withRequest({
          method: 'POST',
          path: '/api/chat/slack/sync',
          headers: { 'Content-Type': 'application/json' },
          body: {
            chatRoomId: 'chat_dispute_001',
            message: 'Dispute resolution initiated',
            channelId: '#inventory-dispute'
          }
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            synced: true,
            slackMessageId: 'slack_msg_123456',
            channelId: '#inventory-dispute'
          }
        });
    });
  });
});

