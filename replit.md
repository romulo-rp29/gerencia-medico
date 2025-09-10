# GastroMed Practice Management System

## Overview

GastroMed is a comprehensive medical practice management system designed specifically for gastroenterology practices. The application provides a full-stack solution for managing patients, appointments, procedures, billing, and reports. Built with modern web technologies, it offers a responsive interface for healthcare providers to efficiently manage their practice operations.

The system supports role-based access control with doctor and receptionist roles, enabling appropriate workflow management across different user types. Key features include patient management with comprehensive medical histories, appointment scheduling with different types (consultation, endoscopy), procedure tracking, billing management, and comprehensive reporting capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React 18 and TypeScript, utilizing a modern component-based architecture. The application uses Vite as the build tool for fast development and optimized production builds. Routing is handled by Wouter for lightweight client-side navigation.

The UI is constructed using shadcn/ui components built on top of Radix UI primitives, providing accessible and customizable interface elements. Styling is implemented with Tailwind CSS using a custom design system with medical-specific color variables and theming support.

State management leverages TanStack Query (React Query) for server state management, providing caching, synchronization, and background updates. Form handling is managed through React Hook Form with Zod schema validation for type-safe form processing.

### Backend Architecture
The backend follows a RESTful API design pattern built with Express.js and TypeScript. The server implements a modular route structure with comprehensive error handling and request/response logging middleware.

The storage layer is abstracted through an interface-based pattern, allowing for flexible data persistence implementations. Authentication is handled through a simple username/password system with session management stored in localStorage on the client side.

API endpoints are organized by domain (auth, dashboard, patients, appointments, procedures, billing) with consistent response patterns and error handling across all routes.

### Data Storage Solutions
The application uses PostgreSQL as the primary database, configured through Drizzle ORM for type-safe database interactions. Database schema is defined using Drizzle's schema builder with support for enums, relationships, and complex data types.

Connection management is handled through Neon Database serverless PostgreSQL, providing scalable database infrastructure. Database migrations are managed through Drizzle Kit with version control and schema synchronization capabilities.

The schema includes comprehensive tables for users, patients, appointments, procedures, and billing records with proper foreign key relationships and data integrity constraints.

### Authentication and Authorization
The system implements a role-based authentication system with two primary roles: doctors and receptionists. Authentication is handled through a simple login system that validates credentials against stored user data.

Session management is currently implemented using localStorage for client-side session persistence. The system includes permission checking utilities that determine user access levels based on their assigned role.

Authorization is enforced both on the client side through conditional rendering and on the server side through route protection middleware.

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting providing scalable database infrastructure
- **Drizzle ORM**: Type-safe database toolkit for schema management and query building
- **PostgreSQL**: Primary database system for data persistence

### UI and Styling
- **shadcn/ui**: Component library built on Radix UI primitives for accessible UI components
- **Radix UI**: Low-level UI primitive library providing accessible component foundations
- **Tailwind CSS**: Utility-first CSS framework for styling and responsive design
- **Lucide Icons**: Icon library providing consistent iconography throughout the application

### Development and Build Tools
- **Vite**: Build tool and development server for fast development experience
- **TypeScript**: Type system for enhanced development experience and code reliability
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing tool for build-time transformations

### Runtime Libraries
- **TanStack Query**: Server state management for data fetching, caching, and synchronization
- **React Hook Form**: Form library for handling form state and validation
- **Zod**: Schema validation library for runtime type checking
- **Wouter**: Lightweight routing library for client-side navigation
- **date-fns**: Date utility library for date formatting and manipulation

### Development Environment
- **Replit**: Development environment with specialized plugins for runtime error handling and debugging
- **Node.js**: JavaScript runtime environment for server-side execution