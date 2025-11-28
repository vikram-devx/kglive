# KingGames Platform - Product Requirements Document (PRD)

## 1. Introduction

### 1.1 Purpose
This document outlines the complete product requirements for the KingGames Platform, a comprehensive online gaming and betting platform. It serves as the definitive reference for current and future development, detailing all features, user roles, game types, and technical specifications.

### 1.2 Scope
The KingGames Platform is a full-featured online gaming ecosystem that includes multiple betting games, user management with various roles, wallet functionality, and administrative tools. The platform offers a responsive web interface accessible across all devices.

### 1.3 Product Vision
KingGames aims to provide a secure, engaging, and fair online gaming experience with transparent odds and robust user management. The platform targets users interested in casual games of chance and skill, with special focus on various betting formats.

## 2. User Roles and Permissions

### 2.1 Role Hierarchy
The platform implements a three-tier role system:

1. **Admin**
   - Full system access
   - Can create subadmins and manage all users
   - Can configure game settings, odds, and commission rates
   - Has access to all financial transactions and reports

2. **Subadmin**
   - Limited administrative rights
   - Can create and manage players assigned to them
   - Can set custom commission rates and odds for their players
   - Can process deposits and withdrawals for their players
   - Cannot access system-wide settings or other subadmins' data

3. **Player**
   - End-user of the platform
   - Can place bets in available games
   - Can request deposits and withdrawals
   - Can view their personal game history and transaction records
   - Always assigned to a subadmin or directly to an admin

### 2.2 Permission Details

#### Admin Permissions
- User Management: Create, edit, block, unblock any user
- Financial Operations: Process all deposit/withdrawal requests
- Game Management: Create, update, and resolve games
- System Configuration: Change system settings, odds, commission rates
- Reports: Access all financial and game reports
- Subadmin Management: Assign and manage subadmins

#### Subadmin Permissions
- Player Management: Create, edit, block, unblock players assigned to them
- Limited Financial Operations: Process deposits/withdrawals for their players
- Game Configuration: Set custom odds for their players
- Commission Configuration: Set commission rates for specific games
- Reports: Access reports for their players only
- Cannot access or modify other subadmins' settings or players

#### Player Permissions
- Profile Management: Update personal details and password
- Financial Requests: Request deposits and withdrawals
- Game Participation: Place bets in available games
- View History: Access personal game and transaction history
- Cannot access any admin functions or other players' data

## 3. Game Types and Mechanics

### 3.1 Coin Flip Game
- **Description**: A simple heads/tails prediction game
- **Mechanics**:
  - Player selects heads or tails
  - Player places a bet amount (minimum ₹10)
  - System flips a coin with animated visuals
  - Win pays 1.9x the bet amount (5% platform fee)
  - Dynamic win probability system based on user history:
    - New users get enhanced 60% win rate for first few games
    - Standard users get 50% win rate
    - Users on win streaks (3+ consecutive wins) get reduced 25% win rate
    - Users on loss streaks (3+ consecutive losses) get enhanced 55% win rate
    - System caps maximum win probability at 35% for high-volume players
  - Sound effects for coin flip action and wins (optional muting)
  - Detailed bet history with outcome visualization

### 3.2 Cricket Toss Game
- **Description**: Betting on cricket match toss outcomes
- **Mechanics**:
  - Admin creates toss events with team details, image, time, and odds
  - Players bet on which team will win the toss
  - Admin resolves the toss result after the actual event
  - Payouts are based on odds set for each team (typically 1.9x)
  - Multiple active toss events can run simultaneously
  - Game state management: Creation → Open for Betting → Closed → Resulted

### 3.3 Team Match Betting
- **Description**: Betting on sports match outcomes
- **Mechanics**:
  - Admin creates match events with teams, odds, and details
  - Players can bet on Team A, Team B, or Draw outcome
  - Dynamic odds system reflecting real-world probabilities
  - Bet timing restrictions (must place before match start)
  - Result validation and payout processing by admin
  - Support for multiple sports categories
  - Advanced exposure management for calculating potential liability

### 3.4 Satamatka Game
- **Description**: Traditional Indian lottery-style numbers game
- **Mechanics**:
  - Multiple game formats:
    - Single (bet on a single digit 0-9)
    - Jodi (bet on a pair of digits 00-99)
    - Patti (bet on specific three-digit combinations)
    - CP/SP (bet on opening/closing digit combinations)
    - Cross/Crossing (complex pattern betting across numbers)
  - Market-based system with open/close times
  - Different odds for different bet types (Single: 9x, Jodi: 90x, etc.)
  - Admin creates markets with time windows
  - Admin declares results for open/close phases
  - Support for running multiple markets simultaneously
  - Custom validation for each bet type with pattern matching

## 4. Wallet and Financial System

### 4.1 Wallet Features
- **Balance Management**:
  - Every user has a digital wallet with real-time balance
  - Balance updated immediately after game results
  - Support for positive and negative adjustments by admins
  - Protection against negative balances during betting

- **Deposit System**:
  - Players can request deposits via UPI or bank transfer
  - Multi-step verification process
  - Admin/subadmin approval workflow
  - Transaction records with status tracking
  - Support for automatic and manual verification

- **Withdrawal System**:
  - Players can request balance withdrawals
  - Configurable minimum/maximum withdrawal limits
  - Admin/subadmin approval workflow
  - Bank account or UPI-based withdrawals
  - Status tracking with notifications

### 4.2 Financial Reports
- **Transaction History**:
  - Complete record of all financial movements
  - Filtering by transaction type, user, date range
  - Export functionality for data analysis
  - Balance reconciliation tools for admins

- **Game Financial Reports**:
  - Profit/loss reports by game type
  - Time-period analysis (daily, weekly, monthly)
  - Player performance tracking
  - Exposure and liability reporting

- **Commission Reports**:
  - Detailed tracking of subadmin commissions
  - Commission calculation based on configured rates
  - Settlement tracking and history
  - Time-period analysis and projections

### 4.3 Commission System
- **Configuration**:
  - Game-specific commission rates
  - Subadmin-specific commission rates
  - Tiered commission structure possibility
  - Automatic calculation based on player activity

- **Settlement**:
  - Manual or scheduled commission settlements
  - Settlement records and history
  - Balance transfers with verification
  - Dispute resolution mechanism

## 5. User Management Features

### 5.1 User Creation and Assignment
- Admin can create subadmins with configuration
- Subadmins can create players assigned to themselves
- Admin can reassign players between subadmins
- User profile data with contact information
- Unique username requirements and validation

### 5.2 User Status Management
- Active/inactive user status tracking
- User blocking with reason documentation
- Temporary suspension capabilities
- Login attempt monitoring and security
- Password reset and account recovery processes

### 5.3 User Profile Features
- Personal information management
- Password change functionality
- Contact information updates
- Account activity logs
- Preference settings for notifications

### 5.4 User Details Page
- Comprehensive view of user information
- Transaction history with filtering
- Bet history with detailed game information
- Active bets monitoring
- Financial summary statistics
- User relationship mapping (subadmin connections)

## 6. Game Administration

### 6.1 Game Configuration
- Game-specific settings and parameters
- Odds configuration for each game type
- Time window settings for scheduled games
- Game visibility and availability controls
- Result declaration interfaces

### 6.2 Result Management
- Manual result entry for toss and match games
- Result verification processes
- Automatic payout calculation
- Dispute handling mechanisms
- Result broadcasting to users

### 6.3 Risk Management
- Betting limits configuration
- Maximum exposure controls
- Automatic liability calculations
- High-risk bet flagging
- Pattern detection for suspicious activity

## 7. Front-End Features

### 7.1 User Interface
- Responsive design for all devices
- Dark/light theme support
- Accessible interface elements
- Optimized layouts for different games
- Intuitive navigation system
- Real-time updates for game status

### 7.2 Game Interfaces
- **Coin Flip**:
  - 3D animated coin with realistic physics
  - Bet selection interface with quick amount buttons
  - Result visualization with win/loss popups
  - Sound effects with muting option
  - Recent history visualization

- **Cricket Toss**:
  - Team selection interface with logos
  - Odds display with potential winnings calculation
  - Timer for upcoming toss events
  - Result announcement visuals
  - Active and past toss event lists

- **Team Match**:
  - Team selection with match details
  - Multiple betting options (Team A, B, Draw)
  - Dynamic odds display
  - Match timing and status indicators
  - Result tracking and visualization

- **Satamatka**:
  - Market selection interface
  - Multiple bet type options
  - Number selection interface
  - Market timing indicators
  - Result history visualization
  - Pattern selection tools for complex bets

### 7.3 User Dashboard
- Balance display with quick deposit option
- Recent bets summary
- Active bets status tracking
- Personal statistics and performance
- Notifications and announcements
- Quick access to popular games

### 7.4 Admin Dashboard
- Real-time platform statistics
- User management shortcuts
- Financial summary with alerts
- Recent activity logs
- Quick access to pending approvals
- System health indicators

## 8. Backend Architecture

### 8.1 API Structure
- RESTful API design with consistent endpoints
- Authentication and authorization middleware
- Rate limiting for security
- Comprehensive error handling
- Structured response formats
- Documentation with Swagger/OpenAPI

### 8.2 Database Design
- Relational database with PostgreSQL
- Key entities:
  - Users (with role-based structure)
  - Games (with game-specific data)
  - Transactions (financial records)
  - Bets (user game interactions)
  - Settings (system configuration)
  - Markets (for scheduled games)
  - Teams and Matches (for sports betting)
- Optimized indexing for performance
- Referential integrity with foreign keys
- Transaction support for data consistency

### 8.3 Security Features
- Role-based access control (RBAC)
- Password hashing with bcrypt
- JWT-based authentication
- Session management with timeouts
- Input validation on all endpoints
- Protection against common attacks (CSRF, XSS)
- Rate limiting against brute force attempts
- Audit logging for sensitive actions

### 8.4 Real-time Features
- WebSocket support for live updates
- Real-time balance updates
- Game status notifications
- Admin action broadcasting
- Connection state management
- Fallback mechanisms for offline operation

## 9. Probability and Fairness System

### 9.1 Dynamic Win Rate Management
- Player-specific win rate calculation
- Session-based analysis for streaks
- New player advantage system
- Anti-streak mechanisms for fairness
- Win rate caps for responsible gaming
- Configurable parameters for probability tuning

### 9.2 Random Number Generation
- Cryptographically secure RNG implementation
- Verifiable fairness with seed publishing
- Distribution validation for statistical fairness
- Independent result generation for each game
- Audit mechanisms for result verification

### 9.3 Odds Management
- Dynamic odds calculation based on real probabilities
- House edge configuration by game type
- Subadmin-specific odds adjustments
- Player-specific discounts on odds
- Market-based odds fluctuation for sports betting

## 10. Implementation Technologies

### 10.1 Frontend
- React.js with TypeScript
- TanStack Query for API state management
- Framer Motion for animations
- Tailwind CSS for styling
- Shadcn UI component library
- Responsive design with mobile-first approach
- React Hook Form for form validation
- Zod for schema validation

### 10.2 Backend
- Express.js with TypeScript
- Drizzle ORM for database operations
- PostgreSQL for data storage
- Passport.js for authentication
- WebSockets for real-time features
- Server-side rendering capabilities
- Caching strategies for performance
- Background job processing for scheduled tasks

### 10.3 Deployment
- Production build optimization
- Environment-based configuration
- Continuous integration and deployment
- Replit deployment configuration
- Database migration framework
- Backup and recovery procedures
- Monitoring and logging infrastructure

## 11. Responsible Gaming Features

### 11.1 Betting Limits
- Session betting limits configuration
- Daily/weekly/monthly deposit limits
- Loss limits with cooling periods
- Self-exclusion capabilities
- Enforced break periods after extended play

### 11.2 Monitoring Tools
- Pattern detection for problem gambling
- Activity alerts for unusual behavior
- Voluntary self-assessment tools
- Play time tracking and notifications
- Deposit frequency monitoring

### 11.3 Information Resources
- Responsible gaming guidelines
- Self-help resources and links
- Risk awareness information
- Customer support contact options
- Age verification reminders

## 12. Feature Roadmap and Priorities

### 12.1 Core Features (Phase 1)
- [x] User authentication system
- [x] Basic user roles and permissions
- [x] Coin Flip game implementation
- [x] Simple wallet system
- [x] Admin dashboard basics
- [x] Transaction history tracking

### 12.2 Enhanced Features (Phase 2)
- [x] Cricket Toss game
- [x] Advanced wallet with deposit/withdrawal
- [x] Subadmin role implementation
- [x] Commission system basics
- [x] Improved user management
- [x] Enhanced game history tracking
- [x] Basic reporting tools

### 12.3 Advanced Features (Phase 3)
- [x] Satamatka game implementation
- [x] Team Match betting
- [x] Advanced commission system
- [x] Custom odds and discounts
- [x] Enhanced financial reporting
- [x] User relationship management
- [x] Comprehensive user details page

### 12.4 Future Enhancements (Phase 4)
- [ ] Additional game types
- [ ] Multi-language support
- [ ] Enhanced security features
- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Marketing and retention tools
- [ ] API access for partners
- [ ] Affiliate management system

## 13. Technical Specifications

### 13.1 Performance Requirements
- Page load time < 2 seconds
- API response time < 500ms
- Support for 1000+ concurrent users
- Game animation smoothness at 60fps
- Database query optimization for high volumes
- Efficient caching strategy for repeat queries
- Minimal memory footprint for client devices

### 13.2 Compatibility Requirements
- Browser support: Latest 2 versions of Chrome, Firefox, Safari, Edge
- Mobile device support: iOS 14+, Android 8+
- Responsive design breakpoints: 320px to 1920px
- Touch input optimization for mobile devices
- Keyboard accessibility for desktop
- Low bandwidth considerations for rural areas
- Offline mode support for basic functionality

### 13.3 Security Requirements
- HTTPS enforcement with TLS 1.2+
- Regular security audits and penetration testing
- Sensitive data encryption in transit and at rest
- Session management with secure cookies
- CSRF protection on all forms
- Input validation and sanitization
- Rate limiting for authentication attempts
- Regular security patches and updates

## 14. Conclusion

This Product Requirements Document outlines the comprehensive features, architecture, and technical specifications for the KingGames Platform. It serves as the definitive reference for current and future development. As the platform evolves, this document should be updated to reflect new requirements and implemented features.

---

## Appendix A: Feature Checklist

### User Management
- [x] User registration
- [x] Role-based permissions
- [x] User blocking/unblocking
- [x] Password management
- [x] Profile management
- [x] User relationship hierarchy
- [x] User details page with history
- [x] Activity logging

### Games
- [x] Coin Flip game
- [x] Cricket Toss game
- [x] Team Match betting
- [x] Satamatka game
- [x] Game history tracking
- [x] Result management
- [x] Game configuration
- [x] Dynamic probability system

### Financial System
- [x] Wallet management
- [x] Deposit requests
- [x] Withdrawal processing
- [x] Transaction history
- [x] Commission calculation
- [x] Financial reporting
- [x] Balance adjustments
- [x] Payment verification

### Admin Tools
- [x] User management dashboard
- [x] Game management interfaces
- [x] Financial approval workflows
- [x] System configuration
- [x] Report generation
- [x] Audit logging
- [x] Market management
- [x] Odds configuration

### Technical Features
- [x] Responsive UI
- [x] Real-time updates
- [x] Secure authentication
- [x] Database optimization
- [x] Error handling
- [x] Performance optimization
- [x] Browser compatibility
- [x] Mobile device support