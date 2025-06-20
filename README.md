# Distributed Peer-to-Peer Inventory System

A comprehensive inventory management system with investment pools, shipping routes, purchase agreements, backup systems, warehouse management, cryptocurrency payment support, care photo management, dispute resolution, comprehensive notifications, and watch lists. Built with Node.js, PostgreSQL, Redis, and Docker.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL 15+ (for local development)

### Docker Setup (Recommended)

1. **Clone and navigate to the project:**
   ```bash
   cd inventory
   ```

2. **Start the frontend and all services:**
   ```bash
   ./start-frontend.sh
   ```

   This script will:
   - Create environment configuration
   - Start all services (database, backend, frontend, warehouse)
   - Wait for services to be healthy
   - Optionally start React Native and monitoring services
   - Open the frontend in your browser

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001/api
   - React Native: http://localhost:8081 (if enabled)
   - Grafana: http://localhost:3003 (if enabled)

### Manual Docker Setup

1. **Copy environment configuration:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

2. **Start all services:**
   ```bash
   docker-compose up -d
   ```

3. **Start with monitoring:**
   ```bash
   docker-compose --profile monitoring up -d
   ```

4. **Start with backup services:**
   ```bash
   docker-compose --profile backup up -d
   ```

## 🏗️ Architecture

### Services

- **Frontend** (Port 3000): Web interface served by Nginx
- **Backend** (Port 3001): Node.js API server
- **Warehouse** (Port 3002): Data tiering and storage management
- **Backup** (Port 3004): Automated backup and recovery
- **PostgreSQL** (Port 5432): Primary database
- **Redis** (Port 6379): Caching and session storage
- **Nginx** (Port 80/443): Reverse proxy and load balancer

### Docker Containers

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   React Native  │    │   Nginx Proxy   │
│   (Nginx)       │    │   (Expo)        │    │   (Load Bal.)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Backend       │    │   Warehouse     │    │   Backup        │
│   (Node.js)     │    │   (Node.js)     │    │   (Node.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │   Redis         │    │   Monitoring    │
│   (Database)    │    │   (Cache)       │    │   (Prometheus)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📊 Features

### Core Inventory Management
- **Item Management**: Add, edit, delete items with pictures, weight, dimensions
- **User Management**: Multi-address support, role-based access
- **Category System**: Organize items by categories and tags
- **Search & Filter**: Advanced search with multiple criteria

### Care Photo System
- **Photo Upload**: Upload photos when receiving packages (receipt, condition, dispute)
- **Photo Confirmation**: Both parties must confirm photos before shipment
- **Required Photos**: Receipt photos required before shipping to next party
- **Photo Types**: Support for receipt, condition, and dispute photos
- **Photo Management**: View, delete, and manage photos with permissions
- **Photo Validation**: Ensure photos are confirmed before shipment

### Dispute Resolution System
- **Dispute Creation**: Create disputes with photos and detailed descriptions
- **Dispute Types**: Condition, damage, missing items, and other issues
- **Email Notifications**: Automatic email notifications to all parties
- **Moderation System**: Admin/moderator resolution with notes
- **Photo Evidence**: Upload additional photos as dispute evidence
- **Resolution Tracking**: Track dispute status and resolution history

### Notification System
- **Multi-Type Notifications**: Hold reminders, disputes, watch lists, system messages
- **Priority Levels**: Low, normal, high, urgent priority notifications
- **Read/Unread Tracking**: Mark notifications as read/unread
- **Action URLs**: Direct links to relevant pages
- **Bulk Operations**: Mark all as read, bulk notifications
- **Notification Preferences**: User-configurable notification settings

### Watch List System
- **Item Watching**: Watch items for price changes, availability, updates
- **Smart Notifications**: Notify when watched items change
- **Notification Preferences**: Configure what triggers notifications
- **Watch Management**: Add/remove items, bulk operations
- **Watch Statistics**: Track watch list usage and preferences
- **Integration**: Seamless integration with item browsing

### Hold Duration Management
- **Minimum Keep Time**: Set minimum days before hold can be released
- **Maximum Keep Time**: Set maximum days before hold expires
- **Gentle Reminders**: Notifications for hold duration milestones
- **Automatic Notifications**: Daily reminders for long holds
- **Hold Extensions**: Extend holds with proper notifications
- **Hold Analytics**: Track hold duration patterns

### Investment System
- **Individual Pools**: Personal investment management
- **Herd Pools**: Community investment pools
- **Automatic Pools**: AI-driven investment based on water levels
- **Risk Management**: Configurable risk levels and strategies
- **Batched Processing**: Efficient investment updates with rate limiting
- **Service Fees**: Transparent fee structure for different investment types

### Cryptocurrency & Payment System
- **Coinbase Commerce Integration**: Secure cryptocurrency payments
- **Multiple Cryptocurrencies**: Support for BTC, ETH, USDC, USDT, LTC, BCH, XRP, ADA, DOT, LINK
- **QR Code Payments**: Easy mobile payment scanning
- **OAuth2 Authentication**: Secure API access for cryptocurrency services
- **Service Fee Transparency**: Clear fee structure with detailed breakdowns
- **Webhook Processing**: Real-time payment status updates

### Shipping & Logistics
- **Multi-Address Support**: Multiple addresses per user
- **Route Management**: Optimized shipping routes with cost calculation
- **Hold System**: Reserve items with shipping route integration
- **Purchase Agreements**: Counter-offer support and negotiation

### Data Protection & Compliance
- **Backup System**: Multi-tier backup with encryption and compression
- **Warehouse Management**: Tiered data storage with lifecycle management
- **Audit Trails**: Comprehensive logging for compliance
- **Data Integrity**: Checksum verification and corruption detection

### Advanced Features
- **Real-time Updates**: WebSocket connections for live data
- **File Upload**: Secure file handling with size limits
- **API Rate Limiting**: Protection against abuse
- **Monitoring**: Prometheus metrics and Grafana dashboards
- **Automated Cron Jobs**: Daily notifications, hold reminders, watch list updates

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Items
- `GET /api/items` - List items with filters
- `POST /api/items` - Create new item
- `GET /api/items/:id` - Get item details
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item
- `POST /api/items/:id/upload` - Upload item images

### Care Photos
- `POST /api/care-photos/upload/:holdId` - Upload care photos
- `POST /api/care-photos/confirm/:photoId` - Confirm care photo
- `GET /api/care-photos/hold/:holdId` - Get hold photos
- `DELETE /api/care-photos/:photoId` - Delete care photo
- `GET /api/care-photos/stats/:holdId` - Get photo statistics
- `GET /api/care-photos/validate-shipment/:holdId` - Validate photos for shipment

### Disputes
- `POST /api/disputes/create/:holdId` - Create dispute
- `PUT /api/disputes/:disputeId` - Update dispute
- `POST /api/disputes/resolve/:disputeId` - Resolve dispute (moderators)
- `GET /api/disputes/:disputeId` - Get dispute details
- `GET /api/disputes/hold/:holdId` - Get hold disputes
- `GET /api/disputes/stats/overview` - Get dispute statistics (moderators)
- `GET /api/disputes/admin/all` - Get all disputes (moderators)

### Notifications
- `GET /api/notifications/user` - Get user notifications
- `GET /api/notifications/unread-count` - Get unread count
- `POST /api/notifications/mark-read/:notificationId` - Mark as read
- `POST /api/notifications/mark-all-read` - Mark all as read
- `DELETE /api/notifications/:notificationId` - Delete notification
- `PUT /api/notifications/preferences` - Update notification preferences
- `GET /api/notifications/stats` - Get notification statistics
- `POST /api/notifications/system` - Send system notification (admin)
- `POST /api/notifications/bulk` - Send bulk notifications (admin)

### Watch List
- `POST /api/watch-list/add/:itemId` - Add item to watch list
- `DELETE /api/watch-list/remove/:itemId` - Remove from watch list
- `GET /api/watch-list/user` - Get user's watch list
- `GET /api/watch-list/check/:itemId` - Check if item is watched
- `PUT /api/watch-list/preferences/:itemId` - Update watch preferences
- `GET /api/watch-list/stats` - Get watch list statistics
- `POST /api/watch-list/bulk-add` - Bulk add items to watch list
- `POST /api/watch-list/bulk-remove` - Bulk remove from watch list

### Investment Pools
- `GET /api/pools` - List investment pools
- `POST /api/pools` - Create investment pool
- `GET /api/pools/:id` - Get pool details
- `PUT /api/pools/:id` - Update pool
- `POST /api/pools/:id/invest` - Make investment
- `GET /api/pools/:id/analytics` - Pool analytics

### Cryptocurrency & OAuth2
- `POST /api/crypto/payments` - Create cryptocurrency payment
- `GET /api/crypto/payments/status/:chargeId` - Get payment status
- `GET /api/crypto/payments/history` - Get payment history
- `GET /api/crypto/supported` - Get supported cryptocurrencies
- `POST /api/crypto/webhook` - Coinbase Commerce webhook
- `GET /api/crypto/oauth/:provider/url` - Generate OAuth2 URL with QR code
- `GET /api/crypto/oauth/:provider/callback` - OAuth2 callback handler
- `GET /api/crypto/oauth/credentials` - Get OAuth credentials
- `DELETE /api/crypto/oauth/credentials/:credentialId` - Revoke OAuth credentials
- `POST /api/crypto/oauth/credentials/:credentialId/refresh` - Refresh access token
- `GET /api/crypto/analytics` - Cryptocurrency payment analytics
- `GET /api/crypto/oauth/analytics` - OAuth2 authentication analytics

### Tax & Compliance
- `GET /api/tax/consumer/info` - Get consumer tax information for tax year
- `GET /api/tax/consumer/breakdown` - Get detailed tax breakdown with optional transaction history
- `GET /api/tax/consumer/summary` - Get multi-year tax summary for planning
- `GET /api/tax/consumer/export` - Export tax data in JSON or CSV format
- `GET /api/tax/rates` - Get current tax rates for US Federal, State, and VAT
- `GET /api/tax/business/info` - Get business revenue and tax information (Admin)
- `GET /api/tax/business/analytics` - Get business revenue analytics (Admin)
- `GET /api/tax/business/compliance` - Get comprehensive tax compliance report (Admin)

### Shipping & Holds
- `GET /api/routes` - List shipping routes
- `POST /api/routes` - Create shipping route
- `GET /api/holds` - List holds
- `POST /api/holds` - Create hold
- `PUT /api/holds/:id` - Update hold

### Purchases
- `GET /api/purchases` - List purchases
- `POST /api/purchases` - Create purchase
- `GET /api/purchases/:id` - Get purchase details
- `PUT /api/purchases/:id` - Update purchase

## 💰 Service Fees & Revenue Model

### Investment Service Fees
- **Cryptocurrency**: 1% of investment amount
- **Stocks**: 0.5% of investment amount  
- **Bonds**: 0.3% of investment amount
- **Real Estate**: 2% of investment amount

### Cryptocurrency Payment Fees
- **Transaction Fee**: 1% of payment amount
- **Conversion Fee**: 0.5% for crypto to USD conversion
- **OAuth Verification**: 0.1% verification fee

### Hold Stagnation Revenue
- **Base Rate**: 0.1% per day
- **Maximum Rate**: 1% per day (after 10 days)
- **Purpose**: Encourages platform usage and covers operational costs

### Energy Efficiency Revenue
- **Platform Share**: 50% of energy savings
- **Sources**: Optimized routing, reduced shipping, digital transactions
- **Transparency**: All savings tracked and reported

## 🕐 Cron Jobs

### Automated Tasks
- **Daily Backups**: `0 2 * * *` - Create daily backups
- **Weekly Cleanup**: `0 3 * * 0` - Clean old backups
- **Warehouse Lifecycle**: `0 4 * * *` - Manage data tiers
- **Integrity Checks**: `0 5 * * *` - Verify data integrity
- **Compliance Reports**: `0 6 * * 0` - Generate weekly reports
- **Investment Updates**: `0 */2 * * *` - Batched investment value updates
- **Hold Stagnation**: `0 1 * * *` - Process hold stagnation revenue
- **Energy Efficiency**: `0 8 * * *` - Calculate energy efficiency revenue

## 📈 Analytics & Monitoring

### Metrics Collected
- API response times and error rates
- Database connection pool usage
- Redis memory and performance
- File upload statistics
- Investment pool performance
- Backup success rates
- Warehouse storage utilization
- Cryptocurrency payment volumes
- OAuth2 authentication rates
- Service fee revenue tracking

### Dashboards
- **System Health**: Overall system status
- **Performance**: API and database metrics
- **Business**: Investment and inventory analytics
- **Cryptocurrency**: Payment and OAuth analytics

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control
- Session management with Redis
- Password hashing with bcrypt

### Data Protection
- Encrypted backups and warehouse data
- Secure file uploads with validation
- API rate limiting and abuse prevention
- CORS configuration for cross-origin requests

### Audit & Compliance
- Comprehensive audit trails
- Data integrity verification
- Backup encryption and compression
- Compliance reporting tools

## 🧪 Testing

### Test Coverage
- Unit tests for all services
- Integration tests for API endpoints
- End-to-end tests for critical workflows
- Performance and load testing

### Running Tests
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Run tests with coverage
npm run test:coverage
```

## 🚀 Deployment

### Production Setup
1. **Environment Configuration**:
   ```bash
   cp env.example .env.production
   # Configure production settings
   ```

2. **SSL Certificates**:
   ```bash
   # Place SSL certificates in docker/nginx/ssl/
   cp your-cert.pem docker/nginx/ssl/cert.pem
   cp your-key.pem docker/nginx/ssl/key.pem
   ```

3. **AWS Configuration** (for cloud storage):
   ```bash
   # Set AWS credentials in .env
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   AWS_S3_BACKUP_BUCKET=your-bucket
   ```

4. **Deploy**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Scaling
- **Horizontal Scaling**: Multiple backend instances behind load balancer
- **Database Scaling**: Read replicas for read-heavy workloads
- **Cache Scaling**: Redis cluster for high availability
- **Storage Scaling**: Multi-region backup and warehouse storage

## 📚 Development

### Local Development
```bash
# Install dependencies
npm install

# Start development servers
npm run dev:backend
npm run dev:frontend
npm run dev:react-native

# Run database migrations
npm run db:migrate

# Seed database
npm run db:seed
```

### Code Structure
```
inventory/
├── server/                 # Backend API
│   ├── controllers/       # API controllers
│   ├── services/         # Business logic
│   ├── entities/         # Database models
│   ├── middleware/       # Express middleware
│   └── config/          # Configuration
├── public/               # Frontend web app
│   ├── css/             # Stylesheets
│   ├── js/              # JavaScript
│   └── index.html       # Main page
├── react-native-app/     # React Native app
├── docker/              # Docker configurations
├── scripts/             # Utility scripts
└── docs/               # Documentation
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the troubleshooting guide

## 🔄 Changelog

### v2.0.0 - Current
- Added Docker containerization
- Implemented warehouse service
- Enhanced backup system
- Added monitoring and analytics
- Improved frontend with React Native support

### v1.0.0 - Initial Release
- Basic inventory management
- Investment pools
- Shipping routes
- Purchase agreements
- User management

---

**Built with ❤️ for distributed inventory management** 