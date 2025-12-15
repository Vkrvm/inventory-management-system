# Developer Guide

Quick reference for developers working on this project.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database credentials

# Setup database
npm run db:migrate
npm run db:seed

# Start development
npm run dev
```

## Project Architecture

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth v5
- **UI**: Bootstrap 5 + SCSS

### Folder Structure

```
src/
├── actions/          # Server Actions (business logic)
├── app/             # Next.js App Router pages
├── components/      # Reusable React components
├── lib/             # Utilities and configurations
├── styles/          # SCSS stylesheets
└── types/           # TypeScript type definitions
```

## Common Tasks

### Adding a New Feature

1. **Create Database Model** (if needed)
   ```prisma
   // prisma/schema.prisma
   model YourModel {
     id        String   @id @default(cuid())
     name      String
     createdAt DateTime @default(now())
   }
   ```
   Then run: `npm run db:migrate`

2. **Create Server Actions**
   ```typescript
   // src/actions/your-feature.actions.ts
   "use server";

   import { prisma } from "@/lib/db";
   import { auth } from "@/lib/auth";

   export async function createYourThing(data: any) {
     const session = await auth();
     if (!session?.user) return { error: "Unauthorized" };

     // Your logic here
     const result = await prisma.yourModel.create({ data });
     return { success: true, result };
   }
   ```

3. **Create UI Page**
   ```typescript
   // src/app/dashboard/your-feature/page.tsx
   import DashboardLayout from "@/components/DashboardLayout";

   export default async function YourPage() {
     return (
       <DashboardLayout>
         <h1>Your Feature</h1>
       </DashboardLayout>
     );
   }
   ```

4. **Add to Sidebar** (if needed)
   ```typescript
   // src/components/Sidebar.tsx
   <Link href="/dashboard/your-feature">Your Feature</Link>
   ```

### Working with Database

```bash
# Create migration
npm run db:migrate

# View/edit data visually
npm run db:studio

# Reset database (⚠️ deletes all data)
npm run db:reset

# Run seed script
npm run db:seed
```

### Creating a New Page

**Server Component (data fetching):**
```typescript
// src/app/dashboard/example/page.tsx
import DashboardLayout from "@/components/DashboardLayout";
import { getData } from "@/actions/example.actions";

export default async function ExamplePage() {
  const data = await getData();

  return (
    <DashboardLayout>
      <h1>Example Page</h1>
      {/* Pass data to client component if needed */}
    </DashboardLayout>
  );
}
```

**Client Component (interactivity):**
```typescript
// src/app/dashboard/example/ExampleClient.tsx
"use client";

import { useState } from "react";

export default function ExampleClient({ data }: { data: any }) {
  const [state, setState] = useState(false);

  return (
    <div>
      {/* Interactive UI */}
    </div>
  );
}
```

### Server Actions Pattern

```typescript
"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logHistory } from "@/lib/history";
import { revalidatePath } from "next/cache";

export async function yourAction(formData: YourType) {
  // 1. Check authentication
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  // 2. Check authorization (role-based)
  if (session.user.role !== "ADMIN") {
    return { error: "Forbidden" };
  }

  try {
    // 3. Perform database operation
    const result = await prisma.yourModel.create({
      data: formData,
    });

    // 4. Log the action
    await logHistory({
      userId: session.user.id,
      action: "CREATE_THING",
      entity: "Thing",
      entityId: result.id,
      details: { name: result.name },
    });

    // 5. Revalidate cache
    revalidatePath("/dashboard/your-page");

    return { success: true, result };
  } catch (error) {
    console.error("Error:", error);
    return { error: "Operation failed" };
  }
}
```

### Role-Based Access Control

```typescript
// In middleware (src/middleware.ts)
if (pathname.startsWith("/dashboard/admin-only")) {
  if (![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(userRole)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
}

// In server actions
if (![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(session.user.role)) {
  return { error: "Unauthorized" };
}
```

### Adding a Modal

```typescript
"use client";

export default function YourComponent() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowModal(true)}>Open Modal</button>

      {showModal && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Modal Title</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                />
              </div>
              <div className="modal-body">
                {/* Modal content */}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showModal && <div className="modal-backdrop show" />}
    </>
  );
}
```

### Bootstrap Classes Reference

**Cards:**
```html
<div className="card">
  <div className="card-body">
    <h5 className="card-title">Title</h5>
    <p className="card-text">Content</p>
  </div>
</div>
```

**Tables:**
```html
<table className="table table-hover table-responsive">
  <thead>
    <tr><th>Column</th></tr>
  </thead>
  <tbody>
    <tr><td>Data</td></tr>
  </tbody>
</table>
```

**Forms:**
```html
<div className="mb-3">
  <label className="form-label">Label</label>
  <input type="text" className="form-control" />
</div>
```

**Buttons:**
```html
<button className="btn btn-primary">Primary</button>
<button className="btn btn-secondary">Secondary</button>
<button className="btn btn-success">Success</button>
<button className="btn btn-danger">Danger</button>
```

**Badges:**
```html
<span className="badge bg-primary">Badge</span>
<span className="badge bg-success">Success</span>
<span className="badge bg-danger">Danger</span>
```

### Prisma Query Examples

```typescript
// Find one
const user = await prisma.user.findUnique({
  where: { id: userId },
});

// Find many with relations
const products = await prisma.product.findMany({
  include: {
    variants: true,
  },
  orderBy: { createdAt: "desc" },
});

// Create
const product = await prisma.product.create({
  data: {
    name: "Product",
    type: ProductType.WALLET,
  },
});

// Update
const updated = await prisma.product.update({
  where: { id: productId },
  data: { name: "New Name" },
});

// Delete
await prisma.product.delete({
  where: { id: productId },
});

// Count
const count = await prisma.product.count();

// Aggregate
const sum = await prisma.invoice.aggregate({
  _sum: { finalTotal: true },
});

// Transaction
await prisma.$transaction([
  prisma.stock.update({ where: { id: 1 }, data: { quantity: 10 } }),
  prisma.stockMovement.create({ data: { ... } }),
]);
```

## Environment Variables

```env
# Required
DATABASE_URL="postgresql://user:pass@localhost:5432/db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Optional
NODE_ENV="development"
```

## Common Issues & Solutions

### Database Connection Error
```bash
# Check PostgreSQL is running
# Windows: Services → PostgreSQL
# Linux: sudo systemctl status postgresql
# Mac: brew services list
```

### Migration Fails
```bash
# Reset database
npm run db:reset

# Or manually
dropdb invoice_db
createdb invoice_db
npm run db:migrate
```

### TypeScript Errors
```bash
# Regenerate Prisma Client
npx prisma generate

# Restart TypeScript server in VSCode
Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### Port Already in Use
```bash
# Use different port
PORT=3001 npm run dev
```

## Code Style

### File Naming
- Components: `PascalCase.tsx` (e.g., `UserCard.tsx`)
- Pages: `page.tsx` (Next.js convention)
- Actions: `kebab-case.actions.ts` (e.g., `user.actions.ts`)
- Utils: `kebab-case.ts` (e.g., `format-date.ts`)

### TypeScript
- Always use types/interfaces
- Avoid `any` unless absolutely necessary
- Use Prisma-generated types when possible

### React
- Use Server Components by default
- Mark Client Components with `"use client"`
- Keep components small and focused
- Extract reusable logic to hooks or utils

## Testing

```typescript
// Example test structure (not yet implemented)
import { createUser } from "@/actions/user.actions";

describe("User Actions", () => {
  it("should create a user", async () => {
    const result = await createUser({
      email: "test@example.com",
      name: "Test User",
      role: "SALES",
    });

    expect(result.success).toBe(true);
  });
});
```

## Deployment

### Build for Production
```bash
npm run build
npm start
```

### Environment Setup
1. Set up PostgreSQL database
2. Run migrations: `npx prisma migrate deploy`
3. Set environment variables
4. Build and start application

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth Docs](https://next-auth.js.org/)
- [Bootstrap Docs](https://getbootstrap.com/docs)
- [TypeScript Docs](https://www.typescriptlang.org/docs)

## Getting Help

1. Check the [README.md](README.md) for features
2. Check the [SETUP.md](SETUP.md) for setup
3. Check [Prisma schema](prisma/schema.prisma) for database structure
4. Look at existing code for patterns
5. Check Next.js documentation

---

Happy coding! 🚀
