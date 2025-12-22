# Team Member Quick Start Guide

Welcome to the Text Adventure Campaign Manager project! This guide will get you up and running in about 5-10 minutes.

## Prerequisites

- Node.js 16+ installed
- Git installed
- A GitHub account

## Step-by-Step Setup

### 1. Clone and Install (2 minutes)

```bash
# Clone the repository
git clone https://github.com/migueog/text_adventure.git
cd text_adventure

# Install dependencies
npm install
```

### 2. Set Up Database (5 minutes)

You have two options:

#### Option A: Cloud Database (Recommended - No Installation)

**Using Neon (fastest, best for Vercel):**
1. Go to [neon.tech](https://neon.tech)
2. Sign up (free, no credit card)
3. Click "Create a project"
4. Name it: `campaign-manager-dev`
5. Copy the **"Pooled connection"** string
6. Continue to step 3 below

**Using Supabase (if you want auth features later):**
1. Go to [supabase.com](https://supabase.com)
2. Sign up (free, no credit card)
3. Create new project: `campaign-manager-dev`
4. Wait ~2 minutes for setup
5. Settings → Database → Connection Pooling
6. Copy "Transaction" mode connection string
7. Continue to step 3 below

#### Option B: Local PostgreSQL

```bash
# macOS
brew install postgresql@16
brew services start postgresql@16
createdb campaign_manager

# Your DATABASE_URL will be:
# postgresql://postgres:yourpassword@localhost:5432/campaign_manager
```

### 3. Configure Environment (1 minute)

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your database connection
# Replace with your actual connection string from step 2
nano .env  # or use your favorite editor
```

Add this line to `.env`:
```bash
DATABASE_URL=postgresql://your-connection-string-here
```

**Examples:**
- Neon: `postgresql://user:pass@ep-xyz.us-east-2.aws.neon.tech/dbname?sslmode=require`
- Supabase: `postgresql://postgres.xyz:pass@aws-0-region.pooler.supabase.com:6543/postgres`
- Local: `postgresql://postgres:password@localhost:5432/campaign_manager`

### 4. Verify and Migrate (1 minute)

```bash
# Test connection
npm run db:test

# Apply database schema
npm run db:migrate

# Verify everything is set up
npm run db:verify
```

You should see green checkmarks ✅ for all steps!

### 5. Start Development (30 seconds)

```bash
# Start the development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) - you should see the app!

## Common Commands

### Daily Development
```bash
npm run dev              # Start dev server
npm test                 # Run tests
npm run db:studio        # Browse database
```

### Database Operations
```bash
npm run db:test          # Test connection
npm run db:migrate       # Apply schema changes
npm run db:generate      # Create new migration
npm run db:verify        # Verify setup
```

### When Pulling Changes
```bash
git pull
npm install              # If package.json changed
npm run db:migrate       # If schema changed
npm test                 # Verify everything works
```

## Making Your First Contribution

### 1. Create a Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

Follow the [development standards](.github/copilot-instructions.md):
- Write tests first (TDD)
- Keep functions under 20 lines
- Use TypeScript
- Add meaningful comments

### 3. Test Your Changes
```bash
npm test                 # Run tests
npm run lint             # Check code style
npm run db:verify        # If you changed schema
```

### 4. Submit Pull Request
```bash
git add .
git commit -m "Brief description of changes"
git push origin feature/your-feature-name
```

Then create a PR on GitHub.

## Database Changes

### Making Schema Changes

1. **Edit Schema**
   ```bash
   # Edit lib/db/schema.ts
   nano lib/db/schema.ts
   ```

2. **Generate Migration**
   ```bash
   npm run db:generate
   ```

3. **Apply Locally**
   ```bash
   npm run db:migrate
   ```

4. **Test**
   ```bash
   npm test
   npm run db:studio  # Visual verification
   ```

5. **Commit Migration Files**
   ```bash
   git add lib/db/migrations/
   git commit -m "Add new schema fields"
   ```

### Pulling Schema Changes

When someone else changes the schema:

```bash
git pull
npm run db:migrate    # Apply their migrations
npm run db:verify     # Verify it worked
```

## Troubleshooting

### "Connection failed"
```bash
# Verify your DATABASE_URL is correct
cat .env | grep DATABASE_URL

# Test with detailed output
VERBOSE=true npm run db:test
```

### "Migration failed"
```bash
# Check migration files exist
ls lib/db/migrations/

# Verify database connection
npm run db:test

# Try fresh migration (⚠️ deletes data)
npm run db:drop
npm run db:migrate
```

### "Tests failing"
```bash
# Run specific test
npm test -- path/to/test.test.ts

# Run with coverage
npm run test:coverage

# Check if it's a database issue
npm run db:verify
```

### Need Help?

1. **Check documentation:**
   - [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Complete database guide
   - [TESTING.md](./TESTING.md) - Testing guidelines
   - [.github/copilot-instructions.md](.github/copilot-instructions.md) - Dev standards

2. **Ask the team:**
   - Open a GitHub issue
   - Tag @migueog or relevant team members
   - Include error messages and steps to reproduce

3. **Common resources:**
   - [Drizzle ORM docs](https://orm.drizzle.team/)
   - [Next.js docs](https://nextjs.org/docs)
   - [React Testing Library](https://testing-library.com/react)

## Project Structure Quick Reference

```
text_adventure/
├── app/                    # Next.js pages and API routes
├── components/             # React components
├── lib/
│   ├── db/                # Database (schema, migrations, client)
│   ├── utils/             # Utility functions
│   └── data/              # Game data
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript types
├── .env                   # Your local config (not committed)
├── .env.example           # Template for .env
└── DATABASE_SETUP.md      # Full database guide
```

## Development Workflow

1. **Pull latest changes**
   ```bash
   git pull
   npm install
   npm run db:migrate
   ```

2. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature
   ```

3. **Write test first** (TDD)
   ```bash
   # Create test file
   touch lib/utils/myFunction.test.ts
   # Write failing test
   npm test -- myFunction.test.ts
   ```

4. **Implement feature**
   ```bash
   # Write code to pass test
   # Keep functions small (<20 lines)
   npm test  # Verify tests pass
   ```

5. **Commit and push**
   ```bash
   git add .
   git commit -m "Descriptive message"
   git push origin feature/your-feature
   ```

6. **Create PR on GitHub**

## Tips for Success

- ✅ **Always pull before starting new work**
- ✅ **Run `npm run db:migrate` after pulling**
- ✅ **Write tests before implementation (TDD)**
- ✅ **Keep functions small and focused**
- ✅ **Use TypeScript (no `any` types)**
- ✅ **Commit migration files with schema changes**
- ✅ **Run `npm run db:verify` before committing DB changes**

## Next Steps

Now that you're set up:

1. Browse the code to understand the architecture
2. Check [.github/issues/](https://github.com/migueog/text_adventure/issues) for open tasks
3. Read [FUTURE_FEATURES.md](./FUTURE_FEATURES.md) for roadmap
4. Join team discussions on GitHub

**Happy coding! 🚀**
