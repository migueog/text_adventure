# Database Commands Quick Reference

Quick reference for all database-related commands in this project.

## Daily Development Commands

```bash
# Start development server
npm run dev

# Browse database visually
npm run db:studio
```

## Initial Setup Commands

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Edit .env and add your DATABASE_URL
# (Get connection string from Neon, Supabase, or local PostgreSQL)

# 3. Test connection
npm run db:test

# 4. Apply schema
npm run db:migrate

# 5. Verify everything is set up
npm run db:verify
```

## Schema Change Workflow

```bash
# 1. Edit schema
nano lib/db/schema.ts

# 2. Generate migration
npm run db:generate

# 3. Review migration (optional)
cat lib/db/migrations/[latest-migration].sql

# 4. Apply migration
npm run db:migrate

# 5. Verify changes
npm run db:studio
```

## Troubleshooting Commands

```bash
# Test connection with detailed output
VERBOSE=true npm run db:test

# Full setup verification
npm run db:verify

# Check what's in the database
npm run db:studio
```

## All Available Database Commands

| Command | Description | When to Use |
|---------|-------------|-------------|
| `npm run db:test` | Test database connection | Before starting work, troubleshooting |
| `npm run db:verify` | Verify complete setup | Initial setup, after config changes |
| `npm run db:migrate` | Apply migrations to database | After pulling changes, after generating migrations |
| `npm run db:generate` | Generate migration from schema | After editing lib/db/schema.ts |
| `npm run db:push` | Push schema directly (no migration) | ⚠️ Quick prototyping only, not for shared changes |
| `npm run db:studio` | Open visual database browser | Browsing data, debugging |
| `npm run db:drop` | Drop last migration | ⚠️ Development only, if you need to undo last migration |

## Environment Variables

```bash
# Required
DATABASE_URL=postgresql://user:pass@host:5432/database

# Optional (for custom pool settings)
DB_POOL_MAX=10
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_CONNECTION_TIMEOUT=2000

# Optional (for separate migration database)
MIGRATION_DATABASE_URL=postgresql://...
```

## Connection String Examples

```bash
# Neon (Pooled - recommended for Vercel)
DATABASE_URL=postgresql://user:pass@ep-xyz.us-east-2.aws.neon.tech/dbname?sslmode=require

# Supabase (Transaction mode - for serverless)
DATABASE_URL=postgresql://postgres.xyz:pass@aws-0-region.pooler.supabase.com:6543/postgres

# Railway
DATABASE_URL=postgresql://postgres:pass@containers-region.railway.app:5432/railway

# Local PostgreSQL
DATABASE_URL=postgresql://postgres:password@localhost:5432/campaign_manager
```

## Common Scenarios

### First Time Setup
```bash
cp .env.example .env
# Add DATABASE_URL to .env
npm run db:test
npm run db:migrate
npm run dev
```

### After Pulling Changes
```bash
git pull
npm install          # If package.json changed
npm run db:migrate   # If schema changed
npm run dev
```

### Making Schema Changes
```bash
# Edit lib/db/schema.ts
npm run db:generate
npm run db:migrate
npm test
git add lib/db/migrations/
git commit -m "Add new schema field"
```

### Troubleshooting Connection Issues
```bash
# Verify DATABASE_URL is set
cat .env | grep DATABASE_URL

# Test with verbose output
VERBOSE=true npm run db:test

# Full verification
npm run db:verify
```

### Production Deployment
```bash
# 1. Create production database (e.g., Neon project)
# 2. Add DATABASE_URL to hosting platform (e.g., Vercel)
# 3. Run migrations against production
MIGRATION_DATABASE_URL=your_prod_url npm run db:migrate
```

## Quick Tips

- ✅ **Always** use `db:generate` + `db:migrate` for shared changes
- ✅ **Always** commit migration files with schema changes
- ✅ **Always** test connection before starting work
- ⚠️ **Never** use `db:push` for changes others need
- ⚠️ **Never** commit `.env` files (they're gitignored)
- 💡 Use `db:studio` to visually inspect your database
- 💡 Use `db:verify` if unsure about setup

## Getting Help

- **Setup issues**: See [DATABASE_SETUP.md](./DATABASE_SETUP.md)
- **Quick start**: See [TEAM_ONBOARDING.md](./TEAM_ONBOARDING.md)
- **Schema details**: See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
- **Module docs**: See [lib/db/README.md](./lib/db/README.md)

## Error Messages

### "DATABASE_URL not set"
```bash
# Solution: Create .env file and add DATABASE_URL
cp .env.example .env
nano .env  # Add your connection string
```

### "Connection failed"
```bash
# Solutions:
# 1. Verify DATABASE_URL format is correct
# 2. Check database is running (for local)
# 3. Verify network connectivity
# 4. For cloud databases, ensure SSL: ?sslmode=require
```

### "Migration failed"
```bash
# Solutions:
# 1. Check database connection first: npm run db:test
# 2. Verify migration files exist: ls lib/db/migrations/
# 3. Check for conflicting changes in database
```

### "No migration files found"
```bash
# Solution: Generate initial migration
npm run db:generate
```
