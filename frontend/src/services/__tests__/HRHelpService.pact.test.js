/**
 * PACT Tests for HR Help Service Provider
 */

import { HRHelpService } from '../HRHelpService';

describe('HR Help Service PACT Tests', () => {
  let hrService: HRHelpService;

  beforeEach(() => {
    hrService = HRHelpService.getInstance();
  });

  test('should get HR help with employee selection', async () => {
    const result = await hrService.getHrHelp('user_001', {
      page: 'documents',
      issues: ['capital_loss_question']
    });

    expect(result.success).toBe(true);
    expect(result.hrEmployeeId).toBeTruthy();
    expect(result.chatRoomId).toBeTruthy();
  });

  test('should find available HR employees', async () => {
    const employees = await hrService.findAvailableHrEmployees();

    expect(employees.length).toBeGreaterThan(0);
    expect(employees[0].available).toBe(true);
  });

  test('should create HR help chat', async () => {
    const chat = await hrService.createHrHelpChat('user_001', 'hr_employee_001');

    expect(chat.chat_room_id).toBeTruthy();
    expect(chat.type).toBe('hr_help_1on1');
  });
});

