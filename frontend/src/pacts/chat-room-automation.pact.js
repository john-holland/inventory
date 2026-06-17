/** @jest-environment node */

const { Matchers } = require('@pact-foundation/pact');
const { postJson } = require('./pactHttp');
const { createPactHarness } = require('./pactTestHarness');

const harness = createPactHarness({
  consumer: 'Frontend',
  provider: 'Chat Room Automation API',
  logName: 'chat_automation_pact',
});

describe('Chat Room Automation API PACT Contract', () => {
  beforeAll(() => harness.resetPactFile());
  beforeEach(async () => harness.setup());
  afterEach(async () => harness.verify());
  afterAll(async () => harness.finalize());

  test('should create contextual chat room for HR', async () => {
    await harness.provider.addInteraction({
      state: 'new employee onboarding triggered',
      uponReceiving: 'a request to create HR onboarding chat room',
      withRequest: {
        method: 'POST',
        path: '/api/chat/create-contextual',
        headers: { 'Content-Type': 'application/json' },
        body: {
          contextType: 'hr_onboarding',
          participantIds: ['employee_001', 'hr_employee_001'],
          automated: true,
          context: {
            employeeName: Matchers.like('Jane Doe'),
            department: 'Engineering',
            startDate: '2024-02-15',
          },
        },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          chatRoomId: Matchers.like('chat_hr_onboarding_001'),
          type: 'hr_onboarding',
          participants: ['employee_001', 'hr_employee_001'],
          automated: true,
          contextType: 'hr_onboarding',
          createdAt: Matchers.like('2024-01-15T10:00:00Z'),
        },
      },
    });

    const res = await postJson(harness.port, '/api/chat/create-contextual', {
      contextType: 'hr_onboarding',
      participantIds: ['employee_001', 'hr_employee_001'],
      automated: true,
      context: { employeeName: 'Jane Doe', department: 'Engineering', startDate: '2024-02-15' },
    });
    expect(res.status).toBe(200);
    expect((await res.json()).type).toBe('hr_onboarding');
  });

  test('should create contextual chat room for dispute resolution', async () => {
    await harness.provider.addInteraction({
      state: 'investment fallout scenario triggered',
      uponReceiving: 'a request to create dispute resolution chat room',
      withRequest: {
        method: 'POST',
        path: '/api/chat/create-contextual',
        headers: { 'Content-Type': 'application/json' },
        body: {
          contextType: 'dispute',
          participantIds: ['borrower_001', 'owner_001', 'mediator_001'],
          automated: true,
          context: {
            itemId: Matchers.like('item_001'),
            totalLoss: 100.0,
            borrowerShare: 25.0,
            ownerShare: 25.0,
          },
        },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          chatRoomId: Matchers.like('chat_dispute_001'),
          type: 'dispute',
          participants: ['borrower_001', 'owner_001', 'mediator_001'],
          automated: true,
          contextType: 'dispute',
          createdAt: Matchers.like('2024-01-15T10:00:00Z'),
        },
      },
    });

    const res = await postJson(harness.port, '/api/chat/create-contextual', {
      contextType: 'dispute',
      participantIds: ['borrower_001', 'owner_001', 'mediator_001'],
      automated: true,
      context: { itemId: 'item_001', totalLoss: 100.0, borrowerShare: 25.0, ownerShare: 25.0 },
    });
    expect(res.status).toBe(200);
    expect((await res.json()).type).toBe('dispute');
  });

  test('should setup chat automation', async () => {
    await harness.provider.addInteraction({
      state: 'user wants to enable chat automation',
      uponReceiving: 'a request to setup chat automation',
      withRequest: {
        method: 'POST',
        path: '/api/chat/automation/setup',
        headers: { 'Content-Type': 'application/json' },
        body: {
          feature: 'investment_fallout',
          triggers: ['market_downturn', 'investment_loss'],
          autoCreateChat: true,
        },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: true,
          feature: 'investment_fallout',
          automationEnabled: true,
        },
      },
    });

    const res = await postJson(harness.port, '/api/chat/automation/setup', {
      feature: 'investment_fallout',
      triggers: ['market_downturn', 'investment_loss'],
      autoCreateChat: true,
    });
    expect(res.status).toBe(200);
    expect((await res.json()).automationEnabled).toBe(true);
  });

  test('should sync message to Slack', async () => {
    await harness.provider.addInteraction({
      state: 'chat message sent in chat room',
      uponReceiving: 'a request to sync message to Slack',
      withRequest: {
        method: 'POST',
        path: '/api/chat/slack/sync',
        headers: { 'Content-Type': 'application/json' },
        body: {
          chatRoomId: Matchers.like('chat_dispute_001'),
          message: Matchers.like('Dispute resolution initiated'),
          channelId: '#inventory-dispute',
        },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          synced: true,
          slackMessageId: Matchers.like('slack_msg_123456'),
          channelId: '#inventory-dispute',
        },
      },
    });

    const res = await postJson(harness.port, '/api/chat/slack/sync', {
      chatRoomId: 'chat_dispute_001',
      message: 'Dispute resolution initiated',
      channelId: '#inventory-dispute',
    });
    expect(res.status).toBe(200);
    expect((await res.json()).synced).toBe(true);
  });
});
