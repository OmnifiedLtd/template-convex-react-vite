# Agent Instructions

This file contains instructions for specialized AI agents working with this codebase.

## Project Overview

This is a full-stack TypeScript template for building modern web applications with React, Convex, and TypeScript. It includes authentication, real-time data sync, file storage, and a complete UI component library.

**Tech Stack:**
- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: Convex (real-time database, serverless functions)
- **Auth**: Convex Auth with Resend OTP (passwordless email authentication)
- **UI**: Radix UI primitives + shadcn/ui components

## Monorepo Structure

```
template-full-stack-convex/
├── apps/
│   └── app/                    # React SPA
│       ├── src/
│       ├── public/
│       └── package.json
│
├── convex/                     # Convex backend
│   ├── schema.ts              # Database schema
│   ├── auth.ts                # Auth configuration
│   ├── tasks.ts               # Example CRUD
│   └── lib/auth.ts            # Auth helpers
│
├── package.json               # Root workspace
├── CLAUDE.md                  # Development guidelines
└── SETUP.md                   # Setup instructions
```

## Key Files

### Backend (Convex)

- `convex/schema.ts` - Database schema with auth tables + example tasks table
- `convex/auth.ts` - Convex Auth configuration with Resend OTP
- `convex/auth.config.ts` - Auth domain configuration
- `convex/tasks.ts` - Example CRUD operations demonstrating patterns
- `convex/users.ts` - User queries
- `convex/storage.ts` - File storage utilities
- `convex/lib/auth.ts` - Auth helper functions

### Frontend (React)

- `apps/app/src/main.tsx` - App entry with ConvexAuthProvider
- `apps/app/src/App.tsx` - React Router routes
- `apps/app/src/pages/Auth.tsx` - Authentication page
- `apps/app/src/pages/Home.tsx` - Example home page with task list
- `apps/app/src/components/layout/` - Layout components
- `apps/app/src/components/ui/` - shadcn/ui component library
- `apps/app/src/hooks/useAuth.ts` - Custom auth hook

## Development Commands

```bash
# Start dev server (frontend + backend)
npm run dev

# Start only frontend
npm run dev:app

# Start only backend
npm run dev:backend

# Restart dev server (kills ports 5173-5175)
npm run dev:restart

# Build for production
npm run build

# Lint code
npm run lint

# Type check
npm run typecheck
```

## Environment Setup

### Local Development (`.env.local`)

```bash
# Convex deployment (auto-configured on first run)
CONVEX_DEPLOYMENT=dev:your-deployment-name
VITE_CONVEX_URL=https://your-deployment.convex.cloud

# Enable dev password auth (optional)
VITE_ENABLE_DEV_PASSWORD_AUTH=true
```

### Convex Dashboard Variables

Set in Convex Dashboard > Settings > Environment Variables:

```bash
# Resend API key for OTP emails
AUTH_RESEND_KEY=re_your_resend_api_key

# Frontend URL for auth callbacks
SITE_URL=http://localhost:5173
```

## Authentication

Uses Convex Auth with Resend OTP for passwordless email authentication.

### Dev Password Mode (Optional)

When `VITE_ENABLE_DEV_PASSWORD_AUTH=true`:
- Email: `test@yourapp.local`
- Password: `TestUser2026#Secure!`

This bypasses OTP emails for faster local testing.

## Database Schema

### Auth Tables (from Convex Auth)
- `users` - User accounts
- `accounts` - OAuth/email account links
- `sessions` - Active sessions
- `verificationCodes` - OTP codes

### Example Tables
- `tasks` - Example CRUD table demonstrating patterns
  - Fields: userId, title, description, completed, createdAt
  - Indexes: by_user, by_user_and_completed

## Agent Guidelines

### When Adding Features

1. **Define Schema First** - Add tables to `convex/schema.ts`
2. **Create Convex Functions** - Add queries/mutations/actions
3. **Use Auth Helpers** - Import from `convex/lib/auth.ts`
4. **Add React Components** - Use hooks from `convex/react`
5. **Follow Type Safety** - Use generated types from `convex/_generated/`

### Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Use Tailwind for styling
- Prefer functional components and hooks
- Keep components focused and single-responsibility
- Use Convex validators for all function args/returns

### Important Notes

- Always read `CLAUDE.md` before making changes
- Never push directly to main - use feature branches
- Always commit `convex/_generated/` to git
- Run `npm run typecheck` before committing
- Test authentication flow after backend changes

## Common Patterns

### Authenticated Query

```typescript
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    return await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});
```

### Authenticated Mutation

```typescript
export const create = mutation({
  args: {
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    return await ctx.db.insert("tasks", {
      userId,
      title: args.title,
      createdAt: Date.now(),
    });
  },
});
```

### React Component

```tsx
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";

function MyComponent() {
  const data = useQuery(api.tasks.list);
  const create = useMutation(api.tasks.create);

  return <div>...</div>;
}
```

## Resources

- [Convex Documentation](https://docs.convex.dev)
- [Convex Auth Documentation](https://labs.convex.dev/auth)
- [React Documentation](https://react.dev)
- [TailwindCSS Documentation](https://tailwindcss.com)
- [shadcn/ui Components](https://ui.shadcn.com)
