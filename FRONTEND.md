# Frontend Documentation

## Overview

The Distributed Inventory System now features a comprehensive, modern frontend with multiple interconnected interfaces designed for optimal user experience and business operations.

## 🎨 Design System

### Color Palette
- **Primary**: `#667eea` (Blue gradient)
- **Secondary**: `#764ba2` (Purple)
- **Success**: `#10b981` (Green)
- **Warning**: `#f59e0b` (Orange)
- **Danger**: `#ef4444` (Red)
- **Dark**: `#1f2937` (Dark gray)
- **Light**: `#f9fafb` (Light gray)

### Typography
- **Font**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700
- **Icons**: Font Awesome 6.0.0

## 📱 Pages & Features

### 1. Home Page (`/`)
**File**: `public/index.html`

**Features**:
- Hero section with system overview
- Marketplace toggles (Amazon, eBay, Unsplash)
- Feature cards linking to all major systems
- Real-time stats display
- Responsive design

**Key Elements**:
- Marketplace preference toggles with graceful falloff
- Quick access to all major features
- System statistics overview

### 2. Modern Dashboard (`/dashboard`)
**File**: `public/dashboard-modern.html`

**Features**:
- **Marketplace Toggles**: Enable/disable Amazon, eBay, Unsplash with graceful falloff
- **Chat Tabs**: Conditional access based on user role and ban level
- **Real-time Stats**: Active holds, revenue, investment robots, water level
- **Feature Grid**: Quick access to all system features
- **Ban Level Display**: Visual indicator of user restrictions

**Ban Levels**:
- `none`: Full access
- `chat_limit`: Limited chat access
- `no_chat`: No chat access
- `banned`: Full system ban

**Role-based Access**:
- `user`: Basic access
- `COMPANY_EMPLOYEE`: Access to corpo chat
- `COMPANY_HR_EMPLOYEE`: HR features
- `COMPANY_HR_ADMIN`: Full HR access

### 3. Chat System (`/chat`)
**File**: `public/chat.html`

**Features**:
- **Multi-tab Interface**: Herd, Corpo, Group, Direct chats
- **Real-time Messaging**: Simulated with typing indicators
- **Message Actions**: Like, reply, edit, delete
- **File Attachments**: Paperclip functionality
- **Emoji Support**: Smile button
- **Responsive Design**: Mobile-friendly

**Chat Types**:
- **Herd Chat**: Public chat for all users
- **Corpo Chat**: Company-wide chat (employees only)
- **Group Chats**: Team-specific discussions
- **Direct Messages**: Private conversations

**Message Features**:
- Message retention policies (TTL 3 months for herd, indefinite for others)
- Typing indicators
- Message timestamps
- User avatars
- Message actions (like, reply, edit, delete)

### 4. HR Dashboard (`/hr`)
**File**: `public/hr.html`

**Features**:
- **Interview Management**: Create, schedule, track interviews
- **Employee Directory**: View and manage employees
- **Job Change Requests**: Handle promotions and role changes
- **HR Change Requests**: Address and personal info updates
- **Statistics Dashboard**: Hiring metrics and employee stats

**Interview Features**:
- Multi-round interview scheduling
- Google Meet integration
- Interview question management
- Internal/external requirement tracking
- Available datetime selection

**Employee Management**:
- Employee profiles
- Role and department tracking
- Hire date management
- Status monitoring

### 5. Calendar System (`/calendar`)
**File**: `public/calendar.html`

**Features**:
- **Multi-view Calendar**: Month, week, day views
- **Event Types**: Meetings, interviews, cron jobs
- **Event Filtering**: Toggle different event types
- **Quick Actions**: Create meetings and interviews
- **Upcoming Events**: Sidebar with next events

**Event Types**:
- **Meetings**: Internal and external meetings
- **Interviews**: Scheduled interviews with candidates
- **Cron Jobs**: System automated tasks

**Calendar Features**:
- Drag and drop event creation
- Event details modal
- Attendee management
- Location tracking (rooms/Google Meet)
- Multi-access level permissions

### 6. Map Interface (`/map`)
**File**: `public/map.html`

**Features**:
- **Shipping Routes**: Visual representation with eyelash-like arcs
- **Real-time Updates**: Live inventory movement
- **Interactive Elements**: Click to view route details
- **Route Analytics**: Performance metrics
- **Geographic Visualization**: Global distribution network

## 🔧 Technical Implementation

### File Structure
```
public/
├── index.html              # Landing page
├── dashboard-modern.html   # Main dashboard
├── dashboard.html          # Legacy dashboard
├── chat.html              # Chat system
├── hr.html                # HR dashboard
├── calendar.html          # Calendar system
└── map.html               # Map interface
```

### Key Technologies
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with CSS Grid and Flexbox
- **JavaScript**: Vanilla JS for interactivity
- **Font Awesome**: Icon library
- **Google Fonts**: Typography
- **Responsive Design**: Mobile-first approach

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn
- PostgreSQL database

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd inventory

# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your configuration

# Start the server
npm start

# Test the frontend
node test-frontend.js
```

### Development
```bash
# Start in development mode
npm run dev

# Access the application
open http://localhost:3000
```

## 🎯 User Experience Features

### Marketplace Integration
- **Amazon**: Product search and integration
- **eBay**: Auction and marketplace integration
- **Unsplash**: Image and media integration
- **Graceful Falloff**: Automatic degradation when services are unavailable

### Chat System
- **Friend Lists**: Email confirmation for friend requests
- **Group Management**: Invite system with notifications
- **Message Retention**: Configurable TTL policies
- **Role-based Access**: Conditional chat availability

### HR Workflow
- **Interview Scheduling**: Google Meet integration
- **Onboarding Process**: Streamlined employee onboarding
- **Job Changes**: Quorum approval system
- **HR Changes**: Administrative workflow management

### Calendar Integration
- **Multi-access Levels**: Role-based calendar permissions
- **Meeting Management**: Scheduling and coordination
- **Interview Tracking**: Candidate interview management
- **Cron Job Monitoring**: System task visualization

## 🔒 Security & Access Control

### Ban Levels
1. **none**: Full system access
2. **chat_limit**: Limited chat functionality
3. **no_chat**: No chat access, other features available
4. **banned**: Complete system restriction

### Role-based Permissions
- **user**: Basic system access
- **COMPANY_EMPLOYEE**: Employee features + corpo chat
- **COMPANY_HR_EMPLOYEE**: HR features + employee management
- **COMPANY_HR_ADMIN**: Full HR administrative access

### Marketplace Preferences
Users can control:
- Which marketplaces are enabled
- Graceful falloff behavior
- Integration preferences

## 📊 Analytics & Monitoring

### Real-time Statistics
- Active holds count
- Total revenue tracking
- Investment robot performance
- Water level monitoring

### User Activity
- Chat participation metrics
- HR workflow efficiency
- Calendar usage patterns
- Marketplace integration usage

## 🛠️ Customization

### Styling
The frontend uses CSS custom properties for easy theming:
```css
:root {
    --primary: #667eea;
    --secondary: #764ba2;
    /* ... other colors */
}
```

### Configuration
Marketplace preferences and user settings are stored in JSON format:
```json
{
    "marketplacePreferences": {
        "amazon": { "enabled": true, "gracefulFalloff": true },
        "ebay": { "enabled": true, "gracefulFalloff": true },
        "unsplash": { "enabled": true, "gracefulFalloff": true }
    }
}
```

## 🧪 Testing

### Frontend Testing
```bash
# Run frontend tests
node test-frontend.js

# Expected output:
# ✅ All pages accessible
# ✅ All features functional
# ✅ Responsive design working
```

### Manual Testing Checklist
- [ ] All pages load correctly
- [ ] Marketplace toggles work
- [ ] Chat system functions
- [ ] HR workflows complete
- [ ] Calendar events display
- [ ] Map interface renders
- [ ] Responsive design works
- [ ] Role-based access functions

## 🚀 Deployment

### Production Build
```bash
# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables
```bash
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://...
# ... other required variables
```

## 📈 Performance

### Optimization Features
- **Compression**: Gzip compression enabled
- **Caching**: Static asset caching
- **Lazy Loading**: Images and heavy content
- **Minification**: CSS and JS optimization

### Performance Metrics
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

## 🔄 Updates & Maintenance

### Regular Updates
- Security patches
- Feature enhancements
- Bug fixes
- Performance improvements

### Version Control
- Semantic versioning
- Changelog maintenance
- Backward compatibility
- Migration guides

## 📞 Support

### Documentation
- API documentation
- User guides
- Developer documentation
- Troubleshooting guides

### Contact
- Technical support: [support@example.com]
- Feature requests: [features@example.com]
- Bug reports: [bugs@example.com]

---

**Last Updated**: December 2024
**Version**: 3.0.0
**Status**: Production Ready 