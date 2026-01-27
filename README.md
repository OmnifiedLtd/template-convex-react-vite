# Full-Stack TypeScript Template

A modern, production-ready template for building full-stack applications with React, Convex, and TypeScript.

## Features

- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS
- **Backend:** Convex (real-time database, serverless functions)
- **Auth:** Convex Auth with Resend OTP (passwordless email authentication)
- **UI Components:** Radix UI primitives + shadcn/ui
- **Styling:** TailwindCSS with custom design tokens
- **Type Safety:** End-to-end TypeScript with Convex schema validation
- **File Storage:** Built-in Convex file storage with upload/download utilities
- **Dev Tools:** Hot reload, ESLint, Prettier

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (frontend + Convex backend)
npm run dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
├── convex/                 # Convex backend
│   ├── schema.ts          # Database schema
│   ├── auth.ts            # Authentication config
│   ├── tasks.ts           # Example CRUD functions
│   ├── users.ts           # User queries
│   ├── storage.ts         # File storage utilities
│   └── lib/
│       └── auth.ts        # Auth helpers
├── apps/app/              # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── ui/       # shadcn/ui components
│   │   │   └── layout/   # Layout components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── pages/        # Page components
│   │   └── lib/          # Utilities
│   └── public/           # Static assets
└── package.json          # Workspace configuration
```

## Development

### Available Commands

```bash
# Start both frontend and backend
npm run dev

# Start only frontend (Vite dev server on port 5173)
npm run dev:app

# Start only backend (Convex dev server)
npm run dev:backend

# Restart dev server (kills ports 5173-5175, then starts fresh)
npm run dev:restart

# Build for production
npm run build

# Lint code
npm run lint

# Type checking
npm run typecheck
```

### Port Configuration

The Convex Auth `SITE_URL` environment variable is configured for `http://localhost:5173`. If Vite starts on a different port, use `npm run dev:restart` to ensure the server starts on the correct port.

## Environment Variables

### Local Development

Create `.env.local` in the project root:

```bash
# Convex deployment (create at https://dashboard.convex.dev)
CONVEX_DEPLOYMENT=dev:your-deployment-name

# Convex URL (get from Convex dashboard)
VITE_CONVEX_URL=https://your-deployment.convex.cloud

# Optional: Enable dev password auth for local testing
VITE_ENABLE_DEV_PASSWORD_AUTH=true
```

### Convex Dashboard Variables

Set these in the Convex Dashboard (Settings > Environment Variables):

```bash
# Resend API key for OTP emails (get from resend.com)
AUTH_RESEND_KEY=re_...

# Frontend URL for auth callbacks
SITE_URL=http://localhost:5173  # Local dev
# SITE_URL=https://your-app.vercel.app  # Production
```

## Authentication

This template uses Convex Auth with Resend OTP for passwordless email authentication.

### Initial Auth Setup

Convex Auth requires JWT keys to be configured. Run this command to auto-generate and set them:

```bash
npx @convex-dev/auth
```

This sets up `JWT_PRIVATE_KEY`, `JWKS`, and `SITE_URL` environment variables in your Convex deployment.

### Dev Password Auth (Optional)

Dev password auth requires **two environment variables** (frontend and backend):

1. **Frontend** (`.env.local`):
   ```bash
   VITE_ENABLE_DEV_PASSWORD_AUTH=true
   ```

2. **Backend** (Convex):
   ```bash
   npx convex env set ENABLE_DEV_PASSWORD_AUTH true
   ```

When both are set, a dev password sign-in option appears with default credentials:

- Email: `test@example.local`
- Password: `TestUser2026#Secure!`

This bypasses the OTP email flow for local development.

### Setting Up Resend

1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Add `AUTH_RESEND_KEY` to Convex environment variables
4. In development, you can only send to verified email addresses

## Database Schema

The template includes a simple tasks table to demonstrate Convex patterns:

```typescript
// convex/schema.ts
tasks: defineTable({
  userId: v.string(),
  title: v.string(),
  description: v.optional(v.string()),
  completed: v.boolean(),
  createdAt: v.number(),
})
```

See `convex/tasks.ts` for CRUD operations (list, create, toggle, remove).

## Adding New Features

### 1. Define Schema

Add new tables to `convex/schema.ts`:

```typescript
export default defineSchema({
  ...authTables,

  // Your new table
  posts: defineTable({
    userId: v.string(),
    title: v.string(),
    content: v.string(),
    createdAt: v.number(),
  }).index('by_user', ['userId']),
})
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

### 3. Use in React

```tsx
import { useQuery, useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'

function PostsList() {
  const posts = useQuery(api.posts.list)
  const createPost = useMutation(api.posts.create)

  return (
    <div>
      {posts?.map((post) => (
        <div key={post._id}>{post.title}</div>
      ))}
    </div>
  )
}
```

## Deployment

### Convex Backend

Deploy to Convex:

```bash
# Deploy to production
npx convex deploy --prod

# Set production environment variables
npx convex env set AUTH_RESEND_KEY your-key --prod
npx convex env set SITE_URL https://your-app.vercel.app --prod
```

### Frontend (Vercel)

1. Push to GitHub
2. Import project in Vercel
3. Set environment variables:
   - `VITE_CONVEX_URL` - Your production Convex URL

## Documentation

- [Convex Documentation](https://docs.convex.dev)
- [Convex Auth Documentation](https://labs.convex.dev/auth)
- [Vite Documentation](https://vitejs.dev)
- [TailwindCSS Documentation](https://tailwindcss.com)
- [shadcn/ui Components](https://ui.shadcn.com)

## License

MIT
