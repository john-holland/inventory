const { test, expect } = require('@playwright/test');

test.describe('Cursor Guided Tour - Distributed Inventory System', () => {
  test('Complete Feature Tour', async ({ page }) => {
    console.log('🚀 Starting Cursor Guided Tour...');
    
    // Navigate to home page
    await page.goto('/');
    console.log('📍 Landing on home page');
    await page.waitForTimeout(3000);
    
    // Test marketplace toggles
    console.log('🛍️ Testing marketplace toggles...');
    const amazonToggle = page.locator('[onclick*="amazon"]');
    const ebayToggle = page.locator('[onclick*="ebay"]');
    const unsplashToggle = page.locator('[onclick*="unsplash"]');
    
    await amazonToggle.click();
    console.log('✅ Toggled Amazon');
    await page.waitForTimeout(3000);
    
    await ebayToggle.click();
    console.log('✅ Toggled eBay');
    await page.waitForTimeout(3000);
    
    await unsplashToggle.click();
    console.log('✅ Toggled Unsplash');
    await page.waitForTimeout(3000);
    
    // Navigate to dashboard
    console.log('📊 Navigating to dashboard...');
    await page.click('text=Open Dashboard');
    await page.waitForURL('**/dashboard');
    await page.waitForTimeout(3000);
    
    // Test dashboard features
    console.log('🎛️ Testing dashboard features...');
    
    // Test marketplace toggles on dashboard
    const dashboardAmazonToggle = page.locator('#amazonToggle');
    const dashboardEbayToggle = page.locator('#ebayToggle');
    const dashboardUnsplashToggle = page.locator('#unsplashToggle');
    
    await dashboardAmazonToggle.click();
    console.log('✅ Dashboard: Toggled Amazon');
    await page.waitForTimeout(3000);
    
    await dashboardEbayToggle.click();
    console.log('✅ Dashboard: Toggled eBay');
    await page.waitForTimeout(3000);
    
    await dashboardUnsplashToggle.click();
    console.log('✅ Dashboard: Toggled Unsplash');
    await page.waitForTimeout(3000);
    
    // Test chat tabs
    console.log('💬 Testing chat tabs...');
    const chatTabs = page.locator('.chat-tab');
    const tabCount = await chatTabs.count();
    
    for (let i = 0; i < Math.min(tabCount, 3); i++) {
      await chatTabs.nth(i).click();
      console.log(`✅ Clicked chat tab ${i + 1}`);
      await page.waitForTimeout(3000);
    }
    
    // Navigate to chat system
    console.log('💬 Navigating to chat system...');
    await page.click('text=Open Chat');
    await page.waitForURL('**/chat');
    await page.waitForTimeout(3000);
    
    // Test chat features
    console.log('💬 Testing chat features...');
    
    // Test chat tabs
    const chatSystemTabs = page.locator('.chat-tab');
    const chatTabCount = await chatSystemTabs.count();
    
    for (let i = 0; i < Math.min(chatTabCount, 2); i++) {
      await chatSystemTabs.nth(i).click();
      console.log(`✅ Chat system: Clicked tab ${i + 1}`);
      await page.waitForTimeout(3000);
    }
    
    // Test message input
    const messageInput = page.locator('#messageInput');
    await messageInput.fill('Hello from the guided tour!');
    console.log('✅ Typed test message');
    await page.waitForTimeout(3000);
    
    // Send message
    await page.click('button:has-text("Send")');
    console.log('✅ Sent test message');
    await page.waitForTimeout(3000);
    
    // Navigate to HR system
    console.log('👥 Navigating to HR system...');
    await page.click('text=HR System');
    await page.waitForURL('**/hr');
    await page.waitForTimeout(3000);
    
    // Test HR features
    console.log('👥 Testing HR features...');
    
    // Test tabs
    const hrTabs = page.locator('.tab');
    await hrTabs.nth(1).click(); // Employees tab
    console.log('✅ HR: Switched to Employees tab');
    await page.waitForTimeout(3000);
    
    await hrTabs.nth(2).click(); // Job Changes tab
    console.log('✅ HR: Switched to Job Changes tab');
    await page.waitForTimeout(3000);
    
    await hrTabs.nth(3).click(); // HR Changes tab
    console.log('✅ HR: Switched to HR Changes tab');
    await page.waitForTimeout(3000);
    
    await hrTabs.nth(0).click(); // Back to Interviews tab
    console.log('✅ HR: Back to Interviews tab');
    await page.waitForTimeout(3000);
    
    // Test create interview modal
    await page.click('button:has-text("Create Interview")');
    console.log('✅ HR: Opened create interview modal');
    await page.waitForTimeout(3000);
    
    // Fill interview form
    await page.fill('input[type="email"]', 'candidate@example.com');
    await page.fill('input[type="text"]', 'Software Engineer');
    await page.selectOption('select', '1');
    console.log('✅ HR: Filled interview form');
    await page.waitForTimeout(3000);
    
    // Close modal
    await page.click('button:has-text("Cancel")');
    console.log('✅ HR: Closed interview modal');
    await page.waitForTimeout(3000);
    
    // Navigate to calendar
    console.log('📅 Navigating to calendar...');
    await page.click('text=Calendar System');
    await page.waitForURL('**/calendar');
    await page.waitForTimeout(3000);
    
    // Test calendar features
    console.log('📅 Testing calendar features...');
    
    // Test view buttons
    const viewButtons = page.locator('.calendar-nav .btn');
    await viewButtons.nth(1).click(); // Week view
    console.log('✅ Calendar: Switched to week view');
    await page.waitForTimeout(3000);
    
    await viewButtons.nth(2).click(); // Day view
    console.log('✅ Calendar: Switched to day view');
    await page.waitForTimeout(3000);
    
    await viewButtons.nth(0).click(); // Back to month view
    console.log('✅ Calendar: Back to month view');
    await page.waitForTimeout(3000);
    
    // Test event filters
    const eventFilters = page.locator('.event-filter');
    await eventFilters.nth(1).click(); // Toggle interviews
    console.log('✅ Calendar: Toggled interview filter');
    await page.waitForTimeout(3000);
    
    await eventFilters.nth(2).click(); // Toggle cron jobs
    console.log('✅ Calendar: Toggled cron filter');
    await page.waitForTimeout(3000);
    
    // Test create meeting modal
    await page.click('button:has-text("Create Meeting")');
    console.log('✅ Calendar: Opened create meeting modal');
    await page.waitForTimeout(3000);
    
    // Fill meeting form
    await page.fill('input[type="text"]', 'Team Standup');
    await page.selectOption('select', 'internal');
    console.log('✅ Calendar: Filled meeting form');
    await page.waitForTimeout(3000);
    
    // Close modal
    await page.click('button:has-text("Cancel")');
    console.log('✅ Calendar: Closed meeting modal');
    await page.waitForTimeout(3000);
    
    // Navigate to map
    console.log('🗺️ Navigating to map...');
    await page.click('text=Map Interface');
    await page.waitForURL('**/map');
    await page.waitForTimeout(3000);
    
    // Test map features
    console.log('🗺️ Testing map features...');
    
    // Test map controls
    const mapControls = page.locator('.map-controls button');
    const controlCount = await mapControls.count();
    
    for (let i = 0; i < Math.min(controlCount, 3); i++) {
      await mapControls.nth(i).click();
      console.log(`✅ Map: Clicked control ${i + 1}`);
      await page.waitForTimeout(3000);
    }
    
    // Test route toggles
    const routeToggles = page.locator('.route-toggle');
    const toggleCount = await routeToggles.count();
    
    for (let i = 0; i < Math.min(toggleCount, 2); i++) {
      await routeToggles.nth(i).click();
      console.log(`✅ Map: Toggled route ${i + 1}`);
      await page.waitForTimeout(3000);
    }
    
    // Navigate back to home
    console.log('🏠 Returning to home...');
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // Test responsive design
    console.log('📱 Testing responsive design...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(3000);
    
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(3000);
    
    console.log('🎉 Guided tour completed successfully!');
    
    // Take final screenshot
    await page.screenshot({ path: 'test-results/guided-tour-complete.png', fullPage: true });
    console.log('📸 Final screenshot saved');
  });
  
  test('Test User Authentication Flow', async ({ page }) => {
    console.log('🔐 Testing authentication flow...');
    
    await page.goto('/dashboard');
    await page.waitForTimeout(3000);
    
    // Simulate different user roles
    const roles = ['user', 'COMPANY_EMPLOYEE', 'COMPANY_HR_EMPLOYEE'];
    
    for (const role of roles) {
      console.log(`👤 Testing role: ${role}`);
      
      // Simulate role change (in real app, this would be via API)
      await page.evaluate((userRole) => {
        window.localStorage.setItem('userRole', userRole);
        // Trigger role change event
        window.dispatchEvent(new CustomEvent('roleChange', { detail: { role: userRole } }));
      }, role);
      
      await page.waitForTimeout(3000);
      
      // Check if appropriate features are visible
      if (role.includes('EMPLOYEE')) {
        const corpoChatTab = page.locator('#corpoChatTab');
        await expect(corpoChatTab).toBeVisible();
        console.log(`✅ ${role}: Corpo chat visible`);
      }
      
      await page.waitForTimeout(3000);
    }
  });
  
  test('Test Ban Level Restrictions', async ({ page }) => {
    console.log('🚫 Testing ban level restrictions...');
    
    await page.goto('/chat');
    await page.waitForTimeout(3000);
    
    const banLevels = ['none', 'chat_limit', 'no_chat', 'banned'];
    
    for (const banLevel of banLevels) {
      console.log(`🚫 Testing ban level: ${banLevel}`);
      
      // Simulate ban level change
      await page.evaluate((level) => {
        window.localStorage.setItem('banLevel', level);
        window.dispatchEvent(new CustomEvent('banLevelChange', { detail: { level } }));
      }, banLevel);
      
      await page.waitForTimeout(3000);
      
      // Check chat access based on ban level
      if (banLevel === 'no_chat' || banLevel === 'banned') {
        const chatContainer = page.locator('.chat-container');
        await expect(chatContainer).not.toBeVisible();
        console.log(`✅ ${banLevel}: Chat properly restricted`);
      } else {
        const chatContainer = page.locator('.chat-container');
        await expect(chatContainer).toBeVisible();
        console.log(`✅ ${banLevel}: Chat accessible`);
      }
      
      await page.waitForTimeout(3000);
    }
  });
}); 