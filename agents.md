# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack TypeScript template for building modern web applications with React, Convex, and TypeScript. It includes authentication, real-time data sync, file storage, and a complete UI component library.

## Development Commands

```bash
# Start app and backend concurrently
npm run dev

# Start only the React app (Vite dev server on port 5173)
npm run dev:app

# Start only backend (Convex dev server)
npm run dev:backend

# Restart dev server (kills ports 5173-5175, then starts fresh)
# Use this when ports are occupied or auth callback fails
npm run dev:restart

# Build for production
npm run build

# Lint all workspaces
npm run lint

# Typecheck everything
npm run typecheck
```

**Note on port 5173**: The Convex Auth `SITE_URL` environment variable is configured for `http://localhost:5173`. If Vite starts on a different port (5174, 5175, etc.), use `npm run dev:restart` to ensure the server starts on the correct port.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: Convex (real-time database, serverless functions)
- **Auth**: Convex Auth with Resend OTP (passwordless email authentication)
- **UI**: Radix UI primitives + custom components in `apps/app/src/components/ui/`
- **Error Monitoring**: Sentry (optional - frontend via `@sentry/react`, backend via Convex integration)

## Architecture

### Project Structure

```
template-full-stack-convex/
├── apps/
│   └── app/                    # Vite + React SPA
│       ├── src/
│       ├── public/
│       ├── package.json
│       ├── vite.config.ts
│       └── vercel.json
│
├── convex/                     # Convex backend
├── package.json                # Root workspace config
└── CLAUDE.md
```

### Backend (Convex)

All backend code lives in `convex/`. **Read `convex_rules.mdc` before writing any Convex code** - it contains essential patterns and syntax requirements.

Key patterns:

- Public functions use `query`, `mutation`, `action`
- Internal functions use `internalQuery`, `internalMutation`, `internalAction`
- Auth helper at `convex/lib/auth.ts` - use `getAuthUserId(ctx)` in handlers
- All functions require explicit `args` and `returns` validators
- Actions needing Node.js must have `"use node";` at file top

**Schema evolution**: When adding new fields to a schema, make them `v.optional()` to maintain backward compatibility with existing documents.

**CRITICAL**: Before returning to the user, always ensure Convex code is typechecked and successfully deployed to dev. Run `npx convex dev --once` to verify there are no type errors and the deployment succeeds.

Structure:

- `convex/schema.ts` - Database schema with all tables and indexes
- `convex/auth.ts` - Convex Auth configuration
- `convex/tasks.ts` - Example CRUD operations
- `convex/users.ts` - User queries
- `convex/storage.ts` - File storage utilities
- `convex/lib/auth.ts` - Auth helper functions

**Git best practices**:

- Never push directly to main. Always work in feature or fix branches and create pull requests.
- Always commit `convex/_generated/` to git. This is the official Convex recommendation - it allows code to typecheck without running `npx convex dev` and lets developers run against production by just setting `VITE_CONVEX_URL`.
- Always commit `package-lock.json` to git. This ensures reproducible builds by locking exact dependency versions across all environments.

**CI/CD verification** - Before returning to the user (and certainly before making a PR), ensure all CI checks pass by running these commands locally:

```bash
# Run linter (must pass with no errors)
npm run lint

# Typecheck Convex functions
npx convex typecheck

# Typecheck frontend
cd apps/app && npx tsc --noEmit
```

All commands must pass without errors. Fix any issues before committing.

**Production deployment**: Convex backend can be deployed to production using `npx convex deploy --prod`. For CI/CD, set up GitHub Actions with Convex deploy keys.

### Frontend (React App)

Located in `apps/app/`:

- `src/main.tsx` - App entry with ConvexAuthProvider
- `src/App.tsx` - React Router routes
- `src/hooks/convex/` - Centralized Convex hook exports
- `src/components/layout/` - AuthGuard, MainLayout, Header
- `@` alias maps to `./src/`
- `convex/_generated` alias maps to `../../convex/_generated`

### Data Flow

1. Authentication: Email OTP flow via Convex Auth + Resend
2. Real-time sync: Convex queries automatically re-run when data changes
3. File uploads: Generate signed upload URLs, upload to Convex storage, save storage ID in database

## Environment Variables

### Dev vs Production Environments

This template supports separate Convex deployments for development and production.

### Local Development Setup (`.env.local`)

For local development, create `.env.local` in the root directory:

```bash
# Deployment used by `npx convex dev`
CONVEX_DEPLOYMENT=dev:your-deployment-name # Get from Convex dashboard

VITE_CONVEX_URL=https://your-deployment.convex.cloud

# Optional: Enable dev password auth for local testing
VITE_ENABLE_DEV_PASSWORD_AUTH=true

# Optional: Sentry error monitoring (dev environment)
# VITE_SENTRY_DSN=your-sentry-dsn
```

**Dev Password Authentication**

When `VITE_ENABLE_DEV_PASSWORD_AUTH=true` is set, a "Dev Password Sign-in" section appears on the auth page with default credentials:

- Email: `test@yourapp.local`
- Password: `TestUser2026#Secure!`

This bypasses the OTP email flow, which is useful for local testing since Resend only sends to verified emails in dev mode.

### Backend Environment Variables (Convex Dashboard)

Set these in the Convex Dashboard for both dev and production deployments:

- `AUTH_RESEND_KEY` - Resend API key for sending OTP emails
- `SITE_URL` - Frontend URL (e.g., `http://localhost:5173` for dev, `https://your-app.vercel.app` for prod)

**⚠️ IMPORTANT: SITE_URL Must Match Your Frontend**

The `SITE_URL` environment variable in Convex must match the URL where your frontend is hosted. Without it, authentication will fail with "Missing environment variable SITE_URL".

### Production Environment Variables (Vercel)

For the React app:

```
VITE_CONVEX_URL=https://your-production-deployment.convex.cloud
# VITE_SENTRY_DSN=your-production-sentry-dsn (optional)
```

## Convex Auth Setup

Convex Auth requires several environment variables to function. Run this command to auto-generate and set them:

```bash
npx @convex-dev/auth
```

This sets up:
- `JWT_PRIVATE_KEY` - Required for signing authentication tokens
- `JWKS` - JSON Web Key Set for token verification
- `SITE_URL` - Frontend URL for auth callbacks

### Dev Password Auth Configuration

Dev password authentication requires **two separate environment variables**:

| Variable | Location | Purpose |
|----------|----------|---------|
| `VITE_ENABLE_DEV_PASSWORD_AUTH=true` | `.env.local` (frontend) | Shows the dev password form on the auth page |
| `ENABLE_DEV_PASSWORD_AUTH=true` | Convex Dashboard | Enables the dev-password auth provider in the backend |

Both must be set for dev password auth to work. Set the Convex env var with:

```bash
npx convex env set ENABLE_DEV_PASSWORD_AUTH true
```

### Credential Matching

The dev password credentials must match between frontend and backend:

- Frontend defaults are in `apps/app/src/pages/Auth.tsx`
- Backend defaults are in `convex/auth.ts`

To customize, set these Convex environment variables:
- `DEV_PASSWORD_AUTH_EMAIL` - Must match the email used in the frontend form
- `DEV_PASSWORD_AUTH_PASSWORD` - Must match the password used in the frontend form

## Development Testing

For local development, authentication uses Convex Auth with Resend OTP. During testing:

1. **Resend Testing Mode**: Until you verify a domain in Resend, you can only send OTP emails to the account owner's email address.
2. **Enter your email** on the auth page and check your inbox for the 8-digit code.
3. Codes expire after 20 minutes.

## Key Tables

- `users`, `accounts`, `sessions`, `verificationCodes` - Convex Auth tables
- `tasks` - Example table demonstrating CRUD operations with user ownership

## Convex MCP Tools

Proactively use the Convex MCP server tools when working with this codebase:

- `mcp__convex__status` - Get deployment info
- `mcp__convex__tables` - View all tables and their schemas
- `mcp__convex__data` - Read data from tables to debug or verify state
- `mcp__convex__functionSpec` - List all Convex functions with their args/returns
- `mcp__convex__run` - Execute queries/mutations/actions directly
- `mcp__convex__logs` - Fetch recent function execution logs for debugging
- `mcp__convex__runOneoffQuery` - Run ad-hoc read-only queries
- `mcp__convex__envList/Get/Set/Remove` - Manage environment variables

Use these tools to inspect live data, debug issues, and verify changes without needing to check the browser.

## Adding New Features

### 1. Define Schema

Add new tables to `convex/schema.ts`:

```typescript
posts: defineTable({
  userId: v.string(),
  title: v.string(),
  content: v.string(),
  createdAt: v.number(),
}).index("by_user", ["userId"]),
```

### 2. Create Convex Functions

Create `convex/posts.ts`:

```typescript
import { v } from 'convex/values'
import { query, mutation } from './_generated/server'
import { getAuthUserId } from './lib/auth'

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    return await ctx.db
      .query('posts')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()
  },
})

export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    return await ctx.db.insert('posts', {
      userId,
      title: args.title,
      content: args.content,
      createdAt: Date.now(),
    })
  },
})
```

### 3. Create React Components

Use the hooks in your components:

```tsx
import { useQuery, useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'

function PostsList() {
  const posts = useQuery(api.posts.list)
  const createPost = useMutation(api.posts.create)

  return <div>...</div>
}
```

## Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Use Tailwind for styling
- Prefer functional components and hooks
- Keep components focused and single-responsibility
- Use Convex validators for all function args and returns
