# Mission Control Database Setup

Complete guide for setting up the PostgreSQL database for Mission Control's Blueprint-First Development system.

## Prerequisites

- PostgreSQL 14+ installed
- Database administration access
- Node.js environment for connection testing

## Quick Start

### Option 1: Local PostgreSQL Installation

```bash
# 1. Install PostgreSQL (if not already installed)
# Windows (using chocolatey):
choco install postgresql

# macOS:
brew install postgresql@14

# Ubuntu/Debian:
sudo apt-get install postgresql-14

# 2. Start PostgreSQL service
# Windows:
pg_ctl -D "C:\Program Files\PostgreSQL\14\data" start

# macOS:
brew services start postgresql@14

# Ubuntu/Debian:
sudo systemctl start postgresql

# 3. Create the database
psql -U postgres -c "CREATE DATABASE mission_control;"

# 4. Run the schema
psql -U postgres -d mission_control -f mission-control-schema.sql
```

### Option 2: Docker PostgreSQL (Recommended for Development)

```bash
# 1. Create docker-compose.yml in database/ directory
cat > docker-compose.yml << EOF
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    container_name: mission-control-db
    environment:
      POSTGRES_DB: mission_control
      POSTGRES_USER: mission_control_user
      POSTGRES_PASSWORD: change_me_in_production
      POSTGRES_HOST_AUTH_METHOD: trust
    ports:
      - "5432:5432"
    volumes:
      - mission-control-data:/var/lib/postgresql/data
      - ./mission-control-schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mission_control_user -d mission_control"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  mission_control_data:
EOF

# 2. Start the database
docker-compose up -d

# 3. Verify the database is ready
docker-compose ps
docker-compose logs postgres
```

### Option 3: Supabase (Recommended for Production)

```bash
# 1. Create a new Supabase project at https://supabase.com

# 2. Get your connection string from Supabase Dashboard
# Settings → Database → Connection String (URI format)

# 3. Run the schema using Supabase SQL Editor
# Copy the entire contents of mission-control-schema.sql
# Paste into Supabase SQL Editor and run
```

## Database Architecture Overview

The database implements a 7-tier architecture for Blueprint-First Development:

### TIER 1: Project & Blueprint Management
- `projects` - Top-level project entity
- `blueprint_versions` - Pivot/change management
- `system_architecture` - Technical blueprint

### TIER 2: Work Breakdown Structure
- `project_phases` - Construction-style phases
- `features` - Major deliverables
- `tasks` - Atomic work units
- `task_dependencies` - Dependency graph

### TIER 3: Orchestrator & Agent Coordination
- `orchestrator_sessions` - Orchestrator work log
- `orchestrator_decisions` - Design rationale (WHY layer)
- `agent_work_sessions` - Individual agent tracking

### TIER 4: Conversations & Messages
- `conversations` - Chat sessions
- `messages` - Individual messages

### TIER 5: Documentation & Artifacts
- `project_documentation` - Requirements, designs
- `project_artifacts` - Code files, deployments

### TIER 6: Quality & Validation
- `quality_checkpoints` - Validation points
- `project_issues` - Blockers and problems

### TIER 7: Memory-Agent Integration
- `project_context_snapshots` - Link to code analysis

## Environment Configuration

Create a `.env` file in your VS Code fork root:

```bash
# Database Configuration
DATABASE_URL=postgresql://mission_control_user:change_me_in_production@localhost:5432/mission_control

# For Docker setup:
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=mission_control
POSTGRES_USER=mission_control_user
POSTGRES_PASSWORD=change_me_in_production

# For Supabase:
# DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# Optional: Memory-Agent Integration
MEMORY_AGENT_DB_URL=postgresql://localhost:5432/cascade_memory
MEMORY_AGENT_ENABLED=true
```

## TypeScript/Node.js Connection Setup

Install PostgreSQL client library:

```bash
cd /mnt/c/Users/bubun/CascadeProjects/vscode-fork
npm install pg @types/pg
```

Create database connection service:

```typescript
// src/vs/workbench/contrib/aiOrchestrator/node/databaseService.ts
import { Pool } from 'pg';

export interface IDatabaseService {
    query<T>(sql: string, params?: any[]): Promise<T[]>;
    close(): Promise<void>;
}

export class DatabaseService implements IDatabaseService {
    private pool: Pool;

    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
    }

    async query<T>(sql: string, params: any[] = []): Promise<T[]> {
        const client = await this.pool.connect();
        try {
            const result = await client.query(sql, params);
            return result.rows;
        } finally {
            client.release();
        }
    }

    async close(): Promise<void> {
        await this.pool.end();
    }
}
```

## Verification Steps

### 1. Test Connection

```bash
# Using psql
psql -U mission_control_user -d mission_control -c "SELECT version();"

# Using Node.js
node -e "const {Pool} = require('pg'); const pool = new Pool({connectionString: process.env.DATABASE_URL}); pool.query('SELECT version()').then(r => console.log(r.rows[0])).then(() => pool.end());"
```

### 2. Verify Schema

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Should return 18 tables:
-- agent_work_sessions, blueprint_versions, conversations, features,
-- messages, orchestrator_decisions, orchestrator_sessions,
-- project_artifacts, project_context_snapshots, project_documentation,
-- project_issues, project_phases, projects, quality_checkpoints,
-- system_architecture, task_dependencies, tasks

-- Check all enums exist
SELECT typname
FROM pg_type
WHERE typtype = 'e'
ORDER BY typname;

-- Should return 18 enums
```

### 3. Test CRUD Operations

```sql
-- Create a test project
INSERT INTO projects (name, description, workspace_path, tech_stack, execution_mode)
VALUES (
    'Test Project',
    'A test project for verification',
    '/test/workspace',
    '["Next.js", "PostgreSQL"]'::jsonb,
    'semi_autonomous'
)
RETURNING id, name, status;

-- Query the project
SELECT * FROM projects WHERE name = 'Test Project';

-- Clean up
DELETE FROM projects WHERE name = 'Test Project';
```

## Memory-Agent Integration (Optional)

If integrating with Memory-Agent:

```bash
# 1. Ensure Memory-Agent database is running
# See C:\Users\bubun\CascadeProjects\Memory-Agent\DATABASE-ARCHITECTURE.md

# 2. Set up foreign data wrapper (if cross-database queries needed)
# Or use application-level joins in TypeScript

# 3. Enable in environment
echo "MEMORY_AGENT_ENABLED=true" >> .env
```

## Migration Strategy

For existing projects or future schema changes:

```bash
# Create migrations directory
mkdir -p database/migrations

# Example migration file: database/migrations/001_initial_schema.sql
# Contains: mission-control-schema.sql content

# Example migration runner:
# database/migrate.ts
```

## Backup and Restore

### Backup

```bash
# Full database backup
pg_dump -U mission_control_user mission_control > backup_$(date +%Y%m%d_%H%M%S).sql

# Schema only
pg_dump -U mission_control_user -s mission_control > schema_backup.sql

# Data only
pg_dump -U mission_control_user -a mission_control > data_backup.sql
```

### Restore

```bash
# Restore full backup
psql -U mission_control_user mission_control < backup_20250101_120000.sql

# Restore to new database
createdb -U postgres mission_control_restored
psql -U mission_control_user mission_control_restored < backup_20250101_120000.sql
```

## Performance Tuning

### Recommended PostgreSQL Settings

Add to `postgresql.conf` for development:

```ini
# Connection Settings
max_connections = 100
shared_buffers = 256MB
work_mem = 4MB

# Query Planning
effective_cache_size = 1GB
random_page_cost = 1.1  # For SSD

# Autovacuum (keep tables healthy)
autovacuum = on
autovacuum_analyze_scale_factor = 0.05
```

### Monitoring Queries

```sql
-- Check table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Check slow queries (requires pg_stat_statements extension)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
SELECT
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## Troubleshooting

### Connection Issues

```bash
# Test if PostgreSQL is running
pg_isready -h localhost -p 5432

# Check PostgreSQL logs
# Windows: C:\Program Files\PostgreSQL\14\data\log\
# macOS: /usr/local/var/log/postgres.log
# Ubuntu: /var/log/postgresql/postgresql-14-main.log

# Check authentication settings
cat /path/to/pg_hba.conf
```

### Permission Issues

```sql
-- Grant all permissions to user
GRANT ALL PRIVILEGES ON DATABASE mission_control TO mission_control_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO mission_control_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO mission_control_user;
```

### Reset Database

```bash
# Complete database reset (CAUTION: Deletes all data!)
psql -U postgres -c "DROP DATABASE IF EXISTS mission_control;"
psql -U postgres -c "CREATE DATABASE mission_control;"
psql -U postgres -d mission_control -f mission-control-schema.sql
```

## Security Best Practices

### For Production

1. **Strong Passwords**
   ```bash
   # Generate strong password
   openssl rand -base64 32
   ```

2. **SSL/TLS Connection**
   ```bash
   DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
   ```

3. **Network Isolation**
   - Use VPC/private networks
   - Firewall rules to restrict access
   - No public internet exposure

4. **Regular Backups**
   - Automated daily backups
   - Test restore procedures
   - Off-site backup storage

5. **Audit Logging**
   ```sql
   -- Enable audit logging
   ALTER DATABASE mission_control SET log_statement = 'all';
   ```

## Next Steps

After database setup:

1. **Wire Database to Services**
   - Create `DatabaseService` in VS Code extension
   - Inject into `AIOrchestratorService`
   - Integrate with `ChatService` for conversation persistence

2. **Test End-to-End**
   - Create a test project
   - Execute a simple task with an agent
   - Verify all database tables are populated correctly

3. **Implement Memory-Agent Integration**
   - Connect to Memory-Agent database
   - Sync project context snapshots
   - Leverage code pattern analysis

## Support

For issues or questions:
- Check PostgreSQL documentation: https://www.postgresql.org/docs/14/
- Supabase docs: https://supabase.com/docs
- Memory-Agent integration: See `C:\Users\bubun\CascadeProjects\Memory-Agent\MEMORY_AGENT_QUICK_REFERENCE.md`
