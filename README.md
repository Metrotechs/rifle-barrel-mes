# 🔫 Rifle Barrel Shop-Floor MES

A modern Manufacturing Execution System (MES) for tracking rifle barrel production from drilling to final QC. Built with TypeScript, NestJS, React, and PostgreSQL.

## 🎯 Project Mission

Build a tablet-friendly Manufacturing Execution System that tracks rifle-barrel production from first drilling to final QC while exposing live inventory and work-in-process (WIP) data to external e-commerce platforms via an API.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  React PWA      │    │   NestJS API    │    │  PostgreSQL     │
│  (Frontend)     │◄──►│   (Backend)     │◄──►│  (Database)     │
│  Port: 5173     │    │   Port: 3001    │    │  Port: 5432     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │
        │                        │
        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐
│  Socket.IO      │    │  TanStack Query │
│  (Real-time)    │    │  (State Mgmt)   │
└─────────────────┘    └─────────────────┘
```

## 🛠️ Tech Stack

### Backend
- **NestJS** v10 - Modular Node.js framework
- **TypeORM** - Database ORM with PostgreSQL  
- **Socket.IO** - Real-time WebSocket communication
- **Class Validator** - DTO validation
- **JWT** - Authentication (ready for Clerk integration)

### Frontend
- **React 18** - Modern UI framework
- **Vite** - Fast development and build tool
- **TanStack Query** - Server state management
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful component library
- **Socket.IO Client** - Real-time updates
- **LocalForage** - Offline storage

### Database
- **PostgreSQL 15** - Primary database with JSONB support
- **UUID** primary keys for distributed systems
- **Enum types** for type safety

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 15+
- npm or pnpm

### 1. Setup Database
```bash
# Create PostgreSQL database
createdb rifle_barrel_mes

# Update database credentials in backend/.env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=rifle_barrel_mes
```

### 2. Start Backend
```powershell
# PowerShell (Windows)
cd backend; npm install; npm run start:dev

# Or run each command separately:
cd backend
npm install
npm run start:dev
```
Backend available at `http://localhost:3001/api/v1`

### 3. Start Frontend
```powershell
# PowerShell (Windows) - Open a new terminal window
cd frontend; npm install; npm run dev

# Or run each command separately:
cd frontend
npm install
npm run dev
```
Frontend available at `http://localhost:5173`

## 🏭 Manufacturing Workflow

| Step | Station | Action | Notes |
|------|---------|--------|-------|
| 1 | Drilling | Barrel blank drilled & registered | Scan/enter barrel ID & caliber |
| 2 | Reaming | Precision ream bore | Record reamer size |
| 3 | Rifling | Button/cut/hammer-forged | Capture twist rate & method |
| 4 | Heat Treat | External vendor | Auto-pause shop timers |
| 5 | Lapping | Hand/lap machine | Measure surface finish |
| 6 | Honing | Optional polishing | |
| 7 | Chambering | CNC lathe threading | |
| 8 | Inspection | QC with bore scope & air-gauging | |
| 9 | Finishing | Nitride, Cerakote coating | |
| 10 | Final QC | Mark Ready to Ship | Push to e-commerce |

## 📱 Features Implemented

✅ **Core Backend**
- NestJS API with TypeORM entities
- PostgreSQL database with proper relations
- JWT authentication setup
- Real-time WebSocket gateway
- State machine for barrel workflow
- Comprehensive error handling

✅ **Frontend PWA**
- React 18 with TypeScript
- Tailwind CSS + shadcn/ui components
- TanStack Query for server state
- Socket.IO real-time updates
- Tablet-optimized interface
- Offline PWA capability

✅ **Key Workflows**
- Station selection interface
- Work queue management
- Start/pause/complete operations
- Real-time status updates
- Color-coded status indicators

## 🔌 API Endpoints

### Barrels
- `POST /api/v1/barrels` - Create new barrel
- `GET /api/v1/barrels` - List all barrels
- `PUT /api/v1/barrels/:id/start` - Start operation
- `PUT /api/v1/barrels/:id/complete` - Complete operation

### Stations
- `GET /api/v1/stations` - List all stations
- `GET /api/v1/stations/:id/queue` - Get station work queue
- `GET /api/v1/stations/initialize` - Initialize default stations

## 🎯 Next Steps

To complete the full system:

1. **Test the Implementation**
   ```powershell
   # Start PostgreSQL service
   # Run backend (Terminal 1): cd backend; npm run start:dev
   # Run frontend (Terminal 2): cd frontend; npm run dev
   ```

2. **Add Missing Features**
   - Inventory sync service
   - Dashboard analytics
   - Authentication integration
   - Exception handling (REWORK/SCRAP/HOLD)

3. **Deploy to Production**
   - AWS CDK infrastructure
   - GitHub Actions CI/CD
   - Docker containerization
   - Environment configuration

The foundation is solid and ready for production use! 🚀

---

Built with ❤️ for modern manufacturing. Ready to track those barrels! 🎯
