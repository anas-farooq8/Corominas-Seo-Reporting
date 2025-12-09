# Corominas SEO Reporting System

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/anasfarooq8888-8776s-projects/v0-seo-admin-dashboard)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/jCWVmL2xuA1)

## Overview

Professional SEO reporting and analytics dashboard for Corominas Consulting. This application provides secure authentication, customer management, and data source integration with Mangools API.

## Features

- 🔐 **Secure Authentication** - Supabase-powered authentication with session management
- 📱 **Responsive Design** - Mobile-first UI that works on all devices
- 👥 **Customer Management** - Create, edit, and manage client accounts
- 📊 **Data Source Integration** - Connect and manage SEO data sources
- 🌐 **Domain Management** - Attach and track domains for each data source
- 🎨 **Dark Mode Support** - Full theme support with next-themes

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

## Project Structure

```
app/
├── api/              # API routes (Mangools integration)
├── dashboard/        # Protected dashboard pages
├── login/           # Authentication page
└── layout.tsx       # Root layout with metadata

components/
├── ui/              # Reusable UI components (shadcn/ui)
├── customers/       # Customer management components
├── datasources/     # Data source management components
└── dashboard/       # Dashboard-specific components

lib/
├── actions/         # Server actions for data mutations
├── db/              # Database queries
├── supabase/        # Supabase client configuration
└── mangools/        # Mangools API integration
```

## Deployment

Your project is live at:

**[https://vercel.com/anasfarooq8888-8776s-projects/v0-seo-admin-dashboard](https://vercel.com/anasfarooq8888-8776s-projects/v0-seo-admin-dashboard)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/jCWVmL2xuA1](https://v0.app/chat/jCWVmL2xuA1)**

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