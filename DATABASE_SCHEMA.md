# Database Schema Documentation

This document describes the database schema for the Text Adventure Campaign Manager using Drizzle ORM with PostgreSQL.

## Overview

The database supports multi-user, multi-campaign functionality with the following features:
- User authentication and account management
- Campaign creation and ownership
- Multi-player campaign participation
- Invitation system for joining campaigns
- Persistent game state storage

## Schema Design

### Entity Relationship Diagram

```
┌─────────────┐
│   users     │
│─────────────│
│ id (PK)     │
│ email       │◄──────┐
│ password    │       │
│ username    │       │
└─────────────┘       │
       ▲              │
       │              │
       │ owner_id     │ user_id
       │              │
┌──────┴──────┐       │
│  campaigns  │       │
│─────────────│       │
│ id (PK)     │◄──────┼────────┐
│ name        │       │        │
│ owner_id    │       │        │ campaign_id
│ settings    │       │        │
│ game_state  │       │        │
│ status      │       │        │
└─────────────┘       │        │
       ▲              │        │
       │ campaign_id  │        │
       │              │        │
       ├──────────────┼────────┘
       │              │
┌──────┴────────┐     │
│ campaign_     │     │
│   players     │     │
│───────────────│     │
│ id (PK)       │     │
│ campaign_id   │     │
│ user_id       ├─────┘
│ player_name   │
│ player_state  │
└───────────────┘
       ▲
       │ campaign_id
       │
┌──────┴────────┐
│ invitations   │
│───────────────│
│ id (PK)       │
│ campaign_id   │
│ email         │
│ token         │
│ status        │
│ expires_at    │
└───────────────┘
```

## Tables

### users

Stores user account information for authentication and identification.

| Column        | Type         | Constraints                  | Description                      |
|---------------|--------------|------------------------------|----------------------------------|
| id            | serial       | PRIMARY KEY                  | Unique user identifier           |
| email         | varchar(255) | NOT NULL, UNIQUE             | User's email address             |
| password_hash | varchar(255) | NOT NULL                     | Hashed password for security     |
| username      | varchar(100) | NOT NULL, UNIQUE             | Display name for the user        |
| created_at    | timestamp    | NOT NULL, DEFAULT NOW()      | Account creation timestamp       |
| updated_at    | timestamp    | NOT NULL, DEFAULT NOW()      | Last account update timestamp    |

**Indexes:**
- Primary key on `id`
- Unique index on `email`
- Unique index on `username`

### campaigns

Stores campaign metadata and full game state.

| Column      | Type         | Constraints                    | Description                           |
|-------------|--------------|--------------------------------|---------------------------------------|
| id          | serial       | PRIMARY KEY                    | Unique campaign identifier            |
| name        | varchar(255) | NOT NULL                       | Campaign name                         |
| owner_id    | integer      | NOT NULL, FK → users.id        | User who created the campaign         |
| settings    | jsonb        | NOT NULL                       | Campaign configuration (see below)    |
| game_state  | jsonb        | NOT NULL                       | Full game state (see below)           |
| status      | varchar(50)  | NOT NULL                       | 'setup', 'active', 'completed'        |
| created_at  | timestamp    | NOT NULL, DEFAULT NOW()        | Campaign creation timestamp           |
| updated_at  | timestamp    | NOT NULL, DEFAULT NOW()        | Last update timestamp                 |

**Indexes:**
- Primary key on `id`
- Foreign key on `owner_id` referencing `users(id)`

**settings JSONB structure:**
```typescript
{
  playerCount: number,        // 2-6 players
  mapSize: {
    rows: number,
    cols: number,
    surfaceRows: number,
    tombRows: number
  },
  targetThreatLevel: number,  // 5-10
  gameMode: 'competitive' | 'solo' | 'cooperative'
}
```

**game_state JSONB structure:**
```typescript
{
  currentRound: number,
  currentPhase: 'Movement' | 'Battle' | 'Action' | 'Threat',
  threatLevel: number,
  hexMap: {
    [hexId: string]: {
      type: 'surface' | 'tomb',
      location: number,      // D36 result (11-36)
      condition: number,     // D36 result (11-36)
      explored: boolean,
      exploredBy: number[]   // Player IDs
    }
  }
}
```

### campaign_players

Links users to campaigns and stores per-player game state.

| Column       | Type         | Constraints                    | Description                           |
|--------------|--------------|--------------------------------|---------------------------------------|
| id           | serial       | PRIMARY KEY                    | Unique record identifier              |
| campaign_id  | integer      | NOT NULL, FK → campaigns.id    | Campaign this player belongs to       |
| user_id      | integer      | NOT NULL, FK → users.id        | User playing in this campaign         |
| player_name  | varchar(100) | NOT NULL                       | Player's chosen name for this game    |
| player_state | jsonb        | NOT NULL                       | Player's game state (see below)       |
| joined_at    | timestamp    | NOT NULL, DEFAULT NOW()        | When player joined campaign           |

**Indexes:**
- Primary key on `id`
- Foreign key on `campaign_id` referencing `campaigns(id)`
- Foreign key on `user_id` referencing `users(id)`

**player_state JSONB structure:**
```typescript
{
  supplyPoints: number,      // 0-10
  campaignPoints: number,    // Victory points
  position: {
    row: number,
    col: number
  },
  killTeamName: string,
  color: string,             // Hex color code
  bases: Array<{ row: number, col: number }>,
  camps: Array<{ row: number, col: number }>,
  exploredHexes: number,
  gamesPlayed: number,
  gamesWon: number,
  gamesLost: number,
  operativesKilled: number,
  history: Array<{
    round: number,
    phase: string,
    timestamp: string,
    action: string,
    spBefore: number,
    spAfter: number,
    cpBefore: number,
    cpAfter: number
  }>
}
```

### invitations

Tracks invitations sent to users to join campaigns.

| Column      | Type         | Constraints                    | Description                           |
|-------------|--------------|--------------------------------|---------------------------------------|
| id          | serial       | PRIMARY KEY                    | Unique invitation identifier          |
| campaign_id | integer      | NOT NULL, FK → campaigns.id    | Campaign being invited to             |
| email       | varchar(255) | NOT NULL                       | Email address of invitee              |
| token       | varchar(255) | NOT NULL, UNIQUE               | Unique token for accepting invite     |
| status      | varchar(50)  | NOT NULL                       | 'pending', 'accepted', 'declined'     |
| created_at  | timestamp    | NOT NULL, DEFAULT NOW()        | Invitation creation timestamp         |
| expires_at  | timestamp    | NOT NULL                       | When invitation expires               |

**Indexes:**
- Primary key on `id`
- Foreign key on `campaign_id` referencing `campaigns(id)`
- Unique index on `token`

## Relationships

### One-to-Many Relationships

1. **User → Campaigns**: A user can own multiple campaigns
   - `users.id` ← `campaigns.owner_id`

2. **Campaign → Campaign Players**: A campaign can have multiple players
   - `campaigns.id` ← `campaign_players.campaign_id`

3. **User → Campaign Players**: A user can participate in multiple campaigns
   - `users.id` ← `campaign_players.user_id`

4. **Campaign → Invitations**: A campaign can have multiple invitations
   - `campaigns.id` ← `invitations.campaign_id`

## Type Safety

Drizzle ORM provides full TypeScript type inference. Import types from the schema:

```typescript
import { 
  User, NewUser, 
  Campaign, NewCampaign,
  CampaignPlayer, NewCampaignPlayer,
  Invitation, NewInvitation 
} from './lib/db/schema'
```

## Usage Examples

### Querying Data

```typescript
import { db } from './lib/db/client'
import { users, campaigns, campaignPlayers } from './lib/db/schema'
import { eq } from 'drizzle-orm'

// Get all users
const allUsers = await db.select().from(users)

// Get user by email
const user = await db
  .select()
  .from(users)
  .where(eq(users.email, 'user@example.com'))

// Get campaigns owned by user
const userCampaigns = await db
  .select()
  .from(campaigns)
  .where(eq(campaigns.ownerId, userId))

// Get players in a campaign
const players = await db
  .select()
  .from(campaignPlayers)
  .where(eq(campaignPlayers.campaignId, campaignId))
```

### Inserting Data

```typescript
// Create new user
const newUser = await db
  .insert(users)
  .values({
    email: 'user@example.com',
    passwordHash: 'hashed_password',
    username: 'username'
  })
  .returning()

// Create new campaign
const newCampaign = await db
  .insert(campaigns)
  .values({
    name: 'My Campaign',
    ownerId: userId,
    settings: {
      playerCount: 4,
      mapSize: { rows: 6, cols: 6, surfaceRows: 3, tombRows: 3 },
      targetThreatLevel: 7,
      gameMode: 'competitive'
    },
    gameState: {
      currentRound: 1,
      currentPhase: 'Movement',
      threatLevel: 1,
      hexMap: {}
    },
    status: 'setup'
  })
  .returning()
```

### Updating Data

```typescript
// Update campaign status
await db
  .update(campaigns)
  .set({ 
    status: 'active',
    updatedAt: new Date()
  })
  .where(eq(campaigns.id, campaignId))

// Update player state
await db
  .update(campaignPlayers)
  .set({
    playerState: updatedPlayerState
  })
  .where(eq(campaignPlayers.id, playerId))
```

### Deleting Data

```typescript
// Delete invitation
await db
  .delete(invitations)
  .where(eq(invitations.id, invitationId))

// Delete campaign (cascade should be handled by application logic)
await db
  .delete(campaigns)
  .where(eq(campaigns.id, campaignId))
```

## Migration Management

### Generate Migration

When you modify the schema, generate a new migration:

```bash
npm run db:generate
```

This creates SQL migration files in `lib/db/migrations/`.

### Apply Migrations

Push changes to the database:

```bash
npm run db:push
```

**Note**: This command will apply schema changes directly to your database. For production environments, consider using a proper migration runner.

### Drizzle Studio

Open visual database browser:

```bash
npm run db:studio
```

This opens an interactive web UI to browse and modify your database.

### Drop Migration

Remove the last migration:

```bash
npm run db:drop
```

**Warning**: This is destructive and should only be used during development.

## Environment Variables

Required environment variable:

```
DATABASE_URL=postgresql://username:password@host:port/database
```

See `.env.example` for template.

## Security Considerations

1. **Password Storage**: Always hash passwords before storing in `password_hash`
2. **Invitation Tokens**: Generate cryptographically secure random tokens
3. **Token Expiration**: Check `expires_at` before accepting invitations
4. **Database Access**: Use connection pooling and prepared statements (handled by Drizzle)
5. **Input Validation**: Validate all user inputs before database operations
6. **JSONB Data**: Validate structure of JSONB data before storage

## Performance Considerations

1. **Indexes**: Consider adding indexes on frequently queried columns
2. **JSONB**: Use JSONB operators for efficient JSON querying
3. **Connection Pooling**: Reuse the same `db` client instance
4. **Pagination**: Implement pagination for large result sets
5. **Transactions**: Use transactions for multi-table operations

## Future Enhancements

Potential schema additions for future features:

- `game_events` table for detailed activity logging
- `achievements` table for player achievements
- `messages` table for in-game messaging
- `battle_results` table for detailed battle history
- Additional indexes based on query patterns
