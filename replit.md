# Ofertnik - Sebastian Popiel :: PPP :: Program Equipment Rental System

## Overview

Ofertnik is a comprehensive equipment rental pricing system for Sebastian Popiel :: PPP :: Program, focusing on automated quote generation with tiered discount pricing. It includes equipment catalog management, client management, and admin controls. The application aims to streamline the rental process, provide accurate pricing, and offer robust management capabilities for construction equipment.

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
- **Users**: Role-based access (admin/employee)
- **Equipment Categories**: Hierarchical organization
- **Equipment**: Items with specifications, quantities, and availability
- **Equipment Pricing**: Tiered pricing with period-based discounts
- **Clients**: Company and contact information
- **Quotes**: Quote generation with line items and automatic calculations
- **Sessions**: Secure session storage

### Key Features
- **Authentication System**: Replit OIDC integration with role-based access control. User approval workflow for new registrations.
- **Equipment Management**: CRUD operations for equipment, categories, and inventory tracking. Includes support for diverse equipment types (e.g., vehicles with km-based calculations, engine equipment with motohour intervals).
- **Quote Generation System**: Dynamic pricing based on rental period with tiered discounts (e.g., 1-2 days: base price; 3-7 days: 14.29% discount; 8-18 days: 28.57% discount; 19-29 days: 42.86% discount; 30+ days: 57.14% discount). Supports additional equipment/accessories, installation, disassembly, and travel/service costs.
- **Admin Panel**: Comprehensive management for equipment, pricing, users (including approval/rejection), and service costs.

## External Dependencies

- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **react-hook-form**: Form state management
- **passport**: Authentication middleware
- **openid-client**: OIDC authentication
- **TypeScript**: Type safety across the stack
- **Vite**: Fast development builds
- **Tailwind CSS**: Utility-first styling
- **ESBuild**: Production bundling
- **Drizzle Kit**: Database migrations
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Development tooling