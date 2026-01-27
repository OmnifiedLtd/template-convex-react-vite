# Template Information

This repository is a production-ready full-stack TypeScript template for building modern web applications.

## What's Included

### Core Technologies
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Full type safety across frontend and backend
- **Vite** - Lightning-fast dev server and build tool
- **TailwindCSS** - Utility-first CSS framework
- **Convex** - Real-time backend with serverless functions
- **Convex Auth** - Passwordless email authentication with Resend
- **shadcn/ui** - Beautiful, accessible UI components

### Features Out of the Box

✅ **Authentication System**
- Email OTP authentication via Resend
- Optional dev password mode for local testing
- Session management
- Protected routes with AuthGuard

✅ **Real-Time Database**
- Convex real-time queries (auto-refresh on data changes)
- Type-safe queries and mutations
- Generated TypeScript types from schema
- Example CRUD operations (tasks table)

✅ **File Storage**
- Built-in Convex file storage
- Upload utilities with signed URLs
- File metadata queries

✅ **UI Components**
- 30+ shadcn/ui components pre-installed
- Radix UI primitives for accessibility
- Tailwind for custom styling
- Responsive layouts

✅ **Developer Experience**
- Hot module reload
- TypeScript strict mode
- ESLint configuration
- Automatic type generation
- Single command to start dev server

✅ **Production Ready**
- Build optimization
- Error monitoring setup (Sentry)
- CI/CD workflows
- Deployment guides for Vercel

## Project Structure

```
template-full-stack-convex/
├── apps/app/               # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── ui/       # shadcn/ui components
│   │   │   └── layout/   # Layout components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom hooks
│   │   └── lib/          # Utilities
│   └── public/           # Static assets
│
├── convex/               # Convex backend
│   ├── schema.ts         # Database schema
│   ├── auth.ts           # Auth configuration
│   ├── tasks.ts          # Example CRUD
│   ├── users.ts          # User queries
│   ├── storage.ts        # File storage
│   └── lib/              # Backend utilities
│
├── .github/workflows/    # CI/CD workflows
├── SETUP.md              # Setup instructions
├── CLAUDE.md             # Development guidelines
└── README.md             # Main documentation
```

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up Convex (interactive - will prompt for project)
npx convex dev

# 3. Configure Resend (get API key from resend.com)
# Add to Convex Dashboard > Settings > Environment Variables:
# - AUTH_RESEND_KEY
# - SITE_URL=http://localhost:5173

# 4. Start development
npm run dev
```

Visit http://localhost:5173 to see your app!

## Documentation

- **SETUP.md** - Complete setup guide with step-by-step instructions
- **README.md** - Feature documentation and examples
- **CLAUDE.md** - Development guidelines and best practices
- **agents.md** - Agent-specific instructions

## Example Code

### Backend (Convex)

```typescript
// convex/posts.ts
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "./lib/auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    return await ctx.db
      .query("posts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    return await ctx.db.insert("posts", {
      userId,
      ...args,
      createdAt: Date.now(),
    });
  },
});
```

### Frontend (React)

```tsx
// apps/app/src/pages/Posts.tsx
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";

export default function Posts() {
  const posts = useQuery(api.posts.list);
  const create = useMutation(api.posts.create);

  return (
    <div>
      {posts?.map(post => (
        <div key={post._id}>{post.title}</div>
      ))}
    </div>
  );
}
```

## Key Commands

```bash
npm run dev           # Start dev server (frontend + backend)
npm run dev:app       # Start only frontend
npm run dev:backend   # Start only Convex backend
npm run dev:restart   # Restart and fix port issues
npm run build         # Build for production
npm run lint          # Lint all code
npm run typecheck     # Type check everything
```

## Environment Variables

### Local (.env.local)
```bash
CONVEX_DEPLOYMENT=dev:your-deployment
VITE_CONVEX_URL=https://your-deployment.convex.cloud
VITE_ENABLE_DEV_PASSWORD_AUTH=true  # Optional
```

### Convex Dashboard
```bash
AUTH_RESEND_KEY=re_...
SITE_URL=http://localhost:5173
```

## Customization

### Branding
1. Update "Your App Name" in `apps/app/src/components/layout/Header.tsx`
2. Replace favicon and logo in `apps/app/public/`
3. Update email sender in `convex/auth.ts`

### Database Schema
Add tables to `convex/schema.ts` and create corresponding functions.

### UI Components
Use shadcn/ui components from `apps/app/src/components/ui/` or add more from https://ui.shadcn.com

## Deployment

### Convex
```bash
npx convex deploy --prod
npx convex env set AUTH_RESEND_KEY your-key --prod
npx convex env set SITE_URL https://your-app.com --prod
```

### Vercel
1. Push to GitHub
2. Import in Vercel
3. Set `VITE_CONVEX_URL` environment variable
4. Deploy!

## Support & Resources

- [Convex Documentation](https://docs.convex.dev)
- [Convex Discord](https://discord.gg/convex)
- [React Documentation](https://react.dev)
- [TailwindCSS Documentation](https://tailwindcss.com)
- [shadcn/ui Components](https://ui.shadcn.com)

## License

MIT License - see LICENSE file for details

---

**Built with ❤️ using modern web technologies**
