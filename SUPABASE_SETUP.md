# Supabase Database Setup Guide

This project uses **Supabase** as the PostgreSQL database provider with **Prisma** as the ORM. Authentication is handled by **NextAuth** (not Supabase Auth).

## Why Supabase?

- ✅ Free PostgreSQL database (500 MB free tier)
- ✅ Managed hosting (no server setup)
- ✅ Automatic backups
- ✅ Connection pooling for serverless
- ✅ Easy to scale
- ✅ Web-based SQL editor

## Step-by-Step Setup

### 1. Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub, Google, or email
4. Verify your email if required

### 2. Create a New Project

1. Click "New Project"
2. Fill in project details:
   - **Project name**: `invoice-system` (or your choice)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free (or Pro if needed)
3. Click "Create new project"
4. Wait 2-3 minutes for setup to complete

### 3. Get Database Connection Strings

1. In your Supabase project dashboard
2. Go to **Settings** → **Database**
3. Scroll down to **Connection string**
4. You'll see several connection string options

#### Option A: Using Connection Pooler (Recommended)

**Best for serverless/Vercel deployments**

1. Select **Connection pooling** → **Transaction mode**
2. Copy the connection string
3. It will look like:
   ```
   postgresql://postgres.xxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

4. For migrations, use **Session mode**:
   ```
   postgresql://postgres.xxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
   ```

#### Option B: Direct Connection (Alternative)

1. Select **Connection string** → **URI**
2. Copy the connection string:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres
   ```

### 4. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` file with your Supabase credentials:

**Using Connection Pooler (Recommended):**
```env
# Replace [YOUR-PASSWORD] with your actual database password
# Replace xxxxxxxxxxxx with your project ref

# For queries (Transaction mode - port 6543)
DATABASE_URL="postgresql://postgres.xxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# For migrations (Session mode - port 5432)
DIRECT_URL="postgresql://postgres.xxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

**Using Direct Connection (Alternative):**
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres"
```

3. Generate and add `NEXTAUTH_SECRET`:
   ```bash
   # Linux/Mac
   openssl rand -base64 32

   # Windows PowerShell
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

4. Your final `.env` should look like:
   ```env
   DATABASE_URL="postgresql://postgres.your-ref:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
   DIRECT_URL="postgresql://postgres.your-ref:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-generated-secret-here"
   ```

### 5. Run Database Migrations

```bash
# Install dependencies (if not already done)
npm install

# Run Prisma migrations to create tables
npm run db:migrate

# Seed the database with sample data
npm run db:seed
```

This will:
- ✅ Create all database tables in Supabase
- ✅ Set up relationships and constraints
- ✅ Create sample users (admin, manager, sales)
- ✅ Add sample products, warehouses, customers

### 6. Verify Database Setup

#### Option A: Supabase Dashboard

1. Go to your Supabase project
2. Click **Table Editor** in left sidebar
3. You should see all tables:
   - User
   - Warehouse
   - Material
   - Product
   - ProductVariant
   - Stock
   - StockMovement
   - Customer
   - Invoice
   - InvoiceItem
   - Payment
   - History

#### Option B: Prisma Studio

```bash
npm run db:studio
```

Opens at [http://localhost:5555](http://localhost:5555)

### 7. Start Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Login with:
- **Email**: admin@example.com
- **Password**: admin123

---

## Understanding Supabase Connection Modes

### Connection Pooler (Recommended)

Supabase provides **PgBouncer** connection pooling:

- **Transaction Mode (Port 6543)**: For application queries
  - Used by Prisma Client
  - Serverless-friendly
  - Limited to specific SQL commands
  - Set in `DATABASE_URL`

- **Session Mode (Port 5432)**: For migrations
  - Used by Prisma Migrate
  - Full SQL support
  - Set in `DIRECT_URL`

### Direct Connection

- Standard PostgreSQL connection
- Port 5432
- Use if not deploying to serverless (Vercel, etc.)

---

## Prisma Configuration for Supabase

The `prisma/schema.prisma` is configured for Supabase:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")      // Pooled connection
  directUrl = env("DIRECT_URL")       // Direct connection for migrations
}
```

---

## Common Issues & Solutions

### Issue: "Can't reach database server"

**Solutions:**
1. Check database password is correct
2. Ensure project is not paused (Supabase pauses after 1 week inactivity on free tier)
3. Go to Supabase dashboard and click "Resume project"
4. Check connection string format is correct

### Issue: "Too many connections"

**Solution:**
- Use connection pooler (Transaction mode)
- Add `?pgbouncer=true&connection_limit=1` to DATABASE_URL

### Issue: Migration fails with "prepared statement already exists"

**Solution:**
- Use `DIRECT_URL` with Session mode (port 5432)
- Ensure `directUrl` is set in schema.prisma

### Issue: "relation does not exist"

**Solution:**
```bash
# Reset and re-run migrations
npm run db:reset
npm run db:migrate
npm run db:seed
```

---

## Supabase Free Tier Limits

- **Database**: 500 MB
- **Bandwidth**: 5 GB
- **Monthly Active Users**: Unlimited
- **Paused after**: 1 week of inactivity (resumes in seconds)

For production, consider upgrading to Pro ($25/month):
- 8 GB database
- 250 GB bandwidth
- Daily backups
- No pausing

---

## Production Deployment

### Vercel Deployment

1. Add environment variables in Vercel dashboard:
   ```
   DATABASE_URL=your-pooled-connection-string
   DIRECT_URL=your-session-mode-connection-string
   NEXTAUTH_URL=https://yourdomain.com
   NEXTAUTH_SECRET=your-production-secret
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Run migrations in production:
   ```bash
   # Using Vercel CLI
   npx prisma migrate deploy

   # Or add to build command in vercel.json
   {
     "buildCommand": "prisma generate && prisma migrate deploy && next build"
   }
   ```

### Other Platforms (Netlify, Railway, etc.)

Same environment variables setup. Ensure you:
1. Set both `DATABASE_URL` and `DIRECT_URL`
2. Run `prisma migrate deploy` after deployment
3. Use connection pooler for serverless platforms

---

## Database Management

### View Data

**Supabase Dashboard:**
- Project → Table Editor
- Click any table to view/edit data

**Prisma Studio:**
```bash
npm run db:studio
```

### SQL Editor

Supabase provides a SQL editor:
1. Go to project dashboard
2. Click **SQL Editor**
3. Write and run SQL queries

### Backup & Restore

**Manual Backup:**
1. Settings → Database → Database backups
2. Click "Create backup"

**Restore:**
1. Same page
2. Click "Restore" on any backup

---

## Security Best Practices

### 1. Protect Your Database Password

- ✅ Never commit `.env` file
- ✅ Use different passwords for dev/prod
- ✅ Rotate passwords periodically

### 2. Use Environment Variables

```bash
# Development
DATABASE_URL=dev-connection-string

# Production (set in hosting platform)
DATABASE_URL=prod-connection-string
```

### 3. Enable Row Level Security (Optional)

Since we're using Prisma (not Supabase client), RLS is not required. But you can enable it for extra security:

```sql
-- In Supabase SQL Editor
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
-- Add policies as needed
```

### 4. IP Restrictions (Pro Plan)

In Supabase → Settings → Database → Network restrictions

---

## Migration Workflow

### Creating New Migrations

1. Modify `prisma/schema.prisma`
2. Generate migration:
   ```bash
   npx prisma migrate dev --name your_migration_name
   ```

3. Test locally
4. Commit migration files
5. Deploy to production:
   ```bash
   npx prisma migrate deploy
   ```

### Reset Database (Dev only)

```bash
npm run db:reset
npm run db:seed
```

⚠️ **Never run this in production!**

---

## Monitoring

### Supabase Dashboard

- Settings → Database → Usage
- Monitor connections, queries, bandwidth

### Logs

- Project → Logs
- View PostgreSQL logs
- Check for errors or slow queries

---

## Cost Optimization

1. **Use Connection Pooler**: Reduces connection count
2. **Index Important Columns**: Already configured in schema
3. **Monitor Database Size**: Settings → Database → Usage
4. **Clean Old Data**: Implement data retention policies

---

## Getting Help

1. **Supabase Documentation**: https://supabase.com/docs
2. **Prisma Documentation**: https://www.prisma.io/docs
3. **Supabase Discord**: https://discord.supabase.com
4. **GitHub Issues**: Report project-specific issues

---

## Next Steps

✅ Supabase project created
✅ Database configured
✅ Migrations run
✅ Sample data seeded

**You're ready to develop!**

```bash
npm run dev
```

Login: admin@example.com / admin123

---

## Quick Reference

```bash
# Install dependencies
npm install

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# View database
npm run db:studio

# Start development
npm run dev

# Reset database (dev only)
npm run db:reset
```

---

**Need to pause your project?** Supabase auto-pauses after 7 days of inactivity. Just click "Resume" in the dashboard when you return.

**Upgrading to production?** Contact Supabase support or upgrade to Pro plan for better limits and support.

Happy coding with Supabase! 🚀
