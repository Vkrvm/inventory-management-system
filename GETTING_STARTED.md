# Getting Started - Quick Guide

Welcome to your Inventory & Invoice Management System! This guide will get you up and running in 5 minutes.

## What You Have

A professional, production-ready inventory management system with:
- ✅ Complete backend (database, auth, business logic)
- ✅ User management system (SUPER_ADMIN only)
- ✅ Product management with UI
- ✅ Role-based access control
- ✅ Comprehensive documentation

## 5-Minute Setup (with Supabase)

### Step 1: Create Supabase Project (2 min)

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project (choose region, set password)
3. Wait for setup to complete (~2 min)

### Step 2: Install Dependencies (1 min)

```bash
npm install
```

### Step 3: Configure Environment (1 min)

1. In Supabase: Settings → Database → Connection string
2. Copy your connection pooler URL

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
DATABASE_URL="postgresql://postgres.your-ref:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.your-ref:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="use-openssl-rand-base64-32-to-generate-this"
```

**Need help?** See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for detailed instructions.

### Step 4: Setup Database (1 min)

```bash
npm run db:migrate  # Creates tables in Supabase
npm run db:seed     # Adds sample data
```

### Step 5: Start Development (1 min)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Step 6: Login

Use one of these accounts:

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | admin123 | SUPER_ADMIN |
| manager@example.com | manager123 | MANAGER |
| sales@example.com | sales123 | SALES |

---

## What's Working Right Now

### ✅ You Can Do This Now:

1. **Login** - Visit the site and login with any account above
2. **User Management** - Create users, assign roles, reset passwords (SUPER_ADMIN only)
3. **Product Management** - Create products, add color variants
4. **View Dashboard** - See stats, recent invoices, low stock alerts

### 🚧 Backend Ready, UI Needed:

These features have complete backend but need UI pages:

1. **Warehouses** - Create/manage warehouses
2. **Materials** - Manage raw materials
3. **Stock** - Add/remove/transfer stock
4. **Customers** - Manage customer profiles
5. **Invoices** - Create invoices, track payments
6. **Reports** - Sales and inventory reports
7. **History** - View activity logs

---

## Understanding the System

### File Structure

```
src/
├── actions/          ← Backend logic (COMPLETE)
│   ├── user.actions.ts
│   ├── warehouse.actions.ts
│   ├── product.actions.ts
│   ├── stock.actions.ts
│   ├── customer.actions.ts
│   └── invoice.actions.ts
│
├── app/              ← Frontend pages
│   ├── dashboard/
│   │   ├── page.tsx          ✅ Dashboard (working)
│   │   ├── users/            ✅ User management (working)
│   │   ├── products/         ✅ Product management (working)
│   │   ├── warehouses/       🚧 Need to create UI
│   │   ├── materials/        🚧 Need to create UI
│   │   ├── stock/            🚧 Need to create UI
│   │   ├── customers/        🚧 Need to create UI
│   │   └── invoices/         🚧 Need to create UI
│
├── components/       ← UI components (ready to use)
│   ├── Sidebar.tsx
│   ├── DashboardLayout.tsx
│   ├── Alert.tsx
│   └── LoadingSpinner.tsx
│
└── lib/              ← Utilities (COMPLETE)
    ├── db.ts        ← Database connection
    ├── auth.ts      ← Authentication
    ├── history.ts   ← Activity logging
    └── utils.ts     ← Helper functions
```

### How It Works

1. **Server Actions** (`src/actions/`) handle all business logic
2. **Pages** (`src/app/`) display data and forms
3. **Components** (`src/components/`) are reusable UI pieces
4. **Prisma** manages database operations

---

## Next Steps

### Option 1: Explore What's Built

1. Login as admin: `admin@example.com` / `admin123`
2. Go to User Management
3. Create a new user
4. Go to Products
5. Create a product and add colors
6. Check out the dashboard

### Option 2: Build Missing UI Pages

Follow the pattern from Product Management:

```typescript
// 1. Create page (Server Component)
// src/app/dashboard/your-feature/page.tsx
import DashboardLayout from "@/components/DashboardLayout";
import { getYourData } from "@/actions/your-feature.actions";

export default async function YourPage() {
  const data = await getYourData();
  return (
    <DashboardLayout>
      <h1>Your Feature</h1>
      {/* Your UI */}
    </DashboardLayout>
  );
}

// 2. Create client component for interactivity
// src/app/dashboard/your-feature/YourClient.tsx
"use client";
// Forms, modals, buttons, etc.
```

See [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) for complete patterns.

### Option 3: Learn the System

Read the documentation:

1. **README.md** - Feature overview
2. **SETUP.md** - Detailed setup
3. **DEVELOPER_GUIDE.md** - Code patterns
4. **API_REFERENCE.md** - All server actions
5. **FEATURES.md** - What's done, what's not

---

## Common Tasks

### View Database Visually

```bash
npm run db:studio
```

Opens Prisma Studio at [http://localhost:5555](http://localhost:5555)

### Reset Database

```bash
npm run db:reset
```

⚠️ This deletes all data!

### Check What's Running

```bash
npm run dev
```

Runs at [http://localhost:3000](http://localhost:3000)

---

## Understanding Roles

| Role | Can Do |
|------|--------|
| **SUPER_ADMIN** | Everything + user management |
| **ADMIN** | Warehouses, reports, all management |
| **MANAGER** | Products, materials, stock, customers |
| **SALES** | Invoices, view data |
| **WAREHOUSE** | Stock operations |

Routes are protected by `src/middleware.ts`

---

## Database Schema

### Main Tables

- **User** - System users with roles
- **Warehouse** - MATERIAL or PRODUCT warehouses
- **Material** - Raw materials (leather, etc.)
- **Product** - Product catalog (wallets, belts, etc.)
- **ProductVariant** - Product colors
- **Stock** - Inventory per warehouse
- **StockMovement** - History of stock changes
- **Customer** - Customer profiles
- **Invoice** - Sales invoices
- **InvoiceItem** - Line items in invoices
- **Payment** - Payments for CREDIT invoices
- **History** - Activity log

### Key Relationships

```
Product → ProductVariant (1:many)
Warehouse → Stock (1:many)
Customer → Invoice (1:many)
Invoice → InvoiceItem (1:many)
Invoice → Payment (1:many)
```

---

## Example Workflows

### Create a Product

1. Login as MANAGER or ADMIN
2. Go to `/dashboard/products`
3. Click "Create New Product"
4. Fill in type, brand, code
5. Submit
6. Click "+ Add Color" to add variants

### Create an Invoice (when UI is built)

1. Select customer
2. Add product items with quantities
3. Set prices
4. Apply discount (optional)
5. Choose CASH or CREDIT
6. Submit
7. Stock reduces automatically

### Add Payment (when UI is built)

1. Open CREDIT invoice
2. Click "Add Payment"
3. Enter amount
4. Submit
5. Balance updates automatically

---

## Troubleshooting

### Can't Login

- Check database is running
- Check `.env` file is configured
- Run `npm run db:seed` to create users

### Page Not Loading

- Check `npm run dev` is running
- Check no errors in terminal
- Clear browser cache

### Database Error

- Check PostgreSQL is running
- Check DATABASE_URL in `.env`
- Try `npm run db:reset`

### TypeScript Error

- Run `npx prisma generate`
- Restart editor
- Run `npm install`

---

## Get Help

1. Check [README.md](README.md) for features
2. Check [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) for patterns
3. Check [API_REFERENCE.md](API_REFERENCE.md) for server actions
4. Look at existing code (Products page is complete)
5. Check Prisma schema: `prisma/schema.prisma`

---

## What to Build Next

### Recommended Order:

1. **Customer Management Page**
   - Easy to build
   - Similar to Products
   - Good practice

2. **Stock Management Page**
   - Core functionality
   - Shows warehouse integration

3. **Invoice Creation Page**
   - Most complex
   - Ties everything together

4. **Reports Page**
   - Analytics and insights

---

## Quick Commands Reference

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm start               # Run production build

# Database
npm run db:migrate      # Run migrations
npm run db:seed         # Seed sample data
npm run db:studio       # Open database GUI
npm run db:reset        # Reset database (⚠️ deletes data)

# Utilities
npm run lint            # Run linter
```

---

## You're All Set! 🎉

Your system is ready to use. Start exploring, or start building the remaining UI pages.

**Happy coding!** 🚀

---

**Questions?** Check the documentation files or look at the existing Product Management code for patterns.
