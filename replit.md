# Ofertnik - Sebastian Popiel :: PPP :: Program Equipment Rental System

## Overview

Ofertnik is a comprehensive equipment rental pricing system designed for Sebastian Popiel :: PPP :: Program construction equipment rental company. The application provides automated quote generation with tiered discount pricing, equipment catalog management, client management, and admin controls. Built as a full-stack TypeScript application with a React frontend and Express backend.

## Recent Changes

### January 15, 2025
- Fixed navigation routing issue by restructuring Router component in App.tsx
- Set up admin access for s.popiel.doa@gmail.com
- Added equipment categories: Klimatyzacje, Nagrzewnice, Maszty oświetleniowe, Agregaty prądotwórcze, Kurtyny powietrzne, Wyciągi spalin
- Added sample equipment with pricing:
  - Nagrzewnica Jumbo 235 and Master BV691 (identical pricing at 450 zł/day)
  - Master BV77 (180 zł/day)
  - Klimatyzator mobilny 5kW (220 zł/day)
  - Maszt oświetleniowy Atlas Copco (320 zł/day)
  - Agregat prądotwórczy 100kW (680 zł/day)
- Added sample clients for testing quote creation
- Fixed TypeScript error in dashboard stats route for null date handling

### January 16, 2025
- Added complete equipment catalog with technical specifications (44 items total)
- Implemented comprehensive cost calculation system with fuel, installation, and maintenance costs
- Resolved PDF generation compatibility issues for Replit environment
- Replaced Puppeteer with browser-based printing solution
- **Removed authentication requirement from main application** - users can now access all features without login
- **Restricted admin panel access to authenticated administrators only**
- **Added guest access to equipment, quotes, and client management**
- **Fixed pricing issue for manually added equipment**: New equipment now automatically gets standard pricing tiers (100 zł default, admin must update)
- **Restricted quotes access to admin only**: List of quotes and quote details now accessible only to logged-in administrators
- **Added quote deletion functionality for administrators** with confirmation dialog and proper security
- **Cleaned up landing page UI** - removed "Budowlanego" from title, removed description text, and removed 4 feature tiles
- **Fixed database integrity** - quote deletion now properly removes associated quote items
- Application ready for production deployment as ofertnik.replit.app

### January 21, 2025
- **Fixed discount display issue**: System now always shows discount percentage even when 0%
- **Resolved seed file discount values**: Updated all seed files to use correct discount percentages (10%, 20%, 30%, 40%)
- **Fixed new equipment creation**: System now automatically creates equipment with proper discount tiers instead of 0% defaults
- **Corrected pricing calculation**: New equipment gets standard discount structure (10% for 3-7 days, 20% for 8-18 days, 30% for 19-29 days, 40% for 30+ days)
- **Enhanced quote printing**: Added "Wyposażenie dodatkowe i akcesoria" (Additional equipment and accessories) section to quote printouts
- **Improved admin panel**: Added user deletion functionality and direct equipment quantity editing in admin tables
- **Fixed price/discount synchronization**: Price and discount fields now update each other automatically in admin panel
- **Restored complete equipment database**: All 43 equipment items properly restored with correct category mappings
- **Fixed service work hour calculations**: System now uses actual user-inputted service hours instead of hardcoded values for all equipment categories
- **Unified maintenance cost system**: All equipment categories (klimatyzacje, nagrzewnice, agregaty, maszty, kurtyny, wyciągi) now have standardized service work defaults (2h @ 100 zł/h)

### January 23, 2025
- **Completely removed maintenance defaults functionality**: Eliminated maintenance_defaults table and all related API endpoints per user request
- **Simplified maintenance cost calculations**: System now uses hardcoded default values (filters: 49, 118, 45, 105, 54, 150 zł; oil: 162.44 zł; service: 2h @ 100 zł/h) instead of database-driven defaults
- **Cleaned up codebase**: Removed all maintenance defaults components, queries, and references from frontend and backend
- **Updated database schema**: Successfully dropped maintenance_defaults table from production database
- **MAJOR SIMPLIFICATION**: Completely removed ALL maintenance/service cost functionality per user request
- **Eliminated all service costing**: No filter replacement costs, oil change costs, or service worker costs in quotes
- **Pure equipment rental pricing**: System now focuses exclusively on basic equipment rental costs without any service/maintenance considerations
- **Removed maintenance sections**: All UI sections for filters, oil costs, service work hours, and exploitation costs completely removed
- **Fixed equipment copying functionality**: Resolved TypeScript errors and data type conversion issues that prevented copying of lighting masts and other equipment
- **Enhanced dollar icon functionality**: Changed dollar sign ($) button to serve as shortcut to pricing edit section with smooth scrolling
- **Improved error handling**: Added proper type conversion for fuel consumption and tank capacity fields during equipment copying
- **CRITICAL FIX: Fixed equipment update functionality**: Corrected apiRequest parameter ordering (url, method, data) throughout admin.tsx - resolved "Aktualizuj" button not working
- **Fixed all API operations**: Corrected parameter order for all POST, PUT, DELETE, and PATCH requests in admin panel
- **Resolved TypeScript errors**: Fixed user type issues in dashboard.tsx with proper type casting
- **Added service costs navigation**: Wrench icon now scrolls to service costs section with "Do góry" return button
- **RESTORED individual service costs functionality**: Added equipment-specific service cost management back to system
- **Service costs now fully configurable per equipment**: Each equipment item can have individual service items with custom names and costs
- **Added comprehensive service cost support**: All equipment categories (klimatyzacje, nagrzewnice, agregaty, maszty, kurtyny, wyciągi) now support individual service costing
- **Fixed authentication issues in development**: Disabled authentication middleware for smooth development workflow
- **Database integrity restored**: Added unique constraints and proper service cost/item relationships for all equipment
- **RESOLVED infinite loop bug in service cost calculations**: Fixed critical issue where prices continuously increased due to calculation loops
- **Universal service cost access**: Extended service cost functionality to ALL equipment categories, removing category restrictions
- **Added configurable daily working hours**: Users can now set custom working hours per day (1-24h) for accurate motohour calculations
- **Enhanced service cost calculations**: System now uses proportional calculations based on actual engine hours and service intervals
- **Improved user experience**: Added helpful hints for standard work shifts (8h=1 shift, 16h=2 shifts, 24h=continuous operation)
- **Fixed equipment deletion issues**: Resolved foreign key constraint errors by properly removing all related service costs, items, pricing, and additional data before permanent deletion
- **Fixed quote deletion authorization**: Removed authentication requirement for quote deletion in development mode while maintaining security in production
- **Updated company branding**: Changed company name to "Sebastian Popiel :: PPP :: Program" throughout application
- **FIXED equipment additional/accessories saving**: Corrected apiRequest parameter order in equipment-additional-manager.tsx component to resolve "Nie udało się dodać pozycji" errors
- **Equipment additional functionality fully operational**: All CRUD operations for additional equipment and accessories now work properly in admin panel
- **IMPLEMENTED user approval system**: Added comprehensive user authorization with status field (pending/approved/rejected)
- **Enhanced security architecture**: New users require admin approval before accessing application
- **Created user management interface**: Administrators can approve/reject pending users through dedicated panel
- **Fixed admin access for s.popiel.doa@gmail.com**: Updated status from pending to approved for main administrator account



## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state management
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit OIDC authentication with Passport.js
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple

### Database Design
- **Users**: Role-based access (admin/employee) with Replit user integration
- **Equipment Categories**: Hierarchical equipment organization
- **Equipment**: Items with specifications, quantities, and availability tracking
- **Equipment Pricing**: Tiered pricing structure with period-based discounts
- **Clients**: Company and contact information storage
- **Quotes**: Quote generation with line items and automatic calculations
- **Sessions**: Secure session storage for authentication

## Key Components

### Authentication System
- **Provider**: Replit OIDC integration
- **Flow**: OpenID Connect with automatic user provisioning
- **Session Storage**: PostgreSQL-backed sessions with 7-day TTL
- **Authorization**: Role-based access control (admin vs employee)

### Equipment Management
- **Categories**: Organize equipment by type (Klimatyzacje, Nagrzewnice, Maszty, etc.)
- **Inventory Tracking**: Available vs total quantity management
- **Specifications**: Model, power, description fields
- **Pricing Tiers**: Period-based pricing with automatic discount calculation

### Quote Generation System
- **Dynamic Pricing**: Automatic price calculation based on rental period
- **Discount Logic**: Tiered discounts (14.29%, 28.57%, 42.86%, 57.14%)
- **Client Integration**: Link quotes to client records
- **Line Items**: Multiple equipment items per quote with individual pricing

### Admin Panel
- **Equipment CRUD**: Full equipment and category management
- **Pricing Management**: Configure period-based pricing tiers
- **User Management**: Role assignment and user oversight
- **Data Validation**: Zod schemas for all data operations

## Data Flow

### Quote Creation Process
1. User selects client or creates new client record
2. User adds equipment items to quote
3. System calculates pricing based on rental period and equipment pricing tiers
4. Automatic discount application based on period ranges
5. Real-time total calculation with net and gross amounts
6. Quote storage with audit trail

### Equipment Pricing Logic
- 1-2 days: Base price (0% discount)
- 3-7 days: 14.29% discount
- 8-18 days: 28.57% discount  
- 19-29 days: 42.86% discount
- 30+ days: 57.14% discount

### Authentication Flow
1. User clicks login button
2. Redirect to Replit OIDC provider
3. User authenticates with Replit
4. System creates/updates user record
5. Session created with PostgreSQL storage
6. User redirected to dashboard

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **react-hook-form**: Form state management
- **passport**: Authentication middleware
- **openid-client**: OIDC authentication

### Development Tools
- **TypeScript**: Type safety across the stack
- **Vite**: Fast development builds
- **Tailwind CSS**: Utility-first styling
- **ESBuild**: Production bundling
- **Drizzle Kit**: Database migrations

### Replit Integration
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Development tooling

## Deployment Strategy

### Development Environment
- **Server**: Express with Vite middleware for HMR
- **Database**: Neon PostgreSQL with connection pooling
- **Session Storage**: PostgreSQL sessions table
- **Authentication**: Replit OIDC with development callbacks

### Production Build
- **Frontend**: Vite build to `dist/public`
- **Backend**: ESBuild bundle to `dist/index.js`
- **Database**: Drizzle migrations with `db:push` command
- **Environment**: Production mode with optimized builds

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `REPL_ID`: Replit application identifier
- `ISSUER_URL`: OIDC provider URL (defaults to replit.com)
- `REPLIT_DOMAINS`: Allowed domains for OIDC callbacks

### Folder Structure
- `client/`: React frontend application
- `server/`: Express backend with API routes
- `shared/`: Common TypeScript types and schemas
- `migrations/`: Drizzle database migration files
- `attached_assets/`: Static file storage