/**
 * Integration Test: Plan #2 ↔ Plan #3 Chat Room Creation
 * Tests fallout scenario triggers Plan #2 chat room automation
 */

import { InvestmentService } from '../../services/InvestmentService';
import { WalletService } from '../../services/WalletService';
import { ChatRoomAutomationService } from '../../services/ChatRoomAutomationService';
import { SlackIntegrationService } from '../../services/SlackIntegrationService';

describe('Plan #2 ↔ Plan #3 Chat Integration', () => {
  let investmentService: InvestmentService;
  let walletService: WalletService;
  let chatService: ChatRoomAutomationService;
  let slackService: SlackIntegrationService;

  beforeEach(() => {
    investmentService = InvestmentService.getInstance();
    walletService = WalletService.getInstance();
    chatService = ChatRoomAutomationService.getInstance();
    slackService = SlackIntegrationService.getInstance();
  });

  test('fallout scenario should trigger chat room creation', async () => {
    console.log('🔗 Testing Plan #2 ↔ Plan #3 Chat Integration');
    
    const itemId = 'chat_integration_item_001';
    const borrowerId = 'borrower_001';
    const ownerId = 'owner_001';
    
    // Step 1: Enable risky investment mode (Plan #3)
    await walletService.processShippingHold(itemId, 40.00);
    await walletService.createInsuranceHold(itemId, 20.00);
    
    const riskPercentage = 60;
    const antiCollateral = await investmentService.calculateAntiCollateral(24.00, riskPercentage);
    await walletService.enableRiskyInvestmentMode(itemId, riskPercentage, antiCollateral);
    
    // Step 2: Simulate fallout scenario (Plan #3)
    const totalLoss = 120.00;
    await investmentService.handleFalloutScenario(itemId, totalLoss);
    
    const falloutData = {
      totalLoss,
      borrowerShare: 30.00, // (40 + 20) / 2
      ownerShare: 30.00,
      shippingRefund: 20.00,
      insuranceRefund: 10.00,
      investmentLoss: 60.00
    };
    
    await walletService.handleFalloutScenario(itemId, falloutData);
    
    // Step 3: Verify dispute chat room created (Plan #2)
    console.log('Step 3: Verifying chat room creation');
    const chatRooms = await chatService.getChatRoomsForContext({
      contextType: 'dispute',
      contextId: itemId
    });
    
    expect(chatRooms.length).toBeGreaterThan(0);
    const disputeChatRoom = chatRooms.find(room => room.contextType === 'dispute');
    
    expect(disputeChatRoom).toBeDefined();
    expect(disputeChatRoom.chat_room_id).toBeTruthy();
    expect(disputeChatRoom.participants).toContain(borrowerId);
    expect(disputeChatRoom.participants).toContain(ownerId);
    
    console.log(`✅ Dispute chat room created: ${disputeChatRoom.chat_room_id}`);
    
    // Step 4: Verify participant assignment
    expect(disputeChatRoom.participants).toHaveLength(3); // borrower, owner, mediator
    expect(disputeChatRoom.automated).toBe(true);
    
    // Step 5: Verify context sharing
    expect(disputeChatRoom.context).toBeDefined();
    expect(disputeChatRoom.context.totalLoss).toBe(120.00);
    expect(disputeChatRoom.context.borrowerShare).toBe(30.00);
    expect(disputeChatRoom.context.ownerShare).toBe(30.00);
    
    // Step 6: Verify Slack mirroring
    const slackSync = await slackService.syncMessageToSlack({
      chatRoomId: disputeChatRoom.chat_room_id,
      message: 'Dispute resolution chat created',
      channelId: '#inventory-dispute'
    });
    
    expect(slackSync.synced).toBe(true);
    expect(slackSync.slackMessageId).toBeTruthy();
    
    // Step 7: Test automatic notifications
    const notifications = await chatService.sendAutomatedNotifications(disputeChatRoom.chat_room_id);
    expect(notifications.sent).toBe(true);
    expect(notifications.recipients).toHaveLength(3);
    
    console.log('✅ Plan #2 ↔ Plan #3 Chat Integration Test Passed');
    
    return {
      itemId,
      chat_room_id: disputeChatRoom.chat_room_id,
      participants: disputeChatRoom.participants,
      slackSynced: slackSync.synced
    };
  });
});

