# New Features - Distributed Inventory System

This document outlines the new features being added to the distributed inventory system.

## 🗺️ 1. Map Interface

### Features
- **Eyelash-like Shipping Routes**: Visual representation of shipping paths with curved arcs
- **Interactive Nodes**: Different node types (User, Inventory, Hold, Shipping)
- **Real-time Statistics**: Live updates of system metrics
- **Dynamic Controls**: Add/remove nodes and routes for testing

### Implementation
- File: `public/map.html`
- Features SVG-based route visualization
- Responsive design with dark theme
- Real-time data updates every 5 seconds

## 🛒 2. eBay Integration

### Features
- **Product Search**: Search eBay items with filters
- **Product Details**: Get detailed item information
- **Trending Items**: Find popular items
- **Deals Discovery**: Find discounted items
- **Category Management**: Browse by categories

### Implementation
- Service: `server/services/eBayService.js`
- Entities: `eBayProduct.js`, `eBayUser.js`
- API Integration: eBay Browse API v1
- OAuth2 Authentication

### Environment Variables
```env
EBAY_APP_ID=your_app_id
EBAY_CERT_ID=your_cert_id
EBAY_CLIENT_SECRET=your_client_secret
EBAY_DEV_ID=your_dev_id
EBAY_SANDBOX=true
EBAY_MARKETPLACE=EBAY-US
```

## 💬 3. Chat System

### Features
- **Direct Messages**: One-on-one conversations
- **Group Chats**: Multi-user conversations with invites
- **Herd Chat**: Public chat for all users (3-month TTL)
- **Corpo Chat**: Company-wide chat for employees
- **Friend System**: Email-confirmed friend requests
- **Message Types**: Text, images, files, system messages
- **Reactions & Replies**: Interactive message features

### Chat Types
1. **Direct Chat**: Private conversations between friends
2. **Group Chat**: Invite-only group conversations
3. **Herd Chat**: Public chat with 3-month message retention
4. **Corpo Chat**: Company employees only

### Implementation
- Entities: `Chat.js`, `Message.js`, `FriendRequest.js`
- Real-time messaging with Socket.IO
- Email notifications for friend requests
- Message TTL management

## 👥 4. HR System

### Employee Access Levels
- **EMPLOYEE**: Basic employee access
- **COMPANY_HR_EMPLOYEE**: HR employee with hiring capabilities
- **COMPANY_HR_ADMIN**: HR admin with pay change permissions
- **IT_EMPLOYEE**: IT staff with system access

### Interview System
- **Interview Creation**: HR employees can create interviews
- **Question Management**: Add interview questions with known answers
- **Scheduling**: Multiple datetime options with Google Meet integration
- **Interview Rounds**: Support for 1-5 interview rounds
- **Decision Tracking**: Approve/deny with HR review process

### Job Change System
- **Change Requests**: Any employee can request job changes
- **Quorum System**: Requires 2 HR + 1 non-HR employee approval
- **Random Selection**: Automatic selection of review committee
- **Form Management**: Editable job information forms

### HR Change System
- **Personal Information**: Address, phone, emergency contacts
- **Tax Information**: Withholding, exemptions
- **HR Review**: 2 HR employees required for approval

### Implementation
- Entities: `Interview.js`, `Employee.js`, `JobChange.js`, `Meeting.js`
- Google Calendar integration for meetings
- Email notifications for all processes
- Chat integration for discussions

## 📅 5. Calendar System

### Multi-Access Calendar
- **EMPLOYEE**: View scheduled meetings
- **HR**: View interviews and meetings
- **IT_EMPLOYEE**: View meetings, interviews, and cron jobs

### Meeting Features
- **Scheduling**: Create meetings with required/optional attendees
- **Google Meet**: Automatic Google Meet link generation
- **Propose New Time**: Attendees can propose alternative times
- **Chat Integration**: Automatic chat creation when meeting is confirmed

### Implementation
- Entity: `Meeting.js`
- Google Calendar API integration
- Real-time updates
- Email notifications

## 🔧 Technical Implementation

### New Dependencies
```json
{
  "xml2js": "^0.6.2",
  "nodemailer": "^6.9.7",
  "googleapis": "^128.0.0",
  "uuid": "^9.0.1",
  "moment": "^2.29.4",
  "socket.io": "^4.7.4"
}
```

### Database Schema
- **eBayProduct**: eBay item data
- **eBayUser**: eBay user information
- **Chat**: Chat room information
- **Message**: Individual messages
- **FriendRequest**: Friend request management
- **Interview**: Interview scheduling and management
- **Employee**: Employee information and access levels
- **JobChange**: Job change requests and approvals
- **Meeting**: Meeting scheduling and management

### API Endpoints

#### eBay Integration
- `GET /api/ebay/search` - Search eBay items
- `GET /api/ebay/item/:id` - Get item details
- `GET /api/ebay/trending` - Get trending items
- `GET /api/ebay/deals` - Get deals

#### Chat System
- `POST /api/chat/create` - Create new chat
- `POST /api/chat/:id/message` - Send message
- `GET /api/chat/:id/messages` - Get chat messages
- `POST /api/friends/request` - Send friend request
- `POST /api/friends/accept/:id` - Accept friend request

#### HR System
- `POST /api/interviews/create` - Create interview
- `GET /api/interviews/:id` - Get interview details
- `POST /api/interviews/:id/schedule` - Schedule interview
- `POST /api/job-changes/request` - Request job change
- `POST /api/hr-changes/request` - Request HR change
- `GET /api/employees` - Get employee list

#### Calendar System
- `POST /api/meetings/create` - Create meeting
- `GET /api/calendar` - Get calendar events
- `POST /api/meetings/:id/propose-time` - Propose new time

### Environment Variables
```env
# eBay API
EBAY_APP_ID=your_app_id
EBAY_CERT_ID=your_cert_id
EBAY_CLIENT_SECRET=your_client_secret
EBAY_DEV_ID=your_dev_id
EBAY_SANDBOX=true
EBAY_MARKETPLACE=EBAY-US

# Google Calendar
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/inventory
REDIS_URL=redis://localhost:6379
```

## 🚀 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Environment Variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Run Migrations**
   ```bash
   npm run migrate
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## 📊 Features Overview

| Feature | Status | Priority |
|---------|--------|----------|
| Map Interface | ✅ Complete | High |
| eBay Integration | 🔄 In Progress | High |
| Chat System | 🔄 In Progress | High |
| HR System | 🔄 In Progress | Medium |
| Calendar System | 🔄 In Progress | Medium |

## 🔒 Security Considerations

- **OAuth2**: All external API integrations use OAuth2
- **Role-based Access**: HR system uses strict role-based permissions
- **Data Retention**: Chat messages have configurable TTL
- **Email Verification**: Friend requests require email confirmation
- **Audit Trail**: All HR actions are logged for compliance

## 📈 Future Enhancements

- **Real-time Notifications**: Push notifications for all systems
- **Advanced Analytics**: Detailed reporting for HR and inventory
- **Mobile App**: React Native app for mobile access
- **AI Integration**: AI-powered interview question generation
- **Advanced Calendar**: Recurring meetings and calendar sync 