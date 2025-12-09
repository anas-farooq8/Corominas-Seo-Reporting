# Corominas SEO Reporting System

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/anasfarooq8888-8776s-projects/v0-seo-admin-dashboard)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/jCWVmL2xuA1)

## Overview

Professional SEO reporting and analytics dashboard for Corominas Consulting. This application provides secure authentication, client and project management, and data source integration with Mangools API.

The system uses a three-tier hierarchical structure: **Clients → Projects → Datasources → Domains**, allowing for organized management of multiple projects per client, with each project having its own dedicated data sources.

## Features

- 🔐 **Secure Authentication** - Supabase-powered authentication with session management
- 📱 **Responsive Design** - Mobile-first UI that works on all devices
- 👥 **Client Management** - Create, edit, and manage client accounts with search functionality
- 📊 **Project Organization** - Multiple projects per client with detailed tracking
- 📡 **Data Source Integration** - Connect and manage SEO data sources (Mangools, SEMrush)
- 🌐 **Domain Management** - Attach and track domains with smart conflict detection
- 🎨 **Dark Mode Support** - Full theme support with next-themes
- 🔄 **Cascading Operations** - Proper parent-child relationships with cascading deletes
- ⚡ **Optimized Performance** - Efficient database queries with proper indexing

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Supabase account and project
- Mangools API access (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/anas-farooq8/Corominas-Seo-Reporting-System.git
cd Corominas-Seo-Reporting-System
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Then edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Authentication

The login system includes:

- ✅ **Email/Password Authentication** - Secure login with Supabase Auth
- ✅ **Form Validation** - Client-side validation for email and password
- ✅ **Error Handling** - User-friendly error messages
- ✅ **Loading States** - Visual feedback during authentication
- ✅ **Session Management** - Automatic cookie handling via middleware
- ✅ **Protected Routes** - Middleware-based route protection
- ✅ **Mobile Responsive** - Optimized for all screen sizes
- ✅ **Accessibility** - ARIA labels and keyboard navigation

### Testing the Login Page

1. **Valid Login**: Use credentials from your Supabase Auth users
2. **Invalid Credentials**: Try wrong password - shows "Invalid email or password"
3. **Empty Fields**: Submit without filling - shows validation errors
4. **Invalid Email Format**: Try "test@" - shows format validation
5. **Short Password**: Try less than 6 characters - shows length validation
6. **Mobile View**: Test on mobile or resize browser to 375px width
7. **Loading State**: Check spinner appears during authentication
8. **Session Persistence**: Login, close browser, reopen - should stay logged in
9. **Protected Routes**: Try accessing /dashboard without login - redirects to /login
10. **Logout**: Test logout and try accessing dashboard - should redirect to login

### Cookie Handling

The application uses Supabase SSR for proper cookie management:

- **Client-side** (`lib/supabase/client.ts`): Browser-based auth using `createBrowserClient`
- **Server-side** (`lib/supabase/server.ts`): Server Components using `createServerClient`
- **Middleware** (`middleware.ts`): Session refresh and route protection
- **Cookies Set**: `sb-access-token`, `sb-refresh-token` with secure httpOnly flags
- **Auto-refresh**: Middleware automatically refreshes expired sessions

## System Architecture

### Hierarchical Structure

```
Clients (Organizations/Companies)
  └── Projects (Individual campaigns/websites)
      └── Datasources (SEO data integrations)
          └── Domains (Tracked websites)
```

### Key Business Rules

1. **Domain Uniqueness**: Each domain can only be attached to one datasource globally
2. **Type Limitation**: Within a project, only one domain per datasource type (e.g., one domain for Mangools)
3. **Cascading Deletes**: Deleting a client removes all its projects, datasources, and domain attachments
4. **Smart UI**: Once a datasource has a domain attached, the available domains section is hidden

## Project Structure

```
app/
├── api/
│   ├── clients/           # Client API endpoints
│   ├── projects/          # Project API endpoints
│   ├── datasources/       # Datasource API endpoints
│   ├── domains/           # Domain management
│   └── mangools/          # Mangools API integration
├── dashboard/
│   ├── clients/[id]/      # Client detail with projects list
│   ├── projects/[id]/     # Project detail with datasources list
│   ├── layout.tsx         # Dashboard layout with sidebar
│   └── page.tsx           # Main dashboard (clients list)
└── login/                 # Authentication page

components/
├── ui/                    # Reusable UI components (shadcn/ui)
├── clients/               # Client management components
├── projects/              # Project management components
├── datasources/           # Datasource management components
└── dashboard/             # Dashboard layout components

lib/
├── db/                    # Database operations
│   ├── clients.ts         # Client CRUD operations
│   ├── projects.ts        # Project CRUD operations
│   └── datasources.ts     # Datasource CRUD operations
├── actions/               # Server actions for mutations
│   ├── clients.ts         # Client actions
│   ├── projects.ts        # Project actions
│   ├── datasources.ts     # Datasource actions
│   └── domains.ts         # Domain attachment actions
├── supabase/              # Supabase configuration
│   ├── client.ts          # Browser client
│   ├── server.ts          # Server client
│   └── types.ts           # TypeScript types
└── mangools/
    └── api.ts             # Mangools API integration

scripts/
├── 01-init-schema.sql     # Complete database schema
└── 02-migrate-to-clients-projects.sql  # Migration from old structure
```

## Database Setup

### For New Installations

Run the complete schema:
```bash
psql -d your_database < scripts/01-init-schema.sql
```

### For Existing Installations (Migration)

If you're upgrading from the old customer-based structure:
```bash
psql -d your_database < scripts/02-migrate-to-clients-projects.sql
```

This migration will:
- Rename `customers` table to `clients`
- Create the new `projects` table
- Create a default project for each existing client
- Migrate all datasources to the default projects
- Update all foreign key relationships

For detailed migration information, see [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md)

## API Endpoints

### Clients
- `GET /api/clients` - Get all clients with project counts
- `GET /api/clients/[id]` - Get specific client with projects

### Projects
- `GET /api/projects/[id]` - Get project with datasources

### Datasources
- `GET /api/datasources/[projectId]` - Get all datasources for a project
- `GET /api/datasources/domains/[datasourceId]` - Get domains for a datasource

### Domains
- `GET /api/domains/attached` - Get all globally attached domains
- `GET /api/mangools/domains` - Get available Mangools domains

## Usage Flow

1. **Create a Client** - Add a new client organization
2. **Add Projects** - Create projects under the client (e.g., "Main Website", "Blog")
3. **Configure Datasources** - Add data sources (Mangools, SEMrush) to each project
4. **Attach Domains** - Link domains to datasources for tracking
5. **Monitor** - View and manage all data from the dashboard

## Deployment

Your project is live at:

**[https://vercel.com/anasfarooq8888-8776s-projects/v0-seo-admin-dashboard](https://vercel.com/anasfarooq8888-8776s-projects/v0-seo-admin-dashboard)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/jCWVmL2xuA1](https://v0.app/chat/jCWVmL2xuA1)**

## Documentation

- **[IMPLEMENTATION-SUMMARY.md](./IMPLEMENTATION-SUMMARY.md)** - Complete list of changes and implementation details
- **[MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md)** - Detailed migration instructions and breaking changes

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Components**: shadcn/ui (Radix UI)
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Type Safety**: TypeScript
- **Package Manager**: pnpm

## License

Private repository - All rights reserved