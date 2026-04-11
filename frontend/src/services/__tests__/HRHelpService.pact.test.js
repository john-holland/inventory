/**
 * PACT Tests for HR Help Service Provider
 */

import { HRHelpService } from '../HRHelpService';

describe('HR Help Service PACT Tests', () => {
  let hrService;

  beforeEach(() => {
    hrService = HRHelpService.getInstance();
    hrService.resetMockStateForTests();
  });

  test('should get HR help with employee selection', async () => {
    const result = await hrService.getHRHelp('user_001', {
      page: 'documents',
      issues: ['capital_loss_question'],
      documentContext: 'capital_loss_report',
    });

    expect(result.success).toBe(true);
    expect(result.hrEmployeeId).toBeTruthy();
    expect(result.chatRoomId).toBeTruthy();
  });

  test('should find available HR employees', async () => {
    const employees = await hrService.findAvailableHREmployees(new Date().toISOString(), ['documents']);

    expect(employees.length).toBeGreaterThan(0);
    expect(employees[0].id).toBeTruthy();
  });

  test('should create HR help chat', async () => {
    const chat = await hrService.createHRHelpChat('user_001', 'hr_001');

    expect(chat.chat_room_id).toBeTruthy();
    expect(chat.type).toBe('hr_help_1on1');
  });
});
