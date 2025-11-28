# KingGames Platform

## Overview

KingGames is a comprehensive online gaming and betting platform built with a modern web stack. The platform supports multiple game types including coin flip, Satamatka (matka betting), cricket toss, and team match games. It features a hierarchical user management system with three distinct roles (Admin, Subadmin, Player), integrated wallet functionality, and real-time game management capabilities.

The application is built using:
- **Frontend**: React with TypeScript, TanStack Query for state management, Radix UI components
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Crypto.scrypt-based password hashing with session management

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Component Structure**: The frontend uses a component-based architecture with React and TypeScript. UI components are built using Radix UI primitives and styled with Tailwind CSS. The application leverages shadcn/ui patterns for consistent, accessible component design.

**State Management**: TanStack Query (React Query) handles server state management, providing caching, background updates, and optimistic UI updates. This approach separates server state from local UI state, improving performance and developer experience.

**Routing**: The application uses client-side routing to provide distinct experiences for different user roles (Admin, Subadmin, Player). Each role has dedicated dashboard views and feature access based on permissions.

**Form Handling**: React Hook Form with Zod resolvers provides type-safe form validation and submission handling across the platform.

### Backend Architecture

**API Design**: RESTful API architecture using Express.js with TypeScript. Routes are organized by feature domain (users, games, wallet, admin) with middleware for authentication and authorization.

**Authentication Flow**: 
- Password hashing uses Node.js crypto.scrypt (not bcrypt) for security
- Session-based authentication with Express sessions
- Role-based access control (RBAC) middleware validates user permissions for protected routes
- The system maintains backward compatibility with both crypto.scrypt and bcrypt password formats

**Data Access Layer**: Drizzle ORM provides type-safe database queries with a repository pattern implementation. The `storage.ts` module acts as the data access layer, abstracting database operations from business logic.

**Business Logic Organization**: Core business logic is separated into dedicated modules:
- Game result processing and payout calculations
- Commission and odds calculations
- Wallet transaction processing
- User hierarchy management (Admin → Subadmin → Player relationships)

### Database Design

**Schema Organization**: PostgreSQL database with the following core tables:
- `users`: Multi-role user accounts with hierarchical assignments
- `games`: Polymorphic game records supporting multiple game types
- `satamatka_markets`: Matka game market definitions with open/close times
- `team_matches`: Cricket and other team-based match data
- `transactions`: Wallet transaction history
- `wallet_requests`: Deposit/withdrawal request tracking
- `game_odds`: Configurable odds per game type (admin and subadmin-specific)
- `subadmin_commissions`: Commission rate configuration per subadmin
- `user_discounts`: Player-specific discount rates
- `player_deposit_discounts`: Deposit discount configurations

**Key Design Decisions**:
- User hierarchy implemented via `assigned_to` foreign key enabling cascading permissions
- Game results stored as enum values ('win', 'loss', 'pending') with separate payout amounts
- Market status tracking (open, waiting, resulted, cancelled) for game lifecycle management
- All monetary values stored as integers (multiplied by 100) to avoid floating-point precision issues

**Migrations**: Drizzle Kit manages schema migrations with version control, ensuring consistent database state across environments.

### Game Processing Logic

**Satamatka Game Modes**: The platform supports multiple Satamatka betting modes:
- **Jodi**: Two-digit number prediction (highest odds: 90x)
- **Harf/Single**: Single digit prediction (9x odds)
- **Crossing**: Digit combination matching (95x odds)
- **Odd/Even**: Odd or even number prediction (1.9x odds)

**Result Processing**: Game results are processed when market results are declared. The system:
1. Validates predictions against actual results based on game mode
2. Calculates payouts using configured odds
3. Updates user balances
4. Records transactions for audit trail
5. Handles commission distribution in subadmin hierarchy

**Odds Configuration**: Two-tier odds system:
- Admin-set default odds for all game types
- Subadmin-specific odds that override defaults for their assigned players
- Odds stored as integers (multiplied by 10,000 for precision)

### Wallet and Transaction Management

**Transaction Types**: The platform tracks multiple transaction types:
- Deposits (admin-to-player, admin-to-subadmin)
- Withdrawals (player-to-admin, subadmin-to-admin)
- Game wins/losses
- Commission payments
- Balance adjustments

**Request Workflow**: 
- Players submit deposit/withdrawal requests to their assigned subadmin or admin
- Subadmins and admins can approve/reject requests
- Approved transactions automatically update user balances
- All transactions maintain immutable audit logs

**Commission Distribution**: When subadmins fund player deposits, commissions are calculated based on configured rates and deducted from the deposit amount. This ensures proper profit distribution within the user hierarchy.

### Security Considerations

**Password Security**: The authentication system uses crypto.scrypt for password hashing with random salts. A dual-format system maintains backward compatibility with legacy bcrypt hashes while migrating to scrypt.

**Role-Based Access**: Middleware functions validate user roles before allowing access to protected routes. Subadmins can only access data for users assigned to them, while admins have full system access.

**Data Validation**: Zod schemas validate all incoming request data, preventing injection attacks and ensuring type safety throughout the application.

## External Dependencies

### Core Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting via `@neondatabase/serverless`
- **Drizzle ORM**: Type-safe database client and migration management

### Authentication & Security
- **crypto** (Node.js built-in): Primary password hashing using scrypt
- **bcrypt**: Legacy password hash support for backward compatibility

### API & Server
- **Express.js**: HTTP server and routing framework
- **express-session**: Session management for authentication
- **multer**: File upload handling (if needed for user documents)

### Frontend Libraries
- **React**: UI framework
- **TanStack Query**: Server state management and caching
- **Radix UI**: Headless accessible component primitives
- **React Hook Form**: Form state management
- **Zod**: Runtime type validation and schema parsing
- **Tailwind CSS**: Utility-first styling framework

### Development Tools
- **TypeScript**: Type safety across the entire stack
- **Vite**: Frontend build tool and dev server
- **tsx**: TypeScript execution for server and scripts
- **esbuild**: Production bundling for backend code
- **Drizzle Kit**: Database schema management and migrations

### Optional Integrations
- **Stripe**: Payment processing capability (libraries included but not actively used in core flows)