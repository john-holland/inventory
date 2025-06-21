# Cursor Guided Tour - Distributed Inventory System

## 🎬 Overview

The Cursor Guided Tour is a comprehensive demonstration system that showcases all features of the Distributed Inventory System using Playwright automation and includes a React Native mobile app for hands-on exploration.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (recommended)
- npm or yarn
- PostgreSQL database
- Modern web browser

### Installation & Setup

```bash
# Clone and setup the project
git clone <repository-url>
cd inventory

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Setup database (if needed)
npm run setup

# Start the guided tour
npm run tour
```

## 🎭 Tour Features

### Automated Web Tour
The Playwright-based tour automatically demonstrates:

1. **Home Page** (`/`)
   - Marketplace toggles (Amazon, eBay, Unsplash)
   - Feature overview
   - Graceful falloff demonstration

2. **Modern Dashboard** (`/dashboard`)
   - Real-time statistics
   - Marketplace preference toggles
   - Chat tab switching
   - Role-based access control

3. **Chat System** (`/chat`)
   - Multi-tab chat interface
   - Message sending simulation
   - Typing indicators
   - Chat tab navigation

4. **HR Dashboard** (`/hr`)
   - Interview management
   - Employee directory
   - Job change requests
   - Modal interactions

5. **Calendar System** (`/calendar`)
   - Multi-view calendar (month/week/day)
   - Event filtering
   - Meeting creation
   - Interview scheduling

6. **Map Interface** (`/map`)
   - Shipping route visualization
   - Interactive controls
   - Route toggles

### Mobile App Tour
The React Native app provides:

- **Dashboard**: Real-time stats and marketplace toggles
- **Inventory**: Item management and search
- **Chat**: Multi-tab chat interface
- **Profile**: User management and settings

## 🎯 Tour Scripts

### Main Tour Command
```bash
npm run tour
```
Runs the complete guided tour including:
- Server startup
- Mobile app launch
- Playwright automation
- Feature demonstrations

### Individual Components
```bash
# Web-only tour
npm run tour:web

# Mobile app only
npm run tour:mobile

# Frontend testing
npm run test:frontend
```

## 📱 Mobile App Features

### Authentication
- Demo login system
- Role-based access
- Ban level restrictions

### Dashboard
- Real-time statistics
- Marketplace toggles
- Recent items display
- User wallet information

### Inventory Management
- Item listing
- Search functionality
- Status indicators
- Item details

### Chat System
- Multi-tab interface
- Role-based chat access
- Message counters
- Chat navigation

### Profile Management
- User information
- Role and ban level display
- Wallet balance
- Logout functionality

## 🎨 Tour Customization

### Timing Configuration
The tour uses 3-second delays between actions for optimal viewing:

```javascript
// In tests/guided-tour.spec.js
await page.waitForTimeout(3000); // 3-second delay
```

### Test Users
The tour includes different user roles and ban levels:

```javascript
const roles = ['user', 'COMPANY_EMPLOYEE', 'COMPANY_HR_EMPLOYEE'];
const banLevels = ['none', 'chat_limit', 'no_chat', 'banned'];
```

### Marketplace Preferences
Demonstrates graceful falloff and toggle functionality:

```javascript
// Toggle marketplace integrations
await amazonToggle.click();
await ebayToggle.click();
await unsplashToggle.click();
```

## 🔧 Technical Details

### Playwright Configuration
```javascript
// playwright.config.js
module.exports = defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    launchOptions: {
      slowMo: 1000, // 1-second delay between actions
    },
  },
  webServer: {
    command: 'npm start',
    url: 'http://localhost:3000/health',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

### Mobile App Structure
```
mobile-app/
├── App.tsx              # Main application
├── package.json         # Dependencies
└── README.md           # Mobile app documentation
```

### Tour Runner
```javascript
// run-guided-tour.js
class GuidedTourRunner {
  async start() {
    await this.startServer();
    await this.startMobileApp();
    await this.runPlaywrightTour();
  }
}
```

## 🎪 Demo Scenarios

### Scenario 1: New User Onboarding
1. User visits home page
2. Toggles marketplace preferences
3. Explores dashboard features
4. Tests chat system
5. Views inventory items

### Scenario 2: Employee Workflow
1. Login with employee role
2. Access corpo chat
3. Use HR dashboard
4. Schedule meetings
5. Manage inventory

### Scenario 3: HR Administrator
1. Login with HR admin role
2. Create interviews
3. Manage employees
4. Handle job changes
5. Access admin features

### Scenario 4: Ban Level Testing
1. Test different ban levels
2. Verify chat restrictions
3. Check feature access
4. Demonstrate role-based permissions

## 📊 Tour Metrics

### Performance Metrics
- **Tour Duration**: ~5-7 minutes
- **Actions Performed**: 50+ automated actions
- **Features Demonstrated**: 15+ major features
- **User Roles Tested**: 3 different roles
- **Ban Levels Tested**: 4 different levels

### Coverage Areas
- ✅ Marketplace integrations
- ✅ Chat system functionality
- ✅ HR workflow management
- ✅ Calendar system
- ✅ Map interface
- ✅ Mobile app features
- ✅ Role-based access control
- ✅ Ban level restrictions

## 🛠️ Troubleshooting

### Common Issues

#### Server Won't Start
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill existing process
kill -9 <PID>

# Restart tour
npm run tour
```

#### Playwright Tests Fail
```bash
# Install browsers
npx playwright install

# Run with debug
npx playwright test --debug

# Check screenshots
open test-results/
```

#### Mobile App Issues
```bash
# Clear Expo cache
cd mobile-app
npx expo start --clear

# Check Expo CLI
npm install -g @expo/cli
```

### Debug Mode
```bash
# Run tour with verbose output
DEBUG=* npm run tour

# Run Playwright in headed mode
npx playwright test --headed --debug
```

## 🎬 Recording the Tour

### Screen Recording
```bash
# Record the tour (macOS)
screenrecord -f ~/Desktop/tour-recording.mp4

# Or use QuickTime Player
# File > New Screen Recording
```

### Screenshot Capture
```bash
# Playwright automatically captures screenshots
# Check test-results/ directory
open test-results/
```

## 📈 Extending the Tour

### Adding New Features
1. Update `tests/guided-tour.spec.js`
2. Add new test scenarios
3. Update mobile app if needed
4. Test the tour locally
5. Update documentation

### Custom Test Users
```javascript
// Add new test users
const testUsers = [
  { role: 'user', banLevel: 'none' },
  { role: 'COMPANY_EMPLOYEE', banLevel: 'none' },
  { role: 'COMPANY_HR_EMPLOYEE', banLevel: 'none' },
  // Add more as needed
];
```

### Mobile App Enhancements
```typescript
// Add new screens to mobile app
const newScreen = () => (
  <View style={styles.container}>
    <Text>New Feature</Text>
  </View>
);
```

## 🎉 Success Criteria

A successful tour demonstrates:

1. **All Features Working**: Every major feature functions correctly
2. **Responsive Design**: Works on desktop and mobile
3. **Role-based Access**: Different permissions work as expected
4. **Ban Level Restrictions**: Chat and feature restrictions apply
5. **Marketplace Integration**: Toggles and falloff work properly
6. **Real-time Updates**: Statistics and data update correctly
7. **Mobile Experience**: App provides good mobile UX
8. **Performance**: Fast loading and smooth interactions

## 📞 Support

### Getting Help
- Check the troubleshooting section
- Review test logs in `test-results/`
- Check server logs for errors
- Verify database connectivity

### Reporting Issues
1. Check if the issue is documented
2. Try the troubleshooting steps
3. Create a detailed bug report
4. Include logs and screenshots

---

**Last Updated**: December 2024
**Version**: 3.0.0
**Status**: Production Ready 