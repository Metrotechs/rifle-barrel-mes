# Database Setup for Rifle Barrel MES

## PostgreSQL Setup Instructions

### Option 1: Using Docker (Recommended)

1. **Install Docker Desktop** if not already installed
2. **Run PostgreSQL container:**
   ```bash
   docker run --name rifle-barrel-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=rifle_barrel_mes -p 5432:5432 -d postgres:15
   ```

### Option 2: Local PostgreSQL Installation

1. **Download and install PostgreSQL 15** from https://www.postgresql.org/download/windows/
2. **During installation:**
   - Set postgres user password to: `password`
   - Port: `5432` (default)
   - Remember the installation path

3. **Create database:**
   ```sql
   -- Connect to PostgreSQL as postgres user
   CREATE DATABASE rifle_barrel_mes;
   ```

### Option 3: Update Environment Variables

If you have PostgreSQL running with different credentials, update `backend/.env`:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=your_postgres_username
DATABASE_PASSWORD=your_postgres_password
DATABASE_NAME=rifle_barrel_mes
```

## Verify Database Connection

After setting up PostgreSQL, restart the backend:

```bash
cd backend
npm run start:dev
```

You should see:
```
[Nest] LOG [NestFactory] Starting Nest application...
[Nest] LOG [TypeOrmModule] TypeOrmModule dependencies initialized
```

Without database connection errors.

## Database Schema

The backend will automatically create tables using TypeORM migrations:
- `barrels` - Tracks each rifle barrel through production
- `stations` - Manufacturing stations configuration
- `operation_logs` - Audit trail of all operations
- `inventory_snapshots` - Point-in-time inventory states

## Testing the System

1. **Access frontend:** http://localhost:5173
2. **API health check:** http://localhost:3001 (should return "Hello World!")
3. **Socket.IO connection:** Real-time updates between frontend and backend
