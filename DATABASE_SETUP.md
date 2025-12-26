# Database Setup Guide

This guide covers setting up PostgreSQL database hosting for the Text Adventure Campaign Manager, including options for local development and cloud hosting providers.

## Table of Contents

- [Quick Start](#quick-start)
- [Hosting Provider Options](#hosting-provider-options)
  - [Option 1: Neon (Recommended)](#option-1-neon-recommended)
  - [Option 2: Supabase](#option-2-supabase)
  - [Option 3: Railway](#option-3-railway)
  - [Option 4: Local PostgreSQL](#option-4-local-postgresql)
- [Initial Setup](#initial-setup)
- [Running Migrations](#running-migrations)
- [Team Member Onboarding](#team-member-onboarding)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

## Quick Start

For new team members wanting to get started quickly:

```bash
# 1. Clone the repository
git clone https://github.com/migueog/text_adventure.git
cd text_adventure

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env

# 4. Set up your database (choose a provider below)
# Edit .env and add your DATABASE_URL

# 5. Test connection
npm run db:test

# 6. Run migrations
npm run db:migrate

# 7. Start development
npm run dev
```

## Hosting Provider Options

### Option 1: Neon (Recommended)

**Best for: Serverless deployments (Vercel, Netlify), production use**

#### Why Neon?
- ✅ **Generous free tier**: 10 GB storage, 3 projects, unlimited queries
- ✅ **Serverless-optimized**: Auto-scaling, built-in connection pooling
- ✅ **Fast**: Instant database creation, low latency
- ✅ **Zero config**: Works perfectly with Vercel and other serverless platforms
- ✅ **Developer friendly**: Great dashboard, easy migration from other providers

#### Setup Instructions

1. **Create Account**
   - Go to [neon.tech](https://neon.tech)
   - Sign up with GitHub, Google, or email

2. **Create Project**
   - Click "Create a project"
   - Name it: `campaign-manager-dev` (or your preference)
   - Select region closest to you
   - Wait for database creation (~30 seconds)

3. **Get Connection String**
   - In your project dashboard, find "Connection Details"
   - **Important**: Copy the **"Pooled connection"** string (not the direct connection)
   - It looks like:
     ```
     postgresql://user:password@ep-xyz-123.us-east-2.aws.neon.tech/dbname?sslmode=require
     ```

4. **Configure Environment**
   ```bash
   # In your .env file
   DATABASE_URL=postgresql://user:password@ep-xyz-123.region.aws.neon.tech/campaign_manager?sslmode=require
   ```

5. **Test and Migrate**
   ```bash
   npm run db:test      # Verify connection
   npm run db:migrate   # Apply schema
   ```

#### Production Setup
- Create a separate project: `campaign-manager-prod`
- Use the production connection string in Vercel environment variables
- Keep development and production databases separate

---

### Option 2: Supabase

**Best for: Projects that need additional features (auth, storage, realtime)**

#### Why Supabase?
- ✅ **All-in-one**: Includes auth, storage, realtime subscriptions
- ✅ **Good free tier**: 500 MB database, 2 GB bandwidth/month
- ✅ **PostgreSQL**: Full PostgreSQL database with extensions
- ⚠️ **Smaller limits**: Less storage than Neon on free tier

#### Setup Instructions

1. **Create Account**
   - Go to [supabase.com](https://supabase.com)
   - Sign up with GitHub, Google, or email

2. **Create Project**
   - Click "New Project"
   - Organization: Create or select existing
   - Name: `campaign-manager-dev`
   - Database Password: Generate strong password (save it!)
   - Region: Choose closest to you
   - Wait for setup (~2 minutes)

3. **Get Connection String**
   - Go to Project Settings (gear icon)
   - Navigate to "Database" section
   - Find "Connection Pooling" section
   - **Important**: Use **"Transaction"** mode for serverless
   - Copy the connection string:
     ```
     postgresql://postgres.xyz:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres
     ```

4. **Configure Environment**
   ```bash
   # In your .env file
   DATABASE_URL=postgresql://postgres.xyz:password@aws-0-region.pooler.supabase.com:6543/postgres
   ```

5. **Test and Migrate**
   ```bash
   npm run db:test
   npm run db:migrate
   ```

---

### Option 3: Railway

**Best for: Hosting both application and database in one place**

#### Why Railway?
- ✅ **Simple**: One platform for database + app deployment
- ✅ **Free tier**: $5 credit/month (enough for small projects)
- ⚠️ **Limited**: Free tier may run out for active development

#### Setup Instructions

1. **Create Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create Database**
   - Click "New Project"
   - Select "Provision PostgreSQL"
   - Database will be created automatically

3. **Get Connection String**
   - Click on the PostgreSQL service
   - Go to "Connect" tab
   - Copy the "Postgres Connection URL"

4. **Configure Environment**
   ```bash
   # In your .env file
   DATABASE_URL=postgresql://postgres:password@containers-region.railway.app:5432/railway
   ```

5. **Test and Migrate**
   ```bash
   npm run db:test
   npm run db:migrate
   ```

---

### Option 4: Local PostgreSQL

**Best for: Offline development, learning, or testing**

#### Prerequisites
- PostgreSQL 12+ installed on your machine

#### Setup Instructions

1. **Install PostgreSQL**
   
   **macOS** (using Homebrew):
   ```bash
   brew install postgresql@16
   brew services start postgresql@16
   ```
   
   **Ubuntu/Debian**:
   ```bash
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   ```
   
   **Windows**:
   - Download installer from [postgresql.org](https://www.postgresql.org/download/windows/)
   - Run installer and follow prompts
   - Remember the password you set for postgres user

2. **Create Database**
   ```bash
   # macOS/Linux
   createdb campaign_manager
   
   # Windows (in PowerShell as postgres user)
   psql -U postgres
   CREATE DATABASE campaign_manager;
   \q
   ```

3. **Configure Environment**
   ```bash
   # In your .env file
   # Replace 'yourpassword' with your postgres password
   DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/campaign_manager
   ```

4. **Test and Migrate**
   ```bash
   npm run db:test
   npm run db:migrate
   ```

## Initial Setup

After choosing and configuring your database provider:

### 1. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and set your `DATABASE_URL`:
```bash
# Example for Neon
DATABASE_URL=postgresql://user:pass@ep-xyz.region.aws.neon.tech/dbname?sslmode=require
```

### 2. Test Connection

Verify your database connection:
```bash
npm run db:test
```

Expected output:
```
✅ Connection successful!

Database Information:
  Timestamp: 2024-01-15T10:30:00.000Z
  Latency: 45ms
  PostgreSQL Version: PostgreSQL 16.1
```

If the test fails, see [Troubleshooting](#troubleshooting).

### 3. Run Migrations

Apply the database schema:
```bash
npm run db:migrate
```

This creates all necessary tables:
- `users` - User accounts
- `campaigns` - Campaign data
- `campaign_players` - Player participation
- `invitations` - Campaign invitations

## Running Migrations

### Development Workflow

1. **Make Schema Changes**
   
   Edit `lib/db/schema.ts`:
   ```typescript
   // Example: Adding a new field
   export const users = pgTable('users', {
     // ... existing fields
     avatarUrl: varchar('avatar_url', { length: 500 })
   })
   ```

2. **Generate Migration**
   ```bash
   npm run db:generate
   ```
   
   This creates a new SQL file in `lib/db/migrations/`

3. **Review Migration**
   
   Open the generated SQL file and verify the changes:
   ```bash
   ls lib/db/migrations/
   cat lib/db/migrations/0001_new_migration.sql
   ```

4. **Apply Migration**
   ```bash
   npm run db:migrate
   ```

5. **Verify Changes**
   ```bash
   npm run db:studio  # Opens visual database browser
   ```

### Common Commands

| Command | Description | When to Use |
|---------|-------------|-------------|
| `npm run db:generate` | Generate migration from schema changes | After modifying schema.ts |
| `npm run db:migrate` | Apply pending migrations | Before testing schema changes |
| `npm run db:push` | Push schema directly (no migration) | Quick prototyping only |
| `npm run db:studio` | Open visual database browser | Inspecting data, debugging |
| `npm run db:test` | Test database connection | Troubleshooting connectivity |

## Team Member Onboarding

### For New Contributors

Welcome! Here's how to get your local database set up:

1. **Choose Your Database Setup**
   - **Quick Start**: Use Neon (free, no local install needed)
   - **Offline**: Install PostgreSQL locally
   - Ask the team which database the project primarily uses

2. **Get the Code**
   ```bash
   git clone https://github.com/migueog/text_adventure.git
   cd text_adventure
   npm install
   ```

3. **Configure Database**
   ```bash
   cp .env.example .env
   # Edit .env and add your DATABASE_URL
   ```
   
   **Tip**: If you're unsure, create a free Neon database (takes 2 minutes)

4. **Set Up Schema**
   ```bash
   npm run db:test      # Verify connection works
   npm run db:migrate   # Create tables
   ```

5. **Verify Everything Works**
   ```bash
   npm run dev         # Start app
   npm run db:studio   # Browse database
   ```

### Making Database Changes

1. **Always Create Migrations**
   - Never use `db:push` for shared changes
   - Use `db:generate` to create migration files
   - Commit migration files to Git

2. **Test Your Changes**
   ```bash
   npm run db:generate  # Create migration
   npm run db:migrate   # Apply locally
   npm test            # Run tests
   ```

3. **Share With Team**
   - Commit migration files
   - Other team members run `npm run db:migrate` to get changes
   - Document any manual data migrations needed

## Production Deployment

### Vercel Setup (Recommended)

1. **Create Production Database**
   - Use Neon for best Vercel integration
   - Create separate project: `campaign-manager-prod`
   - Copy the **Pooled connection** string

2. **Configure Vercel**
   - Go to your Vercel project
   - Navigate to Settings → Environment Variables
   - Add variable:
     - **Name**: `DATABASE_URL`
     - **Value**: Your Neon connection string
     - **Environment**: Production (and Preview if desired)

3. **Run Migrations**
   ```bash
   # Migrate production database
   MIGRATION_DATABASE_URL=your_prod_url npm run db:migrate
   ```

4. **Deploy**
   ```bash
   git push
   # Vercel auto-deploys
   ```

### Other Platforms

- **Netlify**: Same process as Vercel, add DATABASE_URL to environment
- **Railway**: Can host both app and database
- **Render**: Similar to Vercel setup

### Important Notes

- ⚠️ **Never commit** `.env` files with production credentials
- ✅ **Always use** separate databases for dev/staging/production
- ✅ **Test migrations** in staging before applying to production
- ✅ **Backup** production database before major migrations

## Troubleshooting

### Connection Failed

**Error**: "Connection failed: connect ECONNREFUSED"

**Solutions**:
1. Verify DATABASE_URL format
2. Check that database service is running
3. For local PostgreSQL:
   ```bash
   # macOS
   brew services start postgresql@16
   
   # Linux
   sudo systemctl start postgresql
   ```

### SSL/TLS Errors

**Error**: "no pg_hba.conf entry for host" or SSL errors

**Solution**: Add `?sslmode=require` to connection string:
```bash
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
```

### Authentication Failed

**Error**: "password authentication failed"

**Solutions**:
1. Verify username and password in connection string
2. For local PostgreSQL, reset password:
   ```bash
   psql postgres
   ALTER USER postgres PASSWORD 'newpassword';
   ```
3. For hosted providers, regenerate database password in dashboard

### Migration Errors

**Error**: "relation already exists" or "column already exists"

**Solutions**:
1. Check migration history:
   ```bash
   npm run db:studio
   # Check drizzle.__drizzle_migrations table
   ```
2. If needed, manually fix and re-run
3. For development, you can drop and recreate:
   ```bash
   # WARNING: Deletes all data
   DROP DATABASE campaign_manager;
   CREATE DATABASE campaign_manager;
   npm run db:migrate
   ```

### Connection Pool Exhausted

**Error**: "remaining connection slots are reserved" or "too many clients"

**Solutions**:
1. Check connection pool settings in `lib/db/client.ts`
2. For serverless, use connection pooling:
   - Neon: Use "Pooled connection" string
   - Supabase: Use "Transaction" mode
3. Reduce `DB_POOL_MAX` in .env:
   ```bash
   DB_POOL_MAX=5
   ```

### Need Help?

1. Check existing [GitHub Issues](https://github.com/migueog/text_adventure/issues)
2. Run connection test with verbose output:
   ```bash
   VERBOSE=true npm run db:test
   ```
3. Open a new issue with:
   - Error message
   - Database provider
   - Connection test output
   - Steps to reproduce

## Additional Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [Neon Documentation](https://neon.tech/docs/introduction)
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Schema reference
- [lib/db/README.md](./lib/db/README.md) - Database module documentation
