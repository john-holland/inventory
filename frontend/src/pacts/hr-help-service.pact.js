/**
 * PACT Contract: HR Help Service API Provider
 * Defines contracts for HR help integration with calendar scheduler
 */

const { Pact } = require('@pact-foundation/pact');
const path = require('path');

describe('HR Help Service API PACT Contract', () => {
  const provider = new Pact({
    consumer: 'Frontend',
    provider: 'HR Help Service API',
    port: 1237,
    log: path.resolve(process.cwd(), 'logs', 'hr_help_pact.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2
  });

  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  describe('Get HR Help', () => {
    test('should get HR help with employee selection', async () => {
      await provider
        .given('user needs HR help for tax document')
        .uponReceiving('a request to get HR help')
        .withRequest({
          method: 'POST',
          path: '/api/hr/get-help',
          headers: { 'Content-Type': 'application/json' },
          body: {
            userId: 'user_001',
            context: {
              page: 'documents',
              issues: ['capital_loss_question', 'tax_form_help']
            }
          }
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            success: true,
            hrEmployeeId: 'hr_employee_001',
            hrEmployeeName: 'Sarah Johnson',
            chatRoomId: 'chat_hr_help_001',
            nextAvailableSlot: '2024-02-15T14:00:00Z'
          }
        });
    });
  });

  describe('Available HR Employees', () => {
    test('should return available HR employees', async () => {
      await provider
        .given('HR employees exist and calendar is integrated')
        .uponReceiving('a request for available HR employees')
        .withRequest({
          method: 'GET',
          path: '/api/hr/available-employees',
          headers: { 'Accept': 'application/json' }
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            availableEmployees: [
              { id: 'hr_employee_001', name: 'Sarah Johnson', available: true },
              { id: 'hr_employee_002', name: 'Mike Chen', available: false },
              { id: 'hr_employee_003', name: 'Emma Wilson', available: true }
            ],
            count: 2
          }
        });
    });
  });

  describe('Create HR Help Chat', () => {
    test('should create HR help chat room', async () => {
      await provider
        .given('HR employee is available')
        .uponReceiving('a request to create HR help chat')
        .withRequest({
          method: 'POST',
          path: '/api/hr/create-chat',
          headers: { 'Content-Type': 'application/json' },
          body: {
            userId: 'user_001',
            hrEmployeeId: 'hr_employee_001',
            context: {
              page: 'documents',
              issues: ['capital_loss_question']
            }
          }
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            chatRoomId: 'chat_hr_help_001',
            type: 'hr_help_1on1',
            participants: ['user_001', 'hr_employee_001'],
            slackChannel: '#hr-help-direct'
          }
        });
    });
  });
});

