# Supabase Migration Guide

## ✅ What Changed

The project has been updated to use **Supabase** as the PostgreSQL database provider instead of a local database.

### Key Changes:

1. **Database Provider**: Local PostgreSQL → Supabase (cloud PostgreSQL)
2. **Connection**: Single URL → Dual URLs (pooled + direct)
3. **Setup**: Manual DB install → Free cloud account
4. **Authentication**: Still NextAuth (not Supabase Auth)

### What Stayed the Same:

- ✅ Prisma ORM (same queries, same API)
- ✅ NextAuth authentication
- ✅ All server actions
- ✅ All features and functionality
- ✅ Database schema
- ✅ Code structure

## Why Supabase?

### Benefits:

1. **No Local Setup**: No PostgreSQL installation needed
2. **Free Tier**: 500 MB database, perfect for development
3. **Managed**: Automatic backups, updates, maintenance
4. **Serverless-Friendly**: Built-in connection pooling
5. **Easy Deployment**: Works great with Vercel, Netlify, etc.
6. **Dashboard**: Visual database management
7. **Global**: Deploy close to your users

### Perfect For:

- ✅ Development and testing
- ✅ Serverless deployments (Vercel, Netlify)
- ✅ Small to medium applications
- ✅ Teams without DevOps resources
- ✅ Rapid prototyping

## Migration Steps

### If You Already Have Local PostgreSQL:

#### Option 1: Start Fresh with Supabase (Recommended)

```bash
# 1. Create Supabase project
# Go to supabase.com and create a project

# 2. Update .env with Supabase credentials
# See SUPABASE_SETUP.md for details

# 3. Run migrations to create tables in Supabase
npm run db:migrate

# 4. Seed sample data
npm run db:seed

# Done! Your app now uses Supabase
```

#### Option 2: Migrate Existing Data

If you have important data in local PostgreSQL:

```bash
# 1. Export data from local database
pg_dump -U postgres -d invoice_db --data-only --inserts > data.sql

# 2. Create Supabase project and update .env

# 3. Run migrations on Supabase
npm run db:migrate

# 4. Import data to Supabase
# In Supabase SQL Editor, paste and run data.sql

# 5. Verify data
npm run db:studio
```

### If You're Starting Fresh:

Just follow [SUPABASE_SETUP.md](SUPABASE_SETUP.md) - you're all set!

## Updated Files

### 1. `prisma/schema.prisma`

**Before:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**After:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")      // Pooled connection
  directUrl = env("DIRECT_URL")       // Direct connection for migrations
}
```

### 2. `.env.example`

**Before:**
```env
DATABASE_URL="postgresql://username:password@localhost:5432/invoice_db"
```

**After:**
```env
# Connection pooler (Transaction mode)
DATABASE_URL="postgresql://postgres.your-ref:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Direct connection (Session mode)
DIRECT_URL="postgresql://postgres.your-ref:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

### 3. Documentation

New files:
- ✅ `SUPABASE_SETUP.md` - Complete setup guide
- ✅ `SUPABASE_QUICK_REFERENCE.md` - Quick reference
- ✅ `SUPABASE_MIGRATION_GUIDE.md` - This file

Updated files:
- ✅ `README.md` - Updated prerequisites and setup
- ✅ `GETTING_STARTED.md` - Updated quick start
- ✅ `.env.example` - Supabase connection strings

## Connection String Explained

### Transaction Mode (Port 6543)

```
postgresql://postgres.your-ref:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

- **Purpose**: Application queries (Prisma Client)
- **Port**: 6543 (PgBouncer transaction mode)
- **Use**: Set as `DATABASE_URL`
- **When**: All app runtime queries
- **Why**: Serverless-friendly, manages connections

### Session Mode (Port 5432)

```
postgresql://postgres.your-ref:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

- **Purpose**: Database migrations
- **Port**: 5432 (Direct PostgreSQL)
- **Use**: Set as `DIRECT_URL`
- **When**: Running `prisma migrate`
- **Why**: Full SQL support needed for migrations

## Code Changes

### None Required! 🎉

Your application code doesn't change at all:

```typescript
// This works exactly the same
import { prisma } from "@/lib/db";

const users = await prisma.user.findMany();
```

Prisma abstracts the database connection, so:
- ✅ Same queries
- ✅ Same server actions
- ✅ Same components
- ✅ Same everything!

Only the connection strings changed.

## Development Workflow

### Before (Local PostgreSQL)

```bash
# Install PostgreSQL locally
# Configure PostgreSQL
# Create database
# Set DATABASE_URL
npm run db:migrate
npm run dev
```

### After (Supabase)

```bash
# Create Supabase project (once, 2 minutes)
# Copy connection strings
# Update .env
npm run db:migrate
npm run dev
```

Less setup, easier for team collaboration!

## Team Collaboration

### Before (Local PostgreSQL)

Each developer needs to:
- Install PostgreSQL
- Configure PostgreSQL
- Create local database
- Manage their own data
- Can't easily share database state

### After (Supabase)

Each developer needs to:
- Share Supabase project credentials (dev environment)
- Or create their own Supabase project (free!)
- Easy to reset to known state
- Can share database snapshots

## Deployment

### Before (Local PostgreSQL)

```
Local Dev → Local PostgreSQL
Production → Hosted PostgreSQL (setup required)
```

### After (Supabase)

```
Local Dev → Supabase (dev project)
Production → Supabase (prod project)
```

Both environments work the same way!

## Cost Comparison

### Local PostgreSQL
- Free (but requires your computer/server)
- Costs: Server hosting, maintenance, backups

### Supabase Free Tier
- **Free**: 500 MB database
- **Free**: 5 GB bandwidth
- **Free**: Automatic backups
- **Free**: Visual dashboard
- **No server costs**

### Supabase Pro ($25/month)
- 8 GB database
- 250 GB bandwidth
- Daily backups
- Point-in-time recovery
- No pausing

## Common Questions

### Q: Do I need to change my code?
**A:** No! Only `.env` changes. All code stays the same.

### Q: Can I still use Prisma Studio?
**A:** Yes! `npm run db:studio` works exactly the same.

### Q: What about authentication?
**A:** Still using NextAuth, not Supabase Auth.

### Q: Can I switch back to local PostgreSQL?
**A:** Yes, just change the connection string in `.env`.

### Q: Does this affect performance?
**A:** Supabase is usually faster (dedicated servers, global CDN).

### Q: What about production?
**A:** Create a separate Supabase project for production.

### Q: Is my data safe?
**A:** Yes, Supabase includes automatic backups and enterprise-grade security.

### Q: Can I export my data?
**A:** Yes, use `pg_dump` or Supabase dashboard.

## Troubleshooting

### "Can't reach database server"

1. Check if Supabase project is paused
2. Go to dashboard and click "Resume"
3. Verify connection strings in `.env`
4. Check password is correct

### "Too many connections"

1. Ensure using connection pooler
2. Add `?pgbouncer=true&connection_limit=1` to DATABASE_URL
3. Close unused database connections

### "Migration fails"

1. Ensure `DIRECT_URL` is set (Session mode, port 5432)
2. Check `directUrl` is in `schema.prisma`
3. Try `npm run db:reset`

## Verification Checklist

After migration, verify:

- [ ] `.env` has both `DATABASE_URL` and `DIRECT_URL`
- [ ] `DATABASE_URL` uses port 6543 (pooler)
- [ ] `DIRECT_URL` uses port 5432 (direct)
- [ ] `schema.prisma` has `directUrl` configured
- [ ] `npm run db:migrate` succeeds
- [ ] `npm run db:seed` succeeds
- [ ] `npm run dev` starts without errors
- [ ] Can login at localhost:3000
- [ ] Tables visible in Supabase dashboard
- [ ] `npm run db:studio` shows data

## Next Steps

1. ✅ Read [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
2. ✅ Create Supabase account
3. ✅ Update `.env` with credentials
4. ✅ Run `npm run db:migrate`
5. ✅ Run `npm run db:seed`
6. ✅ Start developing!

## Resources

- **Supabase Docs**: https://supabase.com/docs
- **Prisma + Supabase**: https://supabase.com/docs/guides/integrations/prisma
- **Connection Pooling**: https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler
- **Prisma Docs**: https://www.prisma.io/docs

---

**Summary**: Same app, same code, better database! 🚀

Just update your `.env` and you're ready to go.
