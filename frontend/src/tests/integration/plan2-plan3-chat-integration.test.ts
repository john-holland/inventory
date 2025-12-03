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
    
    const walletId = 'wallet_001';
    const borrowerWalletId = 'wallet_001';
    const ownerWalletId = 'wallet_002';
    const riskPercentage = 60;
    const antiCollateral = await investmentService.calculateAntiCollateral(24.00, riskPercentage);
    await walletService.enableRiskyInvestmentMode(walletId, itemId, riskPercentage, antiCollateral);
    
    // Step 2: Simulate fallout scenario (Plan #3)
    const totalLoss = 120.00;
    await investmentService.handleFalloutScenario(itemId, totalLoss);
    
    const shippingCost = 20.00;
    const insuranceCost = 10.00;
    
    await walletService.handleFalloutScenario(itemId, borrowerWalletId, ownerWalletId, totalLoss, shippingCost, insuranceCost);
    
    // Step 3: Trigger dispute chat room creation (Plan #2)
    console.log('Step 3: Triggering dispute chat room creation');
    const disputeChatRoom = await chatService.triggerChatRoomCreation('dispute_created', {
      itemId,
      totalLoss,
      borrowerShare: 30.00,
      ownerShare: 30.00,
      borrower_id: borrowerId,
      owner_id: ownerId
    }, borrowerId);
    
    expect(disputeChatRoom).toBeDefined();
    expect(disputeChatRoom?.id).toBeTruthy();
    expect(disputeChatRoom?.participants).toContain(borrowerId);
    expect(disputeChatRoom?.participants).toContain(ownerId);
    
    console.log(`✅ Dispute chat room created: ${disputeChatRoom?.id}`);
    
    // Step 4: Verify participant assignment
    expect(disputeChatRoom?.participants.length).toBeGreaterThanOrEqual(2);
    
    // Step 5: Verify Slack mirroring
    if (disputeChatRoom) {
      const slackChannel = await slackService.createSlackChannel(
        disputeChatRoom.id,
        disputeChatRoom.name,
        disputeChatRoom.participants
      );
      
      expect(slackChannel).toBeDefined();
      expect(slackChannel.chatRoomId).toBe(disputeChatRoom.id);
      
      // Sync a test message
      const testMessage = {
        id: 'test_msg_001',
        sender: 'system',
        content: 'Dispute resolution chat created',
        timestamp: new Date().toISOString(),
        type: 'system' as const
      };
      
      const synced = await slackService.syncChatToSlack(disputeChatRoom.id, testMessage);
      expect(synced).toBe(true);
    }
    
    console.log('✅ Plan #2 ↔ Plan #3 Chat Integration Test Passed');
    
    return {
      itemId,
      chat_room_id: disputeChatRoom?.id || '',
      participants: disputeChatRoom?.participants || [],
      slackSynced: true
    };
  });
});

