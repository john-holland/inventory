/** @jest-environment node */
/**
 * PACT Contract: HR Help Service API Provider (legacy REST mock).
 */

const { Matchers } = require('@pact-foundation/pact');
const { getJson, postJson } = require('./pactHttp');
const { createPactHarness } = require('./pactTestHarness');

const harness = createPactHarness({
  consumer: 'Frontend',
  provider: 'HR Help Service API',
  logName: 'hr_help_pact',
});

describe('HR Help Service API PACT Contract', () => {
  beforeAll(() => {
    harness.resetPactFile();
  });

  beforeEach(async () => {
    await harness.setup();
  });

  afterEach(async () => {
    await harness.verify();
  });

  afterAll(async () => {
    await harness.finalize();
  });

  test('should get HR help with employee selection', async () => {
    await harness.provider.addInteraction({
      state: 'user needs HR help for tax document',
      uponReceiving: 'a request to get HR help',
      withRequest: {
        method: 'POST',
        path: '/api/hr/get-help',
        headers: { 'Content-Type': 'application/json' },
        body: {
          userId: Matchers.like('user_001'),
          context: {
            page: 'documents',
            issues: ['capital_loss_question', 'tax_form_help'],
          },
        },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: true,
          hrEmployeeId: Matchers.like('hr_employee_001'),
          hrEmployeeName: Matchers.like('Sarah Johnson'),
          chatRoomId: Matchers.like('chat_hr_help_001'),
          nextAvailableSlot: Matchers.like('2024-02-15T14:00:00Z'),
        },
      },
    });

    const res = await postJson(harness.port, '/api/hr/get-help', {
      userId: 'user_001',
      context: { page: 'documents', issues: ['capital_loss_question', 'tax_form_help'] },
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.hrEmployeeId).toBeTruthy();
  });

  test('should return available HR employees', async () => {
    await harness.provider.addInteraction({
      state: 'HR employees exist and calendar is integrated',
      uponReceiving: 'a request for available HR employees',
      withRequest: {
        method: 'GET',
        path: '/api/hr/available-employees',
        headers: { Accept: 'application/json' },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          availableEmployees: Matchers.eachLike(
            { id: Matchers.like('hr_employee_001'), name: Matchers.like('Sarah Johnson'), available: true },
            { min: 1 }
          ),
          count: Matchers.like(2),
        },
      },
    });

    const res = await getJson(harness.port, '/api/hr/available-employees', { Accept: 'application/json' });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.availableEmployees)).toBe(true);
  });

  test('should create HR help chat room', async () => {
    await harness.provider.addInteraction({
      state: 'HR employee is available',
      uponReceiving: 'a request to create HR help chat',
      withRequest: {
        method: 'POST',
        path: '/api/hr/create-chat',
        headers: { 'Content-Type': 'application/json' },
        body: {
          userId: Matchers.like('user_001'),
          hrEmployeeId: Matchers.like('hr_employee_001'),
          context: { page: 'documents', issues: ['capital_loss_question'] },
        },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          chatRoomId: Matchers.like('chat_hr_help_001'),
          type: 'hr_help_1on1',
          participants: ['user_001', 'hr_employee_001'],
          slackChannel: Matchers.like('#hr-help-direct'),
        },
      },
    });

    const res = await postJson(harness.port, '/api/hr/create-chat', {
      userId: 'user_001',
      hrEmployeeId: 'hr_employee_001',
      context: { page: 'documents', issues: ['capital_loss_question'] },
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.chatRoomId).toBeTruthy();
  });
});
