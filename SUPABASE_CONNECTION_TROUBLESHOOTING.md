# Supabase Connection Troubleshooting

## Error: "Can't reach database server"

If you're seeing this error:
```
Error: P1001: Can't reach database server at `db.xrxobfdydqarkpsarolt.supabase.co:5432`
```

### Solution Steps:

### 1. Check if Supabase Project is Active

Supabase free tier projects pause after 7 days of inactivity.

**Steps:**
1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your project
3. If you see "Project is paused" banner
4. Click "Resume Project"
5. Wait 1-2 minutes for it to restart
6. Try `npm run db:migrate` again

### 2. Verify Connection String in Supabase Dashboard

**Get the correct connection string:**

1. Go to your Supabase project
2. Click **Settings** (left sidebar)
3. Click **Database**
4. Scroll to **Connection string**
5. Select **URI** tab
6. Copy the connection string
7. Replace `[YOUR-PASSWORD]` with your database password

Example:
```
postgresql://postgres:[YOUR-PASSWORD]@db.xrxobfdydqarkpsarolt.supabase.co:5432/postgres
```

### 3. Use Connection Pooler (Recommended)

In Supabase Dashboard → Settings → Database:

1. Scroll to **Connection Pooling**
2. Enable "Use connection pooler"
3. Mode: **Session** (for migrations)
4. Copy the connection string

Example:
```
postgresql://postgres.xrxobfdydqarkpsarolt:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

Update your `.env`:
```env
DATABASE_URL="postgresql://postgres.xrxobfdydqarkpsarolt:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xrxobfdydqarkpsarolt:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

### 4. Enable IPv4 Add-on (if needed)

Supabase recently moved to IPv6. If your network doesn't support IPv6:

1. Go to project Settings → Add-ons
2. Enable "IPv4 Address" ($4/month or enable for testing)
3. Get new connection string
4. Update `.env`

### 5. Check Firewall/Network

**Test connection:**

```bash
# Test if you can reach Supabase
ping db.xrxobfdydqarkpsarolt.supabase.co

# Test PostgreSQL port
telnet db.xrxobfdydqarkpsarolt.supabase.co 5432
```

If ping fails:
- Your network might be blocking the connection
- Try from a different network (mobile hotspot, etc.)
- Check if VPN is blocking database connections

### 6. Verify Database Password

Make sure password in `.env` matches your Supabase database password.

**To reset password:**
1. Supabase Dashboard → Settings → Database
2. "Database Password" section
3. Click "Reset database password"
4. Copy new password
5. Update `.env` file

### 7. Use Supabase Studio (Web-based)

If Prisma can't connect, you can still create tables manually:

1. Go to Supabase Dashboard
2. Click **SQL Editor**
3. Copy the migration SQL from `prisma/migrations/` folder
4. Paste and run in SQL Editor

### 8. Check Project Region

Ensure your project region is accessible:

1. Settings → General
2. Check "Region"
3. If it's far from you, connection might be slow/blocked

### 9. Alternative: Use Local PostgreSQL (Dev Only)

If Supabase connection continues to fail, you can use local PostgreSQL for development:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/invoice_db"
DIRECT_URL="postgresql://postgres:password@localhost:5432/invoice_db"
```

Then:
```bash
# Create local database
createdb invoice_db

# Run migrations
npm run db:migrate
```

## Current Connection Status

Your current `.env` is configured with:
- Host: `db.xrxobfdydqarkpsarolt.supabase.co`
- Port: `5432`
- Database: `postgres`
- User: `postgres`

## Recommended Action

**Try this connection string format:**

```env
# For Transaction mode (port 6543)
DATABASE_URL="postgresql://postgres.xrxobfdydqarkpsarolt:XsI2keM31BXbApE4@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# For Session mode (port 5432) - migrations
DIRECT_URL="postgresql://postgres.xrxobfdydqarkpsarolt:XsI2keM31BXbApE4@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

Note the format: `postgres.PROJECT_REF:PASSWORD@...pooler...`

## Need More Help?

1. Check Supabase status: https://status.supabase.com
2. Supabase Discord: https://discord.supabase.com
3. Check project logs in Supabase Dashboard

## Quick Test

Try connecting with `psql` (if installed):

```bash
psql "postgresql://postgres:XsI2keM31BXbApE4@db.xrxobfdydqarkpsarolt.supabase.co:5432/postgres"
```

If this works, the issue is with Prisma configuration.
If this fails, the issue is with network/Supabase.
